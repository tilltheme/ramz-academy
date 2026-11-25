#!/usr/bin/env bash
# أكاديمية رمـز — تحديث الموقع بعد ما يندمج تعديل في main. لا يلمس خادم الويب ولا رمز.
#   bash deploy/update.sh            # ينزّل آخر main وينقل الرابط إليه
#   bash deploy/update.sh --back     # يرجع للإصدار اللي قبله
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO_TAR=https://github.com/tilltheme/ramz-academy/archive/refs/heads/main.tar.gz
cd /srv/academy/releases
if [ "${1:-}" = --back ]; then
  cur=$(basename "$(readlink -f /srv/academy/site)"); prev=$(ls -1 | sort | grep -B1 "^$cur$" | head -1)
  [ -n "$prev" ] && [ "$prev" != "$cur" ] || { echo "ما فيه إصدار أقدم."; exit 1; }
  sudo ln -sfn "/srv/academy/releases/$prev" /srv/academy/site; echo "رجعنا إلى $prev"; exit 0
fi
REL=/srv/academy/releases/$(date +%Y%m%d-%H%M%S)
sudo install -d -m 755 "$REL"
curl -fsSL "$REPO_TAR" | sudo tar -xz --no-same-owner -C "$REL" --strip-components=2 --wildcards '*/site/'
sudo find "$REL" -type d -exec chmod 755 {} + ; sudo find "$REL" -type f -exec chmod 644 {} +
[ -f "$REL/index.html" ] && [ -f "$REL/404.html" ] || { echo "التنزيل ناقص — الموقع الحالي ما تغيّر."; sudo rm -rf "$REL"; exit 1; }
sudo ln -sfn "$REL" /srv/academy/site
echo "الموقع الحين على $(basename "$REL") — $(curl -s -o /dev/null -w '%{http_code}' https://academy.ramz.net.sa/)"
# keep the last 5 releases
ls -1 | sort | head -n -5 | while read -r old; do sudo rm -rf "/srv/academy/releases/$old"; done
bash "$HERE/check-ramz.sh" || exit 1
