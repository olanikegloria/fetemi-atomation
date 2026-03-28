import type { SupabaseClient } from '@supabase/supabase-js'
import {
  isManagerDraftQueueRow,
  MANAGER_DRAFT_QUEUE_STATUS,
} from '@/lib/data/idea-status'

export type IdeaRow = {
  id: string
  input_type: string | null
  raw_input: string | null
  status: string | null
  submitted_by: string | null
  manager_name: string | null
  submitted_at: string | null
  resume_webhook_url: string | null
}

/**
 * Manager queue: only ideas waiting on draft selection (excludes approved/rejected pipeline states).
 * Defensively filters rows in case `status` in DB is out of sync with n8n.
 */
export async function fetchManagerDraftQueue(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('ideas')
    .select('id, raw_input, status, submitted_by, manager_name, submitted_at')
    .eq('status', MANAGER_DRAFT_QUEUE_STATUS)
    .order('submitted_at', { ascending: false })

  if (error) return { data: null as IdeaRow[] | null, error }
  const safe =
    (data as IdeaRow[] | null)?.filter((row) => isManagerDraftQueueRow(row.status)) ?? []
  return { data: safe, error: null }
}

/**
 * Creator: all ideas except rejected drafts — filtered in UI by adaptation phase
 * (awaiting review, publishing, published, scheduled).
 */
export async function fetchCreatorAdaptationIdeas(
  supabase: SupabaseClient,
  email: string,
) {
  const e = email.trim().toLowerCase()
  const { data, error } = await supabase
    .from('ideas')
    .select(
      'id, raw_input, status, submitted_by, submitted_at, resume_webhook_url, manager_name',
    )
    .eq('submitted_by', e)
    .order('submitted_at', { ascending: false })
    .limit(100)

  if (error) return { data: null, error }
  const rows = (data as IdeaRow[] | null)?.filter(
    (row) => String(row.status || '').trim() !== 'draft_rejected',
  )
  return { data: rows ?? [], error: null }
}

/** @deprecated Use fetchCreatorAdaptationIdeas — kept for any external imports. */
export async function fetchCreatorAdaptationQueue(
  supabase: SupabaseClient,
  email: string,
) {
  return fetchCreatorAdaptationIdeas(supabase, email)
}

/** Manager-only aggregate stats for dashboard cards (requires RLS allowing manager read on `ideas`). */
export async function fetchManagerDashboardStats(supabase: SupabaseClient) {
  const { data: ideas, error } = await supabase
    .from('ideas')
    .select('id, status, submitted_at')
  if (error || !ideas) return { error, stats: null }

  const now = Date.now()
  const day = 86400000
  const isToday = (iso: string | null) => {
    if (!iso) return false
    const t = new Date(iso).getTime()
    return t >= now - (now % day) && t < now - (now % day) + day
  }
  const inLast = (iso: string | null, ms: number) => {
    if (!iso) return false
    return now - new Date(iso).getTime() <= ms
  }

  const rows = ideas as { id: string; status: string | null; submitted_at: string | null }[]
  const ideasCreatedToday = rows.filter((i) => isToday(i.submitted_at)).length
  const ideasCreated7d = rows.filter((i) => inLast(i.submitted_at, 7 * day)).length
  const ideasCreated30d = rows.filter((i) => inLast(i.submitted_at, 30 * day)).length

  const awaitingDraft = rows.filter((i) => i.status === 'awaiting_draft_review').length
  const awaitingAdaptation = rows.filter(
    (i) => i.status === 'awaiting_adaptation_review'
  ).length
  const publishing = rows.filter((i) => i.status === 'publishing').length
  const done = rows.filter((i) => i.status === 'done').length
  const rejected = rows.filter(
    (i) => i.status === 'draft_rejected' || i.status === 'error'
  ).length

  return {
    error: null,
    stats: {
      total: rows.length,
      ideasCreatedToday,
      ideasCreated7d,
      ideasCreated30d,
      awaitingDraft,
      awaitingAdaptation,
      publishing,
      done,
      rejected,
    },
  }
}

