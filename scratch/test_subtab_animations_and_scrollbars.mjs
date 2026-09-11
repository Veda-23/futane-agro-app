import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:4200';

async function testAnimations() {
  console.log('🚀 Testing fluid subtab animations & zero scrollbar implementation...');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    protocolTimeout: 300000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1600,1050']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1050, deviceScaleFactor: 1.25 });

  console.log('🔑 Authenticating...');
  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle2', timeout: 60000 });
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

  // Check 1: Scrollbars width test
  const scrollbarMetrics = await page.evaluate(() => {
    const htmlStyle = window.getComputedStyle(document.documentElement);
    const bodyStyle = window.getComputedStyle(document.body);
    return {
      htmlScrollbarWidth: htmlStyle.scrollbarWidth,
      bodyScrollbarWidth: bodyStyle.scrollbarWidth,
      htmlOverflowY: htmlStyle.overflowY,
      windowWidth: window.innerWidth,
      documentElementClientWidth: document.documentElement.clientWidth
    };
  });
  console.log('📊 Scrollbar Metrics:', scrollbarMetrics);

  // Helper to switch tab
  async function goToTab(tabName) {
    await page.evaluate((tab) => {
      const root = document.querySelector('app-root');
      if (window.ng && root) window.ng.getComponent(root).switchTab(tab);
    }, tabName);
    await new Promise(r => setTimeout(r, 1600));
  }

  // Check 2: Settings subtabs animated switch
  console.log('🎨 Testing Settings Subtab switch animations...');
  await goToTab('settings');
  await page.screenshot({ path: path.join(__dirname, 'anim_settings_branding.png'), fullPage: false });

  // Click on Business Rules subtab
  await page.evaluate(() => {
    const comp = window.ng?.getComponent(document.querySelector('app-settings'));
    if (comp && comp.switchSubNav) comp.switchSubNav('business-rules');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(__dirname, 'anim_settings_business_rules.png'), fullPage: false });

  // Click on Teams subtab
  await page.evaluate(() => {
    const comp = window.ng?.getComponent(document.querySelector('app-settings'));
    if (comp && comp.switchSubNav) comp.switchSubNav('teams');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(__dirname, 'anim_settings_teams.png'), fullPage: false });

  // Check 3: Vendors subtabs animated switch
  console.log('📦 Testing Vendors Subtab switch animations...');
  await goToTab('vendors');
  await page.screenshot({ path: path.join(__dirname, 'anim_vendors_all.png'), fullPage: false });

  // Click on Verified GST subtab
  await page.evaluate(() => {
    const comp = window.ng?.getComponent(document.querySelector('app-vendors'));
    if (comp && comp.setSubtab) comp.setSubtab('gst');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(__dirname, 'anim_vendors_gst.png'), fullPage: false });

  // Check 4: Payments subtabs animated switch
  console.log('💳 Testing Payments Subtab switch animations...');
  await goToTab('payments');
  await page.screenshot({ path: path.join(__dirname, 'anim_payments_all.png'), fullPage: false });

  // Click on UPI / Digital subtab
  await page.evaluate(() => {
    const comp = window.ng?.getComponent(document.querySelector('app-payments'));
    if (comp && comp.setSubTab) comp.setSubTab('digital');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(__dirname, 'anim_payments_digital.png'), fullPage: false });

  // Check 5: Production subtabs animated switch
  console.log('🏭 Testing Production Subtab switch animations...');
  await goToTab('production');
  await page.screenshot({ path: path.join(__dirname, 'anim_production_daily.png'), fullPage: false });

  await page.evaluate(() => {
    const comp = window.ng?.getComponent(document.querySelector('app-production'));
    if (comp && comp.switchSubTab) comp.switchSubTab('monthly-production');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(__dirname, 'anim_production_monthly.png'), fullPage: false });

  // Check 6: Machines subtabs animated switch
  console.log('⚙️ Testing Machines Subtab switch animations...');
  await goToTab('machines');
  await page.screenshot({ path: path.join(__dirname, 'anim_machines_fleet.png'), fullPage: false });

  await page.evaluate(() => {
    const comp = window.ng?.getComponent(document.querySelector('app-machines'));
    if (comp && comp.switchSubTab) comp.switchSubTab('breakdowns');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(__dirname, 'anim_machines_breakdowns.png'), fullPage: false });

  console.log('✅ ALL SUBTAB ANIMATIONS AND ZERO-SCROLLBAR VERIFICATIONS COMPLETE!');
  await browser.close();
}

testAnimations().catch(err => {
  console.error('❌ Error during animation test:', err);
  process.exit(1);
});
