# PowerShell deploy script for Futane Agro ERP

param (
    [Parameter(Mandatory=$true)]
    [string]$Environment
)

if ($Environment -ne "uat" -and $Environment -ne "prod") {
    Write-Error "Environment must be either 'uat' or 'prod'."
    exit 1
}

$VM_IP = "80.225.192.171"
$SSH_KEY = "C:\Users\Vedant\.gemini\antigravity-ide\scratch\oracle_key2.pem"
$VM_USER = "ubuntu"
$REMOTE_PATH = "/home/ubuntu/futane-agro-app/futane-agro-app"

# Directories
$RootDir = Get-Location
$FrontendDir = Join-Path $RootDir "frontend"
$DistDir = Join-Path $FrontendDir "dist"

Write-Host "[INFO] Starting Automated CI/CD Pipeline for environment: $Environment" -ForegroundColor Cyan

# Step 1: Build Angular frontend
Write-Host "[BUILD] Compiling Angular frontend..." -ForegroundColor Yellow
Push-Location $FrontendDir

# Clean previous build artifacts to prevent stale cached files
if (Test-Path $DistDir) {
    Remove-Item -Recurse -Force $DistDir
}

if ($Environment -eq "uat") {
    & npx ng build --configuration=uat
    $TargetDist = "dist-uat"
} else {
    & npx ng build --configuration=production
    $TargetDist = "dist-prod"
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Angular build failed."
    Pop-Location
    exit 1
}
Pop-Location

# Step 2: Copy build outputs to specific directories
$EnvDistDir = Join-Path $FrontendDir $TargetDist
if (Test-Path $EnvDistDir) {
    Remove-Item -Recurse -Force $EnvDistDir
}
New-Item -ItemType Directory -Path (Join-Path $EnvDistDir "frontend/browser") -Force

Copy-Item -Path (Join-Path $DistDir "frontend/browser\*") -Destination (Join-Path $EnvDistDir "frontend/browser") -Recurse -Force

# Step 3: Create tarball of frontend build
Write-Host "[ARCHIVE] Creating tarball..." -ForegroundColor Yellow
Push-Location $FrontendDir
$TarFile = "$TargetDist.tar.gz"
if (Test-Path $TarFile) {
    Remove-Item $TarFile
}
# Use tar command (standard in modern Windows)
& tar -czf $TarFile -C $TargetDist .
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create tar archive."
    Pop-Location
    exit 1
}
Pop-Location

# Step 3.5: Create tarball of backend
Write-Host "[ARCHIVE] Creating backend tarball..." -ForegroundColor Yellow
$BackendTarFile = "backend.tar.gz"
$LocalBackendTarPath = Join-Path $RootDir $BackendTarFile
if (Test-Path $LocalBackendTarPath) {
    Remove-Item $LocalBackendTarPath
}
& tar --exclude=target --exclude=backups --exclude=hs_err_pid* -czf $BackendTarFile -C backend .
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create backend tar archive."
    exit 1
}

# Step 4: Transfer assets to VM via SCP
Write-Host "[DEPLOY] Transferring files to VM via SCP..." -ForegroundColor Yellow
$LocalTarPath = Join-Path $FrontendDir $TarFile
$RemoteTarPath = "/home/ubuntu/$TarFile"

# Copy frontend tar archive
& scp -o StrictHostKeyChecking=no -i $SSH_KEY $LocalTarPath "$($VM_USER)@$($VM_IP):$RemoteTarPath"

# Copy backend tar archive
& scp -o StrictHostKeyChecking=no -i $SSH_KEY $LocalBackendTarPath "$($VM_USER)@$($VM_IP):/home/ubuntu/$BackendTarFile"

# Copy config and docker-compose files
& scp -o StrictHostKeyChecking=no -i $SSH_KEY (Join-Path $RootDir "docker-compose.$Environment.yml") "$($VM_USER)@$($VM_IP):$REMOTE_PATH/docker-compose.$Environment.yml"
& scp -o StrictHostKeyChecking=no -i $SSH_KEY (Join-Path $RootDir "deploy-vm.sh") "$($VM_USER)@$($VM_IP):$REMOTE_PATH/deploy-vm.sh"
& scp -o StrictHostKeyChecking=no -i $SSH_KEY (Join-Path $RootDir "setup-ssl.sh") "$($VM_USER)@$($VM_IP):$REMOTE_PATH/setup-ssl.sh"
& scp -o StrictHostKeyChecking=no -i $SSH_KEY (Join-Path $RootDir "renew-ssl.sh") "$($VM_USER)@$($VM_IP):$REMOTE_PATH/renew-ssl.sh"
& scp -o StrictHostKeyChecking=no -i $SSH_KEY (Join-Path $RootDir "watch-dns-ssl.sh") "$($VM_USER)@$($VM_IP):$REMOTE_PATH/watch-dns-ssl.sh"
& scp -o StrictHostKeyChecking=no -i $SSH_KEY (Join-Path $FrontendDir "nginx-$Environment.conf") "$($VM_USER)@$($VM_IP):$REMOTE_PATH/frontend/nginx-$Environment.conf"
& scp -o StrictHostKeyChecking=no -i $SSH_KEY (Join-Path $FrontendDir "Dockerfile.$Environment") "$($VM_USER)@$($VM_IP):$REMOTE_PATH/frontend/Dockerfile.$Environment"
& scp -o StrictHostKeyChecking=no -i $SSH_KEY (Join-Path $RootDir ".env") "$($VM_USER)@$($VM_IP):$REMOTE_PATH/.env"

# Copy gateway folder if Production environment
if ($Environment -eq "prod") {
    # Copy Nginx gateway config
    & ssh -o StrictHostKeyChecking=no -i $SSH_KEY "$($VM_USER)@$($VM_IP)" "mkdir -p $REMOTE_PATH/gateway"
    & scp -o StrictHostKeyChecking=no -i $SSH_KEY (Join-Path $RootDir "gateway/nginx.conf") "$($VM_USER)@$($VM_IP):$REMOTE_PATH/gateway/nginx.conf"
}

# Step 5: Extract archive on VM and trigger remote deploy script
Write-Host "[DEPLOY] Extracting archives on VM and triggering remote VM deployment script..." -ForegroundColor Yellow
$RemoteCommands = "rm -rf $REMOTE_PATH/frontend/$TargetDist && mkdir -p $REMOTE_PATH/frontend/$TargetDist && tar -xzf /home/ubuntu/$TarFile -C $REMOTE_PATH/frontend/$TargetDist && mkdir -p $REMOTE_PATH/backend && rm -rf $REMOTE_PATH/backend/src && tar -xzf /home/ubuntu/$BackendTarFile -C $REMOTE_PATH/backend && chmod +x $REMOTE_PATH/deploy-vm.sh && $REMOTE_PATH/deploy-vm.sh $Environment"

& ssh -o StrictHostKeyChecking=no -i $SSH_KEY "$($VM_USER)@$($VM_IP)" $RemoteCommands

if (Test-Path $LocalBackendTarPath) {
    Remove-Item $LocalBackendTarPath
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Deployment failed on remote VM." -ForegroundColor Red
    exit 1
}

Write-Host "[SUCCESS] Automated CI/CD Pipeline finished successfully for $Environment!" -ForegroundColor Green
