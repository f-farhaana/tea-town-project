import { Download, Nfc, Plus, Printer, Save, Trash2 } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { QrImage } from '../../components/QrImage'
import { Toggle } from '../../components/ui'
import { deleteOffer, saveOffer, saveSettings } from '../../lib/api'
import { appUrl, branches, isDemo } from '../../lib/config'
import { printOnly } from '../../lib/print'
import { branchUrl, qrPng, qrSvg, wifiString } from '../../lib/qr'
import { resetDemo, useData } from '../../lib/store'
import type { BranchId, Offer, Settings as S } from '../../lib/types'
import { download, uid } from '../../lib/util'

const Section = ({ title, children, note }: { title: string; children: ReactNode; note?: string }) => (
  <section className="panel space-y-3 p-4"><div><h2 className="text-lg font-extrabold">{title}</h2>{note && <p className="text-xs muted">{note}</p>}</div>{children}</section>
)
const F = ({ label, children }: { label: string; children: ReactNode }) => <label className="block"><span className="label">{label}</span>{children}</label>

async function toImage(file: File): Promise<string> {
  const img = await createImageBitmap(file); const scale = Math.min(1, 800 / Math.max(img.width, img.height))
  const c = document.createElement('canvas'); c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height); return c.toDataURL('image/webp', 0.8)
}

function QrCard({ b, wifi }: { b: BranchId; wifi: S['branches'][BranchId]['wifi'] }) {
  const url = branchUrl(b); const name = branches.find((x) => x.id === b)!.shortName.split(' — ')[0]
  const file = `tea-town-${b}-qr`
  return (
    <div className="space-y-3">
      <div className="printable w-[320px] rounded-3xl bg-ink p-5 text-center text-cream" data-card={b}>
        <div className="flex items-center justify-center gap-2"><img src="/assets/brand/arabic-logo-white.png" alt="" className="h-10" /><img src="/assets/brand/wordmark-white.png" alt="Tea Town" className="h-6" /></div>
        <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-orange">{name}</p>
        <div className="mx-auto mt-3 w-fit rounded-2xl bg-white p-2.5 ring-4 ring-orange"><QrImage text={url} size={170} /></div>
        <p className="display mt-3 flex items-center justify-center gap-2 text-2xl"><Nfc size={22} className="text-orange" />Tap or scan to explore.</p>
        {wifi.ssid ? (
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-orange p-2.5 text-start text-ink">
            <div className="rounded-lg bg-white p-1"><QrImage text={wifiString(wifi)} size={70} /></div>
            <div className="text-xs font-extrabold leading-snug">No mobile data? Connect to our Wi-Fi.<br /><span className="font-mono font-bold">{wifi.ssid}</span></div>
          </div>
        ) : <p className="mt-3 text-xs text-cream/60">No mobile data? Connect to our Wi-Fi. (add Wi-Fi details above)</p>}
      </div>
      <p className="break-all font-mono text-xs muted">NFC / QR URL: {url}</p>
      <div className="flex flex-wrap gap-2">
        <button onClick={async () => download(`${file}.png`, await (await fetch(await qrPng(url, 1200))).blob(), 'image/png')} className="btn-dark py-2 text-sm"><Download size={16} />PNG</button>
        <button onClick={async () => download(`${file}.svg`, await qrSvg(url), 'image/svg+xml')} className="btn-dark py-2 text-sm"><Download size={16} />SVG</button>
        <button onClick={() => { document.querySelectorAll('.printable').forEach((el) => el.classList.toggle('printable', (el as HTMLElement).dataset.card === b)); printOnly(); setTimeout(() => document.querySelectorAll('[data-card]').forEach((el) => el.classList.add('printable')), 600) }} className="btn-dark py-2 text-sm"><Printer size={16} />Print card</button>
      </div>
    </div>
  )
}

