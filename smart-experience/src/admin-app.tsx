import { BarChart3, BellRing, Gift, LogOut, MessageSquareWarning, Moon, Settings as Cog, Sun } from 'lucide-react'
import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react'
import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { DemoBadge, Logo } from './components/ui'
import { can, signIn, signOut, useStaff } from './lib/auth'
import { branches, isDemo } from './lib/config'
import { setCtx, useCtx } from './lib/session'
import { useData } from './lib/store'
import type { BranchId } from './lib/types'
import Live from './pages/admin/Live'
import Loyalty from './pages/admin/Loyalty'

const Overview = lazy(() => import('./pages/admin/Overview'))
const FeedbackTab = lazy(() => import('./pages/admin/FeedbackTab'))
const Settings = lazy(() => import('./pages/admin/Settings'))

function Login() {
  const nav = useNavigate(); const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState('')
  const submit = async (e: FormEvent) => { e.preventDefault(); setErr(''); const r = await signIn(email, pw); if (!r.ok) return setErr(r.error); nav(r.s.role === 'owner' ? '/admin' : '/admin/requests') }
  return (
    <div className="admin-shell grid min-h-dvh place-items-center p-4">
      <form onSubmit={submit} className="panel w-full max-w-sm space-y-4 p-6">
        <div className="rounded-xl bg-ink p-3"><Logo size="sm" /></div>
        <h1 className="text-xl font-extrabold">Tea Town dashboard</h1>
        <label className="block"><span className="label">Email</span><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></label>
        <label className="block"><span className="label">{isDemo ? 'Demo PIN' : 'Password'}</span><input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required /></label>
        {err && <p className="text-sm font-bold text-red-400" role="alert">{err}</p>}
        <button className="btn-primary w-full">Sign in</button>
        {isDemo && (
          <div className="rounded-xl bg-gold/15 p-3 text-xs leading-relaxed">
            <p className="mb-1 font-extrabold text-gold">DEMO MODE — fictional data, this browser only</p>
            {[['owner@demo.local', '4444', 'Owner, all tabs'], ['staff.jazzat@demo.local', '1111', 'Staff, Al Jazzat'], ['staff.tarfa@demo.local', '2222', 'Staff, Al Tarfa']].map(([e, p, l]) => (
              <button type="button" key={e} onClick={() => { setEmail(e); setPw(p) }} className="block w-full py-0.5 text-start underline-offset-2 hover:underline">{l}: {e} / {p}</button>
            ))}
            <p className="mt-1 opacity-70">Demo logins are disabled automatically when a real database is connected.</p>
          </div>
        )}
      </form>
    </div>
  )
}

export const useBranchFilter = () => {
  const me = useStaff()!
  const [b, setB] = useState<BranchId | 'all'>(me.role === 'owner' ? 'all' : me.branches[0])
  const options: (BranchId | 'all')[] = me.role === 'owner' ? ['all', ...branches.map((x) => x.id)] : me.branches
  return { branch: b, setBranch: setB, options, label: (x: BranchId | 'all') => (x === 'all' ? 'Both branches' : branches.find((y) => y.id === x)!.shortName.split(' — ')[0]) }
}

export default function AdminApp() {
  const me = useStaff(); const s = useData(); const { theme } = useCtx()
  useEffect(() => { // production: load RLS-scoped data and follow realtime changes
    if (!me || isDemo) return
    let stop: (() => void) | undefined
    import('./lib/supabase').then(async (m) => { await m.loadSnapshot('staff'); stop = await m.subscribeLive(() => m.loadSnapshot('staff')) })
    return () => stop?.()
  }, [me])
  if (!me) return <Routes><Route path="*" element={<Login />} /></Routes>
  const owner = can(me, 'owner')
  const tabs = [
    owner && { to: '/admin', end: true, icon: BarChart3, label: 'Overview' },
    { to: '/admin/requests', icon: BellRing, label: 'Live Requests', badge: s.requests.filter((r) => r.status === 'new' && me.branches.includes(r.branchId)).length },
    owner && { to: '/admin/feedback', icon: MessageSquareWarning, label: 'Feedback', badge: s.feedback.filter((f) => f.urgent && f.status === 'new').length },
    { to: '/admin/loyalty', icon: Gift, label: 'Loyalty' },
    owner && { to: '/admin/settings', icon: Cog, label: 'Settings' },
  ].filter(Boolean) as { to: string; end?: boolean; icon: typeof Cog; label: string; badge?: number }[]
  return (
    <div className="admin-shell" data-dash>
      <header className="no-print sticky top-0 z-30 border-b px-4 py-3 backdrop-blur" style={{ borderColor: 'var(--line)', background: 'color-mix(in srgb, var(--bg) 90%, transparent)' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-3"><span className="rounded-lg bg-ink px-2 py-1"><Logo size="sm" /></span>{s.demo && <DemoBadge />}</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden font-bold sm:inline">{me.name}</span>
            <button onClick={() => setCtx({ theme: theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light' })} className="btn-ghost px-2.5 py-2" title={`Theme: ${theme}`} aria-label="Theme">{theme === 'light' ? <Sun size={18} /> : theme === 'dark' ? <Moon size={18} /> : <span className="text-xs">Auto</span>}</button>
            <button onClick={() => signOut()} className="btn-ghost px-2.5 py-2" aria-label="Sign out"><LogOut size={18} /></button>
          </div>
        </div>
        <nav className="no-scrollbar mx-auto mt-3 flex max-w-6xl gap-1 overflow-x-auto">
          {tabs.map(({ to, end, icon: I, label, badge }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-extrabold ${isActive ? 'bg-orange text-ink' : 'muted hover:bg-white/5'}`}>
              <I size={18} />{label}{!!badge && <span className="rounded-full bg-red-500 px-1.5 text-xs text-white">{badge}</span>}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl p-4">
        <Suspense fallback={<p className="muted">Loading…</p>}>
          <Routes>
            <Route index element={owner ? <Overview /> : <Navigate to="/admin/requests" replace />} />
            <Route path="requests" element={<Live />} />
            <Route path="loyalty" element={<Loyalty />} />
            <Route path="feedback" element={owner ? <FeedbackTab /> : <Navigate to="/admin/requests" replace />} />
            <Route path="settings" element={owner ? <Settings /> : <Navigate to="/admin/requests" replace />} />
            <Route path="*" element={<Navigate to={owner ? '/admin' : '/admin/requests'} replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}
