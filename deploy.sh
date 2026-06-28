#!/bin/bash
set -e

# Deployment Script for Oracle Cloud

# 1. Pull the latest code
echo "Pulling latest code from main branch..."
git fetch origin main
git reset --hard origin/main

# 2. Stop existing containers
echo "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# 3. Build and Start the new containers
echo "Building and starting new containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Clean up dangling images to save Oracle Cloud disk space
echo "Pruning dangling images..."
docker image prune -f

echo "Deployment successful!"
