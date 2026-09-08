import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Vedant\\.gemini\\antigravity-ide\\brain\\c1c6338c-1671-4e87-b480-7a9ae9928b58';
const BASE_URL = 'http://localhost:8081';

async function getAuthToken() {
  const loginRes = await fetch(`${BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'SUPER_ADMIN', password: 'superadmin123' })
  }).then(r => r.json());

  let userObj;
  if (loginRes.status === 'OTP_REQUIRED' || loginRes.status === 'OTP_SENT') {
    const otp = loginRes.tempOtp || '654321';
    const verifyRes = await fetch(`${BASE_URL}/api/users/login/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'SUPER_ADMIN', otp: otp })
    }).then(r => r.json());
    userObj = verifyRes;
  } else {
    userObj = loginRes;
  }
  return userObj;
}

async function auditProduction() {
  console.log('🚀 Authenticating for Production Audit...');
  const userSession = await getAuthToken();

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: EDGE_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1500,1000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

  await page.evaluate((user, baseUrl) => {
    localStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('user', JSON.stringify(user));
    if (user.token) {
      localStorage.setItem('jwtToken', user.token);
      sessionStorage.setItem('jwtToken', user.token);
      document.cookie = `erp_session_cookie=${user.token}; path=/; SameSite=Strict`;
    }
    sessionStorage.setItem('activeTab', 'production');
    window.location.href = `${baseUrl}/`;
  }, userSession, BASE_URL);

  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));

  // Navigate explicitly to production tab if needed
  await page.evaluate(() => {
    const prodNav = document.querySelector('.sidebar-nav li[title*="Production"], .sidebar-nav li[aria-label*="Production"], .sidebar-nav li[title*="उत्पादन"]');
    if (prodNav) prodNav.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Capture current metrics
  const auditData = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button')).map(b => ({
      text: b.innerText.trim().replace(/\n/g, ' '),
      title: b.getAttribute('title'),
      ariaLabel: b.getAttribute('aria-label'),
      className: b.className,
      iconClass: b.querySelector('i')?.className || '',
      disabled: b.disabled,
      height: b.offsetHeight,
      width: b.offsetWidth
    }));

    const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map(i => ({
      type: i.getAttribute('type') || i.tagName.toLowerCase(),
      name: i.getAttribute('name'),
      placeholder: i.getAttribute('placeholder'),
      value: i.value,
      disabled: i.disabled,
      height: i.offsetHeight
    }));

    const scrollHeight = document.documentElement.scrollHeight;
    const bodyHeight = document.body.scrollHeight;
    const mainHeight = document.querySelector('main')?.scrollHeight || 0;

    return {
      buttonsCount: buttons.length,
      buttons,
      inputsCount: inputs.length,
      inputs,
      scrollHeight,
      bodyHeight,
      mainHeight
    };
  });

  console.log('📊 Production Screen Initial Audit:');
  console.log(`- Buttons Count: ${auditData.buttonsCount}`);
  console.log(`- Inputs Count: ${auditData.inputsCount}`);
  console.log(`- Scroll Height: ${auditData.scrollHeight}px (main: ${auditData.mainHeight}px)`);

  const initialShotPath = path.join(ARTIFACT_DIR, 'production_initial_audit.png');
  await page.screenshot({ path: initialShotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${initialShotPath}`);

  fs.writeFileSync(path.join(ARTIFACT_DIR, 'scratch', 'production_buttons_audit.json'), JSON.stringify(auditData, null, 2));

  await browser.close();
}

auditProduction().catch(console.error);
