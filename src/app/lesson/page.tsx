'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, CheckCircle, XCircle,
  Loader2, Trophy, RotateCcw, Star, BookOpen
} from 'lucide-react'
import type { Exercise, TransformedExercise, QuestionType } from '@/lib/types'
import InteractiveExercise from '@/components/InteractiveExercise'
import clsx from 'clsx'

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  fill_in: 'Invulvraag',
  structured_hte: 'H-T-E Structuur',
  creative: 'Creatief',
  pattern_puzzle: 'Patroonpuzzel',
}

interface ExerciseResult {
  exerciseNumber: string
  questionType: string
  instruction: string
  correct: boolean
}

type LessonPhase = 'loading' | 'exercise' | 'results'

export default function LessonPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [phase, setPhase] = useState<LessonPhase>('loading')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [results, setResults] = useState<ExerciseResult[]>([])
  const [answered, setAnswered] = useState(false)
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)

  // AI feedback state
  const [feedback, setFeedback] = useState<string | null>(null)
  const [score, setScore] = useState<{ correct: number; total: number; percent: number } | null>(null)
  const [loadingFeedback, setLoadingFeedback] = useState(false)

  // Extract filter params
  const questionType = searchParams.get('questionType') ?? ''
  const difficulty = searchParams.get('difficulty') ?? ''
  const subject = searchParams.get('subject') ?? ''

  const fetchExercises = useCallback(async () => {
    setPhase('loading')
    const params = new URLSearchParams({ status: 'approved' })
    if (questionType) params.set('questionType', questionType)
    if (difficulty) params.set('difficulty', difficulty)
    if (subject) params.set('subject', subject)

    const res = await fetch(`/api/exercises?${params}`)
    const data = await res.json()

    // Shuffle and take up to 8 exercises
    const shuffled: Exercise[] = (data.exercises ?? [])
      .filter((e: Exercise) => e.transformed_content)
      .sort(() => Math.random() - 0.5)
      .slice(0, 8)

    setExercises(shuffled)
    setCurrentIdx(0)
    setResults([])
    setAnswered(false)
    setLastCorrect(null)
    setFeedback(null)
    setScore(null)
    setPhase(shuffled.length === 0 ? 'results' : 'exercise')
  }, [questionType, difficulty, subject])

  useEffect(() => { fetchExercises() }, [fetchExercises])

  const handleComplete = (correct: boolean) => {
    if (answered) return // prevent double-submit
    setAnswered(true)
    setLastCorrect(correct)
  }

  const handleNext = () => {
    const exercise = exercises[currentIdx]
    if (!exercise) return

    const newResult: ExerciseResult = {
      exerciseNumber: exercise.exercise_number,
      questionType: exercise.question_type,
      instruction: exercise.original_content?.instruction ?? exercise.transformed_content?.instruction ?? '',
      correct: lastCorrect ?? false,
    }
    const newResults = [...results, newResult]
    setResults(newResults)

    if (currentIdx + 1 < exercises.length) {
      setCurrentIdx((i) => i + 1)
      setAnswered(false)
      setLastCorrect(null)
    } else {
      // Last exercise — fetch AI feedback
      finishLesson(newResults)
    }
  }

  const finishLesson = async (finalResults: ExerciseResult[]) => {
    setPhase('results')
    setLoadingFeedback(true)
    try {
      const res = await fetch('/api/lesson-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: finalResults }),
      })
      const data = await res.json()
      setFeedback(data.feedback ?? null)
      setScore(data.score ?? null)
    } catch {
      setFeedback('Goed bezig! Blijf oefenen.')
    } finally {
      setLoadingFeedback(false)
    }
  }

  const currentExercise = exercises[currentIdx]
  const progress = exercises.length > 0 ? ((currentIdx) / exercises.length) * 100 : 0

  // ── Loading ──────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-zwijsen-primary-500" size={48} />
        <p className="text-gray-600 font-medium text-lg">Les wordt klaargemaakt…</p>
      </div>
    )
  }

  // ── Results screen ───────────────────────────────────────────
  if (phase === 'results') {
    const correctCount = results.filter((r) => r.correct).length
    const pct = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0

    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Trophy header */}
        <div className="text-center mb-10">
          <div className={clsx(
            'inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 shadow-lg',
            pct >= 80 ? 'bg-yellow-100' : pct >= 50 ? 'bg-zwijsen-primary-100' : 'bg-gray-100'
          )}>
            {pct >= 80
              ? <Trophy size={48} className="text-yellow-500" />
              : pct >= 50
              ? <Star size={48} className="text-zwijsen-primary-500" />
              : <BookOpen size={48} className="text-gray-400" />}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Les afgerond!</h1>
          {score && (
            <p className="text-lg text-gray-600">
              Je had <span className="font-bold text-zwijsen-primary-600">{score.correct}</span> van de{' '}
              <span className="font-bold">{score.total}</span> oefeningen goed ({score.percent}%)
            </p>
          )}
        </div>

        {/* Score bar */}
        {results.length > 0 && (
          <div className="card p-6 mb-6">
            <div className="flex justify-between text-sm font-semibold text-gray-600 mb-2">
              <span>Score</span>
              <span>{correctCount}/{results.length}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                className={clsx(
                  'h-4 rounded-full transition-all duration-700',
                  pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-zwijsen-primary-500' : 'bg-red-400'
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Per-exercise breakdown */}
        {results.length > 0 && (
          <div className="card p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-4 text-lg">Overzicht per oefening</h2>
            <div className="space-y-3">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  {r.correct
                    ? <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                    : <XCircle size={20} className="text-red-500 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-700">Opdracht {r.exerciseNumber}</span>
                    <span className="text-xs text-gray-400 ml-2">({QUESTION_TYPE_LABELS[r.questionType as QuestionType] ?? r.questionType})</span>
                    <p className="text-xs text-gray-500 truncate">{r.instruction}</p>
                  </div>
                  <span className={clsx(
                    'text-xs font-bold flex-shrink-0',
                    r.correct ? 'text-green-600' : 'text-red-500'
                  )}>
                    {r.correct ? 'Goed' : 'Fout'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Feedback */}
        <div className="card p-6 mb-8 border-2 border-zwijsen-primary-200 bg-gradient-to-br from-zwijsen-primary-50 to-white">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-2xl">🤖</span> Terugkoppeling van je leraar
          </h2>
          {loadingFeedback ? (
            <div className="flex items-center gap-3 text-gray-500">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">AI schrijft terugkoppeling…</span>
            </div>
          ) : feedback ? (
            <p className="text-gray-800 leading-relaxed font-medium">{feedback}</p>
          ) : results.length === 0 ? (
            <p className="text-gray-500 text-sm italic">Geen oefeningen gemaakt.</p>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={fetchExercises}
            className="btn-primary flex items-center gap-2 py-3 px-8"
          >
            <RotateCcw size={18} /> Opnieuw starten
          </button>
          <Link href="/library" className="btn-secondary flex items-center gap-2 py-3 px-6">
            <ChevronLeft size={18} /> Bibliotheek
          </Link>
        </div>
      </div>
    )
  }

  // ── Exercise screen ──────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/library" className="btn-secondary flex items-center gap-2 text-sm py-1.5">
          <ChevronLeft size={16} /> Stoppen
        </Link>
        <div className="flex-1">
          <div className="flex justify-between text-sm font-semibold text-gray-600 mb-1">
            <span>Oefening {currentIdx + 1} van {exercises.length}</span>
            <span>{results.filter((r) => r.correct).length} goed</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-zwijsen-primary-400 to-zwijsen-primary-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Exercise type badge */}
      {currentExercise && (
        <div className="flex items-center gap-2 mb-4">
          <span className={clsx('badge', `badge-${currentExercise.question_type}`)}>
            {QUESTION_TYPE_LABELS[currentExercise.question_type]}
          </span>
          <span className="text-xs text-gray-400">Opdracht {currentExercise.exercise_number}</span>
        </div>
      )}

      {/* Interactive Exercise */}
      {currentExercise?.transformed_content && (
        <InteractiveExercise
          exercise={currentExercise.transformed_content as TransformedExercise}
          onComplete={handleComplete}
          quizMode
        />
      )}

      {/* Feedback banner after answering */}
      {answered && lastCorrect !== null && (
        <div className={clsx(
          'mt-6 flex items-center gap-4 px-6 py-4 rounded-2xl border-2 font-bold text-base animate-slideUp',
          lastCorrect
            ? 'bg-green-50 border-green-300 text-green-800'
            : 'bg-red-50 border-red-300 text-red-800'
        )}>
          {lastCorrect
            ? <><CheckCircle size={24} className="flex-shrink-0" /><span>Uitstekend! Dat klopt! 🎉</span></>
            : <><XCircle size={24} className="flex-shrink-0" /><span>Niet helemaal goed — geen probleem, ga door!</span></>}
        </div>
      )}

      {/* Next button — only visible after answering */}
      {answered && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleNext}
            className="btn-primary flex items-center gap-2 py-3 px-8 text-base font-bold shadow-lg hover:scale-105 transition-transform"
          >
            {currentIdx + 1 < exercises.length ? (
              <><span>Volgende oefening</span><ChevronRight size={20} /></>
            ) : (
              <><span>Resultaten bekijken</span><Trophy size={20} /></>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
