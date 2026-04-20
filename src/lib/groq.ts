import Groq from 'groq-sdk'
import type { ExtractedExercise, TransformedExercise, DifficultyLevel } from './types'

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const EXTRACT_AND_TRANSFORM_PROMPT = `Je bent een expert in het analyseren van Nederlandstalige taalwerkboeken van de serie "Taal Jacht" (Zwijsen uitgeverij).

JOUW TAAK: Extraheer woordenschatoefeningen uit WOORDENLIJST-pagina's.

━━━ EEN WOORDENLIJST-PAGINA HERKENNEN ━━━
- Bovenaan staat "Les 1-2-3 | Woordenlijst"
- Genummerde woordkaartjes (1, 2, 3...) met gekleurde headers
- Elke kaart heeft: woord + definitie (in gekleurde balk) + voorbeeldzin
- Secties: ZELFSTANDIGE NAAMWOORDEN / WERKWOORDEN / BIJVOEGLIJKE NAAMWOORDEN / UITDRUKKINGEN
- Onderaan soms woordveld-schema's met semantische clusters

━━━ VOOR ELKE WOORDKAART: MAAK 3 OEFENINGEN ━━━

OEFENING A — flashcard (question_type: "flashcard")
Toont het woord, student herinnert de definitie.
- exercise_number: "1a", "2a", etc.

OEFENING B — multiple_choice (question_type: "multiple_choice")
Student kiest de juiste definitie uit 4 opties.
- Verzin 3 plausibele maar foute definities (passen bij hetzelfde thema/woordsoort)
- correct_index: de positie (0-3) van de juiste definitie in de options array
- Shuffle de volgorde zodat correct_index niet altijd 0 is
- exercise_number: "1b", "2b", etc.

OEFENING C — cloze (question_type: "cloze")
Student vult het ontbrekende woord in de voorbeeldzin.
- Vervang het woord in de zin door ___ (gebruik exact drie underscores)
- Als het woord meerdere keren voorkomt, vervang alleen de eerste keer
- Geef 4 opties (options): het juiste woord + 3 andere woorden uit dezelfde woordenlijst
- exercise_number: "1c", "2c", etc.

━━━ WOORDSOORT-CODES ━━━
- "zelfstandig_naamwoord" → ZELFSTANDIGE NAAMWOORDEN sectie (de/het woord)
- "werkwoord" → WERKWOORDEN sectie
- "bijvoeglijk_naamwoord" → BIJVOEGLIJKE NAAMWOORDEN sectie
- "uitdrukking" → UITDRUKKINGEN sectie
- "overig" → overige woorden

━━━ MOEILIJKHEIDSGRAAD ━━━
Bepaal difficulty_level op basis van de groep/blok als die bekend is:
- Groep 3-4: difficulty_level 1
- Groep 5-6: difficulty_level 2
- Groep 7-8: difficulty_level 3

━━━ GEEN WOORDENLIJST-PAGINA? ━━━
Als de pagina GEEN woordenlijst is (bijv. Roadmap, Rubric, les-oefeningen, omslagpagina):
- Geef een lege exercises array terug
- Stel block en lesson in op wat je kunt zien

━━━ RETURN ALLEEN GELDIGE JSON ━━━
{
  "block": "6",
  "lesson": "1-2-3",
  "learning_goal": "Leerlingen kennen de betekenis van de woordenschatwoorden uit blok 6.",
  "exercises": [
    {
      "exercise_number": "1a",
      "parent_exercise_number": "1",
      "sub_exercise_letter": "a",
      "question_type": "flashcard",
      "instruction": "Wat betekent dit woord?",
      "raw_text": "de compositie: een opbouw van verschillende delen tot één geheel. Dit schilderij heeft een goede compositie.",
      "transformed_content": {
        "question_type": "flashcard",
        "instruction": "Wat betekent dit woord?",
        "difficulty_level": 2,
        "flashcard": {
          "word": "de compositie",
          "word_type": "zelfstandig_naamwoord",
          "definition": "een opbouw van verschillende delen tot één geheel",
          "example_sentence": "Dit schilderij heeft een goede compositie."
        },
        "multiple_choice": null,
        "cloze": null
      }
    },
    {
      "exercise_number": "1b",
      "parent_exercise_number": "1",
      "sub_exercise_letter": "b",
      "question_type": "multiple_choice",
      "instruction": "Welke definitie past bij dit woord?",
      "raw_text": "de compositie",
      "transformed_content": {
        "question_type": "multiple_choice",
        "instruction": "Welke definitie past bij 'de compositie'?",
        "difficulty_level": 2,
        "flashcard": null,
        "multiple_choice": {
          "word": "de compositie",
          "word_type": "zelfstandig_naamwoord",
          "definition": "een opbouw van verschillende delen tot één geheel",
          "example_sentence": "Dit schilderij heeft een goede compositie.",
          "options": [
            "een manier om iets mooi te versieren",
            "een opbouw van verschillende delen tot één geheel",
            "een soort muziekinstrument",
            "de kleur van een kunstwerk"
          ],
          "correct_index": 1
        },
        "cloze": null
      }
    },
    {
      "exercise_number": "1c",
      "parent_exercise_number": "1",
      "sub_exercise_letter": "c",
      "question_type": "cloze",
      "instruction": "Vul het ontbrekende woord in.",
      "raw_text": "Dit schilderij heeft een goede compositie.",
      "transformed_content": {
        "question_type": "cloze",
        "instruction": "Vul het ontbrekende woord in.",
        "difficulty_level": 2,
        "flashcard": null,
        "multiple_choice": null,
        "cloze": {
          "sentence_with_blank": "Dit schilderij heeft een goede ___.",
          "answer": "compositie",
          "word_type": "zelfstandig_naamwoord",
          "definition": "een opbouw van verschillende delen tot één geheel",
          "options": ["compositie", "melodie", "tekening", "schildering"]
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
    ? `\n\nCONTEXT: Deze pagina komt uit een ${context?.subject ?? 'Taal'} werkboek voor ${context?.grade ?? 'Nederlandse basisschool'}. Gebruik dit bij twijfel.\n`
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
  if (!content) throw new Error('Geen respons van Groq')
  return JSON.parse(content)
}

export async function generateVariant(
  exercise: TransformedExercise,
  targetDifficulty: DifficultyLevel
): Promise<TransformedExercise> {
  const difficultyHint =
    targetDifficulty === 1
      ? 'gebruik simpelere, kortere woorden en eenvoudige zinnen (Groep 3-4 niveau)'
      : targetDifficulty === 2
        ? 'gebruik woorden van gemiddeld niveau (Groep 5-6 niveau)'
        : 'gebruik uitdagende, complexere woorden (Groep 7-8 niveau)'

  const prompt = `Genereer een nieuwe variant van deze Nederlandse taaloefening op een ander moeilijkheidsniveau.

Originele oefening: ${JSON.stringify(exercise, null, 2)}

Regels:
- Behoud EXACT hetzelfde question_type en dezelfde structuur
- Verander het woord naar een ander woord van hetzelfde woordsoort en thema
- ${difficultyHint}
- Stel difficulty_level in op ${targetDifficulty}
- Zorg dat de definitie, voorbeeldzin en opties kloppen bij het nieuwe woord
- Voor multiple_choice: genereer nieuwe plausibele maar foute opties
- Voor cloze: pas de zin aan voor het nieuwe woord

Return ONLY valid JSON met dezelfde structuur als het origineel.`

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 2048,
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('Geen respons van Groq')

  return JSON.parse(content)
}

// Backwards-compatibility export
export async function extractExercisesFromImage(base64Image: string) {
  return extractAndTransformPage(base64Image)
}
