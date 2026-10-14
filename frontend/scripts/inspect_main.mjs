import { chromium } from '@playwright/test';

async function inspectMain() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  
  if (await page.locator('#username').isVisible()) {
    await page.fill('#username', 'SUPER_ADMIN');
    await page.fill('#password', 'superadmin123');
    await page.click('#login-submit-btn');
    await page.waitForTimeout(1000);
    const otp = page.locator('.uat-otp-helper-pill');
    if (await otp.isVisible()) {
      await otp.click();
      await page.waitForTimeout(300);
      await page.click('#otp-verify-submit-btn');
    }
  }

  await page.waitForTimeout(2500);

  console.log('Clicking Payment Registry...');
  await page.locator('.sidebar-nav li:has-text("Payment Registry")').first().click();
  await page.waitForTimeout(2000);

  const dom = await page.evaluate(() => {
    const main = document.querySelector('main.main-content');
    return {
      mainExists: !!main,
      mainHTML: main ? main.innerHTML.slice(0, 1000) : 'none',
      childrenTags: main ? Array.from(main.children).map(c => c.tagName + ' (display: ' + window.getComputedStyle(c).display + ', hidden: ' + c.hidden + ')') : []
    };
  });
  console.log('Main DOM:', dom);

  await browser.close();
}

inspectMain();
