#!/usr/bin/env bash
# أكاديمية رمـز — التراجع الكامل على Caddy: يشيل سطر الأكاديمية وملفها فقط، ثم validate وreload.
#   bash deploy/caddy-rollback.sh
set -uo pipefail
CF=/etc/caddy/Caddyfile; SITE=/etc/caddy/academy.caddy; LINE="import $SITE"
read -r -p "يشيل سطر «$LINE» وملف الأكاديمية من Caddy (ثم validate وreload). موافق؟ y: " a; a=$(printf %s "$a" | tr -d "\r[:space:]" | tr A-Z a-z); [ "$a" = y ] || exit 1
sudo cp -a "$CF" "$CF.bak-before-academy-rollback-$(date +%Y%m%d-%H%M%S)"
sudo sed -i "\#^$LINE\$#d" "$CF"; sudo rm -f "$SITE"
sudo caddy validate --config "$CF" --adapter caddyfile && sudo systemctl reload caddy && echo "Caddy رجع بدون الأكاديمية."
read -r -p "تبي تحذف ملفات الأكاديمية في /srv/academy بعد؟ y: " b; b=$(printf %s "$b" | tr -d "\r[:space:]" | tr A-Z a-z)
[ "$b" = y ] && sudo rm -rf /srv/academy && echo "/srv/academy انحذف."
echo "وإذا لزم أكثر: نسخ $CF.bak-academy-* أو لقطة SCCC."
bash "$(dirname "$0")/check-ramz.sh"
