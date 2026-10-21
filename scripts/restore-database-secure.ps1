# FUTANE AGRO ERP - ENTERPRISE SECURE RESTORE ENGINE
param (
    [Parameter(Mandatory=$true)]
    [string]$DumpFile,
    [string]$TargetDatabase = 'futane_erp_uat'
)

$pgRestore = 'C:\Users\Vedant\pgsql\bin\pg_restore.exe'

if (-not (Test-Path $pgRestore)) {
    Write-Host 'ERROR: pg_restore.exe not found at' $pgRestore
    exit 1
}

if (-not (Test-Path $DumpFile)) {
    Write-Host 'ERROR: Dump file not found:' $DumpFile
    exit 1
}

# Cryptographic Checksum Validation
$shaFile = $DumpFile + '.sha256'
if (Test-Path $shaFile) {
    Write-Host '[VERIFICATION] Validating SHA-256 cryptographic checksum...'
    $expectedHash = (Get-Content $shaFile).Split(' ')[0].Trim()
    $actualHash = (Get-FileHash -Path $DumpFile -Algorithm SHA256).Hash.Trim()

    if ($expectedHash -ne $actualHash) {
        Write-Host '[CRITICAL ERROR] SHA-256 checksum mismatch! The backup file may be corrupted or tampered with.'
        Write-Host ('Expected: ' + $expectedHash)
        Write-Host ('Actual:   ' + $actualHash)
        exit 1
    }
    Write-Host '[VERIFICATION] Checksum match! Integrity verified 100%.'
}

Write-Host '================================================================='
Write-Host ' FUTANE AGRO ERP - RESTORING DATABASE'
Write-Host (' Source: ' + $DumpFile)
Write-Host (' Target: ' + $TargetDatabase)
Write-Host '================================================================='

$env:PGPASSWORD = 'Vedant'
& $pgRestore -h 127.0.0.1 -p 5432 -U postgres -d $TargetDatabase --clean --if-exists -v $DumpFile

Write-Host '================================================================='
Write-Host ' RESTORE COMPLETED AND VALIDATED.'
Write-Host '================================================================='
