import { Link } from 'react-router-dom'
import { Phone, Navigation, Clock, MapPin, ArrowUpRight } from 'lucide-react'
import { branches, links } from '../config/site'
import { useBranch } from '../lib/branch'
import { WhatsAppIcon } from './Icons'

export function BranchCards({ headingLevel = 3 }: { headingLevel?: 2 | 3 }) {
  const { branch, setBranch } = useBranch()
  const H = `h${headingLevel}` as 'h3'
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {branches.map((b, i) => (
        <article key={b.id} className={`group relative overflow-hidden ${i ? 'bg-orange text-ink' : 'bg-charcoal text-cream'}`} onFocus={() => setBranch(b)}>
          <div className="relative aspect-[16/8] overflow-hidden">
            <img src={i ? '/assets/storefront/dayfront.webp' : '/assets/storefront/dayangle.webp'} alt={i ? 'Tea Town storefront by day' : 'Tea Town storefront, angled daytime view'} loading="lazy" width={720} height={720} className="h-full w-full object-cover transition-transform duration-[1.4s] ease-brand group-hover:scale-105" />
            <span className={`eyebrow absolute left-4 top-4 px-2.5 py-1.5 ${b.is24h ? 'bg-ink text-orange' : 'bg-orange text-ink'}`}>{b.is24h ? 'Open 24 hours' : '6 AM – 4 AM daily'}</span>
            {branch?.id === b.id && <span className="eyebrow absolute right-4 top-4 bg-cream px-2.5 py-1.5 text-ink">Your branch</span>}
          </div>
          <div className="p-6 md:p-8">
            <H className="display text-5xl md:text-6xl"><Link to={`/locations/${b.id}`} className="hover:underline">{b.shortName}</Link></H>
            <ul className="mt-5 space-y-3 text-[15px]">
              <li className="flex gap-3"><MapPin className="mt-1 h-4 w-4 shrink-0" aria-hidden />{b.address}</li>
              <li className="flex gap-3"><Clock className="mt-1 h-4 w-4 shrink-0" aria-hidden />{b.hours}<span className="opacity-60">(listed hours, please confirm)</span></li>
            </ul>
            <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <a href={links.call(b)} onClick={() => setBranch(b)} className={`btn !px-3 ${i ? 'bg-ink text-cream hover:bg-cream hover:text-ink' : 'bg-orange text-ink hover:bg-cream'}`}><Phone className="h-4 w-4" aria-hidden />Call</a>
              <a href={links.whatsapp(b)} target="_blank" rel="noopener" onClick={() => setBranch(b)} className="btn bg-wa !px-3 text-ink hover:bg-cream"><WhatsAppIcon className="h-4 w-4" />WhatsApp</a>
              <a href={links.directions(b)} target="_blank" rel="noopener" onClick={() => setBranch(b)} className={`btn border !px-3 ${i ? 'border-ink/40 hover:bg-ink hover:text-cream' : 'border-cream/30 hover:border-orange hover:text-orange'}`}><Navigation className="h-4 w-4" aria-hidden />Directions</a>
              <Link to={`/locations/${b.id}`} className={`btn border !px-3 ${i ? 'border-ink/40 hover:bg-ink hover:text-cream' : 'border-cream/30 hover:border-orange hover:text-orange'}`}>Details<ArrowUpRight className="h-4 w-4" aria-hidden /></Link>
            </div>
            <p className="mt-4 text-xs opacity-60">Tel {b.phoneDisplay} · WhatsApp {b.whatsappDisplay}</p>
          </div>
        </article>
      ))}
    </div>
  )
}
