import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('http://localhost:4300');
  await page.fill('#username', 'SUPER_ADMIN');
  await page.fill('#password', 'superadmin123');
  await page.click('#login-submit-btn');
  await page.waitForTimeout(1000);
  if (await page.locator('.uat-otp-helper-pill').isVisible().catch(() => false)) {
    await page.click('.uat-otp-helper-pill');
    await page.waitForTimeout(300);
    await page.click('button[type="submit"]');
  }
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'scratch_ui.png' });
  console.log('Current URL:', page.url());
  const text = await page.evaluate(() => document.body.innerText);
  console.log('Body text snippet:\n', text.slice(0, 1000));
  await browser.close();
}

main().catch(console.error);
