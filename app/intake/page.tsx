'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle, CheckCircle2, Loader2,
  Sparkles, ArrowRight, Menu, X, Lightbulb, Link2,
} from 'lucide-react'
import Link from 'next/link'

export default function IntakePage() {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [inputType, setInputType] = useState<'idea' | 'url'>('idea')
  const [rawInput, setRawInput] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')

  useEffect(() => { setIsMounted(true) }, [])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (rawInput.length < 10) {
      newErrors.rawInput = inputType === 'idea' ? 'Must be at least 10 characters' : 'Please enter a valid URL'
    }
    if (inputType === 'url' && !rawInput.startsWith('https://')) {
      newErrors.rawInput = 'Must be a valid URL starting with https://'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) newErrors.email = 'Must be a valid email address'
    if (name.trim().length === 0) newErrors.name = 'Name is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError('')
    if (!validateForm()) return
    setIsLoading(true)
    try {
      const response = await fetch('https://cohort2pod2.app.n8n.cloud/webhook/content-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, content_input: rawInput, input_type: inputType }),
      })
      if (!response.ok) {
        setGeneralError('Failed to submit')
        return
      }
      setIsSuccess(true)
      if (isMounted) setTimeout(() => router.push('/draft-review'), 2000)
    } catch {
      setGeneralError('Network error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  /* ── success state ── */
  if (isSuccess) {
    return (
      <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1.5rem', boxShadow: '0 32px 80px rgba(224,40,133,0.15)', padding: '3rem', maxWidth: '28rem', width: '100%', textAlign: 'center', animation: 'fadeInScale 0.4s ease-out' }}>
          <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', background: 'linear-gradient(135deg, #ec4899, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 0 40px rgba(236,72,153,0.4)' }}>
            <CheckCircle2 style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} />
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'white', marginBottom: '0.75rem' }}>Idea Submitted!</h1>
          <p style={{ color: '#9ca3af', lineHeight: 1.6 }}>Our AI is generating three optimized drafts. You'll be redirected shortly to review them.</p>
        </div>
        <style>{`@keyframes fadeInScale { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }`}</style>
      </div>
    )
  }

  /* ── main page ── */
  return (
    <div style={{ minHeight: '100vh', background: '#080808', fontFamily: "'Inter', 'Geist', system-ui, sans-serif" }}>

      {/* ambient blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '45vw', height: '45vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      {/* ── navbar ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(20px)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem', height: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', background: 'linear-gradient(135deg, #ec4899, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(236,72,153,0.35)' }}>
              <Sparkles style={{ width: '1.1rem', height: '1.1rem', color: 'white' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'white', lineHeight: 1 }}>Fetemi</div>
              <div style={{ fontSize: '0.65rem', color: '#ec4899', marginTop: '1px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>AI Content</div>
            </div>
          </Link>

          <nav className="desktop-nav" style={{ display: 'flex', gap: '0.25rem' }}>
            {([
              { label: 'Submit', href: '/intake', active: true },
              { label: 'Review Drafts', href: '/draft-review', active: false },
              { label: 'Adapt Content', href: '/adaptation-review', active: false },
              { label: 'Dashboard', href: '/dashboard', active: false },
            ] as const).map(item => (
              <Link key={item.href} href={item.href} style={{ padding: '0.4rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: item.active ? 600 : 400, color: item.active ? 'white' : '#6b7280', background: item.active ? 'rgba(236,72,153,0.12)' : 'transparent', border: item.active ? '1px solid rgba(236,72,153,0.25)' : '1px solid transparent', textDecoration: 'none' }}>
                {item.label}
              </Link>
            ))}
          </nav>

          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'none' }}>
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,8,8,0.97)', backdropFilter: 'blur(20px)', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[{ label: 'Submit', href: '/intake' }, { label: 'Review Drafts', href: '/draft-review' }, { label: 'Adapt Content', href: '/adaptation-review' }, { label: 'Dashboard', href: '/dashboard' }].map(item => (
              <Link key={item.href} href={item.href} style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '0.9rem', padding: '0.5rem 0' }}>{item.label}</Link>
            ))}
          </div>
        )}
      </header>

      {/* ── split layout ── */}
      <main style={{ position: 'relative', zIndex: 1, minHeight: 'calc(100vh - 4rem)', display: 'flex' }}>

        {/* Left — hero panel (hidden on mobile, shown lg+) */}
        <div
          className="hero-panel"
          style={{
            display: 'none',
            flex: '0 0 50%',
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: 'url(/hero-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #080808 0%, rgba(8,8,8,0.5) 50%, rgba(8,8,8,0.1) 100%)' }} />
          <div style={{ position: 'relative', zIndex: 1, padding: '3rem', maxWidth: '32rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.875rem', borderRadius: '2rem', background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.25)', marginBottom: '1.5rem' }}>
              <Sparkles style={{ width: '0.8rem', height: '0.8rem', color: '#ec4899' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#ec4899', letterSpacing: '0.08em', textTransform: 'uppercase' }}>AI-Powered Generation</span>
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: '1.25rem', letterSpacing: '-0.03em', animation: 'slideInLeft 0.6s ease-out' }}>
              Create Content<br />
              <span style={{ background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                That Converts
              </span>
            </h1>
            <p style={{ fontSize: '1.0625rem', color: '#9ca3af', lineHeight: 1.7, animation: 'slideInLeft 0.6s ease-out', animationDelay: '100ms', animationFillMode: 'both' }}>
              Share your idea or URL, and let our AI generate three SEO-optimized drafts tailored to your audience.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
              {([['3x', 'Draft variations'], ['100%', 'SEO optimised'], ['~30s', 'Generation time']] as const).map(([num, label]) => (
                <div key={label} style={{ padding: '0.625rem 1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{num}</div>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '3px' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — form panel */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', background: '#080808' }}>
          <div style={{ width: '100%', maxWidth: '30rem', animation: 'slideInUp 0.5s ease-out' }}>

            {/* heading */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 1rem', borderRadius: '2rem', background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', marginBottom: '1.25rem' }}>
                <Sparkles style={{ width: '0.875rem', height: '0.875rem', color: '#ec4899' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ec4899', letterSpacing: '0.05em', textTransform: 'uppercase' }}>AI-Powered</span>
              </div>
              <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
                Submit Your{' '}
                <span style={{ background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Content Idea
                </span>
              </h2>
              <p style={{ color: '#6b7280', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                Share your idea or a URL — our AI handles the rest
              </p>
            </div>

            {/* form card */}
            <div style={{ background: 'rgba(255,255,255,0.035)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 24px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset' }}>

              {generalError && (
                <div style={{ marginBottom: '1.25rem', padding: '0.875rem 1rem', borderRadius: '0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                  <AlertCircle style={{ width: '1rem', height: '1rem', color: '#ef4444', flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ fontSize: '0.8125rem', color: '#ef4444' }}>{generalError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit}>

                {/* content type */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem' }}>
                    Content Source
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                    {([
                      { value: 'idea', label: 'Share an Idea', sub: 'Describe your concept', Icon: Lightbulb },
                      { value: 'url', label: 'Provide a URL', sub: 'Extract existing content', Icon: Link2 },
                    ] as const).map(({ value, label, sub, Icon }) => {
                      const active = inputType === value
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setInputType(value)}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.375rem', padding: '0.875rem', borderRadius: '0.875rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', background: active ? 'rgba(236,72,153,0.1)' : 'rgba(255,255,255,0.03)', border: active ? '1.5px solid rgba(236,72,153,0.45)' : '1.5px solid rgba(255,255,255,0.06)', boxShadow: active ? '0 0 20px rgba(236,72,153,0.12)' : 'none' }}
                        >
                          <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '0.5rem', background: active ? 'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(168,85,247,0.25))' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon style={{ width: '0.9rem', height: '0.9rem', color: active ? '#ec4899' : '#6b7280' }} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: active ? 'white' : '#d1d5db' }}>{label}</div>
                            <div style={{ fontSize: '0.7rem', color: active ? '#be185d' : '#6b7280', marginTop: '1px' }}>{sub}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* idea / url input */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                    {inputType === 'idea' ? 'Your Idea' : 'Content URL'}
                  </label>
                  {inputType === 'idea' ? (
                    <textarea
                      value={rawInput}
                      onChange={e => setRawInput(e.target.value)}
                      placeholder="Describe your content idea in detail — the more specific, the better..."
                      rows={4}
                      style={{ width: '100%', resize: 'vertical', background: 'rgba(255,255,255,0.04)', border: errors.rawInput ? '1.5px solid rgba(239,68,68,0.5)' : '1.5px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem', padding: '0.875rem 1rem', color: 'white', fontSize: '0.9rem', lineHeight: 1.6, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(236,72,153,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(236,72,153,0.08)' }}
                      onBlur={e => { e.target.style.borderColor = errors.rawInput ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)'; e.target.style.boxShadow = 'none' }}
                    />
                  ) : (
                    <input
                      type="url"
                      value={rawInput}
                      onChange={e => setRawInput(e.target.value)}
                      placeholder="https://example.com/article"
                      style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: errors.rawInput ? '1.5px solid rgba(239,68,68,0.5)' : '1.5px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem', padding: '0.875rem 1rem', color: 'white', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(236,72,153,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(236,72,153,0.08)' }}
                      onBlur={e => { e.target.style.borderColor = errors.rawInput ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)'; e.target.style.boxShadow = 'none' }}
                    />
                  )}
                  {errors.rawInput
                    ? <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.375rem' }}>{errors.rawInput}</p>
                    : <p style={{ fontSize: '0.75rem', color: '#4b5563', marginTop: '0.375rem' }}>Minimum 10 characters</p>
                  }
                </div>

                {/* name + email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your name"
                      style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: errors.name ? '1.5px solid rgba(239,68,68,0.5)' : '1.5px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem', padding: '0.75rem 0.875rem', color: 'white', fontSize: '0.875rem', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(236,72,153,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(236,72,153,0.08)' }}
                      onBlur={e => { e.target.style.borderColor = errors.name ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)'; e.target.style.boxShadow = 'none' }}
                    />
                    {errors.name && <p style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.3rem' }}>{errors.name}</p>}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: errors.email ? '1.5px solid rgba(239,68,68,0.5)' : '1.5px solid rgba(255,255,255,0.07)', borderRadius: '0.875rem', padding: '0.75rem 0.875rem', color: 'white', fontSize: '0.875rem', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(236,72,153,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(236,72,153,0.08)' }}
                      onBlur={e => { e.target.style.borderColor = errors.email ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)'; e.target.style.boxShadow = 'none' }}
                    />
                    {errors.email && <p style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.3rem' }}>{errors.email}</p>}
                  </div>
                </div>

                {/* submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{ width: '100%', padding: '0.9rem 1.5rem', borderRadius: '0.875rem', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', background: isLoading ? 'rgba(236,72,153,0.4)' : 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)', color: 'white', fontSize: '0.9375rem', fontWeight: 700, letterSpacing: '0.01em', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: isLoading ? 'none' : '0 8px 30px rgba(236,72,153,0.35)', transition: 'all 0.2s ease', opacity: isLoading ? 0.7 : 1 }}
                  onMouseEnter={e => { if (!isLoading) { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 14px 40px rgba(236,72,153,0.45)' } }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = isLoading ? 'none' : '0 8px 30px rgba(236,72,153,0.35)' }}
                >
                  {isLoading
                    ? <><Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} /> Generating drafts…</>
                    : <>Generate Drafts <ArrowRight style={{ width: '1rem', height: '1rem' }} /></>
                  }
                </button>

              </form>
            </div>

            {/* feature pills */}
            <div style={{ marginTop: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {['3 AI-generated variations', 'SEO optimized', 'Instant results'].map(feat => (
                <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.75rem', borderRadius: '2rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.75rem', color: '#6b7280' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'linear-gradient(135deg, #ec4899, #a855f7)', flexShrink: 0 }} />
                  {feat}
                </div>
              ))}
            </div>

          </div>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes slideInUp   { from { opacity:0; transform:translateY(24px);  } to { opacity:1; transform:translateY(0);  } }
        @keyframes slideInLeft { from { opacity:0; transform:translateX(-24px); } to { opacity:1; transform:translateX(0); } }
        @keyframes fadeInScale { from { opacity:0; transform:scale(0.96);       } to { opacity:1; transform:scale(1);       } }
        @keyframes spin        { to   { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: #374151; }
        textarea { scrollbar-width: thin; scrollbar-color: rgba(236,72,153,0.2) transparent; }
        @media (min-width: 1024px) { .hero-panel { display: flex !important; } }
        @media (max-width: 640px)  { .desktop-nav { display: none !important; } .mobile-menu-btn { display: flex !important; } }
      `}</style>

    </div>
  )
}
