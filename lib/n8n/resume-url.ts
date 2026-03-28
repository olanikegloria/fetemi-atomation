/**
 * n8n "resume" / webhook-waiting URLs must be absolute https URLs.
 * Bad emails or copy-paste can produce values like "=https:/..." or the whole
 * adaptation-review URL with a nested resume_url param — fix before fetch().
 */
export function normalizeN8nResumeUrl(raw: string | null): string | null {
  if (!raw) return null
  let u = raw.trim()
  if (u.startsWith('=')) u = u.slice(1).trim()
  u = u.replace(/^https:\/(?!\/)/i, 'https://')
  u = u.replace(/^http:\/(?!\/)/i, 'http://')

  try {
    let parsed = new URL(u)

    // Entire app URL was wrongly stored as resume_url — real wait URL is nested
    if (
      parsed.pathname.includes('adaptation-review') &&
      parsed.searchParams.has('resume_url')
    ) {
      const inner = parsed.searchParams.get('resume_url')
      if (!inner) return null
      u = decodeURIComponent(inner)
      parsed = new URL(u)
    }

    if (!parsed.protocol.startsWith('http')) return null
    return parsed.toString()
  } catch {
    return null
  }
}
