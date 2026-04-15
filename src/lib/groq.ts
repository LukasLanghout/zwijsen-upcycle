import Groq from 'groq-sdk'
import type { ExtractedExercise, TransformedExercise, DifficultyLevel } from './types'

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Single prompt that does BOTH extraction AND transformation in one API call per page
const EXTRACT_AND_TRANSFORM_PROMPT = `You are an expert at analyzing Dutch elementary school math workbook pages.

Analyze this page image and return ALL exercises fully extracted AND transformed for interactive use in ONE response.

CRITICAL SUB-EXERCISE RULE:
Many exercises on Zwijsen pages contain multiple sub-questions under one numbered heading.
Example: Exercise "1" says "Splits. Schrijf de som op." and has 2 H-T-E boxes below it (763 and 954).
That is TWO sub-exercises: "1a" (763) and "1b" (954).
Example: Exercise "3" says "Splits. Schrijf de som op." with 2 H-T-E boxes, then "Voeg samen. Schrijf de som op." with 4 given-number boxes. That is 6 sub-exercises: "3a", "3b", "3c", "3d", "3e", "3f".

You MUST output ONE entry per sub-exercise:
- exercise_number: the combined label, e.g. "1a", "1b", "3c"
- parent_exercise_number: the base number, e.g. "1", "3", "#6"
- sub_exercise_letter: the letter, e.g. "a", "b", "c"

If the exercise has only ONE question under its heading, still emit it with sub_exercise_letter "a" and exercise_number "1a".

For each sub-exercise identify:
- question_type: "fill_in" | "structured_hte" | "creative" | "pattern_puzzle"
  - fill_in: equation like "763 = ___ + ___ + ___"
  - structured_hte: H (hundreds) T (tens) E (ones) grid boxes, one number per grid
  - creative: make combinations from given digits
  - pattern_puzzle: figure out shape values
- instruction: the Dutch instruction text for this sub-exercise
- given_numbers: numbers shown (fill_in / structured_hte) for THIS sub-exercise only
- available_digits: digits shown (creative)
- raw_text: all text in the sub-exercise

Also extract page metadata: block, lesson, learning_goal (Lesdoel text).

For transformed_content, populate ONLY the field matching the question_type:
- fill_in: { number, answer: [H*100, T*10, E], labels: ["H","T","E"] }
- structured_hte: { mode: "split"|"combine", numbers: [{H,T,E},...] }
  IMPORTANT: for sub-exercises, numbers has exactly ONE element. Multiple grids = multiple sub-exercises.
- creative: { digits: [...], num_combinations: N, valid_combinations: [{H,T,E},...] }
- pattern_puzzle: { shapes: [{name,value},...], groups: [{counts:{shape:N},total,is_known},...] }

Set difficulty_level: 1 = numbers 100-499, 2 = 500-799, 3 = 800-999.

Return ONLY valid JSON:
{
  "block": "1",
  "lesson": "1",
  "learning_goal": "...",
  "exercises": [
    {
      "exercise_number": "1a",
      "parent_exercise_number": "1",
      "sub_exercise_letter": "a",
      "question_type": "structured_hte",
      "instruction": "Splits. Schrijf de som op.",
      "given_numbers": [763],
      "raw_text": "...",
      "transformed_content": {
        "question_type": "structured_hte",
        "instruction": "Splits. Schrijf de som op.",
        "difficulty_level": 2,
        "fill_in": null,
        "structured_hte": { "mode": "split", "numbers": [{"H":7,"T":6,"E":3}] },
        "creative": null,
        "pattern_puzzle": null
      }
    },
    {
      "exercise_number": "1b",
      "parent_exercise_number": "1",
      "sub_exercise_letter": "b",
      "question_type": "structured_hte",
      "instruction": "Splits. Schrijf de som op.",
      "given_numbers": [954],
      "raw_text": "...",
      "transformed_content": {
        "question_type": "structured_hte",
        "instruction": "Splits. Schrijf de som op.",
        "difficulty_level": 3,
        "fill_in": null,
        "structured_hte": { "mode": "split", "numbers": [{"H":9,"T":5,"E":4}] },
        "creative": null,
        "pattern_puzzle": null
      }
    }
  ]
}`

export async function extractAndTransformPage(
  base64Image: string,
  context?: { subject?: string | null; grade?: string | null }
): Promise<{
  block: string
  lesson: string
  learning_goal: string
  exercises: Array<
    ExtractedExercise & {
      parent_exercise_number?: string
      sub_exercise_letter?: string
      transformed_content: TransformedExercise
    }
  >
}> {
  const contextPreamble = context?.subject || context?.grade
    ? `\n\nCONTEXT: This page is from a ${context?.subject ?? 'Rekenen'} workbook for ${context?.grade ?? 'Dutch primary school'}. Use this to inform interpretation when ambiguous.\n`
    : ''
  const response = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/png;base64,${base64Image}` } },
          { type: 'text', text: EXTRACT_AND_TRANSFORM_PROMPT + contextPreamble },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 8192,
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('No response from Groq')
  return JSON.parse(content)
}

// Keep these for backwards compatibility
export async function extractExercisesFromImage(base64Image: string) {
  return extractAndTransformPage(base64Image)
}

export async function transformExercise(extracted: ExtractedExercise): Promise<TransformedExercise> {
  return (extracted as any).transformed_content
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
