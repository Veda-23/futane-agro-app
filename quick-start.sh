#!/bin/bash
# =================================================================
# FUTANE AGRO ERP — ZERO-FRICTION SETUP & LAUNCH (Linux / macOS)
# =================================================================
set -e

echo "================================================================="
echo "  FUTANE AGRO ERP — ZERO-FRICTION SETUP & LAUNCH (UNIX)"
echo "================================================================="

# Docker Check
if command -v docker &> /dev/null && docker info &> /dev/null; then
    echo "[FOUND] Docker detected. Launching full containerized stack..."
    docker compose -f docker-compose.uat.yml up -d
    echo "Waiting 12 seconds for container initialization..."
    sleep 12
    echo "Futane Agro ERP is live at http://localhost:4300"
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:4300
    elif command -v open &> /dev/null; then
        open http://localhost:4300
    fi
    exit 0
fi

# Native Mode
echo "[NATIVE MODE] Checking Java and Node.js..."
if ! command -v java &> /dev/null; then
    echo "[ERROR] Java 17+ is required. Please install OpenJDK 17."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js 18+ is required. Please install Node.js."
    exit 1
fi

# Start Backend
echo "Starting Spring Boot Backend..."
if [ -f "backend/target/futane-agro-app-0.0.1-SNAPSHOT.jar" ]; then
    java -Xms128m -Xmx384m -jar backend/target/futane-agro-app-0.0.1-SNAPSHOT.jar --spring.profiles.active=uat --server.port=8081 &
else
    cd backend && mvn clean package -DskipTests && cd ..
    java -Xms128m -Xmx384m -jar backend/target/futane-agro-app-0.0.1-SNAPSHOT.jar --spring.profiles.active=uat --server.port=8081 &
fi

# Start Frontend
echo "Starting Frontend Server..."
if [ ! -d "frontend/dist" ]; then
    cd frontend && npm install && npm run build:uat && cd ..
fi

node scripts/lightweight-server.js 4300 &

sleep 8
echo "================================================================="
echo "  FUTANE AGRO ERP IS LIVE AT http://localhost:4300"
echo "  Admin Login: ADMIN / admin123"
echo "================================================================="
