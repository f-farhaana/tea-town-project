import { Copy, Printer, Wifi as WifiIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { QrImage } from '../../components/QrImage'
import { logEvent } from '../../lib/api'
import { branchById } from '../../lib/config'
import { useT } from '../../lib/i18n'
import { wifiString } from '../../lib/qr'
import { useCtx } from '../../lib/session'
import { useData } from '../../lib/store'
import { printOnly } from '../../lib/print'

export default function Wifi({ pickBranch }: { pickBranch: () => void }) {
  const t = useT(); const { branch } = useCtx(); const s = useData(); const [copied, setCopied] = useState(false)
  useEffect(() => { logEvent('wifi_view', branch) }, [branch])
  if (!branch) return <button onClick={pickBranch} className="btn-primary mt-6 w-full">{t('chooseBranch')}</button>
  const w = s.settings.branches[branch].wifi
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">{t('wifi')}</h1>
      <p className="text-sm text-cream/60">{branchById(branch)?.name}</p>
      {!w.ssid ? <p className="rounded-2xl bg-white/5 p-6 text-center text-cream/70">Wi-Fi details for this branch have not been set up yet. Please ask a staff member.</p> : (
        <>
          <div className="printable rounded-3xl bg-cream p-5 text-center text-ink">
            <img src="/assets/brand/arabic-logo-black.png" alt="Tea Town" className="mx-auto h-12" />
            <p className="mt-2 font-extrabold">{t('noData')}</p>
            <div className="mx-auto mt-3 w-fit rounded-2xl bg-white p-2"><QrImage text={wifiString(w)} size={200} /></div>
            <p className="mt-3 flex items-center justify-center gap-2 text-lg font-extrabold"><WifiIcon size={20} />{w.ssid}</p>
            {w.security !== 'nopass' && <p className="font-mono text-sm">Password: {w.password}</p>}
          </div>
          <p className="text-sm text-cream/70">{w.instructions}</p>
          <div className="grid grid-cols-2 gap-3">
            {w.security !== 'nopass' && <button onClick={() => { navigator.clipboard?.writeText(w.password); setCopied(true) }} className="btn-dark"><Copy size={18} />{copied ? t('copied') : t('copy')}</button>}
            <button onClick={printOnly} className="btn-dark"><Printer size={18} />Print</button>
          </div>
        </>
      )}
      <Link to="/menu" className="btn-primary w-full">{t('openMenu')}</Link>
      <p className="text-xs text-cream/40">You need a connection (mobile data or Wi-Fi) the first time you open this page. After that the menu works offline on this phone.</p>
    </div>
  )
}
