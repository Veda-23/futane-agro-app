import { chromium } from '@playwright/test';

async function testAppActions() {
  console.log('--- Starting Deep Action & Freeze Diagnostic ---');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1366, height: 768 });

  const errors = [];
  const pendingRequests = new Map();
  const slowRequests = [];

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      console.log('[BROWSER CONSOLE ERROR]:', text);
    }
  });

  page.on('pageerror', err => {
    errors.push(err.message);
    console.log('[BROWSER UNCAUGHT ERROR]:', err.message);
  });

  page.on('request', req => {
    pendingRequests.set(req.url(), Date.now());
  });

  page.on('requestfinished', req => {
    const start = pendingRequests.get(req.url());
    if (start) {
      const duration = Date.now() - start;
      pendingRequests.delete(req.url());
      if (duration > 1000) {
        slowRequests.push({ url: req.url(), duration });
        console.log(`[SLOW REQ ${duration}ms]`, req.url());
      }
    }
  });

  page.on('requestfailed', req => {
    pendingRequests.delete(req.url());
    console.log('[REQ FAILED]', req.url(), req.failure()?.errorText);
  });

  page.on('response', res => {
    if (res.status() >= 400) {
      console.log(`[HTTP ${res.status()}]`, res.url());
    }
  });

  console.log('1. Loading http://localhost:4300...');
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });

  // Login
  await page.fill('#username', 'SUPER_ADMIN');
  await page.fill('#password', 'superadmin123');
  await page.click('#login-submit-btn');

  // Handle OTP
  const otpAppeared = await page.waitForSelector('.uat-otp-helper-pill, .otp-inputs-row, .sidebar', { timeout: 8000 }).catch(() => null);
  if (await page.locator('.uat-otp-helper-pill').isVisible().catch(() => false)) {
    await page.click('.uat-otp-helper-pill');
    await page.waitForTimeout(400);
    const otpSubmit = page.locator('button[type="submit"]');
    if (await otpSubmit.isVisible()) await otpSubmit.click();
  }

  await page.waitForTimeout(2000);
  console.log('Logged in. Current URL:', page.url());

  // Let's test navigation links in sidebar
  const navLinks = await page.locator('.sidebar a, nav a, .nav-item a, [routerLink]').all();
  console.log(`Found ${navLinks.length} navigation links.`);

  for (let i = 0; i < Math.min(navLinks.length, 15); i++) {
    const link = navLinks[i];
    const text = (await link.innerText().catch(() => '')).trim().replace(/\n/g, ' ');
    if (!text || text.toLowerCase().includes('logout')) continue;
    
    console.log(`\nClicking nav link [${i}]: "${text}"...`);
    const t0 = Date.now();
    try {
      await link.click({ timeout: 5000 });
      await page.waitForTimeout(1200);
      const elapsed = Date.now() - t0;
      console.log(`-> Navigation to "${text}" finished in ${elapsed}ms. URL now: ${page.url()}`);
    } catch (e) {
      console.log(`-> Error clicking "${text}":`, e.message);
    }
  }

  // Check any pending requests that never finished
  console.log('\n--- Checking Stuck/Pending Requests ---');
  for (const [url, start] of pendingRequests.entries()) {
    console.log(`STUCK REQUEST (${Date.now() - start}ms ago):`, url);
  }

  console.log('\n--- Summary of Slow Requests (>1s) ---');
  slowRequests.forEach(s => console.log(`  ${s.duration}ms: ${s.url}`));

  console.log('\n--- Errors encountered ---');
  console.log(errors.length === 0 ? 'No page errors' : errors.join('\n'));

  await browser.close();
  console.log('Diagnostic finished.');
}

testAppActions().catch(console.error);
