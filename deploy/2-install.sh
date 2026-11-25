#!/usr/bin/env bash
# أكاديمية رمـز — الخطوة 2: تركيب الموقع على نفس الخادم، بعزل كامل عن رمز. يسأل قبل كل تغيير.
#   bash deploy/2-install.sh
# What it adds (and nothing else):
#   /srv/academy/releases/<time>/      the site's files, from github.com/tilltheme/ramz-academy (main)
#   /srv/academy/site  →  that release  (a link, so updates and rollbacks are one switch)
#   /srv/academy/acme/                 for the academy's certificate only
#   one new nginx file for academy.ramz.net.sa (+ its link), after a full backup of /etc/nginx
# No service, no port, no Node, no database: nginx serves the files. Ramz's files are never opened for writing.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; NAME=academy.ramz.net.sa
REPO_TAR=https://github.com/tilltheme/ramz-academy/archive/refs/heads/main.tar.gz
ask() { echo; echo "── $1"; read -r -p "   موافق؟ اكتب y للتنفيذ، أي شي ثاني يوقف: " a; a=$(printf %s "$a" | tr -d "\r[:space:]" | tr A-Z a-z); { [ "$a" = y ] || [ "$a" = yes ] || [ "$a" = نعم ]; } || { echo "   وقفنا بدون تغيير."; exit 1; }; }

# ---------- checks first (read only) ----------
command -v nginx >/dev/null || { echo "nginx مو موجود — هذا السكربت لـnginx فقط. أرسل مخرجات الجرد لـClaude."; exit 1; }
[ -f ~/academy-deploy/base-home-code.txt ] || { echo "شغّل deploy/1-inventory.sh أولًا."; exit 1; }
if sudo nginx -T 2>/dev/null | grep -q "server_name[^;]*$NAME"; then echo "فيه server block للاسم $NAME مسبقًا — وقفنا عشان ما نتعارض."; exit 1; fi
if [ -d /etc/nginx/sites-available ] && grep -qs "sites-enabled" /etc/nginx/nginx.conf; then
  AVAIL=/etc/nginx/sites-available/$NAME; ENABLED=/etc/nginx/sites-enabled/$NAME
else
  AVAIL=/etc/nginx/conf.d/$NAME.conf; ENABLED=""          # layouts with conf.d only: the file itself is the switch
fi
[ ! -e "$AVAIL" ] || { echo "$AVAIL موجود مسبقًا — وقفنا."; exit 1; }
sudo nginx -t >/dev/null 2>&1 || { echo "nginx -t يفشل قبل أي تغيير منا — ما نلمس شي. راجع الإعداد الحالي أولًا."; exit 1; }
echo "nginx سليم، والاسم $NAME غير مستخدم. الملف الجديد بيكون: $AVAIL"

# ---------- 1) the files ----------
REL=/srv/academy/releases/$(date +%Y%m%d-%H%M%S)
ask "أنشئ /srv/academy (مجلد جديد ومستقل) ونزّل ملفات الموقع من GitHub إلى $REL"
sudo install -d -m 755 /srv/academy /srv/academy/releases /srv/academy/acme "$REL"
curl -fsSL "$REPO_TAR" | sudo tar -xz --no-same-owner -C "$REL" --strip-components=2 --wildcards '*/site/'
sudo find "$REL" -type d -exec chmod 755 {} + ; sudo find "$REL" -type f -exec chmod 644 {} +
[ -f "$REL/index.html" ] && [ -f "$REL/404.html" ] || { echo "التنزيل ناقص — وقفنا (ما لمسنا nginx)."; exit 1; }
sudo ln -sfn "$REL" /srv/academy/site
echo "   الملفات: $(sudo find "$REL" -type f | wc -l) ملف في $REL"

# ---------- 2) nginx: a new file only, reload only if the test passes ----------
BK=/root/nginx-backup-$(date +%F-%H%M)
ask "انسخ /etc/nginx احتياطيًا إلى $BK، وأضف ملف الأكاديمية الجديد ($AVAIL)، ثم nginx -t، وإذا نجح: reload (مو restart)"
sudo cp -a /etc/nginx "$BK"
sudo install -m 644 "$HERE/nginx/academy-http.conf" "$AVAIL"
[ -n "$ENABLED" ] && sudo ln -s "$AVAIL" "$ENABLED"
if sudo nginx -t; then
  sudo systemctl reload nginx
  echo "   nginx: reload تم."
else
  echo "   nginx -t فشل — نشيل ملف الأكاديمية ولا نسوي reload."
  [ -n "$ENABLED" ] && sudo rm -f "$ENABLED"; sudo rm -f "$AVAIL"; exit 1
fi

# ---------- 3) check: the academy answers to its name, Ramz unchanged ----------
sleep 1
code=$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $NAME" http://127.0.0.1/)
title=$(curl -s -H "Host: $NAME" http://127.0.0.1/ | grep -o '<title>[^<]*' | head -1)
echo "   الأكاديمية على الخادم: $code ${title#<title>}"
bash "$HERE/check-ramz.sh" || exit 1
echo
echo "تم. الخطوة التالية: أضف سجل DNS من نوع A للاسم academy (academy.ramz.net.sa) على عنوان هذا الخادم،"
echo "ولما يشتغل (ping academy.ramz.net.sa يرجع عنوان الخادم)، شغّل: bash deploy/3-certificate.sh"
