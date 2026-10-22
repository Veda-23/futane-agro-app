# Futane Agro ERP - Automated End-to-End Smoke Validation
param(
    [string]$BaseUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"
$TestsPassed = 0
$TestsFailed = 0

function Run-Test([string]$Name, [scriptblock]$TestBlock) {
    Write-Host -NoNewline "[TEST] $Name ... "
    try {
        & $TestBlock
        Write-Host "PASSED" -ForegroundColor Green
        $global:TestsPassed++
    } catch {
        Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $global:TestsFailed++
    }
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Futane Agro ERP Smoke Test Suite        " -ForegroundColor Cyan
Write-Host " Target: $BaseUrl                        " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

Run-Test "Actuator Health Check" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/actuator/health" -Method Get
    if ($res.status -ne "UP") { throw "Status was $($res.status)" }
}

Run-Test "Public Storefront Catalog Query" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/v1/storefront/catalog" -Method Get
    if ($null -eq $res -or $res.Count -eq 0) { throw "Storefront catalog returned empty" }
}

Run-Test "Invalid Credentials Rejection (401)" {
    try {
        Invoke-RestMethod -Uri "$BaseUrl/api/users/login" -Method Post -Body (@{username='invalid';password='wrong'} | ConvertTo-Json) -ContentType "application/json"
        throw "Expected 401 but succeeded"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -ne 401) {
            throw "Unexpected status code: $($_.Exception.Response.StatusCode.value__)"
        }
    }
}

Write-Host "=========================================" -ForegroundColor Cyan
$summaryColor = if ($TestsFailed -eq 0) { 'Green' } else { 'Red' }
Write-Host "Summary: $TestsPassed Passed | $TestsFailed Failed" -ForegroundColor $summaryColor
if ($TestsFailed -gt 0) { exit 1 } else { exit 0 }
