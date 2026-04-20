export type QuestionType =
  | 'flashcard'        // Woord → definitie kaartje
  | 'multiple_choice'  // Kies de juiste definitie (4 opties)
  | 'cloze'            // Vul het ontbrekende woord in de zin in

export type DifficultyLevel = 1 | 2 | 3

export type ExerciseStatus = 'pending' | 'approved' | 'rejected'

export type UploadStatus = 'processing' | 'completed' | 'failed'

export type WordType =
  | 'zelfstandig_naamwoord'
  | 'werkwoord'
  | 'bijvoeglijk_naamwoord'
  | 'uitdrukking'
  | 'overig'

// Raw extracted content from Groq
export interface ExtractedExercise {
  exercise_number: string
  question_type: QuestionType
  instruction: string
  raw_text: string
}

export interface PDFUpload {
  id: string
  filename: string
  storage_path: string
  subject: string | null
  grade: string | null
  status: UploadStatus
  page_count: number | null
  created_at: string
}

// Subjects available for selection
export const SUBJECTS = [
  'Taal',
  'Spelling',
  'Lezen',
  'Rekenen',
  'Wereldorientatie',
  'Engels',
] as const
export type Subject = typeof SUBJECTS[number]

// Grade (klas) options for Dutch primary/secondary school
export const GRADES = [
  'Groep 3',
  'Groep 4',
  'Groep 5',
  'Groep 6',
  'Groep 7',
  'Groep 8',
  'Klas 1 VO',
  'Klas 2 VO',
] as const
export type Grade = typeof GRADES[number]

export interface Exercise {
  id: string
  pdf_upload_id: string
  page_number: number
  exercise_number: string
  parent_exercise_number: string | null
  sub_exercise_letter: string | null
  block: string | null
  lesson: string | null
  question_type: QuestionType
  difficulty_level: DifficultyLevel
  topic: string | null
  learning_goal: string | null
  original_content: ExtractedExercise
  transformed_content: TransformedExercise | null
  status: ExerciseStatus
  editor_notes: string | null
  created_at: string
  updated_at: string
  pdf_upload?: PDFUpload
}

// What we turn the exercise into for interactive use
export interface TransformedExercise {
  question_type: QuestionType
  instruction: string
  difficulty_level: DifficultyLevel
  flashcard?: FlashcardExercise | null
  multiple_choice?: MultipleChoiceExercise | null
  cloze?: ClozeExercise | null
}

// Flashcard: toon het woord, student herinnert de definitie
export interface FlashcardExercise {
  word: string
  word_type: WordType
  definition: string
  example_sentence: string
}

// Multiple choice: kies de juiste definitie uit 4 opties
export interface MultipleChoiceExercise {
  word: string
  word_type: WordType
  definition: string
  example_sentence: string
  options: string[]      // 4 opties (inclusief de juiste)
  correct_index: number  // index van de juiste optie in options[]
}

// Cloze: vul het ontbrekende woord in de zin in
export interface ClozeExercise {
  sentence_with_blank: string  // Bijv. "De ___ brengt pakjes rond."
  answer: string               // Het correcte woord
  word_type: WordType
  definition: string           // Hint: definitie van het woord
  options?: string[]           // Optioneel: 4 keuzes voor multiple choice variant
}

export interface ExerciseVariant {
  id: string
  exercise_id: string
  difficulty_level: DifficultyLevel
  variant_content: TransformedExercise
  created_at: string
}
