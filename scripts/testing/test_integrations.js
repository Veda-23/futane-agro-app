const http = require('http');
const fs = require('fs');
const path = require('path');

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
    if (body) {
      if (Buffer.isBuffer(body)) req.write(body);
      else req.write(body);
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== ADVANCED INTEGRATIONS, COPILOT & ACCOUNTING TEST SUITE ===\n');

  // 1. Authenticate as SUPER_ADMIN
  console.log('Step 1: Authenticating as SUPER_ADMIN...');
  const loginRes = await request(`${BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'SUPER_ADMIN', password: 'superadmin123' }));

  if (loginRes.status !== 200) {
    console.error('Login failed:', loginRes.status, loginRes.body);
    process.exit(1);
  }
  const loginData = JSON.parse(loginRes.body);
  let token = loginData.token;
  if (!token) {
    const otp = loginData.tempOtp || '123456';
    const verifyRes = await request(`${BASE_URL}/api/users/login/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ username: 'SUPER_ADMIN', otp }));
    const authData = JSON.parse(verifyRes.body);
    token = authData.token;
  }
  console.log('Authentication successful! Token acquired.\n');

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

  // TEST 1: AI Copilot Chat with Live ERP Grounding
  await test('AI Copilot handles natural language factory queries (/api/adk/chat)', async () => {
    const res = await request(`${BASE_URL}/api/adk/chat`, {
      method: 'POST',
      headers
    }, JSON.stringify({
      message: 'What is our current daily production yield and what is the HSN code for plastic crates?',
      conversationId: 'conv-test-001'
    }));
    if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
    const data = JSON.parse(res.body);
    if (!data.reply && !data.response && !data.text) throw new Error('No AI response in payload');
    const text = data.reply || data.response || data.text;
    if (text.length < 10) throw new Error('AI response unexpectedly short');
  });

  // TEST 2: AI Copilot Context Reset
  await test('AI Copilot resets conversation state (/api/adk/session/reset)', async () => {
    const res = await request(`${BASE_URL}/api/adk/session/reset`, {
      method: 'POST',
      headers
    }, JSON.stringify({ conversationId: 'conv-test-001' }));
    if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
  });

  // TEST 3: Tally Prime XML Sales Accounting Export
  await test('Generate compliant Tally Prime XML Sales Envelope (/api/reports/tally-xml)', async () => {
    const res = await request(`${BASE_URL}/api/reports/tally-xml`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
    if (!res.body.includes('<ENVELOPE>') && !res.body.includes('<TALLYMESSAGE>') && !res.body.includes('Tally')) {
      throw new Error('Tally XML does not contain required root tags');
    }
  });

  // TEST 4: Secure Bulk Excel Data Import
  await test('Excel Importer validates & processes workbook (/api/dashboard/import)', async () => {
    const xlsxPath = path.resolve(__dirname, '../../futane_agro_data.xlsx');
    if (!fs.existsSync(xlsxPath)) throw new Error('futane_agro_data.xlsx not found at root');
    const fileBuf = fs.readFileSync(xlsxPath);

    const boundary = '----FutaneFormBoundary' + Date.now();
    const head = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="futane_agro_data.xlsx"\r\n` +
      `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`
    );
    const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
    const multipartBody = Buffer.concat([head, fileBuf, tail]);

    const res = await request(`${BASE_URL}/api/dashboard/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': multipartBody.length
      }
    }, multipartBody);

    if (res.status !== 200) throw new Error(`HTTP status ${res.status}: ${res.body}`);
  });

  // TEST 5: Comprehensive Dashboard Aggregation
  await test('Dashboard statistics aggregation (/api/dashboard/stats)', async () => {
    const res = await request(`${BASE_URL}/api/dashboard/stats`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
    const stats = JSON.parse(res.body);
    if (stats.totalRevenue === undefined && stats.totalSales === undefined && stats.partiesCount === undefined) {
      throw new Error('Expected dashboard financial & production metric fields');
    }
  });

  console.log(`\n==================================================`);
  console.log(`Advanced Integrations Test Results: ${passed}/${total} Passed (${Math.round(passed / total * 100)}%)`);
  console.log(`==================================================\n`);

  if (passed !== total) process.exit(1);
}

runTests().catch(err => {
  console.error('Test harness exception:', err);
  process.exit(1);
});
