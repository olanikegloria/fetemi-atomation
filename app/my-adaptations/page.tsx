'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ChevronRight,
  Clock,
  Loader2,
  Send,
  CalendarClock,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppNav } from '@/components/AppNav'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { fetchCreatorAdaptationIdeas, type IdeaRow } from '@/lib/data/ideas'
import {
  CREATOR_ADAPTATION_TAB_LABELS,
  creatorAdaptationStatusBadgeClass,
  creatorAdaptationStatusLabel,
  creatorAdaptationTabForStatus,
  type CreatorAdaptationTab,
} from '@/lib/data/idea-status'
import { cn } from '@/lib/utils'

const TAB_ICONS: Record<CreatorAdaptationTab, typeof Clock> = {
  awaiting: Clock,
  publishing: Send,
  published: CheckCircle2,
  scheduled: CalendarClock,
}

function buildAdaptLink(row: IdeaRow): string | null {
  const resume = (row.resume_webhook_url || '').trim()
  if (!resume) return null
  const s = String(row.status || '')
  if (['awaiting_draft_review', 'processing', 'drafting'].includes(s)) return null
  const idea = row.id
  const sub = (row.submitted_by || '').trim().toLowerCase()
  const q = new URLSearchParams({
    idea_id: idea,
    submitted_by: sub,
    resume_url: resume,
  })
  return `/adaptation-review?${q.toString()}`
}

function tabCounts(rows: IdeaRow[]): Record<CreatorAdaptationTab, number> {
  const out: Record<CreatorAdaptationTab, number> = {
    awaiting: 0,
    publishing: 0,
    published: 0,
    scheduled: 0,
  }
  for (const row of rows) {
    const tab = creatorAdaptationTabForStatus(row.status)
    out[tab] += 1
  }
  return out
}

export default function MyAdaptationsPage() {
  const router = useRouter()
  const { user, role, loading: authLoading, signOut } = useAuth()
  const [rows, setRows] = useState<IdeaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<CreatorAdaptationTab>('awaiting')

  useEffect(() => {
    if (authLoading) return
    if (!user?.email) {
      router.push('/login')
      return
    }
    if (role === 'manager') {
      router.push('/manager/draft-queue')
      return
    }

    const run = async () => {
      const supabase = createClient()
      const { data, error: err } = await fetchCreatorAdaptationIdeas(supabase, user.email!)
      if (err) {
        setError(err.message || 'Could not load adaptations.')
        setLoading(false)
        return
      }
      setRows(data ?? [])
      setLoading(false)
    }
    run()
  }, [authLoading, user, role, router])

  const counts = useMemo(() => tabCounts(rows), [rows])

  const filtered = useMemo(
    () => rows.filter((row) => creatorAdaptationTabForStatus(row.status) === tab),
    [rows, tab],
  )

  const tabs: CreatorAdaptationTab[] = ['awaiting', 'publishing', 'published', 'scheduled']

  return (
    <div className="min-h-screen bg-black">
      <AppNav role={role} email={user?.email} onSignOut={signOut} active="my-adaptations" />

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My adaptations</h1>
          <p className="text-gray-400 max-w-xl">
            Filter by stage: review what needs you, track publishing, finished posts, and
            scheduled drops.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div
              className="flex flex-wrap gap-2 mb-8 p-1 rounded-2xl bg-white/[0.04] border border-white/10"
              role="tablist"
              aria-label="Adaptation stage"
            >
              {tabs.map((key) => {
                const Icon = TAB_ICONS[key]
                const active = tab === key
                const n = counts[key]
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(key)}
                    className={cn(
                      'flex-1 min-w-[140px] flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                      active
                        ? 'bg-gradient-to-r from-primary/90 to-accent/80 text-white shadow-lg shadow-primary/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/5',
                    )}
                  >
                    <Icon className="w-4 h-4 opacity-90" />
                    <span>{CREATOR_ADAPTATION_TAB_LABELS[key]}</span>
                    <span
                      className={cn(
                        'tabular-nums text-xs px-2 py-0.5 rounded-full',
                        active ? 'bg-white/20' : 'bg-white/10 text-gray-500',
                      )}
                    >
                      {n}
                    </span>
                  </button>
                )
              })}
            </div>

            {rows.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">
                <p className="text-gray-300 mb-2 font-medium">No ideas yet</p>
                <p className="text-gray-500 text-sm mb-6">
                  Submit an idea to start the pipeline — drafts and adaptations will show here.
                </p>
                <Link href="/intake">
                  <Button className="glass-button-primary">Submit an idea</Button>
                </Link>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center text-gray-500 text-sm">
                {tab === 'scheduled' && (
                  <>
                    <CalendarClock className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-400 mb-1 font-medium">Nothing scheduled</p>
                    <p>
                      When your automation sets status to <code className="text-primary/90">scheduled</code>,
                      those ideas appear here.
                    </p>
                  </>
                )}
                {tab === 'published' && (
                  <p>Completed posts will land here once status is published or partial.</p>
                )}
                {tab === 'publishing' && (
                  <p>Nothing in the publishing queue right now.</p>
                )}
                {tab === 'awaiting' && (
                  <p>Nothing in this stage — try another filter above.</p>
                )}
              </div>
            ) : (
              <ul className="space-y-4">
                {filtered.map((row) => {
                  const href = buildAdaptLink(row)
                  const statusLabel = creatorAdaptationStatusLabel(row.status)
                  const badgeClass = creatorAdaptationStatusBadgeClass(row.status)
                  const canReview = Boolean(href)

                  const inner = (
                    <>
                      <div className="flex flex-wrap items-start gap-2 mb-3">
                        <span
                          className={cn(
                            'inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-lg border',
                            badgeClass,
                          )}
                        >
                          {statusLabel}
                        </span>
                        {row.manager_name ? (
                          <span className="text-xs text-gray-500 self-center">
                            Manager · {row.manager_name}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-white font-medium line-clamp-2 leading-snug mb-2">
                        {(row.raw_input || '').slice(0, 200)}
                        {(row.raw_input || '').length > 200 ? '…' : ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        {row.submitted_at
                          ? new Date(row.submitted_at).toLocaleString()
                          : ''}
                      </p>
                    </>
                  )

                  return (
                    <li key={row.id}>
                      {canReview ? (
                        <Link
                          href={href!}
                          className="group block rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-5 sm:p-6 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">{inner}</div>
                            <ChevronRight className="w-5 h-5 text-primary flex-shrink-0 mt-1 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </Link>
                      ) : (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">{inner}</div>
                          </div>
                          <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-white/10">
                            {row.resume_webhook_url
                              ? 'Open when adaptations are ready — refresh if you just received the email.'
                              : 'Resume link not ready yet — check your email from Fetemi or wait and refresh.'}
                          </p>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="mt-10 flex gap-3">
              <Link href="/intake">
                <Button className="glass-button-primary">New idea</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="text-gray-300 border-white/10">
                  Dashboard
                </Button>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
