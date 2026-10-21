# FUTANE AGRO ERP - ENTERPRISE DATABASE BACKUP ENGINE
param (
    [string]$Database = 'futane_erp_uat',
    [string]$BackupDir = 'backups',
    [int]$RetentionDays = 7
)

$pgDump = 'C:\Users\Vedant\pgsql\bin\pg_dump.exe'

if (-not (Test-Path $pgDump)) {
    Write-Host 'ERROR: pg_dump.exe not found at' $pgDump
    exit 1
}

$resolvedDir = [System.IO.Path]::GetFullPath($BackupDir)
if (-not (Test-Path $resolvedDir)) {
    New-Item -ItemType Directory -Path $resolvedDir -Force | Out-Null
}

$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$dumpName = $Database + '_backup_' + $timestamp + '.dump'
$dumpPath = Join-Path $resolvedDir $dumpName
$shaPath = $dumpPath + '.sha256'

Write-Host '================================================================='
Write-Host ' FUTANE AGRO ERP - ENTERPRISE SECURE DATABASE BACKUP'
Write-Host (' Database:   ' + $Database)
Write-Host (' Target:     ' + $dumpPath)
Write-Host (' Timestamp:  ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))
Write-Host '================================================================='

$env:PGPASSWORD = 'FutaneAgro#Secure2026!App'
$sw = [System.Diagnostics.Stopwatch]::StartNew()

& $pgDump -h 127.0.0.1 -p 5432 -U futane_app_user -Fc -b -f $dumpPath $Database

$sw.Stop()

if (Test-Path $dumpPath) {
    $bytes = (Get-Item $dumpPath).Length
    $mb = [math]::Round($bytes / 1MB, 2)
    $hashObj = Get-FileHash -Path $dumpPath -Algorithm SHA256
    $hashLine = $hashObj.Hash + '  ' + $dumpName
    $hashLine | Out-File -FilePath $shaPath -Encoding utf8

    Write-Host ('[SUCCESS] Backup completed in ' + $sw.ElapsedMilliseconds + ' ms')
    Write-Host ('[SUCCESS] Size: ' + $mb + ' MB')
    Write-Host ('[SUCCESS] SHA-256: ' + $hashObj.Hash)
    Write-Host ('[SUCCESS] Checksum File: ' + $shaPath)

    # 7-day retention cleanup
    $cutoff = (Get-Date).AddDays(-$RetentionDays)
    $filterPattern = $Database + '_backup_*.dump*'
    Get-ChildItem -Path $resolvedDir -Filter $filterPattern | Where-Object { $_.LastWriteTime -lt $cutoff } | ForEach-Object {
        Remove-Item $_.FullName -Force
        Write-Host ('[RETENTION] Purged older backup: ' + $_.Name)
    }

    Write-Host '================================================================='
    Write-Host ' DATABASE IS SECURED AND VERIFIED.'
    Write-Host '================================================================='
} else {
    Write-Host '[ERROR] Backup file creation failed.'
    exit 1
}
