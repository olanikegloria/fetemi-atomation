import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function appendN8nSecretHeaders(headers: Headers) {
  const secret = process.env.N8N_WEBHOOK_SECRET
  if (!secret) return
  const name = process.env.N8N_WEBHOOK_SECRET_HEADER || 'X-N8N-Webhook-Secret'
  headers.set(name, secret)
}

function isAllowedResumeHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  return h.endsWith('.n8n.cloud') || h === 'n8n.cloud'
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) {
    return NextResponse.json({ error: 'No session' }, { status: 401 })
  }

  let body: { resume_url?: string; payload?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const resumeUrl = String(body.resume_url || '').trim()
  if (!resumeUrl) {
    return NextResponse.json({ error: 'Missing resume_url' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(resumeUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid resume_url' }, { status: 400 })
  }

  if (!/^https?:$/.test(parsed.protocol)) {
    return NextResponse.json({ error: 'Unsupported URL protocol' }, { status: 400 })
  }
  if (!isAllowedResumeHost(parsed.hostname)) {
    return NextResponse.json({ error: 'resume_url host is not allowed' }, { status: 400 })
  }

  const headers = new Headers({ 'Content-Type': 'application/json' })
  headers.set('Authorization', `Bearer ${token}`)
  appendN8nSecretHeaders(headers)

  const upstream = await fetch(parsed.toString(), {
    method: 'POST',
    headers,
    body: JSON.stringify(body.payload ?? {}),
    cache: 'no-store',
  })
  const text = await upstream.text()
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') || 'application/json; charset=utf-8',
    },
  })
}
