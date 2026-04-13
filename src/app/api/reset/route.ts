import { NextResponse } from 'next/server'
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabase'

export async function DELETE() {
  try {
    // Delete all exercise variants
    await supabaseAdmin.from('exercise_variants').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Delete all exercises
    await supabaseAdmin.from('exercises').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Get all storage paths before deleting uploads
    const { data: uploads } = await supabaseAdmin
      .from('pdf_uploads')
      .select('storage_path')

    // Delete files from storage
    if (uploads && uploads.length > 0) {
      const paths = uploads.map((u) => u.storage_path).filter(Boolean)
      if (paths.length > 0) {
        await supabaseAdmin.storage.from(STORAGE_BUCKET).remove(paths)
      }
    }

    // Delete all upload records
    await supabaseAdmin.from('pdf_uploads').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Reset error:', err)
    return NextResponse.json({ error: 'Reset mislukt' }, { status: 500 })
  }
}
