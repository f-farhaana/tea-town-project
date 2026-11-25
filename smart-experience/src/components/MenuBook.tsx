import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Minimize2, Download, Printer } from 'lucide-react'
import { useData } from '../lib/store'
import { categories, byCategory } from '../shared/menu'

/**
 * Menu book viewer. Source priority:
 *  1. /assets/menu/pages/manifest.json  → pre-rendered WebP page images (fastest, offline-cached)
 *  2. pdfUrl                     → rendered on demand with PDF.js
 *  3. built-in data book                → typeset from src/data/menu.ts (no PDF supplied yet)
 */
type Source = { kind: 'images'; pages: string[] } | { kind: 'pdf'; count: number } | { kind: 'data' } | null

type DataPage = { type: 'cover' } | { type: 'cat'; id: string; name: string; arabic?: string; blurb: string; items: string[]; part: number } | { type: 'back' }
const dataPages: DataPage[] = [
  { type: 'cover' },
  ...categories.flatMap((c) => {
    const items = byCategory(c.id).map((m) => m.name)
    const chunks: string[][] = []
    for (let i = 0; i < items.length; i += 12) chunks.push(items.slice(i, i + 12))
    return chunks.map((ch, i) => ({ type: 'cat' as const, id: c.id, name: c.name, arabic: c.arabic, blurb: c.blurb, items: ch, part: i }))
  }),
  { type: 'back' },
]

function DataPageView({ page, n }: { page: DataPage; n: number }) {
  if (page.type === 'cover')
    return (
      <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-gold p-8 text-ink">
        <img src="/assets/brand/calligraphy-pattern.png" alt="" className="absolute inset-x-0 bottom-0 w-full opacity-30 invert" />
        <img src="/assets/brand/arabic-logo-black.png" alt="" className="relative w-2/5" />
        <p className="display relative mt-6 text-5xl md:text-6xl">Menu</p>
        <p className="relative mt-2 text-xs font-extrabold uppercase tracking-[0.3em]">Tea Town · Sharjah</p>
      </div>
    )
  if (page.type === 'back')
    return (
      <div className="flex h-full flex-col justify-between bg-ink p-8 text-cream">
        <img src="/assets/brand/arabic-logo-white.png" alt="" className="w-1/3" />
        <div>
          <p className="display text-4xl text-orange">Prices at the counter.</p>
          <p className="mt-3 text-sm text-cream/70">This digital menu lists item names from Tea Town&rsquo;s published menu plus newly introduced items. For prices and today&rsquo;s availability, call or WhatsApp your branch.</p>
        </div>
        <p className="text-xs text-cream/50">teatown.ae · @teatownuae</p>
      </div>
    )
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-cream p-6 text-ink md:p-8">
      <img src="/assets/brand/arabic-logo-black.png" alt="" className="pointer-events-none absolute -bottom-8 -right-8 w-1/2 opacity-[0.06]" />
      <div className="flex items-baseline justify-between border-b-2 border-ink pb-3">
        <h3 className="display text-3xl text-orange md:text-4xl">{page.name}{page.part ? ' (cont.)' : ''}</h3>
        {page.arabic && <span className="font-ar text-lg font-bold" lang="ar" dir="rtl">{page.arabic}</span>}
      </div>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] opacity-60">{page.blurb}</p>
      <ul className="mt-4 flex-1 space-y-[0.4rem] text-[13px] font-semibold md:text-sm">
        {page.items.map((it) => <li key={it} className="flex items-baseline gap-2"><span>{it}</span><span className="flex-1 border-b border-dotted border-ink/30" /></li>)}
      </ul>
      <p className="mt-3 text-right text-[10px] font-bold opacity-50">{n}</p>
    </div>
  )
}

