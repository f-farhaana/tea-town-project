import { useEffect, useState } from 'react'
import { X, Star } from 'lucide-react'
import { links, site } from '../config/site'
import { useBranch } from '../lib/branch'
import { GoogleG } from './Icons'
import { BranchPicker } from './BranchPicker'

const KEY = 'tt-review-dismissed'
const ss = { get: () => { try { return sessionStorage.getItem(KEY) } catch { return null } }, set: () => { try { sessionStorage.setItem(KEY, '1') } catch { /* ignore */ } } }

/** Honest, unconditional Google review invitation. No incentives, no gating, no preselected rating. */
export function ReviewPopup() {
  const { branch, setBranch } = useBranch()
  const [state, setState] = useState<'hidden' | 'open' | 'mini'>('hidden')
  const [choosing, setChoosing] = useState(false)

  useEffect(() => {
    if (ss.get()) { setState('mini'); return }
    const t = setTimeout(() => setState('open'), site.reviewPopupDelayMs)
    return () => clearTimeout(t)
  }, [])

  const dismiss = () => { ss.set(); setState('mini'); setChoosing(false) }
  const go = (b = branch) => { if (!b) { setChoosing(true); return } window.open(links.review(b), '_blank', 'noopener'); dismiss() }

  if (state === 'hidden') return null
  if (state === 'mini')
    return (
      <button type="button" onClick={() => setState('open')} aria-label="Leave a Google review" className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-cream shadow-lg shadow-black/40 transition hover:scale-105 md:bottom-6 md:right-6">
        <GoogleG className="h-6 w-6" />
      </button>
    )
  return (
    <aside role="dialog" aria-labelledby="review-title" className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 w-[min(22rem,calc(100vw-6rem))] animate-[pop_.5s_cubic-bezier(.2,.8,.2,1)] md:bottom-6 md:right-6">
      <div className="relative overflow-hidden bg-orange p-5 text-ink shadow-[0_24px_60px_-12px_rgba(0,0,0,.85)]">
        <img src="/assets/brand/arabic-logo-black.png" alt="" className="review-float pointer-events-none absolute -right-6 -top-4 w-32 opacity-10" />
        <button type="button" onClick={dismiss} aria-label="Close review invitation" className="absolute right-2 top-2 grid h-9 w-9 place-items-center hover:bg-ink hover:text-cream"><X className="h-5 w-5" /></button>
        <div className="flex items-center gap-1 text-ink" aria-hidden>{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-4 w-4" strokeWidth={2.4} />)}</div>
        <p id="review-title" className="display mt-2 text-4xl">Loved our food?</p>
        <p className="mt-2 text-sm font-semibold leading-snug">Visited Tea Town? Leave us a quick, honest review. We&rsquo;d love to hear about your experience.</p>
        {choosing ? (
          <div className="mt-4"><BranchPicker dark={false} label="Which branch did you visit?" onPick={(b) => { setBranch(b); go(b) }} /></div>
        ) : (
          <button type="button" onClick={() => go()} className="btn-ink mt-4 w-full !justify-start !normal-case !tracking-normal"><span className="grid h-7 w-7 place-items-center rounded-full bg-cream"><GoogleG className="h-4 w-4" /></span>Leave a Google Review{branch && <span className="ml-auto text-xs opacity-60">{branch.shortName.split(' ')[0]}</span>}</button>
        )}
      </div>
    </aside>
  )
}
