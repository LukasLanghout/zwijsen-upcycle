'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, RotateCcw, Eye, EyeOff } from 'lucide-react'
import type {
  TransformedExercise,
  FlashcardExercise,
  MultipleChoiceExercise,
  ClozeExercise,
} from '@/lib/types'
import clsx from 'clsx'

interface Props {
  exercise: TransformedExercise
  onComplete?: (correct: boolean) => void
  quizMode?: boolean
}

export default function InteractiveExercise({ exercise, onComplete, quizMode = false }: Props) {
  return (
    <div className="card p-8 md:p-10 border-0 shadow-lg">
      <div className="mb-10 pb-8 border-b-2 border-gray-100">
        <p className="text-2xl font-bold text-gray-900 leading-relaxed">
          {exercise.instruction}
        </p>
        {exercise.question_type === 'flashcard' && (
          <p className="text-sm text-zwijsen-primary-600 mt-4 pl-4 border-l-4 border-zwijsen-primary-300 font-medium">
            💡 <strong>Tip:</strong> Probeer de definitie te onthouden voordat je de kaart omdraait.
          </p>
        )}
        {exercise.question_type === 'cloze' && (
          <p className="text-sm text-zwijsen-primary-600 mt-4 pl-4 border-l-4 border-zwijsen-primary-300 font-medium">
            💡 <strong>Tip:</strong> Lees de definitie als hint als je het woord niet weet.
          </p>
        )}
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 md:p-10 border-2 border-gray-100">
        {exercise.question_type === 'flashcard' && exercise.flashcard && (
          <FlashcardView data={exercise.flashcard} onComplete={onComplete} quizMode={quizMode} />
        )}
        {exercise.question_type === 'multiple_choice' && exercise.multiple_choice && (
          <MultipleChoiceView data={exercise.multiple_choice} onComplete={onComplete} quizMode={quizMode} />
        )}
        {exercise.question_type === 'cloze' && exercise.cloze && (
          <ClozeView data={exercise.cloze} onComplete={onComplete} quizMode={quizMode} />
        )}
      </div>
    </div>
  )
}

interface SubProps {
  onComplete?: (correct: boolean) => void
  quizMode?: boolean
}

const WORD_TYPE_LABELS: Record<string, string> = {
  zelfstandig_naamwoord: 'zelfstandig naamwoord',
  werkwoord: 'werkwoord',
  bijvoeglijk_naamwoord: 'bijvoeglijk naamwoord',
  uitdrukking: 'uitdrukking',
  overig: 'woord',
}

