# TradeReporter – Deployment Guide

Step-by-step guide to deploy TradeReporter on a Linux VM (no Docker).

---

## Quick reference: full deployment order

| Step | Where | What |
|------|-------|-----|
| 1 | Local | Edit deploy.config |
| 2 | GoDaddy | DNS → point domain to server IP |
| 3 | Cloud console | Open ports 22, 80, 443 |
| 4 | Local | `./buildAndDeploy.sh` |
| 5 | VM | Backend setup (venv, .env) |
| 6 | VM | systemd (backend + frontend) |
| 7 | VM | `sudo ./deploy/setup-nginx-vm.sh` |
| 8 | Browser | https://yourdomain.com |

**Default login:** `kcezorro` / `Kate2020-`

---

## Step 1: Config (local)

Edit **deploy/deploy.config**:

```
SERVER_IP=YOUR_SERVER_IP
DOMAIN_NAME=yourdomain.com
DEPLOY_MODE=nginx
```

Replace with your VM’s public IP and domain.

---

## Step 2: DNS (GoDaddy)

1. [godaddy.com](https://godaddy.com) → My Products → your domain → DNS
2. **Edit** A record `@` → Data = SERVER_IP
3. **Delete** CNAME for `www` (if it points elsewhere)
4. **Add** A record: Name `www`, Data = SERVER_IP, TTL 600
5. Do not change NS, MX, TXT, or email records

Wait 5–60 minutes for DNS to propagate.

---

## Step 3: Firewall (cloud provider)

In your cloud console, add inbound rules:

- **22** (SSH)
- **80** (HTTP)
- **443** (HTTPS)

---

## Step 4: Build and copy to VM (local)

```bash
./buildAndDeploy.sh
```

This will:

1. Apply config (nginx + frontend .env)
2. Build the frontend
3. Ask you to press Enter, then rsync to the VM (enter SSH password when prompted)

If rsync fails, copy the rsync command from `./deploy/commands.sh` and run it manually.

---

## Step 5: Backend setup (on the VM)

SSH into the VM, then:

```bash
cd /root/TradeReporter/backend

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-local.txt

# Create .env (replace SECRET with output of: openssl rand -hex 32)
cat > .env << EOF
JWT_SECRET=SECRET
CORS_ORIGINS=*
EOF
```

---

## Step 6: systemd services (on the VM)

```bash
sudo cp /root/TradeReporter/deploy/tradereporter-backend.service /etc/systemd/system/
sudo cp /root/TradeReporter/deploy/tradereporter-frontend.service /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable tradereporter-backend tradereporter-frontend
sudo systemctl start tradereporter-backend tradereporter-frontend
```

---

## Step 7: nginx + SSL (on the VM)

```bash
cd /root/TradeReporter
sudo ./deploy/setup-nginx-vm.sh
```

- Installs nginx and certbot
- Configures nginx to serve the app
- Obtains Let’s Encrypt SSL cert
- Stops the frontend service (nginx serves static files)

Press Enter when prompted, then certbot will run.

---

## Step 8: Permissions (on the VM, if you get 500)

```bash
sudo chmod 755 /root /root/TradeReporter /root/TradeReporter/frontend
sudo chmod -R 755 /root/TradeReporter/frontend/build
sudo systemctl reload nginx
```

---

## Access

- **HTTPS:** https://yourdomain.com
- **Login:** `kcezorro` / `Kate2020-`

---

## Redo from the beginning

To redeploy on a fresh VM:

1. Edit **deploy/deploy.config** (SERVER_IP, DOMAIN_NAME)
2. Point DNS to the new server IP (Step 2)
3. Open ports 22, 80, 443 in the cloud firewall (Step 3)
4. Run `./buildAndDeploy.sh` (Step 4)
5. SSH to VM, run Steps 5, 6, 7 above
6. Add permissions (Step 8) if you see 500

---

## Updating an existing deployment

After code changes:

```bash
./buildAndDeploy.sh
```

Credentials and data (`backend/data/credentials.json`, `*.csv`) are not overwritten. No restart needed; nginx serves the new build automatically. Hard-refresh the browser (Ctrl+Shift+R).

---

## Useful commands (VM)

```bash
# Status
sudo systemctl status tradereporter-backend nginx

# Restart backend
sudo systemctl restart tradereporter-backend

# Reload nginx
sudo systemctl reload nginx

# Logs
sudo journalctl -u tradereporter-backend -f
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| ERR_CONNECTION_REFUSED | Open ports 80/443 in cloud firewall |
| 500 Internal Server Error | Run Step 8 (chmod permissions) |
| Login 401 / Invalid credentials | `rm /root/TradeReporter/backend/data/credentials.json` then `sudo systemctl restart tradereporter-backend` |
| Login 404 (wrong URL) | Rebuild with `./deploy/apply-config.sh` then `npm run build`, redeploy |
| Frontend build freezes on VM | Build locally with `./buildAndDeploy.sh` |
