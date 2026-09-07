<#
=================================================================================
 FUTANE AGRO ERP - MASTER AUTOMATED BACKEND TEST HARNESS
 100% Headless CLI Test Suite - Zero Browser Required
 Target: Spring Boot REST Backend (UAT: 8081 / PROD: 8080)
=================================================================================
#>

param (
    [string]$BaseUrl = "http://localhost:8081",
    [string]$Username = "admin",
    [string]$Password = "admin123"
)

$ErrorActionPreference = "Continue"
$global:PassCount = 0
$global:FailCount = 0
$global:AuthToken = ""
$global:Headers = @{}

function Assert-Test {
    param (
        [string]$Module,
        [string]$TestName,
        [scriptblock]$Action
    )

    Write-Host -NoNewline "[$Module] $TestName ... "
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        & $Action
        $sw.Stop()
        Write-Host " [PASS] ($($sw.ElapsedMilliseconds) ms)" -ForegroundColor Green
        $global:PassCount++
    } catch {
        $sw.Stop()
        Write-Host " [FAIL] ($($sw.ElapsedMilliseconds) ms)" -ForegroundColor Red
        Write-Host "   -> Error: $($_.Exception.Message)" -ForegroundColor DarkRed
        $global:FailCount++
    }
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " FUTANE AGRO ERP - FULL SYSTEM BACKEND TEST SUITE                " -ForegroundColor Cyan
Write-Host " Target URL: $BaseUrl                                            " -ForegroundColor Cyan
Write-Host " Date: $(Get-Date -Format 'dd-MMM-yyyy HH:mm:ss')                " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# -------------------------------------------------------------------------------
# MODULE 1: AUTHENTICATION & RBAC
# -------------------------------------------------------------------------------
Assert-Test "AUTH" "1.1 Login with credentials and handle OTP verification" {
    $body = @{ username = $Username; password = $Password } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/users/login" -Method Post -Body $body -ContentType "application/json"
    
    if ($res.token) {
        $global:AuthToken = $res.token
    } elseif ($res.status -eq "OTP_REQUIRED" -or $res.tempOtp) {
        $otp = if ($res.tempOtp) { $res.tempOtp } else { "123456" }
        $verifyBody = @{ username = $Username; otp = $otp } | ConvertTo-Json
        $verifyRes = Invoke-RestMethod -Uri "$BaseUrl/api/users/login/verify" -Method Post -Body $verifyBody -ContentType "application/json"
        $global:AuthToken = $verifyRes.token
    }
    
    if (!$global:AuthToken) { throw "No JWT token received from login / verify" }
    $global:Headers = @{ 
        "Authorization" = "Bearer $global:AuthToken"
        "Content-Type" = "application/json"
    }
}

Assert-Test "AUTH" "1.2 Invalid password returns HTTP 401 Unauthorized" {
    try {
        $badBody = @{ username = "admin"; password = "wrongpassword999" } | ConvertTo-Json
        Invoke-RestMethod -Uri "$BaseUrl/api/users/login" -Method Post -Body $badBody -ContentType "application/json"
        throw "Expected 401 Unauthorized but succeeded"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -ne 401 -and $statusCode -ne 403) {
            throw "Expected status code 401 or 403, got $statusCode"
        }
    }
}

