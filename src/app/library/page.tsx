'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Filter, BookOpen, ChevronRight, Zap, GraduationCap } from 'lucide-react'
import type { Exercise, QuestionType, DifficultyLevel, ExerciseStatus } from '@/lib/types'
import { SUBJECTS, GRADES } from '@/lib/types'
import clsx from 'clsx'

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  flashcard: 'Woordkaart',
  multiple_choice: 'Meerkeuzevraag',
  cloze: 'Invulzin',
}

export default function LibraryPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '' as ExerciseStatus | '',
    questionType: '' as QuestionType | '',
    difficulty: '' as string,
    subject: '' as string,
    grade: '' as string,
    search: '',
  })

  const fetchExercises = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.questionType) params.set('questionType', filters.questionType)
    if (filters.difficulty) params.set('difficulty', filters.difficulty)
    if (filters.subject) params.set('subject', filters.subject)
    if (filters.grade) params.set('grade', filters.grade)

    const res = await fetch(`/api/exercises?${params}`)
    const data = await res.json()
    setExercises(data.exercises || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchExercises()
  }, [filters.status, filters.questionType, filters.difficulty, filters.subject, filters.grade])

  const filtered = exercises.filter((e) => {
    if (!filters.search) return true
    const q = filters.search.toLowerCase()
    return (
      e.original_content?.instruction?.toLowerCase().includes(q) ||
      e.topic?.toLowerCase().includes(q) ||
      e.lesson?.toLowerCase().includes(q) ||
      e.block?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Oefeningen bibliotheek</h1>
          <p className="text-lg text-gray-600 font-medium">
            {exercises.length} oefeningen beschikbaar
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link
            href={`/lesson?${new URLSearchParams(
              Object.fromEntries(Object.entries({ questionType: filters.questionType, difficulty: filters.difficulty, subject: filters.subject }).filter(([, v]) => v))
            )}`}
            className="btn-success flex items-center justify-center gap-2 md:min-w-max"
          >
            <GraduationCap size={20} />
            <span>Start les</span>
          </Link>
          <Link href="/upload" className="btn-primary flex items-center justify-center gap-2 md:min-w-max">
            <BookOpen size={20} />
            <span>Nieuwe PDF uploaden</span>
          </Link>
        </div>
      </div>

      {/* Filters - Improved */}
      <div className="card p-6 mb-8 border-2 border-gray-100">
        <div className="flex items-center gap-3 mb-5">
          <Filter size={18} className="text-zwijsen-primary-500" />
          <h3 className="font-bold text-gray-900">Filter oefeningen</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Zoeken oefeningen..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zwijsen-primary-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Status filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as ExerciseStatus | '' }))}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zwijsen-primary-500 focus:border-transparent transition-all font-medium"
          >
            <option value="">Alle statussen</option>
            <option value="pending">In afwachting</option>
            <option value="approved">✓ Goedgekeurd</option>
            <option value="rejected">✗ Afgewezen</option>
          </select>

          {/* Subject filter */}
          <select
            value={filters.subject}
            onChange={(e) => setFilters((f) => ({ ...f, subject: e.target.value }))}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zwijsen-primary-500 focus:border-transparent transition-all font-medium"
          >
            <option value="">Alle vakken</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Grade filter */}
          <select
            value={filters.grade}
            onChange={(e) => setFilters((f) => ({ ...f, grade: e.target.value }))}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zwijsen-primary-500 focus:border-transparent transition-all font-medium"
          >
            <option value="">Alle klassen</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          {/* Type filter */}
          <select
            value={filters.questionType}
            onChange={(e) =>
              setFilters((f) => ({ ...f, questionType: e.target.value as QuestionType | '' }))
            }
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zwijsen-primary-500 focus:border-transparent transition-all font-medium"
          >
            <option value="">Alle typen</option>
            <option value="flashcard">Woordkaart</option>
            <option value="multiple_choice">Meerkeuzevraag</option>
            <option value="cloze">Invulzin</option>
          </select>

          {/* Difficulty filter */}
          <select
            value={filters.difficulty}
            onChange={(e) => setFilters((f) => ({ ...f, difficulty: e.target.value }))}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zwijsen-primary-500 focus:border-transparent transition-all font-medium"
          >
            <option value="">Alle niveaus</option>
            <option value="1">⭐ Makkelijk</option>
            <option value="2">⭐⭐ Gemiddeld</option>
            <option value="3">⭐⭐⭐ Moeilijk</option>
          </select>
        </div>
      </div>

      {/* Exercise Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-6 loading-shimmer rounded-2xl" style={{ backgroundSize: '200% 100%' }}>
              <div className="h-5 bg-gray-300 rounded-lg mb-4 w-3/4" />
              <div className="h-4 bg-gray-200 rounded mb-3 w-1/2" />
              <div className="h-4 bg-gray-200 rounded mb-3 w-full" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <BookOpen size={56} className="mx-auto mb-6 text-gray-300" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Geen oefeningen gevonden</h3>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            Pas de filters aan of upload een nieuwe PDF om te beginnen.
          </p>
          <Link href="/upload" className="btn-primary inline-flex items-center gap-2">
            <BookOpen size={18} />
            PDF uploaden
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </div>
      )}
    </div>
  )
}

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const difficultyEmojis = { 1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐' }
  const difficultyLabel = { 1: 'Makkelijk', 2: 'Gemiddeld', 3: 'Moeilijk' }

  return (
    <div className="card p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col group border-2 border-transparent hover:border-zwijsen-primary-100">
      {/* Header with badges */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={clsx('badge', `badge-${exercise.question_type}`)}>
            {QUESTION_TYPE_LABELS[exercise.question_type]}
          </span>
        </div>
        <span className={clsx('badge', `badge-${exercise.status}`)} title={`Status: ${exercise.status}`}>
          {exercise.status === 'pending' && '⏳'}
          {exercise.status === 'approved' && '✓'}
          {exercise.status === 'rejected' && '✗'}
          {' '}
          {exercise.status === 'pending'
            ? 'Wacht'
            : exercise.status === 'approved'
              ? 'OK'
              : 'Afg.'}
        </span>
      </div>

      {/* Difficulty & Meta */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
        <span className="text-lg font-bold text-zwijsen-primary-500" title={difficultyLabel[exercise.difficulty_level as 1 | 2 | 3]}>
          {difficultyEmojis[exercise.difficulty_level as 1 | 2 | 3]}
        </span>
        <p className="text-xs text-gray-500 font-medium">
          Blok {exercise.block} · L{exercise.lesson} · Ex. {exercise.exercise_number}
        </p>
      </div>

      {/* Subject / Grade tags */}
      {(exercise.pdf_upload?.subject || exercise.pdf_upload?.grade) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {exercise.pdf_upload?.subject && (
            <span className="text-[11px] bg-zwijsen-primary-100 text-zwijsen-primary-700 px-2.5 py-1 rounded-full font-semibold">
              {exercise.pdf_upload.subject}
            </span>
          )}
          {exercise.pdf_upload?.grade && (
            <span className="text-[11px] bg-zwijsen-accent-100 text-zwijsen-accent-700 px-2.5 py-1 rounded-full font-semibold">
              {exercise.pdf_upload.grade}
            </span>
          )}
        </div>
      )}

      {/* Instruction */}
      <p className="text-sm text-gray-700 mb-4 line-clamp-3 flex-1 leading-relaxed font-medium">
        {exercise.original_content?.instruction}
      </p>

      {/* Word preview for vocabulary exercises */}
      {exercise.transformed_content?.flashcard?.word && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Woord</p>
          <span className="text-sm bg-zwijsen-primary-50 text-zwijsen-primary-700 px-3 py-1.5 rounded-lg font-bold">
            {exercise.transformed_content.flashcard.word}
          </span>
        </div>
      )}
      {exercise.transformed_content?.multiple_choice?.word && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Woord</p>
          <span className="text-sm bg-zwijsen-primary-50 text-zwijsen-primary-700 px-3 py-1.5 rounded-lg font-bold">
            {exercise.transformed_content.multiple_choice.word}
          </span>
        </div>
      )}
      {exercise.transformed_content?.cloze?.answer && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Woord</p>
          <span className="text-sm bg-zwijsen-primary-50 text-zwijsen-primary-700 px-3 py-1.5 rounded-lg font-bold">
            {exercise.transformed_content.cloze.answer}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-auto pt-4 border-t border-gray-100">
        <Link
          href={`/exercise/${exercise.id}`}
          className="btn-primary btn-sm flex-1 flex items-center justify-center gap-2 transition-all duration-300"
        >
          <Zap size={14} className="group-hover:animate-pulse" />
          <span>Oefenen</span>
        </Link>
        <Link
          href={`/review/${exercise.pdf_upload_id}`}
          className="btn-secondary btn-sm px-4"
          title="Bekijk origineel"
          aria-label="Bekijk origineel PDF"
        >
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  )
}
