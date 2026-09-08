import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Vedant\\.gemini\\antigravity-ide\\brain\\c1c6338c-1671-4e87-b480-7a9ae9928b58';
const BASE_URL = 'http://localhost:8081';

async function run() {
  const loginRes = await fetch(`${BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'SUPER_ADMIN', password: 'superadmin123' })
  }).then(r => r.json());

  let userObj;
  if (loginRes.status === 'OTP_REQUIRED' || loginRes.status === 'OTP_SENT') {
    const otp = loginRes.tempOtp || '654321';
    userObj = await fetch(`${BASE_URL}/api/users/login/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'SUPER_ADMIN', otp: otp })
    }).then(r => r.json());
  } else {
    userObj = loginRes;
  }

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1500,1000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 1000, deviceScaleFactor: 1.5 });

  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((user, baseUrl) => {
    localStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('user', JSON.stringify(user));
    if (user.token) {
      localStorage.setItem('jwtToken', user.token);
      sessionStorage.setItem('jwtToken', user.token);
    }
    sessionStorage.setItem('activeTab', 'dashboard');
    window.location.href = `${baseUrl}/`;
  }, userObj, BASE_URL);

  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
  await page.waitForSelector('.command-center-header', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 2500));

  const outPath1 = path.join(ARTIFACT_DIR, 'tab_01_dashboard.png');
  const outPath2 = path.join(ARTIFACT_DIR, '01_dashboard.png');
  await page.screenshot({ path: outPath1 });
  await page.screenshot({ path: outPath2 });
  console.log('✅ Captured live populated Dashboard V2 screenshot!');
  await browser.close();
}

run().catch(console.error);
