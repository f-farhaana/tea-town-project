import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { MenuBook } from '../../components/MenuBook'
import { OfflineStatus } from '../../components/OfflineStatus'
import { Sheet } from '../../components/ui'
import { logEvent } from '../../lib/api'
import { useT } from '../../lib/i18n'
import { useCtx } from '../../lib/session'
import { categories, catById, menu, type MenuItem } from '../../shared/menu'

function Thumb({ m, big = false }: { m: MenuItem; big?: boolean }) {
  return m.image ? <img src={m.image} alt={m.name} loading="lazy" className={`${big ? 'h-52 w-full' : 'h-16 w-16'} shrink-0 rounded-xl bg-white/5 object-contain`} />
    : <div className={`${big ? 'h-28 w-full' : 'h-16 w-16'} grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange to-gold`}><span className="font-ar text-base font-extrabold text-ink" lang="ar">{catById[m.category]?.arabic}</span></div>
}

export default function Menu() {
  const t = useT(); const { branch } = useCtx()
  const [tab, setTab] = useState<'book' | 'search'>('book')
  const [q, setQ] = useState(''); const [cat, setCat] = useState('all'); const [open, setOpen] = useState<MenuItem | null>(null)
  const shown = useMemo(() => menu.filter((m) => (cat === 'all' || (cat === 'new' ? m.isNew : m.category === cat)) && (!q || `${m.name} ${catById[m.category]?.name} ${catById[m.category]?.arabic ?? ''}`.toLowerCase().includes(q.toLowerCase()))), [q, cat])
  const groups = categories.map((c) => ({ c, list: shown.filter((m) => m.category === c.id) })).filter((g) => g.list.length)
  const view = (m: MenuItem) => { setOpen(m); logEvent('item_view', branch, m.id) }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-white/5 p-1">
        {(['book', 'search'] as const).map((k) => <button key={k} onClick={() => setTab(k)} className={`rounded-xl py-2.5 text-sm font-extrabold ${tab === k ? 'bg-orange text-ink' : 'text-cream/70'}`}>{k === 'book' ? t('menuBook') : t('catalogue')}</button>)}
      </div>
      {tab === 'book' ? <div className="-mx-4 overflow-hidden"><MenuBook /></div> : (
        <>
          <label className="relative block"><Search className="pointer-events-none absolute start-3 top-3.5 text-cream/40" size={20} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')} className="input ps-11" type="search" /></label>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {[['all', t('all')], ['new', 'New'], ...categories.map((c) => [c.id, t.lang === 'ar' && c.arabic ? c.arabic : c.name])].map(([id, label]) => <button key={id} onClick={() => setCat(id)} className={`chip ${cat === id ? 'chip-on' : 'border-white/15'}`}>{label}</button>)}
          </div>
          {groups.map(({ c, list }) => (
            <section key={c.id}>
              <h2 className="display mb-2 mt-1 text-2xl text-orange">{t.lang === 'ar' && c.arabic ? c.arabic : c.name}</h2>
              <div className="grid gap-2">
                {list.map((m) => (
                  <button key={m.id} onClick={() => view(m)} className="flex items-center gap-3 rounded-2xl bg-white/[0.05] p-2.5 text-start">
                    <Thumb m={m} />
                    <div className="min-w-0 flex-1"><p className="font-extrabold leading-tight">{m.name}{m.isNew && <span className="ms-2 rounded bg-orange px-1.5 text-[10px] text-ink">NEW</span>}</p><p className="mt-0.5 line-clamp-1 text-xs text-cream/60">{m.description}</p></div>
                    <span className="shrink-0 text-xs font-bold text-cream/50">{m.price != null ? `AED ${m.price}` : ''}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
          {!groups.length && <p className="py-10 text-center text-cream/50">No items match “{q}”.</p>}
        </>
      )}
      <OfflineStatus />
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.name}>
        {open && <div className="space-y-3"><Thumb m={open} big /><p className="text-sm text-cream/80">{open.description}</p><p className="font-extrabold text-orange">{open.price != null ? `AED ${open.price}` : t('askPrice')}</p><p className="text-xs text-cream/50">Allergen information is not verified. Please ask staff if you have an allergy.</p></div>}
      </Sheet>
    </div>
  )
}
