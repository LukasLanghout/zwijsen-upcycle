import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const subject = (formData.get('subject') as string | null) || null
    const grade = (formData.get('grade') as string | null) || null

    if (!file) {
      return NextResponse.json({ error: 'Geen bestand ontvangen' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Alleen PDF-bestanden zijn toegestaan' }, { status: 400 })
    }

    // Create a record in pdf_uploads first
    const { data: uploadRecord, error: dbError } = await supabaseAdmin
      .from('pdf_uploads')
      .insert({
        filename: file.name,
        storage_path: '', // Will update after upload
        subject,
        grade,
        status: 'processing',
      })
      .select()
      .single()

    if (dbError || !uploadRecord) {
      console.error('DB error:', dbError)
      return NextResponse.json({ error: 'Database fout' }, { status: 500 })
    }

    // Upload the PDF to Supabase Storage
    const storagePath = `${uploadRecord.id}/${file.name}`
    const fileBuffer = await file.arrayBuffer()

    const { error: storageError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (storageError) {
      console.error('Storage error:', storageError)
      // Clean up the db record
      await supabaseAdmin.from('pdf_uploads').delete().eq('id', uploadRecord.id)
      return NextResponse.json({ error: 'Upload naar storage mislukt' }, { status: 500 })
    }

    // Update the record with the storage path
    await supabaseAdmin
      .from('pdf_uploads')
      .update({ storage_path: storagePath })
      .eq('id', uploadRecord.id)

    // Return uploadId + storagePath so client can do PDF-to-image conversion
    // and send images to /api/extract directly (avoids server-side canvas dependency)
    return NextResponse.json({ uploadId: uploadRecord.id, storagePath, subject, grade })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Onverwachte fout' }, { status: 500 })
  }
}
