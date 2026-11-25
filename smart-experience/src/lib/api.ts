/**
 * All reads/writes go through here. Inputs are validated with Zod. DEMO: local store.
 * PRODUCTION: Supabase RPCs (security definer + RLS) do the authoritative checks.
 */
import { z } from 'zod'
import { isUrgent, stampBalance } from './analytics'
import { can, currentStaff } from './auth'
import { isDemo } from './config'
import { anonId, ls } from './session'
import { getState, mutate } from './store'
import type { BranchId, EventKind, Feedback, Member, Offer, RequestStatus, RequestType, ServiceRequest, Settings, StampTx } from './types'
import { clean, now, shortRef, uid } from './util'

export type R<T> = { ok: true; data: T } | { ok: false; error: string }
const ok = <T,>(data: T): R<T> => ({ ok: true, data })
const fail = (error: string): R<never> => ({ ok: false, error })
const sbx = () => import('./supabase')
const offline = () => typeof navigator !== 'undefined' && !navigator.onLine
const branchZ = z.enum(['al-jazzat', 'al-tarfa'])

/** Per-device secret so this phone can follow its own requests. Not used for analytics. */
export const deviceToken = () => { let t = ls.get<string | null>('tt-device', null); if (!t) { t = uid(); ls.set('tt-device', t) } return t }

export async function logEvent(kind: EventKind, branchId?: BranchId | null, itemId?: string) {
  if (isDemo) { mutate((s) => { s.events.push({ id: uid(), kind, branchId: branchId ?? undefined, itemId, anonId: anonId(), at: now() }) }); return }
  try { await (await sbx()).rpc('log_event', { p_kind: kind, p_branch: branchId ?? null, p_anon: anonId(), p_item: itemId ?? null }) } catch { /* best effort */ }
}

// ---------- Service requests ----------
export const requestInput = z.object({
  branchId: branchZ, type: z.enum(['call_staff', 'ready_to_pay']),
  vehicleColour: z.string().trim().min(2, 'Enter your car colour').max(20), vehicleModel: z.string().trim().min(2, 'Enter your car model').max(40),
  zoneOrRef: z.string().trim().max(20).optional(),
})
export async function createRequest(input: z.input<typeof requestInput>): Promise<R<ServiceRequest>> {
  if (offline()) return fail('offline')
  const v = requestInput.safeParse(input); if (!v.success) return fail(v.error.issues[0].message)
  const d = { ...v.data, vehicleColour: clean(v.data.vehicleColour, 20), vehicleModel: clean(v.data.vehicleModel, 40), zoneOrRef: v.data.zoneOrRef ? clean(v.data.zoneOrRef, 20) : undefined }
  const token = deviceToken()
  if (!isDemo) return (await sbx()).createRequest(d, token)
  const s = getState(); const mine = s.requests.filter((r) => r.deviceToken === token)
  const open = mine.find((r) => r.type === d.type && r.branchId === d.branchId && (r.status === 'new' || r.status === 'acknowledged'))
  if (open) return ok(open) // accidental double tap: keep the existing request
  if (mine.filter((r) => Date.now() - new Date(r.createdAt).getTime() < 600000).length >= 4) return fail('Too many requests from this phone. Please wave to a staff member.')
  const r: ServiceRequest = { id: uid(), ref: shortRef('R', 4), ...d, type: d.type as RequestType, status: 'new', createdAt: now(), deviceToken: token }
  mutate((x) => { x.requests.push(r) })
  return ok(r)
}
export async function cancelRequest(id: string) {
  if (!isDemo) { await (await sbx()).rpc('cancel_request', { p_id: id, p_token: deviceToken() }); return }
  mutate((s) => { const r = s.requests.find((x) => x.id === id && x.deviceToken === deviceToken()); if (r && r.status === 'new') r.status = 'cancelled' })
}
const FLOW: Record<RequestStatus, RequestStatus[]> = { new: ['acknowledged', 'completed', 'cancelled'], acknowledged: ['completed', 'cancelled'], completed: [], cancelled: [] }
export async function setRequestStatus(id: string, status: 'acknowledged' | 'completed'): Promise<R<true>> {
  const st = currentStaff(); const r0 = getState().requests.find((x) => x.id === id)
  if (!r0 || !can(st, 'staff', r0.branchId)) return fail('Not authorised for this branch')
  if (!isDemo) return (await sbx()).rpcR('update_request', { p_id: id, p_status: status })
  if (!FLOW[r0.status].includes(status)) return fail('Already updated')
  mutate((s) => { const r = s.requests.find((x) => x.id === id)!; r.status = status; r.handledBy = st!.id; if (status === 'acknowledged' || !r.ackAt) r.ackAt ??= now(); if (status === 'completed') r.doneAt = now() })
  return ok(true)
}

