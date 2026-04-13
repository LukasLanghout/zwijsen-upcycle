'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

// Convert each PDF page to a base64 PNG using pdf.js in the browser
async function pdfToPageImages(file: File): Promise<Array<{ pageNum: number; base64: string }>> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const images: Array<{ pageNum: number; base64: string }> = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 2.0 })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!

    await page.render({ canvasContext: ctx, viewport }).promise

    const base64 = canvas.toDataURL('image/png').split(',')[1]
    images.push({ pageNum: i, base64 })
  }

  return images
}

export default function UploadPage() {
  const router = useRouter()
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

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)

    try {
      // Step 1: Upload PDF to Supabase Storage
      setUploadStep('PDF uploaden...')
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const data = await uploadRes.json()
        throw new Error(data.error || 'Upload mislukt')
      }

      const { uploadId } = await uploadRes.json()

      // Step 2: Convert PDF pages to images in the browser
      setUploadStep('PDF pagina\'s verwerken...')
      const pageImages = await pdfToPageImages(file)

      // Step 3: Send images to the extraction API
      setUploadStep('AI extraheert oefeningen...')
      const extractRes = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId, pageImages }),
      })

      if (!extractRes.ok) {
        const data = await extractRes.json()
        throw new Error(data.error || 'Extractie mislukt')
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PDF uploaden</h1>
        <p className="text-gray-600">
          Upload een pagina uit een Zwijsen werkboek. AI extraheert automatisch alle
          oefeningen en maakt ze interactief.
        </p>
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
        <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="btn-primary w-full mt-6 flex items-center justify-center gap-2 py-3 text-base"
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
        <p className="text-center text-sm text-gray-500 mt-3">
          AI analyseert de pagina en extraheert oefeningen. Dit duurt even...
        </p>
      )}
    </div>
  )
}
