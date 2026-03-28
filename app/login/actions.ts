'use server'

import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type MagicLinkResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Sends the magic link from the server so `NEXT_PUBLIC_*` env is always read at
 * runtime (no client bundle inlining issues) and the browser always shows a
 * network request to your app, which then calls Supabase.
 */
export async function sendMagicLinkAction(email: string): Promise<MagicLinkResult> {
  const trimmed = email.trim().toLowerCase()
  if (!EMAIL_RE.test(trimmed)) {
    return { ok: false, error: 'Enter a valid email address' }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    return {
      ok: false,
      error:
        'Server missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add .env.local and restart the dev server.',
    }
  }

  const headerList = await headers()
  const proto = headerList.get('x-forwarded-proto') ?? 'http'
  const host =
    headerList.get('x-forwarded-host') ?? headerList.get('host') ?? 'localhost:3000'
  const origin = `${proto}://${host}`

  const supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  const { error } = await supabase.auth.signInWithOtp({
    email: trimmed,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
