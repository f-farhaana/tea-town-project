# Test report (25 Nov 2026) — automated Playwright, Chromium desktop + iPhone 13 emulation, prerendered build

Passed
- All 7 routes + 404: one H1 each, unique titles, no horizontal overflow (1440px and iPhone 13), correct active nav.
- Unknown URL returns HTTP 404 with the custom page.
- Nav links, mobile hamburger menu, "View Menu" button.
- All Items: search ("animal" → Animal Fries), empty state, category chips (Pasta → 7), #category deep links.
- Horizontal collections: arrows, keyboard arrows, mouse drag, scroll snap, progress bar.
- Menu book: page turn (single page mobile, spreads desktop), page select, zoom, full screen, Save-PDF/print.
- Offline: after one online visit, /menu, /all-items and /contact reload with the network off.
- Review invitation: hidden at 9 s, shown after 10 s, dismissal collapses to a Google icon, not reopened in the same session.
- WhatsApp: branch picker, correct wa.me number per branch with prefilled message; chosen branch then opens directly.
- Call, directions (Place ID) and both Google review links per branch.
- Reduced motion: static night-storefront hero, no canvas.
- Hero version B fallback across the full scroll; no console errors.

Not tested (sandbox has no internet): wa.me / Google review / Maps pages actually loading, and real-device Core Web Vitals.
Run PageSpeed Insights after deployment; no scores are claimed.
