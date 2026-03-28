import { n8nWebhookUrl } from '@/lib/config'

/**
 * Resolve webhook path to URL. In the browser we call the same-origin proxy so the server can
 * attach the session cookie, forward the Supabase JWT to n8n, and add optional N8N_WEBHOOK_SECRET.
 */
function resolveN8nUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http')) return pathOrUrl
  const trimmed = pathOrUrl.replace(/^\//, '')
  if (typeof window !== 'undefined') {
    const qIndex = trimmed.indexOf('?')
    const pathPart = qIndex === -1 ? trimmed : trimmed.slice(0, qIndex)
    const qs = qIndex === -1 ? '' : trimmed.slice(qIndex)
    return `/api/n8n/${pathPart}${qs}`
  }
  return n8nWebhookUrl(trimmed)
}

/**
 * Fetch an n8n webhook. Browser: uses `/api/n8n/...` proxy (session + optional webhook secret).
 * Direct n8n URL only when `pathOrUrl` is absolute or when running outside the browser.
 */
export async function n8nFetch(
  pathOrUrl: string,
  init: RequestInit & { accessToken?: string | null } = {}
): Promise<Response> {
  const { accessToken, headers: initHeaders, ...rest } = init
  const url = resolveN8nUrl(pathOrUrl)
  const isProxy = url.startsWith('/api/n8n/')
  const headers = new Headers(initHeaders)
  if (!isProxy && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return fetch(url, {
    ...rest,
    headers,
    credentials: isProxy ? 'include' : rest.credentials,
  })
}
