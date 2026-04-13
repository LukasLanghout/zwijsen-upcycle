export type QuestionType =
  | 'fill_in'        // 763 = ___ + ___ + ___
  | 'structured_hte' // H-T-E box exercises
  | 'creative'       // Make 3 different numbers with given digits
  | 'pattern_puzzle' // Figure out shape values

export type DifficultyLevel = 1 | 2 | 3

export type ExerciseStatus = 'pending' | 'approved' | 'rejected'

export type UploadStatus = 'processing' | 'completed' | 'failed'

// Raw extracted content from Groq
export interface ExtractedExercise {
  exercise_number: string
  question_type: QuestionType
  instruction: string
  // For fill_in / structured_hte
  given_numbers?: number[]
  answer_slots?: number
  // For creative
  available_digits?: number[]
  num_combinations?: number
  // For pattern_puzzle
  shapes?: string[]
  known_total?: number
  // General
  example_shown?: boolean
  raw_text: string
}

export interface PDFUpload {
  id: string
  filename: string
  storage_path: string
  status: UploadStatus
  page_count: number | null
  created_at: string
}

export interface Exercise {
  id: string
  pdf_upload_id: string
  page_number: number
  exercise_number: string
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
  // fill_in variant
  fill_in?: FillInExercise
  // structured_hte variant
  structured_hte?: StructuredHTEExercise
  // creative variant
  creative?: CreativeExercise
  // pattern_puzzle variant
  pattern_puzzle?: PatternPuzzleExercise
}

export interface FillInExercise {
  number: number
  // e.g. [400, 90, 6] for 496
  answer: number[]
  // Labels like ['H', 'T', 'E'] or ['honderdtallen', 'tientallen', 'eenheden']
  labels: string[]
}

export interface StructuredHTEExercise {
  mode: 'split' | 'combine'
  // For split: provide a 3-digit number, student fills in H, T, E values
  // For combine: provide H, T, E values, student writes the 3-digit number
  numbers: HTENumber[]
}

export interface HTENumber {
  H: number
  T: number
  E: number
}

export interface CreativeExercise {
  digits: number[]
  num_combinations: number
  // Pre-generated valid combinations for answer checking
  valid_combinations: HTENumber[]
}

export interface PatternPuzzleExercise {
  shapes: ShapeDefinition[]
  groups: ShapeGroup[]
}

export interface ShapeDefinition {
  name: string  // 'circle', 'square', 'heart', 'triangle'
  value: number
}

export interface ShapeGroup {
  counts: Record<string, number>  // { circle: 3, square: 2, ... }
  total: number
  is_known: boolean  // true = shown to student, false = student must calculate
}

export interface ExerciseVariant {
  id: string
  exercise_id: string
  difficulty_level: DifficultyLevel
  variant_content: TransformedExercise
  created_at: string
}
