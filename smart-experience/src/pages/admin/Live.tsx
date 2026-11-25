import { Check, CreditCard, Hand, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useBranchFilter } from '../../admin-app'
import { Empty, StatusBadge } from '../../components/ui'
import { setRequestStatus } from '../../lib/api'
import { branchById } from '../../lib/config'
import { ls } from '../../lib/session'
import { useData } from '../../lib/store'
import { fmtTime } from '../../lib/util'

function beep() { try { const a = new AudioContext(); const o = a.createOscillator(); const g = a.createGain(); o.frequency.value = 880; o.connect(g); g.connect(a.destination); g.gain.setValueAtTime(0.25, a.currentTime); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.5); o.start(); o.stop(a.currentTime + 0.5) } catch { /* no audio */ } }
const ago = (iso: string, now: number) => { const m = Math.floor((now - new Date(iso).getTime()) / 60000); return m < 1 ? 'just now' : `${m} min ago` }

export default function Live() {
  const s = useData(); const { branch, setBranch, options, label } = useBranchFilter()
  const [sound, setSound] = useState(ls.get('tt-sound', false)); const [now, setNow] = useState(Date.now()); const [err, setErr] = useState('')
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(i) }, [])
  const list = s.requests.filter((r) => branch === 'all' || r.branchId === branch)
  const active = list.filter((r) => r.status === 'new' || r.status === 'acknowledged').sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const recent = list.filter((r) => r.status === 'completed').sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)
  const seen = useRef(new Set(active.map((r) => r.id)))
  useEffect(() => { const fresh = active.filter((r) => r.status === 'new' && !seen.current.has(r.id)); fresh.forEach((r) => seen.current.add(r.id)); if (fresh.length && sound) beep() }, [active, sound])
  const act = async (id: string, st: 'acknowledged' | 'completed') => { const r = await setRequestStatus(id, st); setErr(r.ok ? '' : r.error) }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">{options.map((o) => <button key={o} onClick={() => setBranch(o)} className={`chip ${branch === o ? 'chip-on' : ''}`}>{label(o)}</button>)}</div>
        <button onClick={() => { setSound(!sound); ls.set('tt-sound', !sound); if (!sound) beep() }} className="btn-ghost py-2 text-sm">{sound ? <Volume2 size={18} /> : <VolumeX size={18} />}Sound {sound ? 'on' : 'off'}</button>
      </div>
      {s.demo && <p className="text-xs muted">Demo: requests sent from the customer page in another tab of this browser appear here instantly. Cross-device delivery needs the Supabase backend.</p>}
      {err && <p className="text-sm font-bold text-red-400">{err}</p>}
      {!active.length ? <Empty>No active requests. New ones appear here automatically.</Empty> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((r) => (
            <article key={r.id} className={`panel p-4 ${r.status === 'new' ? 'ping border-orange' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-lg font-extrabold">{r.type === 'ready_to_pay' ? <CreditCard className="text-orange" /> : <Hand className="text-orange" />}{r.type === 'ready_to_pay' ? 'Ready to pay' : 'Call staff'}</span>
                <StatusBadge s={r.status === 'new' ? 'notified' : r.status} label={r.status === 'new' ? 'NEW' : 'Acknowledged'} />
              </div>
              <p className="mt-3 text-2xl font-extrabold">{r.vehicleColour} {r.vehicleModel}</p>
              {r.zoneOrRef && <p className="font-bold text-orange">{r.zoneOrRef}</p>}
              <p className="mt-1 text-sm muted">{branchById(r.branchId)?.shortName.split(' — ')[0]} · {fmtTime(r.createdAt)} · {ago(r.createdAt, now)} · {r.ref}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button disabled={r.status !== 'new'} onClick={() => act(r.id, 'acknowledged')} className="btn-dark">Acknowledge</button>
                <button onClick={() => act(r.id, 'completed')} className="btn-primary"><Check size={18} />Complete</button>
              </div>
            </article>
          ))}
        </div>
      )}
      {recent.length > 0 && (
        <div className="panel p-4"><p className="label">Recently completed</p>
          {recent.map((r) => <div key={r.id} className="flex justify-between border-t py-2 text-sm" style={{ borderColor: 'var(--line)' }}><span>{r.type === 'ready_to_pay' ? 'Pay' : 'Staff'} · {r.vehicleColour} {r.vehicleModel}</span><span className="muted">{fmtTime(r.createdAt)}{r.ackAt && ` · ${Math.round((new Date(r.ackAt).getTime() - new Date(r.createdAt).getTime()) / 60000)} min response`}</span></div>)}
        </div>
      )}
    </div>
  )
}
