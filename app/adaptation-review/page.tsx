'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2, CheckCircle2, Sparkles, Copy, Menu, X } from 'lucide-react'
import Link from 'next/link'

interface Adaptation {
  adaptation_id: string
  platform: 'LinkedIn' | 'X' | 'Email'
  content: string
  subject_line?: string
  char_count: number
  publish_status: string
}

interface AdaptationData {
  idea_status: string
  idea_id: string
  adaptations: {
    linkedin: Adaptation
    x: Adaptation
    email: Adaptation
  }
}

// --- Extracted inner component to wrap in Suspense ---
function AdaptationReviewContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const resume_url = searchParams.get('resume_url')
  const idea_id = searchParams.get('idea_id') || ''
  const submitted_by = searchParams.get('submitted_by') || ''

  const [data, setData] = useState<AdaptationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('linkedin')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  useEffect(() => {
    // The instructions said "GET https://cohort2pod2.app.n8n.cloud/webhook/get-adaptations?idea_id={idea_id}"
    // so we need idea_id, not draft_id.
    if (!idea_id) {
      setError('Invalid or expired link')
      setIsLoading(false)
      return
    }

    const fetchAdaptations = async () => {
      try {
        const response = await fetch(
          `https://cohort2pod2.app.n8n.cloud/webhook/get-adaptations?idea_id=${idea_id}`
        )
        if (response.ok) {
          const fetchedData = await response.json()
          setData(fetchedData)
        } else {
          setError('Could not load adaptations')
        }
      } catch {
        setError('Could not load adaptations')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAdaptations()
  }, [searchParams])

  const copyToClipboard = (text: string, platform: string) => {
    navigator.clipboard.writeText(text)
    setCopyFeedback(platform)
    setTimeout(() => setCopyFeedback(null), 2000)
  }

  const handleApprove = async (platform: string) => {
    if (!resume_url) {
      setError('Missing resume URL')
      return
    }
    if (!idea_id || !submitted_by) {
      setError('Missing idea_id or submitted_by in link')
      setIsSubmitting(false)
      return
    }
    if (!data?.adaptations) {
      setError('Adaptations not loaded yet')
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(true)
    try {
      // Workflow B can only publish correctly if it receives the adaptation content.
      // Send the single decision as `decisions[]` with content/subject.
      let decisions: any[] = []

      if (platform === 'linkedin' && data.adaptations.linkedin) {
        decisions = [
          {
            action: 'approve',
            platform: 'LinkedIn',
            content: data.adaptations.linkedin.content,
          }
        ]
      }

      if (platform === 'x' && data.adaptations.x) {
        const xContent = data.adaptations.x.content || ''
        const is_thread = /\(\d+\/\d+\)/.test(xContent)
        decisions = [
          {
            action: 'approve',
            platform: 'X',
            content: xContent,
            is_thread
          }
        ]
      }

      if (platform === 'email' && data.adaptations.email) {
        decisions = [
          {
            action: 'approve',
            platform: 'Email',
            content: data.adaptations.email.content || '',
            subject: data.adaptations.email.subject_line || ''
          }
        ]
      }

      if (decisions.length === 0) {
        setError('Missing adaptation content for selected platform')
        setIsSubmitting(false)
        return
      }

      const response = await fetch(resume_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea_id,
          submitted_by,
          decisions,
        }),
      })

      if (response.ok) {
        setIsSuccess(true)
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    } catch {
      setError('Failed to approve')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="glass-card max-w-md w-full text-center p-8 animate-fade-in-scale">
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4 animate-glow" />
          <h1 className="text-3xl font-bold text-white mb-3">Content Approved!</h1>
          <p className="text-gray-400">Your adaptations are ready. Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  if (!searchParams.get('idea_id')) {
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
            <Link href="/draft-review" className="text-gray-400 hover:text-white transition-colors">Review</Link>
            <Link href="/adaptation-review" className="text-white font-medium">Adapt</Link>
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link>
          </nav>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white hover:text-primary transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-primary/20 bg-black/95 backdrop-blur-lg">
            <nav className="flex flex-col gap-4 p-4">
              <Link href="/intake" className="text-gray-400 hover:text-white transition-colors">Submit</Link>
              <Link href="/draft-review" className="text-gray-400 hover:text-white transition-colors">Review</Link>
              <Link href="/adaptation-review" className="text-white font-medium">Adapt</Link>
              <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link>
            </nav>
          </div>
        )}
      </header>

      <section className="min-h-[calc(100vh-80px)] flex">
        <div
          className="hidden lg:flex lg:w-1/2 relative items-center justify-center"
          style={{
            backgroundImage: 'url(/adapt-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
          <div className="relative z-10 text-center px-8 max-w-xl">
            <h1 className="text-5xl font-bold text-white mb-6">Adapt Your<br /><span className="gradient-text">Content</span></h1>
            <p className="text-xl text-gray-300">Customize for LinkedIn, X, and Email. Each platform optimized for maximum engagement.</p>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-black overflow-y-auto">
          <div className="w-full max-w-md">
            {error && (
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
            ) : data && data.adaptations ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-6">Review Adaptations</h2>
                
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {['linkedin', 'x', 'email'].map(platform => (
                    <button
                      key={platform}
                      onClick={() => setActiveTab(platform)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                        activeTab === platform
                          ? 'glass-button-primary'
                          : 'glass-button-secondary'
                      }`}
                    >
                      {platform === 'x' ? 'X' : platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </button>
                  ))}
                </div>

                {activeTab === 'linkedin' && data.adaptations.linkedin && (
                  <div className="space-y-4">
                    <div className="glass-card p-6">
                      <h3 className="text-lg font-bold text-white mb-4">LinkedIn Post</h3>
                      <div className="bg-gray-900 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
                        <p className="text-gray-300 text-sm leading-relaxed">{data.adaptations.linkedin.content}</p>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => copyToClipboard(data.adaptations.linkedin.content, 'linkedin')}
                          className="glass-button-secondary flex-1 text-sm"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          {copyFeedback === 'linkedin' ? 'Copied!' : 'Copy'}
                        </Button>
                        <Button
                          onClick={() => handleApprove('linkedin')}
                          disabled={isSubmitting}
                          className="glass-button-primary flex-1 text-sm"
                        >
                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'x' && data.adaptations.x && (
                  <div className="space-y-4">
                    <div className="glass-card p-6">
                      <h3 className="text-lg font-bold text-white mb-4">X Post</h3>
                      <div className="bg-gray-900 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
                        <p className="text-gray-300 text-sm leading-relaxed">{data.adaptations.x.content}</p>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => copyToClipboard(data.adaptations.x.content, 'x')}
                          className="glass-button-secondary flex-1 text-sm"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          {copyFeedback === 'x' ? 'Copied!' : 'Copy'}
                        </Button>
                        <Button
                          onClick={() => handleApprove('x')}
                          disabled={isSubmitting}
                          className="glass-button-primary flex-1 text-sm"
                        >
                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'email' && data.adaptations.email && (
                  <div className="space-y-4">
                    <div className="glass-card p-6">
                      <h3 className="text-lg font-bold text-white mb-4">Email Content</h3>
                      {data.adaptations.email.subject_line && (
                        <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <p className="text-xs text-gray-400 mb-1">Subject Line</p>
                          <p className="text-white font-semibold">{data.adaptations.email.subject_line}</p>
                        </div>
                      )}
                      <div className="bg-gray-900 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
                        <p className="text-gray-300 text-sm leading-relaxed">{data.adaptations.email.content}</p>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => copyToClipboard(data.adaptations.email.content, 'email')}
                          className="glass-button-secondary flex-1 text-sm"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          {copyFeedback === 'email' ? 'Copied!' : 'Copy'}
                        </Button>
                        <Button
                          onClick={() => handleApprove('email')}
                          disabled={isSubmitting}
                          className="glass-button-primary flex-1 text-sm"
                        >
                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  )
}

import { Suspense } from 'react'

export default function AdaptationReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading adaptations...</div>}>
      <AdaptationReviewContent />
    </Suspense>
  )
}
