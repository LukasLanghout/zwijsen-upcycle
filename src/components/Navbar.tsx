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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-zwijsen-blue text-white p-1.5 rounded-lg">
              <BookOpen size={20} />
            </div>
            <span className="font-bold text-lg text-gray-900">Zwijsen Upcycle</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === href
                    ? 'bg-zwijsen-blue text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
