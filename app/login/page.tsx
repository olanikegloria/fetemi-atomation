'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Mail, Sparkles } from 'lucide-react'
import { sendMagicLinkAction } from '@/app/login/actions'
import { createClient } from '@/lib/supabase/client'
import { getPostLoginPath, getRoleFromEmail } from '@/lib/auth/roles'

function parseImplicitTokensFromHash(): {
  access_token: string
  refresh_token: string
} | null {
  if (typeof window === 'undefined') return null
  const raw = window.location.hash
  if (!raw || raw.length < 2) return null
  const params = new URLSearchParams(raw.slice(1))
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  if (access_token && refresh_token) {
    return { access_token, refresh_token }
  }
  return null
}

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function recoverSessionFromUrl() {
      const supabase = createClient()
      const implicit = parseImplicitTokensFromHash()
      if (implicit) {
        const { error: se } = await supabase.auth.setSession({
          access_token: implicit.access_token,
          refresh_token: implicit.refresh_token,
        })
        if (!se && typeof window !== 'undefined') {
          window.history.replaceState(
            null,
            '',
            window.location.pathname + window.location.search,
          )
        }
      }
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (cancelled) return
      if (session?.user?.email) {
        const role = getRoleFromEmail(session.user.email)
        router.replace(getPostLoginPath(role))
        return
      }
      const qError = searchParams.get('error')
      if (qError === 'auth') {
        setError(
          'Sign-in link expired or invalid. Request a new magic link below.',
        )
      } else if (qError === 'config') {
        setError(
          'Server configuration error. Check environment variables.',
        )
      }
    }

    recoverSessionFromUrl()
    return () => {
      cancelled = true
    }
  }, [router, searchParams])

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    const trimmed = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address')
      return
    }
    setLoading(true)
    try {
      const result = await sendMagicLinkAction(trimmed)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setMessage('Check your inbox for the sign-in link.')
    } catch (err) {
      console.error('[login] magic link failed', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_32px_80px_rgba(224,40,133,0.12)]">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Sign in to Fetemi</h1>
            <p className="text-sm text-gray-400">We&apos;ll email you a magic link</p>
          </div>
        </div>

        <form onSubmit={handleMagicLink} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Email
            </label>
            <div className="mt-2 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-pink-500/50"
              />
            </div>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {message ? <p className="text-sm text-green-400">{message}</p> : null}

          {/* Native submit so the form always fires (avoids any Button/type edge cases). */}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white hover:bg-pink-500 disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending link…
              </>
            ) : (
              'Send magic link'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/intake" className="text-pink-400 hover:text-pink-300">
            Back to submit idea
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-gray-400 text-sm">
          Loading…
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  )
}
