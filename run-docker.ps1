# ============================================================
# Futane Agro ERP - Unified Docker Environment Manager
# ============================================================
param (
    [Parameter(Position = 0)]
    [ValidateSet("start", "up", "stop", "down", "restart", "status", "ps", "logs")]
    [string]$Action = "status",

    [Parameter(Position = 1)]
    [ValidateSet("uat", "prod", "dev", "all")]
    [string]$Env = "uat",

    [Parameter(Position = 2)]
    [string]$Service = ""
)

# Ensure Docker binary in PATH
$dockerPaths = @("C:\Program Files\Docker\Docker\resources\bin", "C:\Program Files\Docker\Docker\resources")
foreach ($p in $dockerPaths) {
    if ((Test-Path $p) -and ($env:PATH -notlike "*$p*")) {
        $env:PATH = "$p;$env:PATH"
    }
}

$composeFile = "docker-compose.uat.yml"
if ($Env -eq "prod") { $composeFile = "docker-compose.prod.yml" }
elseif ($Env -eq "dev") { $composeFile = "docker-compose.yml" }

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  Futane Agro ERP - Docker Environment Manager" -ForegroundColor Cyan
Write-Host "  Action: $Action | Environment: $Env ($composeFile)" -ForegroundColor Gray
Write-Host "====================================================" -ForegroundColor Cyan

switch ($Action) {
    { $_ -in "start", "up" } {
        Write-Host "`n[+] Starting $Env containers using $composeFile..." -ForegroundColor Green
        docker compose -f $composeFile up -d --remove-orphans
        Start-Sleep -Seconds 2
        Write-Host "`n[+] Current container status:" -ForegroundColor Yellow
        docker compose -f $composeFile ps
        
        Write-Host "`n====================================================" -ForegroundColor Green
        if ($Env -eq "uat") {
            Write-Host "  UAT Frontend : http://localhost:8081" -ForegroundColor Yellow
            Write-Host "  UAT Backend  : http://localhost:8082/api" -ForegroundColor Yellow
            Write-Host "  UAT MySQL    : localhost:3307 (database: futane_agro_uat)" -ForegroundColor Yellow
            Write-Host "  Credentials  : SUPER_ADMIN / superadmin123" -ForegroundColor Cyan
        } elseif ($Env -eq "prod") {
            Write-Host "  Prod URL     : http://localhost (or https://localhost)" -ForegroundColor Yellow
            Write-Host "  Prod MySQL   : localhost:3306" -ForegroundColor Yellow
        }
        Write-Host "====================================================" -ForegroundColor Green
    }
    { $_ -in "stop", "down" } {
        if ($Env -eq "all") {
            Write-Host "`n[-] Stopping all containers (UAT, Prod, Dev)..." -ForegroundColor Yellow
            docker compose -f docker-compose.uat.yml down
            docker compose -f docker-compose.prod.yml down
            docker compose -f docker-compose.yml down
        } else {
            Write-Host "`n[-] Stopping $Env containers ($composeFile)..." -ForegroundColor Yellow
            docker compose -f $composeFile down
        }
    }
    "restart" {
        Write-Host "`n[⟳] Restarting $Env containers..." -ForegroundColor Cyan
        docker compose -f $composeFile restart $Service
    }
    { $_ -in "status", "ps" } {
        Write-Host "`n[i] Active Futane Agro Docker Containers:" -ForegroundColor Cyan
        docker ps --filter "name=futane" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    }
    "logs" {
        Write-Host "`n[i] Following logs for $Env ($Service)..." -ForegroundColor Cyan
        if ($Service) {
            docker compose -f $composeFile logs -f $Service
        } else {
            docker compose -f $composeFile logs --tail=100 -f
        }
    }
}
