import { site, branches } from './site'
import { categories, menu } from '../data/menu'

export interface RouteMeta { path: string; title: string; description: string; image?: string; jsonLd?: object[] }

const abs = (p: string) => site.url.replace(/\/$/, '') + p
const ogImage = '/assets/og/og-default.jpg'

export const breadcrumb = (trail: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: abs(t.path) })),
})

export const restaurantLd = (b: (typeof branches)[number]) => ({
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  '@id': abs(`/locations/${b.id}#restaurant`),
  name: b.name,
  url: abs(`/locations/${b.id}`),
  image: abs('/assets/storefront/night.webp'),
  telephone: b.phone,
  servesCuisine: ['Cafeteria', 'Fast Food', 'Burgers', 'Shawarma', 'Arabic', 'Karak Tea', 'Juices'],
  priceRange: 'AED',
  hasMenu: abs('/menu'),
  acceptsReservations: false,
  address: { '@type': 'PostalAddress', streetAddress: b.streetAddress, addressLocality: b.locality, addressRegion: 'Sharjah', addressCountry: 'AE' },
  openingHoursSpecification: [{
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: b.hoursSpec.opens, closes: b.hoursSpec.closes,
  }],
  hasMap: `https://www.google.com/maps/place/?q=place_id:${b.placeId}`,
  parentOrganization: { '@id': abs('/#organization') },
  sameAs: [site.social.instagram],
})

const orgLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': abs('/#organization'),
  name: site.name,
  url: site.url,
  logo: abs('/assets/brand/icon-512.png'),
  sameAs: [site.social.instagram, site.social.linktree],
  subOrganization: branches.map((b) => ({ '@id': abs(`/locations/${b.id}#restaurant`) })),
}
const websiteLd = { '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, url: site.url, inLanguage: 'en-AE' }
const menuLd = {
  '@context': 'https://schema.org',
  '@type': 'Menu',
  name: 'Tea Town Menu',
  url: abs('/menu'),
  inLanguage: 'en',
  hasMenuSection: categories.map((c) => ({
    '@type': 'MenuSection',
    name: c.name,
    hasMenuItem: menu.filter((m) => m.category === c.id).map((m) => ({ '@type': 'MenuItem', name: m.name, description: m.description })),
  })),
}

export const routes: RouteMeta[] = [
  { path: '/', title: 'Tea Town Sharjah | Karak, Burgers, Shawarma & Loaded Fries', description: site.description, jsonLd: [orgLd, websiteLd, ...branches.map(restaurantLd)] },
  { path: '/about', title: 'About Tea Town | More Than a Tea Shop in Sharjah', description: 'Tea Town is a Sharjah cafeteria loved for variety, taste and everyday value, from karak tea to burgers, shawarma and late-night food. Two branches with easy car-side takeaway.', jsonLd: [breadcrumb([{ name: 'Home', path: '/' }, { name: 'About Us', path: '/about' }])] },
  { path: '/all-items', title: 'All Items | Tea Town Menu, Sharjah', description: 'Search every Tea Town item: burgers, shawarma, wraps, clubs, pasta, animal and loaded fries, grills, karak tea, fresh juices, milkshakes and more.', jsonLd: [menuLd, breadcrumb([{ name: 'Home', path: '/' }, { name: 'All Items', path: '/all-items' }])] },
  { path: '/menu', title: 'View Menu | Tea Town Menu Book', description: 'Flip through the Tea Town menu book. Save it once and open it again offline on your phone.', jsonLd: [menuLd, breadcrumb([{ name: 'Home', path: '/' }, { name: 'Menu', path: '/menu' }])] },
  { path: '/contact', title: 'Contact Tea Town | Al Jazzat & Al Tarfa, Sharjah', description: 'Call, WhatsApp or get directions to Tea Town Al Jazzat and Tea Town Jabal Al Noor, Al Tarfa in Sharjah. Opening hours and branch details.', jsonLd: [...branches.map(restaurantLd), breadcrumb([{ name: 'Home', path: '/' }, { name: 'Contact', path: '/contact' }])] },
  ...branches.map((b) => ({
    path: `/locations/${b.id}`,
    title: `${b.name} | Karak, Burgers & Late-Night Food in Sharjah`,
    description: `${b.name}: ${b.hours.toLowerCase()}. ${b.area}, Sharjah. Call ${b.phoneDisplay}, WhatsApp, directions and menu.`,
    jsonLd: [restaurantLd(b), breadcrumb([{ name: 'Home', path: '/' }, { name: 'Contact', path: '/contact' }, { name: b.shortName, path: `/locations/${b.id}` }])],
  })),
]

export const notFoundMeta: RouteMeta = { path: '/404', title: 'Page not found | Tea Town', description: 'This page took a wrong turn. Head back to Tea Town.' }
export const metaFor = (path: string) => routes.find((r) => r.path === path) ?? notFoundMeta
export const absUrl = abs
export const defaultOg = ogImage
