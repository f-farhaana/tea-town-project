import { links, branches } from '../config/site'
import { GoogleG } from './Icons'

export function ReviewSection() {
  return (
    <section aria-labelledby="reviews-title" className="relative overflow-hidden bg-cream py-24 text-ink md:py-32">
      <img src="/assets/brand/arabic-logo-black.png" alt="" loading="lazy" className="pointer-events-none absolute -bottom-20 -left-16 w-[46vw] max-w-xl opacity-[0.06]" />
      <div className="wrap relative grid items-end gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="reveal">
          <p className="eyebrow text-orange">Google reviews</p>
          <h2 id="reviews-title" className="display mt-4 text-[clamp(3rem,8vw,8rem)]">Tell us how it tasted.</h2>
          <p className="mt-5 max-w-xl text-lg font-medium text-ink/75">Good day or off day, your honest review helps us cook better and helps other hungry people in Sharjah find us. It takes under a minute.</p>
        </div>
        <div className="reveal grid gap-3">
          {branches.map((b) => (
            <a key={b.id} href={links.review(b)} target="_blank" rel="noopener" className="group flex items-center gap-4 bg-ink p-5 text-cream transition hover:bg-orange hover:text-ink">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-cream"><GoogleG /></span>
              <span><span className="block text-xs font-bold uppercase tracking-[0.2em] opacity-70">Review</span><span className="display text-2xl">{b.shortName}</span></span>
              <span aria-hidden className="ml-auto text-2xl transition-transform group-hover:translate-x-1">→</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