export type RejectionKind = 'draft_rejected' | 'error' | 'expired'

export interface ManagerOpsMetrics {
  avgHoursInStage: Partial<Record<string, number>>
  stuckCounts: Partial<Record<string, number>>
  throughput: {
    published7d: number
    published30d: number
    rejected30d: number
  }
  rejectionTrend: Array<{ day: string; count: number }>
  perPlatformSuccessRate: {
    linkedin: number | null
    x: number | null
    email: number | null
    computedAs: string
  }
}

/**
 * Dashboard "SLA & Ops" metrics computed from existing columns:
 * - `ideas.status`
 * - `ideas.submitted_at` (used as the only available timestamp in current schema)
 *
 * This avoids DB schema changes while still providing actionable "stuck" + throughput signals.
 */
export async function fetchManagerOpsMetrics(
  supabase: SupabaseClient,
): Promise<{ error: Error | null; metrics: ManagerOpsMetrics | null }> {
  const { data: ideas, error } = await supabase
    .from('ideas')
    .select('id, status, submitted_at')
    .order('submitted_at', { ascending: false })
    .limit(250)

  if (error || !ideas) {
    return { error: error || new Error('No data'), metrics: null }
  }

  const now = Date.now()
  const msDay = 86400000

  const ageHours = (iso: string | null) => {
    if (!iso) return null
    const t = new Date(iso).getTime()
    if (Number.isNaN(t)) return null
    return (now - t) / 3600000
  }

  const stageStatuses = [
    'awaiting_draft_review',
    'awaiting_adaptation_review',
    'publishing',
  ] as const

  const stuckThresholdHours: Record<(typeof stageStatuses)[number], number> = {
    awaiting_draft_review: 6,
    awaiting_adaptation_review: 6,
    publishing: 6,
  }

  const buckets = new Map<string, { sum: number; count: number; stuck: number }>()
  for (const s of stageStatuses) {
    buckets.set(s, { sum: 0, count: 0, stuck: 0 })
  }

  const publishedKinds = new Set<string>(['done', 'partial'])
  const rejectionKinds = new Set<string>([
    'draft_rejected',
    'error',
    'expired',
  ])

  let published7d = 0
  let published30d = 0
  let rejected30d = 0

  // Rejection trend: last 14 days, group by day label.
  const trendDays = 14
  const trendStart = now - (trendDays - 1) * msDay
  const trendByDay = new Map<string, number>()
  for (let i = 0; i < trendDays; i++) {
    const t = trendStart + i * msDay
    const d = new Date(t)
    const key = d.toISOString().slice(0, 10) // YYYY-MM-DD
    trendByDay.set(key, 0)
  }

  for (const idea of ideas as { status: string | null; submitted_at: string | null }[]) {
    const status = String(idea.status || '').trim()
    const h = ageHours(idea.submitted_at)

    // Stage metrics
    if (buckets.has(status) && h !== null) {
      const b = buckets.get(status)!
      b.sum += h
      b.count += 1
      if (h > (stuckThresholdHours as Record<string, number>)[status]) {
        b.stuck += 1
      }
    }

    const submittedMs = idea.submitted_at ? new Date(idea.submitted_at).getTime() : null
    if (submittedMs === null || Number.isNaN(submittedMs)) continue

    // Throughput
    if (publishedKinds.has(status)) {
      if (now - submittedMs <= 7 * msDay) published7d += 1
      if (now - submittedMs <= 30 * msDay) published30d += 1
    }
    if (rejectionKinds.has(status)) {
      if (now - submittedMs <= 30 * msDay) rejected30d += 1
      if (submittedMs >= trendStart) {
        const key = new Date(submittedMs).toISOString().slice(0, 10)
        trendByDay.set(key, (trendByDay.get(key) || 0) + 1)
      }
    }
  }

  const avgHoursInStage: Partial<Record<string, number>> = {}
  const stuckCounts: Partial<Record<string, number>> = {}
  for (const [s, b] of buckets.entries()) {
    avgHoursInStage[s] = b.count ? b.sum / b.count : 0
    stuckCounts[s] = b.stuck
  }

  const rejectionTrend: Array<{ day: string; count: number }> = Array.from(
    trendByDay.entries(),
  )
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, count]) => {
      const d = new Date(day)
      // Friendly label (Mon, Tue...) without locale dependencies.
      const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()]
      return { day: `${weekday} ${day.slice(5)}`, count }
    })

  // Per-platform success rate approximation:
  // - `done` implies all platforms succeeded
  // - `partial` implies some platforms succeeded; without per-platform outcome fields,
  //   we assume 50% average platform success.
  const doneCount = (ideas as { status: string | null }[]).filter(
    (i) => String(i.status || '').trim() === 'done',
  ).length
  const partialCount = (ideas as { status: string | null }[]).filter(
    (i) => String(i.status || '').trim() === 'partial',
  ).length

  const denom = doneCount + partialCount
  const platformSuccess = denom ? (doneCount + partialCount * 0.5) / denom : null

  const metrics: ManagerOpsMetrics = {
    avgHoursInStage,
    stuckCounts,
    throughput: {
      published7d,
      published30d,
      rejected30d,
    },
    rejectionTrend,
    perPlatformSuccessRate: {
      linkedin: platformSuccess,
      x: platformSuccess,
      email: platformSuccess,
      computedAs:
        denom === 0
          ? 'N/A (no published/partial ideas yet)'
          : 'Approx: done=100%, partial=50% per platform (no per-platform outcomes stored in UI data).',
    },
  }

  return { error: null, metrics }
}

