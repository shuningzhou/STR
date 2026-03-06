# STR – Deployment Guide

Step-by-step guide to deploy STR on a Linux VM (no Docker).

---

## Quick reference: full deployment order

| Step | Where | What |
|------|-------|-----|
| 1 | Local | Create deploy/deploy.config from example, copy values from apps/api/.env |
| 2 | DNS | Point domain A record to SERVER_IP |
| 3 | Cloud console | Open ports 22, 80, 443 |
| 4 | Local | `./deploy/build.sh` then `./deploy/copy-to-vm.sh` |
| 5 | VM | `./deploy/vm/setup.sh` |
| 6 | VM | `sudo certbot --nginx -d DOMAIN_NAME -d www.DOMAIN_NAME` (if not already done) |
| 7 | Browser | https://yourdomain.com |

---

## Step 1: Config (local)

**deploy/deploy.config** holds all deployment and API config. It is gitignored (secrets are not committed).

If it does not exist, create it from the example:

```bash
cp deploy/deploy.config.example deploy/deploy.config
```

Then edit **deploy/deploy.config** and set your values. You can copy API keys from **apps/api/.env** (your local dev config):

- **SERVER_IP**, **DOMAIN_NAME** – VM IP and domain
- **MONGODB_URI**, **EODHD_API_TOKEN**, **MASSIVE_API_KEY**, **JWT_SECRET**, **RESEND_API_KEY** – same as apps/api/.env

`copy-to-vm.sh` generates `apps/api/.env` on the VM from `deploy.config`.

---

## Step 2: DNS

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
./deploy/build.sh
./deploy/copy-to-vm.sh
```

`build.sh` will:
1. Apply config (nginx template)
2. Build the frontend (apps/web)
3. Build the backend (apps/api)

`copy-to-vm.sh` will:
1. Generate apps/api/.env from deploy.config
2. Ask you to press Enter, then rsync to the VM (enter SSH password when prompted)
3. Copy builds, deploy scripts, and apps/api/.env

If rsync fails, run the rsync command manually from the script output.

---

## Step 5: VM setup (on the VM)

If replacing a previous deployment, remove the old nginx site first (e.g. `sudo rm /etc/nginx/sites-enabled/default` or the old app's config).

```bash
cd /root/STR
sudo ./deploy/vm/setup.sh
```

This will:
- Install production npm dependencies
- Install and start the str-api systemd service
- Configure nginx and reload it
- Set permissions on the frontend build

---

## Step 6: SSL (on the VM, if not already done)

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Press Enter when prompted. Certbot will obtain and configure Let's Encrypt.

---

## Step 7: Node.js (on the VM, if missing)

If Node.js is not installed:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs
```

---

## Step 8: Permissions (on the VM, if you get 500)

```bash
sudo chmod 755 /root /root/STR /root/STR/apps/web
sudo chmod -R 755 /root/STR/apps/web/dist
sudo systemctl reload nginx
```

---

## Access

- **HTTPS:** https://yourdomain.com
- Register a new user or sign in with existing credentials.

---

## Deploying updates

After code changes:

```bash
./deploy/build.sh
./deploy/copy-to-vm.sh
```

Then on the VM:

```bash
sudo systemctl restart str-api
sudo systemctl reload nginx
```

No need to re-run setup. Credentials and deploy.config are preserved. Hard-refresh the browser (Ctrl+Shift+R).

---

## Useful commands (VM)

```bash
# Status
sudo systemctl status str-api nginx

# Restart API
sudo systemctl restart str-api

# Reload nginx
sudo systemctl reload nginx

# Logs
sudo journalctl -u str-api -f

# fix https issue
certbot --nginx -d opticanvas.com -d www.opticanvas.com

```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| ERR_CONNECTION_REFUSED | Open ports 80/443 in cloud firewall |
| 500 Internal Server Error | Run Step 8 (chmod permissions) |
| API fails to start | Check deploy.config has API vars, run `journalctl -u str-api -n 50` |
| Login 401 / Invalid credentials | Verify JWT_SECRET and MONGODB_URI in deploy.config |
| Node not found | Install Node.js (Step 8) |
