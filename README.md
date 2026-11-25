# Tea Town — cinematic website

React + Vite + TypeScript + Tailwind + GSAP ScrollTrigger + Canvas, statically prerendered, PWA offline menu. Built by Codepopia.

```bash
npm install
npm run dev        # local dev (shows the A/B hero toggle)
npm run build      # typecheck → client build → SSR prerender of every route → sitemap/robots → service worker
npm run preview    # note: vite preview serves index.html for /contact etc.; use `npx serve dist` to test prerendered routes
npm run frames     # extract scroll frames from Google Flow clips (see flow-prompts/README.md)
npm run menu:pages # render public/assets/menu/tea-town-menu.pdf into fast WebP pages
```

## Where to edit
| What | File |
|---|---|
| Branches, phones, WhatsApp, hours, Place IDs, review links, socials, hero version (A/B), GA4/GSC ids | `src/config/site.ts` |
| Menu items, categories, flags (`mostOrdered`, `customerFavourite`, `mostPopular`, `isNew`), prices, photos | `src/data/menu.ts` |
| Page titles, descriptions, JSON-LD | `src/config/routes.ts` |
| Design tokens (shared with the future QR/NFC app) | `src/config/tokens.ts`, `src/styles/tokens.css`, `tailwind.config.js` |

Switch the hero: `site.hero.version = 'A' | 'B'`. The dev-only toggle never ships to production.
Labels switch from "Featured picks" to "The most ordered" only when `site.claims.mostOrderedVerified = true` and items carry `mostOrdered: true` (same for "Most popular").

## Deploy (Cloudflare Pages)
Build command `npm run build`, output directory `dist`, Node 20+. Optional env vars: `VITE_SITE_URL`, `VITE_GA4_ID`, `VITE_GSC_VERIFICATION`.
`404.html` gives real 404 status for unknown URLs; `_headers` sets caching. Do not point teatown.ae at it without the owner's approval.

## Assets
- `public/frames/` — scroll frames extracted from the four Google Flow clips (12 fps, 1280 px WebP, generator watermark cropped). Source clips go in `media/videos/` (not deployed; not included in the zip, originals are in the project's videos folder). The packaging clip's bun is not the real Tea Town bun, so the hero dips to the studio and ends on the composition made from the real burger + packaging photo.
- `public/assets/storefront/` — real day/night storefront photos (client-supplied).
- `public/assets/products/signature-burger-packaging.webp` — client-supplied burger-on-packaging image (file name suggests an AI-enhanced/edited photo: confirm it is approved for use).
- `public/assets/products/layers/` — the same burger photo cut into layers for the fallback assembly animation.
- `public/assets/brand/` — logo and wordmark extracted from the storefront photos; calligraphy motif from the packaging. **Replace with the original vector logo files when available.**
- Items without photography use a branded placeholder labelled "Photo coming soon". Set `image` in `menu.ts` when real photos arrive.

See `docs/` for the content-verification list, offline menu notes, SEO/backlink checklist and test report.
