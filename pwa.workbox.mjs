// Shared Workbox config: used by vite-plugin-pwa and re-run by scripts/prerender.mjs
// (so the precache includes the prerendered HTML of every page, incl. /menu).
export const workbox = {
  globPatterns: ['**/*.{js,css,html,woff2,svg,webmanifest}', 'assets/brand/*.{png,webp}', 'assets/menu/**/*.{pdf,webp,json}', 'assets/storefront/*-640.webp', 'assets/products/*-600.webp'],
  globIgnores: ['frames/**', 'assets/videos/**', '**/pdf.worker*', 'sw.js', 'workbox-*.js'],
  maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
  navigateFallback: '/app-shell.html',
  navigateFallbackDenylist: [/^\/frames\//, /^\/assets\//, /^\/static\//],
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: true,
  runtimeCaching: [
    { urlPattern: ({ url }) => url.pathname.startsWith('/assets/'), handler: 'StaleWhileRevalidate', options: { cacheName: 'tt-assets', expiration: { maxEntries: 200 } } },
    { urlPattern: ({ url }) => url.pathname.includes('pdf.worker'), handler: 'CacheFirst', options: { cacheName: 'tt-pdfjs' } },
  ],
}
