import { chromium } from '@playwright/test';

async function main() {
  console.log('Testing real user clicking on sidebar items...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1366, height: 768 });

  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}]`, msg.text());
  });

  page.on('pageerror', err => {
    console.log('[PAGE ERROR]', err.message, err.stack);
  });

  page.on('response', res => {
    if (res.status() >= 400) {
      console.log(`[HTTP ${res.status()}]`, res.url());
    }
  });

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
  await page.waitForTimeout(3000);

  // Get all sidebar menu items
  const menuItems = await page.locator('.sidebar-nav li').all();
  console.log(`Found ${menuItems.length} sidebar items.`);

  for (let i = 0; i < menuItems.length; i++) {
    const item = menuItems[i];
    const text = (await item.innerText().catch(() => '')).trim();
    console.log(`\n--- Clicking [${i}]: "${text}" ---`);
    const t0 = Date.now();
    await item.click();
    await page.waitForTimeout(1500);
    console.log(`-> Click finished in ${Date.now() - t0}ms.`);

    // Check if body is responsive by evaluating something in page context
    const responsiveCheck = await page.evaluate(() => {
      return {
        activeElement: document.activeElement?.tagName,
        title: document.title,
        scrollHeight: document.body.scrollHeight
      };
    }).catch(e => ({ error: e.message }));
    console.log('   Responsiveness:', JSON.stringify(responsiveCheck));
  }

  await browser.close();
}

main().catch(console.error);
