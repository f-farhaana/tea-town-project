/**
 * Data store. DEMO mode: the whole dataset lives in this browser (localStorage) and is
 * synchronised between tabs on the same device with BroadcastChannel. It is NOT cross-device.
 * PRODUCTION mode: the same shape is filled from Supabase (RLS-scoped) by ./supabase.ts.
 */
import { useSyncExternalStore } from 'react'
import { isDemo } from './config'
import { DEMO_VERSION, seedState } from './seed'
import { defaultSettings } from './config'
import type { DataState } from './types'
import { ls } from './session'

const KEY = `tt-se-demo-v${DEMO_VERSION}`
const subs = new Set<() => void>()
const emit = () => subs.forEach((f) => f())
let bc: BroadcastChannel | null = null

function load(): DataState | null { return ls.get<DataState | null>(KEY, null) }
export const emptyState = (): DataState => ({ version: DEMO_VERSION, demo: false, requests: [], feedback: [], members: [], stamps: [], offers: [], events: [], staff: [], settings: structuredClone(defaultSettings) })
let state: DataState = isDemo ? load() || seedState() : emptyState()
if (isDemo && !load()) ls.set(KEY, state)

if (typeof window !== 'undefined' && isDemo) {
  try { bc = new BroadcastChannel('tt-se-demo'); bc.onmessage = () => { const s = load(); if (s) { state = s; emit() } } } catch { bc = null }
  addEventListener('storage', (e) => { if (e.key === KEY) { const s = load(); if (s) { state = s; emit() } } })
}

export const getState = () => state
export function setState(next: DataState, broadcast = true) {
  state = next
  if (isDemo) { ls.set(KEY, next); if (broadcast) bc?.postMessage('sync') }
  emit()
}
/** Apply a change to a copy of the state, persist it and notify other tabs. */
export function mutate(fn: (s: DataState) => void) { const draft = structuredClone(state); fn(draft); setState(draft) }
export function resetDemo() { setState(seedState()) }
export const useData = () => useSyncExternalStore((f) => (subs.add(f), () => subs.delete(f)), () => state, () => state)
export const subscribe = (f: () => void) => (subs.add(f), () => subs.delete(f))
