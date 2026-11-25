import { useEffect } from 'react'
import { metaFor, absUrl, defaultOg } from '../config/routes'

/** Client-side head sync. Prerender injects the same tags into static HTML (scripts/prerender.mjs). */
export function useHead(path: string) {
  useEffect(() => {
    const m = metaFor(path)
    document.title = m.title
    const set = (sel: string, attr: string, val: string) => {
      let el = document.head.querySelector(sel) as HTMLElement | null
      if (!el) {
        el = document.createElement(sel.startsWith('link') ? 'link' : 'meta')
        const [, k, v] = sel.match(/\[(\w+)="([^"]+)"\]/) ?? []
        if (k) el.setAttribute(k, v)
        document.head.appendChild(el)
      }
      el.setAttribute(attr, val)
    }
    set('meta[name="description"]', 'content', m.description)
    set('link[rel="canonical"]', 'href', absUrl(m.path === '/404' ? '/' : m.path))
    set('meta[property="og:title"]', 'content', m.title)
    set('meta[property="og:description"]', 'content', m.description)
    set('meta[property="og:url"]', 'content', absUrl(m.path))
    set('meta[property="og:image"]', 'content', absUrl(m.image ?? defaultOg))
  }, [path])
}
