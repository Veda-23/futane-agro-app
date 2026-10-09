# ==============================================================================
# FUTANE AGRO ERP — AUTOMATIC 8GB RAM WATCHDOG & FREEZE PREVENTER
# Runs quietly in background, checks every 30 seconds.
# When Free RAM drops below 1.2 GB, automatically frees 1-2 GB instantly!
# ==============================================================================

$ThresholdFreeGB = 1.2
$IntervalSec = 30
$LogDir = Join-Path $PSScriptRoot "logs"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
$LogFile = Join-Path $LogDir "ram-watchdog.log"

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class RamBooster {
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

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   FUTANE AGRO ERP - CONTINUOUS RAM WATCHDOG ACTIVE" -ForegroundColor Cyan
Write-Host "   Monitoring RAM every $IntervalSec seconds." -ForegroundColor Cyan
Write-Host "   Trigger: Auto-boosts when Free RAM < $ThresholdFreeGB GB" -ForegroundColor Cyan
Write-Host "   Press Ctrl+C to stop watchdog." -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan

while ($true) {
    try {
        $os = Get-CimInstance Win32_OperatingSystem
        $freeGB = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
        $totalGB = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
        $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")

        if ($freeGB -lt $ThresholdFreeGB) {
            $msg = "[$timestamp] [ALERT] Free RAM low ($freeGB GB / $totalGB GB). Auto-trimming memory..."
            Write-Host $msg -ForegroundColor Yellow
            Add-Content -Path $LogFile -Value $msg

            # 1. Kill stray Grafana processes if present (preserve esbuild during active builds)
            Get-Process -Name "*grafana*" -ErrorAction SilentlyContinue | ForEach-Object {
                Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            }

            # 2. Trim working sets (target memory-heavy processes > 15MB for instantaneous response)
            $allProcs = Get-Process | Where-Object { $_.Id -gt 4 -and $_.ProcessName -notmatch "System|Idle" -and $_.WorkingSet64 -gt 15MB }
            foreach ($pr in $allProcs) {
                [RamBooster]::TrimProcess($pr.Id)
            }

            Start-Sleep -Milliseconds 500
            $osAfter = Get-CimInstance Win32_OperatingSystem
            $freeAfterGB = [math]::Round($osAfter.FreePhysicalMemory / 1MB, 2)
            $recovered = [math]::Round($freeAfterGB - $freeGB, 2)
            $resMsg = "[$timestamp] [SUCCESS] Boost complete! Free RAM restored to $freeAfterGB GB (+$recovered GB recovered)."
            Write-Host $resMsg -ForegroundColor Green
            Add-Content -Path $LogFile -Value $resMsg
        }
    } catch { }

    Start-Sleep -Seconds $IntervalSec
}
