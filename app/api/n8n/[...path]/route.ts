import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { n8nWebhookUrl } from '@/lib/config'

/**
 * Proxies authenticated browser calls to n8n so we can:
 * - Attach the Supabase access token from the server session (reliable cookies)
 * - Optionally send N8N_WEBHOOK_SECRET for webhooks that use Header Auth in n8n
 */
function appendN8nSecretHeaders(headers: Headers) {
  const secret = process.env.N8N_WEBHOOK_SECRET
  if (!secret) return
  const name = process.env.N8N_WEBHOOK_SECRET_HEADER || 'X-N8N-Webhook-Secret'
  headers.set(name, secret)
}

async function proxyToN8n(
  request: NextRequest,
  pathSegments: string[],
  method: 'GET' | 'POST',
) {
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

  const pathSeg = pathSegments.join('/')
  const search = request.nextUrl.search
  const n8nUrl = n8nWebhookUrl(`${pathSeg}${search}`)

  const headers = new Headers()
  headers.set('Authorization', `Bearer ${token}`)
  appendN8nSecretHeaders(headers)

  if (method === 'POST') {
    const ct = request.headers.get('Content-Type')
    if (ct) headers.set('Content-Type', ct)
    const body = await request.text()
    const res = await fetch(n8nUrl, {
      method: 'POST',
      headers,
      body: body || undefined,
      cache: 'no-store',
    })
    const resBody = await res.text()
    return new NextResponse(resBody, {
      status: res.status,
      headers: {
        'Content-Type':
          res.headers.get('Content-Type') || 'application/json; charset=utf-8',
      },
    })
  }

  const res = await fetch(n8nUrl, { headers, cache: 'no-store' })
  const resBody = await res.text()
  return new NextResponse(resBody, {
    status: res.status,
    headers: {
      'Content-Type':
        res.headers.get('Content-Type') || 'application/json; charset=utf-8',
    },
  })
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params
  return proxyToN8n(request, path, 'GET')
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params
  return proxyToN8n(request, path, 'POST')
}
