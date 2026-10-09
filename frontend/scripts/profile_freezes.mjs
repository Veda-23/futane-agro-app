import { chromium } from '@playwright/test';

async function profileLongTasks() {
  console.log('=== Profiling Browser Long Tasks & UI Freezes ===');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1366, height: 768 });

  // Expose function to log long tasks from page
  await page.exposeFunction('onLongTaskDetected', (duration, name) => {
    console.log(`[LONG TASK FREEZE] Duration: ${duration.toFixed(1)}ms | Name: ${name}`);
  });

  // Inject PerformanceObserver before any scripts load
  await page.addInitScript(() => {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (window.onLongTaskDetected) {
            window.onLongTaskDetected(entry.duration, entry.name);
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.warn('Long task observer not supported', e);
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('error')) {
      console.log(`[CONSOLE ${msg.type()}]`, msg.text());
    }
  });

  console.log('Navigating to http://localhost:4300...');
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
  await page.waitForTimeout(2000);

  console.log('\n--- Simulating User Moving Mouse & Clicking Tabs ---');

  // 1. Move mouse around randomly (simulating normal user movement)
  console.log('1. Moving mouse across screen (10 moves)...');
  for (let i = 0; i < 10; i++) {
    await page.mouse.move(100 + i * 50, 200 + i * 30);
    await page.waitForTimeout(50);
  }

  // 2. Click through sidebar tabs and measure freeze
  const tabs = ['production', 'inventory', 'sales', 'settings', 'dashboard'];
  for (const tab of tabs) {
    console.log(`\n2. Switching to tab: ${tab}...`);
    const tabItem = page.locator(`.sidebar-nav li:has-text("${tab}")`).first();
    if (await tabItem.isVisible().catch(() => false)) {
      const t0 = Date.now();
      await tabItem.click();
      await page.waitForTimeout(1200);
      console.log(`   Switch to ${tab} took ${Date.now() - t0}ms`);
    } else {
      // try clicking directly
      await page.evaluate((t) => {
        const root = document.querySelector('app-root');
        if (root && window.ng) {
          const comp = window.ng.getComponent(root);
          if (comp && comp.switchTab) comp.switchTab(t);
        }
      }, tab);
      await page.waitForTimeout(1200);
    }

    // Move mouse over content body
    await page.mouse.move(500, 300);
    await page.mouse.move(600, 400);
    await page.waitForTimeout(200);
  }

  // 3. Test typing into a search input on the current page
  console.log('\n3. Testing input typing response...');
  const input = page.locator('input:visible').first();
  if (await input.isVisible().catch(() => false)) {
    const t0 = Date.now();
    await input.focus();
    await input.type('Crate 500', { delay: 40 });
    console.log(`   Typing finished in ${Date.now() - t0}ms`);
  }

  await page.waitForTimeout(1000);
  await browser.close();
  console.log('=== Profiling Completed ===');
}

profileLongTasks().catch(console.error);
