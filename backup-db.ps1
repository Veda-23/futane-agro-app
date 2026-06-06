# Backup database script for Futane Agro ERP Production environment
$BackupDir = Join-Path $PSScriptRoot "backups"
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "futane_agro_prod_backup_$Timestamp.sql"

Write-Host "Starting MySQL Database Backup for Production..." -ForegroundColor Yellow
# Run mysqldump inside the running Production MySQL container
docker exec futane_agro_mysql_prod mysqldump -u root -pVedant futane_agro_prod > $BackupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup completed successfully! Saved to: $BackupFile" -ForegroundColor Green
} else {
    Write-Error "Backup failed! Please verify if futane_agro_mysql_prod container is running."
}
