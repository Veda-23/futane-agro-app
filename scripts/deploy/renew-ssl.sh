#!/bin/bash
# Script to renew Let's Encrypt certificates and reload Nginx gateway

echo "[INFO] Running Let's Encrypt renewal check..."

# Run certbot renew (checks if any certs are within 30 days of expiry)
sudo certbot renew --webroot -w /var/www/certbot --non-interactive

# Reload Nginx inside the docker container to apply any renewed certs
echo "[INFO] Reloading Nginx gateway configuration..."
sudo docker exec futane_agro_gateway nginx -s reload

# Setup self-installing crontab if not already registered
CRON_JOB="0 3 1 * * /home/ubuntu/futane-agro-app/futane-agro-app/renew-ssl.sh >> /var/log/ssl-renew.log 2>&1"
if ! crontab -l 2>/dev/null | grep -q "renew-ssl.sh"; then
    echo "[INFO] Registering cron job for auto-renewal..."
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
fi

echo "[SUCCESS] Renewal check complete."
