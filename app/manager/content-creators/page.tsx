'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronRight,
  Loader2,
  Search,
  UserPlus,
  Users,
  Sparkles,
  Mail,
  Calendar,
  Trash2,
  LayoutGrid,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AppNav } from '@/components/AppNav'
import { useAuth } from '@/hooks/useAuth'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

type CreatorStatus = 'active' | 'invited' | 'paused'

type CreatorRow = {
  id: string
  email: string
  name: string
  submissions: number
  lastActive: string
  status: CreatorStatus
}

const INITIAL_CREATORS: CreatorRow[] = [
  {
    id: 'seed-1',
    email: 'alex.rivera@northwind.io',
    name: 'Alex Rivera',
    submissions: 28,
    lastActive: '2026-03-26T14:22:00.000Z',
    status: 'active',
  },
  {
    id: 'seed-2',
    email: 'sam.okonkwo@northwind.io',
    name: 'Sam Okonkwo',
    submissions: 14,
    lastActive: '2026-03-24T09:10:00.000Z',
    status: 'active',
  },
  {
    id: 'seed-3',
    email: 'jordan.kim@northwind.io',
    name: 'Jordan Kim',
    submissions: 6,
    lastActive: '2026-03-20T16:45:00.000Z',
    status: 'invited',
  },
  {
    id: 'seed-4',
    email: 'morgan.lee@northwind.io',
    name: 'Morgan Lee',
    submissions: 41,
    lastActive: '2026-03-27T08:00:00.000Z',
    status: 'active',
  },
  {
    id: 'seed-5',
    email: 'taylor.voss@northwind.io',
    name: 'Taylor Voss',
    submissions: 0,
    lastActive: '2026-03-15T11:30:00.000Z',
    status: 'paused',
  },
]

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  const a = parts[0]?.[0] ?? '?'
  const b = parts[1]?.[0] ?? ''
  return (a + b).toUpperCase().slice(0, 2)
}

