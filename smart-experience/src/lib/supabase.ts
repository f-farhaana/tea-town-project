/**
 * Production backend. Only the public anon key is used in the browser. Every write is a
 * SECURITY DEFINER function that checks auth.uid(), role and branch (see supabase/migrations).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { StaffSession } from './auth'
import { getState, setState } from './store'
import type { DataState, Member, ServiceRequest } from './types'
import type { R } from './api'

let client: SupabaseClient | null = null
export async function sb() {
  client ??= createClient(import.meta.env.VITE_SUPABASE_URL as string, import.meta.env.VITE_SUPABASE_ANON_KEY as string, { auth: { persistSession: true, storageKey: 'tt-se-auth' } })
  return client
}
const camel = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
const row = <T,>(o: unknown): T => (o && typeof o === 'object' && !Array.isArray(o) ? Object.fromEntries(Object.entries(o).map(([k, v]) => [camel(k), v])) : o) as T

export async function rpc(fn: string, args: Record<string, unknown>) { const { data, error } = await (await sb()).rpc(fn, args); if (error) throw new Error(error.message); return data }
export async function rpcR<T>(fn: string, args: Record<string, unknown>): Promise<R<T>> {
  const { data, error } = await (await sb()).rpc(fn, args)
  return error ? { ok: false, error: error.message } : { ok: true, data: row<T>(data) }
}
export const createRequest = (d: { branchId: string; type: string; vehicleColour: string; vehicleModel: string; zoneOrRef?: string }, token: string) =>
  rpcR<ServiceRequest>('create_request', { p_branch: d.branchId, p_type: d.type, p_colour: d.vehicleColour, p_model: d.vehicleModel, p_zone_ref: d.zoneOrRef ?? null, p_token: token })

export async function joinLoyalty(d: { name: string; email: string; branchId?: string }): Promise<R<Member | 'check-email'>> {
  const c = await sb(); const { data: u } = await c.auth.getUser()
  if (!u.user) {
    localStorage.setItem('tt-pending-join', JSON.stringify(d))
    const { error } = await c.auth.signInWithOtp({ email: d.email, options: { emailRedirectTo: `${location.origin}/loyalty` } })
    return error ? { ok: false, error: error.message } : { ok: true, data: 'check-email' }
  }
  return rpcR<Member>('join_loyalty', { p_name: d.name, p_branch: d.branchId ?? null })
}
export async function sbSignIn(email: string, password: string): Promise<{ ok: true; s: StaffSession } | { ok: false; error: string }> {
  const c = await sb()
  if ((await c.auth.signInWithPassword({ email, password })).error) return { ok: false, error: 'Sign-in failed' }
  const { data } = await c.rpc('my_staff_profile')
  if (!data) { await c.auth.signOut(); return { ok: false, error: 'This account has no dashboard access' } }
  return { ok: true, s: { ...row<Omit<StaffSession, 'demo'>>(data), demo: false } }
}

/** Fill the store from Supabase; RLS decides what each role can read. */
export async function loadSnapshot(kind: 'customer' | 'staff', token?: string) {
  const c = await sb(); const next: DataState = { ...getState(), demo: false }
  const pub = await c.rpc('public_config')
  if (pub.data) { const p = row<{ settings: DataState['settings']; offers: unknown[] }>(pub.data); next.settings = p.settings ?? next.settings; next.offers = (p.offers ?? []).map((o) => row(o)) }
  if (kind === 'customer') {
    if (token) { const r = await c.rpc('my_requests', { p_token: token }); next.requests = ((r.data as unknown[]) ?? []).map((x) => ({ ...row<ServiceRequest>(x), deviceToken: token })) }
    const me = await c.rpc('my_loyalty')
    if (me.data) { const m = row<{ member: Member; stamps: unknown[] }>(me.data); next.members = m.member ? [row<Member>(m.member)] : []; next.stamps = (m.stamps ?? []).map((x) => row(x)); if (m.member) localStorage.setItem('tt-member', JSON.stringify(row<Member>(m.member).id)) }
  } else {
    const since = new Date(Date.now() - 90 * 86400000).toISOString()
    // Explicit columns: device/anon hashes and customer emails are not readable by dashboard roles.
    const q = async (t: string, cols: string, col = 'created_at') => ((await c.from(t).select(cols).gte(col, since).order(col, { ascending: false }).limit(5000)).data ?? []).map((x) => row(x))
    const [requests, feedback, members, stamps, events, staff] = await Promise.all([
      q('service_requests', 'id,ref,branch_id,type,vehicle_colour,vehicle_model,zone_or_ref,status,created_at,ack_at,done_at,handled_by'),
      q('feedback', 'id,client_id,branch_id,rating,aspects,comment,urgent,status,created_at,resolved_at'),
      c.from('loyalty_members').select('id,member_code,name,branch_id,created_at').is('deleted_at', null).limit(5000).then((r) => (r.data ?? []).map((x) => ({ email: '', ...row<object>(x) }))),
      q('loyalty_transactions', 'id,member_id,branch_id,kind,stamps,ref,staff_id,created_at'), q('activity_events', 'id,kind,branch_id,anon_id,item_id,at', 'at'),
      c.from('profiles').select('id,name,email,role,branches').then((r) => (r.data ?? []).map((x) => row(x)))])
    Object.assign(next, { requests, feedback, members, stamps, events, staff })
  }
  setState(next, false)
}
export async function subscribeLive(onChange: () => void) {
  const c = await sb(); const ch = c.channel('tt-live')
  for (const table of ['service_requests', 'feedback', 'loyalty_transactions']) ch.on('postgres_changes', { event: '*', schema: 'public', table }, onChange)
  ch.subscribe(); return () => { c.removeChannel(ch) }
}
