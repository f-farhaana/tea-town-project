// AUTO-SYNCED from the public website by scripts/sync-shared.mjs. Edit the website file, not this copy.
/** Central site configuration: branding, branches, links, hero, metadata. Edit here, not in components. */
export type HeroVersion = 'A' | 'B'

export interface Branch {
  id: 'al-jazzat' | 'al-tarfa'
  name: string
  shortName: string
  area: string
  address: string
  streetAddress: string
  locality: string
  plusCode?: string
  phone: string
  phoneDisplay: string
  whatsapp: string
  whatsappDisplay: string
  placeId: string
  hours: string
  hoursSpec: { opens: string; closes: string }
  is24h: boolean
  /** Confirm with owner before launch */
  verified: boolean
}

export const site = {
  name: 'Tea Town',
  legalName: 'Tea Town Cafeteria',
  tagline: 'More than just tea.',
  url: (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://www.teatown.ae',
  locale: 'en_AE',
  city: 'Sharjah',
  country: 'AE',
  description:
    'Tea Town, Sharjah: karak tea, burgers, shawarma, wraps, loaded fries, pasta, fresh juices and shakes. Two branches in Al Jazzat and Al Tarfa (Jabal Al Noor), with easy car-side takeaway.',

  /** Cinematic hero. 'B' = drive-through (preferred), 'A' = walk-in. */
  hero: {
    version: 'B' as HeroVersion,
    /** Scroll length of the pinned sequence in viewport heights. */
    scrollVh: 5,
    /**
     * Frame counts per sequence in /public/frames/<name>/frame-0001.webp.
     * 0 = not supplied yet: the built-in photographic fallback is used instead.
     * Run `npm run frames` after dropping MP4s in public/assets/videos to update public/frames/manifest.json.
     */
    sequences: ['walk-in', 'drive-through', 'burger-assembly', 'packaging'] as const,
  },

  whatsappMessage: "Hi Tea Town! I'd like to know more about your menu.",
  reviewPopupDelayMs: 10_000,

  /** Labels: until verified POS / platform data exists, avoid sales claims. */
  claims: {
    mostOrderedVerified: false,
    mostPopularVerified: false,
  },

  social: {
    instagram: 'https://www.instagram.com/teatownuae/',
    linktree: 'https://linktr.ee/teatown.ae',
    /** Add verified ordering platform links here (e.g. Talabat, Careem) once confirmed. */
    ordering: [] as { name: string; url: string }[],
  },

  menu: {
    /** Local menu book PDF. Replace this file to update the menu. */
    pdf: '/assets/menu/tea-town-menu.pdf',
    publishedSource: 'https://etisalat.adverit.com/upload/products/10065/Menu-1.pdf',
  },

  analytics: {
    ga4Id: (import.meta.env.VITE_GA4_ID as string | undefined) ?? '',
    gscVerification: (import.meta.env.VITE_GSC_VERIFICATION as string | undefined) ?? '',
  },

  credit: { name: 'Codepopia', url: 'https://codepopia.com' },
}

export const branches: Branch[] = [
  {
    id: 'al-jazzat',
    name: 'Tea Town Al Jazzat',
    shortName: 'Al Jazzat',
    area: 'Al Jazzat, Al Riqa Suburb',
    address:
      'Sharjah Co-operative Society Building, Al Jazzat, Al Riqa Suburb, Sheikh Khalid Bin Mohammed Al Qasimi Street, Sharjah, UAE',
    streetAddress: 'Sharjah Co-operative Society Building, Sheikh Khalid Bin Mohammed Al Qasimi Street',
    locality: 'Al Jazzat, Sharjah',
    plusCode: '9C9G+XHG',
    phone: '+97165320033',
    phoneDisplay: '+971 6 532 0033',
    whatsapp: '971561686858',
    whatsappDisplay: '+971 56 168 6858',
    placeId: 'ChIJVeodDI1ZXz4R5eTnqF-57mI',
    hours: 'Daily, 6:00 AM – 4:00 AM',
    hoursSpec: { opens: '06:00', closes: '04:00' },
    is24h: false,
    verified: false,
  },
  {
    id: 'al-tarfa',
    name: 'Tea Town Jabal Al Noor, Al Tarfa',
    shortName: 'Al Tarfa — Jabal Al Noor',
    area: 'Al Tarfa, Mughaider Suburb',
    address:
      '19 Street #44, Al Tarfa, Mughaider Suburb, near Masjid Rahma, Sheikh Mohammed Bin Zayed Road, Sharjah, UAE',
    streetAddress: '19 Street #44, near Masjid Rahma, Sheikh Mohammed Bin Zayed Road',
    locality: 'Al Tarfa, Sharjah',
    phone: '+97165584100',
    phoneDisplay: '+971 6 558 4100',
    whatsapp: '971505212342',
    whatsappDisplay: '+971 50 521 2342',
    placeId: 'ChIJ--6C5RhfXz4RUQA6b-jZd8c',
    hours: 'Open 24 hours',
    hoursSpec: { opens: '00:00', closes: '23:59' },
    is24h: true,
    verified: false,
  },
]

export const links = {
  whatsapp: (b: Branch, msg = site.whatsappMessage) => `https://wa.me/${b.whatsapp}?text=${encodeURIComponent(msg)}`,
  call: (b: Branch) => `tel:${b.phone}`,
  directions: (b: Branch) =>
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(b.name + ', Sharjah')}&destination_place_id=${b.placeId}`,
  map: (b: Branch) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name + ', Sharjah')}&query_place_id=${b.placeId}`,
  review: (b: Branch) => `https://search.google.com/local/writereview?placeid=${b.placeId}`,
  embed: (b: Branch) => `https://www.google.com/maps?q=place_id:${b.placeId}&output=embed`,
}

export const nav = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/all-items', label: 'All Items' },
  { to: '/contact', label: 'Contact' },
]
