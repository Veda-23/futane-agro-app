# ==============================================================================
# FUTANE AGRO ERP — FORCEFUL ROOT UNINSTALL OF ORACLE DATABASE
# Stops and deletes all Oracle Windows services, kills processes,
# deletes C:\oracle and C:\Program Files\Oracle, and cleans Registry & PATH.
# ==============================================================================

Write-Host "=================================================================" -ForegroundColor Red
Write-Host "   FUTANE AGRO ERP - FORCEFUL ROOT REMOVAL OF ORACLE DB" -ForegroundColor Red
Write-Host "=================================================================" -ForegroundColor Red

# 1. Stop all Oracle Services
$oracleServices = @(
    "OracleDBConsoleorclRoo",
    "OracleJobSchedulerORCLROO",
    "OracleOraDb10g_home1iSQL*Plus",
    "OracleOraDb10g_home1TNSListener",
    "OracleOraDB21Home1MTSRecoveryService",
    "OracleServiceORCLROO"
)

Write-Host "`n[1/5] Stopping all Oracle Windows Services..." -ForegroundColor Yellow
foreach ($svc in $oracleServices) {
    Write-Host "  -> Stopping $svc..." -ForegroundColor Gray
    Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
    & sc.exe stop $svc 2>$null
}

# 2. Force kill any lingering Oracle processes
Write-Host "`n[2/5] Force killing Oracle processes (oracle.exe, TNSLSNR.exe)..." -ForegroundColor Yellow
$procs = @('oracle', 'TNSLSNR', 'nqs*')
foreach ($p in $procs) {
    Get-Process -Name $p -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "  -> Killing process $($_.ProcessName) (PID: $($_.Id))..." -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
}
& taskkill.exe /F /IM oracle.exe /T 2>$null
& taskkill.exe /F /IM TNSLSNR.exe /T 2>$null

# 3. Delete Oracle Windows Services permanently from Service Manager
Write-Host "`n[3/5] Deleting Oracle services from Windows Service Manager..." -ForegroundColor Yellow
foreach ($svc in $oracleServices) {
    Write-Host "  -> Deleting $svc..." -ForegroundColor Gray
    & sc.exe delete $svc 2>$null
}

# 4. Remove Oracle File Directories
Write-Host "`n[4/5] Deleting Oracle directories from system root..." -ForegroundColor Yellow
$oracleDirs = @(
    "C:\oracle",
    "C:\Program Files\Oracle"
)

foreach ($dir in $oracleDirs) {
    if (Test-Path $dir) {
        Write-Host "  -> Purging directory $dir..." -ForegroundColor Gray
        Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
        if (Test-Path $dir) {
            # Fallback using cmd /c rd /s /q
            & cmd.exe /c "rd /s /q `"$dir`"" 2>$null
        }
    }
}

# 5. Clean Registry & PATH
Write-Host "`n[5/5] Purging Oracle entries from Registry and System PATH..." -ForegroundColor Yellow
$regKeys = @(
    "HKLM:\SOFTWARE\ORACLE",
    "HKLM:\SOFTWARE\Wow6432Node\ORACLE"
)
foreach ($rk in $regKeys) {
    if (Test-Path $rk) {
        Write-Host "  -> Removing registry key $rk..." -ForegroundColor Gray
        Remove-Item -Path $rk -Recurse -Force -ErrorAction SilentlyContinue
    }
}

foreach ($scope in @('Machine', 'User')) {
    try {
        $currentPath = [Environment]::GetEnvironmentVariable('Path', $scope)
        if ($currentPath -match 'oracle') {
            $filtered = ($currentPath -split ';' | Where-Object { $_ -and $_ -notmatch 'oracle' }) -join ';'
            [Environment]::SetEnvironmentVariable('Path', $filtered, $scope)
            Write-Host "  -> Cleaned $scope PATH" -ForegroundColor Green
        }
    } catch { }
}

Write-Host "`n=================================================================" -ForegroundColor Green
Write-Host "   SUCCESS: ORACLE DATABASE HAS BEEN COMPLETELY PURGED FROM ROOT!" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Start-Sleep -Seconds 3
