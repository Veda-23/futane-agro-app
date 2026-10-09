import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1366, height: 768 });

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('error') || msg.text().includes('Error')) {
      console.log(`[CONSOLE ${msg.type().toUpperCase()}]`, msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('[PAGE ERROR]', err.message);
  });

  page.on('response', res => {
    if (res.status() >= 400) {
      console.log(`[HTTP ${res.status()}]`, res.url());
    }
  });

  console.log('Navigating and logging in...');
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

  // Test routes
  const routes = [
    '/production',
    '/inventory',
    '/machines',
    '/raw-materials',
    '/vendors',
    '/sales',
    '/dispatch',
    '/payments',
    '/invoices',
    '/billing',
    '/expenses',
    '/salaries',
    '/employees',
    '/reports',
    '/settings'
  ];

  for (const route of routes) {
    console.log(`\n--- Testing Route: ${route} ---`);
    const start = Date.now();
    try {
      await page.goto(`http://localhost:4300${route}`, { timeout: 10000 });
      await page.waitForTimeout(1000);
      const loadTime = Date.now() - start;
      console.log(`Loaded ${route} in ${loadTime}ms.`);

      // Find any buttons or inputs on page
      const buttons = await page.locator('button:visible').all();
      console.log(`Found ${buttons.length} visible buttons on ${route}.`);

      // Try interacting with first 3 non-destructive buttons
      for (let b = 0; b < Math.min(buttons.length, 3); b++) {
        const btnText = (await buttons[b].innerText().catch(() => '')).trim();
        if (btnText && !btnText.match(/delete|trash|remove|logout/i)) {
          const clickStart = Date.now();
          await buttons[b].click({ timeout: 3000 }).catch(e => console.log(`Click timed out on [${btnText}]:`, e.message));
          await page.waitForTimeout(500);
          console.log(`  Clicked button [${btnText}] (${Date.now() - clickStart}ms)`);
        }
      }

      // Try typing in search input if exists
      const searchInput = page.locator('input[type="text"], input[type="search"]').first();
      if (await searchInput.isVisible().catch(() => false)) {
        const searchStart = Date.now();
        await searchInput.fill('test');
        await page.waitForTimeout(400);
        await searchInput.fill('');
        console.log(`  Tested search input typing (${Date.now() - searchStart}ms)`);
      }

    } catch (e) {
      console.log(`FAILED route ${route}:`, e.message);
    }
  }

  console.log('\n--- Test Completed ---');
  await browser.close();
}

main().catch(console.error);
