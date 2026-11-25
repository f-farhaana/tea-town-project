import { Link, useParams } from 'react-router-dom'
import { Phone, Navigation, Star } from 'lucide-react'
import { PageHero } from '../components/PageHero'
import { ProductCollection } from '../components/ProductCollection'
import { branches, links } from '../config/site'
import { pick, featuredPickIds, menu } from '../data/menu'
import { WhatsAppIcon } from '../components/Icons'
import NotFound from './NotFound'

export default function Location() {
  const { id } = useParams()
  const b = branches.find((x) => x.id === id)
  if (!b) return <NotFound />
  const other = branches.find((x) => x.id !== b.id)!
  return (
    <>
      <PageHero image={b.id === 'al-tarfa' ? '/assets/storefront/night.webp' : '/assets/storefront/dayangle.webp'} eyebrow={`Tea Town ${b.shortName}, Sharjah`} title={b.shortName} trail={[{ name: 'Home', to: '/' }, { name: 'Contact', to: '/contact' }, { name: b.shortName }]}>
        <p className="mt-6 max-w-2xl text-lg text-cream/80">{b.is24h ? 'Open 24 hours. Late-night food in Sharjah, sorted: karak, burgers, shawarma and loaded fries whenever the craving hits.' : 'Open daily from 6 AM until 4 AM. Breakfast parathas and karak at dawn, burgers and shawarma until late.'}</p>
      </PageHero>
      <section className="bg-ink py-16 md:py-24">
        <div className="wrap grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="display text-5xl">Visit &amp; contact</h2>
            <dl className="mt-8 grid gap-6 text-lg">
              <div><dt className="eyebrow text-orange">Address</dt><dd className="mt-1">{b.address}{b.plusCode && <span className="block text-sm text-cream/50">Plus code {b.plusCode}</span>}</dd></div>
              <div><dt className="eyebrow text-orange">Opening hours</dt><dd className="mt-1">{b.hours} <span className="text-sm text-cream/50">(as listed publicly)</span></dd></div>
              <div><dt className="eyebrow text-orange">Phone</dt><dd className="mt-1"><a href={links.call(b)} className="hover:text-orange">{b.phoneDisplay}</a></dd></div>
              <div><dt className="eyebrow text-orange">WhatsApp</dt><dd className="mt-1"><a href={links.whatsapp(b)} target="_blank" rel="noopener" className="hover:text-orange">{b.whatsappDisplay}</a></dd></div>
            </dl>
            <div className="mt-10 flex flex-wrap gap-2">
              <a href={links.call(b)} className="btn-orange"><Phone className="h-4 w-4" aria-hidden />Call</a>
              <a href={links.whatsapp(b)} target="_blank" rel="noopener" className="btn bg-wa text-ink hover:bg-cream"><WhatsAppIcon className="h-4 w-4" />WhatsApp</a>
              <a href={links.directions(b)} target="_blank" rel="noopener" className="btn-ghost"><Navigation className="h-4 w-4" aria-hidden />Directions</a>
              <a href={links.review(b)} target="_blank" rel="noopener" className="btn-ghost"><Star className="h-4 w-4" aria-hidden />Review this branch</a>
            </div>
          </div>
          <iframe title={`Map of ${b.name}`} src={links.embed(b)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="aspect-square w-full border-0 lg:aspect-auto lg:h-full" />
        </div>
      </section>
      <ProductCollection id="branch-picks" tone="orange" eyebrow={`Available at ${b.shortName}`} title="What to order" items={pick(featuredPickIds).filter((m) => m.branchAvailability.includes(b.id))} viewAll="/all-items" />
      <section className="bg-ink py-16">
        <div className="wrap flex flex-wrap items-center justify-between gap-6">
          <p className="text-cream/70">The full menu of {menu.length}+ items is served at {b.shortName}. Also visit <Link to={`/locations/${other.id}`} className="text-orange underline underline-offset-4">Tea Town {other.shortName}</Link>.</p>
          <Link to="/menu" className="btn-orange">View Menu</Link>
        </div>
      </section>
    </>
  )
}
