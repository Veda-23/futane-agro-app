import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function test() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto('http://localhost:4200/#/login', { waitUntil: 'networkidle2' });

  await page.evaluate(() => {
    document.querySelectorAll('input')[0].value = 'SUPER_ADMIN';
    document.querySelectorAll('input')[0].dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelectorAll('input')[1].value = 'superadmin123';
    document.querySelectorAll('input')[1].dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('button[type="submit"]').click();
  });

  await page.waitForSelector('.uat-otp-helper-card', { timeout: 10000 });
  await page.click('.uat-otp-helper-card');
  await page.click('button[type="submit"]');
  await page.waitForSelector('.app-container', { timeout: 15000 });

  console.log('Navigating to analytics...');
  const res = await page.evaluate((key) => {
    const lis = Array.from(document.querySelectorAll('.sidebar-nav li'));
    const target = lis.find(li => {
      const aria = (li.getAttribute('aria-label') || '').toLowerCase();
      const title = (li.getAttribute('title') || '').toLowerCase();
      const text = (li.textContent || '').toLowerCase().trim();
      const k = key.toLowerCase().replace('-', '');
      return aria.includes(k) || title.includes(k) || text.replace(/\s+/g, '').includes(k);
    });
    if (target) {
      target.click();
      return { clicked: true, text: target.textContent.trim() };
    }
    return { clicked: false };
  }, 'analytics');

  console.log('Navigation result:', res);
  await new Promise(r => setTimeout(r, 2000));

  const hasAnalytics = await page.$('app-analytics');
  console.log('app-analytics in DOM:', !!hasAnalytics);

  await page.screenshot({ path: 'scratch/analytics_real_page.png' });
  console.log('Saved scratch/analytics_real_page.png');

  await browser.close();
}

test().catch(console.error);
