import { Gift, Home as HomeIcon, Languages, MapPin, MessageCircle, Tag, UtensilsCrossed } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ConnectionPill, Logo, Sheet } from './components/ui'
import { deviceToken, logEvent } from './lib/api'
import { branchById, branches, isDemo, waLink } from './lib/config'
import { useT } from './lib/i18n'
import { readEntryParams, setCtx, useCtx } from './lib/session'
import { useData } from './lib/store'
import Home from './pages/customer/Home'
import Menu from './pages/customer/Menu'
import Feedback from './pages/customer/Feedback'
import Loyalty from './pages/customer/Loyalty'
import Offers from './pages/customer/Offers'
import Wifi from './pages/customer/Wifi'

export function BranchPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT(); const { branch } = useCtx()
  return (
    <Sheet open={open} onClose={onClose} title={t('chooseBranch')}>
      <div className="grid gap-3">
        {branches.map((b) => (
          <button key={b.id} onClick={() => { setCtx({ branch: b.id }); onClose() }} className={`flex items-center gap-3 rounded-2xl border p-4 text-start ${branch === b.id ? 'border-orange bg-orange/10' : 'border-white/10 bg-white/5'}`}>
            <MapPin className="shrink-0 text-orange" /><span><span className="block font-extrabold">{b.name}</span><span className="text-sm text-cream/60">{b.area}</span></span>
          </button>
        ))}
      </div>
    </Sheet>
  )
}

export default function CustomerApp() {
  const loc = useLocation(); const nav = useNavigate(); const { branch, lang } = useCtx(); const t = useT(); const s = useData()
  const [picker, setPicker] = useState(false); const once = useRef(false)
  useEffect(() => {
    if (once.current) return; once.current = true
    const p = readEntryParams(loc.search)
    if (p.branch) { setCtx({ branch: p.branch }); nav(loc.pathname, { replace: true }) } // branch held for the session; URL kept clean
    if (!sessionStorage.getItem('tt-visit')) { logEvent('scan', p.branch ?? branch); try { sessionStorage.setItem('tt-visit', '1') } catch { /* ignore */ } }
    if (!isDemo) import('./lib/supabase').then((m) => m.loadSnapshot('customer', deviceToken())).catch(() => undefined)
  }, [loc, nav, branch])
  const b = branchById(branch); const wa = branch ? s.settings.branches[branch].whatsapp : null
  const pickBranch = () => setPicker(true)
  const nav4 = [{ to: '/', i: HomeIcon, l: t('home') }, { to: '/menu', i: UtensilsCrossed, l: t('menu') }, { to: '/loyalty', i: Gift, l: t.lang === 'ar' ? 'الولاء' : 'Loyalty' }, { to: '/offers', i: Tag, l: t.lang === 'ar' ? 'العروض' : 'Offers' }]
  return (
    <div className="min-h-dvh bg-ink pb-24 text-cream">
      <ConnectionPill />
      <header className="sticky top-0 z-30 border-b border-white/5 bg-ink/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-2">
          <NavLink to="/" aria-label="Home"><Logo size="sm" /></NavLink>
          <div className="flex items-center gap-2">
            <button onClick={pickBranch} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold"><MapPin size={14} className="text-orange" />{b ? b.shortName.split(' — ')[0] : t('branch')}</button>
            <button onClick={() => setCtx({ lang: lang === 'en' ? 'ar' : 'en' })} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold"><Languages size={14} />{t('language')}</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 pt-4">
        <Routes>
          <Route path="menu" element={<Menu />} />
          <Route path="feedback" element={<Feedback pickBranch={pickBranch} />} />
          <Route path="loyalty" element={<Loyalty />} />
          <Route path="offers" element={<Offers />} />
          <Route path="wifi" element={<Wifi pickBranch={pickBranch} />} />
          <Route path="*" element={<Home pickBranch={pickBranch} />} />
        </Routes>
      </main>
      {s.settings.features.whatsapp && wa && (
        <a href={waLink(wa)} target="_blank" rel="noopener" onClick={() => logEvent('whatsapp_click', branch)} aria-label={t('whatsapp')} className="fixed bottom-24 end-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-wa text-ink shadow-xl"><MessageCircle size={28} /></a>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur" aria-label="Main">
        <div className="mx-auto grid max-w-xl grid-cols-4">
          {nav4.map(({ to, i: I, l }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex flex-col items-center gap-1 py-2.5 text-[11px] font-extrabold ${isActive ? 'text-orange' : 'text-cream/60'}`}><I size={22} />{l}</NavLink>)}
        </div>
      </nav>
      <BranchPicker open={picker} onClose={() => setPicker(false)} />
    </div>
  )
}
