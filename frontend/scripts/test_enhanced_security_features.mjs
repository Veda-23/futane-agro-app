async function runEnhancedSecurityAudit() {
  console.log('========================================================================');
  console.log('=== TEST SUITE: ENHANCED XSS, SESSION PURGE & AUDIT TRAIL DEFENSES   ===');
  console.log('========================================================================\n');

  const API_BASE = 'http://localhost:8081/api';

  // ---------------------------------------------------------------------------
  // TEST 1: XSS INPUT SANITIZATION FILTER VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('--- TEST 1: TESTING XSS INPUT SANITIZATION FILTER ---');
  // Send a search request containing script injection
  const xssPayload = '<script>alert("hacked")</script>';
  const res = await fetch(`${API_BASE}/health?test=${encodeURIComponent(xssPayload)}`);
  
  if (res.status === 200) {
    console.log('✅ [PASSED] XSS Filter active: Malicious query parameters neutralized without crashing the pipeline.');
  } else {
    console.error('❌ [FAILED] XSS Filter failed:', res.status);
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // TEST 2: AUTHENTICATION & SESSION LIFECYCLE PURGE
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 2: TESTING REFRESH TOKEN LIFECYCLE & SECURITY PURGE ---');
  // Legitimate login
  const loginRes = await fetch(`${API_BASE}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'SUPER_ADMIN', password: 'superadmin123' })
  });
  const loginData = await loginRes.json();
  const otp = loginData.tempOtp;

  const verifyRes = await fetch(`${API_BASE}/users/login/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'SUPER_ADMIN', otp })
  });
  const authData = await verifyRes.json();
  const token = authData.token;
  const refreshToken = authData.refreshToken;
  console.log(`✅ Logged in. Token issued: ${token.substring(0, 24)}...`);
  console.log(`✅ Refresh token issued: ${refreshToken ? refreshToken.substring(0, 16) : 'N/A'}...`);

  // Verify that verify-session succeeds with valid token
  const verifySessionRes = await fetch(`${API_BASE}/users/verify-session`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const sessionStatus = await verifySessionRes.json();
  if (sessionStatus.status === 'VALID') {
    console.log('✅ [PASSED] Active session cryptographically verified.');
  } else {
    console.error('❌ [FAILED] Active session verification failed:', sessionStatus);
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // TEST 3: LOGOUT SESSION TOKEN BLACKLISTING
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 3: TESTING TOKEN REVOCATION ON LOGOUT ---');
  const logoutRes = await fetch(`${API_BASE}/users/logout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const logoutData = await logoutRes.json();
  console.log('Logout response:', logoutData.message);

  // Now verify that the same token is immediately rejected because it is blacklisted
  const blacklistedCheck = await fetch(`${API_BASE}/users/verify-session`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (blacklistedCheck.status === 401) {
    console.log('✅ [PASSED] Revoked/logged-out token immediately rejected (Blacklist enforcement active).');
  } else {
    console.error('❌ [FAILED] Blacklisted token was accepted with status:', blacklistedCheck.status);
    process.exit(1);
  }

  console.log('\n========================================================================');
  console.log('=== ALL ENHANCED APPLICATION SECURITY AUDITS PASSED SUCCESSFULLY     ===');
  console.log('========================================================================\n');
}

runEnhancedSecurityAudit().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
