import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateVariant } from '@/lib/groq'
import type { DifficultyLevel } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { exerciseId, difficulty } = await req.json()

    if (!exerciseId) {
      return NextResponse.json({ error: 'exerciseId is verplicht' }, { status: 400 })
    }

    const targetDifficulty = (difficulty || 1) as DifficultyLevel

    // Fetch the exercise
    const { data: exercise, error: fetchError } = await supabaseAdmin
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .single()

    if (fetchError || !exercise) {
      return NextResponse.json({ error: 'Oefening niet gevonden' }, { status: 404 })
    }

    if (!exercise.transformed_content) {
      return NextResponse.json(
        { error: 'Oefening heeft geen getransformeerde inhoud' },
        { status: 400 }
      )
    }

    // Generate the variant using Groq
    const variantContent = await generateVariant(
      exercise.transformed_content,
      targetDifficulty
    )

    // Store the variant
    const { data: variant, error: insertError } = await supabaseAdmin
      .from('exercise_variants')
      .insert({
        exercise_id: exerciseId,
        difficulty_level: targetDifficulty,
        variant_content: variantContent,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      // Still return the variant even if we couldn't cache it
      return NextResponse.json({ variant: { variant_content: variantContent } })
    }

    return NextResponse.json({ variant })
  } catch (err) {
    console.error('Generate variant error:', err)
    return NextResponse.json({ error: 'Genereren van variant mislukt' }, { status: 500 })
  }
}
