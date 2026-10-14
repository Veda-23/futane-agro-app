import { chromium } from '@playwright/test';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:4300');
  await page.fill('#username', 'SUPER_ADMIN');
  await page.fill('#password', 'superadmin123');
  await page.click('#login-submit-btn');
  await page.waitForSelector('.uat-otp-helper-pill');
  await page.click('.uat-otp-helper-pill');
  await page.click('#otp-verify-submit-btn');
  await page.waitForSelector('.sidebar');
  
  // Click Production nav in sidebar
  const prodLink = page.locator('a[href*="production"], .nav-item:has-text("Production"), li:has-text("Production")').first();
  await prodLink.click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'scratch/production_page.png' });
  console.log('Production URL:', page.url());
  
  const buttons = await page.locator('button').evaluateAll(els => els.map(e => ({ cls: e.className, title: e.title, text: e.innerText })));
  console.log('Buttons sample:', buttons.filter(b => b.title || b.cls.includes('action') || b.cls.includes('view') || b.cls.includes('btn')));
  
  await browser.close();
}

run().catch(console.error);
