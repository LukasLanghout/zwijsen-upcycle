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
    <nav className="bg-white border-b border-purple-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="bg-[#A81D7B] text-white p-1.5 rounded-xl">
              <BookOpen size={20} />
            </div>
            <div>
              <span className="font-bold text-lg text-[#A81D7B] leading-none">Zwijsen</span>
              <span className="font-bold text-lg text-gray-700 leading-none"> Upcycle</span>
            </div>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-colors',
                  pathname === href
                    ? 'bg-[#A81D7B] text-white'
                    : 'text-gray-600 hover:bg-[#F3D6EB] hover:text-[#A81D7B]'
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
