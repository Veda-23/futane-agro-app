const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8081';

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {}
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

async function loginUser(username, password) {
  const loginRes = await request(`${BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username, password }));

  const loginData = JSON.parse(loginRes.body);
  const otp = loginData.tempOtp || '123456';

  const verifyRes = await request(`${BASE_URL}/api/users/login/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username, otp }));

  const authData = JSON.parse(verifyRes.body);
  return authData.token;
}

async function runTests() {
  console.log('=== ADMIN CONTROL CENTER, RBAC & ENTERPRISE GOVERNANCE TEST ===\n');

  console.log('Step 1: Authenticating as SUPER_ADMIN...');
  const superAdminToken = await loginUser('SUPER_ADMIN', 'superadmin123');
  console.log('Step 2: Authenticating as VIEWER (Low-privilege user)...');
  const viewerToken = await loginUser('VIEWER', 'viewer123');
  console.log('Authentication successful for both test principals.\n');

  const superAdminHeaders = {
    'Authorization': `Bearer ${superAdminToken}`,
    'Content-Type': 'application/json'
  };

  const viewerHeaders = {
    'Authorization': `Bearer ${viewerToken}`,
    'Content-Type': 'application/json'
  };

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    process.stdout.write(`Test ${total}: ${name} ... `);
    try {
      await fn();
      console.log('PASSED [OK]');
      passed++;
    } catch (err) {
      console.log(`FAILED [X]: ${err.message}`);
    }
  }

  // TEST 1: Retrieve Corporate Branding & Theme Configuration
  await test('Retrieve branding and appearance configuration (/api/admin/branding)', async () => {
    const res = await request(`${BASE_URL}/api/admin/branding`, { method: 'GET', headers: superAdminHeaders });
    if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
    const data = JSON.parse(res.body);
    if (!data.app_display_name || !data.brand_primary_color) {
      throw new Error('Missing core branding attributes in response');
    }
  });

  // TEST 2: Retrieve Enterprise Feature Flags
  await test('Query enterprise feature flags list (/api/admin/features)', async () => {
    const res = await request(`${BASE_URL}/api/admin/features`, { method: 'GET', headers: superAdminHeaders });
    if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
    const flags = JSON.parse(res.body);
    if (!Array.isArray(flags)) throw new Error('Expected array of feature flags');
  });

  // TEST 3: Query Dynamic Custom Field Definitions
  await test('Query extensible custom field definitions for Party (/api/admin/custom-fields/Party)', async () => {
    const res = await request(`${BASE_URL}/api/admin/custom-fields/Party`, { method: 'GET', headers: superAdminHeaders });
    if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
    const fields = JSON.parse(res.body);
    if (!Array.isArray(fields)) throw new Error('Expected array of custom fields');
  });

  // TEST 4: Query Teams & Department Hierarchy
  await test('Query organizational teams directory (/api/admin/teams)', async () => {
    const res = await request(`${BASE_URL}/api/admin/teams`, { method: 'GET', headers: superAdminHeaders });
    if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
    const teams = JSON.parse(res.body);
    if (!Array.isArray(teams)) throw new Error('Expected array of teams');
  });

  // TEST 5: Query Granular RBAC Permissions Matrix
  await test('Query role-permission matrix (/api/admin/permissions)', async () => {
    const res = await request(`${BASE_URL}/api/admin/permissions`, { method: 'GET', headers: superAdminHeaders });
    if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
    const matrix = JSON.parse(res.body);
    if (!matrix || typeof matrix !== 'object') throw new Error('Expected permissions matrix object');
  });

  // TEST 6: Query Spring Cache Telemetry
  await test('Query Caffeine cache statistics (/api/admin/cache/stats)', async () => {
    const res = await request(`${BASE_URL}/api/admin/cache/stats`, { method: 'GET', headers: superAdminHeaders });
    if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
  });

  // TEST 7: Query Governance Diagnostics & JVM Telemetry
  await test('Query JVM heap & server diagnostics (/api/admin/governance/diagnostics)', async () => {
    const res = await request(`${BASE_URL}/api/admin/governance/diagnostics`, { method: 'GET', headers: superAdminHeaders });
    if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
  });

  // TEST 8: Query System Health
  await test('Query system health diagnostics (/api/admin/system-health)', async () => {
    const res = await request(`${BASE_URL}/api/admin/system-health`, { method: 'GET', headers: superAdminHeaders });
    if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
  });

  // TEST 9: RBAC Guardrail — Low-Privilege VIEWER cannot modify branding (403 Forbidden)
  await test('Enforce strict SUPER_ADMIN isolation: VIEWER blocked from editing branding', async () => {
    const res = await request(`${BASE_URL}/api/admin/branding`, {
      method: 'POST',
      headers: viewerHeaders
    }, JSON.stringify({ app_tagline: 'Unauthorized Tagline' }));
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  });

  // TEST 10: RBAC Guardrail — Low-Privilege VIEWER cannot alter feature flags (403 Forbidden)
  await test('Enforce strict SUPER_ADMIN isolation: VIEWER blocked from toggling feature flags', async () => {
    const res = await request(`${BASE_URL}/api/admin/features/MFA/toggle`, {
      method: 'POST',
      headers: viewerHeaders
    }, JSON.stringify({ enabled: true }));
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  });

  console.log(`\n==================================================`);
  console.log(`Admin Control Center Test Results: ${passed}/${total} Passed (${Math.round(passed / total * 100)}%)`);
  console.log(`==================================================\n`);

  if (passed !== total) process.exit(1);
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
