import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { extractExercisesFromImage, transformExercise } from '@/lib/groq'

// Accepts base64 page images rendered client-side via pdf.js in the browser.
// Body: { uploadId: string, pageImages: Array<{ pageNum: number, base64: string }> }
export async function POST(req: NextRequest) {
  try {
    const { uploadId, pageImages } = await req.json()

    if (!uploadId || !pageImages || !Array.isArray(pageImages)) {
      return NextResponse.json(
        { error: 'uploadId en pageImages zijn verplicht' },
        { status: 400 }
      )
    }

    // Update page count
    await supabaseAdmin
      .from('pdf_uploads')
      .update({ page_count: pageImages.length })
      .eq('id', uploadId)

    const exercisesToInsert: any[] = []

    for (const { pageNum, base64 } of pageImages) {
      try {
        const extracted = await extractExercisesFromImage(base64)

        for (const exercise of extracted.exercises) {
          try {
            const transformed = await transformExercise(exercise)
            exercisesToInsert.push({
              pdf_upload_id: uploadId,
              page_number: pageNum,
              exercise_number: exercise.exercise_number,
              block: extracted.block,
              lesson: extracted.lesson,
              question_type: exercise.question_type,
              difficulty_level: transformed.difficulty_level,
              topic: 'Getallen splitsen en samenvoegen',
              learning_goal: extracted.learning_goal,
              original_content: exercise,
              transformed_content: transformed,
              status: 'pending',
            })
          } catch (transformErr) {
            console.error(`Transform error for exercise ${exercise.exercise_number}:`, transformErr)
            exercisesToInsert.push({
              pdf_upload_id: uploadId,
              page_number: pageNum,
              exercise_number: exercise.exercise_number,
              block: extracted.block,
              lesson: extracted.lesson,
              question_type: exercise.question_type,
              difficulty_level: 1,
              topic: 'Getallen splitsen en samenvoegen',
              learning_goal: extracted.learning_goal,
              original_content: exercise,
              transformed_content: null,
              status: 'pending',
            })
          }
        }
      } catch (pageErr) {
        console.error(`Error processing page ${pageNum}:`, pageErr)
      }
    }

    if (exercisesToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('exercises')
        .insert(exercisesToInsert)

      if (insertError) {
        console.error('Insert error:', insertError)
        await supabaseAdmin
          .from('pdf_uploads')
          .update({ status: 'failed' })
          .eq('id', uploadId)
        return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 })
      }
    }

    await supabaseAdmin
      .from('pdf_uploads')
      .update({ status: 'completed' })
      .eq('id', uploadId)

    return NextResponse.json({
      success: true,
      exercisesExtracted: exercisesToInsert.length,
    })
  } catch (err) {
    console.error('Extraction error:', err)
    return NextResponse.json({ error: 'Extractie mislukt' }, { status: 500 })
  }
}