/** Creator dashboard shape (matches n8n get-dashboard JSON; used when n8n is unavailable). */
export interface CreatorDashboardIdea {
  idea_id: string
  input_type: string
  raw_input: string
  status: string
  submitted_at: string
  manager_name: string
}

export interface CreatorDashboardData {
  email: string
  summary: {
    total: number
    published: number
    awaiting: number
    rejected: number
  }
  ideas: CreatorDashboardIdea[]
}

function buildCreatorDashboardData(
  email: string,
  rows: {
    id: string
    input_type: string | null
    raw_input: string | null
    status: string | null
    submitted_at: string | null
    manager_name: string | null
  }[],
): CreatorDashboardData {
  const ideas: CreatorDashboardIdea[] = rows.map((r) => ({
    idea_id: r.id,
    input_type: (r.input_type || 'idea').trim() || 'idea',
    raw_input: r.raw_input || '',
    status: r.status || 'processing',
    submitted_at: r.submitted_at || new Date(0).toISOString(),
    manager_name: r.manager_name || '',
  }))

  const published = rows.filter((r) => r.status === 'done').length
  const rejected = rows.filter((r) =>
    ['draft_rejected', 'error', 'expired'].includes(String(r.status || '')),
  ).length
  const awaiting = rows.filter((r) => {
    const s = String(r.status || '')
    if (s === 'done') return false
    if (['draft_rejected', 'error', 'expired'].includes(s)) return false
    return true
  }).length

  return {
    email,
    summary: {
      total: rows.length,
      published,
      awaiting,
      rejected,
    },
    ideas,
  }
}

/** Fallback when n8n get-dashboard fails (e.g. 401): same user's rows from Supabase. */
export async function fetchCreatorDashboardFromSupabase(
  supabase: SupabaseClient,
  email: string,
) {
  const e = email.trim().toLowerCase()
  const { data, error } = await supabase
    .from('ideas')
    .select('id, input_type, raw_input, status, submitted_at, manager_name')
    .eq('submitted_by', e)
    .order('submitted_at', { ascending: false })
    .limit(50)

  if (error) return { data: null as CreatorDashboardData | null, error }
  return {
    data: buildCreatorDashboardData(e, data || []),
    error: null,
  }
}
