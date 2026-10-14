import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const BRAIN_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/bcf88ada-31d6-4941-94ae-1b3daf5a2f4d/fixes_audit';
const SCRATCH_DIR = 'c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch';

fs.mkdirSync(BRAIN_DIR, { recursive: true });
fs.mkdirSync(SCRATCH_DIR, { recursive: true });

async function runAudit() {
  console.log('Launching browser to audit Settings fixes...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:4300...');
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Authenticate
  await page.waitForTimeout(1200);
  const loginInput = page.locator('#username');
  if (await loginInput.isVisible().catch(() => false)) {
    console.log('Logging in as SUPER_ADMIN...');
    await page.fill('#username', 'SUPER_ADMIN');
    await page.fill('#password', 'superadmin123');
    await page.click('#login-submit-btn');

    await page.waitForSelector('.uat-otp-helper-pill, .sidebar', { timeout: 25000 });
    if (await page.locator('.uat-otp-helper-pill').isVisible().catch(() => false)) {
      console.log('Clicking OTP helper pill...');
      await page.click('.uat-otp-helper-pill');
      await page.waitForTimeout(600);
      const verifyBtn = page.locator('button:has-text("Verify"), button[type="submit"]');
      await verifyBtn.first().click();
    }
  }

  await page.waitForSelector('.sidebar', { timeout: 20000 });
  await page.waitForTimeout(1000);

  // Navigate to Settings
  console.log('Navigating to Settings & Admin...');
  const settingsNav = page.locator('.nav-menu-list li:has-text("Settings"), .nav-item:has-text("Settings"), a:has-text("Settings")');
  await settingsNav.first().click();
  await page.waitForSelector('app-settings, .settings-page-container', { timeout: 15000 });
  await page.waitForTimeout(1000);

  // 1. Teams & Depts - Open Edit Department Modal
  console.log('Auditing Teams & Depts Modal...');
  const teamsTab = page.locator('.settings-tab-btn:has-text("Teams"), button:has-text("Teams & Depts")');
  if (await teamsTab.first().isVisible().catch(() => false)) {
    await teamsTab.first().click();
    await page.waitForTimeout(1000);
    // Click edit on the first department
    const editDeptBtn = page.locator('button:has-text("Edit"), .dept-action-btn:has-text("Edit")');
    if (await editDeptBtn.first().isVisible().catch(() => false)) {
      await editDeptBtn.first().click();
      await page.waitForSelector('.modal-content, .dept-modal-content', { timeout: 8000 });
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(BRAIN_DIR, '01_department_modal_fixed.png') });
      await page.screenshot({ path: path.join(SCRATCH_DIR, '01_department_modal_fixed.png') });
      console.log('Saved 01_department_modal_fixed.png');
      // Close modal
      const closeBtn = page.locator('.modal-close-btn, button:has-text("Cancel")');
      await closeBtn.first().click();
      await page.waitForTimeout(600);
    }
  }

  // 2. Extensible Fields - Open Edit Schema Field Modal
  console.log('Auditing Extensible Dynamic Schema Field Modal...');
  const fieldsTab = page.locator('.settings-tab-btn:has-text("Extensible"), button:has-text("Extensible Fields")');
  if (await fieldsTab.first().isVisible().catch(() => false)) {
    await fieldsTab.first().click();
    await page.waitForTimeout(1000);
    const editFieldBtn = page.locator('button:has-text("Edit"), .cf-action-btn:has-text("Edit")');
    if (await editFieldBtn.first().isVisible().catch(() => false)) {
      await editFieldBtn.first().click();
      await page.waitForSelector('.cf-modal-dialog', { timeout: 8000 });
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(BRAIN_DIR, '02_schema_field_modal_fixed.png') });
      await page.screenshot({ path: path.join(SCRATCH_DIR, '02_schema_field_modal_fixed.png') });
      console.log('Saved 02_schema_field_modal_fixed.png');
      const closeBtn = page.locator('.cf-modal-close-btn, .cf-btn-modal-cancel, button:has-text("Cancel")');
      await closeBtn.first().click();
      await page.waitForTimeout(600);
    }
  }

  // 3. Feature Flags - Audit Toolbar & Blank Space
  console.log('Auditing Feature Flags Toolbar...');
  const flagsTab = page.locator('.settings-tab-btn:has-text("Feature Flags"), button:has-text("Feature Flags")');
  if (await flagsTab.first().isVisible().catch(() => false)) {
    await flagsTab.first().click();
    await page.waitForSelector('.users-filter-toolbar, .flags-directory-workspace', { timeout: 8000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(BRAIN_DIR, '03_feature_flags_toolbar_fixed.png') });
    await page.screenshot({ path: path.join(SCRATCH_DIR, '03_feature_flags_toolbar_fixed.png') });
    console.log('Saved 03_feature_flags_toolbar_fixed.png');
  }

  // 4. Users & RBAC - Audit Toolbar & Blank Space
  console.log('Auditing Users & RBAC Toolbar...');
  const usersTab = page.locator('.settings-tab-btn:has-text("Users & RBAC"), button:has-text("Users & RBAC")');
  if (await usersTab.first().isVisible().catch(() => false)) {
    await usersTab.first().click();
    await page.waitForSelector('.users-filter-toolbar, .users-directory-workspace', { timeout: 8000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(BRAIN_DIR, '04_users_rbac_toolbar_fixed.png') });
    await page.screenshot({ path: path.join(SCRATCH_DIR, '04_users_rbac_toolbar_fixed.png') });
    console.log('Saved 04_users_rbac_toolbar_fixed.png');
  }

  console.log('All audits completed successfully!');
  await browser.close();
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
