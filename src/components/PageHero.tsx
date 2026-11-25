import type { ReactNode } from 'react'
import { Breadcrumbs } from './Breadcrumbs'

export function PageHero({ title, eyebrow, image, trail, children }: { title: ReactNode; eyebrow?: string; image?: string; trail: { name: string; to?: string }[]; children?: ReactNode }) {
  return (
    <section className="grain relative isolate flex min-h-[78svh] items-end overflow-hidden pb-14 pt-32">
      {image && <img src={image} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-55" fetchPriority="high" />}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/60 to-ink/20" />
      <div className="wrap">
        <Breadcrumbs trail={trail} />
        {eyebrow && <p className="eyebrow mt-8 text-orange">{eyebrow}</p>}
        <h1 className="display mt-4 text-[clamp(3.4rem,11vw,11rem)]">{title}</h1>
        {children}
      </div>
    </section>
  )
}
