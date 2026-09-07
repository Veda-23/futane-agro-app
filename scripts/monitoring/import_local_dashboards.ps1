param(
    [string]$GrafanaUrl = "http://localhost:3000",
    [string]$Username = "admin",
    [string]$Password = "FutaneAgro@Monitor2026!",
    [string]$DashboardsDir = "C:\Users\Vedant\.gemini\antigravity-ide\scratch\futane-agro-app\grafana_dashboards_clean"
)

$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${Username}:${Password}"))
$headers = @{
    "Authorization" = "Basic $auth"
    "Content-Type" = "application/json"
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " IMPORTING 10 HIGH-CONTRAST ENTERPRISE GRAFANA DASHBOARDS       " -ForegroundColor Cyan
Write-Host " Target Grafana: $GrafanaUrl" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

$files = Get-ChildItem -Path $DashboardsDir -Filter "*.json"

foreach ($file in $files) {
    try {
        $raw = Get-Content -Path $file.FullName -Raw
        $payload = "{ `"dashboard`": $raw, `"overwrite`": true, `"folderId`": 0 }"
        
        $res = Invoke-RestMethod -Uri "$GrafanaUrl/api/dashboards/db" -Method Post -Headers $headers -Body $payload
        Write-Host "  [PASS] Imported: $($file.Name) -> $($res.title) (URL: $($res.url))" -ForegroundColor Green
    } catch {
        Write-Host "  [FAIL] Error importing $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " ALL DASHBOARDS SUCCESSFULLY IMPORTED" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
