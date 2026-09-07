# ====================================================================
# Futane Agro ERP - Local GitHub Actions Runner
# Runs GitHub Actions workflows locally using Docker Desktop + act
# ====================================================================

param (
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "backend", "frontend", "docker", "list")]
    [string]$Job = "all"
)

# Ensure Docker binaries and credentials helper are in PATH
$dockerBin = "C:\Users\Vedant\AppData\Local\Programs\DockerDesktop\resources\bin"
if ($env:PATH -notlike "*$dockerBin*") {
    $env:PATH = "$dockerBin;$env:PATH"
}

$ACT = "C:\Users\Vedant\AppData\Local\Microsoft\WinGet\Packages\nektos.act_Microsoft.Winget.Source_8wekyb3d8bbwe\act.exe"

if (-not (Test-Path $ACT)) {
    Write-Host "[ERROR] act.exe not found at: $ACT" -ForegroundColor Red
    exit 1
}

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  Futane Agro ERP - Local GitHub Actions Runner" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

switch ($Job) {
    "list" {
        Write-Host "Listing all local GitHub Actions jobs:" -ForegroundColor Yellow
        & $ACT -l
    }
    "backend" {
        Write-Host "Running Job: Backend Build and Verify..." -ForegroundColor Green
        & $ACT -j backend-build --pull=false
    }
    "frontend" {
        Write-Host "Running Job: Frontend Build and Verify..." -ForegroundColor Green
        & $ACT -j frontend-build --pull=false
    }
    "docker" {
        Write-Host "Running Job: Docker Container Validation..." -ForegroundColor Green
        & $ACT -j docker-validation --pull=false
    }
    "all" {
        Write-Host "Running entire Local CI/CD Pipeline..." -ForegroundColor Green
        & $ACT -W .github/workflows/deploy.yml --pull=false
    }
}
