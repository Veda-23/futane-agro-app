const { chromium } = require('playwright');
const path = require('path');

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  const usernameInput = await page.$('input[type="text"], input[name="username"]');
  if (usernameInput) {
    await page.fill('input[type="text"], input[name="username"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4500);
  }

  // Click Sync Data to ensure full refresh animation fires
  const syncBtn = await page.$('.command-center-header button:has-text("Sync Data")');
  if (syncBtn) {
    await syncBtn.click();
    await page.waitForTimeout(1500);
  }

  await page.screenshot({ path: 'C:/Users/Vedant/.gemini/antigravity-ide/brain/c1c6338c-1671-4e87-b480-7a9ae9928b58/tab_01_dashboard.png' });
  await page.screenshot({ path: 'C:/Users/Vedant/.gemini/antigravity-ide/brain/c1c6338c-1671-4e87-b480-7a9ae9928b58/01_dashboard.png' });
  console.log('Successfully captured populated Dashboard V2 screenshot!');
  await browser.close();
}
capture().catch(console.error);
