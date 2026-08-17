# Futane Agro ERP - Automated Rolling DB Backup
param (
    [string]$DbName = "futane_erp_prod",
    [string]$DbUser = "root",
    [string]$DbPass = "root",
    [string]$BackupDir = "C:\ERP_Backups",
    [int]$RetentionDays = 30
)

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$OutputFile = Join-Path -Path $BackupDir -ChildPath "$($DbName)_$($Timestamp).sql"
$ZipFile = "$($OutputFile).zip"

if (!(Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

Write-Host "Starting MySQL Dump for $DbName..." -ForegroundColor Cyan
& mysqldump -u$DbUser -p$DbPass --routines --triggers --single-transaction $DbName > $OutputFile

if (Test-Path -Path $OutputFile) {
    Write-Host "Compressing backup file..." -ForegroundColor Green
    Compress-Archive -Path $OutputFile -DestinationPath $ZipFile -CompressionLevel Optimal
    Remove-Item -Path $OutputFile -Force

    Write-Host "Backup completed: $ZipFile" -ForegroundColor Green
} else {
    Write-Error "mysqldump failed to generate output."
}

# Clean up older backups
Get-ChildItem -Path $BackupDir -Filter "*.zip" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) } | ForEach-Object {
    Write-Host "Purging expired backup: $($_.FullName)" -ForegroundColor Yellow
    Remove-Item -Path $_.FullName -Force
}
