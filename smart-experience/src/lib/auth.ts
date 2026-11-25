import { useSyncExternalStore } from 'react'
import { isDemo } from './config'
import { getState } from './store'
import type { BranchId, Role } from './types'

export interface StaffSession { id: string; name: string; role: Role; branches: BranchId[]; demo: boolean }
let session: StaffSession | null = (() => { try { return JSON.parse(sessionStorage.getItem('tt-staff') ?? 'null') } catch { return null } })()
const subs = new Set<() => void>()
const set = (s: StaffSession | null) => { session = s; try { s ? sessionStorage.setItem('tt-staff', JSON.stringify(s)) : sessionStorage.removeItem('tt-staff') } catch { /* private mode */ } subs.forEach((f) => f()) }
export const useStaff = () => useSyncExternalStore((f) => (subs.add(f), () => subs.delete(f)), () => session, () => session)
export const currentStaff = () => session

const attempts: number[] = []
/** Demo accounts + PIN work ONLY in demo mode. Production uses Supabase email + password. */
export async function signIn(email: string, secret: string): Promise<{ ok: true; s: StaffSession } | { ok: false; error: string }> {
  const t = Date.now(); while (attempts.length && t - attempts[0] > 60000) attempts.shift()
  if (attempts.length >= 5) return { ok: false, error: 'Too many attempts. Wait a minute.' }
  attempts.push(t)
  if (isDemo) {
    const m = getState().staff.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
    if (!m?.demoPin || m.demoPin !== secret) return { ok: false, error: 'Email or PIN not recognised.' }
    const s = { id: m.id, name: m.name, role: m.role, branches: m.branches, demo: true }; set(s); return { ok: true, s }
  }
  const r = await (await import('./supabase')).sbSignIn(email, secret)
  if (r.ok) set(r.s)
  return r
}
export async function signOut() { if (!isDemo) await (await (await import('./supabase')).sb()).auth.signOut(); set(null) }
/** UI convenience only; the database enforces the same rules with RLS. */
export const can = (s: StaffSession | null, need: Role, branch?: BranchId) => !!s && (s.role === 'owner' || (need === 'staff' && (!branch || s.branches.includes(branch))))
