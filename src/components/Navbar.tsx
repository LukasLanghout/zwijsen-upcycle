'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Upload, Library, Home } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/upload', label: 'Upload PDF', icon: Upload },
  { href: '/library', label: 'Bibliotheek', icon: Library },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm transition-shadow duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo - Improved */}
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200 group"
          >
            <div className="bg-gradient-to-br from-zwijsen-primary-500 to-zwijsen-primary-600 text-white p-2 rounded-xl group-hover:shadow-md transition-all duration-200">
              <BookOpen size={24} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-lg text-zwijsen-primary-600">Zwijsen</span>
              <span className="font-semibold text-sm text-gray-600">Upcycle</span>
            </div>
          </Link>

          {/* Nav links - Improved */}
          <div className="flex items-center gap-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    'flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold',
                    'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
                    isActive
                      ? 'bg-zwijsen-primary-500 text-white shadow-md focus:ring-zwijsen-primary-400'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-zwijsen-primary-600 focus:ring-gray-400'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={18} strokeWidth={2} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
