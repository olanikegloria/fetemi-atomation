'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { n8nFetch } from '@/lib/auth/n8n-fetch'
import {
  fetchCreatorDashboardFromSupabase,
  fetchManagerDashboardStats,
  fetchManagerOpsMetrics,
  type ManagerOpsMetrics,
} from '@/lib/data/ideas'
import { AppNav } from '@/components/AppNav'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Clock,
  FileText,
} from 'lucide-react'

interface Idea {
  idea_id: string
  input_type: string
  raw_input: string
  status: string
  submitted_at: string
  manager_name: string
  platforms?: {
    linkedin: string | null
    x: string | null
    email: string | null
  }
}

interface DashboardData {
  email: string
  summary: {
    total: number
    published: number
    awaiting: number
    rejected: number
  }
  ideas: Idea[]
}

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    processing: 'bg-blue-500/20 text-blue-400',
    drafting: 'bg-blue-500/20 text-blue-400',
    awaiting_draft_review: 'bg-yellow-500/20 text-yellow-400',
    draft_rejected: 'bg-red-500/20 text-red-400',
    adapting: 'bg-purple-500/20 text-purple-400',
    awaiting_adaptation_review: 'bg-yellow-500/20 text-yellow-400',
    publishing: 'bg-indigo-500/20 text-indigo-400',
    partial: 'bg-yellow-500/20 text-yellow-400',
    done: 'bg-green-500/20 text-green-400',
    error: 'bg-red-500/20 text-red-400',
    expired: 'bg-red-500/20 text-red-400',
  }
  return colorMap[status] || colorMap['processing']
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    processing: 'Processing',
    drafting: 'Drafting',
    awaiting_draft_review: 'Awaiting draft review',
    draft_rejected: 'Rejected',
    adapting: 'Adapting',
    awaiting_adaptation_review: 'Awaiting adaptation',
    publishing: 'Publishing',
    partial: 'Partially published',
    done: 'Published',
    error: 'Error',
    expired: 'Expired',
  }
  return labels[status] || 'Processing'
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, session, role, loading: authLoading, signOut } = useAuth()

  const [creatorData, setCreatorData] = useState<DashboardData | null>(null)
  const [managerStats, setManagerStats] = useState<NonNullable<
    Awaited<ReturnType<typeof fetchManagerDashboardStats>>['stats']
  > | null>(null)
  const [managerOps, setManagerOps] = useState<ManagerOpsMetrics | null>(null)
  const [managerIdeas, setManagerIdeas] = useState<
    {
      id: string
      raw_input: string | null
      status: string | null
      submitted_at: string | null
      submitted_by: string | null
    }[]
  >([])

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [creatorDataFromSupabase, setCreatorDataFromSupabase] = useState(false)
  const [managerStatusFilter, setManagerStatusFilter] = useState('all')
  const [managerSearch, setManagerSearch] = useState('')
  const [managerIdeaDetail, setManagerIdeaDetail] = useState<
    (typeof managerIdeas)[number] | null
  >(null)
  const [managerIdeasListOpen, setManagerIdeasListOpen] = useState(false)

  const load = useCallback(async () => {
    if (!user?.email || !session) return
    setIsRefreshing(true)
    setError('')

    try {
      if (role === 'manager') {
        const supabase = createClient()
        const { stats, error: se } = await fetchManagerDashboardStats(supabase)
        if (se || !stats) {
          setError(se?.message || 'Could not load manager stats. Run SQL policies in supabase/rls_ideas_content_team.sql.')
        } else {
          setManagerStats(stats)
        }

        const { metrics, error: oe } = await fetchManagerOpsMetrics(supabase)
        if (oe || !metrics) {
          // Keep the dashboard usable even if ops metrics fail.
          setManagerOps(null)
        } else {
          setManagerOps(metrics)
        }

        const { data: allIdeas, error: ie } = await supabase
          .from('ideas')
          .select('id, raw_input, status, submitted_at, submitted_by')
          .order('submitted_at', { ascending: false })
          .limit(80)
        if (!ie && allIdeas) setManagerIdeas(allIdeas as typeof managerIdeas)
      } else {
        setCreatorDataFromSupabase(false)
        const res = await n8nFetch(
          `get-dashboard?email=${encodeURIComponent(user.email)}`,
          { accessToken: session.access_token }
        )
        if (res.ok) {
          const json = (await res.json()) as DashboardData
          setCreatorData(json)
        } else {
          const supabase = createClient()
          const { data: fallback, error: fe } =
            await fetchCreatorDashboardFromSupabase(supabase, user.email)
          if (fallback && !fe) {
            setCreatorData(fallback as DashboardData)
            setCreatorDataFromSupabase(true)
          } else {
            setCreatorData(null)
            setError(
              res.status === 401
                ? 'Could not load dashboard from n8n (401), and no ideas were found in Supabase for your account. Check n8n webhook auth or add N8N_WEBHOOK_SECRET; ensure intake writes to the ideas table.'
                : `Could not load dashboard data (${res.status})`,
            )
          }
        }
      }
    } catch {
      setError('Could not load dashboard data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [user, session, role])

  useEffect(() => {
    if (authLoading) return
    if (!user?.email || !session) {
      router.push('/login')
      return
    }
    load()
  }, [authLoading, user, session, router, load])

  const filteredManagerIdeas = useMemo(() => {
    if (role !== 'manager') return managerIdeas
    const q = managerSearch.trim().toLowerCase()
    return managerIdeas.filter((row) => {
      const status = String(row.status || '')
      if (managerStatusFilter !== 'all' && status !== managerStatusFilter) return false
      if (!q) return true
      const text = String(row.raw_input || '').toLowerCase()
      const by = String(row.submitted_by || '').toLowerCase()
      return text.includes(q) || String(row.id).toLowerCase().includes(q) || by.includes(q)
    })
  }, [role, managerIdeas, managerStatusFilter, managerSearch])

  const MANAGER_IDEAS_PREVIEW = 6
  const managerIdeasPreview = useMemo(
    () => filteredManagerIdeas.slice(0, MANAGER_IDEAS_PREVIEW),
    [filteredManagerIdeas],
  )
  const managerIdeasExtraCount = Math.max(0, filteredManagerIdeas.length - MANAGER_IDEAS_PREVIEW)

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <AppNav role={role} email={user?.email} onSignOut={signOut} active="dashboard" />

      {role === 'manager' ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Fetemi · Operations
              </p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-2">
                Manager dashboard
              </h1>
              <p className="text-zinc-400 text-sm max-w-2xl">
                Pipeline health, SLA signals, and recent ideas. Filter by stage or search by text, ID, or creator.
              </p>
            </div>
            <button
              type="button"
              onClick={() => load()}
              disabled={isRefreshing}
              className="p-3 rounded-xl border border-white/10 hover:bg-white/5"
              aria-label="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {managerStats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
              {[
                { label: 'Ideas (today)', value: managerStats.ideasCreatedToday, icon: Sparkles },
                { label: 'Ideas (7d)', value: managerStats.ideasCreated7d, icon: TrendingUp },
                { label: 'Ideas (30d)', value: managerStats.ideasCreated30d, icon: TrendingUp },
                { label: 'Awaiting draft review', value: managerStats.awaitingDraft, icon: Clock },
                { label: 'Awaiting adaptation', value: managerStats.awaitingAdaptation, icon: Clock },
                { label: 'Publishing', value: managerStats.publishing, icon: Clock },
                { label: 'Done', value: managerStats.done, icon: CheckCircle2 },
                { label: 'Rejected / error', value: managerStats.rejected, icon: AlertCircle },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="glass-card p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent"
                >
                  <Icon className="w-5 h-5 text-primary mb-3 opacity-80" />
                  <div className="text-3xl font-bold text-white tabular-nums">{value}</div>
                  <div className="text-xs text-gray-400 mt-2 uppercase tracking-wide">{label}</div>
                </div>
              ))}
            </div>
          )}

          {managerOps && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-white mb-4">SLA & Ops Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="glass-card p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent">
                  <div className="text-sm text-gray-400 uppercase tracking-wide mb-3">
                    Time in stage (avg)
                  </div>
                  <div className="space-y-2">
                    {[
                      ['awaiting_draft_review', 'Awaiting draft review'],
                      ['awaiting_adaptation_review', 'Awaiting adaptation'],
                      ['publishing', 'Publishing'],
                    ].map(([status, label]) => (
                      <div key={status} className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-300">{label}</span>
                        <span className="text-sm font-semibold text-white tabular-nums">
                          {Number(managerOps.avgHoursInStage[status] ?? 0).toFixed(1)}h
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent">
                  <div className="text-sm text-gray-400 uppercase tracking-wide mb-3">
                    Stuck items (age &gt; 6h)
                  </div>
                  <div className="space-y-2">
                    {[
                      ['awaiting_draft_review', 'Awaiting draft'],
                      ['awaiting_adaptation_review', 'Awaiting adaptation'],
                      ['publishing', 'Publishing'],
                    ].map(([status, label]) => (
                      <div key={status} className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-300">{label}</span>
                        <span className="text-sm font-semibold text-white tabular-nums">
                          {managerOps.stuckCounts[status] ?? 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                <div className="glass-card p-6 rounded-2xl border border-white/10">
                  <div className="text-sm text-gray-400 uppercase tracking-wide mb-3">
                    Throughput
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-300">Published (7d)</span>
                      <span className="text-sm font-semibold text-white tabular-nums">
                        {managerOps.throughput.published7d}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-300">Published (30d)</span>
                      <span className="text-sm font-semibold text-white tabular-nums">
                        {managerOps.throughput.published30d}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-300">Rejected (30d)</span>
                      <span className="text-sm font-semibold text-white tabular-nums">
                        {managerOps.throughput.rejected30d}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl border border-white/10 lg:col-span-2">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="text-sm text-gray-400 uppercase tracking-wide">
                      Rejection trend (14d)
                    </div>
                    <div className="text-xs text-gray-500">
                      Draft rejected + error + expired
                    </div>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {managerOps.rejectionTrend.map((p) => (
                      <div key={p.day} className="min-w-[56px] flex-1">
                        <div className="text-[10px] text-gray-500 text-center mb-1">
                          {p.day.split(' ')[0]}
                        </div>
                        <div
                          className="h-24 rounded-xl border border-white/10 bg-white/[0.04] flex items-end justify-center px-1"
                          title={`${p.day}: ${p.count}`}
                        >
                          <div
                            className="w-full rounded-lg bg-destructive/30"
                            style={{
                              height: `${Math.min(100, p.count * 20)}%`,
                            }}
                          />
                        </div>
                        <div className="text-[10px] text-gray-500 text-center mt-1 tabular-nums">
                          {p.count}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="text-sm text-gray-400 uppercase tracking-wide">
                    Per-platform success rate (approx)
                  </div>
                  <div className="text-xs text-gray-500">
                    {managerOps.perPlatformSuccessRate.computedAs}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { key: 'linkedin', val: managerOps.perPlatformSuccessRate.linkedin },
                    { key: 'x', val: managerOps.perPlatformSuccessRate.x },
                    { key: 'email', val: managerOps.perPlatformSuccessRate.email },
                  ].map(({ key, val }) => (
                    <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-sm font-semibold text-white capitalize mb-1">
                        {String(key)}
                      </div>
                      <div className="text-2xl font-bold text-primary tabular-nums">
                        {val === null ? 'N/A' : `${Math.round(val * 100)}%`}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Success among published/partial stages
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mb-8">
            <Link href="/manager/draft-queue">
              <Button className="glass-button-primary">Open draft review queue</Button>
            </Link>
            <Link href="/manager/content-creators">
              <Button
                variant="outline"
                className="border-white/15 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.06]"
              >
                Content creators
              </Button>
            </Link>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-white/10 mb-6">
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <input
                value={managerSearch}
                onChange={(e) => setManagerSearch(e.target.value)}
                placeholder="Search by idea text, ID, or creator email"
                className="bg-gray-900/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 w-full md:max-w-sm"
              />
              <div className="flex flex-wrap gap-2">
                {[
                  ['all', 'All'],
                  ['awaiting_draft_review', 'Awaiting draft'],
                  ['awaiting_adaptation_review', 'Awaiting adaptation'],
                  ['publishing', 'Publishing'],
                  ['done', 'Done'],
                  ['error', 'Error'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setManagerStatusFilter(value)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                      managerStatusFilter === value
                        ? 'border-primary/70 text-white bg-primary/20'
                        : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-white mb-4">Recent ideas</h2>
          <div className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredManagerIdeas.length === 0 ? (
              <p className="text-zinc-500 text-sm md:col-span-2">No rows returned (check RLS).</p>
            ) : (
              managerIdeasPreview.map((row) => (
                <div
                  key={row.id}
                  className="glass-card p-5 rounded-2xl border border-white/10 hover:border-white/15 transition-colors flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-white text-sm line-clamp-3 leading-snug min-w-0">
                      {(row.raw_input || '').slice(0, 160)}
                      {(row.raw_input || '').length > 160 ? '…' : ''}
                    </p>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap shrink-0 ${getStatusColor(row.status || '')}`}
                    >
                      {getStatusLabel(row.status || '')}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-4">
                    {row.submitted_by ? (
                      <span className="text-zinc-400 block sm:inline sm:mr-2">{row.submitted_by}</span>
                    ) : null}
                    {row.submitted_at ? new Date(row.submitted_at).toLocaleString() : ''}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-auto border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.06]"
                    onClick={() => setManagerIdeaDetail(row)}
                  >
                    <FileText className="w-4 h-4 mr-2 opacity-80" />
                    Read more
                  </Button>
                </div>
              ))
            )}
          </div>

          {managerIdeasExtraCount > 0 ? (
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                className="border-white/15 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.06]"
                onClick={() => setManagerIdeasListOpen(true)}
              >
                See all ideas
                <span className="ml-2 text-zinc-500 tabular-nums">
                  ({filteredManagerIdeas.length} total, {managerIdeasExtraCount} more)
                </span>
              </Button>
            </div>
          ) : null}
          </div>

          <Dialog open={managerIdeasListOpen} onOpenChange={setManagerIdeasListOpen}>
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col border-white/10 bg-zinc-900 text-zinc-100 p-0 gap-0">
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/[0.06] shrink-0">
                <DialogTitle className="text-left text-white">All ideas</DialogTitle>
                <p className="text-sm text-zinc-500 text-left font-normal">
                  Filtered results ({filteredManagerIdeas.length}). Open a card to read full text.
                </p>
              </DialogHeader>
              <div className="overflow-y-auto px-6 py-4 flex-1 min-h-0 space-y-3">
                {filteredManagerIdeas.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => {
                      setManagerIdeaDetail(row)
                      setManagerIdeasListOpen(false)
                    }}
                    className="w-full text-left glass-card p-4 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-white text-sm line-clamp-2 leading-snug">
                        {(row.raw_input || '').slice(0, 120)}
                        {(row.raw_input || '').length > 120 ? '…' : ''}
                      </p>
                      <span
                        className={`shrink-0 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(row.status || '')}`}
                      >
                        {getStatusLabel(row.status || '')}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">
                      {row.submitted_by ? `${row.submitted_by} · ` : ''}
                      {row.submitted_at ? new Date(row.submitted_at).toLocaleString() : ''}
                    </p>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={managerIdeaDetail !== null} onOpenChange={(o) => !o && setManagerIdeaDetail(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border-white/10 bg-zinc-900 text-zinc-100">
              {managerIdeaDetail ? (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-left text-white pr-8">Idea detail</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">Status</p>
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${getStatusColor(managerIdeaDetail.status || '')}`}
                      >
                        {getStatusLabel(managerIdeaDetail.status || '')}
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">Creator</p>
                      <p className="text-zinc-300 break-all">
                        {managerIdeaDetail.submitted_by || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">Submitted</p>
                      <p className="text-zinc-300">
                        {managerIdeaDetail.submitted_at
                          ? new Date(managerIdeaDetail.submitted_at).toLocaleString()
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">Idea ID</p>
                      <p className="font-mono text-xs text-zinc-400 break-all">{managerIdeaDetail.id}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">Full text</p>
                      <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed rounded-lg border border-white/[0.06] bg-zinc-950/80 p-4 max-h-[50vh] overflow-y-auto">
                        {managerIdeaDetail.raw_input || '—'}
                      </p>
                    </div>
                  </div>
                </>
              ) : null}
            </DialogContent>
          </Dialog>
        </main>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Fetemi · Creator
              </p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-2">Your dashboard</h1>
              <p className="text-zinc-400 text-sm max-w-2xl">
                Ideas, pipeline status, and shortcuts — same layout as the operations view, without the manager-only
                metrics.
              </p>
            </div>
            <button
              type="button"
              onClick={() => load()}
              disabled={isRefreshing}
              className="p-3 rounded-xl border border-white/10 hover:bg-white/5 self-start sm:self-auto"
              aria-label="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {creatorDataFromSupabase && creatorData && (
            <div className="mb-6 p-4 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sm text-sky-100/90">
              Showing your ideas from the database. The n8n dashboard was unavailable (often a 401 until webhook auth
              matches your app). Stats below are derived from stored idea rows.
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/25 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {isLoading && !creatorData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-zinc-900/50 h-24 animate-pulse" />
              ))}
            </div>
          ) : creatorData ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[
                  { label: 'Total ideas', value: creatorData.summary.total, icon: Sparkles },
                  { label: 'Published', value: creatorData.summary.published, icon: CheckCircle2 },
                  { label: 'Awaiting', value: creatorData.summary.awaiting, icon: Clock },
                  { label: 'Rejected', value: creatorData.summary.rejected, icon: AlertCircle },
                ].map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="glass-card p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent"
                  >
                    <Icon className="w-5 h-5 text-primary mb-3 opacity-80" />
                    <div className="text-3xl font-bold text-white tabular-nums">{value}</div>
                    <div className="text-xs text-zinc-500 mt-2 uppercase tracking-wide">{label}</div>
                  </div>
                ))}
              </div>

              <h2 className="text-xl font-semibold text-white mb-4">Recent ideas</h2>
              {creatorData.ideas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                  {creatorData.ideas.map((idea) => (
                    <div
                      key={idea.idea_id}
                      className="glass-card p-5 rounded-2xl border border-white/10 hover:border-white/15 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-white text-sm line-clamp-3 leading-snug">
                          {(idea.raw_input || '').slice(0, 160)}
                          {(idea.raw_input || '').length > 160 ? '…' : ''}
                        </p>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap shrink-0 ${getStatusColor(idea.status)}`}
                        >
                          {getStatusLabel(idea.status)}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">
                        {idea.submitted_at ? new Date(idea.submitted_at).toLocaleString() : ''}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card p-10 rounded-2xl border border-white/10 text-center mb-10">
                  <CheckCircle2 className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-400 text-sm mb-4">No ideas yet.</p>
                  <Link href="/intake">
                    <Button className="glass-button-primary">Submit an idea</Button>
                  </Link>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/intake" className="flex-1 sm:flex-initial">
                  <Button className="glass-button-primary w-full sm:w-auto">New content</Button>
                </Link>
                <Link href="/my-adaptations" className="flex-1 sm:flex-initial">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-white/15 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.06]"
                  >
                    My adaptations
                  </Button>
                </Link>
              </div>
            </>
          ) : null}
        </main>
      )}
    </div>
  )
}
