/**
 * Central mapping for `ideas.status` across manager queue, creator adaptations, and dashboards.
 */

/** Only these appear on the manager draft review queue. */
export const MANAGER_DRAFT_QUEUE_STATUS = 'awaiting_draft_review' as const

export function isManagerDraftQueueRow(status: string | null | undefined): boolean {
  return String(status || '').trim() === MANAGER_DRAFT_QUEUE_STATUS
}

/** Creator "My adaptations" filter tabs (UI). */
export type CreatorAdaptationTab = 'awaiting' | 'publishing' | 'published' | 'scheduled'

export function creatorAdaptationTabForStatus(
  status: string | null | undefined,
): CreatorAdaptationTab {
  const s = String(status || '').trim()
  if (s === 'awaiting_adaptation_review' || s === 'adapting') return 'awaiting'
  if (s === 'publishing') return 'publishing'
  if (s === 'done' || s === 'partial') return 'published'
  if (s === 'scheduled') return 'scheduled'
  // Pipeline / pre-adaptation / attention: show under Awaiting with a distinct card label
  return 'awaiting'
}

export function creatorAdaptationStatusLabel(status: string | null | undefined): string {
  const s = String(status || '').trim()
  const labels: Record<string, string> = {
    processing: 'Processing',
    drafting: 'Drafting',
    awaiting_draft_review: 'Awaiting manager (drafts)',
    adapting: 'Adaptations generating',
    awaiting_adaptation_review: 'Ready to review',
    publishing: 'Publishing',
    partial: 'Partially published',
    done: 'Published',
    scheduled: 'Scheduled',
    error: 'Needs attention',
    expired: 'Expired',
  }
  return labels[s] || (s ? s.replace(/_/g, ' ') : 'In progress')
}

export function creatorAdaptationStatusBadgeClass(status: string | null | undefined): string {
  const s = String(status || '').trim()
  const map: Record<string, string> = {
    processing: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    drafting: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    awaiting_draft_review: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    adapting: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    awaiting_adaptation_review: 'bg-primary/15 text-primary border-primary/30',
    publishing: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    partial: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    done: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    scheduled: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    error: 'bg-destructive/15 text-red-300 border-destructive/30',
    expired: 'bg-destructive/15 text-red-300 border-destructive/30',
  }
  return map[s] || 'bg-white/5 text-gray-400 border-white/10'
}

export const CREATOR_ADAPTATION_TAB_LABELS: Record<CreatorAdaptationTab, string> = {
  awaiting: 'Awaiting',
  publishing: 'Publishing',
  published: 'Published',
  scheduled: 'Scheduled',
}
