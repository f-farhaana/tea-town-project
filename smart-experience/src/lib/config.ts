/** Business configuration. Tea Town is the first configured business; brand + branch data come from the website. */
import { branches as siteBranches, links, site } from '../shared/site'
import type { BranchId, Settings } from './types'

export const business = {
  name: site.name,
  poweredBy: 'Codepopia',
  website: (import.meta.env.VITE_PUBLIC_WEBSITE_URL as string | undefined) || 'https://tea-town.vercel.app',
  logoWhite: '/assets/brand/arabic-logo-white.png',
  logoBlack: '/assets/brand/arabic-logo-black.png',
  wordmark: '/assets/brand/wordmark-white.png',
  heroImage: '/assets/storefront/night.webp',
  foodImage: '/assets/products/signature-burger-packaging-600.webp',
}
export const branches = siteBranches
export const branchIds = branches.map((b) => b.id) as BranchId[]
export const branchById = (id?: string | null) => branches.find((b) => b.id === id)

export const appMode: 'demo' | 'production' = (import.meta.env.VITE_APP_MODE as string) === 'production' ? 'production' : 'demo'
export const supabaseConfigured = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
/** Demo = local browser storage + BroadcastChannel (same device only). Never touches a real database. */
export const isDemo = appMode === 'demo' || !supabaseConfigured
export const appUrl = () => ((import.meta.env.VITE_APP_URL as string | undefined) || (typeof location !== 'undefined' ? location.origin : '')).replace(/\/$/, '')

const wifi = { ssid: '', password: '', security: 'WPA' as const, instructions: 'Open Wi-Fi settings on your phone and join the network below, or scan the Wi-Fi QR code with your camera.' }
export const defaultSettings: Settings = {
  branches: Object.fromEntries(siteBranches.map((b) => [b.id, { name: b.name, phone: b.phone, whatsapp: b.whatsapp, reviewUrl: links.review(b), wifi: { ...wifi } }])) as Settings['branches'],
  menuPdfUrl: site.menu.pdf,
  // Example only: inactive until management approves the real reward.
  loyalty: { enabled: false, approved: false, stampsForReward: 5, rewardName: 'Free karak (example)' },
  features: { callStaff: true, readyToPay: true, feedback: true, loyalty: true, offers: true, wifi: true, whatsapp: true },
}
export const waLink = (num: string, msg = site.whatsappMessage) => `https://wa.me/${num.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
