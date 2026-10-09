@echo off
echo ========================================================
echo Reverting Dashboard, Billing Hub, and Settings Stage...
echo ========================================================

if exist "frontend\backup_dashboard_stage\dashboard.component.html" (
    copy /Y "frontend\backup_dashboard_stage\dashboard.component.html" "frontend\src\app\components\features\dashboard\dashboard.component.html"
)
if exist "frontend\backup_dashboard_stage\dashboard.component.css" (
    copy /Y "frontend\backup_dashboard_stage\dashboard.component.css" "frontend\src\app\components\features\dashboard\dashboard.component.css"
)
if exist "frontend\backup_dashboard_stage\header.component.css" (
    copy /Y "frontend\backup_dashboard_stage\header.component.css" "frontend\src\app\components\layout\header\header.component.css"
)
if exist "frontend\backup_dashboard_stage\sidebar.component.css" (
    copy /Y "frontend\backup_dashboard_stage\sidebar.component.css" "frontend\src\app\components\layout\sidebar\sidebar.component.css"
)
if exist "frontend\backup_dashboard_stage\billing-hub.component.css" (
    copy /Y "frontend\backup_dashboard_stage\billing-hub.component.css" "frontend\src\app\components\features\billing-hub\billing-hub.component.css"
)
if exist "frontend\backup_dashboard_stage\styles.scss" (
    copy /Y "frontend\backup_dashboard_stage\styles.scss" "frontend\src\styles.scss"
)
if exist "frontend\backup_dashboard_stage\terminology.service.ts" (
    copy /Y "frontend\backup_dashboard_stage\terminology.service.ts" "frontend\src\app\services\terminology.service.ts"
)
if exist "frontend\backup_dashboard_stage\settings.component.ts" (
    copy /Y "frontend\backup_dashboard_stage\settings.component.ts" "frontend\src\app\components\features\settings\settings.component.ts"
)
if exist "frontend\backup_dashboard_stage\settings.component.html" (
    copy /Y "frontend\backup_dashboard_stage\settings.component.html" "frontend\src\app\components\features\settings\settings.component.html"
)
if exist "frontend\backup_dashboard_stage\settings.component.css" (
    copy /Y "frontend\backup_dashboard_stage\settings.component.css" "frontend\src\app\components\features\settings\settings.component.css"
)
if exist "frontend\backup_dashboard_stage\raw-materials.component.html" (
    copy /Y "frontend\backup_dashboard_stage\raw-materials.component.html" "frontend\src\app\components\features\raw-materials\raw-materials.component.html"
)
if exist "frontend\backup_dashboard_stage\raw-materials.component.css" (
    copy /Y "frontend\backup_dashboard_stage\raw-materials.component.css" "frontend\src\app\components\features\raw-materials\raw-materials.component.css"
)
if exist "frontend\backup_dashboard_stage\production.component.html" (
    copy /Y "frontend\backup_dashboard_stage\production.component.html" "frontend\src\app\components\features\production\production.component.html"
)
if exist "frontend\backup_dashboard_stage\production.component.css" (
    copy /Y "frontend\backup_dashboard_stage\production.component.css" "frontend\src\app\components\features\production\production.component.css"
)
if exist "frontend\backup_dashboard_stage\machines.component.html" (
    copy /Y "frontend\backup_dashboard_stage\machines.component.html" "frontend\src\app\components\features\machines\machines.component.html"
)
if exist "frontend\backup_dashboard_stage\machines.component.css" (
    copy /Y "frontend\backup_dashboard_stage\machines.component.css" "frontend\src\app\components\features\machines\machines.component.css"
)
if exist "frontend\backup_dashboard_stage\dispatch.component.html" (
    copy /Y "frontend\backup_dashboard_stage\dispatch.component.html" "frontend\src\app\components\features\dispatch\dispatch.component.html"
)
if exist "frontend\backup_dashboard_stage\dispatch.component.css" (
    copy /Y "frontend\backup_dashboard_stage\dispatch.component.css" "frontend\src\app\components\features\dispatch\dispatch.component.css"
)
if exist "frontend\backup_dashboard_stage\billing-hub.component.html" (
    copy /Y "frontend\backup_dashboard_stage\billing-hub.component.html" "frontend\src\app\components\features\billing-hub\billing-hub.component.html"
)

echo.
echo [SUCCESS] Successfully reverted all files to pre-edit state!
pause
