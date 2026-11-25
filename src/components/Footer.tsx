import { Link } from 'react-router-dom'
import { Phone, MapPin, Clock } from 'lucide-react'
import { branches, links, nav, site } from '../config/site'
import { Logo } from './Logo'
import { WhatsAppIcon, InstagramIcon } from './Icons'

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-cream/10 bg-ink pb-28 pt-20 md:pb-16">
      <div className="wrap">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_2fr]">
          <div>
            <Logo />
            <p className="mt-6 max-w-sm text-cream/65">Karak, burgers, shawarma, wraps, loaded fries, pasta, fresh juices and shakes. Two Sharjah branches, early mornings to late nights.</p>
            <div className="mt-6 flex gap-3">
              <a href={site.social.instagram} target="_blank" rel="noopener" aria-label="Tea Town on Instagram" className="grid h-11 w-11 place-items-center border border-cream/20 transition hover:border-orange hover:text-orange"><InstagramIcon /></a>
              <a href={site.social.linktree} target="_blank" rel="noopener" className="grid h-11 place-items-center border border-cream/20 px-4 text-xs font-extrabold uppercase tracking-[0.18em] transition hover:border-orange hover:text-orange">Linktree</a>
              {site.social.ordering.map((o) => <a key={o.url} href={o.url} target="_blank" rel="noopener" className="grid h-11 place-items-center border border-cream/20 px-4 text-xs font-extrabold uppercase tracking-[0.18em] hover:text-orange">{o.name}</a>)}
            </div>
            <nav aria-label="Footer" className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
              {[...nav, { to: '/menu', label: 'View Menu' }].map((n) => <Link key={n.to} to={n.to} className="text-sm font-bold uppercase tracking-[0.14em] text-cream/80 hover:text-orange">{n.label}</Link>)}
            </nav>
          </div>
          <div className="grid gap-10 sm:grid-cols-2">
            {branches.map((b) => (
              <div key={b.id}>
                <h2 className="display text-3xl text-orange"><Link to={`/locations/${b.id}`} className="hover:text-cream">{b.shortName}</Link></h2>
                <ul className="mt-4 space-y-2.5 text-sm text-cream/75">
                  <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange" aria-hidden /><a href={links.directions(b)} target="_blank" rel="noopener" className="hover:text-cream">{b.address}</a></li>
                  <li className="flex gap-3"><Phone className="h-4 w-4 shrink-0 text-orange" aria-hidden /><a href={links.call(b)} className="hover:text-cream">{b.phoneDisplay}</a></li>
                  <li className="flex gap-3"><WhatsAppIcon className="h-4 w-4 shrink-0 text-wa" /><a href={links.whatsapp(b)} target="_blank" rel="noopener" className="hover:text-cream">{b.whatsappDisplay}</a></li>
                  <li className="flex gap-3"><Clock className="h-4 w-4 shrink-0 text-orange" aria-hidden />{b.hours}</li>
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p aria-hidden className="display pointer-events-none mt-20 select-none whitespace-nowrap text-[19vw] leading-[0.8] text-cream/[0.04]">Tea Town</p>
        <div className="mt-6 flex flex-col gap-3 border-t border-cream/10 pt-6 text-xs text-cream/50 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Tea Town, Sharjah, UAE. All rights reserved.</p>
          <p>Privacy: this site sets no tracking cookies. Your branch choice is stored only on your device. <a href={site.url}>teatown.ae</a></p>
          <p>Crafted by <a href={site.credit.url} target="_blank" rel="noopener" className="hover:text-orange">{site.credit.name}</a></p>
        </div>
      </div>
    </footer>
  )
}
