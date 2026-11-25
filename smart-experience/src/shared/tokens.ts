// AUTO-SYNCED from the public website by scripts/sync-shared.mjs. Edit the website file, not this copy.
/**
 * Tea Town design tokens — shared source of truth for the public website
 * and the future QR/NFC customer convenience app. Mirror lives in src/styles/tokens.css.
 */
export const tokens = {
  color: {
    orange: '#FF581C', // signature storefront orange (primary)
    black: '#0B0B0B', // deep black (primary)
    gold: '#E9A322', // packaging golden orange (support, use sparingly)
    cream: '#FFF5E5', // warm white
    charcoal: '#222222',
    whatsapp: '#25D366',
  },
  font: {
    display: "'Anton', 'Barlow Condensed', Impact, sans-serif",
    body: "'Manrope', system-ui, sans-serif",
    arabic: "'Cairo', 'Manrope', sans-serif",
  },
  radius: { none: '0', sm: '4px', pill: '999px' },
  ease: { brand: 'cubic-bezier(.2,.8,.2,1)' },
} as const
