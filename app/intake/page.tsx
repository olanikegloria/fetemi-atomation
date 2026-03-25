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
      <main style={{ position: 'relative', zIndex: 1, minHeight: 'calc(100vh - 4rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', width: '100%', maxWidth: '72rem', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', minHeight: '40rem' }}>
          
          {/* Left — hero panel (hidden on mobile, shown lg+) */}
          <div
            className="hero-panel"
            style={{
              display: 'none',
              flex: '1',
              position: 'relative',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: 'url(/hero-bg.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.7) 100%)' }} />
            <div style={{ position: 'relative', zIndex: 1, padding: '3rem', width: '100%', maxWidth: '32rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.875rem', borderRadius: '2rem', background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.25)', marginBottom: '1.5rem' }}>
                <Sparkles style={{ width: '0.8rem', height: '0.8rem', color: '#ec4899' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#ec4899', letterSpacing: '0.08em', textTransform: 'uppercase' }}>AI-Powered Generation</span>
              </div>
              <h1 style={{ fontSize: 'clamp(2rem, 3vw, 2.75rem)', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: '1.25rem', letterSpacing: '-0.03em', animation: 'slideInLeft 0.6s ease-out' }}>
                Create Content<br />
                <span style={{ background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  That Converts
                </span>
              </h1>
              <p style={{ fontSize: '1rem', color: '#9ca3af', lineHeight: 1.7, animation: 'slideInLeft 0.6s ease-out', animationDelay: '100ms', animationFillMode: 'both' }}>
                Share your idea or URL, and let our AI generate three SEO-optimized drafts tailored to your audience.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
                {([['3x', 'Draft variations'], ['100%', 'SEO optimised'], ['~30s', 'Generation time']] as const).map(([num, label]) => (
                  <div key={label} style={{ flex: 1, minWidth: '100px', padding: '0.875rem 1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{num}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — form panel */}
          <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ width: '100%', maxWidth: '26rem', animation: 'slideInUp 0.5s ease-out' }}>
              
              {/* heading */}
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                  Submit Your Idea
                </h2>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Our AI handles the rest
                </p>
              </div>

              {generalError && (
                <div style={{ marginBottom: '1.25rem', padding: '0.875rem 1rem', borderRadius: '0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <AlertCircle style={{ width: '1rem', height: '1rem', color: '#ef4444' }} />
                    <p style={{ fontSize: '0.8125rem', color: '#ef4444' }}>{generalError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* content type */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem' }}>Content Source</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {([ { value: 'idea', label: 'Share Idea', Icon: Lightbulb }, { value: 'url', label: 'Provide URL', Icon: Link2 } ] as const).map(({ value, label, Icon }) => {
                      const active = inputType === value;
                      return (
                        <button key={value} type="button" onClick={() => setInputType(value)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '0.75rem', border: active ? '1px solid #ec4899' : '1px solid rgba(255,255,255,0.06)', background: active ? 'rgba(236,72,153,0.05)' : 'rgba(255,255,255,0.03)', color: active ? 'white' : '#9ca3af', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}>
                          <Icon size={16} color={active ? '#ec4899' : '#6b7280'} /> {label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* idea / url input */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>{inputType === 'idea' ? 'Your Idea' : 'Content URL'}</label>
                  {inputType === 'idea' ? (
                    <textarea value={rawInput} onChange={e => setRawInput(e.target.value)} placeholder="Describe your concept in detail..." rows={4} style={{ width: '100%', resize: 'none', background: 'rgba(255,255,255,0.03)', border: errors.rawInput ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem', padding: '0.875rem 1rem', color: 'white', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = '#ec4899'} onBlur={e => e.target.style.borderColor = errors.rawInput ? '#ef4444' : 'rgba(255,255,255,0.06)'} />
                  ) : (
                    <input type="url" value={rawInput} onChange={e => setRawInput(e.target.value)} placeholder="https://..." style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: errors.rawInput ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem', padding: '0.875rem 1rem', color: 'white', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = '#ec4899'} onBlur={e => e.target.style.borderColor = errors.rawInput ? '#ef4444' : 'rgba(255,255,255,0.06)'} />
                  )}
                  {errors.rawInput ? <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>{errors.rawInput}</p> : <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>Min 10 characters</p>}
                </div>

                {/* name + email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: errors.name ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem', padding: '0.75rem', color: 'white', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = '#ec4899'} onBlur={e => e.target.style.borderColor = errors.name ? '#ef4444' : 'rgba(255,255,255,0.06)'} />
                    {errors.name && <p style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.25rem' }}>{errors.name}</p>}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@ext.com" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: errors.email ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem', padding: '0.75rem', color: 'white', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = '#ec4899'} onBlur={e => e.target.style.borderColor = errors.email ? '#ef4444' : 'rgba(255,255,255,0.06)'} />
                    {errors.email && <p style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.25rem' }}>{errors.email}</p>}
                  </div>
                </div>

                <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: 'none', background: isLoading ? 'rgba(236,72,153,0.5)' : '#ec4899', color: 'white', fontSize: '0.875rem', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }} onMouseEnter={e => { if(!isLoading) e.currentTarget.style.transform = 'translateY(-1px)' }} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                  {isLoading ? <><Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} /> Generating…</> : <>Generate Drafts <ArrowRight style={{ width: '1rem', height: '1rem' }} /></>}
                </button>
              </form>

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
