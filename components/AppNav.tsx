'use client'

import Link from 'next/link'
import { Menu, X, Sparkles, LogOut } from 'lucide-react'
import { useState } from 'react'
import type { AppRole } from '@/lib/auth/roles'

type Props = {
  role: AppRole | null
  email?: string | null
  onSignOut?: () => void
  active?:
    | 'intake'
    | 'draft-queue'
    | 'content-creators'
    | 'my-adaptations'
    | 'draft-review'
    | 'adapt'
    | 'dashboard'
    | 'login'
}

export function AppNav({ role, email, onSignOut, active }: Props) {
  const [open, setOpen] = useState(false)

  const managerLinks = [
    { key: 'draft-queue' as const, label: 'Draft review queue', href: '/manager/draft-queue' },
    { key: 'content-creators' as const, label: 'Content creators', href: '/manager/content-creators' },
    { key: 'dashboard' as const, label: 'Dashboard', href: '/dashboard' },
  ]
  const creatorLinks = [
    { key: 'intake' as const, label: 'Submit idea', href: '/intake' },
    { key: 'my-adaptations' as const, label: 'My adaptations', href: '/my-adaptations' },
    { key: 'dashboard' as const, label: 'Dashboard', href: '/dashboard' },
  ]

  const links = role === 'manager' ? managerLinks : creatorLinks

  return (
    <header className="sticky top-0 z-50 border-b border-primary/20 bg-black/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href={role === 'manager' ? '/dashboard' : '/intake'} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center transform group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white">Fetemi</span>
            <span className="text-xs text-primary">AI Content</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                active === item.key
                  ? 'text-white font-medium'
                  : 'text-gray-400 hover:text-white transition-colors'
              }
            >
              {item.label}
            </Link>
          ))}
          {!email ? (
            <Link
              href="/login"
              className="text-sm px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:text-white"
            >
              Sign in
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 max-w-[140px] truncate" title={email}>
                {email}
              </span>
              {onSignOut && (
                <button
                  type="button"
                  onClick={() => onSignOut()}
                  className="text-gray-400 hover:text-white p-1.5 rounded-lg border border-white/10 inline-flex items-center gap-1 text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Out
                </button>
              )}
            </div>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="md:hidden text-white p-2"
          aria-label="Menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-primary/20 bg-black/95 px-4 py-4 flex flex-col gap-3">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="text-gray-300 py-1"
            >
              {item.label}
            </Link>
          ))}
          {!email ? (
            <Link href="/login" onClick={() => setOpen(false)} className="text-primary py-1">
              Sign in
            </Link>
          ) : (
            <button type="button" onClick={() => { onSignOut?.(); setOpen(false) }} className="text-left text-gray-400 py-1">
              Sign out
            </button>
          )}
        </div>
      )}
    </header>
  )
}
