'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Zap, Loader2, AlertCircle } from 'lucide-react'
import type { Exercise, TransformedExercise, DifficultyLevel } from '@/lib/types'
import InteractiveExercise from '@/components/InteractiveExercise'
import clsx from 'clsx'

const QUESTION_TYPE_LABELS: Record<string, string> = {
  fill_in: 'Invulvraag',
  structured_hte: 'H-T-E Structuur',
  creative: 'Creatief',
  pattern_puzzle: 'Patroonpuzzel',
}

export default function ExercisePage() {
  const { id } = useParams()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [activeContent, setActiveContent] = useState<TransformedExercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(1)
  const [isVariant, setIsVariant] = useState(false)

  useEffect(() => {
    const fetchExercise = async () => {
      const res = await fetch(`/api/exercises/${id}`)
      const data = await res.json()
      setExercise(data.exercise)
      setActiveContent(data.exercise?.transformed_content ?? null)
      setSelectedDifficulty(data.exercise?.difficulty_level ?? 1)
      setLoading(false)
    }
    fetchExercise()
  }, [id])

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
        <Loader2 className="animate-spin text-zwijsen-blue" size={40} />
      </div>
    )
  }

  if (!exercise || !activeContent) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-600 font-medium">Oefening niet gevonden of nog niet verwerkt</p>
        <Link href="/library" className="btn-primary mt-4 inline-flex">
          Terug naar bibliotheek
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/library" className="btn-secondary flex items-center gap-2 text-sm py-1.5">
          <ChevronLeft size={16} /> Bibliotheek
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">
              Oefening {exercise.exercise_number}
            </h1>
            <span className={clsx('badge', `badge-${exercise.question_type}`)}>
              {QUESTION_TYPE_LABELS[exercise.question_type]}
            </span>
            {isVariant && (
              <span className="badge bg-purple-100 text-purple-700">Variant</span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Blok {exercise.block} · Les {exercise.lesson}
            {exercise.learning_goal && ` · ${exercise.learning_goal}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Sidebar: variant generator */}
        <div className="space-y-4">
          {/* Variant generator */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Zap size={16} className="text-zwijsen-blue" />
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
                  disabled={generating}
                  className={clsx(
                    'w-full py-2 px-3 rounded-lg text-sm font-medium border transition-colors text-left',
                    selectedDifficulty === level && isVariant
                      ? 'border-zwijsen-blue bg-zwijsen-blue text-white'
                      : 'border-gray-200 hover:border-zwijsen-blue hover:bg-blue-50 text-gray-700'
                  )}
                >
                  {generating && selectedDifficulty === level ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={12} className="animate-spin" />
                      Genereren...
                    </span>
                  ) : (
                    <>
                      {level === 1 && '1 — Makkelijk (100-499)'}
                      {level === 2 && '2 — Gemiddeld (500-799)'}
                      {level === 3 && '3 — Moeilijk (800-999)'}
                    </>
                  )}
                </button>
              ))}
            </div>

            {isVariant && (
              <button
                onClick={resetToOriginal}
                className="w-full btn-secondary text-sm py-1.5"
              >
                Terug naar origineel
              </button>
            )}

            {error && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 rounded p-2 flex items-center gap-1">
                <AlertCircle size={12} />
                {error}
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

        {/* Main: interactive exercise */}
        <div className="col-span-2">
          <InteractiveExercise exercise={activeContent} />
        </div>
      </div>
    </div>
  )
}
