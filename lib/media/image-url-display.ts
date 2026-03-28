/**
 * n8n: if the field is "fixed" instead of expression, `{{ ... }}` is stored literally.
 * Supabase public URLs need `.../object/public/<bucket>/...`.
 */

const N8N_TEMPLATE_RE = /\{\{|\}\}|\$\(['"]/

export function looksLikeUninterpolatedN8nExpression(url: string): boolean {
  return N8N_TEMPLATE_RE.test(url)
}

/** Insert missing `public` segment for public bucket URLs. */
export function resolveSupabasePublicObjectUrl(url: string): string {
  const t = url.trim()
  if (!t) return t
  if (t.includes('/storage/v1/object/sign/')) return t
  if (t.includes('/storage/v1/object/public/')) return t
  if (!t.includes('.supabase.co/storage/v1/object/')) return t
  return t.replace('/storage/v1/object/', '/storage/v1/object/public/')
}

export function resolveDraftImageUrlForDisplay(url: string | undefined): {
  href: string
  blocked: boolean
  reason: 'n8n_template' | null
} {
  const raw = String(url || '').trim()
  if (!raw) return { href: '', blocked: true, reason: null }
  if (looksLikeUninterpolatedN8nExpression(raw)) {
    return { href: '', blocked: true, reason: 'n8n_template' }
  }
  return { href: resolveSupabasePublicObjectUrl(raw), blocked: false, reason: null }
}
