import { Lightbulb } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useBranchFilter } from '../../admin-app'
import { Stat } from '../../components/ui'
import { daily, fmtHour, hourly, insights, overview, presetRange } from '../../lib/analytics'
import { useData } from '../../lib/store'
import { menu } from '../../shared/menu'

function Bars({ data, label }: { data: { k: string; n: number }[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.n))
  return (
    <div className="panel p-4">
      <p className="label">{label}</p>
      <div className="flex h-36 items-end gap-[3px]" role="img" aria-label={label}>
        {data.map((d) => <div key={d.k} className="group relative flex-1 rounded-t bg-orange/80 hover:bg-orange" style={{ height: `${(d.n / max) * 100}%`, minHeight: d.n ? 2 : 0 }} title={`${d.k}: ${d.n}`} />)}
      </div>
      <div className="mt-1 flex justify-between text-[10px] muted"><span>{data[0]?.k}</span><span>{data.at(-1)?.k}</span></div>
    </div>
  )
}

export default function Overview() {
  const s = useData(); const { branch, setBranch, options, label } = useBranchFilter()
  const [p, setP] = useState<'today' | '7d' | '30d'>('7d')
  const range = useMemo(() => presetRange(p), [p])
  const k = useMemo(() => overview(s, branch, range), [s, branch, range])
  const tips = useMemo(() => insights(s, branch, range, (id) => menu.find((m) => m.id === id)?.name ?? id), [s, branch, range])
  const scans = s.events.filter((e) => e.kind === 'scan' && (branch === 'all' || e.branchId === branch) && new Date(e.at) >= range.from)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">{options.map((o) => <button key={o} onClick={() => setBranch(o)} className={`chip ${branch === o ? 'chip-on' : ''}`}>{label(o)}</button>)}</div>
        <div className="flex gap-1">{([['today', 'Today'], ['7d', '7 days'], ['30d', '30 days']] as const).map(([v, l]) => <button key={v} onClick={() => setP(v)} className={`chip ${p === v ? 'chip-on' : ''}`}>{l}</button>)}</div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="QR/NFC visits" value={k.visits} sub={`~${k.uniqueVisitors} unique phones (estimate)`} />
        <Stat label="Returning members" value={k.returningMembers} sub="Stamped before and during this period" />
        <Stat label="Menu views" value={k.menuViews} sub="Interest, not purchases" />
        <Stat label="Google review clicks" value={k.reviewClicks} sub="Clicks, not posted reviews" />
        <Stat label="Feedback rating" value={k.avgRating != null ? `${k.avgRating}★` : '—'} sub={`${k.feedbackCount} submissions · ${k.urgentOpen} urgent open`} />
        <Stat label="Loyalty sign-ups" value={k.registrations} sub={`${k.stampsAdded} stamps added`} />
        <Stat label="Rewards redeemed" value={k.redeemed} />
        <Stat label="Avg staff response" value={k.avgResponse != null ? `${k.avgResponse} min` : '—'} sub={`${k.requests} requests · ${k.ackCount} acknowledged`} />
      </div>
      <div className="panel p-4">
        <p className="mb-3 flex items-center gap-2 text-lg font-extrabold"><Lightbulb className="text-gold" />Insights</p>
        {!tips.length ? <p className="text-sm muted">Not enough recorded activity yet for reliable insights in this period.</p> : (
          <ul className="grid gap-3 md:grid-cols-2">
            {tips.map((t, i) => <li key={i} className="rounded-xl p-3" style={{ background: 'var(--panel2)' }}><p className="font-bold">{t.text}</p><p className="mt-1 text-sm text-orange">→ {t.action}</p><p className="mt-1 text-xs muted">Based on: {t.basis}</p></li>)}
          </ul>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Bars label="QR/NFC visits per day" data={daily(scans, range).map((d) => ({ k: d.day, n: d.n }))} />
        <Bars label="QR/NFC visits by hour" data={hourly(scans).map((n, h) => ({ k: fmtHour(h), n }))} />
      </div>
      {s.demo && <p className="text-xs muted">All figures above are fictional DEMO DATA.</p>}
    </div>
  )
}
