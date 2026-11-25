import { CheckCircle2, Loader2, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cancelRequest, createRequest } from '../lib/api'
import { useT } from '../lib/i18n'
import { ls, useCtx, useOnline } from '../lib/session'
import { useData } from '../lib/store'
import type { RequestType } from '../lib/types'
import { Sheet } from './ui'

/** Call staff / Ready to pay. Confirms only after the server accepted it; never queues offline. */
export function RequestSheet({ type, onClose, pickBranch }: { type: RequestType | null; onClose: () => void; pickBranch: () => void }) {
  const t = useT(); const { branch } = useCtx(); const online = useOnline(); const s = useData()
  const saved = ls.get<{ c?: string; m?: string }>('tt-car', {})
  const [colour, setColour] = useState(saved.c ?? ''); const [model, setModel] = useState(saved.m ?? ''); const [zone, setZone] = useState('')
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [id, setId] = useState<string | null>(null)
  useEffect(() => { if (type) { setErr(''); setId(null) } }, [type])
  const req = id ? s.requests.find((r) => r.id === id) : null
  // In production mode, refresh this phone's request status while the sheet is open.
  useEffect(() => {
    if (!id || s.demo) return
    const iv = setInterval(() => import('../lib/supabase').then((m) => import('../lib/api').then((a) => m.loadSnapshot('customer', a.deviceToken()))), 5000)
    return () => clearInterval(iv)
  }, [id, s.demo])
  const send = async () => {
    setErr('')
    if (!branch) return pickBranch()
    if (!online) return setErr(t('notDelivered'))
    setBusy(true); ls.set('tt-car', { c: colour, m: model })
    const r = await createRequest({ branchId: branch, type: type!, vehicleColour: colour, vehicleModel: model, zoneOrRef: zone || undefined })
    setBusy(false)
    if (!r.ok) return setErr(r.error === 'offline' ? t('notDelivered') : r.error)
    setId(r.data.id)
  }
  const title = type === 'ready_to_pay' ? t('readyPay') : t('callStaff')
  return (
    <Sheet open={!!type} onClose={onClose} title={title}>
      {req ? (
        <div className="space-y-4 text-center" aria-live="polite">
          {req.status === 'new' && <><CheckCircle2 className="mx-auto text-emerald-400" size={56} /><p className="text-xl font-extrabold">{t('sent')}</p></>}
          {req.status === 'acknowledged' && <><span className="mx-auto block h-14 w-14 animate-pulse rounded-full bg-orange" /><p className="text-xl font-extrabold">{t('acked')}</p></>}
          {req.status === 'completed' && <><CheckCircle2 className="mx-auto text-emerald-400" size={56} /><p className="text-xl font-extrabold">{t('done')}</p></>}
          {req.status === 'cancelled' && <p className="text-xl font-extrabold">Cancelled</p>}
          <p className="text-sm text-cream/60">{req.vehicleColour} {req.vehicleModel}{req.zoneOrRef ? ` · ${req.zoneOrRef}` : ''} · Ref {req.ref}</p>
          {req.status === 'new' && <button onClick={() => cancelRequest(req.id)} className="btn-ghost w-full">{t('cancelReq')}</button>}
          {s.demo && <p className="text-xs text-cream/40">Demo mode: staff see this on the dashboard in another tab of this browser.</p>}
        </div>
      ) : (
        <div className="grid gap-3">
          <label><span className="label">{t('vehicleColour')}</span><input className="input" value={colour} onChange={(e) => setColour(e.target.value)} maxLength={20} placeholder="White" autoComplete="off" /></label>
          <label><span className="label">{t('vehicleModel')}</span><input className="input" value={model} onChange={(e) => setModel(e.target.value)} maxLength={40} placeholder="Patrol" autoComplete="off" /></label>
          <label><span className="label">{t('zoneRef')}</span><input className="input" value={zone} onChange={(e) => setZone(e.target.value)} maxLength={20} /></label>
          {!online && <p className="flex items-start gap-2 rounded-xl bg-gold/15 p-3 text-sm font-bold text-gold"><WifiOff size={18} className="shrink-0" />{t('notDelivered')}</p>}
          {err && online && <p className="rounded-xl bg-red-500/15 p-3 text-sm font-bold text-red-300" role="alert">{err}</p>}
          <button onClick={send} disabled={busy || !online} className="btn-primary mt-1 py-4 text-lg">{busy ? <><Loader2 className="animate-spin" />{t('sending')}</> : t('send')}</button>
        </div>
      )}
    </Sheet>
  )
}
