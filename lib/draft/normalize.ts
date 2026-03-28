import type { Draft } from '@/lib/draft/types'
import { pickImageUrl } from '@/lib/media/pick-image-url'
import { stripHtmlToPlainText } from '@/lib/text/strip-html'

function coalesceDraftImageUrl(raw: Record<string, unknown>): string {
  const picked = pickImageUrl(raw)
  if (picked) return picked
  for (const key of ['image_url', 'imageUrl', 'imageURL', 'hero_image_url', 'thumbnail_url']) {
    const v = raw[key]
    if (typeof v === 'string') {
      const t = v.trim()
      if (t) return t
    }
  }
  return ''
}

export function normalizeDraftFromApi(raw: Record<string, unknown>, index: number): Draft {
  const letter = String.fromCharCode(65 + (index % 26))
  const body = String(
    raw.body ??
      raw.content ??
      raw.text ??
      raw.full_text ??
      raw.markdown ??
      raw.draft_body ??
      '',
  )

  let title = String(raw.title ?? raw.draft_title ?? raw.headline ?? raw.topic ?? '').trim()
  if (!title || /^untitled$/i.test(title)) {
    const ad = String(raw.angle_description ?? raw.description ?? raw.summary ?? '').trim()
    if (ad) {
      title = ad.length > 100 ? `${ad.slice(0, 97)}…` : ad
    } else {
      const plain = stripHtmlToPlainText(body)
      const oneLine = plain.replace(/\s+/g, ' ').trim()
      if (oneLine) {
        title = oneLine.length > 90 ? `${oneLine.slice(0, 87)}…` : oneLine
      } else {
        title = `Draft ${letter}`
      }
    }
  }

  const plainForCount = stripHtmlToPlainText(body)
  const estimated = plainForCount.split(/\s+/).filter(Boolean).length
  const wcRaw = raw.word_count
  let word_count =
    typeof wcRaw === 'number' && Number.isFinite(wcRaw) ? wcRaw : estimated
  if (word_count === 0 && estimated > 0) {
    word_count = estimated
  }

  return {
    draft_id: String(raw.draft_id ?? raw.id ?? `draft-${index}`),
    angle_label: String(raw.angle_label ?? raw.angle ?? raw.label ?? `Angle ${letter}`),
    angle_description: String(raw.angle_description ?? raw.description ?? ''),
    title,
    body,
    seo_keywords: String(raw.seo_keywords ?? raw.keywords ?? raw.seo ?? '').trim(),
    word_count,
    image_url: coalesceDraftImageUrl(raw),
  }
}
