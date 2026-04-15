import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

interface ExerciseResult {
  exerciseNumber: string
  questionType: string
  instruction: string
  correct: boolean
}

export async function POST(req: NextRequest) {
  try {
    const { results }: { results: ExerciseResult[] } = await req.json()

    if (!results || results.length === 0) {
      return NextResponse.json({ error: 'Geen resultaten opgegeven' }, { status: 400 })
    }

    const total = results.length
    const correct = results.filter((r) => r.correct).length
    const wrong = results.filter((r) => !r.correct)
    const scorePercent = Math.round((correct / total) * 100)

    // Build a concise prompt for Groq
    const wrongSummary = wrong.length > 0
      ? wrong.map((r) => `- Oefening ${r.exerciseNumber} (${r.questionType}): "${r.instruction}"`).join('\n')
      : 'Geen'

    const prompt = `Je bent een vriendelijke en motiverende Nederlandse basisschool leraar die terugkoppeling geeft aan een leerling na een oefeningensessie.

De leerling heeft zojuist ${total} oefeningen gemaakt over het splitsen en samenvoegen van getallen (honderdtallen, tientallen, eenheden).

Resultaat:
- Score: ${correct} van de ${total} goed (${scorePercent}%)
- Fout beantwoord:
${wrongSummary}

Schrijf een korte, persoonlijke terugkoppeling in eenvoudig Nederlands voor een leerling van groep 4-5. De terugkoppeling moet:
1. Beginnen met een concrete beoordeling van de score (positief als ≥ 70%, aanmoedigend als < 70%)
2. Één of twee concrete verbeterpunten noemen als er fouten waren (gebaseerd op het type fout)
3. Eindigen met een korte motiverende zin die de leerling aanmoedigt

Maximaal 4 korte zinnen. Spreek de leerling direct aan met "jij/je". Geen opsommingstekens.`

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    })

    const feedback = response.choices[0]?.message?.content?.trim() ?? 'Goed gedaan!'

    return NextResponse.json({
      feedback,
      score: { correct, total, percent: scorePercent },
    })
  } catch (err) {
    console.error('Lesson feedback error:', err)
    return NextResponse.json({ error: 'Feedback genereren mislukt' }, { status: 500 })
  }
}
