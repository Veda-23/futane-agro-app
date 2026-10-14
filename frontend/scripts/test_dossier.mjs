import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/c6f35e64-605e-4364-8857-ebfa705e7205/modal_fixes';

async function testDossier() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to app...');
  await page.goto('http://localhost:4300', { waitUntil: 'networkidle', timeout: 30000 });

  // Login
  const loginInput = await page.$('input[type="text"], input[name="username"]');
  if (loginInput) {
    await loginInput.fill('admin');
    const pwdInput = await page.$('input[type="password"]');
    if (pwdInput) await pwdInput.fill('admin123');
    const loginBtn = await page.$('button[type="submit"], button.btn-login, button.btn-primary');
    if (loginBtn) await loginBtn.click();
    await page.waitForTimeout(2000);
  }

  // Navigate to Sales
  console.log('Switching to Sales tab...');
  const salesNav = page.locator('app-sidebar li:has-text("Sales"), [data-tab="sales"]').first();
  await salesNav.click();
  await page.waitForTimeout(1500);

  // Click the first .btn-action-view button in Sales table
  console.log('Clicking View Order Dossier button...');
  const viewBtn = page.locator('.btn-action-view').first();
  await viewBtn.waitFor({ state: 'visible', timeout: 10000 });
  await viewBtn.click();
  await page.waitForTimeout(1000);

  // Wait for sales-dossier-dialog
  const dossierDialog = page.locator('.sales-dossier-dialog');
  await dossierDialog.waitFor({ state: 'visible', timeout: 5000 });

  // Measure the logo
  const logo = page.locator('.sales-dossier-dialog .letterhead-logo');
  const box = await logo.boundingBox();
  console.log('Letterhead logo bounding box:', box);

  const screenshotPath = path.join(ARTIFACT_DIR, 'sales_dossier_modal_verified.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Saved screenshot:', screenshotPath);

  await browser.close();
}

testDossier().catch(console.error);
