import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const uploadId = searchParams.get('uploadId')
  const status = searchParams.get('status')
  const questionType = searchParams.get('questionType')
  const difficulty = searchParams.get('difficulty')
  const subject = searchParams.get('subject')
  const grade = searchParams.get('grade')

  // If subject/grade filters are set, first find matching pdf_upload IDs
  let allowedUploadIds: string[] | null = null
  if (subject || grade) {
    let uploadQuery = supabaseAdmin.from('pdf_uploads').select('id')
    if (subject) uploadQuery = uploadQuery.eq('subject', subject)
    if (grade) uploadQuery = uploadQuery.eq('grade', grade)
    const { data: uploads } = await uploadQuery
    allowedUploadIds = (uploads || []).map((u) => u.id)
    // If no uploads match, return empty result early
    if (allowedUploadIds.length === 0) {
      return NextResponse.json({ exercises: [] })
    }
  }

  let query = supabaseAdmin
    .from('exercises')
    .select('*, pdf_upload:pdf_uploads(id, filename, storage_path, subject, grade)')
    .order('page_number', { ascending: true })
    .order('exercise_number', { ascending: true })

  if (uploadId) query = query.eq('pdf_upload_id', uploadId)
  if (status) query = query.eq('status', status)
  if (questionType) query = query.eq('question_type', questionType)
  if (difficulty) query = query.eq('difficulty_level', parseInt(difficulty))
  if (allowedUploadIds) query = query.in('pdf_upload_id', allowedUploadIds)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ exercises: data })
}
