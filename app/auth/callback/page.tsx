'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { getPostLoginPath, getRoleFromEmail } from '@/lib/auth/roles'

const OTP_TYPES: readonly EmailOtpType[] = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]

function parseImplicitTokensFromHash(): {
  access_token: string
  refresh_token: string
} | null {
  if (typeof window === 'undefined') return null
  const raw = window.location.hash
  if (!raw || raw.length < 2) return null
  const fragment = raw.slice(1)
  const params = new URLSearchParams(fragment)
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  if (access_token && refresh_token) {
    return { access_token, refresh_token }
  }
  return null
}

function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    let cancelled = false

    async function finish() {
      const supabase = createClient()
      const code = searchParams.get('code')
      const next = searchParams.get('next')
      const tokenHash = searchParams.get('token_hash')
      const typeRaw = searchParams.get('type')

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error('[auth/callback] exchangeCodeForSession', error)
            if (!cancelled) router.replace('/login?error=auth')
            return
          }
        } else if (tokenHash && typeRaw) {
          const otpType: EmailOtpType = OTP_TYPES.includes(typeRaw as EmailOtpType)
            ? (typeRaw as EmailOtpType)
            : 'email'
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType,
          })
          if (error) {
            console.error('[auth/callback] verifyOtp', error)
            if (!cancelled) router.replace('/login?error=auth')
            return
          }
        } else {
          const implicit = parseImplicitTokensFromHash()
          if (implicit) {
            const { error } = await supabase.auth.setSession({
              access_token: implicit.access_token,
              refresh_token: implicit.refresh_token,
            })
            if (error) {
              console.error('[auth/callback] setSession', error)
              if (!cancelled) router.replace('/login?error=auth')
              return
            }
            if (typeof window !== 'undefined') {
              window.history.replaceState(
                null,
                '',
                window.location.pathname + window.location.search,
              )
            }
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session?.user?.email) {
          if (!cancelled) router.replace('/login?error=auth')
          return
        }
        const role = getRoleFromEmail(session.user.email)
        const dest =
          next && next.startsWith('/') ? next : getPostLoginPath(role)
        if (!cancelled) router.replace(dest)
      } catch (e) {
        console.error('[auth/callback]', e)
        if (!cancelled) router.replace('/login?error=auth')
      }
    }

    finish()
    return () => {
      cancelled = true
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-2 px-4">
      <p className="text-sm text-gray-300">Signing you in…</p>
      <p className="text-xs text-gray-500">Please wait</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-gray-400 text-sm">
          Loading…
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  )
}
