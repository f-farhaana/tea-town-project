import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { links } from '../config/site'
import { useBranch } from '../lib/branch'
import { WhatsAppIcon } from './Icons'
import { BranchPicker } from './BranchPicker'

export function WhatsAppFab() {
  const { branch, setBranch } = useBranch()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const c = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    window.addEventListener('keydown', k); window.addEventListener('mousedown', c)
    return () => { window.removeEventListener('keydown', k); window.removeEventListener('mousedown', c) }
  }, [open])

  return (
    <div ref={box} className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-40 md:bottom-6 md:left-6">
      {open && (
        <div role="dialog" aria-label="Contact Tea Town on WhatsApp" className="absolute bottom-[4.5rem] left-0 w-[min(20rem,calc(100vw-2rem))] animate-[pop_.35s_cubic-bezier(.2,.8,.2,1)] bg-ink p-5 shadow-[0_20px_60px_-10px_rgba(0,0,0,.8)] ring-1 ring-cream/15">
          <div className="mb-1 flex items-start justify-between">
            <p className="display text-2xl text-wa">WhatsApp us</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="-mr-1 -mt-1 grid h-9 w-9 place-items-center hover:text-orange"><X className="h-5 w-5" /></button>
          </div>
          <BranchPicker label="Which Tea Town branch would you like to contact?" onPick={(b) => { setBranch(b); setOpen(false); window.open(links.whatsapp(b), '_blank', 'noopener') }} />
        </div>
      )}
      {branch ? (
        <a href={links.whatsapp(branch)} target="_blank" rel="noopener" aria-label={`Chat with ${branch.name} on WhatsApp`} className="wa-fab grid h-14 w-14 place-items-center rounded-full bg-wa text-white shadow-lg shadow-black/40 transition hover:scale-105">
          <WhatsAppIcon className="h-8 w-8" />
        </a>
      ) : (
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Chat with Tea Town on WhatsApp" className="wa-fab grid h-14 w-14 place-items-center rounded-full bg-wa text-white shadow-lg shadow-black/40 transition hover:scale-105">
          <WhatsAppIcon className="h-8 w-8" />
        </button>
      )}
    </div>
  )
}