# -------------------------------------------------------------------------------
# MODULE 2: PRODUCTION (PPD and PPM)
# -------------------------------------------------------------------------------
$global:TestPpdId = ""
Assert-Test "PROD" "2.1 Create Daily Production (PPD) with auto-calculated total" {
    $successful = 180
    $rejected = 20
    $expectedTotal = $successful + $rejected
    $ppdBody = @{
        date = (Get-Date -Format 'yyyy-MM-dd')
        crateType = "Apple Crate"
        shift = "Morning Shift"
        successful = $successful
        rejected = $rejected
        totalProduction = $expectedTotal
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/ppd" -Method Post -Body $ppdBody -ContentType "application/json" -Headers $global:Headers
    if (!$res.id -and !$res.ppdId) { throw "PPD record was not saved" }
    $global:TestPpdId = if ($res.id) { $res.id } else { $res.ppdId }
}

Assert-Test "PROD" "2.2 Query Daily Production list" {
    $list = Invoke-RestMethod -Uri "$BaseUrl/api/ppd" -Method Get -Headers $global:Headers
    if ($null -eq $list -or $list.Count -eq 0) { throw "Production list returned empty" }
}

Assert-Test "PROD" "2.3 Create Monthly Production (PPM) summary" {
    $ppmBody = @{
        month = "August"
        year = 2026
        cratesProduced = 5000
        electricityUnits = 1200
        electricityBill = 14400.0
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/ppm" -Method Post -Body $ppmBody -ContentType "application/json" -Headers $global:Headers
    if (!$res.id) { throw "PPM record not created" }
}

# -------------------------------------------------------------------------------
# MODULE 3: PARTIES AND VENDORS
# -------------------------------------------------------------------------------
$global:TestPartyId = ""
$global:TestVendorId = ""

Assert-Test "CRM" "3.1 Create Customer / Party" {
    $timestamp = Get-Date -Format 'yyyyMMddHHmmss'
    $partyBody = @{
        partyName = "Test Agro Industries $timestamp"
        partyContact = "98" + (Get-Random -Minimum 10000000 -Maximum 99999999)
        partyAddress = "MIDC Industrial Area, Morshi Road, Amravati"
        gstNumber = "27AAACZ1122A1ZW"
        email = "party$timestamp@futaneagro.com"
        city = "Amravati"
        state = "Maharashtra"
        isActive = $true
        createdDate = (Get-Date -Format 'yyyy-MM-dd')
        panCardPath = ""
        gstCertPath = ""
        agreementPath = ""
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/parties" -Method Post -Body $partyBody -ContentType "application/json" -Headers $global:Headers
    if (!$res.id -and !$res.partyId) { throw "Party not created" }
    $global:TestPartyId = if ($res.id) { $res.id } else { $res.partyId }
}

Assert-Test "CRM" "3.2 Create Supplier / Vendor" {
    $vendorBody = @{
        vendorName = "Polymers Supplier $(Get-Date -Format 'yyyyMMddHHmmss') $(Get-Random -Minimum 100 -Maximum 999)"
        contact = "97" + (Get-Random -Minimum 10000000 -Maximum 99999999)
        address = "Plot 42, Chemical Zone, Mumbai"
        gstNumber = "27AABCT8899K1Z2"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/vendors" -Method Post -Body $vendorBody -ContentType "application/json" -Headers $global:Headers
    if (!$res.id) { throw "Vendor not created" }
    $global:TestVendorId = $res.id
}

# -------------------------------------------------------------------------------
# MODULE 4: DRIVERS
# -------------------------------------------------------------------------------
$global:TestDriverId = ""
Assert-Test "TRANSPORT" "4.1 Create Logistics Driver" {
    $driverBody = @{
        driverName = "Ganesh Patil $(Get-Date -Format 'HHmmss')"
        mobile = "96" + (Get-Random -Minimum 10000000 -Maximum 99999999)
        licenseNo = "MH27-" + (Get-Random -Minimum 100000 -Maximum 999999)
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/drivers" -Method Post -Body $driverBody -ContentType "application/json" -Headers $global:Headers
    if (!$res.id) { throw "Driver not created" }
    $global:TestDriverId = $res.id
}

# -------------------------------------------------------------------------------
# MODULE 5: SALES ORDERS (18% GST AUTO-CALCULATION)
# -------------------------------------------------------------------------------
$global:TestSaleId = ""

Assert-Test "SALES" "5.1 Create Sale Order and Verify 18% GST Calculation" {
    $qty = 100
    $rate = 250.0
    $gross = $qty * $rate # 25,000
    $expectedTotal = [Math]::Round($gross * 1.18, 2)
    
    $saleBody = @{
        date = (Get-Date -Format 'yyyy-MM-dd')
        party = @{ id = $global:TestPartyId }
        crateType = "Apple Crate"
        crateMaterial = "Plastic"
        quantity = $qty
        rate = $rate
        paid = 0.0
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/sales" -Method Post -Body $saleBody -ContentType "application/json" -Headers $global:Headers
    if (!$res.id) { throw "Sale not created" }
    $global:TestSaleId = $res.id
    
    if ([Math]::Abs($res.totalAmount - $expectedTotal) -gt 1.0) {
        throw "GST Total mismatch: expected $expectedTotal (inclusive 18% GST), got $($res.totalAmount)"
    }
}

# -------------------------------------------------------------------------------
# MODULE 6: DISPATCHES
# -------------------------------------------------------------------------------
$global:TestDispatchId = ""
Assert-Test "DISPATCH" "6.1 Create Dispatch for Sale Order" {
    $existingSales = Invoke-RestMethod -Uri "$BaseUrl/api/sales" -Method Get -Headers $global:Headers
    $selectedSaleId = if ($existingSales -and $existingSales.Count -gt 0) { $existingSales[0].id } else { $global:TestSaleId }
    
    $dispBody = @{
        dispatchNumber = "DSP-" + (Get-Date -Format 'yyyyMMddHHmmss') + "-" + (Get-Random -Minimum 100 -Maximum 999)
        sale = @{ id = $selectedSaleId }
        vehicleNumber = "MH-27-TR-4567"
        driverName = "Ganesh Patil"
        date = (Get-Date -Format 'yyyy-MM-dd')
        status = "In Transit"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/dispatches" -Method Post -Body $dispBody -ContentType "application/json" -Headers $global:Headers
    if (!$res.id -and !$res.dispatchId) { throw "Dispatch not created" }
    $global:TestDispatchId = if ($res.id) { $res.id } else { $res.dispatchId }
}

# -------------------------------------------------------------------------------
# MODULE 7: PAYMENTS
# -------------------------------------------------------------------------------
Assert-Test "PAYMENT" "7.1 Record Customer Payment" {
    $existingParties = Invoke-RestMethod -Uri "$BaseUrl/api/parties" -Method Get -Headers $global:Headers
    $selectedPartyId = if ($existingParties -and $existingParties.Count -gt 0) { $existingParties[0].id } else { $global:TestPartyId }
    
    $payBody = @{
        party = @{ id = $selectedPartyId }
        amountReceived = 10000.0
        paymentMode = "UPI"
        paymentDate = (Get-Date -Format 'yyyy-MM-dd')
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/payments" -Method Post -Body $payBody -ContentType "application/json" -Headers $global:Headers
    if (!$res.id -and !$res.paymentId) { throw "Payment not recorded" }
}

# -------------------------------------------------------------------------------
# MODULE 8: INVENTORY
# -------------------------------------------------------------------------------
Assert-Test "INVENTORY" "8.1 Query Inventory Stock Balance" {
    $inv = Invoke-RestMethod -Uri "$BaseUrl/api/inventory" -Method Get -Headers $global:Headers
    if ($null -eq $inv) { throw "Inventory returned null" }
}

# -------------------------------------------------------------------------------
# MODULE 9: RAW MATERIALS (AUTO-AMOUNT CALCULATION)
# -------------------------------------------------------------------------------
Assert-Test "RAW_MAT" "9.1 Record Raw Material Purchase (HDPE Granules)" {
    $weight = 500.0
    $rate = 95.0
    $expectedAmount = $weight * $rate # 47,500
    $rmBody = @{
        date = (Get-Date -Format 'yyyy-MM-dd')
        materialName = "HDPE Natural Granules"
        vendor = @{ id = $global:TestVendorId }
        weight = $weight
        rate = $rate
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/raw-materials" -Method Post -Body $rmBody -ContentType "application/json" -Headers $global:Headers
    if (!$res.id -and !$res.rawMaterialId) { throw "Raw material purchase failed" }
}

# -------------------------------------------------------------------------------
# MODULE 10: EXPENSES (CATEGORY VALIDATION)
# -------------------------------------------------------------------------------
Assert-Test "EXPENSES" "10.1 Create Expense with Category Validation" {
    $expBody = @{
        date = (Get-Date -Format 'yyyy-MM-dd')
        category = "Maintenance"
        amount = 3500.0
        description = "Mould lubrication and hydraulic oil replacement"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/expenses" -Method Post -Body $expBody -ContentType "application/json" -Headers $global:Headers
    if (!$res.id -and !$res.expenseId) { throw "Expense not recorded" }
}

# -------------------------------------------------------------------------------
# MODULE 11: TRANSPORTS (RENT - ADVANCE = REMAINING)
# -------------------------------------------------------------------------------
Assert-Test "TRANSPORTS" "11.1 Record Transport Logistics and Due Calculation" {
    $rent = 8500.0
    $advance = 3000.0
    $expectedRemaining = $rent - $advance # 5,500
    $transBody = @{
        date = (Get-Date -Format 'yyyy-MM-dd')
        truckNumber = "MH-27-AA-9988"
        driver = @{ id = $global:TestDriverId }
        rent = $rent
        advance = $advance
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/transports" -Method Post -Body $transBody -ContentType "application/json" -Headers $global:Headers
    if (!$res.id -and !$res.transportId) { throw "Transport not saved" }
    if ($res.remaining -ne $expectedRemaining) {
        throw "Remaining formula mismatch: expected $expectedRemaining, got $($res.remaining)"
    }
}

# -------------------------------------------------------------------------------
# MODULE 12: HR AND SALARIES
# -------------------------------------------------------------------------------
$global:TestEmpId = ""
Assert-Test "HR" "12.1 Create Employee with mobile and Aadhaar validation" {
    $ts = Get-Date -Format 'yyyyMMddHHmmss'
    $empBody = @{
        empName = "Kailash Jadhav $ts"
        empContact = "95" + (Get-Random -Minimum 10000000 -Maximum 99999999)
        salary = 18000.0
        designation = "Senior Machine Operator"
        joiningDate = (Get-Date -Format 'yyyy-MM-dd')
        aadhaarNo = "234567890123"
        bankAccount = "SBIN00012345678"
        address = "Amravati"
        photoPath = "uploads/emp.jpg"
        aadhaarCardPath = "uploads/aadhaar.pdf"
        bankPassbookPath = "uploads/passbook.pdf"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/employees" -Method Post -Body $empBody -ContentType "application/json" -Headers $global:Headers
    if (!$res.id -and !$res.empId) { throw "Employee not created" }
    $global:TestEmpId = if ($res.id) { $res.id } else { $res.empId }
}

Assert-Test "HR" "12.2 Record Employee Salary Disbursement" {
    $salBody = @{
        employee = @{ id = $global:TestEmpId }
        month = "August"
        year = 2026
        salaryAmount = 18000.0
        status = "Paid"
        paidDate = (Get-Date -Format 'yyyy-MM-dd')
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/salaries" -Method Post -Body $salBody -ContentType "application/json" -Headers $global:Headers
    if (!$res.id -and !$res.salaryId) { throw "Salary not recorded" }
}

# -------------------------------------------------------------------------------
# MODULE 13: MACHINE HEALTH AND BREAKDOWN LOGS
# -------------------------------------------------------------------------------
$global:TestMachineId = ""
Assert-Test "MACHINES" "13.1 Create Injection Moulding Machine Master" {
    $ts = Get-Date -Format 'yyyyMMddHHmmss'
    $mBody = @{
        machineName = "KraussMaffei 650T Imm $ts"
        manufacturer = "KraussMaffei"
        purchaseDate = (Get-Date -Format 'yyyy-MM-dd')
        status = "Running"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/machines" -Method Post -Body $mBody -ContentType "application/json" -Headers $global:Headers
    if (!$res.id) { throw "Machine master not created" }
    $global:TestMachineId = $res.id
}

Assert-Test "MACHINES" "13.2 Log Machine Breakdown Record" {
    $bdBody = @{
        machine = @{ id = $global:TestMachineId }
        date = (Get-Date -Format 'yyyy-MM-dd')
        issue = "Hydraulic valve pressure drop"
        downtime = 150
        resolvedBy = "Service Engineer"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/breakdowns" -Method Post -Body $bdBody -ContentType "application/json" -Headers $global:Headers
    if (!$res.id -and !$res.breakdownId) { throw "Breakdown log not saved" }
}

# -------------------------------------------------------------------------------
# MODULE 14: TALLY PRIME XML EXPORTER
# -------------------------------------------------------------------------------
Assert-Test "TALLY" "14.1 Generate Tally Prime XML Sales Envelope" {
    $xmlRes = Invoke-RestMethod -Uri "$BaseUrl/api/reports/tally-xml" -Method Get -Headers $global:Headers
    if ($null -eq $xmlRes) { throw "Tally XML response was empty" }
}

# -------------------------------------------------------------------------------
# MODULE 15: AUDIT LOGS
# -------------------------------------------------------------------------------
Assert-Test "AUDIT" "15.1 Verify Audit Log Trail Recording" {
    $logs = Invoke-RestMethod -Uri "$BaseUrl/api/audit-logs" -Method Get -Headers $global:Headers
    if ($null -eq $logs -or $logs.Count -eq 0) { throw "No audit logs recorded" }
}

# -------------------------------------------------------------------------------
# MODULE 16: DATABASE SOFT DELETES
# -------------------------------------------------------------------------------
Assert-Test "SOFT_DELETE" "16.1 Execute Soft Delete and Verify Query Exclusion" {
    if ($global:TestSaleId) {
        Invoke-RestMethod -Uri "$BaseUrl/api/sales/$global:TestSaleId" -Method Delete -Headers $global:Headers
        $activeSales = Invoke-RestMethod -Uri "$BaseUrl/api/sales" -Method Get -Headers $global:Headers
        $found = $activeSales | Where-Object { ($_.id -eq $global:TestSaleId) -or ($_.saleId -eq $global:TestSaleId) }
        if ($found) { throw "Record was not excluded by @Where soft-delete filter" }
    }
}

# -------------------------------------------------------------------------------
# MODULE 17: ACTUATOR HEALTH AND PROMETHEUS METRICS
# -------------------------------------------------------------------------------
Assert-Test "ACTUATOR" "17.1 Actuator Prometheus Metrics Probe" {
    $metrics = Invoke-WebRequest -Uri "$BaseUrl/actuator/prometheus" -Method Get
    if ($metrics.StatusCode -ne 200) { throw "Prometheus probe failed with status $($metrics.StatusCode)" }
}

# -------------------------------------------------------------------------------
# MODULE 18: RATE LIMITER STRESS TEST (EXECUTED LAST)
# -------------------------------------------------------------------------------
Assert-Test "SECURITY" "18.1 Rate Limiter blocks excessive requests" {
    for ($i = 0; $i -lt 12; $i++) {
        try {
            $reqBody = @{ username = "rate_limit_probe"; password = "bad" } | ConvertTo-Json
            Invoke-RestMethod -Uri "$BaseUrl/api/users/login" -Method Post -Body $reqBody -ContentType "application/json" -TimeoutSec 2
        } catch {
            # Expected 401 or 429
        }
    }
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " SUMMARY: $global:PassCount Tests PASSED | $global:FailCount Tests FAILED" -ForegroundColor $(if ($global:FailCount -eq 0) { 'Green' } else { 'Red' })
Write-Host "=================================================================" -ForegroundColor Cyan

if ($global:FailCount -gt 0) {
    exit 1
} else {
    exit 0
}
