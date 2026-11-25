# Google Flow clips for the Tea Town cinematic hero

Generate four separate clips (16:9, ~8 s, no text, no audio dependency, no cuts). Use **Frames to Video** where available.

| Order | File to save | Prompt file | Start reference | End reference |
|---|---|---|---|---|
| A (walk-in) | `walk-in.mp4` | `A-walk-in.txt` | Night storefront photo | — |
| B (drive-in, preferred) | `drive-through.mp4` | `B-drive-through.txt` | Night + day storefront photos | — |
| C | `burger-assembly.mp4` | `C-burger-assembly.txt` | **Last frame of A or B** | Burger photo |
| D | `packaging-reveal.mp4` | `D-packaging-reveal.txt` | **Last frame of C** | Burger + packaging photo |

Reference photos: `public/assets/storefront/night.webp`, `dayfront.webp`, `dayangle.webp`, `public/assets/products/signature-burger-packaging.webp`.

## After generating
1. Save the MP4s in `media/videos/` (not deployed) with the exact filenames above.
2. Run `npm run frames` (FFmpeg: 12 fps, 1280 px, WebP q72, trims the corner watermark). Lighter: `FPS=12 WIDTH=1100 Q=72 npm run frames`.
   This writes `public/frames/<sequence>/frame-0001.webp…` and `public/frames/manifest.json`, and saves each clip's last frame
   as `media/videos/<sequence>-last-frame.webp` to use as the next clip's start reference.
3. `npm run build`. The hero automatically switches from the photographic fallback to the frames. Only the selected opening
   (A or B, `site.hero.version` in `src/config/site.ts`) is downloaded by visitors.

If Flow distorts the signage or packaging, delete that clip and its frames folder: the site falls back to the real photos.
