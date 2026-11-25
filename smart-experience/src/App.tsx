import { lazy, Suspense } from 'react'

import CustomerApp from './customer-app'

// Staff and management code is split out and never precached by the public service worker.
import { Navigate, Route, Routes } from 'react-router-dom'
const AdminApp = lazy(() => import('./admin-app'))
// /staff is an alias for the same dashboard (staff see Live Requests + Loyalty only)
const Loading = () => <div className="grid min-h-dvh place-items-center bg-ink text-cream/60">Loading…</div>

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/staff/*" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*" element={<CustomerApp />} />
      </Routes>
    </Suspense>
  )
}
