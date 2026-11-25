#!/usr/bin/env bash
# أكاديمية رمـز — التراجع الكامل (القسم 7 من دليل النشر): يشيل الأكاديمية من nginx ويرجّع الخادم لما كان عليه.
#   bash deploy/rollback.sh
# Removes only what the academy added. Ramz's files and services are not touched.
set -uo pipefail
NAME=academy.ramz.net.sa
read -r -p "يشيل ملف الأكاديمية من nginx (ثم nginx -t وreload). موافق؟ y: " a; [ "$a" = y ] || exit 1
sudo rm -f /etc/nginx/sites-enabled/$NAME /etc/nginx/sites-available/$NAME /etc/nginx/conf.d/$NAME.conf
sudo nginx -t && sudo systemctl reload nginx && echo "nginx رجع بدون الأكاديمية."
read -r -p "تبي تحذف ملفات الأكاديمية في /srv/academy بعد؟ y: " b
[ "$b" = y ] && sudo rm -rf /srv/academy && echo "/srv/academy انحذف."
echo "شهادة الأكاديمية (إن وُجدت) تُحذف بأمر صريح من المالك: sudo certbot delete --cert-name $NAME"
echo "وإذا لزم أكثر: نسخة /etc/nginx في /root/nginx-backup-* أو لقطة SCCC."
[ -x "$(dirname "$0")/check-ramz.sh" ] || true; bash "$(dirname "$0")/check-ramz.sh"
