import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Vedant\\.gemini\\antigravity-ide\\brain\\c1c6338c-1671-4e87-b480-7a9ae9928b58';
const BASE_URL = 'http://localhost:8081';

const tabId = process.argv[2] || 'employees';
const outFileName = process.argv[3] || 'tab_10_employees.png';

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

async function capture() {
  const userSession = await getAuthToken();

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1500,1000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 1000, deviceScaleFactor: 1.5 });

  console.log(`Loading Futane Agro ERP at ${BASE_URL} & Injecting Session...`);
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

  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
  await page.waitForSelector('.app-container', { timeout: 15000 });

  console.log(`Switching Tab -> ${tabId}...`);
  await page.evaluate((tabKey) => {
    try {
      const root = document.querySelector('app-root');
      if (window.ng && root) {
        const comp = window.ng.getComponent(root);
        if (comp && comp.switchTab) {
          comp.switchTab(tabKey);
          return;
        }
      }
    } catch (e) {}

    const cleanKey = tabKey.toLowerCase();
    const cleanNoPlural = cleanKey.endsWith('s') ? cleanKey.slice(0, -1) : cleanKey;
    const links = Array.from(document.querySelectorAll('app-sidebar .nav-item, app-sidebar button, app-sidebar a, .nav-link, app-sidebar li'));
    const target = links.find(l => {
      const text = l.textContent.toLowerCase();
      return text.includes(cleanKey.replace('-', ' ')) || text.includes(cleanKey) || text.includes(cleanNoPlural);
    });
    if (target) target.click();
  }, tabId);

  await new Promise(r => setTimeout(r, 1800));

  const outPathArtifact = path.join(ARTIFACT_DIR, outFileName);
  const outPathLocal = path.join(process.cwd(), 'scratch', outFileName);

  await page.screenshot({ path: outPathArtifact, fullPage: false });
  await page.screenshot({ path: outPathLocal, fullPage: false });
  console.log(`✅ Saved screenshot to: ${outPathArtifact}`);

  await browser.close();
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
