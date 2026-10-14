import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BRAIN_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/bcf88ada-31d6-4941-94ae-1b3daf5a2f4d/universal_audit';
const SCRATCH_DIR = 'c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/universal_audit';

fs.mkdirSync(BRAIN_DIR, { recursive: true });
fs.mkdirSync(SCRATCH_DIR, { recursive: true });

const auditResults = [];

async function loginUser(page) {
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const loginInput = page.locator('#username');
  if (await loginInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('Logging in as SUPER_ADMIN...');
    await page.fill('#username', 'SUPER_ADMIN');
    await page.fill('#password', 'superadmin123');
    await page.click('#login-submit-btn');

    await page.waitForSelector('.uat-otp-helper-pill, .sidebar', { timeout: 25000 });
    if (await page.locator('.uat-otp-helper-pill').isVisible().catch(() => false)) {
      console.log('Clicking OTP helper pill...');
      await page.click('.uat-otp-helper-pill');
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Verify"), button[type="submit"]').first().click();
    }
  }

  await page.waitForSelector('.sidebar', { timeout: 25000 });
  await page.waitForTimeout(1000);
}

async function closeAnyModal(p) {
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  const closeBtns = p.locator('.modal-close-btn, .notif-modal-close, .cf-modal-close-btn, .cf-btn-modal-cancel, button:has-text("Cancel"), button:has-text("Close"), .btn-close-custom, .btn-panel-close');
  const count = await closeBtns.count();
  for (let i = 0; i < count; i++) {
    const btn = closeBtns.nth(i);
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => {});
      await p.waitForTimeout(200);
    }
  }
  // If overlay still present, click top-left corner
  const overlays = p.locator('.party-modal-overlay, .production-modal-overlay, .payments-modal-overlay, .modal-backdrop');
  if (await overlays.first().isVisible().catch(() => false)) {
    await overlays.first().click({ force: true, position: { x: 10, y: 10 } }).catch(() => {});
    await p.waitForTimeout(300);
  }
}

async function navigateToTab(page, tabName) {
  await closeAnyModal(page);
  const navItem = page.locator(`.sidebar li[title*="${tabName}" i], .sidebar li:has-text("${tabName}"), .nav-menu-list li[title*="${tabName}" i]`).first();
  await navItem.scrollIntoViewIfNeeded().catch(() => {});
  await navItem.click();
  await page.waitForTimeout(800);
}

async function captureAndMeasure(page, name, situation, sidebarWidth = 240) {
  const p1 = path.join(BRAIN_DIR, `${name}.png`);
  const p2 = path.join(SCRATCH_DIR, `${name}.png`);
  await page.screenshot({ path: p1 });
  await page.screenshot({ path: p2 });

  // Locate the active visible dialog
  const dialogLocator = page.locator('.modal-content, .dept-modal-content, .cf-modal-dialog, .notif-modal-dialog, .sec-confirm-modal, .restore-modal-content, .modal-dialog-custom, .party-modal-dialog, .payments-modal-dialog, .voucher-modal-dialog, .grn-voucher-dialog, .production-modal-dialog, .outward-modal-dialog').first();
  
  let measurement = null;
  if (await dialogLocator.isVisible().catch(() => false)) {
    const box = await dialogLocator.boundingBox();
    const vp = page.viewportSize();
    if (box && vp) {
      const leftMargin = Math.round(box.x - sidebarWidth);
      const rightMargin = Math.round(vp.width - (box.x + box.width));
      const delta = Math.abs(leftMargin - rightMargin);
      const isHeightSafe = box.height <= (vp.height - 40);
      measurement = {
        dialogWidth: Math.round(box.width),
        dialogHeight: Math.round(box.height),
        dialogX: Math.round(box.x),
        dialogY: Math.round(box.y),
        sidebarWidth,
        viewportWidth: vp.width,
        viewportHeight: vp.height,
        leftMargin,
        rightMargin,
        delta,
        isCentered: delta <= 6, // within ±6px tolerance for subpixel render
        isHeightSafe
      };
    }
  }

  auditResults.push({
    name,
    situation,
    measurement
  });

  console.log(`[QA CAPTURED] ${name} | Situation: ${situation} | Centered: ${measurement ? measurement.isCentered + ' (L:' + measurement.leftMargin + 'px, R:' + measurement.rightMargin + 'px, Δ:' + measurement.delta + 'px, H:' + measurement.dialogHeight + 'px)' : 'N/A'}`);
}