// ── Flashcard ────────────────────────────────────────────────
function FlashcardView({ data, onComplete, quizMode = false }: { data: FlashcardExercise } & SubProps) {
  const [flipped, setFlipped] = useState(false)
  const [answered, setAnswered] = useState<boolean | null>(null)

  const handleAnswer = (correct: boolean) => {
    setAnswered(correct)
    onComplete?.(correct)
  }

  const reset = () => {
    setFlipped(false)
    setAnswered(null)
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Card */}
      <div
        className={clsx(
          'w-full max-w-lg rounded-2xl border-2 cursor-pointer transition-all duration-300 select-none',
          flipped
            ? 'bg-zwijsen-primary-50 border-zwijsen-primary-300 shadow-lg'
            : 'bg-white border-gray-200 shadow-md hover:shadow-lg hover:border-zwijsen-primary-200'
        )}
        onClick={() => setFlipped(!flipped)}
      >
        {!flipped ? (
          /* Voorkant: het woord */
          <div className="p-10 flex flex-col items-center gap-4 min-h-48 justify-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {WORD_TYPE_LABELS[data.word_type] ?? data.word_type}
            </span>
            <p className="text-4xl font-bold text-gray-900 text-center">{data.word}</p>
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-4">
              <Eye size={16} />
              <span>Klik om de definitie te zien</span>
            </div>
          </div>
        ) : (
          /* Achterkant: definitie + voorbeeldzin */
          <div className="p-10 flex flex-col gap-6 min-h-48">
            <div>
              <p className="text-xs font-bold text-zwijsen-primary-500 uppercase tracking-widest mb-2">
                Definitie
              </p>
              <p className="text-2xl font-bold text-gray-900">{data.definition}</p>
            </div>
            <div className="border-t border-zwijsen-primary-200 pt-4">
              <p className="text-xs font-bold text-zwijsen-primary-500 uppercase tracking-widest mb-2">
                Voorbeeld
              </p>
              <p className="text-lg text-gray-700 italic">{data.example_sentence}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-zwijsen-primary-400 mt-2">
              <EyeOff size={14} />
              <span>Klik om terug te draaien</span>
            </div>
          </div>
        )}
      </div>

      {/* Zelfbeoordeling na omdraaien */}
      {flipped && answered === null && (
        <div className="flex flex-col items-center gap-3 w-full max-w-lg">
          <p className="text-sm font-semibold text-gray-600">Wist je het?</p>
          <div className="flex gap-4 w-full">
            <button
              onClick={() => handleAnswer(false)}
              className="flex-1 py-4 px-6 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 font-bold hover:bg-red-100 hover:border-red-300 transition-all flex items-center justify-center gap-2"
            >
              <XCircle size={20} /> Nee, nog oefenen
            </button>
            <button
              onClick={() => handleAnswer(true)}
              className="flex-1 py-4 px-6 rounded-xl border-2 border-green-200 bg-green-50 text-green-700 font-bold hover:bg-green-100 hover:border-green-300 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} /> Ja, ik wist het!
            </button>
          </div>
        </div>
      )}

      {/* Resultaat */}
      {answered !== null && (
        <div className={clsx(
          'w-full max-w-lg flex items-center gap-4 px-6 py-4 rounded-2xl font-bold border-2',
          answered
            ? 'bg-green-50 text-green-800 border-green-300'
            : 'bg-orange-50 text-orange-800 border-orange-300'
        )}>
          {answered ? (
            <>
              <CheckCircle size={24} className="flex-shrink-0 text-green-600" />
              <div>
                <p className="font-bold">Goed gedaan! 🎉</p>
                <p className="text-sm font-medium opacity-80">Je kende de definitie al.</p>
              </div>
            </>
          ) : (
            <>
              <RotateCcw size={24} className="flex-shrink-0 text-orange-600" />
              <div>
                <p className="font-bold">Blijven oefenen!</p>
                <p className="text-sm font-medium opacity-80">Dit woord nog een keer bekijken.</p>
              </div>
            </>
          )}
        </div>
      )}

      {!quizMode && answered !== null && (
        <button
          onClick={reset}
          className="btn-secondary py-3 px-6 flex items-center gap-2 font-bold"
        >
          <RotateCcw size={16} /> Opnieuw
        </button>
      )}
    </div>
  )
}

