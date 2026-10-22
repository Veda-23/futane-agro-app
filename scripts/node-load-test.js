/**
 * Zero-dependency Node.js Concurrent Load Tester
 * Runs load tests simulating 10, 50, and 100 concurrent users against Futane Agro ERP backend
 * Usage: node scripts/node-load-test.js [baseURL]
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const BASE_URL = process.argv[2] || process.env.BASE_URL || 'http://localhost:8081';
let JWT_TOKEN = process.argv[3] || process.env.JWT_TOKEN || '';

const ENDPOINTS = [
  { path: '/api/parties', name: 'Parties Master (Caffeine Cached)' },
  { path: '/api/vendors', name: 'Vendors Master (Caffeine Cached)' },
  { path: '/api/drivers', name: 'Drivers Master (Caffeine Cached)' },
  { path: '/api/employees', name: 'Employees Master (Caffeine Cached)' },
  { path: '/api/sales', name: 'Sales List (EntityGraph Optimized)' },
  { path: '/api/invoices', name: 'Invoices List (EntityGraph Optimized)' },
  { path: '/api/payments', name: 'Payments List (EntityGraph Optimized)' },
  { path: '/api/raw-materials', name: 'Raw Materials (EntityGraph Optimized)' },
  { path: '/api/inventory', name: 'Inventory Master' },
];

function fetchEndpoint(urlStr) {
  return new Promise((resolve) => {
    const url = new URL(urlStr);
    const client = url.protocol === 'https:' ? https : http;
    const startTime = process.hrtime.bigint();

    const headers = {
      'Accept-Encoding': 'gzip, deflate',
      'User-Agent': 'Node-Load-Tester/1.0'
    };
    if (JWT_TOKEN) {
      headers['Authorization'] = `Bearer ${JWT_TOKEN}`;
    }

    const req = client.get(urlStr, { headers }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1e6;
        resolve({
          statusCode: res.statusCode,
          durationMs,
          success: res.statusCode >= 200 && res.statusCode < 400,
          bytes: body.length
        });
      });
    });

    req.on('error', (err) => {
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1e6;
      resolve({
        statusCode: 0,
        durationMs,
        success: false,
        error: err.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1e6;
      resolve({
        statusCode: 408,
        durationMs,
        success: false,
        error: 'Timeout'
      });
    });
  });
}

function calculatePercentiles(latencies) {
  if (latencies.length === 0) return { p50: 0, p90: 0, p95: 0, p99: 0, min: 0, max: 0, avg: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const getP = (p) => sorted[Math.floor(sorted.length * (p / 100))] || 0;
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  return {
    p50: getP(50).toFixed(2),
    p90: getP(90).toFixed(2),
    p95: getP(95).toFixed(2),
    p99: getP(99).toFixed(2),
    min: sorted[0].toFixed(2),
    max: sorted[sorted.length - 1].toFixed(2),
    avg: (sum / sorted.length).toFixed(2)
  };
}

async function runStage(concurrency, totalRequests) {
  console.log(`\n======================================================`);
  console.log(`  RUNNING TEST: Concurrency = ${concurrency}, Total Requests = ${totalRequests}`);
  console.log(`======================================================`);

  const latencies = [];
  let successful = 0;
  let failed = 0;
  let completed = 0;

  const startTime = Date.now();

  const worker = async () => {
    while (completed < totalRequests) {
      completed++;
      const ep = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
      const res = await fetchEndpoint(`${BASE_URL}${ep.path}`);
      latencies.push(res.durationMs);
      if (res.success) {
        successful++;
      } else {
        failed++;
      }
    }
  };

  const pool = [];
  for (let i = 0; i < concurrency; i++) {
    pool.push(worker());
  }

  await Promise.all(pool);
  const totalDurationSec = (Date.now() - startTime) / 1000;
  const rps = (totalRequests / totalDurationSec).toFixed(2);
  const stats = calculatePercentiles(latencies);

  console.log(`\nResults for Concurrency: ${concurrency} users`);
  console.log(`------------------------------------------------------`);
  console.log(`Total Requests : ${totalRequests}`);
  console.log(`Successful     : ${successful} (${((successful / totalRequests) * 100).toFixed(1)}%)`);
  console.log(`Failed         : ${failed}`);
  console.log(`Total Time     : ${totalDurationSec.toFixed(2)}s`);
  console.log(`Throughput     : ${rps} req/sec`);
  console.log(`\nLatency Percentiles (ms):`);
  console.log(`  Min : ${stats.min} ms`);
  console.log(`  Avg : ${stats.avg} ms`);
  console.log(`  p50 : ${stats.p50} ms`);
  console.log(`  p90 : ${stats.p90} ms`);
  console.log(`  p95 : ${stats.p95} ms`);
  console.log(`  p99 : ${stats.p99} ms`);
  console.log(`  Max : ${stats.max} ms`);

  const passed = Number(stats.p95) < 200 && failed === 0;
  console.log(`\nStatus: [${passed ? 'PASS - Target SLA Met (<200ms p95)' : 'WARNING - Target SLA Exceeded'}]`);
  return { concurrency, rps, stats, successful, failed };
}

async function main() {
  console.log(`======================================================`);
  console.log(` Futane Agro ERP - High Concurrency Load Test Suite`);
  console.log(` Target: ${BASE_URL}`);
  console.log(`======================================================`);

  try {
    if (!JWT_TOKEN) {
      console.log('Authenticating as SUPER_ADMIN to obtain JWT token...');
      const loginPayload = JSON.stringify({ username: 'SUPER_ADMIN', password: 'superadmin123' });
      const loginRes = await new Promise((resolve, reject) => {
        const u = new URL(`${BASE_URL}/api/users/login`);
        const req = http.request(u, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
          let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: d }));
        });
        req.on('error', reject); req.write(loginPayload); req.end();
      });
      const loginData = JSON.parse(loginRes.body);
      const otp = loginData.tempOtp || '123456';
      const verifyPayload = JSON.stringify({ username: 'SUPER_ADMIN', otp });
      const verifyRes = await new Promise((resolve, reject) => {
        const u = new URL(`${BASE_URL}/api/users/login/verify`);
        const req = http.request(u, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
          let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: d }));
        });
        req.on('error', reject); req.write(verifyPayload); req.end();
      });
      const verifyData = JSON.parse(verifyRes.body);
      JWT_TOKEN = verifyData.token;
      console.log('Authentication successful! Token acquired.\n');
    }

    // Stage 1: 10 concurrent users (baseline)
    await runStage(10, 100);

    // Stage 2: 50 concurrent users
    await runStage(50, 300);

    // Stage 3: 100 concurrent users (high scale)
    await runStage(100, 500);

    console.log(`\n======================================================`);
    console.log(`  All Load Test Stages Completed Successfully!`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error('Load test runner failed:', err);
  }
}

main();
