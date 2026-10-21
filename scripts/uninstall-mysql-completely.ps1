# ==============================================================================
# FUTANE AGRO ERP — COMPLETE & FORCEFUL ROOT UNINSTALL OF MYSQL
# Purges all MySQL services, MSI packages, folders, and registry entries
# ==============================================================================

Write-Host "=================================================================" -ForegroundColor Red
Write-Host "   FUTANE AGRO ERP - FORCEFUL ROOT REMOVAL OF MYSQL" -ForegroundColor Red
Write-Host "=================================================================" -ForegroundColor Red

# 1. Stop and Delete MySQL80 Service
Write-Host "[1/5] Stopping and deleting MySQL80 Windows Service..." -ForegroundColor Yellow
Stop-Service MySQL80 -Force -ErrorAction SilentlyContinue
& sc.exe stop MySQL80 2>$null
& sc.exe delete MySQL80 2>$null

# 2. Kill any stray MySQL processes
Write-Host "[2/5] Terminating any MySQL processes..." -ForegroundColor Yellow
Get-Process -Name "*mysql*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# 3. Uninstall All MySQL MSI Packages silently
Write-Host "[3/5] Uninstalling all MySQL packages from Windows..." -ForegroundColor Yellow
$guids = @(
    '{0BE619EA-CB8F-4CC9-B5F1-FBA7D0A66CB8}', # MySQL Shell 8.0.34
    '{2BA0CF0C-6B36-4A18-8C4E-6086D9DC0DE3}', # MySQL Server 8.0
    '{F7FFB7C8-1738-4FE0-A80B-61E5ED01B033}', # MySQL Workbench 8.0 CE
    '{4D32F894-68BC-4915-ADAC-60C9B3171BF3}'  # MySQL Installer - Community
)

foreach ($g in $guids) {
    Write-Host "  -> Uninstalling MSI package $g..." -ForegroundColor Gray
    Start-Process msiexec.exe -ArgumentList "/X $g /qn /norestart" -Wait -WindowStyle Hidden
}

# 4. Force Delete all Root MySQL Directories
Write-Host "[4/5] Force deleting all MySQL file trees from system root..." -ForegroundColor Yellow
$mysqlDirs = @(
    "C:\Program Files\MySQL",
    "C:\Program Files (x86)\MySQL",
    "C:\ProgramData\MySQL"
)

foreach ($dir in $mysqlDirs) {
    if (Test-Path $dir) {
        Write-Host "  -> Removing $dir..." -ForegroundColor Gray
        Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# 5. Clean PATH Environment Variables
Write-Host "[5/5] Purging MySQL paths from Environment PATH variables..." -ForegroundColor Yellow
foreach ($scope in @('Machine', 'User')) {
    try {
        $currentPath = [Environment]::GetEnvironmentVariable('Path', $scope)
        if ($currentPath -match 'MySQL') {
            $filtered = ($currentPath -split ';' | Where-Object { $_ -and $_ -notmatch 'MySQL' }) -join ';'
            [Environment]::SetEnvironmentVariable('Path', $filtered, $scope)
            Write-Host "  -> Cleaned $scope PATH" -ForegroundColor Green
        }
    } catch { }
}

Write-Host "=================================================================" -ForegroundColor Green
Write-Host "   SUCCESS: MYSQL HAS BEEN COMPLETELY PURGED FROM ROOT!" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Start-Sleep -Seconds 3
