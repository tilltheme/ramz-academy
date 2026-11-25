#!/usr/bin/env bash
# أكاديمية رمـز — فحص إن موقع رمز ما تأثر (القسم 6 من دليل النشر). قراءة فقط. شغّله بعد كل خطوة.
#   bash deploy/check-ramz.sh [اسم-خدمة-رمز]      # مثال: bash deploy/check-ramz.sh ramz-server
set -uo pipefail
cd ~/academy-deploy || { echo "شغّل 1-inventory.sh أولًا (يسجّل خط الأساس)"; exit 1; }
R=https://ramz.net.sa; bad=0
chk() { if diff -q <(eval "$2") "$3" >/dev/null; then echo "OK   $1"; else echo "FAIL $1 — كان: $(cat "$3") · الحين: $(eval "$2")"; bad=1; fi; }
chk "رمز — الرئيسية تفتح"        "curl -s -o /dev/null -w '%{http_code}\n' $R/"            base-home-code.txt
chk "رمز — محتوى الرئيسية نفسه"  "curl -s $R/ | sha256sum"                                  base-home-hash.txt
chk "رمز — خادم الطلبات"          "curl -s -o /dev/null -w '%{http_code}\n' $R/api/requests" base-api-code.txt
chk "رمز — www"                   "curl -s -o /dev/null -w '%{http_code}\n' https://www.ramz.net.sa/" base-www-code.txt
if [ -n "${1:-}" ]; then
  if systemctl is-active --quiet "$1"; then echo "OK   خدمة رمز ($1) active"; else echo "FAIL خدمة رمز ($1) مو active"; bad=1; fi
fi
[ $bad = 0 ] && echo "رمز كما هو." || { echo "!! تغيّر شي في رمز: وقّف، وشغّل deploy/rollback.sh، وبلّغ المالك."; exit 1; }
