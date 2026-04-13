'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Filter, BookOpen, ChevronRight, Zap } from 'lucide-react'
import type { Exercise, QuestionType, DifficultyLevel, ExerciseStatus } from '@/lib/types'
import clsx from 'clsx'

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  fill_in: 'Invulvraag',
  structured_hte: 'H-T-E Structuur',
  creative: 'Creatief',
  pattern_puzzle: 'Patroonpuzzel',
}

export default function LibraryPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '' as ExerciseStatus | '',
    questionType: '' as QuestionType | '',
    difficulty: '' as string,
    search: '',
  })

  const fetchExercises = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.questionType) params.set('questionType', filters.questionType)
    if (filters.difficulty) params.set('difficulty', filters.difficulty)

    const res = await fetch(`/api/exercises?${params}`)
    const data = await res.json()
    setExercises(data.exercises || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchExercises()
  }, [filters.status, filters.questionType, filters.difficulty])

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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Oefeningen bibliotheek</h1>
          <p className="text-gray-500 mt-1">
            {exercises.length} oefeningen gevonden
          </p>
        </div>
        <Link href="/upload" className="btn-primary flex items-center gap-2">
          <BookOpen size={16} />
          Nieuwe PDF
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 flex items-center gap-4 flex-wrap">
        <Filter size={16} className="text-gray-400" />

        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Zoeken..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zwijsen-blue"
          />
        </div>

        {/* Status filter */}
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as ExerciseStatus | '' }))}
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zwijsen-blue"
        >
          <option value="">Alle statussen</option>
          <option value="pending">In afwachting</option>
          <option value="approved">Goedgekeurd</option>
          <option value="rejected">Afgewezen</option>
        </select>

        {/* Type filter */}
        <select
          value={filters.questionType}
          onChange={(e) =>
            setFilters((f) => ({ ...f, questionType: e.target.value as QuestionType | '' }))
          }
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zwijsen-blue"
        >
          <option value="">Alle typen</option>
          <option value="fill_in">Invulvraag</option>
          <option value="structured_hte">H-T-E Structuur</option>
          <option value="creative">Creatief</option>
          <option value="pattern_puzzle">Patroonpuzzel</option>
        </select>

        {/* Difficulty filter */}
        <select
          value={filters.difficulty}
          onChange={(e) => setFilters((f) => ({ ...f, difficulty: e.target.value }))}
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zwijsen-blue"
        >
          <option value="">Alle niveaus</option>
          <option value="1">Makkelijk</option>
          <option value="2">Gemiddeld</option>
          <option value="3">Moeilijk</option>
        </select>
      </div>

      {/* Exercise grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-3 w-1/2" />
              <div className="h-3 bg-gray-100 rounded mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center text-gray-500">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium">Geen oefeningen gevonden</p>
          <p className="text-sm mt-1">
            Pas de filters aan of{' '}
            <Link href="/upload" className="text-zwijsen-blue underline">
              upload een nieuwe PDF
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </div>
      )}
    </div>
  )
}

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const difficultyColors = {
    1: 'text-green-600 bg-green-100',
    2: 'text-yellow-600 bg-yellow-100',
    3: 'text-red-600 bg-red-100',
  }

  const difficultyLabel = { 1: 'Makkelijk', 2: 'Gemiddeld', 3: 'Moeilijk' }

  return (
    <div className="card p-5 hover:shadow-md transition-shadow flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={clsx('badge', `badge-${exercise.question_type}`)}
          >
            {QUESTION_TYPE_LABELS[exercise.question_type]}
          </span>
          <span
            className={clsx(
              'badge',
              difficultyColors[exercise.difficulty_level as 1 | 2 | 3]
            )}
          >
            {difficultyLabel[exercise.difficulty_level as 1 | 2 | 3]}
          </span>
        </div>
        <span className={clsx('badge', `badge-${exercise.status}`)}>
          {exercise.status === 'pending'
            ? 'Wacht'
            : exercise.status === 'approved'
              ? 'OK'
              : 'Afg.'}
        </span>
      </div>

      {/* Meta */}
      <div className="text-xs text-gray-400 mb-2">
        Blok {exercise.block} · Les {exercise.lesson} · Oef. {exercise.exercise_number}
      </div>

      {/* Instruction */}
      <p className="text-sm text-gray-700 mb-3 line-clamp-2 flex-1">
        {exercise.original_content?.instruction}
      </p>

      {/* Numbers preview */}
      {exercise.original_content?.given_numbers && (
        <div className="flex gap-1 flex-wrap mb-3">
          {exercise.original_content.given_numbers.slice(0, 4).map((n, i) => (
            <span
              key={i}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono"
            >
              {n}
            </span>
          ))}
          {exercise.original_content.given_numbers.length > 4 && (
            <span className="text-xs text-gray-400">
              +{exercise.original_content.given_numbers.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100">
        <Link
          href={`/exercise/${exercise.id}`}
          className="btn-primary flex items-center gap-1.5 text-sm py-1.5 px-3 flex-1 justify-center"
        >
          <Zap size={12} />
          Spelen
        </Link>
        <Link
          href={`/review/${exercise.pdf_upload_id}`}
          className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3"
          title="Bekijk in review"
        >
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  )
}
