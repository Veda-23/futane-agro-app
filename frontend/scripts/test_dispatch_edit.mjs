import { chromium } from '@playwright/test';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:4300');
  await page.fill('#username', 'SUPER_ADMIN');
  await page.fill('#password', 'superadmin123');
  await page.click('#login-submit-btn');
  await page.waitForSelector('.uat-otp-helper-pill');
  await page.click('.uat-otp-helper-pill');
  await page.click('#otp-verify-submit-btn');
  await page.waitForSelector('.sidebar');

  console.log('Navigating to Dispatch...');
  const dispatchLink = page.locator('a[href*="dispatch"], .nav-item:has-text("Dispatch"), li:has-text("Dispatch")').first();
  await dispatchLink.click();
  await page.waitForSelector('app-dispatch table', { timeout: 10000 });
  await page.waitForTimeout(2000);

  console.log('Checking edit buttons count...');
  const editButtons = page.locator('app-dispatch .btn-row-action.btn-edit');
  const count = await editButtons.count();
  console.log('Edit buttons found:', count);

  console.log('Clicking the first edit button...');
  await editButtons.first().click();
  await page.waitForTimeout(1000);

  const modalOverlayCount = await page.locator('.dispatch-modal-overlay').count();
  console.log('.dispatch-modal-overlay count:', modalOverlayCount);

  const isVisible = modalOverlayCount > 0 ? await page.locator('.dispatch-modal-overlay').isVisible() : false;
  console.log('.dispatch-modal-overlay isVisible:', isVisible);

  if (modalOverlayCount > 0) {
    const box = await page.locator('.dispatch-modal-dialog').boundingBox();
    console.log('.dispatch-modal-dialog boundingBox:', box);
  }

  await page.screenshot({ path: 'c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/dispatch_edit_clicked.png' });
  console.log('Saved screenshot dispatch_edit_clicked.png');

  await browser.close();
}

run().catch(console.error);
