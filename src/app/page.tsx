import Link from 'next/link'
import { Upload, Library, Zap } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase'
import ResetButton from '@/components/ResetButton'

async function getStats() {
  const [uploadsRes, exercisesRes, approvedRes] = await Promise.all([
    supabaseAdmin.from('pdf_uploads').select('id', { count: 'exact' }),
    supabaseAdmin.from('exercises').select('id', { count: 'exact' }),
    supabaseAdmin.from('exercises').select('id', { count: 'exact' }).eq('status', 'approved'),
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero Section - Improved */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-zwijsen-primary-100 text-zwijsen-primary-600 px-4 py-2.5 rounded-full text-sm font-bold mb-6 tracking-wide">
          <Zap size={16} className="animate-pulse" />
          Proof of Concept
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Upcycling van <span className="text-gradient">Leercontent</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
          Transformeer statische PDF-oefeningen van Zwijsen naar interactieve, slimme
          leerervaringen met behulp van generatieve AI. Maak kennis van het toekomst van digitaal leren.
        </p>
      </div>

      {/* Stats Section - Improved */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        {[
          { icon: '📤', label: "PDF's geüpload", value: stats.uploads, color: 'zwijsen-primary' },
          { icon: '⚙️', label: 'Oefeningen geëxtraheerd', value: stats.exercises, color: 'zwijsen-warning' },
          { icon: '✅', label: 'Oefeningen goedgekeurd', value: stats.approved, color: 'zwijsen-accent' },
        ].map(({ icon, label, value, color }, i) => (
          <div key={i} className="card p-8 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{icon}</div>
              <div className="flex-1">
                <div className={`text-4xl font-bold text-${color}-500 mb-2 tracking-tight`}>
                  {value}
                </div>
                <p className="text-sm text-gray-600 font-medium">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Workflow Section - Improved */}
      <div className="card p-10 mb-20 border-2 border-gray-100">
        <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Hoe werkt het?</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '1', title: 'Upload PDF', desc: 'Upload een werkboekpagina als PDF', icon: '📄', color: 'zwijsen-primary' },
            { step: '2', title: 'AI Extractie', desc: 'AI herkent en structureert alle oefeningen', icon: '🤖', color: 'zwijsen-warning' },
            { step: '3', title: 'Controleer', desc: 'Bekijk en corrigeer de AI-output', icon: '👁️', color: 'zwijsen-accent' },
            { step: '4', title: 'Gebruik', desc: 'Oefeningen zijn interactief speelbaar', icon: '🎮', color: 'zwijsen-success' },
          ].map(({ step, title, desc, icon, color }, idx) => (
            <div key={step} className="flex flex-col items-center text-center gap-4 relative">
              {/* Connecting line (desktop only) */}
              {idx < 3 && (
                <div className="hidden md:block absolute top-8 left-1/2 w-1/4 h-0.5 bg-gradient-to-r from-gray-300 to-transparent transform translate-x-full" />
              )}

              <div className={`text-5xl mb-2 transform transition-transform duration-300 hover:scale-125`}>
                {icon}
              </div>
              <div className={`w-14 h-14 rounded-full bg-${color}-100 flex items-center justify-center font-bold text-lg text-${color}-600 text-xl`}>
                {step}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs - Improved */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <Link
          href="/upload"
          className="card p-10 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group border-2 border-transparent hover:border-zwijsen-primary-200"
        >
          <div className="flex items-start gap-5 mb-6">
            <div className="bg-gradient-to-br from-zwijsen-primary-400 to-zwijsen-primary-600 text-white p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Upload size={28} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 flex-1">Nieuwe PDF uploaden</h3>
          </div>
          <p className="text-gray-700 leading-relaxed mb-6">
            Upload een PDF-pagina uit een Zwijsen werkboek. AI extraheert automatisch alle
            oefeningen en zet ze om naar interactief formaat.
          </p>
          <div className="inline-flex items-center gap-2 text-zwijsen-primary-600 font-semibold group-hover:gap-3 transition-all duration-200">
            <span>Aan de slag</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <Link
          href="/library"
          className="card p-10 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group border-2 border-transparent hover:border-zwijsen-accent-200"
        >
          <div className="flex items-start gap-5 mb-6">
            <div className="bg-gradient-to-br from-zwijsen-accent-400 to-zwijsen-accent-600 text-white p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Library size={28} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 flex-1">Bibliotheek bekijken</h3>
          </div>
          <p className="text-gray-700 leading-relaxed mb-6">
            Bekijk alle goedgekeurde oefeningen, filter op type en moeilijkheidsgraad, en
            genereer nieuwe varianten voor oefening.
          </p>
          <div className="inline-flex items-center gap-2 text-zwijsen-accent-600 font-semibold group-hover:gap-3 transition-all duration-200">
            <span>Verkennen</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Danger zone - Improved */}
      <div className="card border-2 border-red-200 bg-red-50 p-8">
        <div className="flex items-center justify-between gap-8">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Alles verwijderen</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed font-medium">
              Verwijdert alle uploads, oefeningen en varianten. Dit kan niet ongedaan worden gemaakt.
            </p>
          </div>
          <ResetButton />
        </div>
      </div>
    </div>
  )
}
