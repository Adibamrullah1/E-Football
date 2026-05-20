'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, Calendar, Users, BarChart3, Gamepad2, Menu, X, Medal, History } from 'lucide-react'
import { useState } from 'react'

const navLinks = [
  { href: '/', label: 'Beranda', icon: Gamepad2 },
  { href: '/klasemen', label: 'Klasemen', icon: Trophy },
  { href: '/jadwal', label: 'Jadwal', icon: Calendar },
  { href: '/riwayat', label: 'Riwayat', icon: History },
  { href: '/pemain', label: 'Player', icon: Users },
  { href: '/juara', label: 'Juara Bulanan', icon: Medal },
]

export default function Navbar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-gaming-dark/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon to-neon-blue flex items-center justify-center group-hover:shadow-lg group-hover:shadow-neon/30 transition-all duration-300">
                <Gamepad2 className="w-6 h-6 text-gaming-dark" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-gaming text-lg font-bold tracking-wider text-neon">eFOOTBALL</h1>
              <p className="text-[10px] text-muted-foreground -mt-1 tracking-widest uppercase">Liga Mobile</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/10 text-primary neon-border'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Admin Link */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/admin"
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-neon/20 to-neon-blue/20 text-neon border border-neon/30 hover:border-neon/60 hover:shadow-lg hover:shadow-neon/20 transition-all duration-300"
            >
              Admin Panel
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-border/50 pt-4 mt-2">
            <div className="space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary/10 text-primary neon-border'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                )
              })}
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-neon"
              >
                Admin Panel
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
