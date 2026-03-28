'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, ChevronRight, Inbox, Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppNav } from '@/components/AppNav'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { fetchManagerDraftQueue, type IdeaRow } from '@/lib/data/ideas'

export default function ManagerDraftQueuePage() {
  const router = useRouter()
  const { user, role, loading: authLoading, signOut } = useAuth()
  const [rows, setRows] = useState<IdeaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user?.email) {
      router.push('/login')
      return
    }
    if (role !== 'manager') {
      router.push('/intake')
      return
    }

    const run = async () => {
      const supabase = createClient()
      const { data, error: err } = await fetchManagerDraftQueue(supabase)
      if (err) {
        setError(err.message || 'Could not load queue. Check Supabase RLS policies.')
        setLoading(false)
        return
      }
      setRows(data ?? [])
      setLoading(false)
    }
    run()
  }, [authLoading, user, role, router])

  return (
    <div className="min-h-screen bg-black">
      <AppNav role={role} email={user?.email} onSignOut={signOut} active="draft-queue" />

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Draft review queue</h1>
            <p className="text-gray-400 max-w-lg">
              Only ideas waiting for you to pick a draft. Approved or rejected submissions stay in
              the dashboard — they do not appear here.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Inbox className="w-4 h-4 text-primary" />
            <span className="tabular-nums">{rows.length} open</span>
          </div>
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
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
            <Inbox className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-300 font-medium mb-1">Queue is clear</p>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Nothing is waiting for draft review. When a creator submits and drafts are ready,
              it will show up here until you select one or reject all.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/draft-review?idea_id=${encodeURIComponent(row.id)}`}
                  className="group block rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-5 sm:p-6 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wide text-primary mb-3">
                        Awaiting draft review
                      </span>
                      <p className="text-white font-medium line-clamp-3 leading-snug mb-3">
                        {(row.raw_input || '').slice(0, 220)}
                        {(row.raw_input || '').length > 220 ? '…' : ''}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          {row.submitted_by || '—'}
                        </span>
                        <span>
                          {row.submitted_at
                            ? new Date(row.submitted_at).toLocaleString()
                            : ''}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-primary flex-shrink-0 mt-2 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10">
          <Link href="/dashboard">
            <Button variant="outline" className="text-gray-300 border-white/10">
              Back to dashboard
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