// ---------- Feedback ----------
const score = z.number().int().min(1).max(5)
export const feedbackInput = z.object({
  clientId: z.string().min(8).max(64), branchId: branchZ, rating: score,
  aspects: z.object({ food: score.optional(), taste: score.optional(), waiting: score.optional(), staff: score.optional(), value: score.optional() }),
  comment: z.string().max(600), website: z.string().max(0).optional(), startedAt: z.number(),
})
export async function submitFeedback(input: z.input<typeof feedbackInput>): Promise<R<{ id: string }>> {
  if (offline()) return fail('offline')
  const v = feedbackInput.safeParse(input); if (!v.success) return fail(v.error.issues[0].path[0] === 'website' ? 'Could not send' : v.error.issues[0].message)
  const d = v.data
  if (Date.now() - d.startedAt < 2000) return fail('Please take a moment to complete the form.')
  const comment = clean(d.comment, 600)
  if (!isDemo) return (await sbx()).rpcR('submit_feedback', { p_client_id: d.clientId, p_branch: d.branchId, p_rating: d.rating, p_aspects: d.aspects, p_comment: comment, p_anon: anonId() })
  const s = getState()
  const dupe = s.feedback.find((f) => f.clientId === d.clientId); if (dupe) return ok({ id: dupe.id })
  const recent = ls.get<number[]>('tt-fb-times', []).filter((t) => Date.now() - t < 3600000)
  if (recent.length >= 3) return fail('Thanks! We already received several messages from this phone in the last hour.')
  ls.set('tt-fb-times', [...recent, Date.now()])
  const f: Feedback = { id: uid(), clientId: d.clientId, branchId: d.branchId, rating: d.rating, aspects: d.aspects, comment, urgent: isUrgent(d.rating, d.aspects, comment), status: 'new', createdAt: now() }
  mutate((x) => { x.feedback.push(f) })
  return ok({ id: f.id })
}
export async function setFeedbackStatus(id: string, status: Feedback['status']): Promise<R<true>> {
  if (!can(currentStaff(), 'owner')) return fail('Owners only')
  if (!isDemo) return (await sbx()).rpcR('set_feedback_status', { p_id: id, p_status: status })
  mutate((s) => { const f = s.feedback.find((x) => x.id === id); if (f) { f.status = status; if (status === 'resolved') f.resolvedAt = now() } })
  return ok(true)
}

// ---------- Loyalty ----------
export const joinInput = z.object({ name: z.string().trim().min(2, 'Enter your name').max(40), email: z.string().trim().email('Enter a valid email').max(120), branchId: branchZ.optional() })
/** Production: Supabase email magic link proves the customer owns the email before a card is issued. */
export async function joinLoyalty(input: z.input<typeof joinInput>): Promise<R<Member | 'check-email'>> {
  const v = joinInput.safeParse(input); if (!v.success) return fail(v.error.issues[0].message)
  if (!isDemo) return (await sbx()).joinLoyalty(v.data)
  const d = v.data; const s = getState()
  const existing = s.members.find((m) => m.email === d.email.toLowerCase())
  if (existing) { ls.set('tt-member', existing.id); return ok(existing) }
  const m: Member = { id: uid(), memberCode: `TT${Math.floor(100000 + Math.random() * 899999)}`, name: clean(d.name, 40), email: d.email.toLowerCase(), branchId: d.branchId, createdAt: now() }
  mutate((x) => { x.members.push(m) }); ls.set('tt-member', m.id)
  return ok(m)
}
export const myMemberId = () => ls.get<string | null>('tt-member', null)
export const leaveLoyalty = async () => {
  const id = myMemberId(); ls.del('tt-member')
  if (!isDemo) { await (await sbx()).rpc('delete_my_membership', {}); return }
  if (id) mutate((s) => { const m = s.members.find((x) => x.id === id); if (m) Object.assign(m, { name: 'Deleted member', email: `deleted-${m.id}@invalid` }) })
}
export const findMember = (code: string) => getState().members.find((m) => m.memberCode === code.trim().toUpperCase())

