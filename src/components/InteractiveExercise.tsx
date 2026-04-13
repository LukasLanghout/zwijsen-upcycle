'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import type {
  TransformedExercise,
  FillInExercise,
  StructuredHTEExercise,
  CreativeExercise,
  PatternPuzzleExercise,
  HTENumber,
} from '@/lib/types'
import clsx from 'clsx'

interface Props {
  exercise: TransformedExercise
}

export default function InteractiveExercise({ exercise }: Props) {
  return (
    <div className="card p-6">
      <p className="text-lg font-semibold text-gray-800 mb-5">
        {exercise.instruction}
      </p>
      {exercise.question_type === 'fill_in' && exercise.fill_in && (
        <FillInExerciseView data={exercise.fill_in} />
      )}
      {exercise.question_type === 'structured_hte' && exercise.structured_hte && (
        <StructuredHTEView data={exercise.structured_hte} />
      )}
      {exercise.question_type === 'creative' && exercise.creative && (
        <CreativeView data={exercise.creative} />
      )}
      {exercise.question_type === 'pattern_puzzle' && exercise.pattern_puzzle && (
        <PatternPuzzleView data={exercise.pattern_puzzle} />
      )}
    </div>
  )
}

// ── Fill-in Exercise ─────────────────────────────────────────
function FillInExerciseView({ data }: { data: FillInExercise }) {
  const [answers, setAnswers] = useState<string[]>(data.answer.map(() => ''))
  const [checked, setChecked] = useState(false)

  const check = () => setChecked(true)
  const reset = () => { setAnswers(data.answer.map(() => '')); setChecked(false) }

  const isCorrect = (i: number) =>
    parseInt(answers[i]) === data.answer[i]

  const allCorrect = data.answer.every((_, i) => isCorrect(i))

  return (
    <div>
      <div className="flex items-center gap-2 text-2xl font-bold flex-wrap">
        <span className="bg-zwijsen-blue-light text-zwijsen-blue px-3 py-1 rounded">
          {data.number}
        </span>
        <span>=</span>
        {data.answer.map((_, i) => (
          <span key={i} className="flex items-center gap-1">
            <input
              type="number"
              value={answers[i]}
              onChange={(e) => {
                const next = [...answers]
                next[i] = e.target.value
                setAnswers(next)
                setChecked(false)
              }}
              className={clsx(
                'answer-input',
                checked && (isCorrect(i) ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50')
              )}
              placeholder="?"
            />
            {data.labels[i] && (
              <span className="text-sm text-gray-500 ml-1">{data.labels[i]}</span>
            )}
            {i < data.answer.length - 1 && <span className="text-gray-400">+</span>}
          </span>
        ))}
      </div>

      {checked && (
        <div className={clsx(
          'mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
          allCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        )}>
          {allCorrect
            ? <><CheckCircle size={16} /> Goed gedaan!</>
            : <><XCircle size={16} /> Niet helemaal goed. Probeer opnieuw!</>}
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button onClick={check} className="btn-primary text-sm py-1.5 px-4">
          Controleren
        </button>
        <button onClick={reset} className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1">
          <RotateCcw size={14} /> Opnieuw
        </button>
      </div>
    </div>
  )
}

// ── Structured H-T-E Exercise ───────────────────────────────
function StructuredHTEView({ data }: { data: StructuredHTEExercise }) {
  const isSplit = data.mode === 'split'

  return (
    <div className="space-y-6">
      {data.numbers.map((num, i) => (
        <HTERow key={i} number={num} mode={data.mode} />
      ))}
    </div>
  )
}

function HTERow({ number, mode }: { number: HTENumber; mode: 'split' | 'combine' }) {
  const isSplit = mode === 'split'
  const fullNumber = number.H * 100 + number.T * 10 + number.E

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)

  const targets = isSplit
    ? { H: number.H, T: number.T, E: number.E }
    : { total: fullNumber }

  const expectedKeys = isSplit ? ['H', 'T', 'E'] : ['total']

  const isCorrect = (key: string) =>
    parseInt(answers[key] || '') === (targets as Record<string, number>)[key]

  const allCorrect = expectedKeys.every(isCorrect)

  const reset = () => { setAnswers({}); setChecked(false) }

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      {/* H-T-E header boxes */}
      <div className="flex gap-2 mb-3">
        {['H', 'T', 'E'].map((label) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div className="hte-header">{label}</div>
            {isSplit ? (
              <div className="hte-box text-zwijsen-blue font-bold">
                {label === 'H' ? Math.floor(fullNumber / 100) :
                  label === 'T' ? Math.floor((fullNumber % 100) / 10) :
                    fullNumber % 10}
              </div>
            ) : (
              <div className="hte-box bg-gray-100">
                {label === 'H' ? number.H :
                  label === 'T' ? number.T :
                    number.E}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Equation row */}
      <div className="flex items-center gap-2 text-lg font-semibold flex-wrap">
        {isSplit ? (
          <>
            <span className="text-zwijsen-blue">{fullNumber}</span>
            <span>=</span>
            {(['H', 'T', 'E'] as const).map((key, i) => (
              <span key={key} className="flex items-center gap-1">
                <input
                  type="number"
                  value={answers[key] ?? ''}
                  onChange={(e) => {
                    setAnswers((a) => ({ ...a, [key]: e.target.value }))
                    setChecked(false)
                  }}
                  className={clsx(
                    'answer-input',
                    checked && (isCorrect(key) ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50')
                  )}
                  placeholder="?"
                />
                {i < 2 && <span className="text-gray-400">+</span>}
              </span>
            ))}
          </>
        ) : (
          <>
            <span>{number.H * 100}</span>
            <span className="text-gray-400">+</span>
            <span>{number.T * 10}</span>
            <span className="text-gray-400">+</span>
            <span>{number.E}</span>
            <span>=</span>
            <input
              type="number"
              value={answers['total'] ?? ''}
              onChange={(e) => {
                setAnswers({ total: e.target.value })
                setChecked(false)
              }}
              className={clsx(
                'answer-input w-20',
                checked && (isCorrect('total') ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50')
              )}
              placeholder="?"
            />
          </>
        )}
      </div>

      {checked && (
        <div className={clsx(
          'mt-3 flex items-center gap-2 px-3 py-1.5 rounded text-sm',
          allCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        )}>
          {allCorrect
            ? <><CheckCircle size={14} /> Goed!</>
            : <><XCircle size={14} /> Probeer opnieuw</>}
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => setChecked(true)}
          className="btn-primary text-xs py-1 px-3"
        >
          Controleren
        </button>
        <button onClick={reset} className="btn-secondary text-xs py-1 px-2 flex items-center gap-1">
          <RotateCcw size={12} />
        </button>
      </div>
    </div>
  )
}

// ── Creative Exercise ────────────────────────────────────────
function CreativeView({ data }: { data: CreativeExercise }) {
  const [combinations, setCombinations] = useState<string[][]>(
    Array(data.num_combinations).fill(null).map(() => ['', '', ''])
  )
  const [checked, setChecked] = useState(false)

  const isValidCombination = (combo: string[]) => {
    const digits = combo.map(Number)
    if (digits.some(isNaN)) return false
    if (digits.some((d) => d < 0 || d > 9)) return false
    // Check all digits are from the available set
    const available = [...data.digits]
    for (const d of digits) {
      const idx = available.indexOf(d)
      if (idx === -1) return false
      available.splice(idx, 1)
    }
    return true
  }

  const reset = () => {
    setCombinations(Array(data.num_combinations).fill(null).map(() => ['', '', '']))
    setChecked(false)
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <span className="text-sm text-gray-600 font-medium">Beschikbare cijfers:</span>
        {data.digits.map((d, i) => (
          <span
            key={i}
            className="w-8 h-8 border-2 border-zwijsen-pink bg-zwijsen-pink-light text-zwijsen-pink flex items-center justify-center rounded font-bold"
          >
            {d}
          </span>
        ))}
      </div>

      <div className="space-y-3">
        {combinations.map((combo, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-sm text-gray-400 w-4">{i + 1}.</span>
            {combo.map((val, j) => (
              <input
                key={j}
                type="number"
                min="0"
                max="9"
                value={val}
                onChange={(e) => {
                  const next = combinations.map((c, ci) =>
                    ci === i ? c.map((v, vi) => (vi === j ? e.target.value : v)) : c
                  )
                  setCombinations(next)
                  setChecked(false)
                }}
                className={clsx(
                  'answer-input',
                  checked &&
                    (isValidCombination(combo)
                      ? 'border-green-400 bg-green-50'
                      : 'border-red-400 bg-red-50')
                )}
                placeholder="?"
              />
            ))}
            {checked && (
              isValidCombination(combo)
                ? <CheckCircle size={16} className="text-green-500" />
                : <XCircle size={16} className="text-red-400" />
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <button onClick={() => setChecked(true)} className="btn-primary text-sm py-1.5 px-4">
          Controleren
        </button>
        <button onClick={reset} className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1">
          <RotateCcw size={14} /> Opnieuw
        </button>
      </div>
    </div>
  )
}

// ── Pattern Puzzle ───────────────────────────────────────────
const SHAPE_EMOJIS: Record<string, string> = {
  circle: '●',
  square: '■',
  heart: '♥',
  triangle: '▲',
}

function PatternPuzzleView({ data }: { data: PatternPuzzleExercise }) {
  const [shapeAnswers, setShapeAnswers] = useState<Record<string, string>>(
    Object.fromEntries(data.shapes.map((s) => [s.name, '']))
  )
  const [groupAnswers, setGroupAnswers] = useState<Record<number, string>>(
    Object.fromEntries(
      data.groups
        .filter((g) => !g.is_known)
        .map((_, i) => [i, ''])
    )
  )
  const [checked, setChecked] = useState(false)

  const isShapeCorrect = (name: string) =>
    parseInt(shapeAnswers[name]) ===
    data.shapes.find((s) => s.name === name)?.value

  const isGroupCorrect = (groupIdx: number) => {
    const group = data.groups[groupIdx]
    if (group.is_known) return true
    return parseInt(groupAnswers[groupIdx]) === group.total
  }

  const allCorrect =
    data.shapes.every((s) => isShapeCorrect(s.name)) &&
    data.groups.every((_, i) => isGroupCorrect(i))

  const reset = () => {
    setShapeAnswers(Object.fromEntries(data.shapes.map((s) => [s.name, ''])))
    setGroupAnswers(
      Object.fromEntries(data.groups.filter((g) => !g.is_known).map((_, i) => [i, '']))
    )
    setChecked(false)
  }

  return (
    <div>
      {/* Shape value inputs */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 font-medium mb-2">Wat zijn de figuren waard?</p>
        <div className="flex gap-4">
          {data.shapes.map((shape) => (
            <div key={shape.name} className="flex items-center gap-2">
              <span className="text-2xl">
                {SHAPE_EMOJIS[shape.name] || shape.name}
              </span>
              <span>=</span>
              <input
                type="number"
                value={shapeAnswers[shape.name]}
                onChange={(e) => {
                  setShapeAnswers((a) => ({ ...a, [shape.name]: e.target.value }))
                  setChecked(false)
                }}
                className={clsx(
                  'answer-input',
                  checked &&
                    (isShapeCorrect(shape.name)
                      ? 'border-green-400 bg-green-50'
                      : 'border-red-400 bg-red-50')
                )}
                placeholder="?"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Group totals */}
      <div className="grid grid-cols-2 gap-3">
        {data.groups.map((group, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-3">
            <div className="flex flex-wrap gap-1 mb-2">
              {Object.entries(group.counts).map(([shape, count]) =>
                Array(count)
                  .fill(null)
                  .map((_, j) => (
                    <span key={`${shape}-${j}`} className="text-xl">
                      {SHAPE_EMOJIS[shape] || shape}
                    </span>
                  ))
              )}
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>=</span>
              {group.is_known ? (
                <span className="font-bold text-zwijsen-blue bg-zwijsen-blue-light px-2 py-0.5 rounded">
                  {group.total}
                </span>
              ) : (
                <input
                  type="number"
                  value={groupAnswers[i] ?? ''}
                  onChange={(e) => {
                    setGroupAnswers((a) => ({ ...a, [i]: e.target.value }))
                    setChecked(false)
                  }}
                  className={clsx(
                    'answer-input',
                    checked &&
                      (isGroupCorrect(i)
                        ? 'border-green-400 bg-green-50'
                        : 'border-red-400 bg-red-50')
                  )}
                  placeholder="?"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {checked && (
        <div className={clsx(
          'mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
          allCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        )}>
          {allCorrect
            ? <><CheckCircle size={16} /> Uitstekend!</>
            : <><XCircle size={16} /> Bijna! Controleer je antwoorden</>}
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button onClick={() => setChecked(true)} className="btn-primary text-sm py-1.5 px-4">
          Controleren
        </button>
        <button onClick={reset} className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1">
          <RotateCcw size={14} /> Opnieuw
        </button>
      </div>
    </div>
  )
}
