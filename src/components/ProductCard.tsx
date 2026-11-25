import type { MenuItem } from '../data/menu'
import { catById } from '../data/menu'

export type Tone = 'dark' | 'orange' | 'cream'

/** Branded placeholder used until real product photography is supplied. */
export function ProductVisual({ item, tone = 'dark', className = '' }: { item: MenuItem; tone?: Tone; className?: string }) {
  if (item.image)
    return <img src={item.image} alt={`${item.name} at Tea Town`} width={600} height={600} loading="lazy" decoding="async" className={`h-full w-full object-cover transition-transform duration-[1.2s] ease-brand group-hover:scale-[1.06] ${className}`} />
  const bg = tone === 'orange' ? 'bg-ink text-orange' : tone === 'cream' ? 'bg-orange text-ink' : 'bg-charcoal text-orange'
  const cat = catById[item.category]
  return (
    <div className={`relative grid h-full w-full place-items-center overflow-hidden ${bg} ${className}`} role="img" aria-label={`${item.name} — photo coming soon`}>
      <img src={tone === 'cream' ? '/assets/brand/arabic-logo-black.png' : '/assets/brand/arabic-logo-white.png'} alt="" loading="lazy" className="absolute -right-8 -top-6 w-3/4 opacity-[0.07] transition-transform duration-[1.2s] ease-brand group-hover:rotate-6 group-hover:scale-110" />
      <div className="relative px-4 text-center [container-type:inline-size] w-full">
        <p className="display text-[clamp(1.6rem,14cqw,3.4rem)] [text-wrap:balance] [overflow-wrap:anywhere]">{item.name}</p>
        {cat.arabic && <p className="mt-3 font-ar text-lg font-bold opacity-60" lang="ar" dir="rtl">{cat.arabic}</p>}
      </div>
      <span className="eyebrow absolute bottom-3 left-4 opacity-40">Photo coming soon</span>
    </div>
  )
}

export function ProductCard({ item, tone = 'dark', headingLevel = 3 }: { item: MenuItem; tone?: Tone; headingLevel?: 3 | 4 }) {
  const H = `h${headingLevel}` as 'h3'
  const muted = tone === 'orange' ? 'text-ink/75' : tone === 'cream' ? 'text-ink/70' : 'text-cream/65'
  return (
    <article className="group relative flex h-full flex-col" id={item.slug}>
      <div className="relative aspect-[4/5] overflow-hidden">
        <ProductVisual item={item} tone={tone} />
        <div className="absolute left-3 top-3 flex gap-2">
          {item.isNew && <span className="bg-orange px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-ink ring-1 ring-ink/20">New</span>}
          {item.mostOrdered && <span className="bg-gold px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-ink">Bestseller</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col pt-4">
        <H className="display text-[1.9rem] leading-none">{item.name}</H>
        <p className={`mt-2 text-[15px] leading-snug ${muted}`}>{item.description}</p>
        <p className={`mt-3 text-xs font-bold uppercase tracking-[0.18em] ${tone === 'dark' ? 'text-orange' : ''}`}>
          {item.price ? `AED ${item.price.toFixed(2)}` : 'Ask in store for today’s price'}
        </p>
      </div>
    </article>
  )
}
