import { useState } from 'react'
import { PageHero } from '../components/PageHero'
import { BranchCards } from '../components/Branches'
import { ReviewSection } from '../components/ReviewSection'
import { branches, links, site } from '../config/site'
import { useBranch } from '../lib/branch'
import { InstagramIcon } from '../components/Icons'

export default function Contact() {
  const { branch, setBranch } = useBranch()
  const [showMap, setShowMap] = useState(false)
  const b = branch ?? branches[0]
  return (
    <>
      <PageHero image="/assets/storefront/night.webp" eyebrow="Tea Town Al Jazzat · Tea Town Al Tarfa" title="Contact us" trail={[{ name: 'Home', to: '/' }, { name: 'Contact' }]}>
        <p className="mt-6 max-w-xl text-lg text-cream/80">Choose your branch, then call, WhatsApp or get directions. Each branch answers its own phone and WhatsApp.</p>
      </PageHero>
      <section className="bg-ink py-16 md:py-24" aria-labelledby="pick">
        <div className="wrap">
          <h2 id="pick" className="eyebrow text-orange">1 · Choose your branch</h2>
          <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Branch">
            {branches.map((x) => (
              <button key={x.id} type="button" role="radio" aria-checked={b.id === x.id} onClick={() => { setBranch(x); setShowMap(false) }} className={`display border px-5 py-3 text-2xl transition ${b.id === x.id ? 'border-orange bg-orange text-ink' : 'border-cream/20 hover:border-orange hover:text-orange'}`}>{x.shortName}</button>
            ))}
          </div>
          <h2 className="eyebrow mt-14 text-orange">2 · Get in touch</h2>
          <div className="mt-6"><BranchCards headingLevel={3} /></div>
          <div className="mt-10">
            {showMap ? (
              <iframe title={`Map of ${b.name}`} src={links.embed(b)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="aspect-[16/9] w-full border-0 grayscale-[.3] md:aspect-[21/8]" />
            ) : (
              <button type="button" onClick={() => setShowMap(true)} className="group relative block aspect-[16/9] w-full overflow-hidden bg-charcoal md:aspect-[21/8]">
                <img src="/assets/brand/calligraphy-pattern.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-10" loading="lazy" />
                <span className="display relative text-4xl group-hover:text-orange md:text-6xl">Load map · {b.shortName}</span>
                <span className="relative mt-2 block text-xs text-cream/50">Loads Google Maps</span>
              </button>
            )}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-4 text-sm text-cream/70">
            <a href={site.social.instagram} target="_blank" rel="noopener" className="inline-flex items-center gap-2 hover:text-orange"><InstagramIcon /> @teatownuae</a>
            <a href={site.social.linktree} target="_blank" rel="noopener" className="hover:text-orange">linktr.ee/teatown.ae</a>
          </div>
        </div>
      </section>
      <ReviewSection />
    </>
  )
}
