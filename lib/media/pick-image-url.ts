/**
 * Extract a usable image URL from API / n8n payloads that use inconsistent field names.
 */
function looksLikeImageUrl(s: string): boolean {
  const t = s.trim()
  if (!t) return false
  if (t.startsWith('data:image/')) return true
  if (t.startsWith('//')) return true
  if (/^https?:\/\//i.test(t)) return true
  return false
}

const DIRECT_KEYS: string[] = [
  'image_url',
  'imageUrl',
  'imageURL',
  'Image URL',
  'hero_image_url',
  'heroImageUrl',
  'hero_image',
  'heroImage',
  'thumbnail_url',
  'thumbnailUrl',
  'cover_url',
  'coverUrl',
  'cover_image',
  'coverImage',
  'visual_url',
  'visualUrl',
  'linkedin_image_url',
  'linkedinImageUrl',
  'media_url',
  'mediaUrl',
  'url',
  'src',
  'href',
  'publicUrl',
  'public_url',
]

export function pickImageUrl(obj: unknown, depth = 0): string {
  if (depth > 4 || obj === null || obj === undefined) return ''
  if (typeof obj === 'string') {
    return looksLikeImageUrl(obj) ? obj.trim().replace(/^\/\//, 'https://') : ''
  }
  if (typeof obj !== 'object') return ''
  const raw = obj as Record<string, unknown>

  for (const k of DIRECT_KEYS) {
    if (!(k in raw)) continue
    const v = raw[k]
    if (typeof v === 'string' && looksLikeImageUrl(v)) {
      const t = v.trim()
      return t.startsWith('//') ? `https:${t}` : t
    }
    if (v !== null && typeof v === 'object') {
      const nested = pickImageUrl(v, depth + 1)
      if (nested) return nested
    }
  }

  const nestedKeys = [
    'data',
    'fields',
    'meta',
    'image',
    'media',
    'visual',
    'asset',
    'payload',
    'json',
    'output',
    'item',
    'body',
  ]
  for (const nk of nestedKeys) {
    const n = raw[nk]
    if (n !== undefined && n !== null) {
      const u = pickImageUrl(n, depth + 1)
      if (u) return u
    }
  }

  return ''
}
