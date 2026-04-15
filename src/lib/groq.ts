import Groq from 'groq-sdk'
import type { ExtractedExercise, TransformedExercise, DifficultyLevel } from './types'

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Single prompt that does BOTH extraction AND transformation in one API call per page
const EXTRACT_AND_TRANSFORM_PROMPT = `You are an expert at analyzing Dutch elementary school math workbook pages.

Analyze this page image and return ALL exercises fully extracted AND transformed for interactive use in ONE response.

CRITICAL SUB-EXERCISE DETECTION RULES:
=====================================

1. ONE DATABASE ENTRY PER SUB-QUESTION, NOT PER NUMBERED EXERCISE
   - A numbered exercise (like "1" or "2") may contain MULTIPLE sub-questions
   - Each sub-question becomes a separate database entry with letters: 1a, 1b, 1c, etc.
   - This is true even if sub-questions appear on different pages (they get grouped later)

2. VISUAL INDICATORS OF MULTIPLE SUB-QUESTIONS:
   - Multiple empty boxes/grids below one instruction (each box = one sub-question)
   - Multiple number values listed (e.g. "763, 954, 502" = three sub-questions)
   - Repeating instruction text with different numbers
   - Instructions with different sub-parts or bullet points

3. DETAILED EXAMPLES:

   Example A: Single instruction + 2 grids = 2 sub-exercises
   "1 Splits. Schrijf de som op."
   [Grid: 763] [Grid: 954]
   OUTPUT: "1a" (763) and "1b" (954) - SEPARATE ENTRIES

   Example B: Single instruction + 4 given numbers = 4 sub-exercises
   "2 Voeg samen."
   100 + 200 + 3 = ___
   200 + 30 + 4 = ___
   300 + 40 + 5 = ___
   400 + 50 + 6 = ___
   OUTPUT: "2a", "2b", "2c", "2d" - SEPARATE ENTRIES

   Example C: Complex instruction with multiple parts = 6 sub-exercises
   "3 Splits. Schrijf de som op." [2 grids]
      "Voeg samen. Schrijf de som op." [4 given-number fields]
   OUTPUT: "3a", "3b" (splits), then "3c", "3d", "3e", "3f" (voeg samen)

   Example D: Exercise with only 1 item still gets a letter
   "4 Maak de som."
   [1 grid: 500]
   OUTPUT: "4a" (NOT just "4") - ALWAYS include the letter

4. DETECTING INSTRUCTION GROUPS:
   - Instructions like "Splits" vs "Voeg samen" may apply to multiple numbers
   - Read the instruction once, then count how many input/output pairs follow
   - Each number/grid = one sub-exercise under that instruction

5. HANDLING REPEATED ELEMENTS:
   - If you see "Splits" with multiple grids: count the grids (not the word)
   - Each empty box/blank = one sub-exercise, even if layout suggests otherwise

MANDATORY OUTPUTS:
==================
For each sub-exercise you identify, output ONE JSON entry with:
- exercise_number: "1a", "2b", "3c", etc. (ALWAYS include letter)
- parent_exercise_number: "1", "2", "3", etc. (base number without letter)
- sub_exercise_letter: "a", "b", "c", etc.
- question_type: "fill_in" | "structured_hte" | "creative" | "pattern_puzzle"
- instruction: the instruction text for this sub-exercise
- given_numbers: [number] for THIS sub-exercise ONLY (single-element array)
- raw_text: all visible text in the sub-exercise

For transformed_content:
- fill_in: { number, answer: [H*100, T*10, E], labels: ["H","T","E"] }
- structured_hte: { mode: "split"|"combine", numbers: [{H,T,E}] } - always 1 element
- creative: { digits: [...], num_combinations: N, valid_combinations: [{H,T,E},...] }
- pattern_puzzle: { shapes: [{name,value},...], groups: [{counts:{shape:N},total,is_known},...] }

Set difficulty_level: 1 = 100-499, 2 = 500-799, 3 = 800-999.

PAGE METADATA:
==============
Also extract: block, lesson, learning_goal (Lesdoel text)

RETURN FORMAT:
==============
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
