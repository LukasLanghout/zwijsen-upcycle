import Groq from 'groq-sdk'
import type {
  ExtractedExercise,
  TransformedExercise,
  QuestionType,
  DifficultyLevel,
  FillInExercise,
  StructuredHTEExercise,
  CreativeExercise,
  PatternPuzzleExercise,
  HTENumber,
} from './types'

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const EXTRACT_SYSTEM_PROMPT = `You are an expert at analyzing Dutch elementary school math workbook pages.
Your task is to extract all exercises from the page image and return structured JSON.

For each exercise found, identify:
- exercise_number: The exercise number (e.g. "1", "2", "#6")
- question_type: One of "fill_in", "structured_hte", "creative", "pattern_puzzle"
  - fill_in: Student must complete an equation like "763 = ___ + ___ + ___"
  - structured_hte: Exercises with H (hundreds), T (tens), E (ones) grid boxes for splitting or combining numbers
  - creative: Student must create their own number combinations from given digits
  - pattern_puzzle: Student must figure out the value of symbols/shapes
- instruction: The Dutch instruction text (e.g. "Splits. Schrijf de som op.")
- given_numbers: Array of numbers shown in the exercise (for fill_in/structured_hte)
- available_digits: Array of digits shown (for creative exercises)
- shapes: Array of shape names used (for pattern_puzzle)
- known_total: The total shown in the puzzle (for pattern_puzzle)
- raw_text: All visible text in the exercise

Also extract page-level metadata:
- block: Block number (e.g. "1")
- lesson: Lesson number (e.g. "1", "2")
- learning_goal: The "Lesdoel" text if visible

Return ONLY valid JSON in this exact format:
{
  "block": "1",
  "lesson": "1",
  "learning_goal": "Ik kan getallen tot en met 1000 splitsen en samenvoegen.",
  "exercises": [
    {
      "exercise_number": "1",
      "question_type": "structured_hte",
      "instruction": "Splits. Schrijf de som op.",
      "given_numbers": [763, 954],
      "raw_text": "..."
    }
  ]
}`

export async function extractExercisesFromImage(base64Image: string): Promise<{
  block: string
  lesson: string
  learning_goal: string
  exercises: ExtractedExercise[]
}> {
  const response = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${base64Image}`,
            },
          },
          {
            type: 'text',
            text: EXTRACT_SYSTEM_PROMPT,
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 4096,
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('No response from Groq')

  return JSON.parse(content)
}

export async function transformExercise(
  extracted: ExtractedExercise
): Promise<TransformedExercise> {
  const prompt = `Transform this Dutch elementary school math exercise into an interactive format.

Exercise data: ${JSON.stringify(extracted, null, 2)}

Based on the question_type, generate the appropriate transformed structure:

For "fill_in": Extract the number and its components (hundreds, tens, ones).
For "structured_hte": Create a list of H/T/E number objects with mode "split" or "combine".
For "creative": List the available digits and number of combinations required.
For "pattern_puzzle": List the shapes and their groups with totals.

Return ONLY valid JSON matching the TransformedExercise type:
{
  "question_type": "${extracted.question_type}",
  "instruction": "${extracted.instruction}",
  "difficulty_level": 1,
  "fill_in": { ... } | null,
  "structured_hte": { ... } | null,
  "creative": { ... } | null,
  "pattern_puzzle": { ... } | null
}

Set difficulty_level to 1 (numbers under 500), 2 (numbers 500-799), or 3 (numbers 800+).
Only populate the field matching the question_type, set others to null.`

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 2048,
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('No response from Groq')

  return JSON.parse(content)
}

export async function generateVariant(
  exercise: TransformedExercise,
  targetDifficulty: DifficultyLevel
): Promise<TransformedExercise> {
  const numberRange =
    targetDifficulty === 1
      ? 'between 100 and 499'
      : targetDifficulty === 2
        ? 'between 500 and 799'
        : 'between 800 and 999'

  const prompt = `Generate a new variant of this Dutch math exercise with different numbers.

Original exercise: ${JSON.stringify(exercise, null, 2)}

Rules:
- Keep the EXACT same question_type, instruction, and structure
- Replace all numbers with new random numbers ${numberRange}
- For structured_hte: generate new valid 3-digit numbers
- For fill_in: generate a new valid 3-digit number and its correct components
- For creative: keep the same number of digits but use different digit values
- For pattern_puzzle: change the shape values and recalculate totals
- Set difficulty_level to ${targetDifficulty}
- All numbers must be mathematically correct

Return ONLY valid JSON with the same structure as the original.`

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 2048,
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('No response from Groq')

  return JSON.parse(content)
}
