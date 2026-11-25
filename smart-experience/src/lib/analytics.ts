/** Rule-based insights from recorded activity only. Menu views ≠ purchases; QR visits ≠ sales. */
import type { AppEvent, BranchId, DataState, Feedback, FeedbackTopic } from './types'

const URGENT = ['hair', 'sick', 'raw', 'poison', 'insect', 'cockroach', 'manager', 'refund', 'rude', 'مدير', 'تسمم', 'حشرة', 'شعرة', 'نيء']
const KEYWORDS: Record<FeedbackTopic, string[]> = {
  waiting: ['wait', 'slow', 'late', 'long time', 'minutes', 'انتظار', 'انتظرت', 'تأخير', 'بطيء'],
  staff: ['staff', 'rude', 'service', 'موظف', 'تعامل', 'خدمة'],
  food: ['cold', 'burnt', 'raw', 'stale', 'oily', 'hair', 'بارد', 'محروق'],
  taste: ['taste', 'tasteless', 'salty', 'bland', 'طعم', 'مالح'],
  value: ['price', 'expensive', 'value', 'غالي', 'سعر'],
}
export const TOPICS: FeedbackTopic[] = ['food', 'taste', 'waiting', 'staff', 'value']

export function isUrgent(rating: number, aspects: Feedback['aspects'], comment: string) {
  const t = comment.toLowerCase()
  return rating <= 1 || (rating <= 2 && (Object.values(aspects).some((v) => v === 1) || URGENT.some((w) => t.includes(w))))
}
/** Complaint categories: aspects scored 1–2, plus keyword matches in negative (≤3★) comments. */
export function complaintTopics(f: Feedback): FeedbackTopic[] {
  const out = new Set<FeedbackTopic>()
  for (const k of TOPICS) if ((f.aspects[k] ?? 5) <= 2) out.add(k)
  if (f.rating <= 3) { const t = f.comment.toLowerCase(); for (const k of TOPICS) if (KEYWORDS[k].some((w) => t.includes(w))) out.add(k) }
  return [...out]
}

export type Range = { from: Date; to: Date }
export const presetRange = (p: 'today' | '7d' | '30d', ref = new Date()): Range => {
  const sod = new Date(ref); sod.setHours(0, 0, 0, 0)
  return { from: p === 'today' ? sod : new Date(sod.getTime() - (p === '7d' ? 6 : 29) * 86400000), to: ref }
}
const within = (branch: BranchId | 'all', r: Range) => (x: { branchId?: BranchId; at?: string; createdAt?: string }) => {
  const t = new Date(x.at ?? x.createdAt!).getTime()
  return (branch === 'all' || x.branchId === branch) && t >= r.from.getTime() && t <= r.to.getTime()
}
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
const r1 = (n: number | null) => (n == null ? null : Math.round(n * 10) / 10)
const minsBetween = (a: string, b: string) => (new Date(b).getTime() - new Date(a).getTime()) / 60000

export const stampBalance = (s: DataState, memberId: string) => s.stamps.filter((x) => x.memberId === memberId).reduce((a, x) => a + x.stamps, 0)
export const lastVisit = (s: DataState, memberId: string) => s.stamps.filter((x) => x.memberId === memberId && x.kind === 'stamp').map((x) => x.createdAt).sort().at(-1)

