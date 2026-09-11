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

  console.log('🔑 Authenticating...');
  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    if (inputs[0]) {
      inputs[0].value = 'SUPER_ADMIN';
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (inputs[1]) {
      inputs[1].value = 'superadmin123';
      inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
    }
    const btn = document.querySelector('button[type="submit"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Login') || b.textContent.includes('Sign In'));
    if (btn) btn.click();
  });

  await new Promise(r => setTimeout(r, 2000));

  try {
    await page.waitForSelector('.uat-otp-helper-card, .app-container', { timeout: 8000 });
  } catch (e) {}

  const otpCard = await page.$('.uat-otp-helper-card');
  if (otpCard) {
    console.log('   Passing 2-Factor OTP verification...');
    await otpCard.click();
    await new Promise(r => setTimeout(r, 600));
    await page.evaluate(() => {
      const loginComp = window.ng?.getComponent(document.querySelector('app-login'));
      if (loginComp && loginComp.verifyOtp) {
        loginComp.verifyOtp();
      } else {
        const btn = document.querySelector('button[type="submit"].enterprise-primary-btn, .action-form-panel form button[type="submit"]');
        if (btn) btn.click();
      }
    });
    await new Promise(r => setTimeout(r, 3000));
  }

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
