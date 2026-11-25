import { Link } from 'react-router-dom'
import { MenuBook } from '../components/MenuBook'
import { OfflineBadge } from '../components/OfflineBadge'
import { Breadcrumbs } from '../components/Breadcrumbs'

export default function MenuPage() {
  return (
    <div className="bg-ink pt-28 md:pt-32">
      <div className="wrap">
        <Breadcrumbs trail={[{ name: 'Home', to: '/' }, { name: 'Menu' }]} />
        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <h1 className="display text-[clamp(3.4rem,11vw,10rem)]">The menu book</h1>
          <OfflineBadge />
        </div>
        <p className="mt-4 max-w-2xl text-cream/70">Swipe or use the arrows to turn pages. Once this page has loaded, the menu is saved on your phone so you can open it again without data. Looking for something specific? <Link to="/all-items" className="text-orange underline underline-offset-4">Search all items</Link>.</p>
      </div>
      <div className="wrap mt-10 pb-24"><MenuBook /></div>
    </div>
  )
}
