import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronsDown, SkipForward } from 'lucide-react'
import { site, type HeroVersion } from '../config/site'

/**
 * Scroll-controlled cinematic opening.
 *  - Version A (walk-in) / B (drive-through) chosen in site.hero.version (dev-only toggle in development).
 *  - Each segment plays extracted WebP frames from /frames/<seq>/ when listed in /frames/manifest.json,
 *    otherwise a photographic fallback built from the real storefront and burger/packaging photos.
 */

type Manifest = Partial<Record<(typeof site.hero.sequences)[number], { count: number; pattern?: string }>>
const SEG = { open: [0, 0.46], build: [0.46, 0.76], pack: [0.76, 0.92] } as const
const CAPTIONS: { text: string; at: [number, number]; pos: string; h1?: boolean }[] = [
  { text: 'Your cravings have an address.', at: [0, 0.13], pos: 'left-[6vw] bottom-[16vh] max-w-[11ch] md:max-w-[13ch]', h1: true },
  { text: 'Welcome to Tea Town.', at: [0.15, 0.29], pos: 'left-[6vw] top-[16vh] max-w-[9ch]' },
  { text: 'More than just tea.', at: [0.33, 0.46], pos: 'right-[6vw] bottom-[14vh] max-w-[9ch] text-right' },
  { text: 'Layer by layer. Flavour by flavour.', at: [0.5, 0.74], pos: 'left-[4vw] top-[14vh] max-w-[8ch] !text-[clamp(2.6rem,5.4vw,6rem)]' },
  { text: 'Big taste. Real value.', at: [0.78, 0.9], pos: 'right-[5vw] top-[14vh] max-w-[7ch] text-right' },
  { text: 'What are you craving today?', at: [0.92, 1.01], pos: 'inset-x-0 top-[38%] mx-auto text-center max-w-[12ch]' },
]

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const seg = (p: number, [a, b]: readonly [number, number]) => clamp((p - a) / (b - a))
const ease = (t: number) => 1 - Math.pow(1 - t, 3)
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const backOut = (t: number) => { const c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2) }

function load(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src })
}

class FrameSeq {
  imgs: (HTMLImageElement | null)[]
  name: string
  count: number
  pattern: string
  constructor(name: string, count: number, pattern = 'frame-%04d.webp') { this.name = name; this.count = count; this.pattern = pattern; this.imgs = Array(count).fill(null) }
  url(i: number) { return `/frames/${this.name}/${this.pattern.replace('%04d', String(i + 1).padStart(4, '0'))}` }
  async loadRange(from: number, to: number, step = 1) {
    for (let i = from; i < Math.min(to, this.count); i += step) if (!this.imgs[i]) this.imgs[i] = await load(this.url(i)).catch(() => null)
  }
  /** nearest loaded frame to index */
  get(i: number) {
    i = Math.round(clamp(i, 0, this.count - 1))
    for (let d = 0; d < this.count; d++) { const a = this.imgs[i - d]; if (a) return a; const b = this.imgs[i + d]; if (b) return b }
    return null
  }
  /** progressive: keyframes first (every 8th), then fill gaps */
  async progressive() { await this.loadRange(0, 12); await this.loadRange(0, this.count, 8); await this.loadRange(0, this.count, 2); await this.loadRange(0, this.count) }
}

