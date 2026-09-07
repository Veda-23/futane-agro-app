import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const partyLatency = new Trend('party_latency');
const salesLatency = new Trend('sales_latency');
const invoiceLatency = new Trend('invoice_latency');
const statsLatency = new Trend('stats_latency');

// 3-phase load test: 10 concurrent users -> 50 concurrent users -> 100 concurrent users
export const options = {
  stages: [
    // Phase 1: Warmup & baseline with 10 users
    { duration: '30s', target: 10 },
    { duration: '1m', target: 10 },
    
    // Phase 2: Scale to 50 concurrent users
    { duration: '30s', target: 50 },
    { duration: '2m', target: 50 },
    
    // Phase 3: Stress test with 100 concurrent users
    { duration: '30s', target: 100 },
    { duration: '2m', target: 100 },
    
    // Ramp-down
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    // 95% of requests must finish within 200ms
    http_req_duration: ['p(95)<200', 'p(99)<400'],
    // Error rate must be under 1%
    error_rate: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8081';
const JWT_TOKEN = __ENV.JWT_TOKEN || '';

const HEADERS = {
  'Content-Type': 'application/json',
  'Accept-Encoding': 'gzip, deflate, br',
  ...(JWT_TOKEN ? { 'Authorization': `Bearer ${JWT_TOKEN}` } : {}),
};

export default function () {
  group('1. Master Data Endpoints (Cached with Caffeine)', function () {
    // Parties API
    const partyRes = http.get(`${BASE_URL}/api/parties`, { headers: HEADERS });
    partyLatency.add(partyRes.timings.duration);
    const partyOk = check(partyRes, {
      'parties status is 200': (r) => r.status === 200,
      'parties latency < 100ms (cached)': (r) => r.timings.duration < 100,
    });
    errorRate.add(!partyOk);

    // Vendors API
    const vendorRes = http.get(`${BASE_URL}/api/vendors`, { headers: HEADERS });
    const vendorOk = check(vendorRes, {
      'vendors status is 200': (r) => r.status === 200,
    });
    errorRate.add(!vendorOk);

    // Drivers API
    const driverRes = http.get(`${BASE_URL}/api/drivers`, { headers: HEADERS });
    const driverOk = check(driverRes, {
      'drivers status is 200': (r) => r.status === 200,
    });
    errorRate.add(!driverOk);

    // Employees API
    const empRes = http.get(`${BASE_URL}/api/employees`, { headers: HEADERS });
    const empOk = check(empRes, {
      'employees status is 200': (r) => r.status === 200,
    });
    errorRate.add(!empOk);
  });

  sleep(0.5);

  group('2. Transaction Data Endpoints (Optimized with @EntityGraph)', function () {
    // Sales API
    const salesRes = http.get(`${BASE_URL}/api/sales`, { headers: HEADERS });
    salesLatency.add(salesRes.timings.duration);
    const salesOk = check(salesRes, {
      'sales status is 200': (r) => r.status === 200,
      'sales latency < 200ms': (r) => r.timings.duration < 200,
    });
    errorRate.add(!salesOk);

    // Invoices API
    const invoiceRes = http.get(`${BASE_URL}/api/invoices`, { headers: HEADERS });
    invoiceLatency.add(invoiceRes.timings.duration);
    const invoiceOk = check(invoiceRes, {
      'invoices status is 200': (r) => r.status === 200,
      'invoices latency < 200ms': (r) => r.timings.duration < 200,
    });
    errorRate.add(!invoiceOk);

    // Payments API
    const paymentsRes = http.get(`${BASE_URL}/api/payments`, { headers: HEADERS });
    const paymentsOk = check(paymentsRes, {
      'payments status is 200': (r) => r.status === 200,
    });
    errorRate.add(!paymentsOk);

    // Raw Materials API
    const rawRes = http.get(`${BASE_URL}/api/raw-materials`, { headers: HEADERS });
    const rawOk = check(rawRes, {
      'raw materials status is 200': (r) => r.status === 200,
    });
    errorRate.add(!rawOk);

    // Inventory API
    const invRes = http.get(`${BASE_URL}/api/inventory`, { headers: HEADERS });
    const invOk = check(invRes, {
      'inventory status is 200': (r) => r.status === 200,
    });
    errorRate.add(!invOk);
  });

  sleep(0.5);

  group('3. Analytics & Aggregates', function () {
    // Dashboard Stats API
    const statsRes = http.get(`${BASE_URL}/api/dashboard/stats`, { headers: HEADERS });
    statsLatency.add(statsRes.timings.duration);
    const statsOk = check(statsRes, {
      'stats status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
    errorRate.add(!statsOk);
  });

  sleep(1);
}
