import { Camera, Plus, Search, Undo2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useBranchFilter } from '../../admin-app'
import { addStamp, findMember, redeemReward } from '../../lib/api'
import { lastVisit, stampBalance } from '../../lib/analytics'
import { can, useStaff } from '../../lib/auth'
import { useData } from '../../lib/store'
import type { BranchId } from '../../lib/types'
import { fmtDate, uid } from '../../lib/util'

function Scanner({ onCode, onClose }: { onCode: (c: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null); const [err, setErr] = useState('')
  useEffect(() => {
    let stop: (() => void) | undefined
    import('@zxing/browser').then(async ({ BrowserQRCodeReader }) => {
      try { const c = await new BrowserQRCodeReader().decodeFromVideoDevice(undefined, video.current!, (res) => { if (res) { onCode(res.getText()); c.stop() } }); stop = () => c.stop() }
      catch { setErr('Camera not available. Type the member code instead.') }
    })
    return () => stop?.()
  }, [onCode])
  return (
    <div className="panel space-y-2 p-3">
      <video ref={video} className="aspect-square w-full max-w-sm rounded-xl bg-black object-cover" muted playsInline />
      {err && <p className="text-sm text-red-400">{err}</p>}
      <button onClick={onClose} className="btn-ghost w-full">Close camera</button>
    </div>
  )
}

export default function Loyalty() {
  const s = useData(); const me = useStaff()!; const { options, label } = useBranchFilter()
  const staffBranches = options.filter((o): o is BranchId => o !== 'all')
  const [branch, setBranch] = useState<BranchId>(staffBranches[0])
  const [code, setCode] = useState(''); const [active, setActive] = useState<string | null>(null); const [scan, setScan] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [q, setQ] = useState('')
  const L = s.settings.loyalty; const m = active ? findMember(active) : undefined
  const bal = m ? stampBalance(s, m.id) : 0
  const lookup = (c: string) => { const x = c.trim().toUpperCase(); setMsg(null); if (findMember(x)) setActive(x); else setMsg({ ok: false, t: 'No member with that code' }) }
  const doStamp = async () => { const r = await addStamp(m!.memberCode, branch, uid()); setMsg(r.ok ? { ok: true, t: `Stamp added. Balance ${r.data.balance}.` } : { ok: false, t: r.error }) }
  const doRedeem = async () => { if (!confirm(`Redeem "${L.rewardName}" for ${m!.name}?`)) return; const r = await redeemReward(m!.memberCode, branch, uid()); setMsg(r.ok ? { ok: true, t: `Reward redeemed. Balance ${r.data.balance}.` } : { ok: false, t: r.error }) }
  const members = s.members.filter((x) => !x.email.endsWith('@invalid') && (!q || `${x.name} ${x.memberCode}`.toLowerCase().includes(q.toLowerCase())))
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
      <section className="space-y-3">
        <div className="panel space-y-3 p-4">
          <p className="text-lg font-extrabold">Verify a member</p>
          {staffBranches.length > 1 && <div className="flex gap-1">{staffBranches.map((b) => <button key={b} onClick={() => setBranch(b)} className={`chip ${branch === b ? 'chip-on' : ''}`}>{label(b)}</button>)}</div>}
          {!L.enabled && <p className="rounded-lg bg-gold/15 p-2 text-sm font-bold text-gold">Loyalty is switched off. The owner can enable it in Settings once the reward is approved.</p>}
          <button onClick={() => setScan(true)} className="btn-primary w-full py-4"><Camera />Scan member QR</button>
          <form onSubmit={(e) => { e.preventDefault(); lookup(code) }} className="flex gap-2"><input className="input" placeholder="or type code, e.g. TT123456" value={code} onChange={(e) => setCode(e.target.value)} /><button className="btn-dark px-3" aria-label="Find"><Search size={18} /></button></form>
          {scan && <Scanner onCode={(c) => { setScan(false); setCode(c); lookup(c) }} onClose={() => setScan(false)} />}
        </div>
        {m && (
          <div className="panel space-y-3 p-4">
            <div className="flex items-start justify-between"><div><p className="text-xl font-extrabold">{m.name}</p><p className="font-mono text-sm muted">{m.memberCode}</p></div><button onClick={() => setActive(null)} className="muted" aria-label="Clear"><Undo2 size={18} /></button></div>
            <div className="flex gap-1.5">{Array.from({ length: L.stampsForReward }, (_, i) => <span key={i} className={`h-9 flex-1 rounded-lg ${i < Math.min(bal, L.stampsForReward) ? 'bg-orange' : 'bg-white/10'}`} />)}</div>
            <p className="text-sm"><b>{bal}</b> stamps · last verified visit {lastVisit(s, m.id) ? fmtDate(lastVisit(s, m.id)!) : 'none yet'}</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={doStamp} disabled={!L.enabled} className="btn-primary"><Plus size={18} />Add stamp</button>
              <button onClick={doRedeem} disabled={!L.enabled || bal < L.stampsForReward} className="btn-dark">Redeem reward</button>
            </div>
            <p className="text-xs muted">Add one stamp per paid visit. Each tap is recorded with your name and time.</p>
          </div>
        )}
        {msg && <p className={`rounded-lg p-3 text-sm font-bold ${msg.ok ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`} role="status">{msg.t}</p>}
      </section>
      {can(me, 'owner') && (
        <section className="panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 p-4"><p className="text-lg font-extrabold">Members ({members.length})</p><input className="input max-w-[220px] py-2" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 text-start text-xs uppercase muted" style={{ background: 'var(--panel)' }}><tr><th className="p-3 text-start">Member</th><th className="p-3 text-start">Stamps</th><th className="p-3 text-start">Last visit</th><th className="p-3 text-start">Reward</th></tr></thead>
              <tbody>
                {members.map((x) => { const b = stampBalance(s, x.id); const lv = lastVisit(s, x.id); return (
                  <tr key={x.id} onClick={() => setActive(x.memberCode)} className="cursor-pointer border-t hover:bg-white/5" style={{ borderColor: 'var(--line)' }}>
                    <td className="p-3"><b>{x.name}</b><div className="font-mono text-xs muted">{x.memberCode}</div></td><td className="p-3 tabular-nums">{b}</td><td className="p-3">{lv ? fmtDate(lv) : '—'}</td><td className="p-3">{b >= L.stampsForReward ? <span className="rounded bg-gold px-2 py-0.5 text-xs font-extrabold text-ink">Available</span> : `${L.stampsForReward - b} to go`}</td>
                  </tr>) })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
