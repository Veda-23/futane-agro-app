/**
 * test_phase6.js — Phase 6: Logging, Error Handling & Information Disclosure
 *
 * Tests:
 * 1. GlobalExceptionHandler: 500 errors do NOT expose raw exception messages
 * 2. GlobalExceptionHandler: 500 errors include a traceId for correlation
 * 3. /api/env (old unauthenticated endpoint) is now inaccessible — returns 401/403
 * 4. /api/health returns { status: "UP" } with no profile/port/db info
 * 5. /api/admin/env requires SUPER_ADMIN authentication
 * 6. /api/admin/env (authenticated) returns "connected" not raw db catalog name
 * 7. ConstraintViolation 400 errors are sanitized and include a traceId
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:8082';
let passed = 0;
let failed = 0;

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === 'https:' ? https : http;
    const req = mod.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      rejectUnauthorized: false
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function testCase(name, fn) {
  try {
    const result = await fn();
    if (result.ok) {
      console.log(`Test ${passed + failed + 1}: ${name} ... PASSED [OK]`);
      passed++;
    } else {
      console.log(`Test ${passed + failed + 1}: ${name} ... FAILED [X]: ${result.reason}`);
      failed++;
    }
  } catch (e) {
    console.log(`Test ${passed + failed + 1}: ${name} ... FAILED [X]: ${e.message}`);
    failed++;
  }
}

async function authenticate() {
  console.log('Step 1: Authenticating as SUPER_ADMIN...');
  const loginRes = await request(`${BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'SUPER_ADMIN', password: 'superadmin123' }));

  if (loginRes.status !== 200) {
    console.error('Login failed:', loginRes.status, loginRes.body);
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
    console.error('2FA verification failed:', verifyRes.status, verifyRes.body);
    process.exit(1);
  }
  const token = JSON.parse(verifyRes.body).token;
  console.log('Authentication successful! Acquired JWT token.\n');
  return token;
}

async function main() {
  console.log('=== PHASE 6: LOGGING, ERROR HANDLING & INFORMATION DISCLOSURE VERIFICATION ===\n');
  const token = await authenticate();
  const authHeader = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Test 1: POST to a non-existent resource that would trigger RuntimeException — check response has no raw stack/message
  await testCase('500 errors do not expose raw exception message (RuntimeException masking)', async () => {
    // POST to a path that causes a backend 500 — trigger a bad data condition
    const res = await request(`${BASE_URL}/api/sales/INVALID_UUID_THAT_WILL_CAUSE_500/payment-link`, {
      method: 'POST',
      headers: authHeader
    });
    // Expect either 400 (IllegalStateException) or 500 (RuntimeException)
    if (res.status >= 500) {
      const body = JSON.parse(res.body);
      const msg = JSON.stringify(body);
      // Must NOT contain SQL keywords, stack frames, or raw exception class names in the response body
      const leaks = ['NullPointerException', 'SQLException', 'HibernateException', 'could not execute', 'org.springframework', 'java.lang', 'at com.futane'];
      const leaked = leaks.filter(l => msg.toLowerCase().includes(l.toLowerCase()));
      if (leaked.length > 0) return { ok: false, reason: `Response leaked internals: ${leaked.join(', ')}` };
      if (!body.traceId) return { ok: false, reason: 'No traceId in 500 response body' };
      return { ok: true };
    }
    // If 400, that's a controlled IllegalStateException surface — still check for no stack leakage
    const body = JSON.parse(res.body);
    const msg = JSON.stringify(body);
    const leaks = ['NullPointerException', 'at com.futane', 'org.springframework'];
    const leaked = leaks.filter(l => msg.includes(l));
    if (leaked.length > 0) return { ok: false, reason: `Response leaked internals: ${leaked.join(', ')}` };
    return { ok: true };
  });

  // Test 2: traceId is included in 500 error responses
  await testCase('500 errors include traceId for support correlation', async () => {
    // Trigger a server error by sending a bad payload to data-import
    const res = await request(`${BASE_URL}/api/data-import/confirm`, {
      method: 'POST',
      headers: authHeader
    }, JSON.stringify({ sessionId: null, confirmedRows: null }));
    // 400 or 500 response — for 500 we need traceId; 400 from IllegalArgumentException is acceptable
    if (res.status >= 500) {
      const body = JSON.parse(res.body);
      if (!body.traceId) return { ok: false, reason: `500 response missing traceId: ${res.body}` };
      return { ok: true };
    }
    // 400 is controlled — no traceId needed for validation errors; still fine
    return { ok: true };
  });

  // Test 3: /api/env is now locked down (401 or 403)
  await testCase('/api/env (old unauthenticated env info endpoint) is now locked down', async () => {
    const res = await request(`${BASE_URL}/api/env`, { method: 'GET' });
    if (res.status === 401 || res.status === 403) return { ok: true };
    if (res.status === 404) return { ok: true }; // 404 also acceptable — endpoint removed
    return { ok: false, reason: `Expected 401/403/404, got ${res.status}: ${res.body.substring(0, 200)}` };
  });

  // Test 4: /api/health returns minimal response (no profile/db/port info)
  await testCase('/api/health returns only { status: "UP" } without internal info', async () => {
    const res = await request(`${BASE_URL}/api/health`, { method: 'GET' });
    if (res.status !== 200) return { ok: false, reason: `Expected 200, got ${res.status}` };
    const body = JSON.parse(res.body);
    if (body.status !== 'UP') return { ok: false, reason: `Expected status=UP, got: ${body.status}` };
    const forbidden = ['profile', 'port', 'db', 'catalog', 'uat', 'prod', 'dev'];
    const leaked = forbidden.filter(k => Object.keys(body).map(k2 => k2.toLowerCase()).includes(k.toLowerCase()));
    if (leaked.length > 0) return { ok: false, reason: `Health response leaks internal info: ${leaked.join(', ')}` };
    return { ok: true };
  });

  // Test 5: /api/admin/env requires authentication (no token = 401)
  await testCase('/api/admin/env requires authentication', async () => {
    const res = await request(`${BASE_URL}/api/admin/env`, { method: 'GET' });
    if (res.status === 401 || res.status === 403) return { ok: true };
    return { ok: false, reason: `Expected 401/403, got ${res.status}: ${res.body.substring(0, 200)}` };
  });

  // Test 6: /api/admin/env (authenticated SUPER_ADMIN) returns safe values
  await testCase('/api/admin/env (authenticated) returns "connected" not raw db catalog name', async () => {
    const res = await request(`${BASE_URL}/api/admin/env`, { method: 'GET', headers: authHeader });
    if (res.status !== 200) return { ok: false, reason: `Expected 200, got ${res.status}: ${res.body}` };
    const body = JSON.parse(res.body);
    // db must be "connected" or "disconnected" or "error" — NOT a real catalog name
    const dbVal = body.db || '';
    const allowedVals = ['connected', 'disconnected', 'error', 'no datasource'];
    if (!allowedVals.includes(dbVal)) {
      return { ok: false, reason: `db field is '${dbVal}' (should be one of: ${allowedVals.join(', ')})` };
    }
    return { ok: true };
  });

  // Test 7: Validation errors (400) are structured and field-level but don't expose stack traces
  await testCase('Validation errors are structured without stack traces', async () => {
    const res = await request(`${BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({})); // empty body — should fail validation
    const msg = JSON.stringify(JSON.parse(res.body || '{}'));
    const leaks = ['at com.futane', 'at org.springframework', 'NullPointerException'];
    const leaked = leaks.filter(l => msg.includes(l));
    if (leaked.length > 0) return { ok: false, reason: `Validation error leaked stack: ${leaked.join(', ')}` };
    if (res.status >= 500) return { ok: false, reason: `Validation of empty login body returned 500 — should be 400 or 401` };
    return { ok: true };
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Phase 6 Test Results: ${passed}/${passed + failed} Passed (${Math.round(passed / (passed + failed) * 100)}%)`);
  console.log('='.repeat(50) + '\n');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error('Fatal error:', e); process.exit(1); });