/** Staff only. `ref` makes each tap idempotent so a double tap or retry never adds two stamps. */
export async function addStamp(memberCode: string, branchId: BranchId, ref: string): Promise<R<{ balance: number; duplicate: boolean }>> {
  const st = currentStaff(); if (!can(st, 'staff', branchId)) return fail('Not authorised for this branch')
  if (!getState().settings.loyalty.enabled) return fail('Loyalty is switched off in Settings')
  if (!isDemo) return (await sbx()).rpcR('add_stamp', { p_member_code: memberCode, p_branch: branchId, p_ref: ref })
  const m = findMember(memberCode); if (!m) return fail('Member not found')
  const s = getState()
  if (s.stamps.some((t) => t.ref === ref)) return ok({ balance: stampBalance(s, m.id), duplicate: true })
  // one stamp per member per 10 minutes guards against repeated scans of the same visit
  if (s.stamps.some((t) => t.memberId === m.id && t.kind === 'stamp' && Date.now() - new Date(t.createdAt).getTime() < 600000)) return fail('A stamp was already added for this member in the last 10 minutes')
  const tx: StampTx = { id: uid(), memberId: m.id, branchId, kind: 'stamp', stamps: 1, ref, staffId: st!.id, createdAt: now() }
  mutate((x) => { x.stamps.push(tx) })
  return ok({ balance: stampBalance(getState(), m.id), duplicate: false })
}
export async function redeemReward(memberCode: string, branchId: BranchId, ref: string): Promise<R<{ balance: number; duplicate: boolean }>> {
  const st = currentStaff(); if (!can(st, 'staff', branchId)) return fail('Not authorised for this branch')
  const s = getState(); const need = s.settings.loyalty.stampsForReward
  if (!s.settings.loyalty.enabled) return fail('Loyalty is switched off in Settings')
  if (!isDemo) return (await sbx()).rpcR('redeem_reward', { p_member_code: memberCode, p_branch: branchId, p_ref: ref })
  const m = findMember(memberCode); if (!m) return fail('Member not found')
  if (s.stamps.some((t) => t.ref === ref)) return ok({ balance: stampBalance(s, m.id), duplicate: true })
  if (stampBalance(s, m.id) < need) return fail(`Needs ${need} stamps to redeem`)
  mutate((x) => { x.stamps.push({ id: uid(), memberId: m.id, branchId, kind: 'redeem', stamps: -need, ref, staffId: st!.id, createdAt: now() }) })
  return ok({ balance: stampBalance(getState(), m.id), duplicate: false })
}

// ---------- Owner settings & offers ----------
export async function saveSettings(next: Settings): Promise<R<true>> {
  if (!can(currentStaff(), 'owner')) return fail('Owners only')
  if (next.loyalty.enabled && !next.loyalty.approved) return fail('Tick “Reward approved by management” before switching loyalty on')
  if (!isDemo) return (await sbx()).rpcR('save_settings', { p_settings: next })
  mutate((s) => { s.settings = next }); return ok(true)
}
export const offerInput = z.object({ id: z.string(), title: z.string().trim().min(2).max(60), description: z.string().max(200), image: z.string().max(400_000).optional(), branchId: z.enum(['all', 'al-jazzat', 'al-tarfa']), expiresAt: z.string(), active: z.boolean(), createdAt: z.string(), example: z.boolean().optional() })
export async function saveOffer(o: Offer): Promise<R<true>> {
  if (!can(currentStaff(), 'owner')) return fail('Owners only')
  const v = offerInput.safeParse(o); if (!v.success) return fail(v.error.issues[0].message)
  if (!isDemo) return (await sbx()).rpcR('save_offer', { p_offer: o })
  mutate((s) => { const i = s.offers.findIndex((x) => x.id === o.id); if (i >= 0) s.offers[i] = o; else s.offers.push(o) }); return ok(true)
}
export async function deleteOffer(id: string): Promise<R<true>> {
  if (!can(currentStaff(), 'owner')) return fail('Owners only')
  if (!isDemo) return (await sbx()).rpcR('delete_offer', { p_id: id })
  mutate((s) => { s.offers = s.offers.filter((x) => x.id !== id) }); return ok(true)
}
/** Expired or inactive offers never show to customers. */
export const liveOffers = (offers: Offer[], branch: BranchId | null, t = Date.now()) => offers.filter((o) => o.active && new Date(o.expiresAt).getTime() > t && (o.branchId === 'all' || o.branchId === branch))
export const newClientId = () => uid()
