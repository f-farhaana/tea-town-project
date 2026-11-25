import { Link } from 'react-router-dom'
export default function NotFound() {
  return (
    <section className="relative grid min-h-[100svh] place-items-center overflow-hidden bg-orange px-5 text-center text-ink">
      <img src="/assets/brand/arabic-logo-black.png" alt="" className="absolute w-[70vmin] opacity-10" />
      <div className="relative">
        <p className="eyebrow">Error 404</p>
        <h1 className="display mt-4 text-[clamp(4rem,14vw,13rem)]">Wrong turn.</h1>
        <p className="mx-auto mt-4 max-w-md font-semibold">This page isn&rsquo;t on the menu. Let&rsquo;s get you back to the good stuff.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3"><Link to="/" className="btn-ink">Home</Link><Link to="/menu" className="btn border border-ink hover:bg-ink hover:text-cream">View Menu</Link><Link to="/all-items" className="btn border border-ink hover:bg-ink hover:text-cream">All Items</Link></div>
      </div>
    </section>
  )
}
