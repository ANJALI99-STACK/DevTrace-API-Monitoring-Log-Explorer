#!/usr/bin/env bash
# Run once on a fresh EC2 instance (Ubuntu 22.04, t2.micro free tier) to set
# up the DevTrace backend + worker. Assumes you've already: created the
# instance, opened inbound ports 22/80/443 in its security group, and can
# SSH in with your key pair.
set -euo pipefail

echo "==> Updating system packages"
sudo apt-get update -y && sudo apt-get upgrade -y

echo "==> Installing Node.js 20"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "==> Installing PM2 and Nginx"
sudo npm install -g pm2
sudo apt-get install -y nginx

echo "==> Cloning the repository"
mkdir -p /home/ubuntu/logs
cd /home/ubuntu
git clone https://github.com/<your-username>/devtrace.git
cd devtrace/backend

echo "==> Installing dependencies and building"
npm ci
cp .env.example .env
echo "!! Edit /home/ubuntu/devtrace/backend/.env with real secrets before continuing !!"
npm run build

echo "==> Starting API + worker under PM2"
pm2 start ../deploy/aws/ecosystem.config.js
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo "==> Configuring Nginx reverse proxy"
sudo cp ../deploy/aws/nginx.conf /etc/nginx/sites-available/devtrace
sudo ln -sf /etc/nginx/sites-available/devtrace /etc/nginx/sites-enabled/devtrace
sudo nginx -t && sudo systemctl restart nginx

echo "==> (Optional) Enable HTTPS with Let's Encrypt"
echo "    sudo apt-get install -y certbot python3-certbot-nginx"
echo "    sudo certbot --nginx -d api.yourdomain.com"

echo "==> Done. API should be reachable on port 80 once DNS points at this instance."
