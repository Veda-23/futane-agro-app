const { chromium } = require('@playwright/test');
const path = require('path');

const BASE_URL = 'http://localhost:8081';

async function captureReportsTableScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating and authenticating...');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  console.log('🔑 Authenticating via Backend UAT API (SUPER_ADMIN)...');
  const loginRes = await fetch('http://localhost:8081/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'SUPER_ADMIN', password: 'superadmin123' })
  }).then(r => r.json());

  let userObj;
  if (loginRes.status === 'OTP_REQUIRED' || loginRes.status === 'OTP_SENT') {
    const otp = loginRes.tempOtp || '654321';
    const verifyRes = await fetch('http://localhost:8081/api/users/login/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'SUPER_ADMIN', otp: otp })
    }).then(r => r.json());
    userObj = verifyRes;
  } else {
    userObj = loginRes;
  }

  console.log('🌐 Loading Futane Agro ERP & Injecting Session...');
  await page.goto('http://localhost:8081/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((user) => {
    localStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('user', JSON.stringify(user));
    if (user.token) {
      localStorage.setItem('jwtToken', user.token);
      sessionStorage.setItem('jwtToken', user.token);
      document.cookie = `erp_session_cookie=${user.token}; path=/; SameSite=Strict`;
    }
    sessionStorage.setItem('activeTab', 'reports');
    window.location.reload();
  }, userObj);

  await page.waitForTimeout(2500);

  console.log('Switching to Reports tab...');
  await page.evaluate(() => {
    const rootEl = document.querySelector('app-root');
    const ngComp = window.ng ? window.ng.getComponent(rootEl) : null;
    if (ngComp && typeof ngComp.switchTab === 'function') {
      ngComp.switchTab('reports');
    }
  });

  await page.waitForTimeout(1500);

  // Scroll down slightly so chart bottom and table are both captured
  await page.evaluate(() => {
    window.scrollTo({ top: 320, behavior: 'instant' });
  });
  await page.waitForTimeout(500);

  const screenshotPath = 'C:\\Users\\Vedant\\.gemini\\antigravity-ide\\brain\\cc345a3b-9e95-4cb7-89f5-1da9c4af8947\\reports_table_redesigned.png';
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('Screenshot saved to:', screenshotPath);

  await browser.close();
}

captureReportsTableScreenshot().catch(console.error);