export function MenuBook() {
  const pdfUrl = useData().settings.menuPdfUrl
  const [src, setSrc] = useState<Source>(null)
  const [page, setPage] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [fs, setFs] = useState(false)
  const [turn, setTurn] = useState<'next' | 'prev' | null>(null)
  const [spread, setSpread] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const pdfRef = useRef<{ getPage: (n: number) => Promise<unknown> } | null>(null)
  const [pdfUrls, setPdfUrls] = useState<Record<number, string>>({})

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const on = () => setSpread(mq.matches); on(); mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // detect source
  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch('/assets/menu/pages/manifest.json')
        if (r.ok && r.headers.get('content-type')?.includes('json')) { const m = await r.json(); if (m.pages?.length) return setSrc({ kind: 'images', pages: m.pages }) }
      } catch { /* */ }
      try {
        const r = await fetch(pdfUrl, { method: 'HEAD' })
        if (r.ok && r.headers.get('content-type')?.includes('pdf')) {
          const pdfjs = await import('pdfjs-dist')
          const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
          pdfjs.GlobalWorkerOptions.workerSrc = worker.default
          const doc = await pdfjs.getDocument({ url: pdfUrl }).promise
          pdfRef.current = doc as never
          return setSrc({ kind: 'pdf', count: doc.numPages })
        }
      } catch { /* */ }
      setSrc({ kind: 'data' })
    })()
  }, [pdfUrl])

  const count = src?.kind === 'images' ? src.pages.length : src?.kind === 'pdf' ? src.count : dataPages.length
  const step = spread ? 2 : 1

  // render pdf pages lazily (current + neighbours)
  useEffect(() => {
    if (src?.kind !== 'pdf' || !pdfRef.current) return
    const want = [page, page + 1, page + 2, page - 1].filter((p) => p >= 0 && p < src.count && !pdfUrls[p])
    want.forEach(async (p) => {
      const pg = (await pdfRef.current!.getPage(p + 1)) as { getViewport: (o: { scale: number }) => { width: number; height: number }; render: (o: object) => { promise: Promise<void> } }
      const vp = pg.getViewport({ scale: 2 })
      const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height
      await pg.render({ canvasContext: c.getContext('2d')!, viewport: vp, canvas: c }).promise
      const url = c.toDataURL('image/webp', 0.85)
      setPdfUrls((u) => ({ ...u, [p]: url }))
    })
  }, [src, page, pdfUrls])

  const go = useCallback((d: 1 | -1) => {
    setPage((p) => {
      const np = Math.max(0, Math.min(count - 1, p + d * step))
      if (np !== p) { setTurn(d > 0 ? 'next' : 'prev'); setTimeout(() => setTurn(null), 600) }
      return np
    })
  }, [count, step, spread])

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.target as HTMLElement)?.tagName === 'INPUT') return; if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1) }
    window.addEventListener('keydown', k)
    const f = () => setFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', f)
    return () => { window.removeEventListener('keydown', k); document.removeEventListener('fullscreenchange', f) }
  }, [go])

  // swipe
  const sx = useRef<number | null>(null)
  const onTS = (e: React.TouchEvent) => { if (zoom === 1) sx.current = e.touches[0].clientX }
  const onTE = (e: React.TouchEvent) => { if (sx.current == null) return; const dx = e.changedTouches[0].clientX - sx.current; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); sx.current = null }

  const toggleFs = () => { if (document.fullscreenElement) document.exitFullscreen(); else box.current?.requestFullscreen?.().catch(() => {}) }

  const renderPage = (i: number) => {
    if (i < 0 || i >= count) return <div className="h-full bg-transparent" />
    if (src?.kind === 'images') return <img src={src.pages[i]} alt={`Tea Town menu page ${i + 1}`} className="h-full w-full bg-cream object-contain" loading={Math.abs(i - page) < 3 ? 'eager' : 'lazy'} />
    if (src?.kind === 'pdf') return pdfUrls[i] ? <img src={pdfUrls[i]} alt={`Tea Town menu page ${i + 1}`} className="h-full w-full bg-cream object-contain" /> : <div className="grid h-full place-items-center bg-cream text-ink/50">Loading page {i + 1}…</div>
    return <DataPageView page={dataPages[i]} n={i + 1} />
  }

  // in spread mode: page 0 alone on the right (cover), then pairs (1,2), (3,4)…
  const left = spread ? (page === 0 ? -1 : page % 2 === 1 ? page : page - 1) : page
  const right = spread ? (page === 0 ? 0 : left + 1) : -1
  const label = spread ? (page === 0 ? '1' : `${left + 1}${right < count ? `–${right + 1}` : ''}`) : `${page + 1}`

  return (
    <div ref={box} className={`relative flex flex-col bg-charcoal ${fs ? 'h-screen' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream/10 px-3 py-2 md:px-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cream/70" aria-live="polite">Page {label} / {count}</p>
        <div className="flex items-center gap-1">
          <label className="sr-only" htmlFor="pgsel">Go to page</label>
          <select id="pgsel" value={page} onChange={(e) => setPage(Number(e.target.value))} className="bg-ink px-2 py-2 text-xs font-bold text-cream">
            {Array.from({ length: count }, (_, i) => <option key={i} value={i}>{src?.kind === 'data' && dataPages[i].type === 'cat' ? `${i + 1}. ${(dataPages[i] as { name: string }).name}` : `Page ${i + 1}`}</option>)}
          </select>
          <button type="button" onClick={() => setZoom((z) => Math.max(1, z - 0.5))} disabled={zoom <= 1} aria-label="Zoom out" className="grid h-10 w-10 place-items-center hover:text-orange disabled:opacity-30"><ZoomOut className="h-5 w-5" /></button>
          <button type="button" onClick={() => setZoom((z) => Math.min(3, z + 0.5))} disabled={zoom >= 3} aria-label="Zoom in" className="grid h-10 w-10 place-items-center hover:text-orange disabled:opacity-30"><ZoomIn className="h-5 w-5" /></button>
          <button type="button" onClick={toggleFs} aria-label={fs ? 'Exit full screen' : 'Full screen'} className="grid h-10 w-10 place-items-center hover:text-orange">{fs ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}</button>
          {src?.kind === 'data'
            ? <button type="button" onClick={() => { document.body.classList.add('print-menu'); window.print(); setTimeout(() => document.body.classList.remove('print-menu'), 500) }} className="ml-1 flex items-center gap-2 bg-orange px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-ink hover:bg-cream"><Printer className="h-4 w-4" aria-hidden />Save PDF</button>
            : <a href={pdfUrl} download="Tea-Town-Menu.pdf" className="ml-1 flex items-center gap-2 bg-orange px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-ink hover:bg-cream"><Download className="h-4 w-4" aria-hidden />Download</a>}
        </div>
      </div>

      <div className={`relative flex-1 overflow-auto ${fs ? '' : 'h-[min(78svh,880px)]'}`} onTouchStart={onTS} onTouchEnd={onTE}>
        {!src ? (
          <div className="grid h-full place-items-center text-cream/60">Opening the menu…</div>
        ) : (
          <div className="flex h-full min-h-full items-center justify-center p-4 md:p-8" style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}>
            <div className={`book relative flex h-full max-h-full ${spread ? 'aspect-[1.414/1]' : 'aspect-[1/1.414]'} max-w-full shadow-[0_30px_80px_-20px_rgba(0,0,0,.9)] ${turn ? `turn-${turn}` : ''}`}>
              {spread ? (
                <>
                  <div className="page-l relative h-full w-1/2 overflow-hidden">{renderPage(left)}</div>
                  <div className="page-r relative h-full w-1/2 overflow-hidden">{renderPage(right)}</div>
                  <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-10 -translate-x-1/2 bg-gradient-to-r from-transparent via-black/25 to-transparent" />
                </>
              ) : (
                <div className="page-r relative h-full w-full overflow-hidden">{renderPage(page)}</div>
              )}
            </div>
          </div>
        )}
        <button type="button" onClick={() => go(-1)} disabled={page === 0} aria-label="Previous page" className="absolute left-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-ink/80 text-cream hover:bg-orange hover:text-ink disabled:opacity-0 md:left-4"><ChevronLeft /></button>
        <button type="button" onClick={() => go(1)} disabled={spread ? right >= count - 1 : page >= count - 1} aria-label="Next page" className="absolute right-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-ink/80 text-cream hover:bg-orange hover:text-ink disabled:opacity-0 md:right-4"><ChevronRight /></button>
      </div>

      {/* print-only full book (used for "Save PDF" when no PDF file is installed) */}
      {src?.kind === 'data' && (
        <div className="print-book hidden">
          {dataPages.map((p, i) => <div key={i} className="print-page"><DataPageView page={p} n={i + 1} /></div>)}
        </div>
      )}
    </div>
  )
}
