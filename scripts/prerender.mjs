// Static prerender: renders every route to its own index.html with unique head tags + JSON-LD,
// then writes sitemap.xml, robots.txt and 404.html. Run after `vite build` and the SSR build.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const { render, routes, notFoundMeta, absUrl, defaultOg } = await import(pathToFileURL(path.join(root, 'dist-ssr/entry-server.js')).href)
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const gsc = process.env.VITE_GSC_VERIFICATION
const ga = process.env.VITE_GA4_ID

function head(m) {
  const url = absUrl(m.path === '/404' ? '/' : m.path)
  return [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    m.path === '/404' ? '<meta name="robots" content="noindex" />' : `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Tea Town" />`,
    `<meta property="og:locale" content="en_AE" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    `<meta property="og:url" content="${absUrl(m.path)}" />`,
    `<meta property="og:image" content="${absUrl(m.image ?? defaultOg)}" />`,
    `<meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    gsc ? `<meta name="google-site-verification" content="${esc(gsc)}" />` : '',
    ga ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(ga)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(ga)}');</script>` : '',
    ...(m.jsonLd ?? []).map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`),
  ].filter(Boolean).join('\n    ')
}

async function page(m, url, out) {
  let app = await render(url)
  // React hoists resource hints (<link rel=preload>) to the start of the output: move them into <head>
  const hints = (app.match(/^(?:<link[^>]*>)+/) ?? [''])[0]
  app = app.slice(hints.length)
  const html = template
    .replace(/<link rel="preload" as="image" href="\/assets\/storefront\/night\.webp"[^>]*>/, url === '/' ? '$&' : '')
    .replace(/<title>.*?<\/title>/s, head(m) + '\n    ' + hints.replace(/\/>/g, ' />'))
    .replace('<div id="root"></div>', `<div id="root">${app}</div>`)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, html)
}

for (const r of routes) await page(r, r.path, path.join(dist, r.path === '/' ? 'index.html' : `${r.path.slice(1)}/index.html`))
await page(notFoundMeta, '/404-not-found', path.join(dist, '404.html'))
// offline app shell: empty root → client render of any route when the network is unavailable
fs.writeFileSync(path.join(dist, 'app-shell.html'), template.replace(/<title>.*?<\/title>/s, '<title>Tea Town</title>\n    <meta name="robots" content="noindex" />'))

const today = new Date().toISOString().slice(0, 10)
fs.writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((r) => `  <url><loc>${absUrl(r.path)}</loc><lastmod>${today}</lastmod><priority>${r.path === '/' ? '1.0' : '0.8'}</priority></url>`).join('\n')}
</urlset>
`)
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /frames/\n\nSitemap: ${absUrl('/sitemap.xml')}\n`)
// regenerate the service worker so every prerendered page (and the menu) is precached for offline use
const { generateSW } = await import('workbox-build')
const { workbox } = await import(pathToFileURL(path.join(root, 'pwa.workbox.mjs')).href)
const sw = await generateSW({ ...workbox, globDirectory: dist, swDest: path.join(dist, 'sw.js') })
console.log(`service worker: ${sw.count} files precached`)
fs.rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true })
console.log(`prerendered ${routes.length + 1} pages`)
