import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabase'

// Receives only JSON metadata — the PDF itself is uploaded directly from the browser
// using the signed URL returned here, so this route never touches the raw file.
export async function POST(req: NextRequest) {
  try {
    const { filename, subject, grade } = await req.json()

    if (!filename) {
      return NextResponse.json({ error: 'Bestandsnaam ontbreekt' }, { status: 400 })
    }

    // Create DB record
    const { data: uploadRecord, error: dbError } = await supabaseAdmin
      .from('pdf_uploads')
      .insert({
        filename,
        storage_path: '',
        subject: subject || null,
        grade: grade || null,
        status: 'processing',
      })
      .select()
      .single()

    if (dbError || !uploadRecord) {
      console.error('DB error:', dbError)
      return NextResponse.json({ error: 'Database fout' }, { status: 500 })
    }

    const storagePath = `${uploadRecord.id}/${filename}`

    // Generate a signed upload URL so the browser can PUT the file directly to Supabase
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .createSignedUploadUrl(storagePath)

    if (signedError || !signedData) {
      console.error('Signed URL error:', signedError)
      await supabaseAdmin.from('pdf_uploads').delete().eq('id', uploadRecord.id)
      return NextResponse.json({ error: 'Kon geen upload-URL aanmaken' }, { status: 500 })
    }

    // Store the storage path now (file isn't uploaded yet but path is known)
    await supabaseAdmin
      .from('pdf_uploads')
      .update({ storage_path: storagePath })
      .eq('id', uploadRecord.id)

    return NextResponse.json({
      uploadId: uploadRecord.id,
      storagePath,
      signedUrl: signedData.signedUrl,
      token: signedData.token,
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Onverwachte fout' }, { status: 500 })
  }
}
