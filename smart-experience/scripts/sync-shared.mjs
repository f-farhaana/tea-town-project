// Keeps ONE authoritative menu/branch dataset: copies it from the public website (repo root)
// into this app. Skips silently when the website sources are not present (e.g. isolated build),
// in which case the committed copies in src/shared and public/assets are used.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const app = resolve(here, '..')
const site = resolve(app, '..')
if (!existsSync(join(site, 'src/data/menu.ts'))) { console.log('[sync] website sources not found, using committed copies'); process.exit(0) }

const banner = '// AUTO-SYNCED from the public website by scripts/sync-shared.mjs. Edit the website file, not this copy.\n'
for (const [from, to] of [['src/data/menu.ts', 'src/shared/menu.ts'], ['src/config/site.ts', 'src/shared/site.ts'], ['src/config/tokens.ts', 'src/shared/tokens.ts']]) {
  const dest = join(app, to)
  mkdirSync(dirname(dest), { recursive: true })
  const next = banner + readFileSync(join(site, from), 'utf8')
  if (!existsSync(dest) || readFileSync(dest, 'utf8') !== next) writeFileSync(dest, next)
}
for (const dir of ['brand', 'products', 'menu']) {
  const src = join(site, 'public/assets', dir)
  if (existsSync(src)) cpSync(src, join(app, 'public/assets', dir), { recursive: true })
}
mkdirSync(join(app, 'public/assets/storefront'), { recursive: true })
for (const f of readdirSync(join(site, 'public/assets/storefront'))) {
  if (f.endsWith('-640.webp') || f === 'night.webp') cpSync(join(site, 'public/assets/storefront', f), join(app, 'public/assets/storefront', f))
}
console.log('[sync] menu, branches, tokens and brand assets synced from website')
