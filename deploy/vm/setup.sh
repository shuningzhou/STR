#!/usr/bin/env bash
# Run on the VM after copy-to-vm.sh
# Sets up npm deps, systemd service, and nginx

[ -z "$BASH_VERSION" ] && exec /usr/bin/env bash "$0" "$@"

set -e

STR_ROOT="/root/STR"
DEPLOY="$STR_ROOT/deploy"

if [ ! -d "$STR_ROOT" ]; then
  echo "Error: $STR_ROOT not found. Run copy-to-vm.sh first." >&2
  exit 1
fi

echo "== 1. Install npm dependencies =="
cd "$STR_ROOT"
npm ci --omit=dev

echo ""
echo "== 2. Install systemd service =="
sudo cp "$DEPLOY/vm/str-api.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable str-api
sudo systemctl start str-api

echo ""
echo "== 3. Configure nginx =="
sudo cp "$DEPLOY/nginx-str.conf" /etc/nginx/sites-available/str
sudo ln -sf /etc/nginx/sites-available/str /etc/nginx/sites-enabled/str
# Remove default if it conflicts (optional - may already have certbot config)
# sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo ""
echo "== 4. Set permissions =="
sudo chmod 755 /root /root/STR /root/STR/apps/web
sudo chmod -R 755 /root/STR/apps/web/dist

echo ""
echo "Done. Check: sudo systemctl status str-api nginx"
echo "If HTTPS is not set up: sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com"
