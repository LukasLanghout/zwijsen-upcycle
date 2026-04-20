import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Re-runs the transformation for a single exercise using its original_content
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: exercise, error } = await supabaseAdmin
      .from('exercises')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !exercise) {
      return NextResponse.json({ error: 'Oefening niet gevonden' }, { status: 404 })
    }

    const original = exercise.original_content
    const prompt = `Regenereer deze Nederlandse taaloefening in interactief formaat.

Originele oefening:
- exercise_number: "${original.exercise_number}"
- question_type: "${original.question_type}"
- instruction: "${original.instruction}"
- raw_text: "${original.raw_text ?? ''}"

Return ONLY valid JSON met deze structuur:
{
  "question_type": "${original.question_type}",
  "instruction": "${original.instruction}",
  "difficulty_level": 2,
  "flashcard": null,
  "multiple_choice": null,
  "cloze": null
}

Voor "flashcard": flashcard = { word: "...", word_type: "zelfstandig_naamwoord|werkwoord|bijvoeglijk_naamwoord|uitdrukking|overig", definition: "...", example_sentence: "..." }
Voor "multiple_choice": multiple_choice = { word: "...", word_type: "...", definition: "...", example_sentence: "...", options: ["juist","fout1","fout2","fout3"], correct_index: 0 }
Voor "cloze": cloze = { sentence_with_blank: "Zin met ___ erin.", answer: "woord", word_type: "...", definition: "...", options: ["woord","fout1","fout2","fout3"] }

Vul alleen het veld in dat past bij question_type.`

    const { default: Groq } = await import('groq-sdk')
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 2048,
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('Geen response van Groq')

    const transformed = JSON.parse(content)

    await supabaseAdmin
      .from('exercises')
      .update({ transformed_content: transformed })
      .eq('id', params.id)

    return NextResponse.json({ transformed_content: transformed })
  } catch (err) {
    console.error('Regenerate error:', err)
    return NextResponse.json({ error: 'Regenereren mislukt' }, { status: 500 })
  }
}
