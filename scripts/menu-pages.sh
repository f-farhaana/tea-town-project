#!/usr/bin/env bash
# Render the menu PDF into optimised WebP page images + manifest for the menu book viewer.
# Requires poppler (pdftoppm) and cwebp or ImageMagick.
set -euo pipefail
PDF=public/assets/menu/tea-town-menu.pdf
OUT=public/assets/menu/pages
[ -f "$PDF" ] || { echo "Missing $PDF"; exit 1; }
rm -rf "$OUT"; mkdir -p "$OUT"
pdftoppm -r 150 -png "$PDF" "$OUT/p"
i=0; pages=()
for f in $(ls "$OUT"/p-*.png | sort -V); do
  i=$((i+1)); n=$(printf "page-%02d.webp" $i)
  if command -v cwebp >/dev/null; then cwebp -quiet -q 80 -resize 1400 0 "$f" -o "$OUT/$n"; else convert "$f" -resize 1400x -quality 80 "$OUT/$n"; fi
  rm "$f"; pages+=("\"/assets/menu/pages/$n\"")
done
echo "{\"pages\":[$(IFS=,; echo "${pages[*]}")]}" > "$OUT/manifest.json"
echo "Rendered $i pages → $OUT"
