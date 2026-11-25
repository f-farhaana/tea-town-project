import { useEffect, useState, useSyncExternalStore } from 'react'
import { branchById } from './config'
import type { BranchId, Lang } from './types'
import { uid } from './util'

const safe = <T,>(fn: () => T, fallback: T): T => { try { return fn() } catch { return fallback } }
export const ls = {
  get: <T,>(k: string, d: T): T => safe(() => { const v = localStorage.getItem(k); return v == null ? d : (JSON.parse(v) as T) }, d),
  set: (k: string, v: unknown) => safe(() => localStorage.setItem(k, JSON.stringify(v)), undefined),
  del: (k: string) => safe(() => localStorage.removeItem(k), undefined),
}
/** Random per-browser id to estimate unique visitors. Not a fingerprint; cleared with site data. */
export const anonId = () => { let id = ls.get<string | null>('tt-anon', null); if (!id) { id = uid(); ls.set('tt-anon', id) } return id }

type Ctx = { branch: BranchId | null; lang: Lang; theme: 'system' | 'light' | 'dark' }
let ctx: Ctx = {
  branch: safe(() => (sessionStorage.getItem('tt-branch') as BranchId | null), null) ?? ls.get<BranchId | null>('tt-last-branch', null),
  lang: ls.get<Lang>('tt-lang', 'en'), theme: ls.get<Ctx['theme']>('tt-theme', 'system'),
}
const subs = new Set<() => void>()
export const setCtx = (p: Partial<Ctx>) => {
  ctx = { ...ctx, ...p }
  if (p.branch) { safe(() => sessionStorage.setItem('tt-branch', p.branch!), undefined); ls.set('tt-last-branch', p.branch) }
  if (p.lang) ls.set('tt-lang', p.lang)
  if (p.theme) ls.set('tt-theme', p.theme)
  applyDocument(); subs.forEach((f) => f())
}
export const useCtx = () => useSyncExternalStore((f) => (subs.add(f), () => subs.delete(f)), () => ctx, () => ctx)

/** Reads ?branch= from a scanned QR/NFC link. Unknown values are ignored. */
export function readEntryParams(search: string): { branch?: BranchId } {
  const b = new URLSearchParams(search).get('branch')
  return b && branchById(b) ? { branch: b as BranchId } : {}
}
export function applyDocument() {
  if (typeof document === 'undefined') return
  const el = document.documentElement
  el.lang = ctx.lang; el.dir = ctx.lang === 'ar' ? 'rtl' : 'ltr'
  el.dataset.theme = ctx.theme === 'dark' || (ctx.theme === 'system' && safe(() => matchMedia('(prefers-color-scheme: dark)').matches, true)) ? 'dark' : 'light'
}
export function useOnline() {
  const [on, setOn] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  useEffect(() => { const a = () => setOn(true); const b = () => setOn(false); addEventListener('online', a); addEventListener('offline', b); return () => { removeEventListener('online', a); removeEventListener('offline', b) } }, [])
  return on
}
