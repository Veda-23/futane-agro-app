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

async function runDashboardQA() {
  console.log('🚀 Authenticating via UAT API...');
  const userSession = await getAuthToken();
  console.log('   Authenticated User:', userSession.username, 'Role:', userSession.role);

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: EDGE_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1500,1000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  console.log('🌐 Injecting session into Futane Agro ERP...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

  await page.evaluate((user, baseUrl) => {
    localStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('user', JSON.stringify(user));
    if (user.token) {
      localStorage.setItem('jwtToken', user.token);
      sessionStorage.setItem('jwtToken', user.token);
      document.cookie = `erp_session_cookie=${user.token}; path=/; SameSite=Strict`;
    }
    sessionStorage.setItem('activeTab', 'dashboard');
    window.location.href = `${baseUrl}/`;
  }, userSession, BASE_URL);

  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise(r => setTimeout(r, 2500));

  // 1. Desktop Standard Viewport Capture (Light Mode)
  const destDesktop = path.join(ARTIFACT_DIR, 'dashboard_phase1_desktop.png');
  await page.screenshot({ path: destDesktop, fullPage: false });
  console.log(`✅ Saved Desktop Standard: ${destDesktop}`);

  // 2. Full-Page Scrollable Height Capture (Light Mode)
  const destFull = path.join(ARTIFACT_DIR, 'dashboard_phase1_fullpage.png');
  await page.screenshot({ path: destFull, fullPage: true });
  console.log(`✅ Saved Full-Page: ${destFull}`);

  // Measure total scroll height, buttons, icons
  const metrics = await page.evaluate(() => {
    const dash = document.querySelector('.dashboard-container');
    const buttons = Array.from(dash ? dash.querySelectorAll('button') : []);
    const inputs = Array.from(dash ? dash.querySelectorAll('input, select') : []);
    const svgs = Array.from(dash ? dash.querySelectorAll('svg') : []);
    const bootstrapIcons = Array.from(dash ? dash.querySelectorAll('.bi') : []);
    return {
      totalScrollHeight: document.documentElement.scrollHeight,
      dashHeight: dash ? dash.scrollHeight : 0,
      buttonCount: buttons.length,
      buttonDetails: buttons.map(b => ({
        text: b.innerText.trim().replace(/\n/g, ' '),
        ariaLabel: b.getAttribute('aria-label') || b.title,
        height: b.offsetHeight,
        classes: b.className
      })),
      inputCount: inputs.length,
      svgCount: svgs.length,
      biCount: bootstrapIcons.length
    };
  });

  console.log('📊 Dashboard Metrics Analysis:', JSON.stringify(metrics, null, 2));

  // 3. Test Refresh Button & Rotation
  console.log('🔄 Testing Refresh Button interaction...');
  const refreshBtn = await page.$('.refresh-btn');
  if (refreshBtn) {
    await refreshBtn.click();
    await new Promise(r => setTimeout(r, 250));
    const isSpinning = await page.evaluate(() => {
      const icon = document.querySelector('.refresh-btn i');
      return icon ? icon.classList.contains('spin-refresh') : false;
    });
    console.log(`   Refresh icon has .spin-refresh active during fetch: ${isSpinning}`);
    await new Promise(r => setTimeout(r, 800));
  }

  // 4. Dark Mode Full-Page Capture
  console.log('🌙 Switching to Dark Mode...');
  await page.evaluate(() => {
    document.body.classList.add('dark-theme');
  });
  await new Promise(r => setTimeout(r, 600));
  const destDark = path.join(ARTIFACT_DIR, 'dashboard_phase1_dark.png');
  await page.screenshot({ path: destDark, fullPage: true });
  console.log(`✅ Saved Dark Mode Full-Page: ${destDark}`);

  // 5. Mobile Viewport Capture (390x844 iPhone 14 / Mobile standard)
  console.log('📱 Switching to Mobile Viewport (390px)...');
  await page.evaluate(() => {
    document.body.classList.remove('dark-theme');
  });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.evaluate(() => {
    // If mobile sidebar or backdrop is active, dismiss it
    const dismissBtns = Array.from(document.querySelectorAll('button, .btn, i')).filter(el => {
      const cls = el.className || '';
      return cls.includes('bi-x') || cls.includes('close') || el.innerText === '✕' || el.innerText === '×';
    });
    if (dismissBtns.length > 0) {
      dismissBtns[0].click();
    }
    const sidebar = document.querySelector('aside, .sidebar, .sidebar-container');
    if (sidebar) {
      sidebar.classList.remove('show', 'open', 'active');
      sidebar.style.display = 'none';
    }
    const backdrop = document.querySelector('.sidebar-backdrop, .modal-backdrop');
    if (backdrop) backdrop.remove();
  });
  await new Promise(r => setTimeout(r, 600));
  const destMobile = path.join(ARTIFACT_DIR, 'dashboard_phase1_mobile.png');
  await page.screenshot({ path: destMobile, fullPage: false });
  console.log(`✅ Saved Mobile Viewport: ${destMobile}`);

  await browser.close();
  console.log('🎉 Dashboard Deep QA Completed Successfully!');
}

runDashboardQA().catch(err => {
  console.error('❌ Error during Dashboard QA:', err);
  process.exit(1);
});