export default function Settings() {
  const s = useData(); const [d, setD] = useState<S>(structuredClone(s.settings)); const [msg, setMsg] = useState('')
  useEffect(() => setD(structuredClone(s.settings)), [s.settings])
  const up = (f: (x: S) => void) => setD((p) => { const n = structuredClone(p); f(n); return n })
  const save = async () => { const r = await saveSettings(d); setMsg(r.ok ? 'Saved.' : r.error); setTimeout(() => setMsg(''), 4000) }
  const [offer, setOffer] = useState<Offer | null>(null)
  const base = appUrl(); const prodUrl = base.startsWith('https://') && !/localhost|127\.0\.0\.1|-git-|-[a-z0-9]{9}-/.test(base)
  return (
    <div className="space-y-4 pb-20">
      <Section title="Branches, WhatsApp & Google review links">
        {branches.map((b) => { const c = d.branches[b.id]; return (
          <div key={b.id} className="grid gap-3 rounded-xl p-3 md:grid-cols-2" style={{ background: 'var(--panel2)' }}>
            <F label="Branch name"><input className="input" value={c.name} onChange={(e) => up((x) => { x.branches[b.id].name = e.target.value })} /></F>
            <F label="Phone"><input className="input" value={c.phone} onChange={(e) => up((x) => { x.branches[b.id].phone = e.target.value })} /></F>
            <F label="WhatsApp number (digits, with 971)"><input className="input" inputMode="numeric" value={c.whatsapp} onChange={(e) => up((x) => { x.branches[b.id].whatsapp = e.target.value.replace(/\D/g, '') })} /></F>
            <F label="Google review link"><input className="input" value={c.reviewUrl} onChange={(e) => up((x) => { x.branches[b.id].reviewUrl = e.target.value })} /></F>
          </div>) })}
      </Section>
      <Section title="Wi-Fi" note="Shown to customers on the Wi-Fi page and printed on the QR cards.">
        {branches.map((b) => { const w = d.branches[b.id].wifi; return (
          <div key={b.id} className="grid gap-3 rounded-xl p-3 md:grid-cols-3" style={{ background: 'var(--panel2)' }}>
            <p className="font-extrabold md:col-span-3">{b.shortName}</p>
            <F label="Network name (SSID)"><input className="input" value={w.ssid} onChange={(e) => up((x) => { x.branches[b.id].wifi.ssid = e.target.value })} /></F>
            <F label="Password"><input className="input" value={w.password} onChange={(e) => up((x) => { x.branches[b.id].wifi.password = e.target.value })} /></F>
            <F label="Security"><select className="input" value={w.security} onChange={(e) => up((x) => { x.branches[b.id].wifi.security = e.target.value as 'WPA' })}><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">Open (no password)</option></select></F>
            <div className="md:col-span-3"><F label="Instructions"><input className="input" value={w.instructions} onChange={(e) => up((x) => { x.branches[b.id].wifi.instructions = e.target.value })} /></F></div>
          </div>) })}
      </Section>
      <Section title="Menu PDF" note="Upload the PDF to the app's /assets/menu/ folder (or any https link on this site) and paste its path. Leave as is to use the built-in menu book.">
        <F label="Menu PDF path"><input className="input" value={d.menuPdfUrl} onChange={(e) => up((x) => { x.menuPdfUrl = e.target.value })} /></F>
      </Section>
      <Section title="Loyalty reward" note="One stamp per paid visit, added by staff. Customers cannot add stamps themselves.">
        <div className="grid gap-3 md:grid-cols-2">
          <F label="Stamps needed"><input className="input" type="number" min={2} max={20} value={d.loyalty.stampsForReward} onChange={(e) => up((x) => { x.loyalty.stampsForReward = Math.max(2, Math.min(20, Number(e.target.value) || 5)) })} /></F>
          <F label="Reward"><input className="input" value={d.loyalty.rewardName} maxLength={40} onChange={(e) => up((x) => { x.loyalty.rewardName = e.target.value })} /></F>
        </div>
        <Toggle on={d.loyalty.approved} onChange={(v) => up((x) => { x.loyalty.approved = v })} label="Reward approved by Tea Town management" />
        <Toggle on={d.loyalty.enabled} onChange={(v) => up((x) => { x.loyalty.enabled = v })} label="Loyalty switched on (staff can add stamps and redeem)" />
      </Section>
      <Section title="Feature visibility" note="Hide a button on the customer home screen.">
        <div className="grid gap-x-8 md:grid-cols-2">{(Object.keys(d.features) as (keyof S['features'])[]).map((k) => <Toggle key={k} on={d.features[k]} onChange={(v) => up((x) => { x.features[k] = v })} label={{ callStaff: 'Call staff', readyToPay: 'Ready to pay', feedback: 'Anonymous feedback', loyalty: 'Loyalty card', offers: "Today's offers", wifi: 'Wi-Fi', whatsapp: 'WhatsApp' }[k]} />)}</div>
      </Section>
      <div className="no-print sticky bottom-3 z-20 flex items-center gap-3"><button onClick={save} className="btn-primary shadow-xl"><Save size={18} />Save settings</button>{msg && <span className="rounded-lg bg-black/70 px-3 py-2 text-sm font-bold text-white">{msg}</span>}</div>

      <Section title="Today's offers" note="Expired or inactive offers disappear from the customer app automatically. Saved immediately.">
        <button onClick={() => setOffer({ id: uid(), title: '', description: '', branchId: 'all', expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), active: true, createdAt: new Date().toISOString() })} className="btn-dark"><Plus size={18} />Add offer</button>
        {offer && (
          <div className="grid gap-3 rounded-xl p-3 md:grid-cols-2" style={{ background: 'var(--panel2)' }}>
            <F label="Title"><input className="input" maxLength={60} value={offer.title} onChange={(e) => setOffer({ ...offer, title: e.target.value })} /></F>
            <F label="Expires"><input className="input" type="date" value={offer.expiresAt.slice(0, 10)} onChange={(e) => setOffer({ ...offer, expiresAt: new Date(`${e.target.value}T23:59:00`).toISOString() })} /></F>
            <div className="md:col-span-2"><F label="Short description"><input className="input" maxLength={200} value={offer.description} onChange={(e) => setOffer({ ...offer, description: e.target.value })} /></F></div>
            <F label="Branch"><select className="input" value={offer.branchId} onChange={(e) => setOffer({ ...offer, branchId: e.target.value as Offer['branchId'] })}><option value="all">Both branches</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.shortName}</option>)}</select></F>
            <F label="Image"><input className="input" type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setOffer({ ...offer, image: await toImage(f) }) }} /></F>
            {offer.image && <img src={offer.image} alt="" className="h-28 rounded-lg object-contain" />}
            <div className="flex gap-2 md:col-span-2"><button onClick={async () => { const r = await saveOffer(offer); if (r.ok) setOffer(null); else setMsg(r.error) }} className="btn-primary">Save offer</button><button onClick={() => setOffer(null)} className="btn-ghost">Cancel</button></div>
          </div>
        )}
        <div className="grid gap-2">
          {s.offers.map((o) => { const expired = new Date(o.expiresAt) < new Date(); return (
            <div key={o.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'var(--panel2)' }}>
              {o.image && <img src={o.image} alt="" className="h-12 w-12 rounded object-cover" />}
              <div className="flex-1"><p className="font-bold">{o.title}{o.example && ' (example)'}</p><p className="text-xs muted">{expired ? 'Expired' : `Until ${o.expiresAt.slice(0, 10)}`} · {o.branchId === 'all' ? 'Both branches' : o.branchId}</p></div>
              <Toggle on={o.active} onChange={(v) => saveOffer({ ...o, active: v })} label="" />
              <button onClick={() => setOffer(o)} className="btn-ghost px-3 py-2 text-sm">Edit</button>
              <button onClick={() => confirm('Delete this offer?') && deleteOffer(o.id)} className="btn-ghost px-3 py-2" aria-label="Delete"><Trash2 size={16} /></button>
            </div>) })}
        </div>
      </Section>

      <Section title="QR codes & NFC cards" note="One code per branch. NFC cards: write the same HTTPS URL as a URL (NDEF URI) record with any NFC writer app.">
        {!prodUrl && <p className="rounded-lg bg-gold/15 p-2 text-sm font-bold text-gold">Base URL: {base}. Print final cards only from the verified live address.</p>}
        <div className="flex flex-wrap gap-6">{branches.map((b) => <QrCard key={b.id} b={b.id} wifi={d.branches[b.id].wifi} />)}</div>
      </Section>
      {isDemo && <Section title="Demo data"><button onClick={() => confirm('Reset all demo data in this browser?') && resetDemo()} className="btn-ghost">Reset demo data</button></Section>}
    </div>
  )
}
