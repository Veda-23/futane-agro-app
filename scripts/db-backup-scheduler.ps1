# Futane Agro ERP - Automated Rolling PostgreSQL Backup Scheduler
param (
    [string]$DbName = "futane_erp_uat",
    [string]$BackupDir = "backups",
    [int]$RetentionDays = 14
)

$scriptPath = Join-Path $PSScriptRoot "backup-database-secure.ps1"
& powershell -NoProfile -ExecutionPolicy Bypass -File $scriptPath -Database $DbName -BackupDir $BackupDir -RetentionDays $RetentionDays
