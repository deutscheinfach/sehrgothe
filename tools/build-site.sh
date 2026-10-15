#!/usr/bin/env bash
# ===== بناء الموقع للنشر (Cloudflare) =====
#
# كيجمع غير الملفات اللي خاصها تكون ف الأنترنت ف dist/ :
# الصفحات، assets، الأيقونات، الـ service worker، robots و sitemap.
# الملفات اللي ماشي للعموم (tools/، firebase/، cloudflare-worker.js،
# .github، .claude…) ما كيطلعوش.
#
# Cloudflare: Build command = bash tools/build-site.sh
#             Deploy command = npx wrangler deploy   (wrangler.jsonc)
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf dist
mkdir -p dist

cp ./*.html dist/
cp -R assets dist/assets
for f in manifest.webmanifest firebase-messaging-sw.js robots.txt sitemap.xml version.json offline.json; do
    [ -f "$f" ] && cp "$f" dist/
done
# الصور اللي ف الجذر (إلا كانو)
find . -maxdepth 1 -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.webp' -o -name '*.svg' -o -name '*.ico' \) -exec cp {} dist/ \;

# الكاش: نفس اللي كان ف GitHub Pages (10 دقايق) — الـ service worker
# ديجا كيحفظ الملفات اللي فيهم ?v=
cat > dist/_headers <<'H'
/assets/*
  Cache-Control: public, max-age=600
H

echo "dist: $(find dist -type f | wc -l) files, $(du -sh dist | cut -f1)"
