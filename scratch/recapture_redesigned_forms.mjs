import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:4200';
const SNAP_DIR = path.join(__dirname, 'comprehensive_snapshots');

async function recapture() {
  console.log('🚀 Recapturing updated dense enterprise forms...');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1600,1050']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1050, deviceScaleFactor: 1.25 });

  console.log('🔑 Authenticating with mock admin session...');
  await page.goto(`${BASE_URL}`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const mockUser = {
      id: 1,
      username: 'SUPER_ADMIN',
      name: 'Super Administrator',
      role: 'SUPER_ADMIN',
      email: 'admin@futaneagro.com'
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    localStorage.setItem('jwtToken', 'mock-token');
    localStorage.setItem('auth_token', 'mock-token');
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('theme', 'light');
    document.body.classList.remove('dark-theme');
  });

  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('.app-container', { timeout: 15000 });
  console.log('🎉 Logged in!');

  // Helper to switch tab
  async function goToTab(tabName) {
    await page.evaluate((tab) => {
      const root = document.querySelector('app-root');
      if (window.ng && root) window.ng.getComponent(root).switchTab(tab);
    }, tabName);
    await new Promise(r => setTimeout(r, 1800));
  }

  // 1. Parties
  console.log('📸 1. Parties Add Form...');
  await goToTab('parties');
  await page.evaluate(() => {
    const comp = window.ng?.getComponent(document.querySelector('app-party'));
    if (comp && !comp.isFormVisible) comp.toggleFormVisibility();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SNAP_DIR, 'snap_013_parties_add_form.png'), fullPage: false });
  await page.screenshot({ path: path.join(SNAP_DIR, 'snap_011_parties_full.png'), fullPage: true });

  // 2. Sales
  console.log('📸 2. Sales Add Form...');
  await goToTab('sales');
  await page.evaluate(() => {
    const comp = window.ng?.getComponent(document.querySelector('app-sales'));
    if (comp && !comp.isFormVisible) comp.toggleFormVisibility();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SNAP_DIR, 'snap_016_sales_add_form.png'), fullPage: false });
  await page.screenshot({ path: path.join(SNAP_DIR, 'snap_014_sales_full.png'), fullPage: true });

  // 3. Payments
  console.log('📸 3. Payments Add Form...');
  await goToTab('payments');
  await page.evaluate(() => {
    const comp = window.ng?.getComponent(document.querySelector('app-payments'));
    if (comp && !comp.isFormVisible) comp.toggleFormVisibility();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SNAP_DIR, 'snap_019_payments_add_form.png'), fullPage: false });
  await page.screenshot({ path: path.join(SNAP_DIR, 'snap_017_payments_full.png'), fullPage: true });

  // 4. Vendors
  console.log('📸 4. Vendors Add Form...');
  await goToTab('vendors');
  await page.evaluate(() => {
    const comp = window.ng?.getComponent(document.querySelector('app-vendors'));
    if (comp && !comp.isAddFormOpen) comp.toggleAddForm();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SNAP_DIR, 'snap_028_vendors_add_form.png'), fullPage: false });
  await page.screenshot({ path: path.join(SNAP_DIR, 'snap_026_vendors_full.png'), fullPage: true });

  console.log('✅ Recapture complete! All 4 forms saved with fresh enterprise dense layout.');
  await browser.close();
}

recapture().catch(err => {
  console.error('❌ Error during recapture:', err);
  process.exit(1);
});
