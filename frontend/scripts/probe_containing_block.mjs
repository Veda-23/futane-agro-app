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
  
  const chain = await page.evaluate(() => {
    let el = document.querySelector('.modal-backdrop');
    const path = [];
    while (el) {
      const s = window.getComputedStyle(el);
      path.push({
        tag: el.tagName,
        class: el.className,
        position: s.position,
        transform: s.transform,
        filter: s.filter,
        backdropFilter: s.backdropFilter,
        perspective: s.perspective,
        contain: s.contain,
        willChange: s.willChange
      });
      el = el.parentElement;
    }
    return path;
  });
  console.log('CONTAINING CHAIN:', JSON.stringify(chain, null, 2));
  await browser.close();
}

probe().catch(console.error);
