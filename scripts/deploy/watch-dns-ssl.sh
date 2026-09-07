#!/bin/bash
# watch-dns-ssl.sh: Background script to monitor DNS propagation and trigger Let's Encrypt SSL setup

DOMAINS=("erp.futaneagro.com" "uat.futaneagro.com" "futaneagro.com" "www.futaneagro.com")
VM_IP="80.225.192.171"
PROJECT_DIR="/home/ubuntu/futane-agro-app/futane-agro-app"

# Check if real Let's Encrypt certificates are already generated
if sudo certbot certificates 2>/dev/null | grep -q "Expiry Date"; then
    echo "[INFO] Let's Encrypt certificates are already active. No action needed."
    exit 0
fi

echo "[INFO] Checking DNS resolution for domains against VM IP $VM_IP..."
DNS_OK=1

# Check if dig command is installed, fallback to getent
has_dig=0
if command -v dig &> /dev/null; then
    has_dig=1
fi

for DOMAIN in "${DOMAINS[@]}"; do
    if [ $has_dig -eq 1 ]; then
        RESOLVED_IP=$(dig +short "$DOMAIN" @8.8.8.8 | tail -n1)
    else
        RESOLVED_IP=$(getent hosts "$DOMAIN" | awk '{print $1}')
    fi
    
    if [ "$RESOLVED_IP" != "$VM_IP" ]; then
        echo "[INFO] Domain $DOMAIN resolved to '$RESOLVED_IP' (expected $VM_IP)."
        DNS_OK=0
    fi
done

if [ $DNS_OK -eq 1 ]; then
    echo "[SUCCESS] DNS records fully propagated! Triggering SSL bootstrapping..."
    cd $PROJECT_DIR
    sudo chmod +x setup-ssl.sh
    sudo ./setup-ssl.sh
else
    echo "[INFO] DNS check not satisfied yet. Waiting for propagation."
fi
