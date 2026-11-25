export const uid = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`)
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const shortRef = (prefix: string, n = 4) => {
  const bytes = new Uint8Array(n)
  globalThis.crypto?.getRandomValues?.(bytes) ?? bytes.forEach((_, i) => (bytes[i] = Math.floor(Math.random() * 256)))
  return `${prefix}-${Array.from(bytes, (b) => ALPHA[b % ALPHA.length]).join('')}`
}
export const now = () => new Date().toISOString()
export const mins = (a: string, b: string) => (new Date(b).getTime() - new Date(a).getTime()) / 60000
export const daysAgo = (iso: string, ref = Date.now()) => Math.floor((ref - new Date(iso).getTime()) / 86400000)
export const fmtTime = (iso: string, lang = 'en') => new Date(iso).toLocaleTimeString(lang === 'ar' ? 'ar-AE' : 'en-AE', { hour: 'numeric', minute: '2-digit' })
export const fmtDate = (iso: string, lang = 'en') => new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-AE' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
export const fmtAed = (n: number | null | undefined) => (n == null ? '—' : `AED ${n.toFixed(n % 1 ? 2 : 0)}`)
export const round1 = (n: number) => Math.round(n * 10) / 10
export const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
export const median = (xs: number[]) => { if (!xs.length) return 0; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
export const groupBy = <T, K extends string | number>(xs: T[], f: (x: T) => K) => xs.reduce((acc, x) => { (acc[f(x)] ||= []).push(x); return acc }, {} as Record<K, T[]>)
/** Strip control chars, collapse whitespace and cap length. Rendering always goes through React (escaped). */
export const clean = (s: unknown, max = 500) => String(s ?? '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
export const download = (name: string, data: BlobPart, type = 'text/plain') => {
  const url = URL.createObjectURL(new Blob([data], { type }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export const toCsv = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return ''
  const keys = Object.keys(rows[0])
  const esc = (v: unknown) => { const s = String(v ?? ''); return /^[=+\-@]/.test(s) ? `'${s}` : /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
  return [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))].join('\n')
}
