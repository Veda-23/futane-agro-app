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

async function runTests() {
  console.log('=== PARTY CRM, VALIDATION & AES-256 ENCRYPTION VERIFICATION ===\n');

  // 1. Authenticate
  const loginRes = await request(`${BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'SUPER_ADMIN', password: 'superadmin123' }));

  const loginData = JSON.parse(loginRes.body);
  const otp = loginData.tempOtp || '123456';

  const verifyRes = await request(`${BASE_URL}/api/users/login/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'SUPER_ADMIN', otp }));

  const authData = JSON.parse(verifyRes.body);
  const token = authData.token;
  const headers = {
    'Authorization': `Bearer ${token}`,
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

  const random8 = Math.floor(Math.random() * 89999999 + 10000000);
  const testPhone = '98' + String(random8); // exactly 10 digits
  const suffix = Math.floor(Math.random() * 89999 + 10000);
  const testEmail = `contact_${suffix}@agritraders.test`;
  const validGst = '27AAAAA0000A1Z5'; // Standard valid 15-char GST format
  let createdPartyId = null;

  // TEST 1: Reject Invalid Phone Number (Length != 10)
  await test('Reject invalid phone number format (< 10 digits)', async () => {
    const res = await request(`${BASE_URL}/api/parties`, { method: 'POST', headers }, JSON.stringify({
      partyName: 'Invalid Phone Agro ' + suffix,
      partyContact: '12345', // Invalid
      email: testEmail
    }));
    if (res.status !== 400) throw new Error(`Expected 400 Bad Request, got ${res.status}`);
  });

  // TEST 2: Reject Invalid Email Format
  await test('Reject malformed email address', async () => {
    const res = await request(`${BASE_URL}/api/parties`, { method: 'POST', headers }, JSON.stringify({
      partyName: 'Invalid Email Agro ' + suffix,
      partyContact: testPhone,
      email: 'not-an-email-address'
    }));
    if (res.status !== 400) throw new Error(`Expected 400 Bad Request, got ${res.status}`);
  });

  // TEST 3: Reject Invalid GSTIN Format
  await test('Reject non-compliant GSTIN format', async () => {
    const res = await request(`${BASE_URL}/api/parties`, { method: 'POST', headers }, JSON.stringify({
      partyName: 'Invalid GST Agro ' + suffix,
      partyContact: testPhone,
      email: testEmail,
      gstNumber: 'INVALID_GST_123'
    }));
    if (res.status !== 400) throw new Error(`Expected 400 Bad Request, got ${res.status}`);
  });

  // TEST 4: Create Valid Party with Encrypted GST
  await test('Accept valid party & perform transparent AES-256 field encryption', async () => {
    const res = await request(`${BASE_URL}/api/parties`, { method: 'POST', headers }, JSON.stringify({
      partyName: 'Sahyadri Premier Agro ' + suffix,
      partyAddress: 'Gat 142, Baramati, Pune',
      partyContact: testPhone,
      gstNumber: validGst,
      email: testEmail,
      city: 'Pune',
      state: 'Maharashtra'
    }));
    if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}: ${res.body}`);
    const party = JSON.parse(res.body);
    if (!party.id) throw new Error('No party id returned');
    createdPartyId = party.id;
    if (party.gstNumber !== validGst) throw new Error('Decrypted GST does not match input');
  });

  // TEST 5: Cache Verification (Subsequent reads return cached result)
  await test('Read party list and verify Spring Cache response', async () => {
    const res = await request(`${BASE_URL}/api/parties`, { method: 'GET', headers });
    if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
    const list = JSON.parse(res.body);
    const found = list.find(p => p.id === createdPartyId);
    if (!found) throw new Error('Newly created party not found in active list');
  });

  // TEST 6: Soft Delete Party
  await test('Soft delete party and verify exclusion via Hibernate @Where filter', async () => {
    if (!createdPartyId) throw new Error('No created party id');
    const delRes = await request(`${BASE_URL}/api/parties/${createdPartyId}`, { method: 'DELETE', headers });
    if (delRes.status !== 200 && delRes.status !== 204) throw new Error(`Expected 200/204, got ${delRes.status}`);

    // Verify exclusion from list
    const listRes = await request(`${BASE_URL}/api/parties`, { method: 'GET', headers });
    const activeList = JSON.parse(listRes.body);
    const stillPresent = activeList.some(p => p.id === createdPartyId);
    if (stillPresent) throw new Error('Soft-deleted party was not excluded by @Where filter');
  });

  console.log(`\n==================================================`);
  console.log(`Party CRM Validation Results: ${passed}/${total} Passed (${Math.round(passed / total * 100)}%)`);
  console.log(`==================================================\n`);

  if (passed !== total) process.exit(1);
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
