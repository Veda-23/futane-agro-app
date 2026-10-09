# ============================================================
# Futane Agro ERP — LOCAL UAT DEPLOYMENT
# Frontend: http://localhost:4201
# Backend:  http://localhost:8081/api
# ============================================================

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$JAVA17 = "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot\bin\java.exe"
if (-not (Test-Path $JAVA17)) {
    $cmdJava = (Get-Command java -ErrorAction SilentlyContinue).Source
    if ($cmdJava) { $JAVA17 = $cmdJava }
}
$BACKEND = "$ROOT\backend"
$FRONTEND = "$ROOT\frontend"
$JAR = "$BACKEND\target\futane-agro-app-0.0.1-SNAPSHOT.jar"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FUTANE AGRO ERP - LOCAL UAT SERVER" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:4201" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:8081/api" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ---- Check Port 8081 ----
$port = 8081
$portInUse = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "[ERROR] Port $port is already in use. Kill the process first." -ForegroundColor Red
    exit 1
}

# ---- Check JAR ----
if (-not (Test-Path $JAR)) {
    Write-Host "[ERROR] Backend JAR not found at: $JAR" -ForegroundColor Red
    Write-Host "Run 'build-backend.ps1' first or ensure target folder exists." -ForegroundColor Yellow
    exit 1
}

# ---- Start Backend ----
Write-Host "[1/2] Starting UAT Backend (port 8081 with 512MB RAM ceiling)..." -ForegroundColor Green
$backendArgs = "-Xms256m -Xmx512m -jar `"$JAR`" --spring.profiles.active=uat --server.port=8081 --spring.liquibase.enabled=false"
$backend = Start-Process "$JAVA17" -ArgumentList $backendArgs -PassThru -WindowStyle Minimized
Write-Host "      Backend PID: $($backend.Id)" -ForegroundColor Gray
Write-Host "      Waiting 20s for Spring Boot startup..." -ForegroundColor Gray
Start-Sleep -Seconds 20

# ---- Start Frontend ----
Write-Host "[2/2] Starting UAT Frontend (port 4201)..." -ForegroundColor Green
$frontend = Start-Process cmd -ArgumentList "/c cd `"$FRONTEND`" && npm run start:uat" -PassThru -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  UAT IS RUNNING!" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:4201" -ForegroundColor Yellow  
Write-Host "  Backend:  http://localhost:8081" -ForegroundColor Yellow
Write-Host "  Login:    SUPER_ADMIN / superadmin123" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host "Close this window or press Ctrl+C to stop."
try { while ($true) { Start-Sleep 5 } }
finally {
    Write-Host "Stopping UAT..." -ForegroundColor Red
    Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
}
