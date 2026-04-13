import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { extractAndTransformPage } from '@/lib/groq'

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

    await supabaseAdmin
      .from('pdf_uploads')
      .update({ page_count: pageImages.length })
      .eq('id', uploadId)

    // Process ALL pages in parallel - 1 Groq call per page (extract + transform combined)
    const pageResults = await Promise.allSettled(
      pageImages.map(({ pageNum, base64 }: { pageNum: number; base64: string }) =>
        extractAndTransformPage(base64).then((result) => ({ pageNum, result }))
      )
    )

    const exercisesToInsert: any[] = []

    for (const settled of pageResults) {
      if (settled.status === 'rejected') {
        console.error('Page processing failed:', settled.reason)
        continue
      }
      const { pageNum, result } = settled.value
      for (const exercise of result.exercises) {
        exercisesToInsert.push({
          pdf_upload_id: uploadId,
          page_number: pageNum,
          exercise_number: exercise.exercise_number,
          block: result.block,
          lesson: result.lesson,
          question_type: exercise.question_type,
          difficulty_level: exercise.transformed_content?.difficulty_level ?? 1,
          topic: 'Getallen splitsen en samenvoegen',
          learning_goal: result.learning_goal,
          original_content: exercise,
          transformed_content: exercise.transformed_content ?? null,
          status: 'pending',
        })
      }
    }

    if (exercisesToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('exercises')
        .insert(exercisesToInsert)

      if (insertError) {
        console.error('Insert error:', insertError)
        await supabaseAdmin.from('pdf_uploads').update({ status: 'failed' }).eq('id', uploadId)
        return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 })
      }
    }

    await supabaseAdmin.from('pdf_uploads').update({ status: 'completed' }).eq('id', uploadId)

    return NextResponse.json({ success: true, exercisesExtracted: exercisesToInsert.length })
  } catch (err) {
    console.error('Extraction error:', err)
    return NextResponse.json({ error: 'Extractie mislukt' }, { status: 500 })
  }
}