export function CinematicHero() {
  const wrap = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const caps = useRef<(HTMLElement | null)[]>([])
  const hint = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<'cinematic' | 'static'>('cinematic')
  const [version, setVersion] = useState<HeroVersion>(site.hero.version)
  const [ready, setReady] = useState(false)

  // pick mode + dev override
  useEffect(() => {
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    if (rm || c?.saveData || /(^|-)2g$/.test(c?.effectiveType ?? '')) setMode('static')
    if (import.meta.env.DEV) { try { const v = localStorage.getItem('tt-hero-dev'); if (v === 'A' || v === 'B') setVersion(v) } catch { /* */ } }
  }, [])

  useEffect(() => {
    if (mode !== 'cinematic') return
    const cv = canvas.current!, ctx = cv.getContext('2d')!
    let W = 0, H = 0, raf = 0, alive = true
    let target = 0, cur = 0
    const assets: Record<string, HTMLImageElement> = {}
    const seqs: { open?: FrameSeq; build?: FrameSeq; pack?: FrameSeq } = {}
    const off = document.createElement('canvas'), octx = off.getContext('2d')!

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2)
      W = cv.clientWidth; H = cv.clientHeight
      cv.width = off.width = Math.round(W * dpr); cv.height = off.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); octx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    // ---------- drawing helpers ----------
    const cover = (c: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, scale = 1, fx = 0.5, fy = 0.5, dx = 0, dy = 0) => {
      const s = Math.max(W / img.width, H / img.height) * scale
      const w = img.width * s, h = img.height * s
      c.drawImage(img, W / 2 - fx * w + dx, H / 2 - fy * h + dy, w, h)
    }
    const studio = (c: CanvasRenderingContext2D, glow = 1) => {
      c.fillStyle = '#060606'; c.fillRect(0, 0, W, H)
      const g1 = c.createRadialGradient(-W * 0.04, H * 0.5, 0, -W * 0.04, H * 0.5, W * 0.42)
      g1.addColorStop(0, `rgba(255,88,28,${0.3 * glow})`); g1.addColorStop(1, 'rgba(255,88,28,0)')
      const g2 = c.createRadialGradient(W * 1.04, H * 0.45, 0, W * 1.04, H * 0.45, W * 0.38)
      g2.addColorStop(0, `rgba(255,88,28,${0.26 * glow})`); g2.addColorStop(1, 'rgba(255,88,28,0)')
      const g3 = c.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.min(W, H) * 0.55)
      g3.addColorStop(0, `rgba(255,214,160,${0.1 * glow})`); g3.addColorStop(1, 'rgba(255,214,160,0)')
      c.fillStyle = g1; c.fillRect(0, 0, W, H); c.fillStyle = g2; c.fillRect(0, 0, W, H); c.fillStyle = g3; c.fillRect(0, 0, W, H)
      // platform
      const py = H * 0.8
      const pg = c.createRadialGradient(W / 2, py, 0, W / 2, py, W * 0.32)
      pg.addColorStop(0, `rgba(255,120,50,${0.28 * glow})`); pg.addColorStop(1, 'rgba(255,120,50,0)')
      c.save(); c.translate(W / 2, py); c.scale(1, 0.12); c.translate(-W / 2, -py); c.fillStyle = pg; c.beginPath(); c.arc(W / 2, py, W * 0.32, 0, Math.PI * 2); c.fill(); c.restore()
    }
    const vignette = (c: CanvasRenderingContext2D, a = 0.65) => {
      const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75)
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); c.fillStyle = g; c.fillRect(0, 0, W, H)
    }

    // storefront camera: entrance centre in night photo ≈ (0.555, 0.64)
    const ENTR = { x: 0.555, y: 0.64 }
    const storefront = (c: CanvasRenderingContext2D, zoom: number, drift = 0) => {
      const img = assets.night
      const fx = 0.5 + (ENTR.x - 0.5) * clamp((zoom - 1) / 1.6), fy = 0.5 + (ENTR.y - 0.5) * clamp((zoom - 1) / 1.6)
      cover(c, img, zoom, fx, fy, drift, 0)
    }

    const driveScene = (c: CanvasRenderingContext2D, t: number) => {
      // t 0..1 : approach from distance, stop
      const img = assets.night
      c.fillStyle = '#050505'; c.fillRect(0, 0, W, H)
      const k = easeIO(t)
      const bob = Math.sin(t * 40) * (1 - k) * 2.2
      // the storefront grows from a distant framed view to cover
      const s0 = 0.5, scale = s0 + (1 - s0) * k
      const sCover = Math.max(W / img.width, H / img.height) * scale
      const w = img.width * sCover, h = img.height * sCover
      const x = W / 2 - w / 2, y = H * (0.52 - 0.02 * k) - h / 2 + bob
      c.save(); c.globalAlpha = 0.35 + 0.65 * ease(clamp(t * 2.5)); c.drawImage(img, x, y, w, h); c.restore()
      // feather edges into night while far away
      const edge = 1 - k
      if (edge > 0.01) {
        const gl = c.createLinearGradient(x, 0, x + w * 0.25, 0); gl.addColorStop(0, `rgba(5,5,5,${edge})`); gl.addColorStop(1, 'rgba(5,5,5,0)'); c.fillStyle = gl; c.fillRect(x - 2, y, w * 0.25, h)
        const gr = c.createLinearGradient(x + w, 0, x + w * 0.75, 0); gr.addColorStop(0, `rgba(5,5,5,${edge})`); gr.addColorStop(1, 'rgba(5,5,5,0)'); c.fillStyle = gr; c.fillRect(x + w * 0.75, y, w * 0.25 + 2, h)
        const gt = c.createLinearGradient(0, y, 0, y + h * 0.3); gt.addColorStop(0, `rgba(5,5,5,${edge})`); gt.addColorStop(1, 'rgba(5,5,5,0)'); c.fillStyle = gt; c.fillRect(x, y - 2, w, h * 0.3)
        // road
        const ry = y + h - 2
        const rg = c.createLinearGradient(0, ry, 0, H); rg.addColorStop(0, '#141210'); rg.addColorStop(1, '#050505'); c.fillStyle = rg; c.fillRect(0, ry, W, H - ry)
        c.strokeStyle = `rgba(255,245,229,${0.25 * edge})`; c.lineWidth = 3; c.setLineDash([24, 30]); c.lineDashOffset = -t * 900
        c.beginPath(); c.moveTo(W / 2, ry); c.lineTo(W / 2, H); c.stroke(); c.setLineDash([])
        // orange light spill on road
        const sp = c.createRadialGradient(W / 2, ry, 0, W / 2, ry, w * 0.5); sp.addColorStop(0, `rgba(255,88,28,${0.25 * edge})`); sp.addColorStop(1, 'rgba(255,88,28,0)'); c.fillStyle = sp; c.fillRect(0, ry, W, H - ry)
      }
    }
    const cabin = (c: CanvasRenderingContext2D, out: number, t: number) => {
      // windshield, pillars and dashboard; `out` 0..1 = camera leaves the vehicle
      if (out >= 1) return
      const o = easeIO(out)
      c.save()
      // windshield reflection streaks
      c.globalAlpha = (1 - o) * 0.55
      const rx = ((t * 1.6) % 1.4 - 0.2) * W
      const rg = c.createLinearGradient(rx - W * 0.15, 0, rx + W * 0.15, H); rg.addColorStop(0, 'rgba(255,255,255,0)'); rg.addColorStop(0.5, 'rgba(255,190,140,0.12)'); rg.addColorStop(1, 'rgba(255,255,255,0)')
      c.fillStyle = rg; c.fillRect(0, 0, W, H)
      c.globalAlpha = 1
      // A-pillars
      c.fillStyle = '#020202'
      const px = W * 0.13 * (1 - o) + 1
      c.beginPath(); c.moveTo(-W * 0.3 * o, 0); c.lineTo(px + W * 0.05 - W * 0.3 * o, 0); c.lineTo(px - W * 0.06 - W * 0.3 * o, H); c.lineTo(-W * 0.3 * o, H); c.fill()
      c.beginPath(); c.moveTo(W + W * 0.3 * o, 0); c.lineTo(W - px - W * 0.05 + W * 0.3 * o, 0); c.lineTo(W - px + W * 0.06 + W * 0.3 * o, H); c.lineTo(W + W * 0.3 * o, H); c.fill()
      // roof edge
      c.fillRect(0, -H * 0.1 * o, W, H * 0.06)
      // dashboard
      const dy = H * 0.76 + H * 0.4 * o
      c.beginPath(); c.moveTo(0, dy + H * 0.05); c.quadraticCurveTo(W * 0.5, dy - H * 0.07, W, dy + H * 0.05); c.lineTo(W, H + H); c.lineTo(0, H + H); c.closePath()
      const dg = c.createLinearGradient(0, dy - H * 0.05, 0, H); dg.addColorStop(0, '#1a1614'); dg.addColorStop(0.15, '#070707'); c.fillStyle = dg; c.fill()
      // instrument glow
      c.globalAlpha = 1 - o
      const ig = c.createRadialGradient(W * 0.3, dy + H * 0.12, 0, W * 0.3, dy + H * 0.12, W * 0.12); ig.addColorStop(0, 'rgba(255,88,28,0.35)'); ig.addColorStop(1, 'rgba(255,88,28,0)'); c.fillStyle = ig; c.fillRect(0, dy, W, H)
      c.restore()
    }

    const doorReveal = (open: number, sceneDraw: (c: CanvasRenderingContext2D) => void) => {
      // render the storefront view to offscreen, split at the centre and slide halves apart over the studio
      sceneDraw(octx)
      studio(ctx, clamp(open * 1.5))
      const o = easeIO(open)
      const dpr = off.width / W
      const half = off.width / 2
      ctx.save(); ctx.globalAlpha = 1 - clamp((open - 0.75) * 4)
      ctx.drawImage(off, 0, 0, half, off.height, -o * W * 0.55, 0, W / 2, H)
      ctx.drawImage(off, half, 0, half, off.height, W / 2 + o * W * 0.55, 0, W / 2, H)
      ctx.restore()
      // light spill through the gap
      if (o > 0 && o < 1) {
        const gw = o * W * 1.1
        const g = ctx.createLinearGradient(W / 2 - gw / 2, 0, W / 2 + gw / 2, 0)
        g.addColorStop(0, 'rgba(255,88,28,0)'); g.addColorStop(0.5, `rgba(255,140,70,${0.35 * (1 - o)})`); g.addColorStop(1, 'rgba(255,88,28,0)')
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      }
      void dpr
    }

    // burger layers: bottom, lettuce, patty-cheese, top (800x480 each, same registration)
    const burgerRect = (scale = 1) => {
      const bw = Math.min(W * (W < 768 ? 0.92 : 0.46), H * 0.8 * (800 / 480), 860) * scale
      const bh = bw * (480 / 800)
      const cx = W * (W < 768 ? 0.5 : 0.56)
      return { bw, bh, cx, x: cx - bw / 2, y: H * 0.5 - bh / 2 }
    }
    const drawBurger = (t: number, lift = 0, scale = 1) => {
      const { bw, bh, x, y } = burgerRect(scale)
      const L = ['l1', 'l2', 'l3', 'l4']
      L.forEach((k, i) => {
        const st = i * 0.2, lt = ease(clamp((t - st) / 0.34))
        if (lt <= 0) return
        const fall = (1 - backOut(clamp((t - st) / 0.34))) * -H * 0.55
        const spread = (1 - ease(clamp((t - 0.55) / 0.4))) * (i - 1.5) * bh * 0.07
        ctx.save(); ctx.globalAlpha = clamp(lt * 1.6)
        ctx.drawImage(assets[k], x, y + fall - spread - lift, bw, bh)
        ctx.restore()
      })
      // steam wisps once complete
      if (t > 0.9) {
        ctx.save(); ctx.globalAlpha = (t - 0.9) * 2.5; ctx.strokeStyle = 'rgba(255,245,229,0.18)'; ctx.lineWidth = 2
        for (let s = 0; s < 3; s++) { const sx = x + bw / 2 + (s - 1) * bw * 0.16; ctx.beginPath(); ctx.moveTo(sx, y - lift + bh * 0.05); ctx.bezierCurveTo(sx - 18, y - lift - 30, sx + 18, y - lift - 60, sx, y - lift - 95); ctx.stroke() }
        ctx.restore()
      }
    }
    const drawPackaging = (t: number) => {
      // box rises, burger descends onto it, composition settles (mirrors the real product photo)
      const k = easeIO(t)
      const scale = 1 - 0.18 * k
      const { bw, bh, cx, x, y } = burgerRect(scale)
      const box = assets.box
      const boxW = bw * 0.98, boxH = boxW * (box.height / box.width)
      const boxYFinal = y + bh * 0.86
      const boxY = H + 20 + (boxYFinal - H - 20) * ease(clamp(t * 1.4))
      const burgerY = -H * 0.06 * (1 - k) + (H * 0.02) * k
      // burger layers fully assembled
      for (const k2 of ['l1', 'l2', 'l3', 'l4']) ctx.drawImage(assets[k2], x, y + burgerY - H * 0.05 * k, bw, bh)
      // box with soft orange rim
      ctx.save(); ctx.shadowColor = 'rgba(255,88,28,0.45)'; ctx.shadowBlur = 40 * k
      ctx.drawImage(box, cx - boxW / 2, boxY - H * 0.05 * k, boxW, boxH)
      ctx.restore()
    }

    const drawFrameSeq = (s: FrameSeq, t: number) => { const f = s.get(t * (s.count - 1)); if (f) { cover(ctx, f); return true } return false }

    // ---------- main render ----------
    const render = (p: number) => {
      if (!assets.night) return
      ctx.clearRect(0, 0, W, H)
      const to = seg(p, SEG.open)
      if (p < SEG.open[1]) {
        if (seqs.open && drawFrameSeq(seqs.open, to)) { /* frames */ }
        else if (version === 'B') {
          const drive = clamp(to / 0.5), out = clamp((to - 0.48) / 0.22), zoom = 1 + 1.8 * easeIO(clamp((to - 0.55) / 0.3)), open = clamp((to - 0.8) / 0.2)
          const scene = (c: CanvasRenderingContext2D) => {
            if (to < 0.55) driveScene(c, drive)
            else { c.fillStyle = '#050505'; c.fillRect(0, 0, W, H); storefront(c, zoom) }
            if (c === ctx) cabin(c, out, drive)
          }
          if (open > 0) doorReveal(open, scene)
          else { scene(ctx); vignette(ctx, 0.55) }
        } else {
          const zoom = 1 + 1.9 * easeIO(clamp(to / 0.8)), open = clamp((to - 0.78) / 0.22)
          const scene = (c: CanvasRenderingContext2D) => { c.fillStyle = '#050505'; c.fillRect(0, 0, W, H); storefront(c, zoom, Math.sin(to * 9) * 2) }
          if (open > 0) doorReveal(open, scene)
          else { scene(ctx); vignette(ctx, 0.55) }
        }
      } else if (p < SEG.build[1]) {
        const t = seg(p, SEG.build)
        if (!(seqs.build && drawFrameSeq(seqs.build, t))) { studio(ctx); if (assets.l4) drawBurger(t) }
      } else {
        const t = seg(p, SEG.pack)
        if (seqs.pack && drawFrameSeq(seqs.pack, t)) {
          // The generated clip's bun differs from the real Tea Town bun: settle on the composition
          // built from the actual product + packaging photograph for the final hero frame.
          // dip to the studio first (no double exposure), then bring in the real composition
          const dip = easeIO(clamp((t - 0.62) / 0.12)), real = easeIO(clamp((t - 0.74) / 0.14))
          if (dip > 0) { ctx.save(); ctx.globalAlpha = dip; studio(ctx); ctx.restore() }
          if (real > 0 && assets.box) { ctx.save(); ctx.globalAlpha = real; drawPackaging(1); ctx.restore() }
        } else { studio(ctx); if (assets.box) drawPackaging(t) }
        // final transition to orange
        const f = clamp((p - 0.93) / 0.07)
        if (f > 0) { ctx.fillStyle = `rgba(255,88,28,${easeIO(f) * 0.92})`; ctx.fillRect(0, 0, W, H) }
      }
      // captions
      CAPTIONS.forEach((c, i) => {
        const el = caps.current[i]
        if (!el) return
        const [a, b] = c.at, span = b - a, fade = Math.min(0.03, span / 4)
        const o = p < a ? 0 : p > b ? 0 : Math.min(1, (p - a) / fade, (b - p) / fade)
        const vis = i === 0 && p <= 0.001 ? 1 : o
        el.style.opacity = String(vis)
        el.style.setProperty('--ty', `${(1 - vis) * 28}px`)
        el.style.setProperty('--clip', `${(1 - clamp(vis * 1.4)) * 100}%`)
      })
      if (hint.current) hint.current.style.opacity = String(1 - clamp(p * 25))
    }

    const loop = () => {
      if (!alive) return
      const d = target - cur
      cur += Math.abs(d) < 0.0005 ? d : d * 0.14
      render(cur)
      raf = requestAnimationFrame(loop)
    }

    let st: { kill: () => void } | null = null
    ;(async () => {
      resize()
      // first paint: the real night storefront, as soon as possible
      assets.night = await load('/assets/storefront/night.webp')
      if (!alive) return
      render(0); setReady(true)
      const [gsapMod, stMod] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      const gsap = gsapMod.gsap, ScrollTrigger = stMod.ScrollTrigger
      gsap.registerPlugin(ScrollTrigger)
      const trig = ScrollTrigger.create({ trigger: wrap.current!, start: 'top top', end: 'bottom bottom', onUpdate: (s) => { target = s.progress } })
      st = trig
      target = trig.progress
      raf = requestAnimationFrame(loop)
      // manifest of extracted frames (only the selected opening version is loaded)
      const man: Manifest = await fetch('/frames/manifest.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}))
      const openName = version === 'B' ? 'drive-through' : 'walk-in'
      const mk = (n: keyof Manifest) => (man[n]?.count ? new FrameSeq(n, man[n]!.count, man[n]!.pattern) : undefined)
      seqs.open = mk(openName); seqs.build = mk('burger-assembly'); seqs.pack = mk('packaging')
      if (seqs.open) await seqs.open.loadRange(0, 12)
      // fallback assets
      const [l1, l2, l3, l4, box] = await Promise.all(['1-bottom-bun', '2-lettuce', '3-patty-cheese', '4-top-bun'].map((n) => load(`/assets/products/layers/${n}.webp`)).concat(load('/assets/products/packaging-box.webp')))
      Object.assign(assets, { l1, l2, l3, l4, box })
      const idle = (fn: () => void) => ('requestIdleCallback' in window ? (window as Window & { requestIdleCallback: (f: () => void) => void }).requestIdleCallback(fn) : setTimeout(fn, 200))
      idle(() => { seqs.open?.progressive(); setTimeout(() => { seqs.build?.progressive(); seqs.pack?.progressive() }, 1500) })
    })()

    const ro = new ResizeObserver(() => { resize(); render(cur) })
    ro.observe(cv)
    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); st?.kill() }
  }, [mode, version])

  const skip = () => {
    const el = wrap.current
    if (el) window.scrollTo({ top: el.offsetTop + el.offsetHeight - window.innerHeight * 0.02, behavior: 'smooth' })
  }

  if (mode === 'static')
    return (
      <section className="grain relative isolate flex min-h-[100svh] items-end overflow-hidden pb-20 pt-32" aria-label="Welcome to Tea Town">
        <img src="/assets/storefront/night.webp" alt="Tea Town storefront at night, Jabal Al Noor, Sharjah" className="absolute inset-0 -z-20 h-full w-full object-cover" fetchPriority="high" width={1360} height={628} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/50 to-ink/10" />
        <div className="wrap">
          <h1 className="display max-w-[12ch] text-[clamp(3.6rem,10vw,10rem)]">Your cravings have an address.</h1>
          <p className="mt-6 max-w-xl text-lg text-cream/80">Tea Town, Sharjah. Karak, burgers, shawarma, loaded fries and so much more.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link to="/menu" className="btn-orange">View Menu</Link><Link to="/all-items" className="btn-ghost">Explore All Items</Link></div>
        </div>
      </section>
    )

  return (
    <section ref={wrap} className="relative" style={{ height: `${site.hero.scrollVh * 100}svh` }} aria-label="Tea Town cinematic introduction">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-ink">
        {/* first paint fallback image so LCP never waits for canvas */}
        <img src="/assets/storefront/night.webp" alt="" aria-hidden className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready ? 'opacity-0' : 'opacity-100'}`} fetchPriority="high" width={1360} height={628} />
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" role="img" aria-label="Scroll-controlled film: arriving at the Tea Town storefront at night, the doors open to a black and orange studio where the signature burger assembles and settles onto Tea Town packaging." />
        <div className="grain pointer-events-none absolute inset-0" />
        {CAPTIONS.map((c, i) => {
          const Tag = c.h1 ? 'h1' : 'p'
          return (
            <Tag key={c.text} ref={(el: HTMLElement | null) => { caps.current[i] = el }} style={{ opacity: i === 0 ? 1 : 0, transform: 'translateY(var(--ty,0))', clipPath: 'inset(0 0 var(--clip,0%) 0)' }}
              className={`display pointer-events-none absolute text-[clamp(2.8rem,6.4vw,7rem)] text-cream drop-shadow-[0_4px_30px_rgba(0,0,0,.55)] ${c.pos} ${i === 5 ? '!text-ink !drop-shadow-none' : ''}`}>
              {c.h1 && <span className="sr-only">Tea Town Sharjah — </span>}{c.text}
            </Tag>
          )
        })}
        <div ref={hint} className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-cream/80">
          <span className="eyebrow">Scroll to drive in</span><ChevronsDown className="h-5 w-5 animate-bounce" aria-hidden />
        </div>
        <button type="button" onClick={skip} className="absolute bottom-6 right-5 z-10 flex items-center gap-2 bg-ink/60 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-cream/85 backdrop-blur hover:text-orange md:right-8">
          Skip intro <SkipForward className="h-4 w-4" aria-hidden />
        </button>
        {import.meta.env.DEV && (
          <div className="absolute left-4 top-24 z-10 flex gap-1 bg-ink/80 p-1 text-xs font-bold" aria-label="Development hero toggle">
            {(['A', 'B'] as const).map((v) => (
              <button key={v} type="button" onClick={() => { try { localStorage.setItem('tt-hero-dev', v) } catch { /* */ } setVersion(v) }} className={`px-3 py-1.5 ${version === v ? 'bg-orange text-ink' : 'text-cream'}`}>
                DEV · Version {v} {v === 'A' ? 'Walk-in' : 'Drive-in'}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
