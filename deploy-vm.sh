#!/bin/bash
# VM deployment script for Futane Agro ERP

ENV=$1
if [ "$ENV" != "uat" ] && [ "$ENV" != "prod" ]; then
    echo "Usage: ./deploy-vm.sh [uat|prod]"
    exit 1
fi

echo "[INFO] Starting Deployment for $ENV..."

PROJECT_DIR="/home/ubuntu/futane-agro-app/futane-agro-app"
cd $PROJECT_DIR

# Ensure SSL certificates are bootstrapped for Nginx gateway
if [ ! -f "/etc/letsencrypt/live/erp.futaneagro.com/fullchain.pem" ]; then
    echo "[INFO] SSL certificates not found. Running SSL bootstrapping..."
    sudo chmod +x setup-ssl.sh renew-ssl.sh
    sudo ./setup-ssl.sh
fi

if [ "$ENV" == "uat" ]; then
    # Deploy UAT
    echo "[UAT] Stopping UAT containers..."
    sudo docker-compose -f docker-compose.uat.yml down
    
    echo "[UAT] Building and launching UAT services..."
    sudo docker-compose -f docker-compose.uat.yml up --build -d
    
    # Ensure Nginx gateway is running to proxy UAT traffic
    if [ ! "$(sudo docker ps -q -f name=futane_agro_gateway)" ]; then
        echo "[INFO] Nginx gateway is not running. Starting it..."
        sudo docker-compose -f docker-compose.prod.yml up -d nginx-gateway
    fi
    
    echo "[SUCCESS] UAT Deployment finished successfully!"
    sudo docker-compose -f docker-compose.uat.yml ps
else
    # Deploy Production
    echo "[PROD] Stopping Production/Gateway containers..."
    sudo docker-compose -f docker-compose.prod.yml down
    
    echo "[PROD] Building and launching Production/Gateway services..."
    sudo docker-compose -f docker-compose.prod.yml up --build -d
    
    echo "[SUCCESS] Production/Gateway Deployment finished successfully!"
    sudo docker-compose -f docker-compose.prod.yml ps
fi
