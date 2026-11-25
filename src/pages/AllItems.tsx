import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { categories, menu, type CategoryId } from '../data/menu'
import { ProductCard } from '../components/ProductCard'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { Link } from 'react-router-dom'

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export default function AllItems() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<CategoryId | 'all'>('all')
  const chips = useRef<HTMLDivElement>(null)

  // deep links: /all-items#pasta
  useEffect(() => {
    const h = decodeURIComponent(location.hash.slice(1))
    if (h && categories.some((c) => c.id === h)) {
      setCat(h as CategoryId)
      requestAnimationFrame(() => document.getElementById(`cat-${h}`)?.scrollIntoView({ block: 'start' }))
    }
  }, [])
  useEffect(() => {
    chips.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [cat])

  const results = useMemo(() => {
    const t = norm(q.trim())
    return menu.filter((m) => (cat === 'all' || m.category === cat) && (!t || norm([m.name, m.description, ...m.ingredients, categories.find((c) => c.id === m.category)!.name].join(' ')).includes(t)))
  }, [q, cat])

  const groups = categories.map((c) => ({ c, items: results.filter((r) => r.category === c.id) })).filter((g) => g.items.length)

  return (
    <div className="bg-ink pt-28 md:pt-32">
      <div className="wrap">
        <Breadcrumbs trail={[{ name: 'Home', to: '/' }, { name: 'All Items' }]} />
        <h1 className="display mt-6 text-[clamp(3.4rem,11vw,11rem)]">All items</h1>
        <p className="mt-4 max-w-2xl text-lg text-cream/70">The full Tea Town menu in one place: burgers, shawarma, wraps, clubs, pasta, loaded fries, grills, karak, fresh juices, shakes and more. Prefer the original? <Link to="/menu" className="text-orange underline underline-offset-4">Open the menu book</Link>.</p>
      </div>

      <div className="sticky top-16 z-30 mt-10 border-y border-cream/10 bg-ink/95 backdrop-blur md:top-20">
        <div className="wrap py-3">
          <label className="relative block">
            <span className="sr-only">Search the menu</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-orange" aria-hidden />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search karak, zinger, animal fries, pasta…" className="w-full bg-charcoal py-4 pl-12 pr-12 text-base font-semibold text-cream placeholder:text-cream/40 focus:outline-none focus:ring-2 focus:ring-orange" />
            {q && <button type="button" onClick={() => setQ('')} aria-label="Clear search" className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center hover:text-orange"><X className="h-4 w-4" /></button>}
          </label>
          <div ref={chips} className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 md:-mx-10 md:px-10" role="toolbar" aria-label="Filter by category">
            {[{ id: 'all' as const, name: 'All' }, ...categories].map((c) => (
              <button key={c.id} type="button" aria-pressed={cat === c.id} onClick={() => { setCat(c.id); history.replaceState(null, '', c.id === 'all' ? location.pathname : `#${c.id}`) }}
                className={`shrink-0 border px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] transition ${cat === c.id ? 'border-orange bg-orange text-ink' : 'border-cream/20 text-cream/80 hover:border-orange hover:text-orange'}`}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="wrap pb-24" aria-live="polite">
        <p className="mt-6 text-sm text-cream/50">{results.length} item{results.length === 1 ? '' : 's'}{q && ` for “${q}”`}</p>
        {groups.length === 0 && (
          <div className="py-24 text-center">
            <p className="display text-6xl text-orange">Nothing yet.</p>
            <p className="mt-4 text-cream/70">No items match “{q}”. Try “burger”, “karak” or “fries”, or <button type="button" className="text-orange underline" onClick={() => { setQ(''); setCat('all') }}>reset filters</button>.</p>
          </div>
        )}
        {groups.map(({ c, items }) => (
          <section key={c.id} id={`cat-${c.id}`} aria-labelledby={`h-${c.id}`} className="scroll-mt-48 border-t border-cream/10 pt-12 mt-12 first:border-0 first:mt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 id={`h-${c.id}`} className="display text-5xl md:text-7xl">{c.name}</h2>
              {c.arabic && <span className="font-ar text-2xl font-bold text-orange" lang="ar" dir="rtl">{c.arabic}</span>}
            </div>
            <p className="mt-2 text-cream/60">{c.blurb}</p>
            <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {items.map((it) => <li key={it.id}><ProductCard item={it} /></li>)}
            </ul>
          </section>
        ))}
        <p className="mt-16 border-t border-cream/10 pt-6 text-xs text-cream/45">Item names follow Tea Town&rsquo;s published menu plus newly introduced items. Prices and availability can change, so please confirm in store. Product photography is being added.</p>
      </div>
    </div>
  )
}
