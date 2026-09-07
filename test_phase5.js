const http = require('http');

function request(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request(parsed, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log("=== PHASE 5: TRANSPORT, HEADERS, RATE LIMITING & SECRETS VERIFICATION ===\n");
  const BASE_URL = 'http://localhost:8082';

  let passed = 0;
  let total = 0;

  async function testCase(name, fn) {
    total++;
    process.stdout.write(`Test ${total}: ${name} ... `);
    try {
      await fn();
      console.log("PASSED [OK]");
      passed++;
    } catch (err) {
      console.log(`FAILED [X]: ${err.message}`);
    }
  }

  // 1. Authenticate as SUPER_ADMIN
  console.log("Step 1: Authenticating as SUPER_ADMIN...");
  const loginRes = await request(`${BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'SUPER_ADMIN', password: 'superadmin123' }));

  if (loginRes.status !== 200) {
    console.error("Login failed:", loginRes.status, loginRes.body);
    process.exit(1);
  }
  const loginBody = JSON.parse(loginRes.body);
  const otp = loginBody.tempOtp || '123456';

  console.log(`Step 2: Verifying 2FA OTP (${otp})...`);
  const verifyRes = await request(`${BASE_URL}/api/users/login/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'SUPER_ADMIN', otp: otp }));

  if (verifyRes.status !== 200) {
    console.error("2FA verification failed:", verifyRes.status, verifyRes.body);
    process.exit(1);
  }
  const token = JSON.parse(verifyRes.body).token;
  console.log("Authentication successful! Acquired JWT token.\n");

  // TEST 1: Security Headers on API response
  await testCase("Enforce comprehensive security headers (CSP, HSTS, X-Frame-Options, etc.)", async () => {
    const res = await request(`${BASE_URL}/api/health`, { method: 'GET' });

    const csp = res.headers['content-security-policy'] || '';
    const hsts = res.headers['strict-transport-security'] || '';
    const frame = res.headers['x-frame-options'] || '';
    const nosniff = res.headers['x-content-type-options'] || '';
    const coop = res.headers['cross-origin-opener-policy'] || '';
    const corp = res.headers['cross-origin-resource-policy'] || '';

    if (!frame.toUpperCase().includes('DENY')) {
      throw new Error(`X-Frame-Options expected DENY, got: ${frame}`);
    }
    if (nosniff !== 'nosniff') {
      throw new Error(`X-Content-Type-Options expected nosniff, got: ${nosniff}`);
    }
    if (!hsts.includes('max-age=63072000')) {
      throw new Error(`HSTS header missing or invalid: ${hsts}`);
    }
    if (csp.includes("'unsafe-eval'")) {
      throw new Error(`CSP contains dangerous 'unsafe-eval' directive!`);
    }
    if (!csp.includes("ws:") || !csp.includes("wss:")) {
      throw new Error(`CSP connect-src missing WebSocket support!`);
    }
    if (coop !== 'same-origin') {
      throw new Error(`COOP header missing or invalid: ${coop}`);
    }
    if (corp !== 'same-site') {
      throw new Error(`CORP header missing or invalid: ${corp}`);
    }
  });

  // TEST 2: CORS Preflight (OPTIONS request with PATCH method and max-age)
  await testCase("Verify CORS preflight headers and caching (OPTIONS)", async () => {
    const res = await request(`${BASE_URL}/api/sales`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:4200',
        'Access-Control-Request-Method': 'PATCH',
        'Access-Control-Request-Headers': 'Authorization, Content-Type'
      }
    });

    const allowOrigin = res.headers['access-control-allow-origin'];
    const allowMethods = res.headers['access-control-allow-methods'] || '';
    const maxAge = res.headers['access-control-max-age'];

    if (allowOrigin !== 'http://localhost:4200') {
      throw new Error(`CORS origin not allowed: ${allowOrigin}`);
    }
    if (!allowMethods.includes('PATCH')) {
      throw new Error(`CORS allow methods missing PATCH: ${allowMethods}`);
    }
    if (maxAge !== '3600') {
      throw new Error(`CORS preflight caching not configured, max-age: ${maxAge}`);
    }
  });

  // TEST 3: Token Revocation & verify-session check
  await testCase("Revoked token is rejected by /api/users/verify-session", async () => {
    // Generate separate login session to revoke
    const lRes = await request(`${BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ username: 'SUPER_ADMIN', password: 'superadmin123' }));
    const lBody = JSON.parse(lRes.body);
    const vRes = await request(`${BASE_URL}/api/users/login/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ username: 'SUPER_ADMIN', otp: lBody.tempOtp || '123456' }));
    const sessionToken = JSON.parse(vRes.body).token;

    // Verify session token is initially valid
    const preCheck = await request(`${BASE_URL}/api/users/verify-session`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${sessionToken}` }
    });
    if (preCheck.status !== 200) {
      throw new Error(`Initial verify-session failed: ${preCheck.status}`);
    }

    // Logout to blacklist the token
    const logoutRes = await request(`${BASE_URL}/api/users/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${sessionToken}` }
    });
    if (logoutRes.status !== 200) {
      throw new Error(`Logout failed: ${logoutRes.status}`);
    }

    // Now verify-session must return 401 Unauthorized
    const postCheck = await request(`${BASE_URL}/api/users/verify-session`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${sessionToken}` }
    });
    if (postCheck.status !== 401) {
      throw new Error(`Expected 401 for blacklisted token, got: ${postCheck.status}`);
    }
  });

  // TEST 4: Rate Limiting on Password Change
  await testCase("Enforce rate limiting on password change endpoint", async () => {
    let gotRateLimited = false;
    for (let i = 0; i < 7; i++) {
      const res = await request(`${BASE_URL}/api/users/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }, JSON.stringify({
        username: 'SUPER_ADMIN',
        currentPassword: 'wrongPassword123!',
        newPassword: 'newValidPassword123!'
      }));

      if (res.status === 429) {
        gotRateLimited = true;
        break;
      }
    }

    if (!gotRateLimited) {
      throw new Error("Expected HTTP 429 Too Many Requests after exceeding password change threshold");
    }
  });

  // TEST 5: Rate Limiting on Refresh Token
  await testCase("Enforce rate limiting on refresh token endpoint", async () => {
    let gotRateLimited = false;
    for (let i = 0; i < 18; i++) {
      const res = await request(`${BASE_URL}/api/users/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, JSON.stringify({ refreshToken: 'dummy-token-' + i }));

      if (res.status === 429) {
        gotRateLimited = true;
        break;
      }
    }

    if (!gotRateLimited) {
      throw new Error("Expected HTTP 429 Too Many Requests after exceeding refresh token threshold");
    }
  });

  // TEST 6: Webhook endpoint rejects flood
  await testCase("Enforce rate limiting on Razorpay Webhook endpoint", async () => {
    let gotRateLimited = false;
    for (let i = 0; i < 65; i++) {
      const res = await request(`${BASE_URL}/api/webhooks/razorpay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'dummy'
        }
      }, JSON.stringify({ event: 'test' }));

      if (res.status === 429) {
        gotRateLimited = true;
        break;
      }
    }

    if (!gotRateLimited) {
      throw new Error("Expected HTTP 429 on volumetric webhook flooding");
    }
  });

  console.log(`\n==================================================`);
  console.log(`Phase 5 Test Results: ${passed}/${total} Passed (${Math.round((passed/total)*100)}%)`);
  console.log(`==================================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
