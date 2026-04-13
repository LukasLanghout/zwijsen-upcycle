import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabase'
import { extractExercisesFromImage, transformExercise } from '@/lib/groq'

// Convert PDF page to base64 image using pdf.js
async function pdfPageToBase64(pdfBuffer: ArrayBuffer, pageNum: number): Promise<string> {
  // Dynamically import pdfjs to avoid SSR issues
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')

  // Load PDF
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) })
  const pdf = await loadingTask.promise

  const page = await pdf.getPage(pageNum)
  const viewport = page.getViewport({ scale: 2.0 }) // Scale up for better OCR

  // Use node-canvas for server-side rendering
  const { createCanvas } = await import('canvas')
  const canvas = createCanvas(viewport.width, viewport.height)
  const context = canvas.getContext('2d')

  await page.render({
    canvasContext: context as unknown as CanvasRenderingContext2D,
    viewport,
  }).promise

  // Convert to base64 PNG
  const buffer = canvas.toBuffer('image/png')
  return buffer.toString('base64')
}

export async function POST(req: NextRequest) {
  try {
    const { uploadId, storagePath } = await req.json()

    if (!uploadId || !storagePath) {
      return NextResponse.json({ error: 'Missing uploadId or storagePath' }, { status: 400 })
    }

    // Download the PDF from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .download(storagePath)

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError)
      await supabaseAdmin
        .from('pdf_uploads')
        .update({ status: 'failed' })
        .eq('id', uploadId)
      return NextResponse.json({ error: 'PDF download mislukt' }, { status: 500 })
    }

    const pdfBuffer = await fileData.arrayBuffer()

    // Get page count
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) })
    const pdf = await loadingTask.promise
    const pageCount = pdf.numPages

    // Update page count
    await supabaseAdmin
      .from('pdf_uploads')
      .update({ page_count: pageCount })
      .eq('id', uploadId)

    // Process each page
    const exercisesToInsert: any[] = []

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      try {
        // Convert page to image
        const base64Image = await pdfPageToBase64(pdfBuffer, pageNum)

        // Extract exercises using Groq Vision
        const extracted = await extractExercisesFromImage(base64Image)

        // Transform each exercise
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
            // Still save original, just without transformation
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

    // Bulk insert all exercises
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
        return NextResponse.json({ error: 'Opslaan van oefeningen mislukt' }, { status: 500 })
      }
    }

    // Mark upload as completed
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
