# ============================================================
# Futane Direct — Launch Customer Ordering Website (Port 4202)
# ============================================================

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FUTANE DIRECT - CUSTOMER STOREFRONT" -ForegroundColor Cyan
Write-Host "  Storefront URL: http://localhost:4202" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Set-Location $ROOT
node scripts/dev/run-storefront.js
