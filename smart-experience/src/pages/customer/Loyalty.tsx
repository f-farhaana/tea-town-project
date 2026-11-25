import { Gift, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { QrImage } from '../../components/QrImage'
import { joinLoyalty, leaveLoyalty, myMemberId } from '../../lib/api'
import { stampBalance } from '../../lib/analytics'
import { useT } from '../../lib/i18n'
import { useCtx } from '../../lib/session'
import { useData } from '../../lib/store'
import { fmtDate } from '../../lib/util'

export default function Loyalty() {
  const t = useT(); const s = useData(); const { branch } = useCtx()
  const [id, setId] = useState(myMemberId()); const [name, setName] = useState(''); const [email, setEmail] = useState('')
  const [err, setErr] = useState(''); const [check, setCheck] = useState(false); const [busy, setBusy] = useState(false)
  useEffect(() => { // production: finish sign-up after the magic link brings the customer back
    const pending = localStorage.getItem('tt-pending-join')
    if (!s.demo && pending && !id) joinLoyalty(JSON.parse(pending)).then((r) => { if (r.ok && r.data !== 'check-email') { localStorage.removeItem('tt-pending-join'); setId(r.data.id) } })
  }, [s.demo, id])
  const me = s.members.find((m) => m.id === id)
  const L = s.settings.loyalty
  if (!s.settings.features.loyalty) return <p className="py-10 text-center text-cream/60">Loyalty is not available right now.</p>
  if (!me) return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-gold p-5 text-ink"><Gift size={32} /><h1 className="display mt-2 text-4xl">{t('joinTitle')}</h1>
        <p className="mt-2 font-semibold">Collect {L.stampsForReward} stamps and unlock: {L.rewardName}.</p>
        {!L.approved && <p className="mt-2 text-xs font-extrabold uppercase">Example reward — not yet approved by Tea Town</p>}
      </div>
      {check ? <div className="rounded-2xl bg-white/5 p-5 text-center"><Mail className="mx-auto text-orange" size={40} /><p className="mt-2 font-extrabold">Check your email</p><p className="text-sm text-cream/60">Tap the sign-in link we sent to {email} to open your card.</p></div> : (
        <form className="grid gap-3" onSubmit={async (e) => { e.preventDefault(); setErr(''); setBusy(true); const r = await joinLoyalty({ name, email, branchId: branch ?? undefined }); setBusy(false); if (!r.ok) return setErr(r.error); if (r.data === 'check-email') setCheck(true); else setId(r.data.id) }}>
          <label><span className="label">Name</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="given-name" /></label>
          <label><span className="label">Email</span><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} autoComplete="email" /></label>
          {err && <p className="rounded-xl bg-red-500/15 p-3 text-sm font-bold text-red-300">{err}</p>}
          <button disabled={busy} className="btn-primary py-4 text-lg">{t('join')}</button>
          <p className="text-xs text-cream/50">We only store your name, email and stamps. {s.demo ? 'Demo mode: no email is sent.' : 'You confirm your email with a one-time sign-in link.'}</p>
        </form>
      )}
    </div>
  )
  const bal = stampBalance(s, me.id); const target = L.stampsForReward; const filled = Math.min(bal, target)
  const history = s.stamps.filter((x) => x.memberId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-orange to-[#c93d0c] p-5 text-ink">
        <div className="flex items-start justify-between"><div><p className="text-xs font-extrabold uppercase tracking-widest opacity-70">Tea Town Rewards</p><p className="display mt-1 text-3xl">{me.name}</p></div><img src="/assets/brand/arabic-logo-black.png" alt="" className="h-12" /></div>
        <div className="mt-4 flex justify-center rounded-2xl bg-white p-3"><QrImage text={me.memberCode} size={190} /></div>
        <p className="mt-2 text-center font-mono text-lg font-extrabold tracking-[0.2em]">{me.memberCode}</p>
        <p className="text-center text-xs font-bold opacity-80">{t('showStaff')}</p>
      </div>
      <div className="rounded-2xl bg-white/[0.05] p-4">
        <div className="flex justify-between"><span className="font-extrabold">{t('stamps')}</span><span className="font-extrabold text-orange">{filled} / {target}</span></div>
        <div className="mt-3 flex gap-2">{Array.from({ length: target }, (_, i) => <span key={i} className={`grid h-11 flex-1 place-items-center rounded-xl text-lg ${i < filled ? 'bg-orange text-ink' : 'bg-white/10 text-white/20'}`}>☕</span>)}</div>
        <p className="mt-3 text-sm">{bal >= target ? <b className="text-gold">{t('rewardReady')} ({L.rewardName})</b> : `${target - bal} more for: ${L.rewardName}`}</p>
        {!L.approved && <p className="mt-1 text-xs text-cream/50">Example reward, pending Tea Town approval.</p>}
      </div>
      {history.length > 0 && <div className="rounded-2xl bg-white/[0.04] p-4 text-sm"><p className="label">History</p>{history.map((h) => <div key={h.id} className="flex justify-between py-1"><span>{h.kind === 'stamp' ? '+1 stamp' : `Reward redeemed (${h.stamps})`}</span><span className="text-cream/50">{fmtDate(h.createdAt, t.lang)}</span></div>)}</div>}
      <button onClick={async () => { if (confirm('Delete your loyalty card and personal details?')) { await leaveLoyalty(); setId(null) } }} className="w-full py-2 text-xs text-cream/40 underline">Delete my card and data</button>
    </div>
  )
}
