'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader2, AlertCircle, BookOpen, GraduationCap, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import clsx from 'clsx'
import { SUBJECTS, GRADES } from '@/lib/types'
import { supabase, STORAGE_BUCKET } from '@/lib/supabase'

type Step = 'metadata' | 'upload' | 'processing'

// Convert each PDF page to a base64 JPEG using pdf.js in the browser.
// Scale 1.5 + JPEG 0.82 keeps text legible for the AI while being ~85% smaller than scale-2 PNG.
async function pdfToPageImages(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<Array<{ pageNum: number; base64: string }>> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const images: Array<{ pageNum: number; base64: string }> = []

  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.(i, pdf.numPages)
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 1.5 })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!

    await page.render({ canvasContext: ctx, viewport }).promise

    // JPEG is ~85% smaller than PNG; 0.82 quality keeps text sharp enough for AI
    const base64 = canvas.toDataURL('image/jpeg', 0.82).split(',')[1]
    images.push({ pageNum: i, base64 })
  }

  return images
}

// Safely parse JSON — returns null instead of throwing when the body is plain text (e.g. a 413 page)
async function safeJson(res: Response): Promise<Record<string, string> | null> {
  try { return await res.json() } catch { return null }
}

export default function UploadPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('metadata')
  const [subject, setSubject] = useState<string>('')
  const [grade, setGrade] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStep, setUploadStep] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdf = acceptedFiles[0]
    if (pdf) {
      setFile(pdf)
      setError(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB
  })

  const canProceedFromMetadata = subject !== '' && grade !== ''

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)

    try {
      // Step 1: Register upload in DB + get a signed URL for direct browser → Supabase upload
      setUploadStep('Upload voorbereiden...')
      const metaRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, subject, grade }),
      })
      if (!metaRes.ok) {
        const data = await safeJson(metaRes)
        throw new Error(data?.error || 'Registreren mislukt')
      }
      const { uploadId, storagePath, token } = await metaRes.json()

      // Step 2: Upload PDF directly from browser to Supabase Storage (bypasses server size limits)
      setUploadStep('PDF uploaden naar opslag...')
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .uploadToSignedUrl(storagePath, token, file, { contentType: 'application/pdf' })
      if (storageError) throw new Error(`Opslag mislukt: ${storageError.message}`)

      // Step 3: Convert PDF pages to JPEG images in the browser
      const pageImages = await pdfToPageImages(file, (current, total) => {
        setUploadStep(`Pagina ${current} van ${total} omzetten...`)
      })

      // Step 4: Send pages ONE AT A TIME to /api/extract (keeps each request ~300-500 KB)
      for (let i = 0; i < pageImages.length; i++) {
        setUploadStep(`AI analyseert pagina ${i + 1} van ${pageImages.length}...`)
        const extractRes = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uploadId, pageImages: [pageImages[i]] }),
        })
        if (!extractRes.ok) {
          const data = await safeJson(extractRes)
          throw new Error(data?.error || `Extractie pagina ${i + 1} mislukt`)
        }
      }

      router.push(`/review/${uploadId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan')
      setUploading(false)
      setUploadStep('')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <StepBadge number={1} label="Vak & klas" active={step === 'metadata'} done={step !== 'metadata'} />
          <div className={clsx(
            'flex-1 h-0.5 mx-2',
            step !== 'metadata' ? 'bg-zwijsen-pink' : 'bg-gray-200'
          )} />
          <StepBadge number={2} label="PDF uploaden" active={step === 'upload'} done={step === 'processing'} />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {step === 'metadata' && 'Voor welk vak en welke klas?'}
          {step === 'upload' && 'Upload het werkboek'}
          {step === 'processing' && 'Even geduld'}
        </h1>
        <p className="text-gray-600">
          {step === 'metadata' && 'Kies het vak en de klas zodat we de opdrachten goed kunnen categoriseren.'}
          {step === 'upload' && `${subject} voor ${grade}. Upload de PDF met opdrachten.`}
          {step === 'processing' && 'We halen alle opdrachten en subopdrachten uit je PDF.'}
        </p>
      </div>

      {/* Metadata step */}
      {step === 'metadata' && (
        <div className="space-y-6">
          {/* Subject */}
          <div className="card p-6">
            <label className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
              <BookOpen size={18} className="text-zwijsen-pink" />
              Vak
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SUBJECTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className={clsx(
                    'px-4 py-3 rounded-2xl border-2 text-sm font-medium transition-all',
                    subject === s
                      ? 'border-zwijsen-pink bg-pink-50 text-zwijsen-pink'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Grade */}
          <div className="card p-6">
            <label className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
              <GraduationCap size={18} className="text-zwijsen-pink" />
              Klas
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GRADES.map((g) => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={clsx(
                    'px-3 py-3 rounded-2xl border-2 text-sm font-medium transition-all',
                    grade === g
                      ? 'border-zwijsen-pink bg-pink-50 text-zwijsen-pink'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep('upload')}
            disabled={!canProceedFromMetadata}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
          >
            Volgende stap
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Upload step */}
      {step === 'upload' && (
        <div className="space-y-4">
          {/* Selected metadata summary */}
          <div className="flex items-center gap-3 bg-pink-50 border border-pink-200 rounded-2xl p-4">
            <div className="bg-zwijsen-pink text-white rounded-full p-2">
              <Check size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Je uploadt voor</p>
              <p className="font-semibold text-gray-900">
                {subject} - {grade}
              </p>
            </div>
            <button
              onClick={() => setStep('metadata')}
              disabled={uploading}
              className="text-sm text-zwijsen-pink hover:underline flex items-center gap-1 disabled:opacity-50"
            >
              <ArrowLeft size={14} />
              Wijzigen
            </button>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={clsx(
              'card p-12 text-center cursor-pointer transition-colors border-2 border-dashed',
              isDragActive
                ? 'border-zwijsen-blue bg-zwijsen-blue-light'
                : file
                  ? 'border-zwijsen-green bg-green-50'
                  : 'border-gray-300 hover:border-zwijsen-blue hover:bg-blue-50'
            )}
          >
            <input {...getInputProps()} />

            {file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="bg-zwijsen-green text-white p-4 rounded-full">
                  <FileText size={32} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <p className="text-sm text-gray-500">Klik om een ander bestand te kiezen</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="bg-gray-100 text-gray-400 p-4 rounded-full">
                  <Upload size={32} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {isDragActive ? 'Laat los om te uploaden' : 'Sleep je PDF hierheen'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    of <span className="text-zwijsen-blue underline">klik om te bladeren</span>
                  </p>
                </div>
                <p className="text-xs text-gray-400">PDF, maximaal 20MB</p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
          >
            {uploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {uploadStep || 'Bezig...'}
              </>
            ) : (
              <>
                <Upload size={18} />
                Uploaden en oefeningen extraheren
              </>
            )}
          </button>

          {uploading && (
            <p className="text-center text-sm text-gray-500">
              AI analyseert de pagina's en splitst opdrachten in subopdrachten (1a, 1b, 1c, ...).
              Dit duurt even.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function StepBadge({
  number,
  label,
  active,
  done,
}: {
  number: number
  label: string
  active: boolean
  done: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={clsx(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
          done
            ? 'bg-zwijsen-pink text-white'
            : active
              ? 'bg-zwijsen-pink text-white ring-4 ring-pink-100'
              : 'bg-gray-200 text-gray-500'
        )}
      >
        {done ? <Check size={14} /> : number}
      </div>
      <span
        className={clsx(
          'text-sm font-medium',
          active || done ? 'text-gray-900' : 'text-gray-500'
        )}
      >
        {label}
      </span>
    </div>
  )
}
