const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e';
const BASE_URL = 'http://localhost:4200';

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log(`Navigating to ${BASE_URL}...`);
  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch (e) {
    console.log(`Port 4200 not reachable, trying 8081...`);
    await page.goto('http://localhost:8081', { waitUntil: 'domcontentloaded', timeout: 15000 });
  }

  await page.waitForTimeout(2000);

  // Check login
  const usernameInput = await page.$('input[placeholder*="Username" i], input[type="text"]');
  if (usernameInput) {
    const isVisible = await usernameInput.isVisible();
    if (isVisible) {
      console.log('Logging in...');
      await page.fill('input[placeholder*="Username" i], input[type="text"]', 'admin');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
      await page.waitForTimeout(2000);

      // Handle 2FA if present
      const fill2faBtn = await page.$('text=CLICK TO FILL');
      if (fill2faBtn) {
        console.log('Completing 2FA...');
        await fill2faBtn.click();
        await page.waitForTimeout(500);
        await page.click('button:has-text("Verify & Enter Portal")');
        await page.waitForTimeout(2500);
      }
    }
  }

  // Double check if still on 2FA
  const fill2faBtnAfter = await page.$('text=CLICK TO FILL');
  if (fill2faBtnAfter) {
    console.log('Completing 2FA (after check)...');
    await fill2faBtnAfter.click();
    await page.waitForTimeout(500);
    await page.click('button:has-text("Verify & Enter Portal")');
    await page.waitForTimeout(2500);
  }

  // 1. Dashboard Desktop 1440px (Light Theme)
  console.log('Capturing foundation_01_dashboard_1440px.png...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'foundation_01_dashboard_1440px.png') });

  // 2. Tab Navigation & Header Stability (Switching to Invoices or Sales)
  const salesNavItem = await page.$('.nav-menu-list li:has-text("Sales"), .sidebar-nav li:has-text("Sales")');
  if (salesNavItem) {
    console.log('Navigating to Sales...');
    await salesNavItem.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'foundation_02_sales_table_light.png') });
  }

  // 3. Dark Mode Toggle
  console.log('Testing Dark Mode Toggle...');
  const themeToggle = await page.$('#themeToggleBtn, .theme-toggle-btn, button[title*="Theme" i], button[title*="Mode" i]');
  if (themeToggle) {
    await themeToggle.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'foundation_03_dark_mode_table.png') });
    console.log('Captured foundation_03_dark_mode_table.png');
  }

  // 4. Responsive Viewports: Tablet (1024px)
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'foundation_04_tablet_1024px.png') });
  console.log('Captured foundation_04_tablet_1024px.png');

  // 5. Responsive Viewports: Mobile (390px)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'foundation_05_mobile_390px.png') });
  console.log('Captured foundation_05_mobile_390px.png');

  await browser.close();
  console.log('Enterprise Foundation UI audit complete!');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
