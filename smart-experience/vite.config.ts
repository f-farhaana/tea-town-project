import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: {
        name: 'Tea Town Smart Experience',
        short_name: 'Tea Town',
        description: 'Tea Town menu, staff assistance, feedback and rewards. Menu works offline after your first visit.',
        theme_color: '#0B0B0B',
        background_color: '#0B0B0B',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/assets/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/assets/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/assets/brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Public customer shell, catalogue, menu book and brand assets only.
        globPatterns: ['index.html', 'static/*.{js,css,woff2}', 'assets/brand/*.{png,webp}', 'assets/menu/**/*.{pdf,webp,json}', 'assets/storefront/night.webp', 'assets/products/*.webp'],
        // Dashboard code is never precached by the public service worker.
        globIgnores: ['**/admin-app-*.js', '**/Overview-*.js', '**/FeedbackTab-*.js', '**/Settings-*.js', '**/scan-*.js', '**/supabase-*.js', '**/pdf.worker*'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/staff/, /^\/admin/, /^\/assets\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          { urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/assets/'), handler: 'StaleWhileRevalidate', options: { cacheName: 'tt-se-assets', expiration: { maxEntries: 150 } } },
          { urlPattern: ({ url }) => url.pathname.includes('pdf.worker'), handler: 'CacheFirst', options: { cacheName: 'tt-se-pdfjs' } },
        ],
      },
    }),
  ],
  build: {
    assetsDir: 'static',
    rollupOptions: {
      output: {
        manualChunks: (id) =>
          id.includes('node_modules/@zxing') ? 'scan'
          : id.includes('node_modules/@supabase') ? 'supabase'
          : id.includes('node_modules/pdfjs-dist') ? 'pdfjs'
          : undefined,
      },
    },
  },
  test: { environment: 'jsdom', include: ['tests/**/*.test.ts'] },
} as never)
