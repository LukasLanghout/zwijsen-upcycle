'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Zap, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import type { Exercise, TransformedExercise, DifficultyLevel } from '@/lib/types'
import InteractiveExercise from '@/components/InteractiveExercise'
import clsx from 'clsx'

const QUESTION_TYPE_LABELS: Record<string, string> = {
  fill_in: 'Invulvraag',
  structured_hte: 'H-T-E Structuur',
  creative: 'Creatief',
  pattern_puzzle: 'Patroonpuzzel',
}

function hasValidContent(content: TransformedExercise | null): boolean {
  if (!content) return false
  switch (content.question_type) {
    case 'fill_in': return !!content.fill_in?.number
    case 'structured_hte': return !!content.structured_hte?.numbers?.length
    case 'creative': return !!content.creative?.digits?.length
    case 'pattern_puzzle': return !!content.pattern_puzzle?.shapes?.length
    default: return false
  }
}

export default function ExercisePage() {
  const { id } = useParams()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [activeContent, setActiveContent] = useState<TransformedExercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(1)
  const [isVariant, setIsVariant] = useState(false)

  const fetchExercise = async () => {
    const res = await fetch(`/api/exercises/${id}`)
    const data = await res.json()
    setExercise(data.exercise)
    setActiveContent(data.exercise?.transformed_content ?? null)
    setSelectedDifficulty(data.exercise?.difficulty_level ?? 1)
    setLoading(false)
  }

  useEffect(() => { fetchExercise() }, [id])

  const regenerateTransformation = async () => {
    if (!exercise) return
    setRegenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/regenerate/${id}`, { method: 'POST' })
      if (!res.ok) throw new Error('Regenereren mislukt')
      const data = await res.json()
      setActiveContent(data.transformed_content)
      setIsVariant(false)
      setExercise((prev) => prev ? { ...prev, transformed_content: data.transformed_content } : prev)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij regenereren')
    } finally {
      setRegenerating(false)
    }
  }

  const generateVariant = async (difficulty: DifficultyLevel) => {
    setGenerating(true)
    setError(null)
    setSelectedDifficulty(difficulty)
    try {
      const res = await fetch('/api/generate-variant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId: id, difficulty }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Genereren mislukt')
      }
      const { variant } = await res.json()
      setActiveContent(variant.variant_content)
      setIsVariant(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij genereren')
    } finally {
      setGenerating(false)
    }
  }

  const resetToOriginal = () => {
    setActiveContent(exercise?.transformed_content ?? null)
    setIsVariant(false)
    setSelectedDifficulty(exercise?.difficulty_level ?? 1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-[#A81D7B]" size={40} />
      </div>
    )
  }

  if (!exercise) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-600 font-medium">Oefening niet gevonden</p>
        <Link href="/library" className="btn-primary mt-4 inline-flex">Terug naar bibliotheek</Link>
      </div>
    )
  }

  const contentValid = hasValidContent(activeContent)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/library" className="btn-secondary flex items-center gap-2 text-sm py-1.5">
            <ChevronLeft size={16} /> Bibliotheek
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">Oefening {exercise.exercise_number}</h1>
              <span className={clsx('badge', `badge-${exercise.question_type}`)}>
                {QUESTION_TYPE_LABELS[exercise.question_type]}
              </span>
              {isVariant && <span className="badge bg-purple-100 text-[#A81D7B]">Variant</span>}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Blok {exercise.block} · Les {exercise.lesson}
              {exercise.learning_goal && exercise.learning_goal !== 'Lesdoel text is missing'
                ? ` · ${exercise.learning_goal}`
                : ''}
            </p>
          </div>
        </div>

        {/* Responsive grid: 1 col mobile, 2 col tablet, 3 col desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {/* Sidebar - 1 col on all sizes */}
          <div className="lg:col-span-1 space-y-4">
          {/* Regenereer knop - toon altijd als content leeg is */}
          {!contentValid && (
            <div className="card border-2 border-orange-200 bg-orange-50 p-5">
              <div className="flex items-center gap-2 text-orange-700 font-semibold mb-2">
                <AlertCircle size={16} />
                Inhoud ontbreekt
              </div>
              <p className="text-xs text-orange-600 mb-4">
                De AI heeft de oefening niet correct omgezet. Klik op regenereren om het opnieuw te proberen.
              </p>
              <button
                onClick={regenerateTransformation}
                disabled={regenerating}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {regenerating
                  ? <><Loader2 size={13} className="animate-spin" /> Bezig...</>
                  : <><RefreshCw size={13} /> Opnieuw genereren</>}
              </button>
            </div>
          )}

          {/* Variant generator */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Zap size={16} className="text-[#A81D7B]" />
              Nieuwe variant
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Genereer een variant met andere getallen op een gekozen niveau.
            </p>
            <div className="space-y-2 mb-4">
              {([1, 2, 3] as DifficultyLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => generateVariant(level)}
                  disabled={generating || regenerating || !contentValid}
                  className={clsx(
                    'w-full py-2 px-3 rounded-2xl text-sm font-medium border transition-colors text-left',
                    selectedDifficulty === level && isVariant
                      ? 'border-[#A81D7B] bg-[#A81D7B] text-white'
                      : 'border-gray-200 hover:border-[#A81D7B] hover:bg-[#F3D6EB] text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed'
                  )}
                >
                  {generating && selectedDifficulty === level
                    ? <span className="flex items-center gap-2"><Loader2 size={12} className="animate-spin" />Genereren...</span>
                    : level === 1 ? '1 — Makkelijk (100-499)'
                    : level === 2 ? '2 — Gemiddeld (500-799)'
                    : '3 — Moeilijk (800-999)'}
                </button>
              ))}
            </div>

            {isVariant && (
              <button onClick={resetToOriginal} className="w-full btn-secondary text-sm py-1.5">
                Terug naar origineel
              </button>
            )}

            {error && (
              <div className="mt-3 text-xs text-red-600 bg-red-50 rounded-xl p-2 flex items-center gap-1">
                <AlertCircle size={12} /> {error}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Info</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-400 text-xs">Onderwerp</dt>
                <dd className="text-gray-700">{exercise.topic || '-'}</dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs">Niveau</dt>
                <dd className="text-gray-700">
                  {exercise.difficulty_level === 1 ? 'Makkelijk' : exercise.difficulty_level === 2 ? 'Gemiddeld' : 'Moeilijk'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs">Status</dt>
                <dd>
                  <span className={clsx('badge', `badge-${exercise.status}`)}>
                    {exercise.status === 'approved' ? 'Goedgekeurd' : exercise.status === 'pending' ? 'In afwachting' : 'Afgewezen'}
                  </span>
                </dd>
              </div>
              {exercise.editor_notes && (
                <div>
                  <dt className="text-gray-400 text-xs">Notities</dt>
                  <dd className="text-gray-700 text-xs">{exercise.editor_notes}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Main: interactive exercise - 3 cols on desktop, full width on mobile */}
        <div className="lg:col-span-3 xl:col-span-4">
          {contentValid && activeContent ? (
            <InteractiveExercise exercise={activeContent} />
          ) : (
            <div className="card p-12 text-center text-gray-400">
              <AlertCircle size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-500">Oefening kon niet worden geladen</p>
              <p className="text-sm mt-1">Gebruik "Opnieuw genereren" in het linkerpaneel.</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  )
}
