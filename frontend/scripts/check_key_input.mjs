import { chromium } from '@playwright/test';

async function check() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:4300');
  await page.fill('#username', 'SUPER_ADMIN');
  await page.fill('#password', 'superadmin123');
  await page.click('#login-submit-btn');
  await page.waitForSelector('.uat-otp-helper-pill, .sidebar');
  if (await page.locator('.uat-otp-helper-pill').isVisible().catch(() => false)) {
    await page.click('.uat-otp-helper-pill');
    await page.click('button[type="submit"]');
  }
  await page.waitForSelector('.sidebar');
  await page.locator('.nav-menu-list li:has-text("Settings")').click();
  await page.waitForSelector('app-settings');
  await page.locator('button:has-text("Extensible Fields")').click();
  await page.waitForTimeout(600);
  await page.locator('.cf-action-btn:has-text("Edit")').first().click();
  await page.waitForSelector('.cf-modal-dialog');
  const info = await page.evaluate(() => {
    const el = document.querySelector('.cf-key-input');
    const matchedRules = [];
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText && el.matches(rule.selectorText) && rule.style && rule.style.paddingLeft) {
            matchedRules.push({
              selector: rule.selectorText,
              paddingLeft: rule.style.paddingLeft,
              padding: rule.style.padding
            });
          }
        }
      } catch (e) {}
    }
    return {
      matchedRules,
      computedPaddingLeft: window.getComputedStyle(el).paddingLeft
    };
  });
  console.log('CF Key Input Rules:', JSON.stringify(info, null, 2));
  await browser.close();
}

check().catch(console.error);
