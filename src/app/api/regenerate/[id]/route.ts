import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { extractAndTransformPage } from '@/lib/groq'
import { normalizePatternPuzzle } from '@/lib/normalize-puzzle'

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

    // Build a minimal prompt using the original extracted content
    const original = exercise.original_content
    const prompt = `Transform this single Dutch elementary school math exercise into an interactive format.

Exercise:
- exercise_number: "${original.exercise_number}"
- question_type: "${original.question_type}"
- instruction: "${original.instruction}"
- given_numbers: ${JSON.stringify(original.given_numbers ?? [])}
- available_digits: ${JSON.stringify(original.available_digits ?? [])}
- raw_text: "${original.raw_text ?? ''}"

Return ONLY valid JSON:
{
  "question_type": "${original.question_type}",
  "instruction": "${original.instruction}",
  "difficulty_level": 1,
  "fill_in": null,
  "structured_hte": null,
  "creative": null,
  "pattern_puzzle": null
}

For "fill_in": fill_in = { number: N, answer: [H*100, T*10, E], labels: ["H","T","E"] }
For "structured_hte": structured_hte = { mode: "split"|"combine", numbers: [{H,T,E},...] }
For "creative": creative = { digits: [...], num_combinations: N, valid_combinations: [{H,T,E},...] }
For "pattern_puzzle": pattern_puzzle = { shapes: [{name,value},...], groups: [{counts:{shape:N},total,is_known},...] }

Set difficulty_level based on number size: 1=100-499, 2=500-799, 3=800-999.
Only fill the field matching the question_type.`

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

    // Normalize pattern puzzle totals so count × value math stays consistent
    const normalized = normalizePatternPuzzle(transformed)

    // Save to database
    await supabaseAdmin
      .from('exercises')
      .update({ transformed_content: normalized })
      .eq('id', params.id)

    return NextResponse.json({ transformed_content: normalized })
  } catch (err) {
    console.error('Regenerate error:', err)
    return NextResponse.json({ error: 'Regenereren mislukt' }, { status: 500 })
  }
}
