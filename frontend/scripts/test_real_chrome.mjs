import { chromium } from '@playwright/test';

async function testRealChrome() {
  console.log('Launching REAL Google Chrome...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1366, height: 768 });

  const logs = [];
  const errors = [];
  const failedRequests = [];

  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') errors.push(msg.text());
  });

  page.on('pageerror', err => {
    errors.push(`PAGE_ERR: ${err.message}\n${err.stack}`);
  });

  page.on('requestfailed', req => {
    failedRequests.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
  });

  console.log('Navigating to http://localhost:4200 in real Chrome...');
  const start = Date.now();
  try {
    await page.goto('http://localhost:4200', { waitUntil: 'load', timeout: 15000 });
  } catch (err) {
    console.log('Navigation error/timeout:', err.message);
  }
  const loadTime = Date.now() - start;
  console.log(`Page load finished in ${loadTime}ms`);

  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: '../scratch/real_chrome_result.png' });

  const pageInfo = await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    return {
      title: document.title,
      readyState: document.readyState,
      appRootHtmlLength: appRoot ? appRoot.innerHTML.length : 0,
      appRootChildren: appRoot ? appRoot.children.length : 0,
      bodyTextSnippet: document.body.innerText.slice(0, 200),
      bodyBgColor: window.getComputedStyle(document.body).backgroundColor
    };
  });

  console.log('Page info:', JSON.stringify(pageInfo, null, 2));
  console.log('Errors count:', errors.length);
  if (errors.length > 0) console.log('Errors:', errors);
  console.log('Failed requests count:', failedRequests.length);
  if (failedRequests.length > 0) console.log('Failed requests:', failedRequests);
  console.log('Total console logs:', logs.length);
  console.log('Console logs sample:', logs.slice(0, 10));

  await browser.close();
}

testRealChrome().catch(console.error);
