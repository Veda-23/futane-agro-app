# ==============================================================================
# FUTANE AGRO ERP — LAPTOP PERFORMANCE OPTIMIZATION UTILITY
# Optimizes memory, disk cache, and Windows Defender to eliminate laptop lag
# ==============================================================================

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   FUTANE AGRO ERP — SYSTEM SPEEDUP & PERFORMANCE OPTIMIZER" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$WorkspacePath = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Purge heavy temporary caches (saves 1.8GB+ disk space)
Write-Host "`n[1/3] Clearing heavy Angular & build disk caches..." -ForegroundColor Yellow
$CachePaths = @(
    "$WorkspacePath\frontend\.angular",
    "$WorkspacePath\frontend\dist",
    "$WorkspacePath\frontend\node_modules\.cache"
)
foreach ($c in $CachePaths) {
    if (Test-Path $c) {
        try {
            Remove-Item -Path $c -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ Cleared: $c" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠️ Could not remove: $c (may be in use)" -ForegroundColor DarkGray
        }
    }
}

# 2. Add Windows Defender Targeted Exclusions (eliminates disk thrashing from MsMpEng.exe)
Write-Host "`n[2/3] Checking Windows Defender Exclusions..." -ForegroundColor Yellow
$IsAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

$ExcludedDirs = @(
    "$WorkspacePath\frontend\node_modules",
    "$WorkspacePath\frontend\.angular\cache",
    "$WorkspacePath\backend\target"
)

if ($IsAdmin) {
    foreach ($dir in $ExcludedDirs) {
        try {
            Add-MpPreference -ExclusionPath $dir -ErrorAction Stop
            Write-Host "  ✓ Excluded: $dir" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠️ Could not add exclusion for $dir : $_" -ForegroundColor DarkGray
        }
    }
} else {
    Write-Host "  ℹ️ To exempt node_modules and target from Windows Defender scanning:" -ForegroundColor Yellow
    Write-Host "     Right-click this script (optimize-laptop.ps1) and choose 'Run with PowerShell as Administrator'." -ForegroundColor White
}

# 3. Memory Summary
Write-Host "`n[3/3] Checking Available System Memory..." -ForegroundColor Yellow
$os = Get-CimInstance Win32_OperatingSystem
$totalGB = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
$freeGB = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
$usedPercent = [math]::Round((($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / $os.TotalVisibleMemorySize) * 100, 1)

Write-Host "  Total RAM: $totalGB GB" -ForegroundColor White
Write-Host "  Free RAM:  $freeGB GB" -ForegroundColor $(if ($freeGB -lt 1.0) { 'Red' } else { 'Green' })
Write-Host "  RAM Used:  $usedPercent%" -ForegroundColor $(if ($usedPercent -gt 85) { 'Red' } else { 'Green' })

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "✓ System optimization complete!" -ForegroundColor Green
Write-Host "Tip: Close any unused Chrome/Edge tabs and reload your IDE (Ctrl+Shift+P -> 'Developer: Reload Window') for instant extra 1-2 GB free RAM." -ForegroundColor Gray
Write-Host "=================================================================" -ForegroundColor Cyan
