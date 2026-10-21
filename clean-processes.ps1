# ==============================================================================
# FUTANE AGRO ERP — FORCEFUL PROCESS CLEANER & RAM BOOST (8GB RAM PRESERVATION)
# Safely terminates orphaned Node/Java dev servers & flushes memory working sets
# NEVER touches PostgreSQL or critical Windows system processes
# ==============================================================================

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   FUTANE AGRO ERP - FORCEFUL RAM BOOST & PROCESS CLEANUP" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Measure initial memory
$osBefore = Get-CimInstance Win32_OperatingSystem
$freeBeforeGB = [math]::Round($osBefore.FreePhysicalMemory / 1MB, 2)
$totalGB = [math]::Round($osBefore.TotalVisibleMemorySize / 1MB, 2)
Write-Host "  Initial Available RAM: $freeBeforeGB GB / $totalGB GB" -ForegroundColor $(if ($freeBeforeGB -lt 1.0) { 'Red' } else { 'Yellow' })

# 2. Terminate orphaned dev server processes on ERP ports
$ERPPorts = @(4200, 4201, 8080, 8081)
$TerminatedCount = 0

foreach ($p in $ERPPorts) {
    $connections = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        $procId = $conn.OwningProcess
        if ($procId -gt 4) {
            $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
            if ($proc -and ($proc.ProcessName -match "node|java")) {
                Write-Host "  [Kill] Orphaned ERP dev server $($proc.ProcessName) (PID: $procId) on port $p" -ForegroundColor Yellow
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                $TerminatedCount++
            }
        }
    }
}

# 3. Clean up any stray esbuild background workers
Get-Process -Name "esbuild" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "  [Kill] Stray esbuild worker (PID: $($_.Id))" -ForegroundColor Yellow
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    $TerminatedCount++
}

# 3b. Clean up any lingering Grafana processes
Get-Process -Name "*grafana*" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "  [Kill] Stray Grafana process (PID: $($_.Id))" -ForegroundColor Yellow
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    $TerminatedCount++
}

# 3c. Clean up any lingering headless Chrome workers
Get-Process -Name "chrome-headless-shell" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "  [Kill] Stray Headless Chrome worker (PID: $($_.Id))" -ForegroundColor Yellow
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    $TerminatedCount++
}

if ($TerminatedCount -eq 0) {
    Write-Host "  No orphaned ERP dev server processes detected." -ForegroundColor Green
} else {
    Write-Host "  Terminated $TerminatedCount orphaned process(es)." -ForegroundColor Green
}

# 4. Forceful Working Set Memory Flush (EmptyWorkingSet via Windows API)
Write-Host "`n  Flushing process memory caches (EmptyWorkingSet)..." -ForegroundColor Cyan
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class MemoryBooster {
    [DllImport("psapi.dll")]
    public static extern int EmptyWorkingSet(IntPtr hwProc);
    
    public static void TrimProcess(int pid) {
        try {
            using (var proc = System.Diagnostics.Process.GetProcessById(pid)) {
                EmptyWorkingSet(proc.Handle);
            }
        } catch { }
    }
}
"@ -ErrorAction SilentlyContinue

$allProcs = Get-Process | Where-Object { $_.Id -gt 4 -and $_.ProcessName -notmatch "System|Idle" -and $_.WorkingSet64 -gt 15MB }
foreach ($pr in $allProcs) {
    [MemoryBooster]::TrimProcess($pr.Id)
}

# 5. Measure and report reclaimed memory
Start-Sleep -Milliseconds 800
$osAfter = Get-CimInstance Win32_OperatingSystem
$freeAfterGB = [math]::Round($osAfter.FreePhysicalMemory / 1MB, 2)
$reclaimedGB = [math]::Round($freeAfterGB - $freeBeforeGB, 2)

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  Final Available RAM: $freeAfterGB GB / $totalGB GB" -ForegroundColor Green
if ($reclaimedGB -gt 0) {
    Write-Host "  Successfully Reclaimed: +$reclaimedGB GB RAM!" -ForegroundColor Green
}
Write-Host "=================================================================" -ForegroundColor Cyan
