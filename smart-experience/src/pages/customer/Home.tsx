import { CreditCard, Gift, Globe, Hand, MessageCircle, MessageSquareHeart, Phone, Star, Tag, UtensilsCrossed, Wifi } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { OfflineStatus } from '../../components/OfflineStatus'
import { RequestSheet } from '../../components/RequestSheet'
import { liveOffers, logEvent } from '../../lib/api'
import { branchById, business, waLink } from '../../lib/config'
import { useT } from '../../lib/i18n'
import { useCtx } from '../../lib/session'
import { useData } from '../../lib/store'
import type { RequestType } from '../../lib/types'

const tile = 'flex min-h-[88px] flex-col justify-between rounded-2xl bg-white/[0.06] p-4 text-start font-extrabold active:bg-white/10'
export default function Home({ pickBranch }: { pickBranch: () => void }) {
  const t = useT(); const { branch } = useCtx(); const s = useData(); const b = branchById(branch)
  const [req, setReq] = useState<RequestType | null>(null)
  const f = s.settings.features; const cfg = branch ? s.settings.branches[branch] : null
  const offers = liveOffers(s.offers, branch)
  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-3xl bg-charcoal">
        <img src={business.heroImage} alt="Tea Town storefront at night" className="h-56 w-full object-cover" fetchPriority="high" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <button onClick={pickBranch} className="rounded-full bg-orange px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.15em] text-ink">{b ? b.name : t('chooseBranch')}</button>
          <h1 className="display mt-2 text-[2.5rem]">{t('craving')}</h1>
        </div>
      </section>
      <Link to="/menu" onClick={() => logEvent('menu_view', branch)} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-orange py-5 text-xl font-extrabold text-ink shadow-lg shadow-orange/20">
        <UtensilsCrossed size={26} />{t('viewMenu')}
      </Link>
      <section className="grid grid-cols-2 gap-3">
        {f.callStaff && <button onClick={() => setReq('call_staff')} className={tile}><Hand className="text-orange" size={26} />{t('callStaff')}</button>}
        {f.readyToPay && <button onClick={() => setReq('ready_to_pay')} className={tile}><CreditCard className="text-orange" size={26} />{t('readyPay')}</button>}
        {cfg && <a href={cfg.reviewUrl} target="_blank" rel="noopener" onClick={() => logEvent('review_click', branch)} className={tile}><Star className="text-gold" size={26} />{t('googleReview')}</a>}
        {f.feedback && <Link to="/feedback" className={tile}><MessageSquareHeart className="text-orange" size={26} />{t('feedback')}</Link>}
        {f.loyalty && <Link to="/loyalty" className={tile}><Gift className="text-orange" size={26} />{t('loyaltyCard')}</Link>}
        {f.offers && <Link to="/offers" className={tile}><Tag className="text-orange" size={26} />{t('offers')}{offers.length > 0 && <span className="w-fit rounded bg-orange px-1.5 text-xs text-ink">{offers.length} new</span>}</Link>}
        {f.wifi && <Link to="/wifi" className={tile}><Wifi className="text-orange" size={26} />{t('wifi')}</Link>}
        {f.whatsapp && cfg && <a href={waLink(cfg.whatsapp)} target="_blank" rel="noopener" onClick={() => logEvent('whatsapp_click', branch)} className={tile}><MessageCircle className="text-wa" size={26} />{t('whatsapp')}</a>}
      </section>
      {cfg && (
        <section className="rounded-2xl bg-white/[0.04] p-4">
          <p className="font-extrabold">{t('reviewTitle')}</p>
          <a href={cfg.reviewUrl} target="_blank" rel="noopener" onClick={() => logEvent('review_click', branch)} className="btn mt-3 w-full bg-cream text-ink"><Star size={18} className="text-gold" />{t('googleReview')}</a>
        </section>
      )}
      <section className="grid grid-cols-2 gap-3 text-sm">
        {cfg ? <a href={`tel:${cfg.phone}`} className="btn-dark"><Phone size={18} />{t('call')}</a> : <button onClick={pickBranch} className="btn-dark"><Phone size={18} />{t('call')}</button>}
        <a href={business.website} target="_blank" rel="noopener" onClick={() => logEvent('website_click', branch)} className="btn-dark"><Globe size={18} />{t('website')}</a>
      </section>
      <OfflineStatus />
      <p className="pb-2 text-center text-[11px] text-cream/40">Tea Town Smart Experience · Powered by {business.poweredBy}</p>
      <RequestSheet type={req} onClose={() => setReq(null)} pickBranch={() => { setReq(null); pickBranch() }} />
    </div>
  )
}
