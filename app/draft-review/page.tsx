'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertCircle, ChevronDown, ChevronUp, Loader2, CheckCircle2, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'

interface Draft {
  draft_id: string
  angle_label: string
  angle_description: string
  title: string
  body: string
  seo_keywords: string
  word_count: number
}

interface DraftData {
  idea_status: string
  idea_id: string
  drafts: Draft[]
}

// --- Extracted inner component to wrap in Suspense ---
function DraftReviewContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const idea_id = searchParams.get('idea_id')

  const [data, setData] = useState<DraftData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null)
  const [expandedDraft, setExpandedDraft] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showRejectPanel, setShowRejectPanel] = useState(false)

  useEffect(() => {
    if (!idea_id) {
      setError('Invalid or expired review link')
      setIsLoading(false)
      return
    }

    const fetchDrafts = async () => {
      try {
        const response = await fetch(
          `https://cohort2pod2.app.n8n.cloud/webhook/get-drafts?idea_id=${idea_id}`
        )
        if (response.ok) {
          const fetchedData = await response.json()
          setData(fetchedData)
          if (fetchedData.idea_status !== 'awaiting_draft_review') {
            setError('This submission has already been reviewed.')
          }
        } else {
          setError('Could not load your drafts. Please refresh.')
        }
      } catch {
        setError('Could not load your drafts. Please refresh.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDrafts()
  }, [idea_id])

  const handleSelectDraft = (draftId: string) => {
    setSelectedDraftId(draftId)
    setShowConfirmModal(true)
  }

  const handleConfirmSelection = async () => {
    if (!selectedDraftId) return
    setIsSubmitting(true)

    try {
      const response = await fetch('https://cohort2pod2.app.n8n.cloud/webhook/draft-selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'select',
          draft_id: selectedDraftId,
          idea_id: idea_id,
        }),
      })

      if (response.ok) {
        setIsSuccess(true)
        setTimeout(() => {
          router.push('/adaptation-review')
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
    if (rejectionReason.length < 20) return
    setIsSubmitting(true)

    try {
      const response = await fetch('https://cohort2pod2.app.n8n.cloud/webhook/draft-selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject_all',
          rejection_reason: rejectionReason,
          idea_id: idea_id,
        }),
      })

      if (response.ok) {
        setIsSuccess(true)
        setTimeout(() => {
          router.push('/intake')
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
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="glass-card max-w-md w-full text-center p-8 animate-fade-in-scale">
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4 animate-glow" />
          <h1 className="text-3xl font-bold text-white mb-3">Draft Selected</h1>
          <p className="text-gray-400">Generating adaptations for LinkedIn, X, and Email...</p>
        </div>
      </div>
    )
  }

  if (!idea_id) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="glass-card max-w-md w-full text-center p-8">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Link</h1>
          <p className="text-gray-400 mb-6">Please check your email for the correct link.</p>
          <Link href="/intake">
            <Button className="glass-button-primary w-full">Go to Submit</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-primary/20 bg-black/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-white">Fetemi</span>
              <span className="text-xs text-primary">AI Content Generator</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/intake" className="text-gray-400 hover:text-white transition-colors">Submit</Link>
            <Link href="/draft-review" className="text-white font-medium">Review</Link>
            <Link href="/adaptation-review" className="text-gray-400 hover:text-white transition-colors">Adapt</Link>
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link>
          </nav>
        </div>
      </header>

      {/* Split Layout Section */}
      <section className="min-h-[calc(100vh-80px)] flex">
        {/* Left - Background Image */}
        <div
          className="hidden lg:flex lg:w-1/2 relative items-center justify-center"
          style={{
            backgroundImage: 'url(/drafts-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
          <div className="relative z-10 text-center px-8 max-w-xl">
            <h1 className="text-5xl font-bold text-white mb-6">Choose Your<br /><span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Best Draft</span></h1>
            <p className="text-xl text-gray-300">We've generated three unique angles. Select the one that resonates with your audience.</p>
          </div>
        </div>

        {/* Right - Drafts */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-black overflow-y-auto">
          <div className="w-full max-w-md">
            {error && !data && (
              <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="glass-card p-4 h-32 shimmer-loading"></div>
                ))}
              </div>
            ) : data && data.drafts.length > 0 ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-6">Your Drafts</h2>
                <div className="space-y-4 mb-8">
                  {data.drafts.map(draft => (
                    <div key={draft.draft_id} className={`glass-card p-5 cursor-pointer transition-all ${selectedDraftId === draft.draft_id ? 'ring-2 ring-primary' : ''}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="inline-block px-2 py-1 rounded bg-primary/20 text-primary text-xs font-semibold mb-2">{draft.angle_label}</span>
                          <h3 className="text-lg font-bold text-white">{draft.title}</h3>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{draft.body.substring(0, 150)}...</p>
                      <div className="flex items-center justify-between mb-4 text-xs text-gray-400">
                        <span>Words: {draft.word_count}</span>
                        <span>Keywords: {draft.seo_keywords}</span>
                      </div>
                      <button
                        onClick={() => setExpandedDraft(expandedDraft === draft.draft_id ? null : draft.draft_id)}
                        className="text-primary text-xs font-medium hover:text-accent mb-4 flex items-center gap-1"
                      >
                        {expandedDraft === draft.draft_id ? <>Collapse <ChevronUp size={14} /></> : <>Read Full <ChevronDown size={14} /></>}
                      </button>
                      {expandedDraft === draft.draft_id && (
                        <div className="bg-gray-900 rounded p-3 mb-4 max-h-64 overflow-y-auto">
                          <ReactMarkdown className="text-sm text-gray-300 prose prose-invert prose-sm">{draft.body}</ReactMarkdown>
                        </div>
                      )}
                      <Button
                        onClick={() => handleSelectDraft(draft.draft_id)}
                        className={`w-full text-sm ${selectedDraftId === draft.draft_id ? 'glass-button-primary' : 'glass-button-secondary'}`}
                      >
                        {selectedDraftId === draft.draft_id ? '✓ Selected' : 'Use This Draft'}
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Reject All */}
                <div className="glass-card p-4">
                  <button
                    onClick={() => setShowRejectPanel(!showRejectPanel)}
                    className="w-full flex items-center justify-between font-semibold text-white hover:text-primary transition-colors"
                  >
                    <span className="text-sm">None of these work</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showRejectPanel ? 'rotate-180' : ''}`} />
                  </button>
                  {showRejectPanel && (
                    <div className="mt-4 space-y-3 pt-4 border-t border-gray-700">
                      <Textarea
                        placeholder="Why don't these work for you?"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="glass-input min-h-24 text-white placeholder-gray-500 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => setShowRejectPanel(false)} className="glass-button-secondary flex-1 text-sm">Cancel</Button>
                        <Button
                          onClick={() => {
                            if (rejectionReason.length >= 20 && window.confirm('Are you sure?')) {
                              handleRejectAll()
                            }
                          }}
                          disabled={rejectionReason.length < 20 || isSubmitting}
                          className="bg-destructive hover:bg-destructive/90 text-white flex-1 text-sm font-semibold px-4 py-2 rounded-lg"
                        >
                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject All'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : null}

            {/* Confirm Modal */}
            {showConfirmModal && selectedDraftId && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="glass-card p-6 max-w-sm w-full">
                  <h2 className="text-xl font-bold text-white mb-3">Confirm Selection</h2>
                  <p className="text-gray-400 mb-6 text-sm">Generate LinkedIn, X, and Email adaptations for this draft?</p>
                  <div className="flex gap-3">
                    <Button onClick={() => setShowConfirmModal(false)} className="glass-button-secondary flex-1 text-sm">Cancel</Button>
                    <Button
                      onClick={handleConfirmSelection}
                      disabled={isSubmitting}
                      className="glass-button-primary flex-1 text-sm"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

import { Suspense } from 'react'

export default function DraftReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading review...</div>}>
      <DraftReviewContent />
    </Suspense>
  )
}
