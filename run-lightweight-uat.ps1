# ==============================================================================
# FUTANE AGRO ERP — ULTRA-LIGHTWEIGHT UAT MODE (FOR 8GB LAPTOP)
# Runs the pre-compiled Angular production build + Spring Boot (512MB limit)
# Consumes only ~30MB for frontend instead of ~1500MB for Angular dev watcher!
# ==============================================================================

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND = Join-Path $ROOT 'backend'
$FRONTEND = Join-Path $ROOT 'frontend'
$DIST = Join-Path $FRONTEND 'dist\frontend\browser'
if (-not (Test-Path (Join-Path $DIST 'index.html'))) {
    $DIST = Join-Path $FRONTEND 'dist\frontend'
}
$JAR = Join-Path $BACKEND 'target\futane-agro-app-0.0.1-SNAPSHOT.jar'

Write-Host '=================================================================' -ForegroundColor Cyan
Write-Host '   FUTANE AGRO ERP - LIGHTWEIGHT UAT RUNNER (RAM PRESERVING)' -ForegroundColor Cyan
Write-Host '=================================================================' -ForegroundColor Cyan

# 1. Check if backend JAR exists
if (-not (Test-Path $JAR)) {
    Write-Host '[ERROR] Backend JAR not found at:' $JAR -ForegroundColor Red
    exit 1
}

# 2. Check if pre-compiled frontend exists
if (-not (Test-Path (Join-Path $DIST 'index.html'))) {
    Write-Host '[ERROR] Frontend build not found at:' $DIST -ForegroundColor Red
    exit 1
}

# 3. Check if backend is already running on port 8081
$backendConn = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
if (-not $backendConn) {
    Write-Host '[1/2] Starting Spring Boot UAT backend on port 8081 (Max 512MB RAM)...' -ForegroundColor Green
    $backendArgs = @('-Xms256m', '-Xmx512m', '-jar', $JAR, '--spring.profiles.active=uat', '--server.port=8081', '--spring.liquibase.enabled=false')
    $backend = Start-Process 'java' -ArgumentList $backendArgs -PassThru -WindowStyle Minimized
    Write-Host '      Backend PID:' $backend.Id -ForegroundColor Gray
    Write-Host '      Waiting for backend to bind to port 8081...' -ForegroundColor Gray
    $timeout = 90
    $elapsed = 0
    while ($elapsed -lt $timeout) {
        $backendConn = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
        if ($backendConn) { break }
        Start-Sleep -Seconds 2
        $elapsed += 2
        Write-Host -NoNewline '.'
    }
    Write-Host ''
    if ($backendConn) {
        Write-Host "      Backend is live and listening on port 8081 (ready in ${elapsed}s)!" -ForegroundColor Green
    } else {
        Write-Host '      [WARNING] Backend took longer than 90s to initialize.' -ForegroundColor Yellow
    }
} else {
    Write-Host '[1/2] Backend is already running on port 8081.' -ForegroundColor Green
}

# 4. Start Lightweight Static Server on Port 4300 (Uses ~30MB RAM)
Write-Host '[2/2] Starting lightweight frontend server on port 4300 with API proxy...' -ForegroundColor Green
$serveScript = Join-Path $ROOT 'scratch\serve-uat.js'
$frontend = Start-Process 'node' -ArgumentList @($serveScript) -PassThru -WindowStyle Normal

Write-Host '=================================================================' -ForegroundColor Green
Write-Host '  ERP IS RUNNING IN ULTRA-LIGHTWEIGHT MODE!' -ForegroundColor Green
Write-Host '  UAT URL:     http://localhost:4300  (RAM: ~30 MB)' -ForegroundColor Yellow
Write-Host '  PROD URL:    http://localhost:4301  (RAM: ~30 MB)' -ForegroundColor Yellow
Write-Host '  Backend:     http://localhost:8081  (RAM: ~250 MB)' -ForegroundColor Yellow
Write-Host '  Credentials: SUPER_ADMIN / superadmin123' -ForegroundColor Yellow
Write-Host '=================================================================' -ForegroundColor Green
Write-Host 'Press Ctrl+C to stop both servers.'

try {
    while ($true) { Start-Sleep -Seconds 5 }
} finally {
    Write-Host 'Stopping servers...' -ForegroundColor Red
    if ($backend) { Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue }
    if ($frontend) { Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue }
}
