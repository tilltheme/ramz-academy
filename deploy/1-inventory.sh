#!/usr/bin/env bash
# أكاديمية رمـز — الخطوة 1: جرد للقراءة فقط + خط الأساس لموقع رمز. لا يغيّر أي شي على الخادم.
# Read-only. Writes only into ~/academy-deploy (its own notes). Run on the server as the usual admin user:
#   bash deploy/1-inventory.sh
# Then read ~/academy-deploy/inventory.txt yourself before sharing it: it lists services, ports and site names.
set -uo pipefail
OUT=~/academy-deploy; mkdir -p "$OUT"; cd "$OUT"
R=https://ramz.net.sa

echo "== قبل كل شي: خذ Snapshot للخادم من لوحة SCCC (الخطوة 3-أ في دليل النشر)."
read -r -p "أخذت اللقطة؟ اكتب y للمتابعة: " a; a=$(printf %s "$a" | tr -d "\r[:space:]" | tr A-Z a-z); [ "$a" = y ] || [ "$a" = yes ] || [ "$a" = نعم ] || { echo "وقفنا. خذ اللقطة أولًا."; exit 1; }

{
  echo "### النظام";            cat /etc/os-release 2>/dev/null | grep -E '^(PRETTY_NAME|VERSION_ID)='; uptime; echo "cpu: $(nproc)"; free -h; df -h /
  echo; echo "### المنافذ المستخدمة";  sudo ss -ltnp
  echo; echo "### الخدمات الشغّالة";  systemctl list-units --type=service --state=running --no-pager --plain | head -60
  echo; echo "### pm2 / docker";      { command -v pm2 >/dev/null && pm2 ls; } ; { command -v docker >/dev/null && sudo docker ps --format '{{.Names}}  {{.Image}}  {{.Ports}}'; } ; true
  echo; echo "### خادم الويب";
  for w in nginx caddy apache2 httpd; do command -v $w >/dev/null && echo "found: $w"; done
  if command -v nginx >/dev/null; then
    nginx -v 2>&1
    ls -la /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null
    echo "-- server_name / listen / root / proxy_pass / default_server:"
    sudo nginx -T 2>/dev/null | grep -nE "^# configuration file|server_name|listen|root |proxy_pass|default_server|include "
  fi
  echo; echo "### الشهادات (أسماء المجلدات فقط)";   sudo ls /etc/letsencrypt/live 2>/dev/null; command -v certbot >/dev/null && certbot --version 2>&1
  echo; echo "### Node";                 command -v node >/dev/null && node -v || echo "no node"
  echo; echo "### المهام المجدولة (أسماء فقط، بدون محتوى قد يكون فيه أسرار)"; sudo crontab -l 2>/dev/null | grep -vc '^#' | sed 's/^/root crontab lines: /'; ls /etc/cron.d
  echo; echo "### هل الأكاديمية موجودة أصلًا؟"; ls -la /srv/academy 2>/dev/null || echo "/srv/academy غير موجود — تمام"
  sudo nginx -T 2>/dev/null | grep -n "academy.ramz.net.sa" || echo "لا يوجد server_name للأكاديمية — تمام"
} 2>&1 | tee inventory.txt

echo; echo "== خط الأساس لموقع رمز (قراءة فقط، GET بدون إرسال أي طلب)"
curl -s -o /dev/null -w "%{http_code}\n" $R/              > base-home-code.txt
curl -s $R/ | sha256sum                                    > base-home-hash.txt
curl -sI $R/ | grep -iE "^(http|server|content-security|strict-transport)" > base-headers.txt
curl -s -o /dev/null -w "%{http_code}\n" $R/api/requests   > base-api-code.txt
curl -s -o /dev/null -w "%{http_code}\n" https://www.ramz.net.sa/ > base-www-code.txt
echo "home: $(cat base-home-code.txt) · api: $(cat base-api-code.txt) · www: $(cat base-www-code.txt)"
echo
echo "==================== الملخص (صوّره وأرسله) ===================="
grep -m1 PRETTY_NAME inventory.txt
free -h | awk '/Mem:/{print "memory: "$2" total, "$7" available"}'
grep -E "^found:" inventory.txt | tr '\n' ' '; echo
command -v nginx >/dev/null && nginx -v 2>&1
command -v nginx >/dev/null && echo "nginx layout: $( [ -d /etc/nginx/sites-enabled ] && echo sites-enabled || echo conf.d )"
command -v nginx >/dev/null && sudo nginx -T 2>/dev/null | grep -E "^\s*(server_name|listen)" | sed 's/^\s*//' | sort | uniq -c | head -20
echo "listening on 80/443: $(sudo ss -ltnp | awk '$4 ~ /:(80|443)$/ {print $4" "$6}' | sed -E 's/users:\(\("([^"]+)".*/\1/' | sort -u | tr '\n' ' ')"
echo "certificates: $(sudo ls /etc/letsencrypt/live 2>/dev/null | grep -v README | tr '\n' ' ')"
echo "ramz.net.sa → $(cat base-home-code.txt) · /api/requests → $(cat base-api-code.txt) · www → $(cat base-www-code.txt)"
[ -d /srv/academy ] && echo "/srv/academy: موجود!" || echo "/srv/academy: غير موجود — تمام"
echo "================================================================="
echo "المخرجات الكاملة في $OUT/inventory.txt (لا ترسلها كاملة؛ الملخص يكفي)."
