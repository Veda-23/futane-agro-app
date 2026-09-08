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

async function runProductionDeepQA() {
  console.log('🚀 Authenticating for Phase 2 Production Deep QA...');
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

  // Click production nav item to ensure clean active tab
  await page.evaluate(() => {
    const prodNav = document.querySelector('.sidebar-nav li[title*="Production"], .sidebar-nav li[aria-label*="Production"]');
    if (prodNav) prodNav.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  console.log('📸 Capturing Desktop Default View (1440x900)...');
  const desktopShot = path.join(ARTIFACT_DIR, 'production_phase2_desktop.png');
  await page.screenshot({ path: desktopShot });

  console.log('📸 Capturing Full-Page Scrollable View...');
  const fullPageShot = path.join(ARTIFACT_DIR, 'production_phase2_fullpage.png');
  await page.screenshot({ path: fullPageShot, fullPage: true });

  // Test opening the Add Production Entry Form
  console.log('⚡ Toggling + Add Production Entry Form...');
  await page.evaluate(() => {
    const addBtn = document.querySelector('.production-page-header button.btn-primary');
    if (addBtn) addBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Type numbers into successful and rejected to verify live batch efficiency meter
  await page.evaluate(() => {
    const successInput = document.querySelector('input[name="ppdSuccessful"]');
    const rejectedInput = document.querySelector('input[name="ppdRejected"]');
    if (successInput && rejectedInput) {
      successInput.value = '1450';
      successInput.dispatchEvent(new Event('input', { bubbles: true }));
      rejectedInput.value = '35';
      rejectedInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 600));

  const formOpenShot = path.join(ARTIFACT_DIR, 'production_phase2_form_open.png');
  await page.screenshot({ path: formOpenShot });

  // Test Filter interaction
  console.log('⚡ Testing Crate Type filter & Shift filter...');
  await page.evaluate(() => {
    const crateSelect = document.querySelector('.toolbar-filter-select select');
    if (crateSelect) {
      crateSelect.value = 'Apple Crate';
      crateSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 600));
  const filteredShot = path.join(ARTIFACT_DIR, 'production_phase2_filtered.png');
  await page.screenshot({ path: filteredShot });

  // Reset filter
  await page.evaluate(() => {
    const resetBtn = document.querySelector('.btn-filter-reset');
    if (resetBtn) resetBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Switch to Monthly Summary subtab
  console.log('⚡ Testing subtab switch to Monthly Summary (PPM)...');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.subnav-tab-btn'));
    const ppmTab = tabs.find(t => t.innerText.includes('Monthly'));
    if (ppmTab) ppmTab.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  const monthlyShot = path.join(ARTIFACT_DIR, 'production_phase2_monthly_subtab.png');
  await page.screenshot({ path: monthlyShot });

  // Switch back to Daily Production
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.subnav-tab-btn'));
    const ppdTab = tabs.find(t => t.innerText.includes('Daily'));
    if (ppdTab) ppdTab.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Test Dark Mode
  console.log('🌙 Testing Dark Mode...');
  await page.evaluate(() => {
    const themeBtn = document.querySelector('.header-icon-btn[title*="Theme"]');
    if (themeBtn) themeBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  const darkShot = path.join(ARTIFACT_DIR, 'production_phase2_dark.png');
  await page.screenshot({ path: darkShot, fullPage: true });

  // Switch back to Light Mode
  await page.evaluate(() => {
    const themeBtn = document.querySelector('.header-icon-btn[title*="Theme"]');
    if (themeBtn) themeBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Test Mobile Viewport (390x844)
  console.log('📱 Testing Mobile Viewport (390px iPhone 14)...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await new Promise(r => setTimeout(r, 1000));
  const mobileShot = path.join(ARTIFACT_DIR, 'production_phase2_mobile.png');
  await page.screenshot({ path: mobileShot, fullPage: true });

  // Button Audit Report
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  const auditReport = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button')).map((b, i) => ({
      index: i + 1,
      text: b.innerText.trim().replace(/\n/g, ' ') || '(Icon Button)',
      title: b.getAttribute('title') || '',
      ariaLabel: b.getAttribute('aria-label') || '',
      className: b.className,
      icon: b.querySelector('i')?.className || '',
      width: b.offsetWidth,
      height: b.offsetHeight,
      disabled: b.disabled
    }));
    return {
      totalButtons: buttons.length,
      buttons,
      pageScrollHeight: document.documentElement.scrollHeight
    };
  });

  console.log('====================================================');
  console.log(`✅ Phase 2 Deep QA Complete!`);
  console.log(`- Total Audited Buttons: ${auditReport.totalButtons}`);
  console.log(`- Total Scroll Height: ${auditReport.pageScrollHeight}px`);
  console.log('====================================================');

  fs.writeFileSync(path.join(ARTIFACT_DIR, 'scratch', 'phase2_production_button_audit.json'), JSON.stringify(auditReport, null, 2));

  await browser.close();
}

runProductionDeepQA().catch(console.error);
