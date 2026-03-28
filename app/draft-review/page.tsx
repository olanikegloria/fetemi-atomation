'use client'

import { useEffect, useState, Suspense, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  AlertCircle,
  Loader2,
  CheckCircle2,
  Save,
  FileText,
  ChevronRight,
  LayoutGrid,
} from 'lucide-react'
import Link from 'next/link'
import { AppNav } from '@/components/AppNav'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { n8nFetch } from '@/lib/auth/n8n-fetch'
import { normalizeDraftFromApi } from '@/lib/draft/normalize'
import type { DraftData } from '@/lib/draft/types'
import { stripHtmlToPlainText } from '@/lib/text/strip-html'
import { resolveDraftImageUrlForDisplay } from '@/lib/media/image-url-display'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function DraftReviewContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const idea_id = searchParams.get('idea_id')
  const { user, session, role, loading: authLoading, signOut } = useAuth()
  const [ideaMeta, setIdeaMeta] = useState<{
    submitted_by: string
    manager_name: string
  } | null>(null)

  const [data, setData] = useState<DraftData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showRejectPanel, setShowRejectPanel] = useState(false)
  const [draftEdits, setDraftEdits] = useState<
    Record<string, { body: string; title: string }>
  >({})
  const [savingDraftId, setSavingDraftId] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState('')
  const [modalDraftId, setModalDraftId] = useState<string | null>(null)

  useEffect(() => {
    if (!data?.drafts?.length) return
    setDraftEdits((prev) => {
      const next = { ...prev }
      for (const d of data.drafts) {
        if (!next[d.draft_id]) {
          next[d.draft_id] = {
            body: d.body || '',
            title: d.title || '',
          }
        }
      }
      return next
    })
  }, [data])

  const modalDraft = useMemo(() => {
    if (!modalDraftId || !data?.drafts) return null
    return data.drafts.find((d) => d.draft_id === modalDraftId) ?? null
  }, [modalDraftId, data])

  useEffect(() => {
    if (authLoading) return
    if (!user?.email || role !== 'manager') {
      router.push('/login')
      return
    }
    if (!idea_id) {
      setError('Invalid or expired review link')
      setIsLoading(false)
      return
    }

    const run = async () => {
      try {
        const supabase = createClient()
        const { data: ideaRow, error: ideaErr } = await supabase
          .from('ideas')
          .select('submitted_by, manager_name')
          .eq('id', idea_id)
          .maybeSingle()
        if (ideaErr || !ideaRow) {
          setError('Could not load idea metadata. Check Supabase RLS (manager read on ideas).')
          setIsLoading(false)
          return
        }
        setIdeaMeta({
          submitted_by: String(ideaRow.submitted_by || '').trim().toLowerCase(),
          manager_name: String(ideaRow.manager_name || ''),
        })

        const response = await n8nFetch(`get-drafts?idea_id=${encodeURIComponent(idea_id)}`, {
          accessToken: session?.access_token ?? null,
        })
        if (response.ok) {
          const fetchedData = await response.json()
          const rawDrafts = Array.isArray(fetchedData?.drafts) ? fetchedData.drafts : []
          setData({
            idea_status: String(fetchedData?.idea_status || ''),
            idea_id: String(fetchedData?.idea_id || idea_id),
            drafts: rawDrafts.map((d: unknown, i: number) =>
              normalizeDraftFromApi(d as Record<string, unknown>, i),
            ),
          })
          if (fetchedData.idea_status !== 'awaiting_draft_review') {
            setError('This submission has already been reviewed.')
          }
        } else {
          setError('Could not load drafts. Please refresh.')
        }
      } catch {
        setError('Could not load drafts. Please refresh.')
      } finally {
        setIsLoading(false)
      }
    }

    run()
  }, [idea_id, authLoading, user, role, router, session?.access_token])

  const getDraftEdit = (draftId: string, fallbackBody: string, fallbackTitle: string) =>
    draftEdits[draftId] ?? { body: fallbackBody, title: fallbackTitle }

  const countWords = (text: string) =>
    text
      .replace(/\s+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length

  const handleSaveDraft = async (draftId: string) => {
    if (!idea_id) return
    const edit = draftEdits[draftId]
    if (!edit) return
    setSavingDraftId(draftId)
    setSaveMessage('')
    try {
      const res = await fetch(`/api/drafts/${encodeURIComponent(draftId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea_id,
          body: edit.body,
          title: edit.title.trim(),
        }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSaveMessage(String(payload.error || 'Could not save draft'))
        return
      }
      setData((prev) => {
        if (!prev) return prev
        const wc = countWords(edit.body)
        return {
          ...prev,
          drafts: prev.drafts.map((d) =>
            d.draft_id === draftId
              ? { ...d, body: edit.body, title: edit.title.trim() || d.title, word_count: wc }
              : d,
          ),
        }
      })
      setSaveMessage('Draft saved.')
      setTimeout(() => setSaveMessage(''), 2500)
    } catch {
      setSaveMessage('Could not save draft')
    } finally {
      setSavingDraftId(null)
    }
  }

  const handleSelectDraft = (draftId: string) => {
    setSelectedDraftId(draftId)
    setShowConfirmModal(true)
  }

  const handleConfirmSelection = async () => {
    if (!selectedDraftId) return
    setIsSubmitting(true)

    try {
      const response = await n8nFetch('draft-selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        accessToken: session?.access_token ?? null,
        body: JSON.stringify({
          action: 'select',
          draft_id: selectedDraftId,
          idea_id: idea_id,
        }),
      })

      if (response.ok) {
        setIsSuccess(true)
        setModalDraftId(null)
        setTimeout(() => {
          router.push('/manager/draft-queue')
        }, 2000)
      } else {
        setError('Failed to select draft')
      }
    } catch {
      setError('Failed to select draft')
    } finally {
      setIsSubmitting(false)
      setShowConfirmModal(false)
    }
  }

  const handleRejectAll = async () => {
    if (rejectionReason.length < 20 || !ideaMeta) return
    setIsSubmitting(true)

    try {
      const response = await n8nFetch('draft-selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        accessToken: session?.access_token ?? null,
        body: JSON.stringify({
          action: 'reject_all',
          rejection_reason: rejectionReason,
          idea_id: idea_id,
          submitted_by: ideaMeta.submitted_by,
          manager_name: ideaMeta.manager_name,
        }),
      })

      if (response.ok) {
        setIsSuccess(true)
        setTimeout(() => {
          router.push('/manager/draft-queue')
        }, 2000)
      } else {
        setError('Failed to reject drafts')
      }
    } catch {
      setError('Failed to reject drafts')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/80 p-8 text-center shadow-2xl shadow-black/40">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-white mb-2">Draft selected</h1>
          <p className="text-zinc-400 text-sm">Returning to the draft queue…</p>
        </div>
      </div>
    )
  }

  if (!idea_id) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/80 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">Invalid link</h1>
          <p className="text-zinc-400 text-sm mb-6">Use the link from your email or open the idea from the queue.</p>
          <Link href="/intake">
            <Button className="w-full bg-primary text-primary-foreground">Go to submit</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <AppNav role={role} email={user?.email} onSignOut={signOut} active="draft-review" />

      <div className="border-b border-white/[0.06] bg-zinc-900/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
            <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/manager/draft-queue" className="hover:text-zinc-300 transition-colors">
              Draft queue
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-zinc-400">Review</span>
          </nav>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-3">
                <LayoutGrid className="w-3.5 h-3.5" />
                Draft selection
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                Compare three angles
              </h1>
              <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
                Open a draft with <span className="text-zinc-300">Read more</span> to edit Markdown, save changes,
                then choose the version to send to adaptation.
              </p>
            </div>
            {saveMessage ? (
              <p
                className={`text-sm shrink-0 ${saveMessage.includes('Could not') ? 'text-red-400' : 'text-emerald-400'}`}
              >
                {saveMessage}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        {error && !data && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-zinc-900/50 h-64 animate-pulse"
              />
            ))}
          </div>
        ) : data && data.drafts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-10">
              {data.drafts.map((draft) => {
                const edit = getDraftEdit(draft.draft_id, draft.body, draft.title)
                const displayWords = countWords(edit.body)
                const plainPreview = stripHtmlToPlainText(edit.body)
                const previewShort =
                  plainPreview.length > 140
                    ? `${plainPreview.slice(0, 140).trim()}…`
                    : plainPreview
                const isSelected = selectedDraftId === draft.draft_id
                const imgDisplay = resolveDraftImageUrlForDisplay(draft.image_url)
                return (
                  <article
                    key={draft.draft_id}
                    className={`group flex flex-col overflow-hidden rounded-2xl border bg-zinc-900/90 transition-all ${
                      isSelected
                        ? 'border-primary/50 ring-1 ring-primary/30 shadow-lg shadow-primary/5'
                        : 'border-white/[0.08] hover:border-white/15'
                    }`}
                  >
                    {imgDisplay.reason === 'n8n_template' ? (
                      <div className="h-44 shrink-0 border-b border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                        <p className="font-medium text-amber-200">Image URL not resolved</p>
                        <p className="mt-1 text-amber-100/90 leading-relaxed">
                          n8n stored the template literally. Set the field to <strong>Expression</strong> (not Fixed) so{' '}
                          <code className="text-[10px]">idea_id</code> is interpolated, and use{' '}
                          <code className="text-[10px]">/object/public/draft-images/...</code> for public files.
                        </p>
                      </div>
                    ) : imgDisplay.href ? (
                      <div
                        className="relative isolate h-44 w-full shrink-0 overflow-hidden border-b border-white/[0.06] bg-zinc-800 [transform:translateZ(0)]"
                        style={{
                          backgroundImage: `url(${JSON.stringify(imgDisplay.href)})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        <img
                          src={imgDisplay.href}
                          alt=""
                          width={1200}
                          height={630}
                          className="relative z-[1] block h-full min-h-[11rem] w-full object-cover"
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                        />
                      </div>
                    ) : null}
                    <div className="p-5 flex flex-col flex-1 min-h-0">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="inline-flex items-center rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                          {draft.angle_label}
                        </span>
                        <span className="text-[11px] tabular-nums text-zinc-500">{displayWords} words</span>
                      </div>
                      {draft.angle_description ? (
                        <p className="text-sm text-zinc-300 line-clamp-2 mb-3 leading-snug">
                          {draft.angle_description}
                        </p>
                      ) : null}
                      {previewShort ? (
                        <p className="text-xs text-zinc-500 line-clamp-3 leading-relaxed flex-1 mb-4">
                          {previewShort}
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-600 italic flex-1 mb-4">No preview text</p>
                      )}
                      {draft.seo_keywords ? (
                        <p className="text-[10px] text-zinc-600 line-clamp-2 mb-4 border-t border-white/[0.06] pt-3">
                          {draft.seo_keywords}
                        </p>
                      ) : null}
                      <div className="mt-auto space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.06]"
                          onClick={() => setModalDraftId(draft.draft_id)}
                        >
                          <FileText className="w-4 h-4 mr-2 opacity-80" />
                          Read more
                        </Button>
                        <Button
                          type="button"
                          className={`w-full ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
                          }`}
                          onClick={() => handleSelectDraft(draft.draft_id)}
                        >
                          {isSelected ? 'Selected' : 'Use this draft'}
                        </Button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-5">
              <button
                type="button"
                onClick={() => setShowRejectPanel(!showRejectPanel)}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-sm font-medium text-zinc-300">None of these work</span>
                <span className="text-zinc-500 text-xs">{showRejectPanel ? 'Hide' : 'Expand'}</span>
              </button>
              {showRejectPanel && (
                <div className="mt-4 space-y-3 pt-4 border-t border-white/[0.06]">
                  <Textarea
                    placeholder="Why don’t these work? (min. 20 characters)"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="min-h-24 bg-zinc-950/80 border-white/10 text-zinc-100 placeholder:text-zinc-600"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setShowRejectPanel(false)} className="border-white/10">
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (rejectionReason.length >= 20 && window.confirm('Reject all drafts for this idea?')) {
                          handleRejectAll()
                        }
                      }}
                      disabled={rejectionReason.length < 20 || isSubmitting}
                      className="bg-red-600 hover:bg-red-600/90 text-white"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject all'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>

      <Dialog open={modalDraftId !== null && modalDraft !== null} onOpenChange={(o) => !o && setModalDraftId(null)}>
        {modalDraft && (
          <DialogContent
            showCloseButton
            className="max-h-[min(90vh,880px)] max-w-3xl overflow-hidden flex flex-col gap-0 border-white/10 bg-zinc-900 p-0 text-zinc-100 sm:max-w-3xl"
          >
            <div className="border-b border-white/[0.06] px-6 py-4 shrink-0">
              <DialogHeader className="space-y-1 text-left">
                <DialogTitle className="text-lg font-semibold text-white pr-8">
                  {modalDraft.angle_label} — Edit draft
                </DialogTitle>
                <DialogDescription className="text-zinc-500 text-sm">
                  {modalDraft.angle_description || 'Adjust title and body, save, then choose this draft or close.'}
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4 min-h-0">
              {(() => {
                const modalImg = resolveDraftImageUrlForDisplay(modalDraft.image_url)
                if (modalImg.reason === 'n8n_template') {
                  return (
                    <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                      Image URL is an unresolved n8n template — fix the workflow (Expression + public path).
                    </div>
                  )
                }
                if (!modalImg.href) return null
                return (
                  <div
                    className="relative isolate h-56 w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-800 [transform:translateZ(0)]"
                    style={{
                      backgroundImage: `url(${JSON.stringify(modalImg.href)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <img
                      src={modalImg.href}
                      alt=""
                      width={1200}
                      height={630}
                      className="relative z-[1] block h-full min-h-[14rem] w-full object-cover"
                      loading="eager"
                      decoding="async"
                      draggable={false}
                    />
                  </div>
                )
              })()}
              <div>
                <Label htmlFor="modal-title" className="text-xs text-zinc-400">
                  Title
                </Label>
                <input
                  id="modal-title"
                  type="text"
                  value={getDraftEdit(modalDraft.draft_id, modalDraft.body, modalDraft.title).title}
                  onChange={(e) =>
                    setDraftEdits((s) => ({
                      ...s,
                      [modalDraft.draft_id]: {
                        body: (s[modalDraft.draft_id]?.body ?? modalDraft.body) ?? '',
                        title: e.target.value,
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950/80 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <Label htmlFor="modal-body" className="text-xs text-zinc-400">
                  Body (Markdown)
                </Label>
                <Textarea
                  id="modal-body"
                  value={getDraftEdit(modalDraft.draft_id, modalDraft.body, modalDraft.title).body}
                  onChange={(e) =>
                    setDraftEdits((s) => ({
                      ...s,
                      [modalDraft.draft_id]: {
                        body: e.target.value,
                        title: (s[modalDraft.draft_id]?.title ?? modalDraft.title) ?? '',
                      },
                    }))
                  }
                  className="mt-1 min-h-[280px] font-mono text-sm bg-zinc-950/80 border-white/10 text-zinc-100"
                />
              </div>
              {modalDraft.seo_keywords ? (
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Keywords</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">{modalDraft.seo_keywords}</p>
                </div>
              ) : null}
            </div>
            <DialogFooter className="border-t border-white/[0.06] px-6 py-4 gap-2 shrink-0 bg-zinc-900/95 flex-row flex-wrap sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="border-white/10"
                onClick={() => handleSaveDraft(modalDraft.draft_id)}
                disabled={savingDraftId === modalDraft.draft_id}
              >
                {savingDraftId === modalDraft.draft_id ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
              <Button type="button" className="bg-primary text-primary-foreground" onClick={() => setModalDraftId(null)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {showConfirmModal && selectedDraftId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6 max-w-md w-full shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-2">Confirm selection</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Generate LinkedIn, X, and Email adaptations for this draft?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 border-white/10"
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmSelection} disabled={isSubmitting} className="flex-1 bg-primary">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DraftReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-300">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <DraftReviewContent />
    </Suspense>
  )
}
