'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2, RefreshCw, ChevronRight, Sparkles, TrendingUp, CheckCircle2, Clock, Menu, X } from 'lucide-react'
import Link from 'next/link'

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
    'processing': 'bg-blue-500/20 text-blue-400',
    'drafting': 'bg-blue-500/20 text-blue-400',
    'awaiting_draft_review': 'bg-yellow-500/20 text-yellow-400',
    'draft_rejected': 'bg-red-500/20 text-red-400',
    'adapting': 'bg-purple-500/20 text-purple-400',
    'awaiting_adaptation_review': 'bg-yellow-500/20 text-yellow-400',
    'publishing': 'bg-indigo-500/20 text-indigo-400',
    'partial': 'bg-yellow-500/20 text-yellow-400',
    'done': 'bg-green-500/20 text-green-400',
    'error': 'bg-red-500/20 text-red-400',
    'expired': 'bg-red-500/20 text-red-400',
  }
  return colorMap[status] || colorMap['processing']
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'processing': 'Processing',
    'drafting': 'Drafting',
    'awaiting_draft_review': 'Awaiting Review',
    'draft_rejected': 'Rejected',
    'adapting': 'Adapting',
    'awaiting_adaptation_review': 'Awaiting Review',
    'publishing': 'Publishing',
    'partial': 'Partially Published',
    'done': 'Published',
    'error': 'Error',
    'expired': 'Expired',
  }
  return labels[status] || 'Processing'
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true)
      // TODO: Get actual manager email from auth/context. Hardcoding for now.
      const managerEmail = "admin@example.com" 
      const response = await fetch(`https://cohort2pod2.app.n8n.cloud/webhook/get-dashboard?email=${managerEmail}`)
      if (response.ok) {
        const fetchedData = await response.json()
        setData(fetchedData)
        setError('')
      } else {
        setError('Could not load dashboard data')
      }
    } catch {
      setError('Could not load dashboard data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
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

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/intake" className="text-gray-400 hover:text-white transition-colors">Submit</Link>
            <Link href="/draft-review" className="text-gray-400 hover:text-white transition-colors">Review</Link>
            <Link href="/adaptation-review" className="text-gray-400 hover:text-white transition-colors">Adapt</Link>
            <Link href="/dashboard" className="text-white font-medium">Dashboard</Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white hover:text-primary transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-primary/20 bg-black/95 backdrop-blur-lg">
            <nav className="flex flex-col gap-4 p-4">
              <Link href="/intake" className="text-gray-400 hover:text-white transition-colors">Submit</Link>
              <Link href="/draft-review" className="text-gray-400 hover:text-white transition-colors">Review</Link>
              <Link href="/adaptation-review" className="text-gray-400 hover:text-white transition-colors">Adapt</Link>
              <Link href="/dashboard" className="text-white font-medium">Dashboard</Link>
            </nav>
          </div>
        )}
      </header>

      {/* Split Layout */}
      <section className="min-h-[calc(100vh-80px)] flex">
        {/* Left - Background Image */}
        <div
          className="hidden lg:flex lg:w-1/2 relative items-center justify-center"
          style={{
            backgroundImage: 'url(/dashboard-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
          <div className="relative z-10 text-center px-8 max-w-xl">
            <h1 className="text-5xl font-bold text-white mb-6">Your Content<br /><span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Dashboard</span></h1>
            <p className="text-xl text-gray-300">Track all your ideas, drafts, and published content in one place.</p>
          </div>
        </div>

        {/* Right - Dashboard Content */}
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
                  <div key={i} className="glass-card p-4 h-20 shimmer-loading"></div>
                ))}
              </div>
            ) : data ? (
              <>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-white">Your Content</h2>
                  <button
                    onClick={fetchDashboardData}
                    disabled={isRefreshing}
                    className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    <RefreshCw className={`w-5 h-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                  <div className="glass-card p-4">
                    <div className="text-2xl font-bold text-primary mb-1">{data.summary.total}</div>
                    <div className="text-xs text-gray-400">Total Ideas</div>
                  </div>
                  <div className="glass-card p-4">
                    <div className="text-2xl font-bold text-green-400 mb-1">{data.summary.published}</div>
                    <div className="text-xs text-gray-400">Published</div>
                  </div>
                  <div className="glass-card p-4">
                    <div className="text-2xl font-bold text-yellow-400 mb-1">{data.summary.awaiting}</div>
                    <div className="text-xs text-gray-400">Awaiting Review</div>
                  </div>
                  <div className="glass-card p-4">
                    <div className="text-2xl font-bold text-red-400 mb-1">{data.summary.rejected}</div>
                    <div className="text-xs text-gray-400">Rejected</div>
                  </div>
                </div>

                {/* Ideas List */}
                <h3 className="text-lg font-bold text-white mb-4">Recent Ideas</h3>
                {data.ideas.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {data.ideas.map(idea => (
                      <div key={idea.idea_id} className="glass-card p-4 hover:border-primary/50 transition-all">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-sm line-clamp-2">{idea.raw_input.substring(0, 80)}...</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(idea.submitted_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${getStatusColor(idea.status)}`}>
                            {getStatusLabel(idea.status)}
                          </span>
                        </div>
                        <button className="text-primary text-xs font-medium hover:text-accent flex items-center gap-1">
                          View Details
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-card p-8 text-center">
                    <CheckCircle2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm mb-4">No ideas yet. Get started!</p>
                    <Link href="/intake">
                      <Button className="glass-button-primary w-full">Submit Your First Idea</Button>
                    </Link>
                  </div>
                )}

                {/* Call to Action */}
                <Link href="/intake" className="w-full mt-8">
                  <Button className="glass-button-primary w-full">
                    Create New Content
                  </Button>
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  )
}
