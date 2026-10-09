import { chromium } from '@playwright/test';

async function testWithStorage() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('LOG [' + msg.type() + ']: ' + msg.text()));
  page.on('pageerror', err => console.log('PAGE_ERROR:', err.message, err.stack));

  // Set up localStorage beforehand
  await page.addInitScript(() => {
    localStorage.setItem('user', JSON.stringify({
      username: 'SUPER_ADMIN',
      role: 'SUPER_ADMIN',
      name: 'Super Administrator'
    }));
    // Stale token that expired
    localStorage.setItem('jwtToken', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJTVVBFUl9BRE1JTiIsImV4cCI6MTcwMDAwMDAwMH0.fake');
    localStorage.setItem('activeTab', 'inventory');
  });

  console.log('Navigating with pre-existing stale session in localStorage...');
  await page.goto('http://localhost:4200', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3000));

  await page.screenshot({ path: '../scratch/test_stale_storage.png' });
  const title = await page.title();
  console.log('Title with stale storage:', title);
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Body text length:', bodyText.length);

  await browser.close();
}

testWithStorage().catch(console.error);
