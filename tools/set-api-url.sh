#!/usr/bin/env bash
# ===== رابط الـWorker ديال sehrgut =====
#
# من بعد ما تنشر cloudflare-worker.js ف Cloudflare، عطيه الرابط ديالو:
#   bash tools/set-api-url.sh sehrgut-api.smitek.workers.dev
# كيبدل الرابط المؤقت (sehrgut-api.YOUR-SUBDOMAIN.workers.dev) ف جميع الصفحات.
set -euo pipefail
cd "$(dirname "$0")/.."

new="${1:-}"
new="${new#https://}"
new="${new%/}"
if [[ ! "$new" =~ ^[A-Za-z0-9.-]+$ ]]; then
    echo "usage: bash tools/set-api-url.sh <host>   (ex: sehrgut-api.smitek.workers.dev)" >&2
    exit 1
fi

old="${OLD_API_HOST:-sehrgut-api.YOUR-SUBDOMAIN.workers.dev}"
files=$(grep -rlF "$old" --include='*.html' --include='*.js' --exclude-dir=.git --exclude-dir=legacy . || true)
if [ -z "$files" ]; then
    echo "ما لقيتش $old — يمكن تبدل من قبل (OLD_API_HOST=... باش تبدلو مرة أخرى)." >&2
    exit 1
fi
echo "$files" | xargs sed -i "s#$old#$new#g"
echo "تبدل ف $(echo "$files" | wc -l) ملف → https://$new"
