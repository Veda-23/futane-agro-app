# ==============================================================================
# FUTANE AGRO ERP — COMBINED PURGE OF MYSQL & ORACLE DATABASES
# Leaves only PostgreSQL active on the machine.
# ==============================================================================

Write-Host "=================================================================" -ForegroundColor Red
Write-Host "   FUTANE AGRO ERP - PURGING ALL UNUSED DATABASES (MYSQL + ORACLE)" -ForegroundColor Red
Write-Host "=================================================================" -ForegroundColor Red

# --- 1. PURGE MYSQL ---
Write-Host "`n[1/2] PURGING MYSQL FROM ROOT..." -ForegroundColor Yellow
& "$PSScriptRoot\uninstall-mysql-completely.ps1"

# --- 2. PURGE ORACLE ---
Write-Host "`n[2/2] PURGING ORACLE FROM ROOT..." -ForegroundColor Yellow
& "$PSScriptRoot\uninstall-oracle-completely.ps1"

Write-Host "`n=================================================================" -ForegroundColor Green
Write-Host "   ALL UNUSED DATABASES PURGED! ONLY POSTGRESQL REMAINS ACTIVE." -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Start-Sleep -Seconds 3
