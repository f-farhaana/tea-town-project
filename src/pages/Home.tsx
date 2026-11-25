import { Link } from 'react-router-dom'
import { ArrowUpRight, Car, Search, MessageCircle, BookOpen, Navigation } from 'lucide-react'
import { CinematicHero } from '../components/CinematicHero'
import { ProductCollection } from '../components/ProductCollection'
import { BranchCards } from '../components/Branches'
import { ReviewSection } from '../components/ReviewSection'
import { byCategory, menu, pick, featuredPickIds, discoverIds, categories } from '../data/menu'
import { site, branches, links } from '../config/site'
import { useReveal } from '../lib/reveal'
import { useBranch } from '../lib/branch'

const ticker = ['Karak', 'Burgers', 'Shawarma', 'Wraps', 'Clubs', 'Animal Fries', 'Pasta', 'Loaded Mash', 'Grills', 'Fresh Juices', 'Shakes', 'Mojitos', 'Falooda']

export default function Home() {
  useReveal()
  const { branch } = useBranch()
  const favourites = menu.filter((m) => m.customerFavourite)
  const mostOrdered = menu.filter((m) => m.mostOrdered)
  const popular = menu.filter((m) => m.mostPopular)
  const dir = branch ?? branches[0]

  return (
    <>
      <CinematicHero />

      {/* 2 — Welcome */}
      <section id="after-hero" aria-labelledby="welcome-title" className="relative overflow-hidden bg-orange text-ink">
        <div className="border-y border-ink/15 py-4">
          <div className="marquee flex w-max gap-10 whitespace-nowrap" aria-hidden>
            {[...ticker, ...ticker].map((t, i) => <span key={i} className="display flex items-center gap-10 text-3xl">{t}<img src="/assets/brand/arabic-logo-black.png" alt="" className="h-7 w-auto opacity-80" /></span>)}
          </div>
        </div>
        <div className="wrap grid gap-12 py-24 md:py-32 lg:grid-cols-[1.25fr_1fr] lg:items-center">
          <div className="reveal">
            <p className="eyebrow">Welcome to Tea Town, Sharjah</p>
            <h2 id="welcome-title" className="display mt-5 text-[clamp(3.2rem,9vw,9.5rem)]">Come for the tea. Stay for everything else.</h2>
            <p className="mt-7 max-w-xl text-lg font-semibold leading-relaxed md:text-xl">From your favourite cup of karak to loaded burgers, irresistible shawarmas and indulgent fries, discover a whole town of cravings.</p>
            <dl className="mt-10 grid max-w-xl grid-cols-2 gap-x-8 gap-y-6 border-t border-ink/20 pt-8 sm:grid-cols-4">
              {[['Variety', `${menu.length}+ items`], ['Taste', 'Made to order'], ['Value', 'Everyday prices'], ['Car-side', 'Pull up & enjoy']].map(([k, v]) => (
                <div key={k}><dt className="eyebrow opacity-60">{k}</dt><dd className="display mt-1 text-2xl">{v}</dd></div>
              ))}
            </dl>
          </div>
          <div className="reveal relative mx-auto w-full max-w-md lg:max-w-none">
            <img src="/assets/products/signature-burger-packaging.webp" alt="Tea Town beef burger with melted cheese on Tea Town branded takeaway box" width={720} height={720} loading="lazy" className="relative z-10 aspect-square w-full object-cover shadow-[24px_24px_0_#0B0B0B]" />
            <img src="/assets/storefront/night-640.webp" alt="Tea Town storefront lit up at night" width={640} height={296} loading="lazy" className="absolute -bottom-10 -left-6 z-20 w-1/2 border-4 border-orange object-cover md:-left-14" />
          </div>
        </div>
      </section>

      {/* 3 — Most ordered / Featured picks (no sales claims until verified) */}
      <ProductCollection id="featured" eyebrow={site.claims.mostOrderedVerified ? 'Bestsellers' : 'Hand-picked from the menu'} title={site.claims.mostOrderedVerified && mostOrdered.length ? 'The most ordered' : 'Featured picks'} items={site.claims.mostOrderedVerified && mostOrdered.length ? mostOrdered : pick(featuredPickIds)} viewAll="/all-items" size="lg" />

      {/* 4 — Crowd favourites */}
      <ProductCollection id="favourites" tone="cream" eyebrow="Talked about by regulars" title="The crowd favourites" subtitle="Items guests often mention when they talk about Tea Town." items={favourites} viewAll="/all-items" arabic="المفضلة" />

      {/* 5 — Most popular (only labelled as such when verified) */}
      <ProductCollection id="popular" eyebrow={site.claims.mostPopularVerified ? 'Most popular' : 'Worth discovering'} title={site.claims.mostPopularVerified && popular.length ? 'Most popular' : 'Off the beaten menu'} items={site.claims.mostPopularVerified && popular.length ? popular : pick(discoverIds)} viewAll="/all-items" />

      {/* 6 — Burgers */}
      <ProductCollection id="burgers" tone="orange" eyebrow="Burgers in Sharjah" title="Our burger collection" items={[...byCategory('premium-burgers'), ...byCategory('burgers')]} viewAll="/all-items#burgers" size="lg" arabic="برجر" />

      {/* 7 — Shawarma */}
      <ProductCollection id="shawarma" eyebrow="Shawarma in Sharjah" title="Our shawarma collection" subtitle="Freshly carved, wrapped hot and ready for the road." items={byCategory('shawarma')} viewAll="/all-items#shawarma" arabic="شاورما" />

      {/* 8 — Wraps */}
      <ProductCollection id="wraps" tone="cream" eyebrow="Rolled fresh" title="Wrapped in flavour" subtitle="Our Wrap Collection" items={byCategory('wraps')} viewAll="/all-items#wraps" />

      {/* 9 — Sandwiches & clubs */}
      <ProductCollection id="sandwiches" eyebrow="Clubs, croissants & more" title="Not your everyday sandwich" items={[...byCategory('clubs'), ...byCategory('sandwiches')]} viewAll="/all-items#clubs" arabic="كلوب" />

      {/* 10 — Pasta (editorial orange/black) */}
      <ProductCollection
        id="pasta"
        tone="orange"
        eyebrow="Pasta in Sharjah"
        title={<>New cravings <span className="text-cream [-webkit-text-stroke:2px_#0B0B0B]">just dropped</span></>}
        subtitle="Our Pasta Collection"
        items={byCategory('pasta')}
        viewAll="/all-items#pasta"
        size="lg"
        intro={<p className="reveal mt-6 max-w-2xl text-lg font-semibold">Tea Town&rsquo;s newest kitchen line-up. From the house special to cheesy Cheetos pasta, these are the plates regulars are trying next.</p>}
      />

      {/* 11 — Fries */}
      <ProductCollection id="fries" eyebrow="Animal fries & loaded fries, Sharjah" title="Loaded. Cheesy. Irresistible." subtitle="Our Fries Collection" items={byCategory('fries')} viewAll="/all-items#fries" size="lg" arabic="بطاطس" />

      {/* 12 — Loaded mash */}
      <section aria-labelledby="mash-title" className="relative overflow-hidden bg-charcoal py-24 md:py-32">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div className="reveal">
            <p className="eyebrow text-orange">New · Loaded mashed potato</p>
            <h2 id="mash-title" className="display mt-4 text-[clamp(3rem,8vw,8rem)]">Comfort food, levelled up.</h2>
            <p className="mt-6 max-w-md text-lg text-cream/75">Creamy mash, loaded generously. Choose beef or chicken.</p>
            <Link to="/all-items#mashed-potato" className="btn-orange mt-8">See the range <ArrowUpRight className="h-4 w-4" aria-hidden /></Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {byCategory('mashed-potato').map((m, i) => (
              <article key={m.id} className={`reveal relative flex aspect-[4/5] flex-col justify-end overflow-hidden p-6 ${i ? 'bg-orange text-ink' : 'bg-ink'}`} style={{ transitionDelay: `${i * 120}ms` }}>
                <img src={i ? '/assets/brand/arabic-logo-black.png' : '/assets/brand/arabic-logo-white.png'} alt="" className="absolute -right-10 -top-6 w-4/5 opacity-10" loading="lazy" />
                <span className="eyebrow absolute left-6 top-6">{i ? 'Chicken' : 'Beef'}</span>
                <h3 className="display relative text-5xl">{m.name.replace('Loaded Mashed Potato — ', 'Loaded Mash ')}</h3>
                <p className="relative mt-2 text-sm opacity-75">{m.description}</p>
                <p className="eyebrow relative mt-4 opacity-50">Photo coming soon</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 13 — Additional collections, generated from data */}
      <ProductCollection id="paratha" tone="cream" eyebrow="Breakfast to late night" title="Paratha & rolls" subtitle="Flaky Omani-style favourites, rolled and filled." items={byCategory('paratha')} viewAll="/all-items#paratha" arabic="براتا" />
      <ProductCollection id="grills" eyebrow="Charcoal & fire" title="Grills & combos" items={[...byCategory('grills'), ...byCategory('combos')]} viewAll="/all-items#grills" />
      <ProductCollection id="starters" tone="orange" eyebrow="Share it (or don't)" title="Starters & wok" items={[...byCategory('starters'), ...byCategory('chinese')]} viewAll="/all-items#starters" />

      {/* 14 — Drinks */}
      <section aria-labelledby="sip-title" className="relative overflow-hidden bg-ink pt-24 md:pt-32">
        <div className="wrap">
          <p className="eyebrow text-orange">Karak tea Sharjah · fresh juices · milkshakes</p>
          <h2 id="sip-title" className="display reveal mt-4 max-w-[14ch] text-[clamp(3.4rem,10vw,10rem)]">The sip that started it all.</h2>
        </div>
      </section>
      <ProductCollection id="tea" eyebrow="Karak & hot drinks" title="Karak & signature teas" items={byCategory('tea')} viewAll="/all-items#tea" arabic="كرك" />
      <ProductCollection id="shakes" tone="orange" eyebrow="Thick & cold" title="Shakes & smoothies" items={byCategory('shakes')} viewAll="/all-items#shakes" />
      <ProductCollection id="juices" tone="cream" eyebrow="Pressed fresh" title="Fresh juices" items={byCategory('juices')} viewAll="/all-items#juices" />
      <ProductCollection id="mocktails" eyebrow="Tea Town signatures" title="Mocktails & mojitos" items={[...byCategory('mocktails'), ...byCategory('desserts')]} viewAll="/all-items#mocktails" />

      {/* 15 — Drive-through */}
      <section aria-labelledby="drive-title" className="relative isolate overflow-hidden bg-orange text-ink">
        <img src="/assets/storefront/daycorner.webp" alt="Tea Town corner storefront with orange and black facade" loading="lazy" width={720} height={720} className="absolute inset-y-0 right-0 -z-10 hidden h-full w-1/2 object-cover lg:block" />
        <div className="wrap py-24 md:py-32">
          <div className="max-w-2xl reveal">
            <p className="eyebrow">Car-side takeaway</p>
            <h2 id="drive-title" className="display mt-4 text-[clamp(3.4rem,10vw,9rem)]">Pull up. Order. Enjoy.</h2>
            <p className="mt-6 text-lg font-semibold">Most of our guests never leave the driver&rsquo;s seat. Pick your favourites here, call or WhatsApp your branch, then pull up outside Tea Town.</p>
            <ol className="mt-10 grid gap-px bg-ink/20 sm:grid-cols-3">
              {[[Search, 'Discover', 'Browse the full menu and find tonight’s craving.'], [MessageCircle, 'Contact', 'Call or WhatsApp the branch closest to you.'], [Car, 'Pull up', 'Park outside and enjoy Tea Town from your car.']].map(([I, t, d], i) => {
                const Icon = I as typeof Car
                return (
                  <li key={t as string} className="bg-orange p-6 pl-0 sm:pl-6 first:sm:pl-0">
                    <span className="display text-6xl opacity-25">0{i + 1}</span>
                    <Icon className="mt-3 h-6 w-6" aria-hidden />
                    <h3 className="display mt-3 text-3xl">{t as string}</h3>
                    <p className="mt-2 text-sm font-medium">{d as string}</p>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* 16 — About preview */}
      <section aria-labelledby="about-prev" className="relative overflow-hidden bg-ink py-24 md:py-36">
        <img src="/assets/brand/calligraphy-pattern.png" alt="" loading="lazy" className="pointer-events-none absolute inset-x-0 top-1/2 w-full -translate-y-1/2 opacity-[0.05]" />
        <div className="wrap relative grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="reveal grid grid-cols-2 gap-4">
            <img src="/assets/storefront/dayfront-640.webp" alt="Tea Town Jabal Al Noor cafeteria storefront in daylight" width={640} height={640} loading="lazy" className="aspect-[3/4] w-full object-cover" />
            <img src="/assets/storefront/dayangle-640.webp" alt="Tea Town storefront signage" width={640} height={640} loading="lazy" className="mt-16 aspect-[3/4] w-full object-cover" />
          </div>
          <div className="reveal">
            <p className="eyebrow text-orange">About Tea Town</p>
            <h2 id="about-prev" className="display mt-4 text-[clamp(3rem,7vw,7rem)]">A whole town of cravings.</h2>
            <p className="mt-6 max-w-lg text-lg text-cream/75">The name says tea, the menu says everything. Tea Town keeps it simple: big variety, food that tastes great, and prices that let you come back tomorrow. That is why so many guests are regulars.</p>
            <Link to="/about" className="btn-orange mt-8">Discover our story <ArrowUpRight className="h-4 w-4" aria-hidden /></Link>
          </div>
        </div>
      </section>

      {/* 17 — Branches */}
      <section aria-labelledby="branches-title" className="bg-ink pb-24 md:pb-32">
        <div className="wrap">
          <p className="eyebrow text-orange">Tea Town Al Jazzat · Tea Town Al Tarfa</p>
          <h2 id="branches-title" className="display reveal mb-12 mt-4 text-[clamp(3rem,8vw,8rem)]">Two Sharjah addresses.</h2>
          <BranchCards />
        </div>
      </section>

      {/* 18 — Reviews */}
      <ReviewSection />

      {/* 19 — Final CTA */}
      <section aria-labelledby="final-title" className="grain relative isolate overflow-hidden bg-orange py-28 text-ink md:py-40">
        <img src="/assets/brand/arabic-logo-black.png" alt="" loading="lazy" className="pointer-events-none absolute -right-10 top-1/2 -z-10 w-[55vw] max-w-3xl -translate-y-1/2 opacity-10" />
        <div className="wrap">
          <h2 id="final-title" className="display reveal max-w-[12ch] text-[clamp(3.6rem,11vw,11rem)]">Your next craving is waiting.</h2>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/menu" className="btn-ink"><BookOpen className="h-4 w-4" aria-hidden />View Menu</Link>
            <Link to="/contact" className="btn border border-ink hover:bg-ink hover:text-cream">Contact Us</Link>
            <a href={links.directions(dir)} target="_blank" rel="noopener" className="btn border border-ink hover:bg-ink hover:text-cream"><Navigation className="h-4 w-4" aria-hidden />Get Directions{branch ? ` · ${branch.shortName.split(' ')[0]}` : ''}</a>
          </div>
          <p className="mt-10 text-sm font-semibold opacity-70">{categories.length} categories · {menu.length}+ items · open early till late, and 24 hours at Al Tarfa.</p>
        </div>
      </section>
    </>
  )
}
