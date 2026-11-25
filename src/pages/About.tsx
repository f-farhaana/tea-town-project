import { Link } from 'react-router-dom'
import { BookOpen, ArrowUpRight } from 'lucide-react'
import { PageHero } from '../components/PageHero'
import { BranchCards } from '../components/Branches'
import { categories, menu } from '../data/menu'
import { useReveal } from '../lib/reveal'

const pillars = [
  ['Variety', `More than ${menu.length} items across ${categories.length} categories. Karak and croissants in the morning, burgers and shawarma at lunch, grills and loaded fries late at night.`],
  ['Taste', 'Food is made to order and served hot. The kind of flavour that turns a first visit into a weekly habit.'],
  ['Value', 'Generous portions at everyday prices, so Tea Town fits a quick snack and a full family meal alike.'],
  ['Convenience', 'Most guests never leave their car. Pull up outside, order, and enjoy Tea Town from the driver’s seat.'],
]

export default function About() {
  useReveal()
  return (
    <>
      <PageHero image="/assets/storefront/daycorner.webp" eyebrow="About Tea Town, Sharjah" title={<>More than a tea shop.<br /><span className="text-orange">A whole town of cravings.</span></>} trail={[{ name: 'Home', to: '/' }, { name: 'About Us' }]} />

      <section className="bg-ink py-24 md:py-32" aria-labelledby="intro">
        <div className="wrap grid gap-14 lg:grid-cols-[1fr_1.1fr]">
          <h2 id="intro" className="display reveal text-[clamp(2.8rem,6vw,6rem)]">The name says tea. <span className="text-orange">The menu says everything.</span></h2>
          <div className="reveal space-y-6 text-lg leading-relaxed text-cream/80">
            <p>Tea Town is a Sharjah cafeteria with a loyal crowd of regulars who come back for the same three reasons: the food tastes great, there is always something new to try, and it never costs more than it should.</p>
            <p>Yes, the karak is the real thing. But the kitchen goes much further: fresh beef burgers, shawarma, wraps and club sandwiches, Omani-style parathas, grills, new pasta plates, animal and loaded fries, loaded mashed potatoes, fresh juices, thick shakes and signature mocktails.</p>
            <p>Two branches serve Sharjah, at Al Jazzat and at Jabal Al Noor in Al Tarfa, with Al Tarfa open around the clock.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="approach" className="bg-orange py-24 text-ink md:py-32">
        <div className="wrap">
          <p className="eyebrow">Our approach to food</p>
          <h2 id="approach" className="display reveal mt-4 text-[clamp(3rem,8vw,8rem)]">Four things we never compromise on.</h2>
          <ol className="mt-14 grid gap-px bg-ink/20 md:grid-cols-2 lg:grid-cols-4">
            {pillars.map(([t, d], i) => (
              <li key={t} className="reveal bg-orange p-6 md:p-8" style={{ transitionDelay: `${i * 90}ms` }}>
                <span className="display text-7xl opacity-20">0{i + 1}</span>
                <h3 className="display mt-4 text-4xl">{t}</h3>
                <p className="mt-3 font-medium">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="gallery" className="bg-ink py-24 md:py-32">
        <div className="wrap">
          <h2 id="gallery" className="display reveal text-[clamp(2.8rem,7vw,7rem)]">Orange, black and lit up at night.</h2>
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-6 md:grid-rows-2">
            <img src="/assets/storefront/night.webp" alt="Tea Town storefront illuminated at night" loading="lazy" width={1360} height={628} className="reveal col-span-2 h-full w-full object-cover md:col-span-4" />
            <img src="/assets/products/signature-burger-packaging.webp" alt="Tea Town burger on branded golden takeaway box" loading="lazy" width={720} height={720} className="reveal col-span-1 aspect-square h-full w-full object-cover md:col-span-2 md:row-span-2" />
            <img src="/assets/storefront/dayfront.webp" alt="Tea Town front facade by day" loading="lazy" width={720} height={720} className="reveal aspect-square h-full w-full object-cover md:col-span-2" />
            <img src="/assets/storefront/dayangle.webp" alt="Tea Town Arabic calligraphy logo and signage" loading="lazy" width={720} height={720} className="reveal col-span-2 aspect-[2/1] h-full w-full object-cover md:col-span-2 md:aspect-auto" />
          </div>
        </div>
      </section>

      <section aria-labelledby="community" className="relative overflow-hidden bg-charcoal py-24 md:py-32">
        <img src="/assets/brand/calligraphy-pattern.png" alt="" loading="lazy" className="pointer-events-none absolute inset-x-0 top-0 w-full opacity-[0.05]" />
        <div className="wrap relative max-w-4xl text-center">
          <h2 id="community" className="display reveal text-[clamp(2.6rem,6vw,6rem)]">Built by regulars.</h2>
          <p className="reveal mx-auto mt-6 max-w-2xl text-lg text-cream/75">Families on the way home, night-shift workers, students, friends meeting in the car park. Tea Town&rsquo;s community is the people who keep coming back, and everything on the menu is for them.</p>
        </div>
      </section>

      <section aria-labelledby="where" className="bg-ink py-24 md:py-32">
        <div className="wrap">
          <h2 id="where" className="display reveal mb-12 text-[clamp(2.8rem,7vw,7rem)]">Find us in Sharjah.</h2>
          <BranchCards />
          <div className="mt-14 flex flex-wrap gap-3">
            <Link to="/menu" className="btn-orange"><BookOpen className="h-4 w-4" aria-hidden />View Menu</Link>
            <Link to="/all-items" className="btn-ghost">All items <ArrowUpRight className="h-4 w-4" aria-hidden /></Link>
          </div>
        </div>
      </section>
    </>
  )
}
