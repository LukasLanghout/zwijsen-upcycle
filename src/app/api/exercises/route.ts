import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const uploadId = searchParams.get('uploadId')
  const status = searchParams.get('status')
  const questionType = searchParams.get('questionType')
  const difficulty = searchParams.get('difficulty')

  let query = supabaseAdmin
    .from('exercises')
    .select('*, pdf_upload:pdf_uploads(id, filename, storage_path)')
    .order('page_number', { ascending: true })
    .order('exercise_number', { ascending: true })

  if (uploadId) query = query.eq('pdf_upload_id', uploadId)
  if (status) query = query.eq('status', status)
  if (questionType) query = query.eq('question_type', questionType)
  if (difficulty) query = query.eq('difficulty_level', parseInt(difficulty))

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ exercises: data })
}
