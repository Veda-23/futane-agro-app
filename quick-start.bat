@echo off
setlocal enabledelayedexpansion
title Futane Agro ERP - Automated 1-Click Launch Engine
cls
echo =================================================================
echo   FUTANE AGRO ERP — ZERO-FRICTION SETUP & LAUNCH ENGINE
echo =================================================================
echo   Checking environment prerequisites...
echo.

:: 1. Check Docker Desktop first
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [FOUND] Docker Desktop detected.
    echo.
    echo Choose your launch method:
    echo   [1] Full Docker Launch (Recommended - Zero manual install)
    echo   [2] Native Local Machine Launch (Java + Node + PostgreSQL)
    echo.
    set /p LAUNCH_MODE="Select option [1 or 2, default is 1]: "
    if "!LAUNCH_MODE!"=="" set LAUNCH_MODE=1
    if "!LAUNCH_MODE!"=="1" (
        echo.
        echo [LAUNCHING] Starting PostgreSQL 16, Backend, and Frontend in Docker...
        docker compose -f docker-compose.uat.yml up -d
        echo.
        echo [WAITING] Waiting for containers to initialize (15 seconds)...
        timeout /t 15 /nobreak >nul
        start "" /B node scripts\postgres-ui-server.mjs
        echo [READY] Opening browser to http://localhost:4300 and http://localhost:5433
        start http://localhost:4300
        start http://localhost:5433
        echo.
        echo Application is live at http://localhost:4300
        echo Database Studio is live at http://localhost:5433
        echo Login with username: ADMIN  password: admin123  (OTP: check console or dev bypass)
        pause
        exit /b 0
    )
)

:: 2. Native Mode Checks
echo [NATIVE MODE] Verifying local development stack...

:: Check Java
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Java 17+ is required but not found in PATH.
    echo Please install OpenJDK 17 or run Docker Desktop.
    pause
    exit /b 1
)
echo [OK] Java detected.

:: Check Node
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js 18+ is required but not found in PATH.
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js detected.

:: 3. Launch Stack
echo.
echo =================================================================
echo   STARTING FUTANE AGRO ERP LOCALLY
echo =================================================================

:: Start backend
if exist "backend\target\futane-agro-app-0.0.1-SNAPSHOT.jar" (
    echo [1/3] Starting Spring Boot Backend on port 8081...
    start "Futane Agro - Backend (Port 8081)" java -Xms128m -Xmx384m -jar backend\target\futane-agro-app-0.0.1-SNAPSHOT.jar --spring.profiles.active=uat --server.port=8081 --spring.datasource.username=futane_app_user --spring.datasource.password="FutaneAgro#Secure2026!App"
) else (
    echo [WARN] Backend JAR not found. Building with Maven...
    cd backend
    call mvn clean package -DskipTests
    cd ..
    start "Futane Agro - Backend (Port 8081)" java -Xms128m -Xmx384m -jar backend\target\futane-agro-app-0.0.1-SNAPSHOT.jar --spring.profiles.active=uat --server.port=8081 --spring.datasource.username=futane_app_user --spring.datasource.password="FutaneAgro#Secure2026!App"
)

:: Start frontend
echo [2/3] Starting Frontend Server on port 4300...
if not exist "frontend\dist" (
    echo [INFO] Building frontend distribution bundle...
    cd frontend
    call npm install --no-audit
    call npm run build:uat
    cd ..
)

start "Futane Agro - Frontend (Port 4300)" node scripts\lightweight-server.js 4300
start "Futane Agro - Database UI (Port 5433)" /B node scripts\postgres-ui-server.mjs

echo [3/3] Waiting 10 seconds for services to settle...
timeout /t 10 /nobreak >nul

start http://localhost:4300
start http://localhost:5433

echo.
echo =================================================================
echo   FUTANE AGRO ERP IS NOW LIVE!
echo   ERP Web:  http://localhost:4300
echo   DB UI:    http://localhost:5433
echo   Admin:    Username: ADMIN       Password: admin123
echo   Super:    Username: SUPER_ADMIN Password: superadmin123
echo =================================================================
echo Minimize this window to keep servers running.
pause