function formatRelative(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const statusStyles: Record<CreatorStatus, string> = {
  active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  invited: 'bg-amber-500/15 text-amber-200 border-amber-500/25',
  paused: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
}

export default function ManagerContentCreatorsPage() {
  const router = useRouter()
  const { user, role, loading: authLoading, signOut } = useAuth()

  const [creators, setCreators] = useState<CreatorRow[]>(INITIAL_CREATORS)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [removeId, setRemoveId] = useState<string | null>(null)

  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newStatus, setNewStatus] = useState<CreatorStatus>('invited')

  useEffect(() => {
    if (authLoading) return
    if (!user?.email) {
      router.push('/login')
      return
    }
    if (role !== 'manager') {
      router.push('/intake')
    }
  }, [authLoading, user, role, router])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return creators
    return creators.filter(
      (c) =>
        c.email.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.status.includes(q),
    )
  }, [creators, search])

  const stats = useMemo(() => {
    const active = creators.filter((c) => c.status === 'active').length
    const invited = creators.filter((c) => c.status === 'invited').length
    const paused = creators.filter((c) => c.status === 'paused').length
    return { total: creators.length, active, invited, paused }
  }, [creators])

  const removeTarget = removeId ? creators.find((c) => c.id === removeId) : null

  const handleAdd = () => {
    const email = newEmail.trim().toLowerCase()
    if (!email.includes('@') || !newName.trim()) return
    const row: CreatorRow = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tmp-${Date.now()}`,
      email,
      name: newName.trim(),
      submissions: 0,
      lastActive: new Date().toISOString(),
      status: newStatus,
    }
    setCreators((prev) => [row, ...prev])
    setNewEmail('')
    setNewName('')
    setNewStatus('invited')
    setAddOpen(false)
  }

  const confirmRemove = () => {
    if (!removeId) return
    setCreators((prev) => prev.filter((c) => c.id !== removeId))
    setRemoveId(null)
  }

  if (authLoading || !user?.email || role !== 'manager') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 h-[420px] w-[min(100%,900px)] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.18) 0%, transparent 65%)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 h-64 w-64 rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
          }}
        />
      </div>

      <AppNav role={role} email={user?.email} onSignOut={signOut} active="content-creators" />

      <div className="relative border-b border-white/[0.06] bg-zinc-900/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 mb-3">
            <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-zinc-400">Content creators</span>
          </nav>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-3">
                <LayoutGrid className="w-3.5 h-3.5" />
                Roster
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                Content creators
              </h1>
              <p className="mt-1 text-sm text-zinc-400 max-w-2xl leading-relaxed">
                People who submit ideas and receive drafts. Add/remove below is for UI prototyping only — wire to
                your database or auth when ready.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setAddOpen(true)}
              className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20"
            >
              <UserPlus className="w-4 h-4" />
              Add creator
            </Button>
          </div>
        </div>
      </div>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
          {[
            { label: 'On roster', value: stats.total, icon: Users, accent: 'from-violet-500/20' },
            { label: 'Active', value: stats.active, icon: Sparkles, accent: 'from-emerald-500/20' },
            { label: 'Invited', value: stats.invited, icon: Mail, accent: 'from-amber-500/20' },
            { label: 'Paused', value: stats.paused, icon: Calendar, accent: 'from-zinc-500/20' },
          ].map(({ label, value, icon: Icon, accent }) => (
            <div
              key={label}
              className={cn(
                'rounded-2xl border border-white/[0.08] bg-gradient-to-br p-5',
                accent,
                'to-zinc-900/80',
              )}
            >
              <Icon className="w-5 h-5 text-primary/90 mb-3" />
              <div className="text-3xl font-semibold tabular-nums text-white tracking-tight">{value}</div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or status…"
              className="pl-10 h-11 bg-zinc-900/80 border-white/10 text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <p className="text-xs text-zinc-500 tabular-nums">
            Showing {filtered.length} of {creators.length}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/30 px-8 py-16 text-center">
            <Users className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">No creators match your search.</p>
            <Button type="button" variant="link" className="text-primary mt-2" onClick={() => setSearch('')}>
              Clear search
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <article
                key={c.id}
                className="group flex flex-col rounded-2xl border border-white/[0.08] bg-zinc-900/50 backdrop-blur-sm p-5 transition-all hover:border-white/15 hover:bg-zinc-900/70"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 text-sm font-semibold text-white ring-1 ring-white/10"
                    aria-hidden
                  >
                    {initials(c.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="font-semibold text-white truncate">{c.name}</h2>
                      <span
                        className={cn(
                          'text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border',
                          statusStyles[c.status],
                        )}
                      >
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 break-all">{c.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRemoveId(c.id)}
                    className="shrink-0 rounded-lg p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    aria-label={`Remove ${c.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 pt-4 border-t border-white/[0.06] text-xs text-zinc-500">
                  <span>
                    Submissions{' '}
                    <span className="text-zinc-300 font-medium tabular-nums">{c.submissions}</span>
                  </span>
                  <span title={new Date(c.lastActive).toLocaleString()}>
                    Last activity{' '}
                    <span className="text-zinc-400">{formatRelative(c.lastActive)}</span>
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md border-white/10 bg-zinc-900 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-white">Add creator</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Adds a row to this page only — not persisted to Supabase yet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cc-email" className="text-zinc-300">
                Work email
              </Label>
              <Input
                id="cc-email"
                type="email"
                autoComplete="off"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="name@company.com"
                className="bg-zinc-950/80 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-name" className="text-zinc-300">
                Display name
              </Label>
              <Input
                id="cc-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Jamie Chen"
                className="bg-zinc-950/80 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-status" className="text-zinc-300">
                Status
              </Label>
              <select
                id="cc-status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as CreatorStatus)}
                className="w-full h-10 rounded-md border border-white/10 bg-zinc-950/80 px-3 text-sm text-zinc-100"
              >
                <option value="invited">Invited</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="border-white/10" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAdd}
              disabled={!newEmail.trim().includes('@') || !newName.trim()}
              className="bg-primary text-primary-foreground"
            >
              Add to list
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={removeId !== null} onOpenChange={(o) => !o && setRemoveId(null)}>
        <AlertDialogContent className="border-white/10 bg-zinc-900 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Remove creator?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {removeTarget
                ? `Remove ${removeTarget.name} (${removeTarget.email}) from this list?`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-zinc-300 hover:bg-white/5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-red-600 text-white hover:bg-red-600/90 focus:ring-red-600"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
