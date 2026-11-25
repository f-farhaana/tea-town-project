import { CheckCircle2, Star } from 'lucide-react'
import { useRef, useState } from 'react'
import { Stars } from '../../components/ui'
import { logEvent, newClientId, submitFeedback } from '../../lib/api'
import { TOPICS } from '../../lib/analytics'
import { useT } from '../../lib/i18n'
import { useCtx, useOnline } from '../../lib/session'
import { useData } from '../../lib/store'
import type { FeedbackTopic } from '../../lib/types'

export default function Feedback({ pickBranch }: { pickBranch: () => void }) {
  const t = useT(); const { branch } = useCtx(); const online = useOnline(); const s = useData()
  const [rating, setRating] = useState(0); const [aspects, setAspects] = useState<Partial<Record<FeedbackTopic, number>>>({})
  const [comment, setComment] = useState(''); const [hp, setHp] = useState('')
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [done, setDone] = useState(false)
  const clientId = useRef(newClientId()); const started = useRef(Date.now())
  const send = async () => {
    setErr(''); if (!branch) return pickBranch()
    if (!rating) return setErr('Choose an overall rating')
    if (!online) return setErr(t('notDelivered').replace('request', 'feedback'))
    setBusy(true)
    const r = await submitFeedback({ clientId: clientId.current, branchId: branch, rating, aspects, comment, website: hp || undefined, startedAt: started.current })
    setBusy(false)
    if (!r.ok) return setErr(r.error === 'offline' ? t('notDelivered') : r.error)
    setDone(true)
  }
  const review = branch ? s.settings.branches[branch].reviewUrl : null
  if (done) return (
    <div className="space-y-5 py-8 text-center">
      <CheckCircle2 className="mx-auto text-emerald-400" size={64} />
      <p className="text-xl font-extrabold">{t('fbThanks')}</p>
      {review && <div className="rounded-2xl bg-white/[0.05] p-4"><p className="font-bold">{t('reviewTitle')}</p><a href={review} target="_blank" rel="noopener" onClick={() => logEvent('review_click', branch)} className="btn mt-3 w-full bg-cream text-ink"><Star size={18} className="text-gold" />{t('googleReview')}</a></div>}
    </div>
  )
  return (
    <div className="space-y-5">
      <div><h1 className="display text-4xl">{t('fbTitle')}</h1><p className="mt-1 text-sm text-cream/60">{t('fbSub')}</p></div>
      <div className="rounded-2xl bg-white/[0.05] p-4"><p className="label">{t('overall')}</p><Stars value={rating} onChange={setRating} size={42} /></div>
      <div className="grid gap-3 rounded-2xl bg-white/[0.05] p-4">
        {TOPICS.map((k) => (
          <div key={k} className="flex items-center justify-between gap-3"><span className="text-sm font-bold">{t(k)}</span><Stars value={aspects[k] ?? 0} onChange={(n) => setAspects((a) => ({ ...a, [k]: n }))} size={26} /></div>
        ))}
      </div>
      <label className="block"><span className="label">{t('comment')}</span><textarea className="input" rows={3} maxLength={600} value={comment} onChange={(e) => setComment(e.target.value)} /></label>
      <input tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={hp} onChange={(e) => setHp(e.target.value)} name="website" />
      {err && <p className="rounded-xl bg-red-500/15 p-3 text-sm font-bold text-red-300" role="alert">{err}</p>}
      <button onClick={send} disabled={busy} className="btn-primary w-full py-4 text-lg">{t('submitFb')}</button>
      <p className="text-center text-xs text-cream/40">No name or phone number needed. Google reviews stay open to everyone.</p>
    </div>
  )
}
