'use client'

import { useState } from 'react'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ResetButton() {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/reset', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Reset mislukt')
      }
      setShowConfirm(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan')
    } finally {
      setLoading(false)
    }
  }

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-red-300 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors"
      >
        <Trash2 size={16} />
        Alles verwijderen
      </button>
    )
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-2">
        <AlertTriangle size={16} className="text-red-500 shrink-0" />
        <span className="text-sm text-red-700 font-medium">
          Weet je het zeker? Dit verwijdert alles permanent.
        </span>
        <button
          onClick={handleReset}
          disabled={loading}
          className="ml-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          Ja, verwijder alles
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="text-gray-500 hover:text-gray-700 text-sm px-2 py-1.5 rounded-xl transition-colors"
        >
          Annuleren
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