export function overview(s: DataState, branch: BranchId | 'all', range: Range) {
  const f = within(branch, range)
  const ev = s.events.filter(f); const fb = s.feedback.filter(f); const req = s.requests.filter(f)
  const tx = s.stamps.filter(f)
  const scans = ev.filter((e) => e.kind === 'scan')
  const ack = req.filter((r) => r.ackAt).map((r) => minsBetween(r.createdAt, r.ackAt!))
  // Returning registered customers = members with a verified stamp in range AND one before it.
  const inRange = new Set(tx.filter((t) => t.kind === 'stamp').map((t) => t.memberId))
  const before = new Set(s.stamps.filter((t) => t.kind === 'stamp' && new Date(t.createdAt) < range.from && (branch === 'all' || t.branchId === branch)).map((t) => t.memberId))
  return {
    visits: scans.length, uniqueVisitors: new Set(scans.map((e) => e.anonId)).size,
    returningMembers: [...inRange].filter((id) => before.has(id)).length,
    menuViews: ev.filter((e) => e.kind === 'menu_view').length, reviewClicks: ev.filter((e) => e.kind === 'review_click').length,
    feedbackCount: fb.length, avgRating: r1(avg(fb.map((x) => x.rating))), urgentOpen: s.feedback.filter((x) => x.urgent && x.status !== 'resolved' && (branch === 'all' || x.branchId === branch)).length,
    registrations: s.members.filter((m) => within(branch === 'all' ? 'all' : branch, range)({ branchId: m.branchId, createdAt: m.createdAt })).length,
    redeemed: tx.filter((t) => t.kind === 'redeem').length, stampsAdded: tx.filter((t) => t.kind === 'stamp').reduce((a, t) => a + t.stamps, 0),
    requests: req.length, avgResponse: r1(avg(ack)), ackCount: ack.length,
  }
}

export const hourly = (xs: { at?: string; createdAt?: string }[]) => Array.from({ length: 24 }, (_, h) => xs.filter((x) => new Date(x.at ?? x.createdAt!).getHours() === h).length)
export const daily = (xs: { at?: string; createdAt?: string }[], r: Range) => {
  const out: { day: string; n: number }[] = []
  for (let d = new Date(r.from); d <= r.to; d = new Date(d.getTime() + 86400000)) {
    const k = d.toLocaleDateString('en-CA'); out.push({ day: k.slice(5), n: xs.filter((x) => new Date(x.at ?? x.createdAt!).toLocaleDateString('en-CA') === k).length })
  }
  return out
}

