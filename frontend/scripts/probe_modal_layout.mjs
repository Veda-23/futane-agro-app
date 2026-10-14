import { chromium } from '@playwright/test';

async function probe() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:4300');
  await page.waitForTimeout(1000);
  const loginInput = page.locator('#username');
  if (await loginInput.isVisible().catch(() => false)) {
    await page.fill('#username', 'SUPER_ADMIN');
    await page.fill('#password', 'superadmin123');
    await page.click('#login-submit-btn');
    await page.waitForSelector('.uat-otp-helper-pill, .sidebar', { timeout: 25000 });
    if (await page.locator('.uat-otp-helper-pill').isVisible().catch(() => false)) {
      await page.click('.uat-otp-helper-pill');
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Verify"), button[type="submit"]').first().click();
    }
  }
  await page.waitForSelector('.sidebar', { timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.locator('.nav-menu-list li:has-text("Settings"), a:has-text("Settings")').first().click();
  await page.waitForSelector('app-settings', { timeout: 15000 });
  await page.waitForTimeout(1000);
  
  await page.locator('#subtab-business-rules').click();
  await page.waitForTimeout(600);
  await page.locator('button:has-text("Add Company"), button:has-text("Add Entity")').first().click();
  await page.waitForTimeout(600);
  
  const backdropInfo = await page.evaluate(() => {
    const bd = document.querySelector('.modal-backdrop');
    const mc = document.querySelector('.modal-content');
    if (!bd || !mc) return null;
    const bdRect = bd.getBoundingClientRect();
    const mcRect = mc.getBoundingClientRect();
    const bdStyle = window.getComputedStyle(bd);
    return {
      bdRect: { x: bdRect.x, y: bdRect.y, width: bdRect.width, height: bdRect.height },
      mcRect: { x: mcRect.x, y: mcRect.y, width: mcRect.width, height: mcRect.height },
      paddingLeft: bdStyle.paddingLeft,
      paddingRight: bdStyle.paddingRight,
      offsetParent: bd.offsetParent ? bd.offsetParent.tagName + '.' + bd.offsetParent.className : 'null'
    };
  });
  console.log('MEASURED INFO:', JSON.stringify(backdropInfo, null, 2));
  await browser.close();
}

probe().catch(console.error);
