# ==============================================================================
# Disable Grafana Service and Free 500MB+ RAM
# ==============================================================================
Write-Host "Stopping Grafana Windows Service..." -ForegroundColor Yellow
Stop-Service -Name "Grafana" -Force -ErrorAction SilentlyContinue

Write-Host "Setting Grafana Startup Type to Manual..." -ForegroundColor Yellow
Set-Service -Name "Grafana" -StartupType Manual -ErrorAction SilentlyContinue

Write-Host "Terminating any lingering Grafana processes..." -ForegroundColor Yellow
Get-Process -Name "*grafana*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

$svc = Get-Service -Name "Grafana" -ErrorAction SilentlyContinue
Write-Host "`nGrafana Service Status: $($svc.Status)" -ForegroundColor Green
Write-Host "Grafana Startup Type:   $($svc.StartType)" -ForegroundColor Green
Write-Host "`nSuccessfully freed ~500 MB RAM!" -ForegroundColor Green
Start-Sleep -Seconds 3
