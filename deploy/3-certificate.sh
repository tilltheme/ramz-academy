#!/usr/bin/env bash
# أكاديمية رمـز — الخطوة 3: شهادة HTTPS للأكاديمية فقط، ثم تفعيلها في ملف الأكاديمية فقط.
#   bash deploy/3-certificate.sh
# certbot certonly --webroot: issues a certificate for academy.ramz.net.sa alone and edits no nginx file.
# Its renewal reloads nginx only (never restart), and touches no Ramz certificate.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; NAME=academy.ramz.net.sa
ask() { echo; echo "── $1"; read -r -p "   موافق؟ اكتب y للتنفيذ، أي شي ثاني يوقف: " a; [ "$a" = y ] || { echo "   وقفنا بدون تغيير."; exit 1; }; }
command -v certbot >/dev/null || { echo "certbot مو موجود. لا تركّبه من هنا؛ أرسل لـClaude وش يستخدم الخادم للشهادات."; exit 1; }
if [ -e /etc/nginx/sites-available/$NAME ]; then AVAIL=/etc/nginx/sites-available/$NAME; else AVAIL=/etc/nginx/conf.d/$NAME.conf; fi
[ -f "$AVAIL" ] || { echo "شغّل deploy/2-install.sh أولًا."; exit 1; }

# the name must already reach this server, and the challenge folder must answer through it
echo probe > /tmp/academy-probe && sudo install -d -m 755 /srv/academy/acme/.well-known/acme-challenge && sudo install -m 644 /tmp/academy-probe /srv/academy/acme/.well-known/acme-challenge/probe
got=$(curl -s --max-time 10 http://$NAME/.well-known/acme-challenge/probe || true); sudo rm -f /srv/academy/acme/.well-known/acme-challenge/probe
[ "$got" = probe ] || { echo "الاسم $NAME ما يوصل لهذا الخادم بعد (سجل DNS؟). جرّب بعد شوي."; exit 1; }

ask "اطلب شهادة لـ$NAME فقط (certbot certonly --webroot -w /srv/academy/acme -d $NAME)"
sudo certbot certonly --webroot -w /srv/academy/acme -d "$NAME" --non-interactive --agree-tos --register-unsafely-without-email \
  --deploy-hook "nginx -t && systemctl reload nginx"
[ -f /etc/letsencrypt/live/$NAME/fullchain.pem ] || { echo "الشهادة ما صدرت — ما غيّرنا nginx."; exit 1; }

ask "بدّل ملف الأكاديمية فقط إلى نسخة HTTPS، ثم nginx -t، وإذا نجح: reload"
sudo cp "$AVAIL" /srv/academy/nginx-http.conf.bak
sudo install -m 644 "$HERE/nginx/academy-https.conf" "$AVAIL"
if sudo nginx -t; then sudo systemctl reload nginx; echo "   HTTPS شغّال."
else echo "   nginx -t فشل — نرجّع نسخة HTTP."; sudo install -m 644 /srv/academy/nginx-http.conf.bak "$AVAIL"; sudo nginx -t && sudo systemctl reload nginx; exit 1; fi

sleep 1
echo "   https://$NAME → $(curl -s -o /dev/null -w '%{http_code}' https://$NAME/)"
bash "$HERE/check-ramz.sh" || exit 1
echo; echo "تم. الأكاديمية على https://$NAME"
