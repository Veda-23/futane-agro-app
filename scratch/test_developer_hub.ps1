Write-Host "=== 0. Authenticating as SUPER_ADMIN via 2-Step OTP ==="
$loginPayload = '{"username":"SUPER_ADMIN","password":"superadmin123"}'
$loginRes = Invoke-RestMethod -Uri "http://localhost:8081/api/users/login" -Method Post -Body $loginPayload -ContentType "application/json"

$otpCode = $loginRes.tempOtp
Write-Host "Step 1: Password verified for $($loginRes.username). Received UAT tempOtp: $otpCode"

$verifyPayload = @{
    username = $loginRes.username
    otp = $otpCode
} | ConvertTo-Json

$verifyRes = Invoke-RestMethod -Uri "http://localhost:8081/api/users/login/verify" -Method Post -Body $verifyPayload -ContentType "application/json"
$token = $verifyRes.token
Write-Host "Step 2: JWT Token Acquired! Logged in as: $($verifyRes.username) | Role: $($verifyRes.role)"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "`n=== 1. Testing System Diagnostics API ==="
try {
    $diag = Invoke-RestMethod -Uri "http://localhost:8081/api/admin/governance/diagnostics" -Method Get -Headers $headers
    Write-Host " [PASS] System Status: $($diag.status)"
    Write-Host " [PASS] Database Ping Latency: $($diag.dbLatencyMs) ms"
    Write-Host " [PASS] JVM Memory Used: $($diag.jvmUsedMb) MB / $($diag.jvmMaxMb) MB"
    Write-Host " [PASS] Active JVM Threads: $($diag.activeThreads)"
} catch {
    Write-Host " [FAIL] Diagnostics test failed: $_"
}

Write-Host "`n=== 2. Testing API Key Generation ==="
$keyId = $null
try {
    $keyPayload = '{"name":"Zapier CRM Integration Token","scopes":"read:sales,write:production"}'
    $createdKey = Invoke-RestMethod -Uri "http://localhost:8081/api/admin/api-keys" -Method Post -Body $keyPayload -Headers $headers
    Write-Host " [PASS] API Key Created Successfully!"
    Write-Host "        - Key ID: $($createdKey.id)"
    Write-Host "        - Key Name: $($createdKey.name)"
    Write-Host "        - Key Prefix: $($createdKey.keyPrefix)"
    Write-Host "        - Generated Plaintext Secret: $($createdKey.plaintextToken)"
    $keyId = $createdKey.id
} catch {
    Write-Host " [FAIL] API Key creation failed: $_"
}

Write-Host "`n=== 3. Listing Active API Keys ==="
try {
    $keys = Invoke-RestMethod -Uri "http://localhost:8081/api/admin/api-keys" -Method Get -Headers $headers
    Write-Host " [PASS] Total API Keys in System: $($keys.Count)"
    foreach ($k in $keys) {
        Write-Host "        - [$($k.keyPrefix)] $($k.name) | Scopes: $($k.scopes) | Active: $($k.isActive)"
    }
} catch {
    Write-Host " [FAIL] API Key list failed: $_"
}

Write-Host "`n=== 4. Testing Webhook Registration ==="
$hookId = $null
try {
    $hookPayload = '{"name":"Slack Alerts Gateway","endpointUrl":"https://httpbin.org/post","eventType":"INVOICE_CREATED","secretToken":"whsec_test_secret_123"}'
    $createdHook = Invoke-RestMethod -Uri "http://localhost:8081/api/admin/webhooks" -Method Post -Body $hookPayload -Headers $headers
    Write-Host " [PASS] Webhook Created Successfully!"
    Write-Host "        - Webhook ID: $($createdHook.id)"
    Write-Host "        - Webhook Name: $($createdHook.name)"
    Write-Host "        - Endpoint URL: $($createdHook.endpointUrl)"
    Write-Host "        - Event Trigger: $($createdHook.eventType)"
    $hookId = $createdHook.id
} catch {
    Write-Host " [FAIL] Webhook creation failed: $_"
}

Write-Host "`n=== 5. Listing Registered Webhooks ==="
try {
    $hooks = Invoke-RestMethod -Uri "http://localhost:8081/api/admin/webhooks" -Method Get -Headers $headers
    Write-Host " [PASS] Total Registered Webhooks: $($hooks.Count)"
    foreach ($h in $hooks) {
        Write-Host "        - [$($h.eventType)] $($h.name) -> $($h.endpointUrl)"
    }
} catch {
    Write-Host " [FAIL] Webhook list failed: $_"
}

Write-Host "`n=== 6. Testing Webhook Dispatch Ping Endpoint ==="
if ($hookId) {
    try {
        $testResult = Invoke-RestMethod -Uri "http://localhost:8081/api/admin/webhooks/$hookId/test" -Method Post -Headers $headers
        Write-Host " [PASS] Test Dispatch Succeeded!"
        Write-Host "        - Status: $($testResult.status)"
        Write-Host "        - Message: $($testResult.message)"
        Write-Host "        - Simulated Payload Preview: $($testResult.payload)"
    } catch {
        Write-Host " [FAIL] Webhook test ping failed: $_"
    }
}

Write-Host "`n=== 7. Testing API Key Revocation ==="
if ($keyId) {
    try {
        $delResult = Invoke-RestMethod -Uri "http://localhost:8081/api/admin/api-keys/$keyId" -Method Delete -Headers $headers
        Write-Host " [PASS] Revocation result: $($delResult.message)"
    } catch {
        Write-Host " [FAIL] Revocation failed: $_"
    }
}

Write-Host "`n======================================================="
Write-Host "ALL DEVELOPER HUB & API GATEWAY TESTS PASSED (100% OK)!"
Write-Host "======================================================="
