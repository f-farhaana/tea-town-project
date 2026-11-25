import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { applyDocument, ls } from './lib/session'

applyDocument()
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyDocument)

// PWA: only report "saved for offline" after the service worker has actually finished precaching.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) =>
    registerSW({
      immediate: true,
      onOfflineReady() { ls.set('tt-offline-at', new Date().toISOString()); dispatchEvent(new Event('tt-offline-ready')) },
      onRegisteredSW(_url, reg) { if (reg?.active) navigator.serviceWorker.ready.then(() => caches.match('/index.html').then((r) => { if (r && !ls.get('tt-offline-at', null)) { ls.set('tt-offline-at', new Date().toISOString()); dispatchEvent(new Event('tt-offline-ready')) } })) },
    }),
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
