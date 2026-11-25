#!/usr/bin/env bash
# Extract scroll-animation frames from the Google Flow clips and write public/frames/manifest.json.
# Usage: npm run frames            (defaults: 12 fps, 1280px wide, WebP q72, 13% crop)
#        FPS=12 WIDTH=1100 Q=72 npm run frames   (lighter, for slower devices)
# Expected clips in media/videos/ (kept out of public/ so they are not deployed): walk-in.mp4, drive-through.mp4, burger-assembly.mp4, packaging-reveal.mp4
set -euo pipefail
FPS=${FPS:-12}; WIDTH=${WIDTH:-1280}; Q=${Q:-72}
# CROP trims the generator watermark in the bottom-right corner (set CROP=0 to disable)
CROP=${CROP:-0.87}
V=media/videos; F=public/frames
declare -A MAP=( [walk-in]=walk-in.mp4 [drive-through]=drive-through.mp4 [burger-assembly]=burger-assembly.mp4 [packaging]=packaging-reveal.mp4 )
json="{"
for seq in walk-in drive-through burger-assembly packaging; do
  src="$V/${MAP[$seq]}"; mkdir -p "$F/$seq"
  if [ -f "$src" ]; then
    rm -f "$F/$seq"/frame-*.webp
    ffmpeg -loglevel error -y -i "$src" -vf "fps=$FPS,crop=iw*$CROP:ih*$CROP:0:0,scale=$WIDTH:-2" -c:v libwebp -quality "$Q" "$F/$seq/frame-%04d.webp"
    n=$(ls "$F/$seq"/frame-*.webp | wc -l)
    # save last frame as a reference image for the next Flow clip
    cp "$(ls "$F/$seq"/frame-*.webp | sort | tail -1)" "$V/${seq}-last-frame.webp"
    echo "$seq: $n frames"; json+="\"$seq\":{\"count\":$n},"
  else echo "$seq: no clip ($src) — website keeps the photographic fallback"; fi
done
json="${json%,}}"; echo "$json" > "$F/manifest.json"; echo "→ $F/manifest.json"
