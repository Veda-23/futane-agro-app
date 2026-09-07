# Setup custom domain hosts mapping for Futane Agro ERP
# This script must be run with Administrator privileges to modify the Windows hosts file.

$HostsPath = "C:\Windows\System32\drivers\etc\hosts"
$Domain = "futane-agro-erp.local"
$IP = "127.0.0.1"
$LineToAdd = "$IP`t$Domain"

# Check if already exists
$Content = Get-Content $HostsPath
if ($Content -match $Domain) {
    Write-Host "Domain '$Domain' is already mapped in hosts file." -ForegroundColor Green
} else {
    Write-Host "Mapping '$Domain' to $IP in your hosts file..." -ForegroundColor Yellow
    try {
        # Check for admin rights
        $Identity = [Security.Principal.WindowsIdentity]::GetCurrent()
        $Principal = New-Object Security.Principal.WindowsPrincipal($Identity)
        if (-not $Principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
            Write-Warning "This script requires Administrator privileges to modify the hosts file."
            Write-Host "Please open a PowerShell terminal as Administrator and run the following command:" -ForegroundColor Cyan
            Write-Host "Add-Content -Path '$HostsPath' -Value '$LineToAdd'" -ForegroundColor Cyan
            return
        }
        Add-Content -Path $HostsPath -Value "`n$LineToAdd"
        Write-Host "Successfully added host entry for $Domain!" -ForegroundColor Green
    } catch {
        Write-Error "Failed to modify hosts file. Error: $_"
    }
}
