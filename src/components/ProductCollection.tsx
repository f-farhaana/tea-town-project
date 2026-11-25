import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import type { MenuItem } from '../data/menu'
import { ProductCard, type Tone } from './ProductCard'

interface Props {
  id: string
  eyebrow?: string
  title: ReactNode
  subtitle?: string
  arabic?: string
  items: MenuItem[]
  viewAll?: string
  tone?: Tone
  intro?: ReactNode
  size?: 'lg' | 'md'
}

const toneCls: Record<Tone, string> = { dark: 'bg-ink text-cream', orange: 'bg-orange text-ink', cream: 'bg-cream text-ink' }

/** Reusable horizontal product rail: swipe, drag, arrows, keyboard, snap and progress. */
export function ProductCollection({ id, eyebrow, title, subtitle, arabic, items, viewAll, tone = 'dark', intro, size = 'md' }: Props) {
  const rail = useRef<HTMLDivElement>(null)
  const [prog, setProg] = useState(0)
  const [edge, setEdge] = useState({ start: true, end: false })

  useEffect(() => {
    const el = rail.current
    if (!el) return
    const on = () => {
      const max = el.scrollWidth - el.clientWidth
      setProg(max > 0 ? el.scrollLeft / max : 1)
      setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft > max - 8 })
    }
    on()
    el.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    // mouse drag (desktop)
    let down = false, sx = 0, sl = 0, moved = false
    const md = (e: PointerEvent) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = el.scrollLeft; el.style.scrollSnapType = 'none' }
    const mm = (e: PointerEvent) => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; el.scrollLeft = sl - dx }
    const mu = () => { if (!down) return; down = false; el.style.scrollSnapType = ''; }
    const clk = (e: MouseEvent) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false } }
    el.addEventListener('pointerdown', md); window.addEventListener('pointermove', mm); window.addEventListener('pointerup', mu); el.addEventListener('click', clk, true)
    return () => { el.removeEventListener('scroll', on); window.removeEventListener('resize', on); el.removeEventListener('pointerdown', md); window.removeEventListener('pointermove', mm); window.removeEventListener('pointerup', mu); el.removeEventListener('click', clk, true) }
  }, [])

  const go = (dir: 1 | -1) => {
    const el = rail.current
    if (!el) return
    const card = el.querySelector('li') as HTMLElement | null
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 300) + 24) * (window.innerWidth > 900 ? 2 : 1), behavior: 'smooth' })
  }
  const arrowCls = tone === 'dark' ? 'border-cream/25 hover:bg-orange hover:text-ink hover:border-orange' : 'border-ink/30 hover:bg-ink hover:text-cream'
  const w = size === 'lg' ? 'w-[78vw] sm:w-[46vw] lg:w-[30vw] xl:w-[26vw]' : 'w-[70vw] sm:w-[40vw] lg:w-[24vw] xl:w-[21vw]'

  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`relative overflow-hidden py-20 md:py-28 ${toneCls[tone]}`}>
      {arabic && <span aria-hidden className="pointer-events-none absolute -right-6 top-4 select-none font-ar text-[22vw] font-black leading-none opacity-[0.05] md:text-[14vw]" lang="ar">{arabic}</span>}
      <div className="wrap relative">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="reveal max-w-4xl">
            {eyebrow && <p className={`eyebrow mb-4 ${tone === 'dark' ? 'text-orange' : ''}`}>{eyebrow}</p>}
            <h2 id={`${id}-title`} className="display text-[clamp(3rem,8.5vw,8.5rem)]">{title}</h2>
            {subtitle && <p className="mt-4 text-lg font-semibold opacity-80 md:text-xl">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {viewAll && <Link to={viewAll} className={`btn ${tone === 'dark' ? 'text-cream hover:text-orange' : 'text-ink hover:opacity-70'} !px-0`}>View all <ArrowUpRight className="h-4 w-4" aria-hidden /></Link>}
            <button type="button" onClick={() => go(-1)} disabled={edge.start} aria-label="Scroll left" aria-controls={`${id}-rail`} className={`grid h-12 w-12 place-items-center rounded-full border transition disabled:opacity-25 ${arrowCls}`}><ArrowLeft className="h-5 w-5" /></button>
            <button type="button" onClick={() => go(1)} disabled={edge.end} aria-label="Scroll right" aria-controls={`${id}-rail`} className={`grid h-12 w-12 place-items-center rounded-full border transition disabled:opacity-25 ${arrowCls}`}><ArrowRight className="h-5 w-5" /></button>
          </div>
        </div>
        {intro}
      </div>
      <div
        ref={rail}
        id={`${id}-rail`}
        tabIndex={0}
        role="region"
        aria-label={`${typeof title === 'string' ? title : id} — use arrow keys to scroll`}
        onKeyDown={(e) => { if (e.key === 'ArrowRight') { e.preventDefault(); go(1) } if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) } }}
        className="no-scrollbar mt-12 cursor-grab snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth active:cursor-grabbing"
        style={{ scrollPaddingInline: 'max(1.25rem, calc((100vw - 1440px) / 2 + 2.5rem))' }}
      >
        <ul className="flex gap-6 px-5 md:px-10 [&>li]:select-none" style={{ paddingInline: 'max(1.25rem, calc((100vw - 1440px) / 2 + 2.5rem))' }}>
          {items.map((it) => (
            <li key={it.id} className={`shrink-0 snap-start ${w}`}><ProductCard item={it} tone={tone} /></li>
          ))}
          <li aria-hidden className="w-px shrink-0" />
        </ul>
      </div>
      <div className="wrap mt-10">
        <div className={`h-[2px] w-full ${tone === 'dark' ? 'bg-cream/10' : 'bg-ink/15'}`} aria-hidden>
          <div className={`h-full origin-left ${tone === 'dark' ? 'bg-orange' : 'bg-ink'}`} style={{ transform: `scaleX(${Math.max(0.08, prog)})` }} />
        </div>
      </div>
    </section>
  )
}