export interface Insight { text: string; basis: string; action: string }
const MIN = { feedback: 8, members: 5, requests: 20, events: 50 }
export function insights(s: DataState, branch: BranchId | 'all', range: Range, itemName: (id: string) => string): Insight[] {
  const f = within(branch, range); const out: Insight[] = []
  const now = range.to.getTime()
  // Loyalty
  const mem = s.members.filter((m) => branch === 'all' || m.branchId === branch)
  const visitsOf = (id: string) => s.stamps.filter((t) => t.memberId === id && t.kind === 'stamp')
  const regulars = mem.filter((m) => visitsOf(m.id).length >= 4)
  if (mem.length >= MIN.members) {
    const lapsed = regulars.filter((m) => { const l = lastVisit(s, m.id); return l && now - new Date(l).getTime() > 30 * 86400000 })
    if (lapsed.length >= 2) out.push({ text: `${lapsed.length} regular loyalty members have not recorded a visit in the last 30 days.`, basis: `${regulars.length} members with 4+ verified stamps`, action: 'Consider introducing a returning-customer offer in Today’s offers.' })
    const frequent = regulars.filter((m) => visitsOf(m.id).filter((t) => f(t)).length >= 3)
    if (frequent.length >= 2) out.push({ text: `${frequent.length} members visited 3+ times in this period.`, basis: 'Verified stamps recorded by staff', action: 'Thank them in person; they are your best word-of-mouth.' })
    const target = s.settings.loyalty.stampsForReward
    const near = mem.filter((m) => { const b = stampBalance(s, m.id) % target; return b === target - 1 })
    if (near.length >= 2) out.push({ text: `${near.length} members are one stamp away from their reward.`, basis: 'Current stamp balances', action: 'Remind them at the car; a near reward often brings the next visit forward.' })
  }
  // Feedback
  const fb = s.feedback.filter(f)
  if (fb.length >= MIN.feedback) {
    const neg = fb.filter((x) => x.rating <= 3)
    const counts: Partial<Record<FeedbackTopic, number>> = {}
    neg.forEach((x) => complaintTopics(x).forEach((t) => (counts[t] = (counts[t] ?? 0) + 1)))
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    if (top && neg.length >= 4 && top[1] >= 3) out.push({ text: `${labelTopic(top[0] as FeedbackTopic)} accounts for ${Math.round((top[1] / neg.length) * 100)}% of negative feedback in this period.`, basis: `${neg.length} ratings of 3★ or less`, action: top[0] === 'waiting' ? 'Acknowledge cars faster at peak times; add a runner if possible.' : 'Brief the team on this area this week.' })
    const half = new Date((range.from.getTime() + range.to.getTime()) / 2)
    const a = fb.filter((x) => new Date(x.createdAt) < half).map((x) => x.rating); const b = fb.filter((x) => new Date(x.createdAt) >= half).map((x) => x.rating)
    if (a.length >= 4 && b.length >= 4) { const d = (avg(b)! - avg(a)!); if (Math.abs(d) >= 0.3) out.push({ text: `Average rating ${d > 0 ? 'improved' : 'dropped'} from ${r1(avg(a))}★ to ${r1(avg(b))}★ across this period.`, basis: `${fb.length} feedback submissions`, action: d > 0 ? 'Keep doing what changed recently.' : 'Read the latest comments in the Feedback tab.' }) }
  }
  // Service
  const req = s.requests.filter(f).filter((r) => r.ackAt)
  if (req.length >= MIN.requests) {
    const t = req.map((r) => ({ h: new Date(r.createdAt).getHours(), m: minsBetween(r.createdAt, r.ackAt!) }))
    const e = t.filter((x) => x.h >= 18 || x.h < 2); const o = t.filter((x) => !(x.h >= 18 || x.h < 2))
    out.push({ text: `Average staff response time is ${r1(avg(t.map((x) => x.m)))} min.`, basis: `${req.length} acknowledged requests`, action: 'Aim to acknowledge every car within 2 minutes.' })
    if (e.length >= 10 && o.length >= 10 && avg(e.map((x) => x.m))! > avg(o.map((x) => x.m))! * 1.25) out.push({ text: `Evening requests wait longer: ${r1(avg(e.map((x) => x.m)))} min vs ${r1(avg(o.map((x) => x.m)))} min at other times.`, basis: `${e.length} evening / ${o.length} other requests`, action: 'Put an extra person on car-side service in the evening.' })
  }
  // QR activity & menu interest
  const scans = s.events.filter(f).filter((x) => x.kind === 'scan')
  if (scans.length >= MIN.events) { const h = hourly(scans); const peak = h.indexOf(Math.max(...h)); out.push({ text: `Busiest QR activity is ${fmtHour(peak)}–${fmtHour(peak + 1)}.`, basis: `${scans.length} QR/NFC visits (visits, not sales)`, action: 'Keep the card machine charged and staff ready at this hour.' }) }
  const views = s.events.filter(f).filter((x): x is AppEvent & { itemId: string } => x.kind === 'item_view' && !!x.itemId)
  if (views.length >= 30) { const c: Record<string, number> = {}; views.forEach((v) => (c[v.itemId] = (c[v.itemId] ?? 0) + 1)); const top = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 3); out.push({ text: `Most viewed menu items: ${top.map(([id]) => itemName(id)).join(', ')}.`, basis: `${views.length} item views (interest, not purchases)`, action: 'Feature these in Today’s offers or at the car window.' }) }
  return out
}
export const fmtHour = (h: number) => { const x = ((h % 24) + 24) % 24; return `${x % 12 || 12} ${x < 12 ? 'AM' : 'PM'}` }
export const labelTopic = (t: FeedbackTopic) => ({ food: 'Food quality', taste: 'Taste', waiting: 'Waiting time', staff: 'Staff service', value: 'Value for money' })[t]
