import { chromium } from '@playwright/test';
import path from 'path';

async function testScreen() {
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

  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.resolve('scratch/after_login_state.png') });
  console.log('Saved scratch/after_login_state.png');
  
  const content = await page.evaluate(() => {
    return {
      url: window.location.href,
      activeTab: (window.ng?.getComponent(document.querySelector('app-root')) || {}).activeTab,
      bodyClasses: document.body.className,
      sidebarVisible: !!document.querySelector('.sidebar'),
      sidebarClosed: document.body.classList.contains('sidebar-closed')
    };
  });
  console.log('State:', content);

  await browser.close();
}

testScreen();
