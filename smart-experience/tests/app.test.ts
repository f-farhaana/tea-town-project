import { beforeEach, describe, expect, it } from 'vitest'
import * as api from '../src/lib/api'
import { insights, isUrgent, overview, presetRange } from '../src/lib/analytics'
import { signIn, signOut } from '../src/lib/auth'
import { branches, defaultSettings } from '../src/lib/config'
import { branchUrl, wifiString } from '../src/lib/qr'
import { readEntryParams } from '../src/lib/session'
import { seedState } from '../src/lib/seed'
import { getState, resetDemo, setState } from '../src/lib/store'
import { emptyState } from '../src/lib/store'

const online = (v: boolean) => Object.defineProperty(navigator, 'onLine', { value: v, configurable: true })
beforeEach(async () => { localStorage.clear(); setState({ ...emptyState(), demo: true, staff: seedState().staff, settings: { ...structuredClone(defaultSettings), loyalty: { enabled: true, approved: true, stampsForReward: 3, rewardName: 'Karak' } } }); online(true); await signOut() })

describe('branch identification', () => {
  it('reads known branches from QR links and ignores others', () => {
    expect(readEntryParams('?branch=al-jazzat')).toEqual({ branch: 'al-jazzat' })
    expect(readEntryParams('?branch=al-tarfa')).toEqual({ branch: 'al-tarfa' })
    expect(readEntryParams('?branch=<script>')).toEqual({})
  })
  it('builds NFC/QR URLs and Wi-Fi QR strings', () => {
    expect(branchUrl('al-tarfa', 'https://x.app')).toBe('https://x.app/?branch=al-tarfa')
    expect(wifiString({ ssid: 'Tea;Town', password: 'p:w', security: 'WPA', instructions: '' })).toBe(String.raw`WIFI:T:WPA;S:Tea\;Town;P:p\:w;;`)
  })
  it('uses the website review + WhatsApp details for both branches', () => {
    for (const b of branches) {
      expect(defaultSettings.branches[b.id].reviewUrl).toContain(b.placeId)
      expect(defaultSettings.branches[b.id].whatsapp).toMatch(/^971\d{8,9}$/)
    }
  })
})

describe('staff requests', () => {
  const req = { branchId: 'al-jazzat' as const, type: 'call_staff' as const, vehicleColour: 'White', vehicleModel: 'Patrol' }
  it('refuses to send while offline (no silent queue)', async () => {
    online(false)
    expect(await api.createRequest(req)).toEqual({ ok: false, error: 'offline' })
    expect(getState().requests).toHaveLength(0)
  })
  it('validates and de-duplicates accidental double taps', async () => {
    expect((await api.createRequest({ ...req, vehicleModel: '' })).ok).toBe(false)
    const a = await api.createRequest(req); const b = await api.createRequest(req)
    expect(a.ok && b.ok && a.data.id === b.data.id).toBe(true)
    expect(getState().requests).toHaveLength(1)
  })
  it('staff of another branch cannot act; own branch can acknowledge and complete', async () => {
    const r = await api.createRequest(req); if (!r.ok) throw new Error()
    await signIn('staff.tarfa@demo.local', '2222')
    expect((await api.setRequestStatus(r.data.id, 'acknowledged')).ok).toBe(false)
    await signIn('staff.jazzat@demo.local', '1111')
    expect((await api.setRequestStatus(r.data.id, 'acknowledged')).ok).toBe(true)
    expect((await api.setRequestStatus(r.data.id, 'completed')).ok).toBe(true)
    const done = getState().requests[0]
    expect(done.status).toBe('completed'); expect(done.ackAt).toBeTruthy()
  })
})

