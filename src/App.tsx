import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Nav } from './components/Nav'
import { Footer } from './components/Footer'
import { WhatsAppFab } from './components/WhatsAppFab'
import { ReviewPopup } from './components/ReviewPopup'
import { BranchProvider } from './lib/branch'
import { useHead } from './lib/head'
import Home from './pages/Home'

const About = lazy(() => import('./pages/About'))
const AllItems = lazy(() => import('./pages/AllItems'))
const MenuPage = lazy(() => import('./pages/MenuPage'))
const Contact = lazy(() => import('./pages/Contact'))
const Location = lazy(() => import('./pages/Location'))
const NotFound = lazy(() => import('./pages/NotFound'))

function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, hash])
  return null
}

export default function App() {
  const { pathname } = useLocation()
  useHead(pathname)
  return (
    <BranchProvider>
      <ScrollManager />
      <Nav />
      <main id="main" tabIndex={-1} className="outline-none">
        <Suspense fallback={<div className="min-h-[100svh] bg-ink" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/all-items" element={<AllItems />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/locations/:id" element={<Location />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <WhatsAppFab />
      <ReviewPopup />
    </BranchProvider>
  )
}
