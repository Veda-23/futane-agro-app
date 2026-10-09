# Revert script for Dashboard, Billing Hub, and Settings UI enhancements
Write-Host "Reverting all changes to Previous Stage..." -ForegroundColor Cyan

$files = @(
    "frontend\backup_dashboard_stage\dashboard.component.html|frontend\src\app\components\features\dashboard\dashboard.component.html",
    "frontend\backup_dashboard_stage\dashboard.component.css|frontend\src\app\components\features\dashboard\dashboard.component.css",
    "frontend\backup_dashboard_stage\header.component.css|frontend\src\app\components\layout\header\header.component.css",
    "frontend\backup_dashboard_stage\sidebar.component.css|frontend\src\app\components\layout\sidebar\sidebar.component.css",
    "frontend\backup_dashboard_stage\billing-hub.component.css|frontend\src\app\components\features\billing-hub\billing-hub.component.css",
    "frontend\backup_dashboard_stage\styles.scss|frontend\src\styles.scss",
    "frontend\backup_dashboard_stage\terminology.service.ts|frontend\src\app\services\terminology.service.ts",
    "frontend\backup_dashboard_stage\settings.component.ts|frontend\src\app\components\features\settings\settings.component.ts",
    "frontend\backup_dashboard_stage\settings.component.html|frontend\src\app\components\features\settings\settings.component.html",
    "frontend\backup_dashboard_stage\settings.component.css|frontend\src\app\components\features\settings\settings.component.css"
)

foreach ($entry in $files) {
    $parts = $entry.Split('|')
    if (Test-Path $parts[0]) {
        Copy-Item -Force $parts[0] $parts[1]
    }
}

Write-Host "`n[SUCCESS] Successfully reverted all files to pre-edit state!" -ForegroundColor Green
