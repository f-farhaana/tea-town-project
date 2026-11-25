import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
// @ts-expect-error plain ESM config shared with the prerender script
import { workbox } from './pwa.workbox.mjs'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'assets/brand/*.png'],
      manifest: {
        name: 'Tea Town Sharjah',
        short_name: 'Tea Town',
        description: 'Tea Town menu, branches and contact — works offline after your first visit.',
        theme_color: '#0B0B0B',
        background_color: '#0B0B0B',
        display: 'standalone',
        start_url: '/menu',
        icons: [
          { src: '/assets/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/assets/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/assets/brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox,
    }),
  ],
  build: {
    assetsDir: 'static',
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('node_modules/gsap') ? 'gsap' : id.includes('node_modules/pdfjs-dist') ? 'pdfjs' : undefined),
      },
    },
  },
})
