# ============================================================
# Futane Agro ERP — LOCAL PROD DEPLOYMENT  
# Frontend: http://localhost:4200
# Backend:  http://localhost:8080/api
# ============================================================

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$JAVA17 = "C:\Program Files\Microsoft\jdk-17.0.20.8-hotspot\bin\java.exe"
$BACKEND = "$ROOT\backend"
$FRONTEND = "$ROOT\frontend"
$JAR = "$BACKEND\target\futane-agro-app-0.0.1-SNAPSHOT.jar"

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  FUTANE AGRO ERP - LOCAL PROD SERVER" -ForegroundColor Magenta
Write-Host "  Frontend: http://localhost:4200" -ForegroundColor Magenta
Write-Host "  Backend:  http://localhost:8080/api" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

# ---- Check Port 8080 ----
$port = 8080
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
Write-Host "[1/2] Starting PROD Backend (port 8080)..." -ForegroundColor Green
$backendArgs = "-jar `"$JAR`" --spring.profiles.active=prod --server.port=8080 --spring.liquibase.enabled=false"
$backend = Start-Process "$JAVA17" -ArgumentList $backendArgs -PassThru -WindowStyle Minimized
Write-Host "      Backend PID: $($backend.Id)" -ForegroundColor Gray
Write-Host "      Waiting 20s for Spring Boot startup..." -ForegroundColor Gray
Start-Sleep -Seconds 20

# ---- Start Frontend ----
Write-Host "[2/2] Starting PROD Frontend (port 4200)..." -ForegroundColor Green
$frontend = Start-Process cmd -ArgumentList "/c cd `"$FRONTEND`" && npm run start:prod" -PassThru -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  PROD IS RUNNING!" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:4200" -ForegroundColor Yellow
Write-Host "  Backend:  http://localhost:8080" -ForegroundColor Yellow
Write-Host "  Login:    SUPER_ADMIN / superadmin123" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host "Close this window or press Ctrl+C to stop."
try { while ($true) { Start-Sleep 5 } }
finally {
    Write-Host "Stopping PROD..." -ForegroundColor Red
    Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
}
