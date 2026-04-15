import Groq from 'groq-sdk'
import type { ExtractedExercise, TransformedExercise, DifficultyLevel } from './types'

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// IMPROVED prompt focusing on ACCURATE pattern puzzle extraction
const EXTRACT_AND_TRANSFORM_PROMPT = `You are an expert Dutch elementary school math workbook analyzer.

🎯 PRIMARY FOCUS: Accurately identify and extract PATTERN PUZZLES
- These show shapes (hearts, stars, triangles, squares, etc.)
- Students must count shapes and find their values
- This is a TOP PRIORITY - extract them correctly!

⚠️ CRITICAL: DIGIT COMPOSITION PUZZLES (NEW!)
==============================================

This is NOT a pattern puzzle - it's a PLACE VALUE composition exercise!

Example: 7 triangles + 1 heart + 2 squares + 3 circles = 7123
Means:
- 7 triangles = 7 × 1000 (thousands place)
- 1 heart = 1 × 100 (hundreds place)
- 2 squares = 2 × 10 (tens place)
- 3 circles = 3 × 1 (ones place)
- Result: 7123

RECOGNITION SIGNS:
- Shapes arranged to be COUNTED, not compared
- A visual grid/collection of shapes
- Final number that's clearly a place-value composition
- Example: 7 shapes + 1 shape + 2 shapes + 3 shapes = 7123

EXTRACT AS: structured_hte TYPE but with place values!
{
  "question_type": "structured_hte",
  "instruction": "Wat is het getal?",
  "structured_hte": {
    "mode": "combine",
    "numbers": [
      {
        "D": 7,    // Duizenden (thousands)
        "H": 1,    // Honderdtallen (hundreds)
        "T": 2,    // Tientallen (tens)
        "E": 3     // Eenheden (ones)
      }
    ]
  }
}

Or if truly pattern-like:
{
  "question_type": "pattern_puzzle",
  "pattern_puzzle": {
    "shapes": [
      {"name": "triangle", "value": 1000},
      {"name": "heart", "value": 100},
      {"name": "square", "value": 10},
      {"name": "circle", "value": 1}
    ],
    "groups": [
      {
        "counts": {"triangle": 7, "heart": 1, "square": 2, "circle": 3},
        "total": 7123,
        "is_known": true
      }
    ]
  }
}
======================================

When you see a pattern puzzle exercise:
1. COUNT every individual shape carefully
2. Use ONLY these shape names:
   ✓ heart, star, triangle, square, circle, diamond, pentagon, hexagon
   ✗ Never use: hart, ster, driehoek, vierkant, etc. (English only!)

3. For EACH visible group:
   - List the shapes: e.g., "3 hearts, 2 triangles"
   - Check if there's a number at the end (known total)
   - If no number, it's unknown (student must solve)

4. Create the JSON structure:
   {
     "shapes": [
       {"name": "heart", "value": 2},
       {"name": "triangle", "value": 3},
       {"name": "square", "value": 5}
     ],
     "groups": [
       {"counts": {"heart": 3, "triangle": 2}, "total": 16, "is_known": true},
       {"counts": {"heart": 2, "square": 3}, "total": 19, "is_known": true},
       {"counts": {"heart": 1, "square": 4}, "total": null, "is_known": false}
     ]
   }

⚠️ CRITICAL RULES:
- Count EVERY shape individually (not combinations)
- "counts" object must have exact shape counts
- Only use English shape names (heart, not hart)
- "is_known": true ONLY if a number appears
- If no number appears, use "is_known": false and "total": null

GENERAL EXERCISE DETECTION:
============================

Other exercise types:
- fill_in: "Vul in" exercises with one number to split
- structured_hte: H-T-E (Hundreds-Tens-Ones) exercises
- creative: Build numbers from given digits
- pattern_puzzle: Shape counting (see above)

For each exercise, provide:
- exercise_number: "1a", "2b", etc. (include letter!)
- question_type: "fill_in" | "structured_hte" | "creative" | "pattern_puzzle"
- instruction: exact instruction text
- transformed_content: properly structured data

RETURN ONLY VALID JSON with this structure:
{
  "block": "1",
  "lesson": "1",
  "learning_goal": "...",
  "exercises": [
    {
      "exercise_number": "7a",
      "parent_exercise_number": "7",
      "sub_exercise_letter": "a",
      "question_type": "pattern_puzzle",
      "instruction": "Wat zijn de figuren waard?",
      "raw_text": "...",
      "transformed_content": {
        "question_type": "pattern_puzzle",
        "instruction": "Wat zijn de figuren waard?",
        "difficulty_level": 2,
        "fill_in": null,
        "structured_hte": null,
        "creative": null,
        "pattern_puzzle": {
          "shapes": [
            {"name": "heart", "value": null},
            {"name": "triangle", "value": null},
            {"name": "square", "value": null}
          ],
          "groups": [
            {"counts": {"heart": 3, "triangle": 2}, "total": 16, "is_known": true},
            {"counts": {"heart": 2, "square": 3}, "total": 19, "is_known": true},
            {"counts": {"heart": 1, "square": 4}, "total": null, "is_known": false}
          ]
        }
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
- For pattern_puzzle:
  * Keep the same shape names and groups structure
  * Assign new random values to each shape (values must be 1-50 and different from each other)
  * Recalculate all group totals based on the new shape values
  * For groups marked as "is_known: true", keep them known with the recalculated total
  * For groups marked as "is_known: false", keep them as unknown (student must calculate)
  * Ensure all totals are solvable and mathematically correct
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
