import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('../frontend/node_modules/playwright');
import http from 'http';

function httpPost(urlPath, body) {
  return new Promise((resolve, reject) => {
    const dataStr = JSON.stringify(body);
    const req = http.request(`http://127.0.0.1:4300${urlPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataStr)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(dataStr);
    req.end();
  });
}

async function main() {
  const l1 = await httpPost('/api/users/login', { username: 'SUPER_ADMIN', password: 'superadmin123' });
  const auth = await httpPost('/api/users/login/verify', { username: l1.username, otp: l1.tempOtp });
  console.log('Real Auth acquired:', auth.username);

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

  await page.goto('http://127.0.0.1:4300');
  await page.evaluate((a) => {
    localStorage.setItem('user', JSON.stringify(a));
    localStorage.setItem('jwtToken', a.token);
    sessionStorage.setItem('user', JSON.stringify(a));
    sessionStorage.setItem('jwtToken', a.token);
    document.cookie = `erp_session_cookie=${a.token}; path=/; SameSite=Strict`;
  }, auth);

  await page.goto('http://127.0.0.1:4300');
  await page.waitForTimeout(2000);

  const currentTab = await page.evaluate(() => {
    const active = document.querySelector('.sidebar li.active');
    return active ? active.getAttribute('data-tab') : 'none';
  });
  console.log('Initial Active Tab:', currentTab);

  // Click on Sales
  await page.click('li[data-tab="sales"]');
  await page.waitForTimeout(1000);
  const afterSales = await page.evaluate(() => {
    const active = document.querySelector('.sidebar li.active');
    return active ? active.getAttribute('data-tab') : 'none';
  });
  console.log('Active Tab after click sales:', afterSales);

  // Click on Inventory
  await page.click('li[data-tab="inventory"]');
  await page.waitForTimeout(1000);
  const afterInventory = await page.evaluate(() => {
    const active = document.querySelector('.sidebar li.active');
    return active ? active.getAttribute('data-tab') : 'none';
  });
  console.log('Active Tab after click inventory:', afterInventory);

  await browser.close();
}

main().catch(console.error);
