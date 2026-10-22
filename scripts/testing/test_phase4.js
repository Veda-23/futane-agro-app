const http = require('http');
const https = require('https');

function request(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.request(parsed, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (postData) {
      if (Buffer.isBuffer(postData)) {
        req.write(postData);
      } else {
        req.write(postData);
      }
    }
    req.end();
  });
}

function createMultipartBody(boundary, filename, mimeType, fileBuffer) {
  const head = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  return Buffer.concat([head, fileBuffer, tail]);
}

async function runTests() {
  console.log("=== PHASE 4: FILE UPLOAD & ASSET PIPELINE SECURITY VERIFICATION ===\n");
  const BASE_URL = process.env.BASE_URL || 'http://localhost:8081';

  // 1. Authenticate as SUPER_ADMIN with 2FA
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

  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
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

  // TEST 1: Block disguised binary disguised as PDF (e.g. Windows PE 'MZ' header)
  await testCase("Reject PE executable disguised as .pdf (MZ header)", async () => {
    const fakePdf = Buffer.from("MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xFF\xFFFakeExecutablePayload");
    const body = createMultipartBody(boundary, "malware.pdf", "application/pdf", fakePdf);
    const res = await request(`${BASE_URL}/api/uploads/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      }
    }, body);

    if (res.status !== 400 || !res.body.includes("File content does not match its extension")) {
      throw new Error(`Expected 400 with disguise attack warning, got ${res.status}: ${res.body}`);
    }
  });

  // TEST 2: Reject MIME mismatch (JPEG image content disguised as .pdf extension)
  await testCase("Reject JPEG content named report.pdf (MIME mismatch)", async () => {
    // Valid JPEG header: FF D8 FF E0
    const jpegContent = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
    const body = createMultipartBody(boundary, "invoice.pdf", "application/pdf", jpegContent);
    const res = await request(`${BASE_URL}/api/uploads/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      }
    }, body);

    if (res.status !== 400 || !res.body.includes("File content does not match its extension")) {
      throw new Error(`Expected 400 with disguise attack warning, got ${res.status}: ${res.body}`);
    }
  });

  // TEST 3: Reject text file with binary/null bytes disguised as .csv
  await testCase("Reject binary/null-byte content disguised as .csv", async () => {
    const maliciousCsv = Buffer.from("id,name,role\n1,admin,\x00\x01\x02malware_bytes");
    const body = createMultipartBody(boundary, "data.csv", "text/csv", maliciousCsv);
    const res = await request(`${BASE_URL}/api/uploads/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      }
    }, body);

    if (res.status !== 400 || !res.body.includes("File content does not match its extension")) {
      throw new Error(`Expected 400 with disguise attack warning, got ${res.status}: ${res.body}`);
    }
  });

  // TEST 4: Reject unallowed executable extension (.php, .exe, .sh)
  await testCase("Reject unallowed extension .sh / .exe", async () => {
    const shellScript = Buffer.from("#!/bin/bash\necho hacked\n");
    const body = createMultipartBody(boundary, "exploit.sh", "application/x-sh", shellScript);
    const res = await request(`${BASE_URL}/api/uploads/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      }
    }, body);

    if (res.status !== 400 || !res.body.includes("File type not permitted")) {
      throw new Error(`Expected 400 with unpermitted file type, got ${res.status}: ${res.body}`);
    }
  });

  // TEST 5: Accept valid PDF upload and verify safe sanitized storage
  let uploadedPdfFilename = '';
  await testCase("Accept valid PDF upload with %PDF signature", async () => {
    const validPdf = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n");
    const body = createMultipartBody(boundary, "valid_document.pdf", "application/pdf", validPdf);
    const res = await request(`${BASE_URL}/api/uploads/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      }
    }, body);

    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}: ${res.body}`);
    }
    const json = JSON.parse(res.body);
    if (!json.filename || !json.filename.endsWith("valid_document.pdf")) {
      throw new Error(`Unexpected filename: ${json.filename}`);
    }
    uploadedPdfFilename = json.filename;
  });

  // TEST 6: Unauthenticated download of uploaded document must be BLOCKED (401/403)
  await testCase("Block unauthenticated GET on private document upload", async () => {
    const res = await request(`${BASE_URL}/api/uploads/${uploadedPdfFilename}`, {
      method: 'GET'
    });

    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Expected 401 or 403 for anonymous download, got ${res.status}`);
    }
  });

  // TEST 7: Authenticated download of document must include security headers
  await testCase("Authenticated download enforces security headers (nosniff, attachment, private cache)", async () => {
    const res = await request(`${BASE_URL}/api/uploads/${uploadedPdfFilename}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    const disp = res.headers['content-disposition'] || '';
    const nosniff = res.headers['x-content-type-options'] || '';
    const cache = res.headers['cache-control'] || '';

    if (!disp.includes('attachment')) {
      throw new Error(`Missing or non-attachment Content-Disposition: ${disp}`);
    }
    if (nosniff !== 'nosniff') {
      throw new Error(`Missing X-Content-Type-Options: nosniff`);
    }
    if (!cache.includes('private') && !cache.includes('no-store')) {
      throw new Error(`Missing private/no-store Cache-Control: ${cache}`);
    }
  });

  // TEST 8: Verify path traversal attempt on GET /api/uploads/
  await testCase("Block path traversal attempt in GET download", async () => {
    const res = await request(`${BASE_URL}/api/uploads/..%2F..%2Fetc%2Fpasswd`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Should be 400 or 403 or 404 (never return host file)
    if (res.status === 200) {
      throw new Error(`Path traversal succeeded with 200!`);
    }
  });

  console.log(`\n==================================================`);
  console.log(`Phase 4 Test Results: ${passed}/${total} Passed (${Math.round((passed/total)*100)}%)`);
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