// ── Multiple Choice ──────────────────────────────────────────
function MultipleChoiceView({ data, onComplete, quizMode = false }: { data: MultipleChoiceExercise } & SubProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)

  const isCorrect = selected === data.correct_index

  const reset = () => {
    setSelected(null)
    setChecked(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Het woord */}
      <div className="text-center py-6 px-8 bg-white rounded-2xl border-2 border-gray-200 shadow-sm">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
          {WORD_TYPE_LABELS[data.word_type] ?? data.word_type}
        </p>
        <p className="text-4xl font-bold text-gray-900">{data.word}</p>
      </div>

      {/* Opties */}
      <div className="grid gap-3">
        {data.options.map((option, i) => {
          const isSelected = selected === i
          const showResult = checked
          const isThisCorrect = i === data.correct_index

          return (
            <button
              key={i}
              onClick={() => {
                if (!checked) setSelected(i)
              }}
              disabled={checked}
              className={clsx(
                'w-full text-left px-6 py-4 rounded-xl border-2 font-medium text-base transition-all duration-200',
                // Default state
                !isSelected && !showResult && 'bg-white border-gray-200 hover:border-zwijsen-primary-300 hover:bg-zwijsen-primary-50',
                // Selected but not checked
                isSelected && !showResult && 'bg-zwijsen-primary-50 border-zwijsen-primary-400 text-zwijsen-primary-700 font-bold',
                // After check: correct option
                showResult && isThisCorrect && 'bg-green-50 border-green-500 text-green-800 font-bold',
                // After check: wrong selected option
                showResult && isSelected && !isThisCorrect && 'bg-red-50 border-red-500 text-red-800 font-bold',
                // After check: other unselected options
                showResult && !isSelected && !isThisCorrect && 'bg-gray-50 border-gray-200 text-gray-400',
              )}
            >
              <div className="flex items-center gap-4">
                <span className={clsx(
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0',
                  !showResult && isSelected ? 'border-zwijsen-primary-500 bg-zwijsen-primary-500 text-white' : '',
                  !showResult && !isSelected ? 'border-gray-300 text-gray-400' : '',
                  showResult && isThisCorrect ? 'border-green-500 bg-green-500 text-white' : '',
                  showResult && isSelected && !isThisCorrect ? 'border-red-500 bg-red-500 text-white' : '',
                  showResult && !isSelected && !isThisCorrect ? 'border-gray-200 text-gray-300' : '',
                )}>
                  {showResult && isThisCorrect ? '✓' : showResult && isSelected && !isThisCorrect ? '✗' : String.fromCharCode(65 + i)}
                </span>
                <span>{option}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Feedback */}
      {checked && (
        <div className={clsx(
          'flex items-center gap-4 px-6 py-4 rounded-2xl font-bold border-2',
          isCorrect ? 'bg-green-50 text-green-800 border-green-300' : 'bg-red-50 text-red-800 border-red-300'
        )}>
          {isCorrect ? (
            <>
              <CheckCircle size={24} className="flex-shrink-0 text-green-600" />
              <div>
                <p className="font-bold">Uitstekend! 🎉</p>
                <p className="text-sm font-medium opacity-80">Je koos de juiste definitie.</p>
              </div>
            </>
          ) : (
            <>
              <XCircle size={24} className="flex-shrink-0 text-red-600" />
              <div>
                <p className="font-bold">Niet helemaal.</p>
                <p className="text-sm font-medium opacity-80">
                  Het juiste antwoord was: <em>"{data.options[data.correct_index]}"</em>
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Voorbeeld na feedback */}
      {checked && (
        <div className="px-5 py-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
          <span className="font-bold">Voorbeeld: </span>
          <span className="italic">{data.example_sentence}</span>
        </div>
      )}

      {/* Knoppen */}
      <div className="flex gap-3 mt-2">
        <button
          onClick={() => { setChecked(true); onComplete?.(isCorrect) }}
          disabled={selected === null || checked}
          className="btn-primary flex-1 md:flex-none py-4 px-8 text-base font-bold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          ✓ Controleren
        </button>
        {!quizMode && checked && (
          <button
            onClick={reset}
            className="btn-secondary py-4 px-6 flex items-center justify-center gap-2 font-bold"
          >
            <RotateCcw size={18} /> Opnieuw
          </button>
        )}
      </div>
    </div>
  )
}

// ── Cloze (invulzin) ─────────────────────────────────────────
function ClozeView({ data, onComplete, quizMode = false }: { data: ClozeExercise } & SubProps) {
  const hasOptions = data.options && data.options.length > 0
  const [textAnswer, setTextAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const userAnswer = hasOptions
    ? (selectedOption !== null ? data.options![selectedOption] : '')
    : textAnswer.trim()

  const isCorrect = userAnswer.toLowerCase() === data.answer.toLowerCase()

  const reset = () => {
    setTextAnswer('')
    setSelectedOption(null)
    setChecked(false)
    setShowHint(false)
  }

  // Render zin met het woord benadrukt na checking
  const renderSentence = (withAnswer: boolean) => {
    const parts = data.sentence_with_blank.split('___')
    if (parts.length !== 2) return <span>{data.sentence_with_blank}</span>
    return (
      <span>
        {parts[0]}
        {withAnswer ? (
          <span className={clsx(
            'font-bold px-1 rounded',
            isCorrect ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
          )}>
            {userAnswer || '___'}
          </span>
        ) : (
          <span className="inline-block border-b-2 border-gray-400 min-w-16 mx-1">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
        )}
        {parts[1]}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* De zin */}
      <div className="py-8 px-8 bg-white rounded-2xl border-2 border-gray-200 shadow-sm text-center">
        <p className="text-2xl font-medium text-gray-800 leading-relaxed">
          {checked ? renderSentence(true) : renderSentence(false)}
        </p>
      </div>

      {/* Definitie-hint toggle */}
      <button
        onClick={() => setShowHint(!showHint)}
        className="flex items-center gap-2 text-sm text-zwijsen-primary-600 hover:text-zwijsen-primary-800 font-semibold self-start"
      >
        {showHint ? <EyeOff size={16} /> : <Eye size={16} />}
        {showHint ? 'Hint verbergen' : 'Hint tonen (definitie)'}
      </button>
      {showHint && (
        <div className="px-5 py-4 bg-zwijsen-primary-50 border border-zwijsen-primary-200 rounded-xl text-sm text-zwijsen-primary-800">
          <span className="font-bold uppercase tracking-wide text-xs text-zwijsen-primary-500">Definitie: </span>
          <span>{data.definition}</span>
        </div>
      )}

      {/* Invoer */}
      {hasOptions ? (
        /* Multiple-choice variant */
        <div className="grid grid-cols-2 gap-3">
          {data.options!.map((option, i) => {
            const isSelected = selectedOption === i
            const isThisCorrect = option.toLowerCase() === data.answer.toLowerCase()
            return (
              <button
                key={i}
                onClick={() => { if (!checked) setSelectedOption(i) }}
                disabled={checked}
                className={clsx(
                  'px-4 py-3 rounded-xl border-2 font-medium text-base transition-all duration-200 text-left',
                  !isSelected && !checked && 'bg-white border-gray-200 hover:border-zwijsen-primary-300 hover:bg-zwijsen-primary-50',
                  isSelected && !checked && 'bg-zwijsen-primary-50 border-zwijsen-primary-400 font-bold text-zwijsen-primary-700',
                  checked && isThisCorrect && 'bg-green-50 border-green-500 text-green-800 font-bold',
                  checked && isSelected && !isThisCorrect && 'bg-red-50 border-red-500 text-red-800 font-bold',
                  checked && !isSelected && !isThisCorrect && 'bg-gray-50 border-gray-200 text-gray-400',
                )}
              >
                {option}
              </button>
            )
          })}
        </div>
      ) : (
        /* Vrij invoer */
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600">Jouw antwoord:</label>
          <input
            type="text"
            value={textAnswer}
            onChange={(e) => { setTextAnswer(e.target.value); setChecked(false) }}
            onKeyDown={(e) => { if (e.key === 'Enter' && textAnswer.trim()) { setChecked(true); onComplete?.(isCorrect) } }}
            disabled={checked}
            className={clsx(
              'px-5 py-4 rounded-xl border-2 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-zwijsen-primary-500 transition-colors',
              !checked && 'border-gray-300 bg-white',
              checked && isCorrect && 'border-green-500 bg-green-50 text-green-800',
              checked && !isCorrect && 'border-red-500 bg-red-50 text-red-800',
            )}
            placeholder="Typ het woord..."
          />
        </div>
      )}

      {/* Feedback */}
      {checked && (
        <div className={clsx(
          'flex items-center gap-4 px-6 py-4 rounded-2xl font-bold border-2',
          isCorrect ? 'bg-green-50 text-green-800 border-green-300' : 'bg-red-50 text-red-800 border-red-300'
        )}>
          {isCorrect ? (
            <>
              <CheckCircle size={24} className="flex-shrink-0 text-green-600" />
              <div>
                <p className="font-bold">Helemaal goed! 🎉</p>
                <p className="text-sm font-medium opacity-80">Het woord "{data.answer}" past perfect in de zin.</p>
              </div>
            </>
          ) : (
            <>
              <XCircle size={24} className="flex-shrink-0 text-red-600" />
              <div>
                <p className="font-bold">Niet helemaal.</p>
                <p className="text-sm font-medium opacity-80">
                  Het juiste woord was: <em>"{data.answer}"</em>
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Knoppen */}
      <div className="flex gap-3 mt-2">
        <button
          onClick={() => { setChecked(true); onComplete?.(isCorrect) }}
          disabled={!userAnswer || checked}
          className="btn-primary flex-1 md:flex-none py-4 px-8 text-base font-bold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          ✓ Controleren
        </button>
        {!quizMode && (
          <button
            onClick={reset}
            className="btn-secondary py-4 px-6 flex items-center justify-center gap-2 font-bold"
          >
            <RotateCcw size={18} /> Opnieuw
          </button>
        )}
      </div>
    </div>
  )
}
