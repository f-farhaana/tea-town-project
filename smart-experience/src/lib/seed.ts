/** FICTIONAL demonstration data. Every record is flagged demo: true. */
import { menu } from '../shared/menu'
import { isUrgent } from './analytics'
import { defaultSettings } from './config'
import type { AppEvent, BranchId, DataState, Feedback, Member, Offer, ServiceRequest, StaffUser, StampTx } from './types'

export const DEMO_VERSION = 4
export const demoStaff: StaffUser[] = [
  { id: 'st-aj', name: 'Al Jazzat staff (demo)', email: 'staff.jazzat@demo.local', role: 'staff', branches: ['al-jazzat'], demoPin: '1111' },
  { id: 'st-at', name: 'Al Tarfa staff (demo)', email: 'staff.tarfa@demo.local', role: 'staff', branches: ['al-tarfa'], demoPin: '2222' },
  { id: 'owner', name: 'Owner (demo)', email: 'owner@demo.local', role: 'owner', branches: ['al-jazzat', 'al-tarfa'], demoPin: '4444' },
]
function rng(seed: number) { return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
const FB: [number, string, Partial<Record<'food' | 'taste' | 'waiting' | 'staff' | 'value', number>>][] = [
  [5, 'Karak perfect as always, fast service to the car', { taste: 5, waiting: 5 }], [5, 'Love the animal fries', { food: 5, taste: 5 }], [4, 'Good shawarma, fresh', { food: 4 }],
  [5, 'الكرك لذيذ والخدمة سريعة', { taste: 5, waiting: 5 }], [4, '', {}], [5, '', {}], [3, 'Food good but waited a long time', { waiting: 2 }], [2, 'Waited 20 minutes in the evening', { waiting: 1, staff: 3 }],
  [2, 'Fries were cold when they reached the car', { food: 2 }], [1, 'Order wrong and drink missing, nobody came back. Want the manager', { staff: 1, food: 2 }], [3, 'A bit expensive lately', { value: 2 }],
  [2, 'انتظرت كثير', { waiting: 1 }], [5, 'Best loaded fries in Sharjah', { food: 5 }], [4, 'Polite staff', { staff: 5 }], [3, '', { waiting: 3 }],
]
const NAMES = ['Ahmed', 'Fatima', 'Omar', 'Aisha', 'Yousef', 'Mariam', 'Khalid', 'Noura', 'Hassan', 'Layla', 'Ali', 'Huda', 'Saeed', 'Reem', 'Faisal', 'Amna', 'Rashid', 'Salma', 'Arjun', 'Priya', 'Joseph', 'Bilal', 'Zainab', 'Sana']

export function seedState(ref = new Date()): DataState {
  const r = rng(20261125); const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)]
  const B: BranchId[] = ['al-jazzat', 'al-tarfa']; const DAYS = 45
  const hours = [7, 8, 9, 12, 13, 16, 17, 18, 19, 20, 20, 21, 21, 21, 22, 22, 23, 0, 1]
  const at = (d: number, h = pick(hours)) => { const x = new Date(ref); x.setDate(x.getDate() - d); x.setHours(h, Math.floor(r() * 60), Math.floor(r() * 60), 0); return x }
  const iso = (d: Date) => d.toISOString(); const add = (d: Date, m: number) => new Date(d.getTime() + m * 60000)

  const members: Member[] = NAMES.map((n, i) => ({ id: `demo-m${i}`, memberCode: `TT${String(100000 + i * 7919).slice(-6)}`, name: `${n} ${String.fromCharCode(65 + i)}.`, email: `member${i}@demo.local`, branchId: i % 3 ? 'al-jazzat' : 'al-tarfa', createdAt: iso(at(40 + Math.floor(r() * 20), 12)), demo: true }))
  const stamps: StampTx[] = []
  members.forEach((m, i) => {
    const gap = i < 6 ? 2 : i < 14 ? 5 : 10; const lapsed = i % 5 === 0 ? 32 : 0
    for (let d = 40 - Math.floor(r() * 5); d > lapsed; d -= Math.max(1, Math.round(gap * (0.6 + r() * 0.8)))) {
      const t = at(d); if (t > ref) continue
      stamps.push({ id: `demo-s${stamps.length}`, memberId: m.id, branchId: m.branchId!, kind: 'stamp', stamps: 1, ref: `demo-${stamps.length}`, staffId: m.branchId === 'al-jazzat' ? 'st-aj' : 'st-at', createdAt: iso(t), demo: true })
      const bal = stamps.filter((s) => s.memberId === m.id).reduce((a, s) => a + s.stamps, 0)
      if (bal >= 5 && r() < 0.5) stamps.push({ id: `demo-s${stamps.length}`, memberId: m.id, branchId: m.branchId!, kind: 'redeem', stamps: -5, ref: `demo-r${stamps.length}`, staffId: 'st-aj', createdAt: iso(add(t, 1)), demo: true })
    }
  })
  const requests: ServiceRequest[] = []
  for (let d = DAYS; d >= 0; d--) for (const b of B) for (let k = 0, n = 8 + Math.floor(r() * 8); k < n; k++) {
    const h = pick(hours); const t0 = at(d, h); if (t0 > ref) continue
    const eve = h >= 18 || h <= 1; const ack = (eve ? 2.3 : 1.2) + r() * (eve ? 3.5 : 1.8); const done = ack + 1 + r() * 4
    const live = d === 0 && add(t0, done) > ref
    const status = live ? (add(t0, ack) > ref ? 'new' : 'acknowledged') : 'completed'
    requests.push({ id: `demo-q${requests.length}`, ref: `R${(1000 + requests.length).toString(36).toUpperCase()}`, branchId: b, type: r() < 0.55 ? 'call_staff' : 'ready_to_pay', vehicleColour: pick(['White', 'Black', 'Silver', 'Grey', 'Red', 'Blue']), vehicleModel: pick(['Patrol', 'Land Cruiser', 'Camry', 'Altima', 'Prado', 'Accord', 'Tahoe']), zoneOrRef: r() < 0.4 ? `Zone ${pick(['A', 'B'])}` : undefined, status, createdAt: iso(t0), ackAt: status !== 'new' ? iso(add(t0, ack)) : undefined, doneAt: status === 'completed' ? iso(add(t0, done)) : undefined, handledBy: status !== 'new' ? (b === 'al-jazzat' ? 'st-aj' : 'st-at') : undefined, deviceToken: 'demo', demo: true })
  }
  const feedback: Feedback[] = []
  for (let d = DAYS; d >= 0; d--) for (const b of B) for (let k = 0, n = Math.floor(r() * 3); k < n; k++) {
    const [rating, comment, aspects] = pick(FB); const t0 = at(d); if (t0 > ref) continue
    const urgent = isUrgent(rating, aspects, comment)
    feedback.push({ id: `demo-f${feedback.length}`, clientId: `demo-f${feedback.length}`, branchId: b, rating, aspects, comment, urgent, status: d > 2 ? (rating <= 2 ? 'resolved' : 'reviewed') : 'new', createdAt: iso(t0), resolvedAt: d > 2 && rating <= 2 ? iso(add(t0, 90)) : undefined, demo: true })
  }
  const events: AppEvent[] = []
  const popular = ['premium-burgers--fresh-beef-burger', 'fries--animal-fries', 'fries--loaded-fries', 'tea--karak-tea', 'shawarma--shawarma', 'pasta--tea-town-special-pasta', 'clubs--tea-town-club']
  for (let d = DAYS; d >= 0; d--) for (const b of B) for (let k = 0, n = 30 + Math.floor(r() * 25); k < n; k++) {
    const t0 = at(d); if (t0 > ref) continue
    const anonId = `demo-a${Math.floor(Math.pow(r(), 1.6) * 700)}`; const base = { branchId: b, anonId, demo: true }
    events.push({ id: `demo-e${events.length}`, kind: 'scan', at: iso(t0), ...base })
    if (r() < 0.7) events.push({ id: `demo-e${events.length}`, kind: 'menu_view', at: iso(add(t0, 0.3)), ...base })
    if (r() < 0.4) events.push({ id: `demo-e${events.length}`, kind: 'item_view', itemId: r() < 0.7 ? pick(popular) : pick(menu).id, at: iso(add(t0, 1)), ...base })
    if (r() < 0.07) events.push({ id: `demo-e${events.length}`, kind: 'review_click', at: iso(add(t0, 5)), ...base })
    if (r() < 0.04) events.push({ id: `demo-e${events.length}`, kind: 'whatsapp_click', at: iso(add(t0, 2)), ...base })
  }
  const offers: Offer[] = [
    { id: 'demo-offer', title: 'Evening karak & paratha', description: 'Example offer for the demo only. Not an approved Tea Town offer.', image: '/assets/products/packaging-box.webp', branchId: 'all', expiresAt: iso(at(-14, 23)), active: true, example: true, createdAt: iso(at(2, 10)) },
  ]
  return { version: DEMO_VERSION, demo: true, requests, feedback, members, stamps, offers, events, staff: demoStaff, settings: { ...structuredClone(defaultSettings), loyalty: { ...defaultSettings.loyalty, enabled: true } } }
}
