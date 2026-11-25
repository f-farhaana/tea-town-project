import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useT } from '../lib/i18n'
import { ls } from '../lib/session'
import { fmtDate } from '../lib/util'

/** "Menu saved for offline use" appears only after the service worker reported a completed precache. */
export function OfflineStatus() {
  const t = useT()
  const [at, setAt] = useState<string | null>(ls.get('tt-offline-at', null))
  useEffect(() => { const f = () => setAt(ls.get('tt-offline-at', null)); addEventListener('tt-offline-ready', f); return () => removeEventListener('tt-offline-ready', f) }, [])
  if (!('serviceWorker' in navigator)) return null
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3 text-sm">
      {at ? <CheckCircle2 className="shrink-0 text-emerald-400" size={20} /> : <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-gold" />}
      <div><p className="font-extrabold">{at ? t('offlineSaved') : t('savingOffline')}</p>{at && <p className="text-xs text-cream/50">Saved {fmtDate(at, t.lang)}</p>}</div>
    </div>
  )
}
