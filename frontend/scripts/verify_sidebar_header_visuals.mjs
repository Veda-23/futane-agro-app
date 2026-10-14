import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function captureSidebarHeaderVisuals() {
  console.log('Capturing sidebar & header visuals on http://localhost:4300...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });

  // Handle Login if needed
  const needsLogin = await page.locator('#username').isVisible({ timeout: 3000 }).catch(() => false);
  if (needsLogin) {
    console.log('Logging in with SUPER_ADMIN...');
    await page.fill('#username', 'SUPER_ADMIN');
    await page.fill('#password', 'superadmin123');
    await page.click('#login-submit-btn');

    await page.waitForSelector('.uat-otp-helper-pill, .sidebar', { timeout: 8000 }).catch(() => null);
    if (await page.locator('.uat-otp-helper-pill').isVisible().catch(() => false)) {
      console.log('Filling OTP...');
      await page.click('.uat-otp-helper-pill');
      await page.waitForTimeout(400);
      const submitBtn = page.locator('button[type="submit"]');
      if (await submitBtn.isVisible()) await submitBtn.click();
    }
  }

  // Wait for sidebar
  await page.waitForSelector('.sidebar', { timeout: 12000 });
  await page.waitForTimeout(1000);

  const artifactsDir = 'C:\\Users\\Vedant\\.gemini\\antigravity-ide\\brain\\11632c3b-20ad-426d-9d67-efb2946f5152';

  // 1. Capture Dashboard with Sidebar + Header
  console.log('1. Capturing Dashboard tab (Light Mode)...');
  await page.screenshot({ path: path.join(artifactsDir, 'sidebar_header_dashboard_light.png'), fullPage: false });

  // 2. Click Settings & Admin in sidebar (to reproduce user screen)
  console.log('2. Clicking Settings & Admin in sidebar...');
  const settingsItem = page.locator('.nav-menu-list li').filter({ hasText: /Settings/i }).first();
  await settingsItem.click();
  await page.waitForTimeout(1200);

  // If WhatsApp tab inside Settings is available, click it
  const whatsappTab = page.locator('button, .tab-btn, .pill').filter({ hasText: /WhatsApp/i }).first();
  if (await whatsappTab.isVisible().catch(() => false)) {
    await whatsappTab.click();
    await page.waitForTimeout(800);
  }

  console.log('Capturing Settings / WhatsApp tab (Light Mode - exactly user view)...');
  await page.screenshot({ path: path.join(artifactsDir, 'sidebar_header_settings_light.png'), fullPage: false });

  // 3. Switch to Sales tab to test tab animation and active state
  console.log('3. Clicking Sales tab in sidebar...');
  const salesItem = page.locator('.nav-menu-list li').filter({ hasText: /Sales/i }).first();
  await salesItem.click();
  await page.waitForTimeout(1000);
  console.log('Capturing Sales tab...');
  await page.screenshot({ path: path.join(artifactsDir, 'sidebar_header_sales_light.png'), fullPage: false });

  // 4. Toggle Dark Theme
  console.log('4. Toggling Dark Theme...');
  const themeToggle = page.locator('.header-icon-btn i.bi-moon-stars, .header-icon-btn i.bi-sun, button[title*="Theme"], button[aria-label*="Theme"]').first();
  if (await themeToggle.isVisible().catch(() => false)) {
    await themeToggle.click();
    await page.waitForTimeout(1000);
    console.log('Capturing Dark Theme...');
    await page.screenshot({ path: path.join(artifactsDir, 'sidebar_header_dark_mode.png'), fullPage: false });
  }

  await browser.close();
  console.log('Finished visual verification!');
}

captureSidebarHeaderVisuals().catch(console.error);
