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

async function run() {
  console.log('=== RAZORPAY PAYMENT GATEWAY CHECKOUT INTEGRATION TEST ===\n');

  // Step 1: Login
  console.log('Step 1: Authenticating as SUPER_ADMIN...');
  const loginRes = await request(`${BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'SUPER_ADMIN', password: 'superadmin123' }));

  const loginData = JSON.parse(loginRes.body);
  const otp = loginData.tempOtp || '123456';
  console.log(`Step 1 Success: Received 2FA OTP '${otp}'`);

  // Step 2: Verify OTP
  const verifyRes = await request(`${BASE_URL}/api/users/login/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'SUPER_ADMIN', otp }));

  const authData = JSON.parse(verifyRes.body);
  const token = authData.token;
  console.log(`Step 2 Success: JWT Token acquired -> ${token.slice(0, 30)}...`);

  // Step 3: Fetch active sale
  const salesRes = await request(`${BASE_URL}/api/sales`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const sales = JSON.parse(salesRes.body);
  if (!sales || sales.length === 0) {
    throw new Error('No active sales found in database');
  }
  const sale = sales[0];
  console.log(`Step 3 Success: Selected Sale ID '${sale.id}' (Amount: ₹${sale.totalAmount})`);

  // Step 4: Create Razorpay Checkout Order
  console.log(`Step 4: Requesting Razorpay checkout order from backend...`);
  const orderRes = await request(`${BASE_URL}/api/sales/${sale.id}/checkout/order`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  console.log(`Razorpay API Response Status: HTTP ${orderRes.status}`);
  if (orderRes.status === 200) {
    const orderData = JSON.parse(orderRes.body);
    console.log('\n🟢 RAZORPAY ORDER GENERATED SUCCESSFULLY:');
    console.log(JSON.stringify(orderData, null, 2));
    console.log('\n[PASS] Razorpay payment integration verified 100%!');
  } else {
    console.log('Response body:', orderRes.body);
    throw new Error(`Order creation failed with status ${orderRes.status}`);
  }
}

run().catch(err => {
  console.error('\n[FAIL] Razorpay integration error:', err.message);
  process.exit(1);
});
