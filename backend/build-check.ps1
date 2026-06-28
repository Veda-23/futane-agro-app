$env:M2_HOME = "C:\maven-3.9.6"
$env:PATH = "$env:M2_HOME\bin;$env:PATH"

Write-Host "Starting Maven build check..."
Write-Host "Working directory: $(Get-Location)"

# Run Maven clean compile
$buildOutput = & "$env:M2_HOME\bin\mvn.cmd" clean compile -DskipTests 2>&1

# Save output to file for later inspection
$buildOutput | Out-File -FilePath "..\\.github\\modernize\\java-upgrade\\20260625121457\\build-output.log" -Encoding UTF8

# Check for build success/failure
if ($LASTEXITCODE -eq 0) {
    Write-Host "BUILD SUCCESS" -ForegroundColor Green
    "BUILD_SUCCESS" | Out-File -FilePath "..\\.github\\modernize\\java-upgrade\\20260625121457\\build-status.txt"
    exit 0
} else {
    Write-Host "BUILD FAILED with exit code $LASTEXITCODE" -ForegroundColor Red
    "BUILD_FAILED" | Out-File -FilePath "..\\.github\\modernize\\java-upgrade\\20260625121457\\build-status.txt"
    # Print last 50 lines of output for debugging
    $buildOutput | Select-Object -Last 50
    exit 1
}
