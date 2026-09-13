const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e';

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:4200');
  await page.waitForTimeout(2000);

  const userInp = await page.$('input[placeholder*="Username" i], input[type="text"]');
  if (userInp && await userInp.isVisible()) {
    await page.fill('input[placeholder*="Username" i], input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"], button:has-text("Sign In")');
    await page.waitForTimeout(1500);

    const fill2fa = await page.$('text=CLICK TO FILL');
    if (fill2fa) {
      await fill2fa.click();
      await page.waitForTimeout(500);
      await page.click('button:has-text("Verify")');
      await page.waitForTimeout(2500);
    }
  }

  // Navigate to Reports
  const reportsNav = await page.$('.nav-menu-list li:has-text("Reports"), a:has-text("Reports")');
  if (reportsNav) {
    await reportsNav.click();
    await page.waitForTimeout(2000);
  }

  // 1. Scroll down to see table
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'reports_table_before.png') });

  // 2. Select "Sales & Revenue" report
  await page.selectOption('select[name="repType"]', 'sales');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'reports_sales_before.png') });

  // 3. Dark mode
  const themeBtn = await page.$('#themeToggleBtn, .theme-toggle-btn');
  if (themeBtn) {
    await themeBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'reports_dark_before.png') });
  }

  await browser.close();
  console.log('Captured table, sales, and dark mode screenshots!');
}

capture().catch(console.error);
