Get-CimInstance Win32_Process | Where-Object { $_.Name -match "java|node|esbuild" } | ForEach-Object {
    $ram = [math]::Round($_.WorkingSetSize / 1MB, 1)
    Write-Host "`n[$($_.ProcessId)] $($_.Name) - $ram MB" -ForegroundColor Yellow
    Write-Host "$($_.CommandLine)" -ForegroundColor Cyan
}
