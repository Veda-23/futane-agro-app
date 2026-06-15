#!/bin/bash
# Script to bootstrap Let's Encrypt SSL certificates for Futane Agro ERP securely

EMAIL="admin@futaneagro.com"
DOMAINS_PROD=("erp.futaneagro.com" "futaneagro.com" "www.futaneagro.com")
DOMAINS_UAT=("uat.futaneagro.com")

echo "[INFO] Bootstrapping SSL setup..."

# 1. Check DNS resolution for domains before continuing
echo "[INFO] Checking DNS resolution for domains..."
DNS_WARNING=0
for DOMAIN in "${DOMAINS_PROD[@]}" "${DOMAINS_UAT[@]}"; do
    if ! getent hosts "$DOMAIN" > /dev/null; then
        echo "[WARNING] Domain $DOMAIN does not resolve to any IP address."
        DNS_WARNING=1
    fi
done

if [ $DNS_WARNING -eq 1 ]; then
    echo "[WARNING] Some domains do not resolve yet. Certbot HTTP-01 challenge will likely fail if run now."
    echo "[INFO] Continuing anyway to prepare folders and dummy certificates..."
fi

# 2. Create cert directories on host
sudo mkdir -p /etc/letsencrypt/live/erp.futaneagro.com
sudo mkdir -p /etc/letsencrypt/live/uat.futaneagro.com
sudo mkdir -p /var/www/certbot

# 3. Generate secure Diffie-Hellman parameters if missing
if [ ! -f /etc/letsencrypt/dhparam.pem ]; then
    echo "[INFO] Generating custom 2048-bit DH parameters (dhparam.pem)..."
    sudo openssl dhparam -out /etc/letsencrypt/dhparam.pem 2048
fi

# 4. If certificates don't exist yet, generate temporary self-signed certs so Nginx can start
if [ ! -f "/etc/letsencrypt/live/erp.futaneagro.com/fullchain.pem" ]; then
    echo "[INFO] Creating temporary self-signed certificate for erp.futaneagro.com..."
    sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout "/etc/letsencrypt/live/erp.futaneagro.com/privkey.pem" \
        -out "/etc/letsencrypt/live/erp.futaneagro.com/fullchain.pem" \
        -subj "/CN=erp.futaneagro.com"
    sudo cp "/etc/letsencrypt/live/erp.futaneagro.com/fullchain.pem" "/etc/letsencrypt/live/erp.futaneagro.com/chain.pem"
fi

if [ ! -f "/etc/letsencrypt/live/uat.futaneagro.com/fullchain.pem" ]; then
    echo "[INFO] Creating temporary self-signed certificate for uat.futaneagro.com..."
    sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout "/etc/letsencrypt/live/uat.futaneagro.com/privkey.pem" \
        -out "/etc/letsencrypt/live/uat.futaneagro.com/fullchain.pem" \
        -subj "/CN=uat.futaneagro.com"
    sudo cp "/etc/letsencrypt/live/uat.futaneagro.com/fullchain.pem" "/etc/letsencrypt/live/uat.futaneagro.com/chain.pem"
fi

# 5. Start the Nginx gateway container with dummy certs
echo "[INFO] Starting Nginx gateway container..."
sudo docker-compose -f docker-compose.prod.yml up -d nginx-gateway

# 6. Install certbot on host if missing
if ! command -v certbot &> /dev/null; then
    echo "[INFO] Installing Certbot..."
    sudo apt-get update && sudo apt-get install -y certbot
fi

# 7. Backup dummy folders temporarily to avoid -0001 suffix during Let's Encrypt issuance
echo "[INFO] Backing up dummy certificates..."
sudo mv /etc/letsencrypt/live/erp.futaneagro.com /etc/letsencrypt/live/erp.futaneagro.com.bak
sudo mv /etc/letsencrypt/live/uat.futaneagro.com /etc/letsencrypt/live/uat.futaneagro.com.bak

# 8. Request real certificates from Let's Encrypt via HTTP-01 challenge
CERT_ERR=0

echo "[INFO] Requesting real SSL certificate for Production (erp.futaneagro.com)..."
sudo certbot certonly --webroot -w /var/www/certbot \
    -d erp.futaneagro.com -d futaneagro.com -d www.futaneagro.com \
    --email "$EMAIL" \
    --agree-tos --no-eff-email --keep-until-expiring --non-interactive
if [ $? -ne 0 ]; then
    echo "[ERROR] Certbot request failed for erp.futaneagro.com"
    CERT_ERR=1
fi

echo "[INFO] Requesting real SSL certificate for UAT (uat.futaneagro.com)..."
sudo certbot certonly --webroot -w /var/www/certbot \
    -d uat.futaneagro.com \
    --email "$EMAIL" \
    --agree-tos --no-eff-email --keep-until-expiring --non-interactive
if [ $? -ne 0 ]; then
    echo "[ERROR] Certbot request failed for uat.futaneagro.com"
    CERT_ERR=1
fi

# 9. Restore or Clean Up backups
if [ $CERT_ERR -eq 0 ]; then
    echo "[INFO] Real SSL certificates obtained successfully! Removing dummy backups..."
    sudo rm -rf /etc/letsencrypt/live/erp.futaneagro.com.bak
    sudo rm -rf /etc/letsencrypt/live/uat.futaneagro.com.bak
else
    echo "[WARNING] One or more Certbot requests failed. Restoring dummy backups to ensure Nginx survival..."
    if [ ! -d "/etc/letsencrypt/live/erp.futaneagro.com" ]; then
        sudo mv /etc/letsencrypt/live/erp.futaneagro.com.bak /etc/letsencrypt/live/erp.futaneagro.com
    else
        sudo rm -rf /etc/letsencrypt/live/erp.futaneagro.com.bak
    fi
    if [ ! -d "/etc/letsencrypt/live/uat.futaneagro.com" ]; then
        sudo mv /etc/letsencrypt/live/uat.futaneagro.com.bak /etc/letsencrypt/live/uat.futaneagro.com
    else
        sudo rm -rf /etc/letsencrypt/live/uat.futaneagro.com.bak
    fi
    exit 1
fi

# 10. Reload Nginx gateway to load the newly generated real certificates
echo "[INFO] Reloading Nginx gateway with Let's Encrypt certificates..."
sudo docker exec futane_agro_gateway nginx -s reload

echo "[SUCCESS] SSL setup completed successfully!"
