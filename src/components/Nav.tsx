import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu as MenuIcon, X, BookOpen } from 'lucide-react'
import { nav } from '../config/site'
import { Logo } from './Logo'

export function Nav() {
  const [open, setOpen] = useState(false)
  const [solid, setSolid] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40)
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : '' }, [open])

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-[background,backdrop-filter] duration-500 ${solid || open ? 'bg-ink/90 backdrop-blur-md' : 'bg-gradient-to-b from-ink/70 to-transparent'}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-orange focus:px-4 focus:py-2 focus:text-ink">Skip to content</a>
      <div className="wrap flex h-16 items-center justify-between md:h-20">
        <Link to="/" aria-label="Tea Town home"><Logo /></Link>
        <nav aria-label="Primary" className="hidden items-center gap-9 lg:flex">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end className={({ isActive }) => `group relative text-[13px] font-extrabold uppercase tracking-[0.18em] transition-colors hover:text-orange ${isActive ? 'text-orange' : 'text-cream'}`}>
              {n.label}
              <span className="absolute -bottom-1.5 left-0 h-[2px] w-full origin-left scale-x-0 bg-orange transition-transform duration-300 group-hover:scale-x-100" />
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/menu" className="btn-orange !px-4 !py-2.5 md:!px-6 md:!py-3"><BookOpen className="h-4 w-4" aria-hidden />View Menu</Link>
          <button type="button" className="grid h-11 w-11 place-items-center lg:hidden" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>
            {open ? <X /> : <MenuIcon />}
          </button>
        </div>
      </div>
      <div id="mobile-nav" hidden={!open} className="h-[calc(100dvh-4rem)] overflow-y-auto border-t border-cream/10 bg-ink lg:hidden">
        <nav aria-label="Mobile" className="wrap flex flex-col py-6">
          {[...nav, { to: '/menu', label: 'View Menu' }].map((n, i) => (
            <NavLink key={n.to} to={n.to} end className={({ isActive }) => `display border-b border-cream/10 py-4 text-5xl ${isActive ? 'text-orange' : ''}`} style={{ transitionDelay: `${i * 40}ms` }}>
              {n.label}
            </NavLink>
          ))}
          <img src="/assets/brand/calligraphy-pattern.png" alt="" className="mt-10 w-full opacity-10" loading="lazy" />
        </nav>
      </div>
    </header>
  )
}
