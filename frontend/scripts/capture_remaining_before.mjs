import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BRAIN_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/bcf88ada-31d6-4941-94ae-1b3daf5a2f4d/popcards_before';
const SCRATCH_DIR = 'c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/popcards_before';

async function saveScreenshots(page, name) {
  const p1 = path.join(BRAIN_DIR, `${name}.png`);
  const p2 = path.join(SCRATCH_DIR, `${name}.png`);
  await page.screenshot({ path: p1 });
  await page.screenshot({ path: p2 });
  console.log(`[SNAPSHOT] Saved: ${name}.png`);
}

async function runRemaining() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const loginInput = page.locator('#username');
  if (await loginInput.isVisible().catch(() => false)) {
    await page.fill('#username', 'SUPER_ADMIN');
    await page.fill('#password', 'superadmin123');
    await page.click('#login-submit-btn');
    await page.waitForSelector('.uat-otp-helper-pill, .sidebar', { timeout: 25000 });
    if (await page.locator('.uat-otp-helper-pill').isVisible().catch(() => false)) {
      await page.click('.uat-otp-helper-pill');
      await page.waitForTimeout(600);
      await page.locator('button:has-text("Verify"), button[type="submit"]').first().click();
    }
  }

  await page.waitForSelector('.sidebar', { timeout: 20000 });
  await page.waitForTimeout(800);

  const settingsNav = page.locator('.nav-menu-list li:has-text("Settings"), .nav-item:has-text("Settings"), a:has-text("Settings")');
  await settingsNav.first().click();
  await page.waitForSelector('app-settings', { timeout: 15000 });
  await page.waitForTimeout(800);

  // 1. Custom fields:
  console.log('Capturing custom field modal...');
  await page.locator('#subtab-custom-fields').click();
  await page.waitForTimeout(700);
  const addFieldBtn = page.locator('button:has-text("Add Dynamic Field")').first();
  if (await addFieldBtn.isVisible().catch(() => false)) {
    await addFieldBtn.click();
    await page.waitForTimeout(600);
    await saveScreenshots(page, '04_custom_fields_modal_before');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }

  // 2. Developer Hub: Webhook modal
  console.log('Capturing developer hub webhooks modal...');
  await page.locator('#subtab-developer').click();
  await page.waitForTimeout(700);

  // Webhooks
  const webhooksPill = page.locator('.hub-filter-pill:has-text("Event Webhooks")').first();
  if (await webhooksPill.isVisible().catch(() => false)) {
    await webhooksPill.click();
    await page.waitForTimeout(600);
    const addWebhookBtn = page.locator('button:has-text("Add Webhook")').first();
    if (await addWebhookBtn.isVisible().catch(() => false)) {
      await addWebhookBtn.click();
      await page.waitForTimeout(600);
      await saveScreenshots(page, '13_developer_webhook_modal_before');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }
  }

  await browser.close();
  console.log('Done remaining before captures!');
}

runRemaining().catch(console.error);
