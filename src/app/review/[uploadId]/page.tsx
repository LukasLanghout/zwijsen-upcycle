'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle, XCircle, AlertCircle, Loader2, ChevronLeft,
  Edit2, Save, X, RefreshCw, CheckCheck
} from 'lucide-react'
import type { Exercise, ExerciseStatus, QuestionType } from '@/lib/types'
import clsx from 'clsx'

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  fill_in: 'Invulvraag',
  structured_hte: 'H-T-E Structuur',
  creative: 'Creatief',
  pattern_puzzle: 'Patroonpuzzel',
}

type UploadInfo = {
  id: string
  filename: string
  storage_path: string
  status: string
  page_count: number | null
}

export default function ReviewPage() {
  const { uploadId } = useParams()
  const [uploadInfo, setUploadInfo] = useState<UploadInfo | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<Exercise>>({})
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [errorIds, setErrorIds] = useState<Record<string, string>>({})
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [approvingAll, setApprovingAll] = useState(false)

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/exercises?uploadId=${uploadId}`)
    const data = await res.json()
    setExercises(data.exercises || [])

    const uploadRes = await fetch(`/api/upload-info/${uploadId}`)
    if (uploadRes.ok) {
      const uploadData = await uploadRes.json()
      setUploadInfo(uploadData.upload)

      if (uploadData.upload?.storage_path) {
        const { createClient } = await import('@supabase/supabase-js')
        const sb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: urlData } = sb.storage
          .from('pdf-uploads')
          .getPublicUrl(uploadData.upload.storage_path)
        setPdfUrl(urlData.publicUrl)
      }
    }
  }, [uploadId])

  useEffect(() => {
    let timeout: NodeJS.Timeout

    const poll = async () => {
      await fetchData()
      const uploadRes = await fetch(`/api/upload-info/${uploadId}`)
      if (uploadRes.ok) {
        const { upload } = await uploadRes.json()
        if (upload?.status === 'processing') {
          setPolling(true)
          timeout = setTimeout(poll, 3000)
        } else {
          setPolling(false)
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    poll()
    return () => clearTimeout(timeout)
  }, [uploadId, fetchData])

  const updateExercise = async (id: string, updates: Partial<Exercise>) => {
    // Optimistic update
    setExercises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    )
    setSavingIds((s) => new Set(s).add(id))
    setErrorIds((e) => { const next = { ...e }; delete next[id]; return next })

    try {
      const res = await fetch(`/api/exercises/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!res.ok) {
        throw new Error('Opslaan mislukt')
      }

      const { exercise } = await res.json()
      // Sync with server response
      setExercises((prev) => prev.map((e) => (e.id === id ? exercise : e)))
    } catch (err) {
      // Revert optimistic update on failure
      await fetchData()
      setErrorIds((e) => ({
        ...e,
        [id]: err instanceof Error ? err.message : 'Fout bij opslaan',
      }))
    } finally {
      setSavingIds((s) => {
        const next = new Set(s)
        next.delete(id)
        return next
      })
    }
  }

  const setStatus = (id: string, status: ExerciseStatus) => {
    updateExercise(id, { status })
  }

  const approveAll = async () => {
    setApprovingAll(true)
    const pending = exercises.filter((e) => e.status === 'pending')
    await Promise.all(pending.map((e) => updateExercise(e.id, { status: 'approved' })))
    setApprovingAll(false)
  }

  const startEdit = (exercise: Exercise) => {
    setEditingId(exercise.id)
    setEditValues({
      question_type: exercise.question_type,
      difficulty_level: exercise.difficulty_level,
      topic: exercise.topic ?? '',
      editor_notes: exercise.editor_notes ?? '',
    })
  }

  const saveEdit = async (id: string) => {
    await updateExercise(id, editValues)
    setEditingId(null)
    setEditValues({})
  }

  const pendingCount = exercises.filter((e) => e.status === 'pending').length
  const approvedCount = exercises.filter((e) => e.status === 'approved').length
  const rejectedCount = exercises.filter((e) => e.status === 'rejected').length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="btn-secondary flex items-center gap-2 text-sm py-1.5">
          <ChevronLeft size={16} /> Terug
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Oefeningen controleren</h1>
          {uploadInfo && <p className="text-sm text-gray-500">{uploadInfo.filename}</p>}
        </div>
        {polling && (
          <div className="ml-auto flex items-center gap-2 text-[#A81D7B] text-sm">
            <Loader2 size={14} className="animate-spin" />
            AI verwerkt de PDF...
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="card p-4 mb-6 flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2 text-yellow-600">
          <AlertCircle size={16} />
          <span className="font-semibold">{pendingCount} te controleren</span>
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle size={16} />
          <span className="font-semibold">{approvedCount} goedgekeurd</span>
        </div>
        <div className="flex items-center gap-2 text-red-500">
          <XCircle size={16} />
          <span className="font-semibold">{rejectedCount} afgewezen</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {pendingCount > 0 && (
            <button
              onClick={approveAll}
              disabled={approvingAll}
              className="flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {approvingAll
                ? <Loader2 size={14} className="animate-spin" />
                : <CheckCheck size={14} />}
              Alles goedkeuren
            </button>
          )}
          <button
            onClick={fetchData}
            className="btn-secondary flex items-center gap-2 text-sm py-1.5"
          >
            <RefreshCw size={14} />
            Vernieuwen
          </button>
        </div>
      </div>

      {/* Main content: PDF left, exercises right */}
      <div className="grid grid-cols-2 gap-6">
        {/* PDF Viewer */}
        <div className="sticky top-24 h-[calc(100vh-8rem)]">
          <div className="card h-full overflow-hidden">
            <div className="p-3 border-b border-gray-100 text-sm font-semibold text-gray-700">
              Originele PDF
            </div>
            {pdfUrl ? (
              <iframe
                src={`${pdfUrl}#toolbar=0`}
                className="w-full h-[calc(100%-40px)]"
                title="PDF Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <Loader2 className="animate-spin" size={32} />
              </div>
            )}
          </div>
        </div>

        {/* Exercises */}
        <div className="space-y-4">
          {loading && exercises.length === 0 ? (
            <div className="card p-12 text-center">
              <Loader2 className="animate-spin mx-auto mb-3 text-[#A81D7B]" size={32} />
              <p className="text-gray-600 font-semibold">AI analyseert de PDF...</p>
              <p className="text-sm text-gray-400 mt-1">Even geduld</p>
            </div>
          ) : exercises.length === 0 ? (
            <div className="card p-12 text-center text-gray-500">
              Geen oefeningen gevonden
            </div>
          ) : (
            exercises.map((exercise) => (
              <ExerciseReviewCard
                key={exercise.id}
                exercise={exercise}
                isEditing={editingId === exercise.id}
                editValues={editValues}
                isSaving={savingIds.has(exercise.id)}
                error={errorIds[exercise.id]}
                onApprove={() => setStatus(exercise.id, 'approved')}
                onReject={() => setStatus(exercise.id, 'rejected')}
                onEdit={() => startEdit(exercise)}
                onSaveEdit={() => saveEdit(exercise.id)}
                onCancelEdit={() => setEditingId(null)}
                onEditValueChange={(key, value) =>
                  setEditValues((prev) => ({ ...prev, [key]: value }))
                }
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function ExerciseReviewCard({
  exercise,
  isEditing,
  editValues,
  isSaving,
  error,
  onApprove,
  onReject,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onEditValueChange,
}: {
  exercise: Exercise
  isEditing: boolean
  editValues: Partial<Exercise>
  isSaving: boolean
  error?: string
  onApprove: () => void
  onReject: () => void
  onEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onEditValueChange: (key: string, value: unknown) => void
}) {
  const isApproved = exercise.status === 'approved'
  const isRejected = exercise.status === 'rejected'

  return (
    <div
      className={clsx(
        'card border-2 p-5 transition-all duration-200',
        isApproved && 'border-green-400 bg-green-50',
        isRejected && 'border-red-300 bg-red-50',
        !isApproved && !isRejected && 'border-yellow-300 bg-yellow-50'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-gray-900">
            Oefening {exercise.exercise_number}
          </span>
          <span className="text-xs text-gray-500">Pagina {exercise.page_number}</span>
          <span className={clsx('badge', `badge-${exercise.question_type}`)}>
            {QUESTION_TYPE_LABELS[exercise.question_type]}
          </span>
          <span className={clsx('badge', `badge-${exercise.status}`)}>
            {isApproved ? '✓ Goedgekeurd' : isRejected ? '✗ Afgewezen' : 'In afwachting'}
          </span>
        </div>
        <button onClick={onEdit} className="text-gray-400 hover:text-gray-600 p-1" title="Bewerken">
          <Edit2 size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="text-sm text-gray-700 mb-2">
        <span className="font-medium">Instructie: </span>
        {exercise.original_content?.instruction}
      </div>

      {exercise.original_content?.given_numbers && (
        <div className="text-sm text-gray-600 mb-2">
          <span className="font-medium">Getallen: </span>
          {exercise.original_content.given_numbers.join(', ')}
        </div>
      )}

      {exercise.original_content?.raw_text && (
        <details className="mb-3">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
            Ruwe tekst tonen
          </summary>
          <pre className="text-xs text-gray-500 mt-2 whitespace-pre-wrap bg-white rounded-xl p-2 border">
            {exercise.original_content.raw_text}
          </pre>
        </details>
      )}

      {/* Error */}
      {error && (
        <div className="mb-3 text-xs text-red-600 bg-red-100 rounded-xl px-3 py-2 flex items-center gap-1.5">
          <AlertCircle size={12} />
          {error} — probeer opnieuw
        </div>
      )}

      {/* Edit form */}
      {isEditing && (
        <div className="bg-white rounded-2xl border p-4 mb-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Vraagtype</label>
              <select
                value={editValues.question_type}
                onChange={(e) => onEditValueChange('question_type', e.target.value)}
                className="w-full border rounded-xl px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A81D7B]"
              >
                <option value="fill_in">Invulvraag</option>
                <option value="structured_hte">H-T-E Structuur</option>
                <option value="creative">Creatief</option>
                <option value="pattern_puzzle">Patroonpuzzel</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Moeilijkheid</label>
              <select
                value={editValues.difficulty_level}
                onChange={(e) => onEditValueChange('difficulty_level', parseInt(e.target.value))}
                className="w-full border rounded-xl px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A81D7B]"
              >
                <option value={1}>1 — Makkelijk</option>
                <option value={2}>2 — Gemiddeld</option>
                <option value={3}>3 — Moeilijk</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Notities</label>
            <textarea
              value={editValues.editor_notes ?? ''}
              onChange={(e) => onEditValueChange('editor_notes', e.target.value)}
              className="w-full border rounded-xl px-2 py-1.5 text-sm h-16 resize-none focus:outline-none focus:ring-2 focus:ring-[#A81D7B]"
              placeholder="Opmerkingen voor andere editors..."
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={onCancelEdit} className="btn-secondary text-sm py-1 px-3 flex items-center gap-1">
              <X size={12} /> Annuleren
            </button>
            <button onClick={onSaveEdit} className="btn-primary text-sm py-1 px-3 flex items-center gap-1">
              <Save size={12} /> Opslaan
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-4 pt-3 border-t border-black/5">
        <button
          onClick={onApprove}
          disabled={isSaving || isApproved}
          className={clsx(
            'flex items-center gap-1.5 text-sm py-2 px-4 rounded-2xl font-semibold transition-all',
            isApproved
              ? 'bg-green-500 text-white cursor-default'
              : 'bg-green-600 hover:bg-green-700 text-white disabled:opacity-50'
          )}
        >
          {isSaving
            ? <Loader2 size={13} className="animate-spin" />
            : <CheckCircle size={14} />}
          {isApproved ? 'Goedgekeurd' : 'Goedkeuren'}
        </button>

        <button
          onClick={onReject}
          disabled={isSaving || isRejected}
          className={clsx(
            'flex items-center gap-1.5 text-sm py-2 px-4 rounded-2xl font-semibold transition-all',
            isRejected
              ? 'bg-red-500 text-white cursor-default'
              : 'border-2 border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50'
          )}
        >
          <XCircle size={14} />
          {isRejected ? 'Afgewezen' : 'Afwijzen'}
        </button>

        {isApproved && (
          <Link
            href={`/exercise/${exercise.id}`}
            className="ml-auto btn-secondary flex items-center gap-1.5 text-sm py-2 px-4"
          >
            Bekijk interactief →
          </Link>
        )}
      </div>
    </div>
  )
}
