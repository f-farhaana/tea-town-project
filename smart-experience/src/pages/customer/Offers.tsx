import { liveOffers } from '../../lib/api'
import { useT } from '../../lib/i18n'
import { useCtx } from '../../lib/session'
import { useData } from '../../lib/store'
import { fmtDate } from '../../lib/util'

export default function Offers() {
  const t = useT(); const s = useData(); const { branch } = useCtx(); const list = liveOffers(s.offers, branch)
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">{t('offers')}</h1>
      {!list.length && <p className="rounded-2xl bg-white/5 p-8 text-center text-cream/60">{t('noOffers')}</p>}
      {list.map((o) => (
        <article key={o.id} className="overflow-hidden rounded-3xl bg-gold text-ink">
          {o.image && <img src={o.image} alt="" className="h-44 w-full bg-ink object-contain" />}
          <div className="p-5"><h2 className="display text-3xl">{o.title}</h2><p className="mt-1 font-semibold">{o.description}</p><p className="mt-2 text-xs font-extrabold uppercase">Until {fmtDate(o.expiresAt, t.lang)}</p>{o.example && <p className="mt-1 text-xs font-extrabold uppercase">Example only — not an approved Tea Town offer</p>}</div>
        </article>
      ))}
    </div>
  )
}
