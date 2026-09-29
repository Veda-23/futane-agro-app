const { chromium } = require('@playwright/test');
const path = require('path');

const targetTab = process.argv[2] || 'sales';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1336, height: 750 },
    deviceScaleFactor: 1.5
  });

  // Obtain real JWT from backend
  let authData = { token: 'mock-token', user: { id: 1, username: 'SUPER_ADMIN', name: 'Super Administrator', role: 'SUPER_ADMIN' } };
  try {
    const loginRes = await fetch('http://localhost:8081/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'SUPER_ADMIN', password: 'superadmin123' })
    }).then(r => r.json());
    if (loginRes.tempOtp) {
      const verifyRes = await fetch('http://localhost:8081/api/users/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginRes.username, otp: loginRes.tempOtp })
      }).then(r => r.json());
      if (verifyRes.token) {
        authData = {
          token: verifyRes.token,
          user: {
            id: 1,
            username: verifyRes.username,
            name: verifyRes.name || 'Super Administrator',
            role: verifyRes.role || 'SUPER_ADMIN'
          }
        };
        console.log('Successfully authenticated as SUPER_ADMIN with valid JWT.');
      }
    }
  } catch (err) {
    console.warn('Backend login attempt failed, falling back to mock:', err.message);
  }

  await context.addInitScript((data) => {
    window.sessionStorage.setItem('user', JSON.stringify(data.user));
    window.localStorage.setItem('user', JSON.stringify(data.user));
    window.localStorage.setItem('currentUser', JSON.stringify(data.user));
    window.sessionStorage.setItem('jwtToken', data.token);
    window.localStorage.setItem('jwtToken', data.token);
    window.localStorage.setItem('isLoggedIn', 'true');
  }, authData);

  const page = await context.newPage();
  await page.goto('http://localhost:4200', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2000);

  // Click target tab in sidebar
  const candidates = [targetTab, targetTab.replace(/-/g, ' '), targetTab.split('-')[0]];
  let tabEl = null;
  for (const c of candidates) {
    tabEl = await page.$(`li[title*="${c}" i], .sidebar-nav li:has-text("${c}")`);
    if (tabEl) {
      await tabEl.click();
      console.log(`Clicked tab: ${c}`);
      break;
    }
  }
  if (!tabEl) {
    await page.evaluate((t) => {
      sessionStorage.setItem('activeTab', t);
      localStorage.setItem('activeTab', t);
      window.dispatchEvent(new Event('storage'));
    }, targetTab);
    await page.reload();
  }

  await page.waitForTimeout(4000);
  try {
    await page.waitForSelector('.tab-loading-state', { state: 'detached', timeout: 30000 });
  } catch (e) {}
  try {
    const closeBtn = await page.$('.drawer-close-btn, .btn-panel-close, .modal-close-btn');
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(600);
    }
  } catch (e) {}
  await page.waitForTimeout(5000);

  const outPath = `C:/Users/Vedant/.gemini/antigravity-ide/brain/85ad973d-5ffe-43f1-ade7-7d1725289be5/${targetTab}_view.png`;
  await page.screenshot({ path: outPath });
  console.log(`SUCCESS: Captured ${outPath}`);

  await browser.close();
})();
