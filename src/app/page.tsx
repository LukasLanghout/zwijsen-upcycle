import Link from 'next/link'
import { Upload, Library, CheckCircle, Zap, BookOpen } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase'

async function getStats() {
  const [uploadsRes, exercisesRes, approvedRes] = await Promise.all([
    supabaseAdmin.from('pdf_uploads').select('id', { count: 'exact' }),
    supabaseAdmin.from('exercises').select('id', { count: 'exact' }),
    supabaseAdmin
      .from('exercises')
      .select('id', { count: 'exact' })
      .eq('status', 'approved'),
  ])

  return {
    uploads: uploadsRes.count ?? 0,
    exercises: exercisesRes.count ?? 0,
    approved: approvedRes.count ?? 0,
  }
}

export default async function DashboardPage() {
  const stats = await getStats()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-zwijsen-blue-light text-zwijsen-blue px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Zap size={14} />
          Proof of Concept
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Upcycling van Leercontent
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Transformeer statische PDF-oefeningen van Zwijsen naar interactieve, slimme
          leerervaringen met behulp van generatieve AI.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-12">
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-zwijsen-blue mb-1">{stats.uploads}</div>
          <div className="text-sm text-gray-500">PDF&apos;s geüpload</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-zwijsen-blue mb-1">{stats.exercises}</div>
          <div className="text-sm text-gray-500">Oefeningen geëxtraheerd</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-zwijsen-green mb-1">{stats.approved}</div>
          <div className="text-sm text-gray-500">Oefeningen goedgekeurd</div>
        </div>
      </div>

      {/* Workflow */}
      <div className="card p-8 mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Hoe werkt het?</h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { step: '1', title: 'Upload PDF', desc: 'Upload een werkboekpagina als PDF', color: 'bg-blue-100 text-blue-700' },
            { step: '2', title: 'AI Extractie', desc: 'AI herkent en structureert alle oefeningen', color: 'bg-purple-100 text-purple-700' },
            { step: '3', title: 'Controleer', desc: 'Bekijk en corrigeer de AI-output zij aan zij', color: 'bg-orange-100 text-orange-700' },
            { step: '4', title: 'Gebruik', desc: 'Goedgekeurde oefeningen zijn interactief speelbaar', color: 'bg-green-100 text-green-700' },
          ].map(({ step, title, desc, color }) => (
            <div key={step} className="flex flex-col items-center text-center gap-3">
              <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center font-bold text-lg`}>
                {step}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{title}</div>
                <div className="text-sm text-gray-500 mt-1">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="grid grid-cols-2 gap-6">
        <Link href="/upload" className="card p-8 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-zwijsen-blue text-white p-3 rounded-xl group-hover:scale-110 transition-transform">
              <Upload size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Nieuwe PDF uploaden</h3>
          </div>
          <p className="text-gray-600">
            Upload een PDF-pagina uit een Zwijsen werkboek. AI extraheert automatisch alle
            oefeningen en zet ze om naar interactief formaat.
          </p>
        </Link>

        <Link href="/library" className="card p-8 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-zwijsen-green text-white p-3 rounded-xl group-hover:scale-110 transition-transform">
              <Library size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Bibliotheek bekijken</h3>
          </div>
          <p className="text-gray-600">
            Bekijk alle geëxtraheerde oefeningen, filter op type en moeilijkheidsgraad, en
            genereer nieuwe varianten.
          </p>
        </Link>
      </div>
    </div>
  )
}
