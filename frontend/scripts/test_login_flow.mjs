import { chromium } from '@playwright/test';

async function testFullLogin() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1366, height: 768 });

  page.on('console', msg => console.log('LOG [' + msg.type() + ']: ' + msg.text()));
  page.on('pageerror', err => console.log('PAGE_ERROR:', err.message, err.stack));

  console.log('Navigating to http://localhost:4200...');
  await page.goto('http://localhost:4200', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  console.log('Filling username and password...');
  await page.fill('#username', 'SUPER_ADMIN');
  await page.fill('#password', 'superadmin123');
  await page.click('#login-submit-btn');

  console.log('Waiting for OTP helper pill...');
  await page.waitForSelector('.uat-otp-helper-pill', { timeout: 6000 });

  console.log('Clicking OTP helper pill...');
  await page.click('.uat-otp-helper-pill');
  await new Promise(r => setTimeout(r, 500));

  console.log('Clicking verify submit...');
  await page.click('#otp-verify-submit-btn');

  console.log('Waiting 5s for dashboard...');
  await new Promise(r => setTimeout(r, 5000));

  await page.screenshot({ path: '../scratch/dashboard_page.png' });
  const finalTitle = await page.title();
  console.log('Final Title:', finalTitle);

  const evaluation = await page.evaluate(() => {
    return {
      activeTab: sessionStorage.getItem('activeTab'),
      user: sessionStorage.getItem('user'),
      bodyBg: window.getComputedStyle(document.body).backgroundColor,
      hasDashboard: !!document.querySelector('app-dashboard'),
      hasAppContainer: !!document.querySelector('.app-container'),
      cardCount: document.querySelectorAll('.card, .kpi-card, .table-card').length,
      modals: document.querySelectorAll('.modal.show, .swal2-container').length
    };
  });
  console.log('Dashboard evaluation:', JSON.stringify(evaluation, null, 2));

  await browser.close();
}

testFullLogin().catch(console.error);
