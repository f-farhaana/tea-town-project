# Offline menu

**What works now (PWA):** on the first successful online visit, the service worker precaches the app shell, fonts, brand assets,
all prerendered pages (including `/menu`), the menu data and anything in `public/assets/menu/`. A status chip on `/menu` shows
"Menu saved for offline use". Returning customers can reopen the menu with no data connection.

**What does not work:** a brand-new customer who has never loaded the site cannot open an internet URL with no connection.
No PWA can do that.

**For true first-time offline access (separate infrastructure, not part of this build):** host the same `dist/` folder on a
small local server (e.g. Raspberry Pi or the café router) on the café Wi-Fi, with a captive portal / local DNS entry such as
`menu.teatown.local`, and point an in-store QR code at it. The build is fully static, so no code changes are needed.
