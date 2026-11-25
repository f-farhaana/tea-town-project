# Tea Town Smart Experience

QR/NFC customer app + one management dashboard for Tea Town, Sharjah. Powered by Codepopia.
Separate app inside the website repo; deploys on its own (Vercel root directory: `smart-experience`).

| Who | URL | What |
|---|---|---|
| Customers | `/?branch=al-jazzat` · `/?branch=al-tarfa` | Menu book + search, Call staff, Ready to pay, Google review, anonymous feedback, loyalty card, offers, Wi-Fi, WhatsApp |
| Staff & owner | `/admin` | Overview · Live Requests · Feedback · Loyalty · Settings (staff see Live Requests + Loyalty, own branch only) |

## Run
```bash
npm install
npm run dev        # http://localhost:5173
npm test           # app tests (vitest)
npm run test:db    # database security tests (needs local PostgreSQL)
npm run build      # also re-syncs menu, branches and logos from the website
```

## Demo mode (no database)
Runs automatically while Supabase is not configured. Fictional data, labelled **DEMO DATA**, stored only in that browser.
Requests and stamps sync between tabs of the same browser, **not** between devices.
Demo logins (shown on the sign-in screen): owner@demo.local / 4444 · staff.jazzat@demo.local / 1111 · staff.tarfa@demo.local / 2222.
Demo logins stop working as soon as a real database is connected.

## Go live with Supabase (free plan is enough to start)
1. Create a Supabase project (region closest to the UAE, e.g. Frankfurt or Mumbai).
2. SQL editor → run `supabase/migrations/20261125000000_smart_experience.sql`.
3. Authentication → Providers: keep **Email** on (magic link for customers). Set Site URL to the live app URL and add `<live-url>/loyalty` to redirect URLs.
4. Create staff logins: Authentication → Users → Add user (email + password). Then in SQL:
   ```sql
   insert into profiles (id, name, email, role, branches)
   select id, 'Owner', email, 'owner', '{al-jazzat,al-tarfa}' from auth.users where email = 'OWNER_EMAIL';
   insert into profiles (id, name, email, role, branches)
   select id, 'Al Jazzat staff', email, 'staff', '{al-jazzat}' from auth.users where email = 'STAFF_EMAIL';
   ```
5. Vercel → project `teatown-smart-experience` → Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (anon/public key only), `VITE_APP_MODE=production`, `VITE_APP_URL=<live url>`. Redeploy.
6. Sign in at `/admin` as the owner → Settings: Wi-Fi, approve and switch on the loyalty reward, add offers, print QR cards.

## How it is secured
- Customers never write tables directly: every action is a database function that validates input, rate-limits (per phone and per branch) and de-duplicates.
- Row Level Security: staff read only their branch's requests; feedback, analytics and settings are owner-only; customer emails are not readable through the API.
- Loyalty ledger is insert-only via staff functions; each stamp/redemption has a unique reference (no double counting), redemption locks the member row (no double redemption, no negative balance), one stamp per member per 10 minutes.
- No secrets in the code. Only the public anon key is used in the browser.

## Updating
- Menu items, branches and logos come from the website (`../src/data/menu.ts`, `../src/config/site.ts`); `npm run build` copies them in.
- Menu PDF: put it in `public/assets/menu/` and set its path in Settings (the built-in menu book is used until then).
- NFC cards: write the branch URL (Settings → QR codes) as a URL/NDEF record with any NFC writer app.

## Known limits
- Customers need a connection the first time; after that the menu works offline on that phone.
- Insights are simple rules on recorded app activity. QR visits and menu views are not sales.
- No ordering, payments, points, tiers or Wallet passes by design.
