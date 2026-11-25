import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { business } from '../lib/config'
import { useOnline } from '../lib/session'
import { useT } from '../lib/i18n'

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const h = size === 'lg' ? 'h-16' : size === 'sm' ? 'h-8' : 'h-11'
  return (
    <span className="inline-flex items-center gap-2.5">
      <img src={business.logoWhite} alt="" className={`${h} w-auto`} />
      <img src={business.wordmark} alt={business.name} className={size === 'lg' ? 'h-9 w-auto' : 'h-6 w-auto'} />
    </span>
  )
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode }) {
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose} role="dialog" aria-modal="true">
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/10 bg-[#141414] p-5 text-cream sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-lg font-extrabold">{title}</div>
          <button onClick={onClose} className="rounded-full bg-white/10 p-2" aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Stars({ value, onChange, size = 36 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <div className="flex gap-1.5" role={onChange ? 'radiogroup' : undefined} aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onChange} onClick={() => onChange?.(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`} aria-checked={value === n} role={onChange ? 'radio' : undefined}
          className={`transition ${n <= value ? 'text-orange' : 'text-white/20'} ${onChange ? 'active:scale-90' : ''}`} style={{ fontSize: size, lineHeight: 1 }}>★</button>
      ))}
    </div>
  )
}

export function ConnectionPill() {
  const on = useOnline(); const t = useT()
  if (on) return null
  return <div className="sticky top-0 z-40 bg-gold px-4 py-2 text-center text-sm font-extrabold text-ink">{t('offline')}</div>
}

export function DemoBadge() {
  return <span className="rounded-md bg-gold px-2 py-0.5 text-[11px] font-extrabold tracking-widest text-ink" title="Fictional demonstration data">DEMO DATA</span>
}

export function Stat({ label, value, sub, hint }: { label: string; value: ReactNode; sub?: ReactNode; hint?: string }) {
  return (
    <div className="panel p-4" title={hint}>
      <div className="text-xs font-bold uppercase tracking-wider muted">{label}</div>
      <div className="mt-1.5 text-2xl font-extrabold tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-xs muted">{sub}</div>}
    </div>
  )
}

export const statusTone: Record<string, string> = {
  received: 'bg-white/10 text-cream', notified: 'bg-orange text-ink', submitted: 'bg-orange text-ink', open: 'bg-red-500 text-white',
  acknowledged: 'bg-gold text-ink', accepted: 'bg-gold text-ink', assigned: 'bg-gold text-ink', on_the_way: 'bg-sky-400 text-ink', preparing: 'bg-sky-400 text-ink',
  ready: 'bg-emerald-400 text-ink', completed: 'bg-emerald-600/80 text-white', delivered: 'bg-emerald-600/80 text-white', resolved: 'bg-emerald-600/80 text-white', cancelled: 'bg-white/10 text-white/60',
}
export function StatusBadge({ s, label }: { s: string; label?: string }) {
  return <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-extrabold ${statusTone[s] ?? 'bg-white/10'}`}>{label ?? s.replace(/_/g, ' ')}</span>
}
export function Empty({ children }: { children: ReactNode }) { return <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm muted">{children}</div> }
export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2">
      <span className="text-sm font-semibold">{label}</span>
      <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? 'bg-orange' : 'bg-white/20'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-6' : 'left-1'}`} />
      </button>
    </label>
  )
}
