import { AlertTriangle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useBranchFilter } from '../../admin-app'
import { Empty, Stars } from '../../components/ui'
import { setFeedbackStatus } from '../../lib/api'
import { complaintTopics, labelTopic, TOPICS } from '../../lib/analytics'
import { branchById } from '../../lib/config'
import { useData } from '../../lib/store'
import { fmtDate, fmtTime } from '../../lib/util'

export default function FeedbackTab() {
  const s = useData(); const { branch, setBranch, options, label } = useBranchFilter()
  const [f, setF] = useState<'open' | 'urgent' | 'all'>('open')
  const list = s.feedback.filter((x) => branch === 'all' || x.branchId === branch).sort((a, b) => Number(b.urgent && b.status !== 'resolved') - Number(a.urgent && a.status !== 'resolved') || b.createdAt.localeCompare(a.createdAt))
  const shown = list.filter((x) => (f === 'all' ? true : f === 'urgent' ? x.urgent && x.status !== 'resolved' : x.status === 'new')).slice(0, 100)
  const last30 = list.filter((x) => Date.now() - new Date(x.createdAt).getTime() < 30 * 86400000)
  const counts = useMemo(() => { const c = Object.fromEntries(TOPICS.map((t) => [t, 0])) as Record<string, number>; last30.forEach((x) => complaintTopics(x).forEach((t) => c[t]++)); return Object.entries(c).sort((a, b) => b[1] - a[1]) }, [last30])
  const max = Math.max(1, ...counts.map((c) => c[1]))
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">{options.map((o) => <button key={o} onClick={() => setBranch(o)} className={`chip ${branch === o ? 'chip-on' : ''}`}>{label(o)}</button>)}</div>
        <div className="flex gap-1">{([['open', 'New'], ['urgent', 'Urgent'], ['all', 'All']] as const).map(([v, l]) => <button key={v} onClick={() => setF(v)} className={`chip ${f === v ? 'chip-on' : ''}`}>{l}</button>)}</div>
      </div>
      <div className="panel p-4">
        <p className="label">Recurring complaint categories (last 30 days, {last30.length} submissions)</p>
        <div className="grid gap-2">{counts.map(([t, n]) => <div key={t} className="flex items-center gap-3 text-sm"><span className="w-36 shrink-0 font-bold">{labelTopic(t as never)}</span><div className="h-3 flex-1 rounded-full" style={{ background: 'var(--panel2)' }}><div className="h-3 rounded-full bg-orange" style={{ width: `${(n / max) * 100}%` }} /></div><span className="w-8 text-end tabular-nums">{n}</span></div>)}</div>
        <p className="mt-2 text-xs muted">Counted from low aspect scores and keywords in 3★-or-lower comments (automatic).</p>
      </div>
      {!shown.length ? <Empty>No feedback here.</Empty> : (
        <div className="grid gap-3 md:grid-cols-2">
          {shown.map((x) => (
            <article key={x.id} className={`panel p-4 ${x.urgent && x.status !== 'resolved' ? 'border-red-500' : ''}`}>
              <div className="flex items-center justify-between"><Stars value={x.rating} size={20} />{x.urgent && x.status !== 'resolved' && <span className="flex items-center gap-1 rounded bg-red-500 px-2 py-0.5 text-xs font-extrabold text-white"><AlertTriangle size={14} />URGENT</span>}</div>
              {x.comment && <p className="mt-2 font-semibold">“{x.comment}”</p>}
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs">{Object.entries(x.aspects).map(([k, v]) => <span key={k} className={`rounded px-2 py-0.5 ${v! <= 2 ? 'bg-red-500/20 text-red-400' : ''}`} style={v! > 2 ? { background: 'var(--panel2)' } : undefined}>{labelTopic(k as never)} {v}★</span>)}</div>
              <p className="mt-2 text-xs muted">{branchById(x.branchId)?.shortName.split(' — ')[0]} · {fmtDate(x.createdAt)} {fmtTime(x.createdAt)} · {x.status}</p>
              {x.status !== 'resolved' && <div className="mt-3 flex gap-2">{x.status === 'new' && <button onClick={() => setFeedbackStatus(x.id, 'reviewed')} className="btn-dark py-2 text-sm">Mark reviewed</button>}<button onClick={() => setFeedbackStatus(x.id, 'resolved')} className="btn-primary py-2 text-sm">Resolved</button></div>}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
