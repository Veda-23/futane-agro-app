import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BRAIN_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/bcf88ada-31d6-4941-94ae-1b3daf5a2f4d/popcards_after';
const SCRATCH_DIR = 'c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/popcards_after';

fs.mkdirSync(BRAIN_DIR, { recursive: true });
fs.mkdirSync(SCRATCH_DIR, { recursive: true });

async function saveScreenshots(page, name) {
  const p1 = path.join(BRAIN_DIR, `${name}.png`);
  const p2 = path.join(SCRATCH_DIR, `${name}.png`);
  await page.screenshot({ path: p1 });
  await page.screenshot({ path: p2 });
  console.log(`[SNAPSHOT AFTER FIX] Saved: ${name}.png`);
}

async function runAuditAfter() {
  console.log('Launching browser to capture post-fix pop cards...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:4300...');
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  console.log('Waiting for application to hydrate (#username or .sidebar)...');
  await page.waitForSelector('#username, .sidebar', { timeout: 30000 });

  // Authenticate
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
  console.log('Navigating to Settings...');
  const settingsNav = page.locator('.nav-menu-list li:has-text("Settings"), .nav-item:has-text("Settings"), a:has-text("Settings")');
  await settingsNav.first().click();
  await page.waitForSelector('app-settings, .settings-page-container', { timeout: 15000 });
  await page.waitForTimeout(1000);

  async function selectSubTabById(pillId) {
    console.log(`Switching to subtab pill: #${pillId}`);
    const pill = page.locator(`#${pillId}`);
    await pill.scrollIntoViewIfNeeded();
    await pill.click();
    await page.waitForTimeout(700);
  }

  async function closeModal() {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const closeBtns = page.locator('.modal-close-btn, .notif-modal-close, .cf-modal-close-btn, .cf-btn-modal-cancel, button:has-text("Cancel"), button:has-text("Close"), .btn-close-custom');
    if (await closeBtns.first().isVisible().catch(() => false)) {
      await closeBtns.first().click().catch(() => {});
      await page.waitForTimeout(300);
    }
  }

  // 1. Business Rules Subtab
  await selectSubTabById('subtab-business-rules');
  
  // 1a. Add Company Modal
  console.log('1a. Add Company Modal...');
  const addCompanyBtn = page.locator('button:has-text("Add Company"), button:has-text("Add Entity")').first();
  if (await addCompanyBtn.isVisible().catch(() => false)) {
    await addCompanyBtn.click();
    await page.waitForTimeout(500);
    await saveScreenshots(page, '01_business_rules_company_modal_after');
    await closeModal();
  }

  // 1b. Add Bank Modal
  console.log('1b. Add Bank Modal...');
  const addBankBtn = page.locator('button:has-text("Add Bank"), button:has-text("Add Bank Account")').first();
  if (await addBankBtn.isVisible().catch(() => false)) {
    await addBankBtn.click();
    await page.waitForTimeout(500);
    await saveScreenshots(page, '02_business_rules_bank_modal_after');
    await closeModal();
  }

  // 2. Teams & Depts Subtab
  await selectSubTabById('subtab-teams');
  console.log('2. Team / Department Modal...');
  const addTeamBtn = page.locator('button:has-text("Add Department"), button:has-text("Create Department")').first();
  if (await addTeamBtn.isVisible().catch(() => false)) {
    await addTeamBtn.click();
    await page.waitForTimeout(500);
    await saveScreenshots(page, '03_teams_dept_modal_after');
    await closeModal();
  }

  // 3. Extensible Fields Subtab
  await selectSubTabById('subtab-custom-fields');
  console.log('3. Custom Field Modal...');
  const addFieldBtn = page.locator('button:has-text("Add Dynamic Field"), button:has-text("Add Field")').first();
  if (await addFieldBtn.isVisible().catch(() => false)) {
    await addFieldBtn.click();
    await page.waitForTimeout(500);
    await saveScreenshots(page, '04_custom_fields_modal_after');
    await closeModal();
  }

  // 4. WhatsApp & Alerts Subtab
  await selectSubTabById('subtab-notifications');
  console.log('4. Add Notification Template Modal...');
  const addTmplBtn = page.locator('button:has-text("Add Template"), button:has-text("Create Template")').first();
  if (await addTmplBtn.isVisible().catch(() => false)) {
    await addTmplBtn.click();
    await page.waitForTimeout(500);
    await saveScreenshots(page, '05_notifications_template_modal_after');
    await closeModal();
  }

  // 5. Users & RBAC Subtab
  await selectSubTabById('subtab-users');
  
  // 5a. Invite User Modal
  console.log('5a. Invite User Modal...');
  const inviteBtn = page.locator('button:has-text("Invite User")').first();
  if (await inviteBtn.isVisible().catch(() => false)) {
    await inviteBtn.click();
    await page.waitForTimeout(500);
    await saveScreenshots(page, '06_users_invite_modal_after');
    await closeModal();
  }

  // 5b. Edit User Modal
  console.log('5b. Edit User Modal...');
  const editUserBtn = page.locator('button[title="Edit user profile"]').first();
  if (await editUserBtn.isVisible().catch(() => false)) {
    await editUserBtn.click();
    await page.waitForTimeout(500);
    await saveScreenshots(page, '07_users_edit_modal_after');
    await closeModal();
  }

  // 5c. Permissions Matrix Modal
  console.log('5c. Permissions Matrix Modal...');
  const permsBtn = page.locator('button[title="Custom Module Access"]').first();
  if (await permsBtn.isVisible().catch(() => false)) {
    await permsBtn.click();
    await page.waitForTimeout(500);
    await saveScreenshots(page, '08_users_permissions_matrix_modal_after');
    await closeModal();
  }

  // 6. Feature Flags Subtab
  await selectSubTabById('subtab-features');
  
  // 6a. Feature Flag Inspector Modal
  console.log('6a. Feature Flag Inspector Modal...');
  const inspectFlagBtn = page.locator('button[title="Inspect flag metadata & scoping"]').first();
  if (await inspectFlagBtn.isVisible().catch(() => false)) {
    await inspectFlagBtn.click();
    await page.waitForTimeout(500);
    await saveScreenshots(page, '09_feature_flag_detail_modal_after');
    await closeModal();
  }

  // 6b. Edit Feature Flag Modal
  console.log('6b. Edit Feature Flag Modal...');
  const editFlagBtn = page.locator('button[title="Edit Subsystem Details"]').first();
  if (await editFlagBtn.isVisible().catch(() => false)) {
    await editFlagBtn.click();
    await page.waitForTimeout(500);
    await saveScreenshots(page, '10_feature_flag_edit_modal_after');
    await closeModal();
  }

  // 7. Developer Hub Subtab
  await selectSubTabById('subtab-developer');
  
  // 7a. Generate API Key Modal
  console.log('7a. Generate API Key Modal...');
  const genKeyBtn = page.locator('button:has-text("Generate API Key")').first();
  if (await genKeyBtn.isVisible().catch(() => false)) {
    await genKeyBtn.click();
    await page.waitForTimeout(500);
    await saveScreenshots(page, '11_developer_api_key_modal_after');
    await closeModal();
  }

  // 7b. Register Webhook Modal
  console.log('7b. Register Webhook Modal...');
  const webhookPill = page.locator('.hub-filter-pill:has-text("Event Webhooks")').first();
  if (await webhookPill.isVisible().catch(() => false)) {
    await webhookPill.click();
    await page.waitForTimeout(500);
  }
  const regWebhookBtn = page.locator('button:has-text("Add Webhook"), button:has-text("Register Webhook")').first();
  if (await regWebhookBtn.isVisible().catch(() => false)) {
    await regWebhookBtn.click();
    await page.waitForTimeout(500);
    await saveScreenshots(page, '13_developer_webhook_modal_after');
    await closeModal();
  }

  // 8. Governance Subtab
  await selectSubTabById('subtab-governance');
  console.log('8. Database Restore Confirmation Modal...');
  const restoreBtn = page.locator('button:has-text("Restore"), button:has-text("Rollback Database"), .btn-restore').first();
  if (await restoreBtn.isVisible().catch(() => false)) {
    await restoreBtn.click();
    await page.waitForTimeout(500);
    await saveScreenshots(page, '14_governance_restore_modal_after');
    await closeModal();
  }

  // 9. Security Subtab
  await selectSubTabById('subtab-password');
  console.log('9. Master Password Confirmation Modal...');
  const passInputs = page.locator('input[type="password"]');
  if (await passInputs.count() >= 3) {
    await passInputs.nth(0).fill('superadmin123');
    await passInputs.nth(1).fill('Master@Futane2026#Sec');
    await passInputs.nth(2).fill('Master@Futane2026#Sec');
    await page.waitForTimeout(400);
    const updatePassBtn = page.locator('button:has-text("Update Master Password")').first();
    if (await updatePassBtn.isVisible().catch(() => false)) {
      await updatePassBtn.click();
      await page.waitForTimeout(500);
      const secModal = page.locator('.sec-confirm-modal, .sec-modal-backdrop');
      if (await secModal.first().isVisible().catch(() => false)) {
        await saveScreenshots(page, '15_security_password_modal_after');
        await closeModal();
      }
    }
  }

  console.log('All post-fix pop card captures finished successfully!');
  await browser.close();
}

runAuditAfter().catch(err => {
  console.error('Audit after error:', err);
  process.exit(1);
});
