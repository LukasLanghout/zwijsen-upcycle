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
import { ShapeVisualizer } from './ShapeVisualizer'
import clsx from 'clsx'

interface Props {
  exercise: TransformedExercise
}

export default function InteractiveExercise({ exercise }: Props) {
  return (
    <div className="card p-8 md:p-10">
      {/* Instruction - Improved Typography */}
      <div className="mb-8">
        <p className="text-2xl font-bold text-gray-900 leading-relaxed">
          {exercise.instruction}
        </p>
      </div>

      {/* Exercise Content */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 md:p-10 border-2 border-gray-100">
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
          isDigitCompositionPuzzle(exercise.pattern_puzzle)
            ? <DigitCompositionView data={exercise.pattern_puzzle} />
            : <PatternPuzzleView data={exercise.pattern_puzzle} />
        )}
      </div>
    </div>
  )
}

// ── Fill-in Exercise ─────────────────────────────────────────
function FillInExerciseView({ data }: { data: FillInExercise }) {
  const [answers, setAnswers] = useState<string[]>(data.answer.map(() => ''))
  const [checked, setChecked] = useState(false)

  const check = () => setChecked(true)
  const reset = () => { setAnswers(data.answer.map(() => '')); setChecked(false) }

  // Check per vak: accepteer zowel de plaatswaarde (700) als het cijfer (7) voor H
  const placeValues = [100, 10, 1]
  const isCorrect = (i: number) => {
    const entered = parseInt(answers[i])
    const stored = data.answer[i]
    // Exacte match (700) of cijfer-match (7) op de juiste positie
    return entered === stored || entered === stored * placeValues[i]
  }

  // Hoofdcheck: som van ingevulde waarden moet gelijk zijn aan het getal
  const allCorrect =
    answers.every((a) => a !== '') &&
    answers.reduce((sum, a) => sum + parseInt(a || '0'), 0) === data.number

  return (
    <div>
      {/* Main equation with better sizing */}
      <div className="mb-8 flex items-center gap-4 flex-wrap justify-center p-6 bg-white rounded-xl border-2 border-gray-100">
        <span className="bg-gradient-to-br from-zwijsen-primary-100 to-zwijsen-primary-50 text-zwijsen-primary-600 px-6 py-3 rounded-xl font-bold text-3xl md:text-4xl shadow-sm">
          {data.number}
        </span>
        <span className="text-3xl md:text-4xl font-bold text-gray-400">=</span>
        <div className="flex items-center gap-3 flex-wrap">
          {data.answer.map((_, i) => (
            <span key={i} className="flex items-center gap-2">
              <input
                type="number"
                value={answers[i]}
                onChange={(e) => {
                  const next = [...answers]
                  next[i] = e.target.value
                  setAnswers(next)
                  setChecked(false)
                }}
                inputMode="numeric"
                className={clsx(
                  'answer-input text-2xl text-center font-bold',
                  'hover:border-zwijsen-primary-400',
                  checked && (isCorrect(i)
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-red-500 bg-red-50 text-red-700 shake'
                  )
                )}
                placeholder="?"
                aria-label={`Vak ${i + 1}`}
              />
              {data.labels[i] && (
                <span className="text-sm font-semibold text-gray-600 ml-1">
                  {data.labels[i]}
                </span>
              )}
              {i < data.answer.length - 1 && <span className="text-2xl text-gray-300">+</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Feedback message with animation */}
      {checked && (
        <div
          className={clsx(
            'mb-6 flex items-center gap-3 px-6 py-4 rounded-xl text-base font-bold transition-all duration-300',
            allCorrect
              ? 'bg-green-100 text-green-800 border-2 border-green-300 animate-pulse'
              : 'bg-red-100 text-red-800 border-2 border-red-300'
          )}
        >
          {allCorrect ? (
            <>
              <CheckCircle size={24} className="flex-shrink-0" />
              <span>Excellent! Je hebt het goed opgelost! 🎉</span>
            </>
          ) : (
            <>
              <XCircle size={24} className="flex-shrink-0" />
              <span>Niet helemaal. Kijk naar de vakken in rood en probeer opnieuw.</span>
            </>
          )}
        </div>
      )}

      {/* Action buttons - Improved */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={check}
          disabled={answers.some((a) => a === '')}
          className="btn-primary flex-1 md:flex-none py-3 px-8 text-base font-bold transition-all duration-200"
          aria-label="Controleer je antwoord"
        >
          Controleren
        </button>
        <button
          onClick={reset}
          className="btn-secondary py-3 px-6 flex items-center justify-center gap-2 font-bold transition-all duration-200"
          aria-label="Zet alle vakken leeg"
        >
          <RotateCcw size={18} />
          <span>Opnieuw</span>
        </button>
      </div>

      {/* Help text */}
      {!checked && (
        <p className="text-sm text-gray-600 mt-6 text-center font-medium">
          💡 Tip: Je kunt het getal verdelen in honderdtallen, tientallen en eenheden
        </p>
      )}
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

  const expectedKeys = isSplit ? ['H', 'T', 'E'] : ['total']

  const isCorrect = (key: string) => {
    const entered = parseInt(answers[key] || '')
    if (!isSplit) return entered === fullNumber
    // Voor split: accepteer plaatswaarde (700) of cijfer (7)
    if (key === 'H') return entered === number.H * 100 || entered === number.H
    if (key === 'T') return entered === number.T * 10  || entered === number.T
    if (key === 'E') return entered === number.E
    return false
  }

  // Hoofdcheck voor split: som van ingevulde waarden == volledig getal
  const allCorrect = isSplit
    ? expectedKeys.every((k) => answers[k] !== '') &&
      (parseInt(answers['H'] || '0') + parseInt(answers['T'] || '0') + parseInt(answers['E'] || '0')) === fullNumber
    : isCorrect('total')

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
  // English names
  circle: '●',
  square: '■',
  heart: '♥',
  triangle: '▲',
  star: '★',
  diamond: '◆',
  pentagon: '⬠',
  // Dutch names
  cirkel: '●',
  vierkant: '■',
  hart: '♥',
  driehoek: '▲',
  ster: '★',
  ruit: '◆',
  vijfhoek: '⬠',
}

// Detect if this is a place-value digit composition puzzle
// e.g. 7 triangles (×1000) + 1 heart (×100) + 2 squares (×10) + 3 circles (×1) = 7123
function isDigitCompositionPuzzle(data: PatternPuzzleExercise): boolean {
  if (!data.shapes || data.shapes.length < 2) return false
  if (!data.groups || data.groups.length !== 1) return false
  const placeValues = new Set([1, 10, 100, 1000, 10000])
  // All shapes must have place-value values
  const allPlaceValues = data.shapes.every((s) => placeValues.has(s.value))
  if (!allPlaceValues) return false
  // Shape values must be unique (each shape = one place value)
  const uniqueValues = new Set(data.shapes.map((s) => s.value))
  return uniqueValues.size === data.shapes.length
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
    <div className="space-y-6">
      {/* Shape value legend */}
      <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
        <p className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">📊 Wat zijn de vormen waard?</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.shapes.map((shape) => (
            <div key={shape.name} className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
              <ShapeVisualizer shape={shape.name} size={56} color="#A81D7B" filled />
              <span className="text-xs text-gray-500 font-semibold">= ?</span>
              <input
                type="number"
                value={shapeAnswers[shape.name]}
                onChange={(e) => {
                  setShapeAnswers((a) => ({ ...a, [shape.name]: e.target.value }))
                  setChecked(false)
                }}
                inputMode="numeric"
                className={clsx(
                  'w-16 px-2 py-1 text-center border-2 rounded-lg font-bold text-lg',
                  checked &&
                    (isShapeCorrect(shape.name)
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50')
                )}
                placeholder="?"
                aria-label={`Waarde van ${shape.name}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Group boxes - like original workbook layout */}
      <div>
        <p className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">📦 Groepen telstallen</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.groups.map((group, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:shadow-lg transition-shadow">
              {/* Shapes display - scattered like original */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 mb-4 min-h-24 flex flex-wrap gap-3 justify-center items-center">
                {Object.entries(group.counts).map(([shape, count]) =>
                  Array(count)
                    .fill(null)
                    .map((_, j) => (
                      <div key={`${shape}-${j}`} className="transform transition-transform hover:scale-125">
                        <ShapeVisualizer
                          shape={shape}
                          size={40}
                          color="#A81D7B"
                          filled
                        />
                      </div>
                    ))
                )}
              </div>

              {/* Total input */}
              <div className="flex items-center justify-center gap-3 text-lg font-bold">
                <span className="text-gray-600">=</span>
                {group.is_known ? (
                  <div className="px-6 py-3 bg-zwijsen-primary-100 text-zwijsen-primary-700 font-bold text-2xl rounded-lg border-2 border-zwijsen-primary-300">
                    {group.total}
                  </div>
                ) : (
                  <input
                    type="number"
                    value={groupAnswers[i] ?? ''}
                    onChange={(e) => {
                      setGroupAnswers((a) => ({ ...a, [i]: e.target.value }))
                      setChecked(false)
                    }}
                    inputMode="numeric"
                    className={clsx(
                      'w-20 px-4 py-3 text-center border-2 rounded-lg font-bold text-2xl',
                      checked &&
                        (isGroupCorrect(i)
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50')
                    )}
                    placeholder="?"
                    aria-label={`Antwoord voor groep ${i + 1}`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback message */}
      {checked && (
        <div className={clsx(
          'flex items-center gap-3 px-6 py-4 rounded-xl text-base font-bold transition-all duration-300',
          allCorrect
            ? 'bg-green-100 text-green-800 border-2 border-green-300'
            : 'bg-red-100 text-red-800 border-2 border-red-300'
        )}>
          {allCorrect ? (
            <>
              <CheckCircle size={24} className="flex-shrink-0" />
              <span>Perfect! Je hebt alles correct opgelost! 🎉</span>
            </>
          ) : (
            <>
              <XCircle size={24} className="flex-shrink-0" />
              <span>Bijna! Controleer je antwoorden en probeer opnieuw.</span>
            </>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setChecked(true)}
          className="btn-primary flex-1 py-3 px-6 text-base font-bold"
          aria-label="Controleer je antwoorden"
        >
          Controleren
        </button>
        <button
          onClick={reset}
          className="btn-secondary py-3 px-6 flex items-center justify-center gap-2 font-bold"
          aria-label="Zet alles leeg"
        >
          <RotateCcw size={20} /> Opnieuw
        </button>
      </div>
    </div>
  )
}

// ── Digit Composition Puzzle (Place Value with Shapes) ──────
// Specialized view for puzzles like Opdracht 7 where:
//  - triangle = 1000 (duizendtallen)
//  - heart    = 100  (honderdtallen)
//  - square   = 10   (tientallen)
//  - circle   = 1    (eenheden)
// Student must calculate the total number represented.
function DigitCompositionView({ data }: { data: PatternPuzzleExercise }) {
  const group = data.groups[0]

  // Sort shapes by place value DESC (thousands first)
  const sortedShapes = [...data.shapes].sort((a, b) => b.value - a.value)

  // Calculate the correct total LOCALLY from counts × values
  // This protects us from Groq getting the total wrong
  const calculatedTotal = sortedShapes.reduce((sum, shape) => {
    const count = group.counts[shape.name] || 0
    return sum + count * shape.value
  }, 0)

  const [answer, setAnswer] = useState('')
  const [checked, setChecked] = useState(false)

  const isCorrect = parseInt(answer) === calculatedTotal

  // Dutch place value labels
  const getPlaceLabel = (value: number): string => {
    if (value === 10000) return 'Tienduizendtallen'
    if (value === 1000) return 'Duizendtallen'
    if (value === 100) return 'Honderdtallen'
    if (value === 10) return 'Tientallen'
    if (value === 1) return 'Eenheden'
    return ''
  }

  const reset = () => {
    setAnswer('')
    setChecked(false)
  }

  return (
    <div className="space-y-8">
      {/* Place value columns - each shape gets its own column */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${sortedShapes.length}, minmax(0, 1fr))` }}
      >
        {sortedShapes.map((shape) => {
          const count = group.counts[shape.name] || 0
          return (
            <div
              key={shape.name}
              className="bg-white rounded-xl border-2 border-zwijsen-primary-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Header - place value label */}
              <div className="bg-gradient-to-br from-zwijsen-primary-100 to-zwijsen-primary-50 px-3 py-2 border-b-2 border-zwijsen-primary-200">
                <div className="text-center">
                  <div className="text-xs font-bold text-zwijsen-primary-700 uppercase tracking-wide">
                    {getPlaceLabel(shape.value)}
                  </div>
                  <div className="text-xs text-zwijsen-primary-600 font-semibold">
                    1 = {shape.value}
                  </div>
                </div>
              </div>

              {/* Shapes grid */}
              <div className="bg-gradient-to-br from-gray-50 to-white p-4 min-h-32 flex flex-wrap gap-2 justify-center items-center">
                {count === 0 ? (
                  <span className="text-gray-400 text-xs italic">(geen)</span>
                ) : (
                  Array(count)
                    .fill(null)
                    .map((_, j) => (
                      <div
                        key={j}
                        className="transform transition-transform duration-200 hover:scale-125"
                      >
                        <ShapeVisualizer
                          shape={shape.name}
                          size={32}
                          color="#A81D7B"
                          filled
                        />
                      </div>
                    ))
                )}
              </div>

              {/* Calculation footer */}
              <div className="bg-white border-t-2 border-gray-100 px-3 py-3 text-center">
                <div className="text-sm font-bold text-gray-700">
                  {count} × {shape.value}
                </div>
                <div className="text-lg font-bold text-zwijsen-primary-600 mt-1">
                  = {count * shape.value}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main answer row */}
      <div className="bg-gradient-to-br from-zwijsen-primary-50 via-white to-zwijsen-accent-50 rounded-2xl p-6 md:p-8 border-2 border-zwijsen-primary-200">
        <p className="text-base font-bold text-gray-800 mb-4 text-center">
          💡 Tel alles bij elkaar op: wat is het getal?
        </p>

        {/* Sum equation */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
          {sortedShapes.map((shape, i) => {
            const count = group.counts[shape.name] || 0
            return (
              <span key={shape.name} className="flex items-center gap-2">
                <span className="bg-white px-3 py-2 rounded-lg border-2 border-gray-200 font-bold text-lg text-gray-700">
                  {count * shape.value}
                </span>
                {i < sortedShapes.length - 1 && (
                  <span className="text-2xl font-bold text-gray-400">+</span>
                )}
              </span>
            )
          })}
          <span className="text-2xl font-bold text-gray-400 mx-2">=</span>
          <input
            type="number"
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value)
              setChecked(false)
            }}
            inputMode="numeric"
            className={clsx(
              'w-40 px-4 py-3 text-center border-2 rounded-xl font-bold text-3xl',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zwijsen-primary-500',
              !checked && 'border-zwijsen-primary-300 bg-white hover:border-zwijsen-primary-400',
              checked &&
                (isCorrect
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-red-500 bg-red-50 text-red-700 shake')
            )}
            placeholder="?"
            aria-label="Antwoord - het volledige getal"
          />
        </div>
      </div>

      {/* Feedback */}
      {checked && (
        <div
          className={clsx(
            'flex items-center gap-3 px-6 py-4 rounded-xl text-base font-bold transition-all duration-300',
            isCorrect
              ? 'bg-green-100 text-green-800 border-2 border-green-300 animate-pulse'
              : 'bg-red-100 text-red-800 border-2 border-red-300'
          )}
        >
          {isCorrect ? (
            <>
              <CheckCircle size={24} className="flex-shrink-0" />
              <span>Helemaal goed! Het getal is {calculatedTotal}. 🎉</span>
            </>
          ) : (
            <>
              <XCircle size={24} className="flex-shrink-0" />
              <span>Niet helemaal. Tel elke vorm nog eens en vermenigvuldig met de plaatswaarde.</span>
            </>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setChecked(true)}
          disabled={!answer}
          className="btn-primary flex-1 py-3 px-6 text-base font-bold"
          aria-label="Controleer je antwoord"
        >
          Controleren
        </button>
        <button
          onClick={reset}
          className="btn-secondary py-3 px-6 flex items-center justify-center gap-2 font-bold"
          aria-label="Zet het vak leeg"
        >
          <RotateCcw size={20} /> Opnieuw
        </button>
      </div>

      {/* Help text */}
      {!checked && (
        <p className="text-sm text-gray-600 text-center font-medium">
          💡 Tip: Elke vorm staat voor een plaatswaarde. Tel hoeveel er van elke vorm zijn en
          vermenigvuldig met de plaatswaarde.
        </p>
      )}
    </div>
  )
}