async function runUniversalQA() {
  console.log('Launching browser for Universal Multi-State Pop Card Audit...');
  const browser = await chromium.launch({ headless: true });

  // =============================================================
  // SITUATION 1: DESKTOP SIDEBAR OPEN (1440x900, Sidebar 240px)
  // =============================================================
  console.log('\n=== RUNNING SITUATION 1: DESKTOP SIDEBAR OPEN (1440x900) ===');
  const context1 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page1 = await context1.newPage();
  await loginUser(page1);

  // S1.1 Settings: Add Entity / Company
  await navigateToTab(page1, 'Settings');
  await page1.locator('#subtab-business-rules').click();
  await page1.waitForTimeout(500);
  await page1.locator('button:has-text("Add Company"), button:has-text("Add Entity")').first().click();
  await page1.waitForTimeout(600);
  await captureAndMeasure(page1, 'S1_01_desktop_sidebar_open_add_company', 'Sidebar Open 240px (1440x900)', 240);
  await closeAnyModal(page1);

  // S1.2 Settings: Add Bank Account
  await page1.locator('button:has-text("Add Bank"), button:has-text("New Bank")').first().click();
  await page1.waitForTimeout(600);
  await captureAndMeasure(page1, 'S1_02_desktop_sidebar_open_add_bank', 'Sidebar Open 240px (1440x900)', 240);
  await closeAnyModal(page1);

  // S1.3 Settings: Add Department
  await page1.locator('#subtab-teams').click();
  await page1.waitForTimeout(500);
  await page1.locator('button:has-text("Add Department"), button:has-text("Create Department")').first().click();
  await page1.waitForTimeout(600);
  await captureAndMeasure(page1, 'S1_03_desktop_sidebar_open_add_department', 'Sidebar Open 240px (1440x900)', 240);
  await closeAnyModal(page1);

  // S1.4 Settings: Add Custom Field
  await page1.locator('#subtab-custom-fields').click();
  await page1.waitForTimeout(500);
  await page1.locator('button:has-text("Add Dynamic Field")').first().click();
  await page1.waitForTimeout(600);
  await captureAndMeasure(page1, 'S1_04_desktop_sidebar_open_custom_field', 'Sidebar Open 240px (1440x900)', 240);
  await closeAnyModal(page1);

  // S1.5 Settings: Custom Module Access Matrix
  await page1.locator('#subtab-users').click();
  await page1.waitForTimeout(500);
  await page1.locator('button[title="Custom Module Access"]').first().click();
  await page1.waitForTimeout(600);
  await captureAndMeasure(page1, 'S1_05_desktop_sidebar_open_access_matrix', 'Sidebar Open 240px (1440x900)', 240);
  await closeAnyModal(page1);

  // S1.6 Settings: Add Webhook
  await page1.locator('#subtab-developer').click();
  await page1.waitForTimeout(500);
  await page1.locator('.hub-filter-pill:has-text("Event Webhooks")').first().click();
  await page1.waitForTimeout(500);
  await page1.locator('button:has-text("Add Webhook")').first().click();
  await page1.waitForTimeout(600);
  await captureAndMeasure(page1, 'S1_06_desktop_sidebar_open_webhook', 'Sidebar Open 240px (1440x900)', 240);
  await closeAnyModal(page1);

  // S1.7 Production: Daily Production Batch Dialog
  await navigateToTab(page1, 'Production');
  const addProdBtn = page1.locator('button:has-text("Add Daily Entry"), button:has-text("Add Production"), button:has-text("Add Batch")').first();
  if (await addProdBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await addProdBtn.click();
    await page1.waitForTimeout(600);
    await captureAndMeasure(page1, 'S1_07_desktop_sidebar_open_production_modal', 'Sidebar Open 240px (1440x900)', 240);
    await closeAnyModal(page1);
  }

  // S1.8 Party Registry: Add Customer Modal
  await navigateToTab(page1, 'Parties');
  const addPartyBtn = page1.locator('button:has-text("Add Customer"), button:has-text("Add Party"), button:has-text("New Customer")').first();
  if (await addPartyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await addPartyBtn.click();
    await page1.waitForTimeout(600);
    await captureAndMeasure(page1, 'S1_08_desktop_sidebar_open_party_modal', 'Sidebar Open 240px (1440x900)', 240);
    await closeAnyModal(page1);
  }

  // S1.9 Payments: Record Payment Voucher
  await navigateToTab(page1, 'Payment');
  const addPayBtn = page1.locator('button:has-text("Record Payment"), button:has-text("New Payment")').first();
  if (await addPayBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await addPayBtn.click();
    await page1.waitForTimeout(600);
    await captureAndMeasure(page1, 'S1_09_desktop_sidebar_open_payments_modal', 'Sidebar Open 240px (1440x900)', 240);
    await closeAnyModal(page1);
  }

  // =============================================================
  // SITUATION 2: SIDEBAR COLLAPSED (Mini Rail 68px, 1440x900)
  // =============================================================
  console.log('\n=== RUNNING SITUATION 2: SIDEBAR COLLAPSED (Mini Rail 68px) ===');
  // Collapse sidebar via header toggle
  const collapseToggle = page1.locator('app-header .mobile-toggle-btn').first();
  await collapseToggle.click();
  await page1.waitForTimeout(600);

  // S2.1 Settings Custom Field with Sidebar Collapsed
  await navigateToTab(page1, 'Settings');
  await page1.locator('#subtab-custom-fields').click();
  await page1.waitForTimeout(500);
  await page1.locator('button:has-text("Add Dynamic Field")').first().click();
  await page1.waitForTimeout(600);
  await captureAndMeasure(page1, 'S2_01_sidebar_collapsed_custom_field', 'Sidebar Collapsed 68px (1440x900)', 68);
  await closeAnyModal(page1);

  // S2.2 Settings Department with Sidebar Collapsed
  await page1.locator('#subtab-teams').click();
  await page1.waitForTimeout(500);
  await page1.locator('button:has-text("Add Department"), button:has-text("Create Department")').first().click();
  await page1.waitForTimeout(600);
  await captureAndMeasure(page1, 'S2_02_sidebar_collapsed_add_dept', 'Sidebar Collapsed 68px (1440x900)', 68);
  await closeAnyModal(page1);

  // S2.3 Production Modal with Sidebar Collapsed
  await navigateToTab(page1, 'Production');
  if (await addProdBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await addProdBtn.click();
    await page1.waitForTimeout(600);
    await captureAndMeasure(page1, 'S2_03_sidebar_collapsed_production_modal', 'Sidebar Collapsed 68px (1440x900)', 68);
    await closeAnyModal(page1);
  }

  // S2.4 Party Modal with Sidebar Collapsed
  await navigateToTab(page1, 'Parties');
  if (await addPartyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await addPartyBtn.click();
    await page1.waitForTimeout(600);
    await captureAndMeasure(page1, 'S2_04_sidebar_collapsed_party_modal', 'Sidebar Collapsed 68px (1440x900)', 68);
    await closeAnyModal(page1);
  }

  await context1.close();

  // =============================================================
  // SITUATION 3: CONSTRAINED LAPTOP HEIGHT (1280x664, Sidebar 240px)
  // =============================================================
  console.log('\n=== RUNNING SITUATION 3: CONSTRAINED LAPTOP HEIGHT (1280x664) ===');
  const context3 = await browser.newContext({ viewport: { width: 1280, height: 664 } });
  const page3 = await context3.newPage();
  await loginUser(page3);

  // S3.1 Add Company on constrained laptop
  await navigateToTab(page3, 'Settings');
  await page3.locator('#subtab-business-rules').click();
  await page3.waitForTimeout(500);
  await page3.locator('button:has-text("Add Company"), button:has-text("Add Entity")').first().click();
  await page3.waitForTimeout(600);
  await captureAndMeasure(page3, 'S3_01_laptop_constrained_add_company', 'Laptop Height 664px (1280x664)', 240);
  await closeAnyModal(page3);

  // S3.2 Access Matrix on constrained laptop
  await page3.locator('#subtab-users').click();
  await page3.waitForTimeout(500);
  await page3.locator('button[title="Custom Module Access"]').first().click();
  await page3.waitForTimeout(600);
  await captureAndMeasure(page3, 'S3_02_laptop_constrained_access_matrix', 'Laptop Height 664px (1280x664)', 240);
  await closeAnyModal(page3);

  // S3.3 Production Modal on constrained laptop
  await navigateToTab(page3, 'Production');
  const addProdBtn3 = page3.locator('button:has-text("Add Daily Entry"), button:has-text("Add Production"), button:has-text("Add Batch")').first();
  if (await addProdBtn3.isVisible({ timeout: 5000 }).catch(() => false)) {
    await addProdBtn3.click();
    await page3.waitForTimeout(600);
    await captureAndMeasure(page3, 'S3_03_laptop_constrained_production_modal', 'Laptop Height 664px (1280x664)', 240);
    await closeAnyModal(page3);
  }

  await context3.close();

  // =============================================================
  // SITUATION 4: ENTERPRISE DARK THEME (1440x900)
  // =============================================================
  console.log('\n=== RUNNING SITUATION 4: ENTERPRISE DARK THEME (1440x900) ===');
  const context4 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page4 = await context4.newPage();
  await loginUser(page4);

  // Enable dark theme
  await page4.evaluate(() => {
    document.body.classList.add('dark-theme');
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page4.waitForTimeout(500);

  // S4.1 Custom Field in Dark Theme
  await navigateToTab(page4, 'Settings');
  await page4.locator('#subtab-custom-fields').click();
  await page4.waitForTimeout(500);
  await page4.locator('button:has-text("Add Dynamic Field")').first().click();
  await page4.waitForTimeout(600);
  await captureAndMeasure(page4, 'S4_01_dark_theme_custom_field', 'Dark Theme (1440x900)', 240);
  await closeAnyModal(page4);

  // S4.2 Add Department in Dark Theme
  await page4.locator('#subtab-teams').click();
  await page4.waitForTimeout(500);
  await page4.locator('button:has-text("Add Department"), button:has-text("Create Department")').first().click();
  await page4.waitForTimeout(600);
  await captureAndMeasure(page4, 'S4_02_dark_theme_add_dept', 'Dark Theme (1440x900)', 240);
  await closeAnyModal(page4);

  // S4.3 Production Modal in Dark Theme
  await navigateToTab(page4, 'Production');
  const addProdBtn4 = page4.locator('button:has-text("Add Daily Entry"), button:has-text("Add Production"), button:has-text("Add Batch")').first();
  if (await addProdBtn4.isVisible({ timeout: 5000 }).catch(() => false)) {
    await addProdBtn4.click();
    await page4.waitForTimeout(600);
    await captureAndMeasure(page4, 'S4_03_dark_theme_production_modal', 'Dark Theme (1440x900)', 240);
    await closeAnyModal(page4);
  }

  // S4.4 Party Modal in Dark Theme
  await navigateToTab(page4, 'Parties');
  const addPartyBtn4 = page4.locator('button:has-text("Add Customer"), button:has-text("Add Party"), button:has-text("New Customer")').first();
  if (await addPartyBtn4.isVisible({ timeout: 5000 }).catch(() => false)) {
    await addPartyBtn4.click();
    await page4.waitForTimeout(600);
    await captureAndMeasure(page4, 'S4_04_dark_theme_party_modal', 'Dark Theme (1440x900)', 240);
    await closeAnyModal(page4);
  }

  await context4.close();
  await browser.close();

  // Save full audit report
  const reportPath = path.join(BRAIN_DIR, 'universal_audit_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
  console.log(`\n=============================================================`);
  console.log(`AUDIT COMPLETE: All ${auditResults.length} test cases captured and measured.`);
  console.log(`Saved report to ${reportPath}`);
  console.log(`=============================================================`);
}

runUniversalQA().catch(err => {
  console.error('Universal QA failure:', err);
  process.exit(1);
});