describe('feedback', () => {
  const fb = (clientId: string, rating = 1) => ({ clientId, branchId: 'al-tarfa' as const, rating, aspects: { waiting: 1 }, comment: 'waited too long', startedAt: Date.now() - 10000 })
  it('is anonymous, idempotent and flags urgent complaints', async () => {
    const a = await api.submitFeedback(fb('client-aaaa-1')); const b = await api.submitFeedback(fb('client-aaaa-1'))
    expect(a.ok && b.ok && a.data.id === b.data.id).toBe(true)
    expect(getState().feedback[0].urgent).toBe(true)
    expect(Object.keys(getState().feedback[0])).not.toContain('name')
  })
  it('blocks bots (honeypot, instant submit) and limits per phone', async () => {
    expect((await api.submitFeedback({ ...fb('client-bbbb-1'), website: 'x' })).ok).toBe(false)
    expect((await api.submitFeedback({ ...fb('client-bbbb-2'), startedAt: Date.now() })).ok).toBe(false)
    for (const i of [1, 2, 3]) expect((await api.submitFeedback(fb(`client-cccc-${i}`, 4))).ok).toBe(true)
    expect((await api.submitFeedback(fb('client-cccc-4', 4))).ok).toBe(false)
  })
  it('only owners can resolve', async () => {
    const a = await api.submitFeedback(fb('client-dddd-1')); if (!a.ok) throw new Error()
    await signIn('staff.jazzat@demo.local', '1111'); expect((await api.setFeedbackStatus(a.data.id, 'resolved')).ok).toBe(false)
    await signIn('owner@demo.local', '4444'); expect((await api.setFeedbackStatus(a.data.id, 'resolved')).ok).toBe(true)
  })
  it('urgency rules', () => { expect(isUrgent(1, {}, '')).toBe(true); expect(isUrgent(2, {}, 'found a hair')).toBe(true); expect(isUrgent(4, { waiting: 1 }, '')).toBe(false) })
})

describe('loyalty', () => {
  it('customers cannot stamp themselves; staff stamps are idempotent; redemption needs balance and happens once', async () => {
    const j = await api.joinLoyalty({ name: 'Ahmed', email: 'a@b.co' }); if (!j.ok || j.data === 'check-email') throw new Error()
    const code = j.data.memberCode
    expect((await api.addStamp(code, 'al-jazzat', 'ref-1')).ok).toBe(false) // not signed in
    await signIn('staff.jazzat@demo.local', '1111')
    expect((await api.addStamp(code, 'al-tarfa', 'ref-x')).ok).toBe(false) // other branch
    const s1 = await api.addStamp(code, 'al-jazzat', 'ref-1'); const s1b = await api.addStamp(code, 'al-jazzat', 'ref-1')
    expect(s1.ok && s1.data.balance).toBe(1); expect(s1b.ok && s1b.data.duplicate).toBe(true)
    expect((await api.addStamp(code, 'al-jazzat', 'ref-2')).ok).toBe(false) // same visit, within 10 min
    expect((await api.redeemReward(code, 'al-jazzat', 'rd-1')).ok).toBe(false)
    setState({ ...getState(), stamps: getState().stamps.map((s) => ({ ...s, createdAt: '2026-01-01T00:00:00Z' })) })
    await api.addStamp(code, 'al-jazzat', 'ref-3'); setState({ ...getState(), stamps: getState().stamps.map((s) => ({ ...s, createdAt: '2026-01-01T00:00:00Z' })) })
    await api.addStamp(code, 'al-jazzat', 'ref-4')
    const r = await api.redeemReward(code, 'al-jazzat', 'rd-2'); expect(r.ok && r.data.balance).toBe(0)
    expect((await api.redeemReward(code, 'al-jazzat', 'rd-3')).ok).toBe(false)
  })
  it('cannot be switched on without management approval', async () => {
    await signIn('owner@demo.local', '4444')
    const s = structuredClone(getState().settings); s.loyalty = { ...s.loyalty, enabled: true, approved: false }
    expect((await api.saveSettings(s)).ok).toBe(false)
    await signIn('staff.jazzat@demo.local', '1111')
    expect((await api.saveSettings(getState().settings)).ok).toBe(false)
  })
})

describe('offers & insights', () => {
  it('hides expired and inactive offers', () => {
    const base = { title: 'x', description: '', branchId: 'all' as const, createdAt: '' }
    const list = api.liveOffers([{ ...base, id: 'a', active: true, expiresAt: '2099-01-01' }, { ...base, id: 'b', active: true, expiresAt: '2001-01-01' }, { ...base, id: 'c', active: false, expiresAt: '2099-01-01' }], 'al-jazzat')
    expect(list.map((o) => o.id)).toEqual(['a'])
  })
  it('gives no insights without enough data, and data-backed ones with it', () => {
    const r = presetRange('30d')
    expect(insights(getState(), 'all', r, (x) => x)).toEqual([])
    resetDemo()
    const tips = insights(getState(), 'all', r, (x) => x)
    expect(tips.length).toBeGreaterThan(3)
    tips.forEach((t) => { expect(t.basis).toBeTruthy(); expect(t.action).toBeTruthy() })
    const k = overview(getState(), 'al-jazzat', r)
    expect(k.uniqueVisitors).toBeLessThanOrEqual(k.visits)
    expect(getState().demo).toBe(true)
  })
  it('demo logins are refused with a wrong PIN', async () => { expect((await signIn('owner@demo.local', '0000')).ok).toBe(false) })
})
