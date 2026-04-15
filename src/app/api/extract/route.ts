import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { extractAndTransformPage } from '@/lib/groq'

// Group exercises by parent number and reassign sub-exercise letters sequentially
function normalizeSubExercises(exercises: any[]): any[] {
  // Group by parent_exercise_number
  const grouped: Record<string, any[]> = {}

  for (const exercise of exercises) {
    const parent = exercise.parent_exercise_number as string
    if (!grouped[parent]) {
      grouped[parent] = []
    }
    grouped[parent].push(exercise)
  }

  // Reassign letters sequentially within each parent group
  const normalized: any[] = []
  const letters = 'abcdefghijklmnopqrstuvwxyz'

  for (const parent of Object.keys(grouped).sort()) {
    const items = grouped[parent]
    // Sort by page number to maintain order
    items.sort((a: any, b: any) => (a.page_number ?? 0) - (b.page_number ?? 0))

    // Assign letters a, b, c, d, etc.
    items.forEach((item: any, index: number) => {
      const letter = letters[index] || 'z'
      normalized.push({
        ...item,
        sub_exercise_letter: letter,
        exercise_number: `${parent}${letter}`,
      })
    })
  }

  return normalized
}

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

    // Fetch metadata that was saved on upload
    const { data: uploadRow } = await supabaseAdmin
      .from('pdf_uploads')
      .select('subject, grade')
      .eq('id', uploadId)
      .single()

    const subject = uploadRow?.subject ?? null
    const grade = uploadRow?.grade ?? null

    await supabaseAdmin
      .from('pdf_uploads')
      .update({ page_count: pageImages.length })
      .eq('id', uploadId)

    // Process ALL pages in parallel - 1 Groq call per page (extract + transform combined)
    const pageResults = await Promise.allSettled(
      pageImages.map(({ pageNum, base64 }: { pageNum: number; base64: string }) =>
        extractAndTransformPage(base64, { subject, grade }).then((result) => ({ pageNum, result }))
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
        // Derive parent_exercise_number and sub_exercise_letter from exercise_number
        // if the model didn't supply them explicitly.
        let parent = exercise.parent_exercise_number ?? null
        let letter = exercise.sub_exercise_letter ?? null
        if (!parent || !letter) {
          const match = /^([#]?\d+)([a-z])?$/i.exec(exercise.exercise_number || '')
          if (match) {
            parent = parent ?? match[1] ?? null
            letter = letter ?? match[2] ?? null
          }
        }

        exercisesToInsert.push({
          pdf_upload_id: uploadId,
          page_number: pageNum,
          exercise_number: exercise.exercise_number,
          parent_exercise_number: parent,
          sub_exercise_letter: letter,
          block: result.block,
          lesson: result.lesson,
          question_type: exercise.question_type,
          difficulty_level: exercise.transformed_content?.difficulty_level ?? 1,
          topic: subject || 'Rekenen',
          learning_goal: result.learning_goal,
          original_content: exercise,
          transformed_content: exercise.transformed_content ?? null,
          status: 'pending',
        })
      }
    }

    // POST-PROCESSING: Group exercises by parent and reassign sub-exercise letters
    // This ensures that even if sub-exercises are scattered across pages or
    // numbered inconsistently by the AI, they get properly grouped and renumbered
    const normalizedExercises = normalizeSubExercises(exercisesToInsert)

    if (normalizedExercises.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('exercises')
        .insert(normalizedExercises)

      if (insertError) {
        console.error('Insert error:', insertError)
        await supabaseAdmin.from('pdf_uploads').update({ status: 'failed' }).eq('id', uploadId)
        return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 })
      }
    }

    await supabaseAdmin.from('pdf_uploads').update({ status: 'completed' }).eq('id', uploadId)

    return NextResponse.json({ success: true, exercisesExtracted: normalizedExercises.length })
  } catch (err) {
    console.error('Extraction error:', err)
    return NextResponse.json({ error: 'Extractie mislukt' }, { status: 500 })
  }
}
