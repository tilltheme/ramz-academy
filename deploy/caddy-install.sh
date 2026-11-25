#!/usr/bin/env bash
# أكاديمية رمـز — التركيب على خادم Caddy. يسأل قبل كل تغيير، ويفحص رمز بعده.
#   bash deploy/caddy-install.sh
# What it adds (and nothing else):
#   /srv/academy/releases/<time>/ + /srv/academy/site (link)   the site's files, from GitHub main
#   /etc/caddy/academy.caddy                                     the academy's own site block
#   one line at the end of /etc/caddy/Caddyfile:  import /etc/caddy/academy.caddy   (after a backup)
# Ramz's blocks are not edited. Caddy is reloaded (never restarted), only after `caddy validate` passes;
# a failed reload leaves the running config as it was.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; NAME=academy.ramz.net.sa
CF=/etc/caddy/Caddyfile; SITE=/etc/caddy/academy.caddy; LINE="import $SITE"
REPO_TAR=https://github.com/tilltheme/ramz-academy/archive/refs/heads/main.tar.gz
ask() { echo; echo "── $1"; read -r -p "   موافق؟ اكتب y للتنفيذ، أي شي ثاني يوقف: " a; a=$(printf %s "$a" | tr -d "\r[:space:]" | tr A-Z a-z); { [ "$a" = y ] || [ "$a" = yes ] || [ "$a" = نعم ]; } || { echo "   وقفنا بدون تغيير."; exit 1; }; }

# ---------- checks first (read only) ----------
command -v caddy >/dev/null && systemctl is-active --quiet caddy || { echo "Caddy مو شغّال — وقفنا."; exit 1; }
[ -f ~/academy-deploy/base-home-code.txt ] || { echo "شغّل deploy/1-inventory.sh أولًا."; exit 1; }
grep -q "$NAME" "$CF" && { echo "الاسم $NAME موجود في $CF مسبقًا — وقفنا."; exit 1; }
[ ! -e "$SITE" ] || { echo "$SITE موجود مسبقًا — وقفنا."; exit 1; }
sudo caddy validate --config "$CF" --adapter caddyfile >/dev/null 2>&1 || { echo "إعداد Caddy الحالي ما ينجح في validate قبل أي تغيير منا — ما نلمس شي."; exit 1; }
ramz_ip=$(getent ahostsv4 ramz.net.sa | awk 'NR==1{print $1}'); acad_ip=$(getent ahostsv4 $NAME | awk 'NR==1{print $1}' || true)
if [ -z "$acad_ip" ] || [ "$acad_ip" != "$ramz_ip" ]; then
  echo "سجل DNS للأكاديمية مو جاهز: $NAME → ${acad_ip:-لا شيء} (لازم يكون $ramz_ip مثل ramz.net.sa)."
  echo "أضف سجل A للاسم academy على $ramz_ip في لوحة DNS، وانتظر دقائق، ثم أعد التشغيل."; exit 1
fi
echo "Caddy سليم، والاسم $NAME يوصل لهذا الخادم ($acad_ip)، وغير مستخدم في الإعداد."

# ---------- 1) the files ----------
REL=/srv/academy/releases/$(date +%Y%m%d-%H%M%S)
ask "أنشئ /srv/academy (مجلد جديد ومستقل) ونزّل ملفات الموقع من GitHub إلى $REL"
sudo install -d -m 755 /srv/academy /srv/academy/releases "$REL"
curl -fsSL "$REPO_TAR" | sudo tar -xz --no-same-owner -C "$REL" --strip-components=2 --wildcards '*/site/'
sudo find "$REL" -type d -exec chmod 755 {} + ; sudo find "$REL" -type f -exec chmod 644 {} +
[ -f "$REL/index.html" ] && [ -f "$REL/404.html" ] || { echo "التنزيل ناقص — وقفنا (ما لمسنا Caddy)."; exit 1; }
sudo ln -sfn "$REL" /srv/academy/site
echo "   الملفات: $(sudo find "$REL" -type f | wc -l) ملف في $REL"

# ---------- 2) Caddy: own file + one import line, validate, reload ----------
BK=$CF.bak-academy-$(date +%Y%m%d-%H%M%S)
ask "انسخ $CF احتياطيًا إلى $BK، وأضف ملف الأكاديمية $SITE، وأضف سطر واحد في آخر $CF: «$LINE»، ثم caddy validate، وإذا نجح: reload (مو restart)"
undo() { sudo cp -a "$BK" "$CF"; sudo rm -f "$SITE"; echo "   رجّعنا $CF كما كان وشلنا ملف الأكاديمية."; }
sudo cp -a "$CF" "$BK"
sudo install -m 644 "$HERE/caddy/academy.caddy" "$SITE"
printf '\n%s\n' "$LINE" | sudo tee -a "$CF" >/dev/null
if ! sudo caddy validate --config "$CF" --adapter caddyfile; then echo "   validate فشل — ما سوينا reload."; undo; exit 1; fi
if ! sudo systemctl reload caddy; then echo "   reload فشل — Caddy باقي على إعداده القديم."; undo; exit 1; fi
echo "   Caddy: reload تم."

# ---------- 3) check: the academy answers with HTTPS, Ramz unchanged ----------
echo "   ننتظر Caddy يجيب شهادة الأكاديمية (عادة أقل من دقيقة)..."
code=000; for i in $(seq 1 24); do code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 https://$NAME/ || true); [ "$code" = 200 ] && break; sleep 5; done
echo "   https://$NAME → $code"
[ "$code" = 200 ] || echo "   الشهادة لسا ما صدرت. هذا ما يأثر على رمز. شوف: journalctl -u caddy --since '-5 min' | grep -i academy"
bash "$HERE/check-ramz.sh" || exit 1
echo; echo "تم. الأكاديمية على https://$NAME"
