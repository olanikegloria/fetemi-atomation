'use client'

import { Suspense, useEffect, useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  AlertCircle,
  Loader2,
  CheckCircle2,
  Copy,
  ChevronRight,
  LayoutGrid,
  Linkedin,
  Mail,
  Twitter,
  FileText,
} from 'lucide-react'
import { AppNav } from '@/components/AppNav'
import { useAuth } from '@/hooks/useAuth'
import { n8nFetch } from '@/lib/auth/n8n-fetch'
import { normalizeN8nResumeUrl } from '@/lib/n8n/resume-url'
import { pickImageUrl } from '@/lib/media/pick-image-url'
import { resolveDraftImageUrlForDisplay } from '@/lib/media/image-url-display'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Adaptation {
  adaptation_id: string
  platform: 'LinkedIn' | 'X' | 'Email'
  content: string
  subject_line?: string
  char_count: number
  publish_status: string
  image_url?: string
  imageUrl?: string
}

interface AdaptationData {
  idea_status: string
  idea_id: string
  image_url?: string
  imageUrl?: string
  adaptations: {
    linkedin: Adaptation
    x: Adaptation
    email: Adaptation
  }
}

type PlatformKey = 'linkedin' | 'x' | 'email'
type Action = 'approve' | 'schedule' | 'reject'

const platformApi: Record<PlatformKey, 'LinkedIn' | 'X' | 'Email'> = {
  linkedin: 'LinkedIn',
  x: 'X',
  email: 'Email',
}

const platformMeta: Record<
  PlatformKey,
  { label: string; Icon: typeof Linkedin }
> = {
  linkedin: { label: 'LinkedIn', Icon: Linkedin },
  x: { label: 'X', Icon: Twitter },
  email: { label: 'Email', Icon: Mail },
}

function defaultScheduleIso() {
  const d = new Date(Date.now() + 60 * 60 * 1000)
  d.setMinutes(d.getMinutes() - (d.getMinutes() % 15))
  return d.toISOString().slice(0, 16)
}

function AdaptationReviewContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, session, role, loading: authLoading, signOut } = useAuth()

  const resume_url = normalizeN8nResumeUrl(searchParams.get('resume_url'))
  const idea_id = searchParams.get('idea_id') || ''
  const submitted_by_param = (searchParams.get('submitted_by') || '').trim().toLowerCase()

  const [data, setData] = useState<AdaptationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const [hiddenAdaptationImages, setHiddenAdaptationImages] = useState<Record<PlatformKey, boolean>>({
    linkedin: false,
    x: false,
    email: false,
  })
  const [modalPlatform, setModalPlatform] = useState<PlatformKey | null>(null)

  const [include, setInclude] = useState<Record<PlatformKey, boolean>>({
    linkedin: false,
    x: false,
    email: false,
  })
  const [action, setAction] = useState<Record<PlatformKey, Action>>({
    linkedin: 'approve',
    x: 'approve',
    email: 'approve',
  })
  const [scheduledFor, setScheduledFor] = useState<Record<PlatformKey, string>>({
    linkedin: defaultScheduleIso(),
    x: defaultScheduleIso(),
    email: defaultScheduleIso(),
  })

  const effectiveSubmittedBy = submitted_by_param || (user?.email || '').trim().toLowerCase()

  useEffect(() => {
    if (!idea_id) {
      setError('Invalid or expired link')
      setIsLoading(false)
      return
    }

    const load = async () => {
      try {
        const res = await n8nFetch(
          `get-adaptations?idea_id=${encodeURIComponent(idea_id)}`,
          { accessToken: session?.access_token ?? null },
        )
        if (res.ok) {
          setData(await res.json())
        } else {
          setError('Could not load adaptations')
        }
      } catch {
        setError('Could not load adaptations')
      } finally {
        setIsLoading(false)
      }
    }
    if (!authLoading) load()
  }, [idea_id, session?.access_token, authLoading])

  const canSubmit = useMemo(() => {
    if (!user?.email) return true
    if (!submitted_by_param) return true
    return user.email.trim().toLowerCase() === submitted_by_param
  }, [user, submitted_by_param])

  const copyToClipboard = (text: string, platform: string) => {
    navigator.clipboard.writeText(text)
    setCopyFeedback(platform)
    setTimeout(() => setCopyFeedback(null), 2000)
  }

  const imageForPlatform = (key: PlatformKey) => {
    if (!data?.adaptations) return resolveDraftImageUrlForDisplay('')
    const adapt = data.adaptations[key] as unknown as Record<string, unknown>
    const idea = data as unknown as Record<string, unknown>
    const raw =
      pickImageUrl(adapt) ||
      pickImageUrl(idea) ||
      String(
        data.adaptations[key]?.image_url ||
          data.adaptations[key]?.imageUrl ||
          data.image_url ||
          data.imageUrl ||
          '',
      ).trim()
    return resolveDraftImageUrlForDisplay(raw)
  }

  const previewText = (key: PlatformKey, max = 160) => {
    if (!data?.adaptations) return ''
    const raw =
      key === 'email'
        ? [data.adaptations.email?.subject_line, data.adaptations.email?.content].filter(Boolean).join(' — ')
        : data.adaptations[key]?.content || ''
    const t = raw.replace(/\s+/g, ' ').trim()
    if (t.length <= max) return t
    return `${t.slice(0, max).trim()}…`
  }

  const buildDecisions = (): Record<string, unknown>[] => {
    if (!data?.adaptations) return []
    const out: Record<string, unknown>[] = []
    ;(['linkedin', 'x', 'email'] as PlatformKey[]).forEach((key) => {
      if (!include[key]) return
      const plat = platformApi[key]
      const act = action[key]
      const adapt =
        key === 'linkedin'
          ? data.adaptations.linkedin
          : key === 'x'
            ? data.adaptations.x
            : data.adaptations.email
      if (!adapt) return

      if (act === 'reject') {
        out.push({ action: 'reject', platform: plat })
        return
      }
      if (act === 'approve') {
        if (key === 'email') {
          out.push({
            action: 'approve',
            platform: plat,
            content: adapt.content || '',
            subject: adapt.subject_line || '',
          })
        } else if (key === 'x') {
          const xContent = adapt.content || ''
          out.push({
            action: 'approve',
            platform: plat,
            content: xContent,
            is_thread: /\(\d+\/\d+\)/.test(xContent),
          })
        } else {
          out.push({
            action: 'approve',
            platform: plat,
            content: adapt.content || '',
          })
        }
        return
      }
      const iso = new Date(scheduledFor[key]).toISOString()
      if (key === 'email') {
        out.push({
          action: 'schedule',
          platform: plat,
          content: adapt.content || '',
          subject: adapt.subject_line || '',
          scheduled_for: iso,
        })
      } else if (key === 'x') {
        const xContent = adapt.content || ''
        out.push({
          action: 'schedule',
          platform: plat,
          content: xContent,
          is_thread: /\(\d+\/\d+\)/.test(xContent),
          scheduled_for: iso,
        })
      } else {
        out.push({
          action: 'schedule',
          platform: plat,
          content: adapt.content || '',
          scheduled_for: iso,
        })
      }
    })
    return out
  }

  const handleSubmitDecisions = async () => {
    if (!resume_url) {
      const hadResumeParam = Boolean(searchParams.get('resume_url'))
      setError(
        hadResumeParam
          ? 'Invalid resume link (could not parse n8n webhook URL). Open this page from your email or My adaptations — the link must include a valid resume_url to n8n.'
          : 'Missing resume URL — open the link from your email or My adaptations.',
      )
      return
    }
    if (!idea_id || !effectiveSubmittedBy) {
      setError('Missing idea or submitter')
      return
    }
    if (user && !canSubmit) {
      setError('Sign in as the content creator email that submitted this idea.')
      return
    }
    const decisions = buildDecisions()
    if (decisions.length === 0) {
      setError('Select at least one platform and choose an action.')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/n8n/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_url,
          payload: {
            idea_id,
            submitted_by: effectiveSubmittedBy,
            decisions,
          },
        }),
      })
      if (response.ok) {
        setIsSuccess(true)
        setTimeout(() => router.push('/my-adaptations'), 2000)
      } else {
        const t = await response.text()
        setError(t || 'Request failed')
      }
    } catch {
      setError('Failed to submit')
    } finally {
      setIsSubmitting(false)
    }
  }

  const modalAdaptation = modalPlatform && data?.adaptations ? data.adaptations[modalPlatform] : null

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/80 p-8 text-center shadow-2xl shadow-black/40">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-white mb-2">Decisions sent</h1>
          <p className="text-zinc-400 text-sm">Redirecting to My adaptations…</p>
        </div>
      </div>
    )
  }

  if (!searchParams.get('idea_id')) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/80 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">Invalid link</h1>
          <p className="text-zinc-400 text-sm mb-6">
            Use the link from your email or open the idea from My adaptations.
          </p>
          <Link href="/login">
            <Button className="w-full bg-primary text-primary-foreground">Sign in</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <AppNav role={role} email={user?.email} onSignOut={signOut} active="adapt" />

      <div className="border-b border-white/[0.06] bg-zinc-900/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 mb-3">
            <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link href="/my-adaptations" className="hover:text-zinc-300 transition-colors">
              My adaptations
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-zinc-400">Review</span>
          </nav>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-3">
                <LayoutGrid className="w-3.5 h-3.5" />
                Adaptation review
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                Three platforms — one decision
              </h1>
              <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
                Same layout language as draft review: compare LinkedIn, X, and Email, open{' '}
                <span className="text-zinc-300">Read more</span> for full copy (read-only), then choose publish,
                schedule, or skip per channel.
              </p>
              {idea_id ? (
                <p className="mt-2 text-[11px] text-zinc-500 font-mono">
                  Idea <span className="text-zinc-400">{idea_id}</span>
                  {data?.idea_status ? (
                    <span className="ml-2 inline-flex items-center rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-zinc-400">
                      {data.idea_status}
                    </span>
                  ) : null}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        {!user && (
          <div className="mb-6 p-4 rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-100/90 text-sm">
            <Link href="/login" className="underline font-medium">
              Sign in
            </Link>{' '}
            as the creator so we can secure your session. You can still submit using the email link parameters.
          </div>
        )}

        {user && submitted_by_param && user.email?.toLowerCase() !== submitted_by_param && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/25 bg-red-500/10 text-red-200 text-sm">
            Signed in as a different email than this submission. Switch account or use the original magic link.
          </div>
        )}

        {error && (
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
                className="rounded-2xl border border-white/10 bg-zinc-900/50 h-72 animate-pulse"
              />
            ))}
          </div>
        ) : data && data.adaptations ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-10">
              {(['linkedin', 'x', 'email'] as const).map((key) => {
                const meta = platformMeta[key]
                const Icon = meta.Icon
                const adapt = data.adaptations[key]
                const chars = adapt?.char_count ?? (adapt?.content?.length ?? 0)
                const img = imageForPlatform(key)
                return (
                  <article
                    key={key}
                    className="group flex flex-col rounded-2xl border border-white/[0.08] bg-zinc-900/60 backdrop-blur-sm transition-all hover:border-white/15"
                  >
                    <div className="p-5 flex flex-col flex-1 min-h-0">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                          <Icon className="w-3.5 h-3.5" />
                          {meta.label}
                        </span>
                        <span className="text-[11px] tabular-nums text-zinc-500">{chars} chars</span>
                      </div>

                      {img.reason === 'n8n_template' ? (
                        <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100">
                          Unresolved image URL in workflow (n8n expression or public path).
                        </div>
                      ) : img.href && !hiddenAdaptationImages[key] ? (
                        <div className="relative mb-3 aspect-[16/9] overflow-hidden rounded-xl border border-white/10 bg-zinc-800">
                          <img
                            src={img.href}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                            onError={() => setHiddenAdaptationImages((s) => ({ ...s, [key]: true }))}
                          />
                        </div>
                      ) : (
                        <div className="mb-3 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-3 py-6 text-center text-[11px] text-zinc-600">
                          No image for this channel
                        </div>
                      )}

                      {key === 'email' && adapt?.subject_line ? (
                        <p className="text-xs text-zinc-300 font-medium line-clamp-2 mb-2 leading-snug">
                          Subject: {adapt.subject_line}
                        </p>
                      ) : null}

                      <p className="text-xs text-zinc-500 line-clamp-4 leading-relaxed flex-1 mb-4">
                        {previewText(key) || '—'}
                      </p>

                      <div className="mt-auto space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.06]"
                          onClick={() => setModalPlatform(key)}
                        >
                          <FileText className="w-4 h-4 mr-2 opacity-80" />
                          Read more
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-white/10 bg-transparent text-zinc-400 hover:text-zinc-200"
                          onClick={() => copyToClipboard(adapt?.content || '', key)}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          {copyFeedback === key ? 'Copied' : 'Copy body'}
                        </Button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-6 lg:p-8 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Your decisions</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Check each platform to include it. Unselected channels are skipped by automation.
                </p>
              </div>
              {(['linkedin', 'x', 'email'] as const).map((key) => {
                const label = platformMeta[key].label
                return (
                  <div
                    key={key}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-white/[0.06] last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3 min-w-[160px]">
                      <Checkbox
                        id={`in-${key}`}
                        checked={include[key]}
                        onCheckedChange={(c) => setInclude((s) => ({ ...s, [key]: Boolean(c) }))}
                      />
                      <Label htmlFor={`in-${key}`} className="text-white font-medium cursor-pointer">
                        {label}
                      </Label>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 flex-1">
                      <select
                        value={action[key]}
                        onChange={(e) =>
                          setAction((a) => ({ ...a, [key]: e.target.value as Action }))
                        }
                        disabled={!include[key]}
                        className="bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100"
                      >
                        <option value="approve">Publish now</option>
                        <option value="schedule">Schedule</option>
                        <option value="reject">Reject</option>
                      </select>
                      {include[key] && action[key] === 'schedule' && (
                        <input
                          type="datetime-local"
                          value={scheduledFor[key]}
                          min={new Date(Date.now() + 15 * 60 * 1000).toISOString().slice(0, 16)}
                          onChange={(e) =>
                            setScheduledFor((s) => ({ ...s, [key]: e.target.value }))
                          }
                          className="bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100"
                        />
                      )}
                    </div>
                  </div>
                )
              })}

              <Button
                type="button"
                onClick={handleSubmitDecisions}
                disabled={isSubmitting || (user ? !canSubmit : false)}
                className="w-full bg-primary text-primary-foreground py-6 text-base font-semibold hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2 inline" />
                    Submitting…
                  </>
                ) : (
                  'Submit selected platforms'
                )}
              </Button>
            </div>
          </>
        ) : null}
      </main>

      <Dialog open={modalPlatform !== null} onOpenChange={(o) => !o && setModalPlatform(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border-white/10 bg-zinc-900 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              {modalPlatform ? (
                <>
                  {(() => {
                    const M = platformMeta[modalPlatform]
                    return (
                      <>
                        <M.Icon className="w-5 h-5 text-primary" />
                        {M.label} — full content
                      </>
                    )
                  })()}
                </>
              ) : (
                'Content'
              )}
            </DialogTitle>
            <DialogDescription className="text-zinc-500">
              Read-only preview. To change copy, work with your manager or re-run the workflow in n8n.
            </DialogDescription>
          </DialogHeader>
          {modalAdaptation && modalPlatform ? (
            <div className="space-y-4 pt-2">
              {modalPlatform === 'email' && modalAdaptation.subject_line ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">Subject</p>
                  <p className="text-sm font-medium text-white">{modalAdaptation.subject_line}</p>
                </div>
              ) : null}
              {(() => {
                const img = imageForPlatform(modalPlatform)
                if (!img.href || img.reason === 'n8n_template' || hiddenAdaptationImages[modalPlatform]) {
                  return null
                }
                return (
                  <div className="overflow-hidden rounded-xl border border-white/10">
                    <img
                      src={img.href}
                      alt=""
                      className="w-full max-h-56 object-cover"
                      loading="lazy"
                      decoding="async"
                      onError={() =>
                        setHiddenAdaptationImages((s) => ({ ...s, [modalPlatform]: true }))
                      }
                    />
                  </div>
                )
              })()}
              <div className="rounded-xl border border-white/[0.06] bg-zinc-950/80 p-4 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {modalAdaptation.content}
              </div>
              <Button
                type="button"
                variant="outline"
                className="border-white/10"
                onClick={() => copyToClipboard(modalAdaptation.content, `modal-${modalPlatform}`)}
              >
                <Copy className="w-4 h-4 mr-2" />
                {copyFeedback === `modal-${modalPlatform}` ? 'Copied' : 'Copy full text'}
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AdaptationReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-300">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <AdaptationReviewContent />
    </Suspense>
  )
}
