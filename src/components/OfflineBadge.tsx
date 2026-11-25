import { useEffect, useState } from 'react'
import { CheckCircle2, CloudDownload, WifiOff } from 'lucide-react'

/** Shows whether the menu has been cached by the service worker for offline use. */
export function OfflineBadge() {
  const [s, setS] = useState<'checking' | 'saving' | 'saved' | 'unsupported'>('checking')
  const [online, setOnline] = useState(true)
  useEffect(() => {
    setOnline(navigator.onLine)
    const on = () => setOnline(navigator.onLine)
    window.addEventListener('online', on); window.addEventListener('offline', on)
    if (!('serviceWorker' in navigator) || !('caches' in window)) { setS('unsupported'); return }
    let stop = false
    const check = async () => {
      const keys = await caches.keys()
      for (const k of keys) {
        const c = await caches.open(k)
        const hits = await c.keys()
        if (hits.some((r) => r.url.includes('/assets/brand/calligraphy-pattern')) && hits.some((r) => /\/menu(\/index\.html)?(\?|$)|index\.html/.test(r.url))) { if (!stop) setS('saved'); return true }
      }
      return false
    }
    setS('saving')
    ;(async () => { for (let i = 0; i < 30 && !stop; i++) { if (await check()) return; await new Promise((r) => setTimeout(r, 1500)) } })()
    return () => { stop = true; window.removeEventListener('online', on); window.removeEventListener('offline', on) }
  }, [])
  if (s === 'checking' || s === 'unsupported') return null
  return (
    <p role="status" className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] ${s === 'saved' ? 'bg-wa/15 text-wa' : 'bg-cream/10 text-cream/70'}`}>
      {!online ? <WifiOff className="h-4 w-4" aria-hidden /> : s === 'saved' ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <CloudDownload className="h-4 w-4 animate-pulse" aria-hidden />}
      {!online ? 'Offline · showing saved menu' : s === 'saved' ? 'Menu saved for offline use' : 'Saving menu for offline use…'}
    </p>
  )
}
