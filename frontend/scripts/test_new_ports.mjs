import { chromium } from '@playwright/test';

async function testPort(port, name) {
  console.log(`\n========================================`);
  console.log(`Testing ${name} at http://localhost:${port}...`);
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1366, height: 768 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  const start = Date.now();
  await page.goto(`http://localhost:${port}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const domTime = Date.now() - start;
  console.log(`[${name}] DOM content loaded in: ${domTime}ms`);

  await page.waitForTimeout(1000);
  const title = await page.title();
  const currentUrl = page.url();
  const bodyText = await page.locator('body').innerText();
  const hasContent = bodyText.length > 50;
  
  console.log(`[${name}] Title: ${title}`);
  console.log(`[${name}] Current URL: ${currentUrl}`);
  console.log(`[${name}] Body text length: ${bodyText.length} chars`);
  console.log(`[${name}] Rendered successfully: ${hasContent}`);
  if (errors.length > 0) {
    console.log(`[${name}] Errors (${errors.length}):`, errors.slice(0, 3));
  } else {
    console.log(`[${name}] Zero errors!`);
  }

  await browser.close();
}

async function run() {
  await testPort(4300, 'UAT Portal');
  await testPort(4301, 'PROD Portal');
}

run().catch(console.error);
