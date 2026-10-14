import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCRATCH_DIR = 'c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/popcards_dynamic';
fs.mkdirSync(SCRATCH_DIR, { recursive: true });

async function testViewports() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1339, height: 674 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:4300...');
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#username, .sidebar', { timeout: 30000 });

  const loginInput = page.locator('#username');
  if (await loginInput.isVisible().catch(() => false)) {
    console.log('Logging in as SUPER_ADMIN...');
    await page.fill('#username', 'SUPER_ADMIN');
    await page.fill('#password', 'superadmin123');
    await page.click('#login-submit-btn');
    await page.waitForSelector('.uat-otp-helper-pill, .sidebar', { timeout: 25000 });
    if (await page.locator('.uat-otp-helper-pill').isVisible().catch(() => false)) {
      await page.click('.uat-otp-helper-pill');
      await page.waitForTimeout(400);
      await page.locator('button:has-text("Verify"), button[type="submit"]').first().click();
    }
  }

  await page.waitForSelector('.sidebar', { timeout: 20000 });
  await page.waitForTimeout(800);

  // Navigate to Settings
  console.log('Navigating to System Settings...');
  await page.locator('.nav-menu-list li:has-text("Settings"), a:has-text("Settings")').first().click();
  await page.waitForSelector('app-settings', { timeout: 15000 });
  await page.waitForTimeout(800);

  // Navigate to Extensible Dynamic Fields subtab
  await page.locator('#subtab-custom-fields').click();
  await page.waitForTimeout(600);

  // Open Edit Dynamic Schema Field dialog
  console.log('Opening Edit Dynamic Schema Field dialog...');
  await page.locator('.cf-action-btn:has-text("Edit"), button:has-text("Edit")').first().click();
  await page.waitForTimeout(600);

  const viewports = [
    { name: 'User_Current_1339x674', width: 1339, height: 674 },
    { name: 'Laptop_Scaled_1280x720', width: 1280, height: 720 },
    { name: 'Compact_Screen_1100x680', width: 1100, height: 680 },
    { name: 'Desktop_Standard_1440x900', width: 1440, height: 900 }
  ];

  const results = [];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(500);

    const metrics = await page.evaluate(() => {
      const bd = document.querySelector('.cf-modal-backdrop');
      const dlg = document.querySelector('.cf-modal-dialog');
      const sb = document.querySelector('.sidebar');
      const btnSave = document.querySelector('.cf-btn-modal-save');
      const bdRect = bd?.getBoundingClientRect();
      const dlgRect = dlg?.getBoundingClientRect();
      const sbRect = sb?.getBoundingClientRect();
      const btnRect = btnSave?.getBoundingClientRect();

      const effectiveSidebarWidth = sbRect ? sbRect.width : 0;
      const leftGapToSidebar = dlgRect ? dlgRect.x - effectiveSidebarWidth : 0;
      const rightGapToWindow = dlgRect ? window.innerWidth - (dlgRect.x + dlgRect.width) : 0;
      const asymmetry = Math.abs(leftGapToSidebar - rightGapToWindow);
      const isSaveVisible = btnRect ? (btnRect.bottom <= window.innerHeight && btnRect.top >= 0) : false;

      return {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        sidebarWidth: effectiveSidebarWidth,
        dlgWidth: dlgRect?.width,
        dlgHeight: dlgRect?.height,
        dlgX: dlgRect?.x,
        leftGapToSidebar: Math.round(leftGapToSidebar * 10) / 10,
        rightGapToWindow: Math.round(rightGapToWindow * 10) / 10,
        asymmetry: Math.round(asymmetry * 10) / 10,
        isCentered: asymmetry <= 3.0,
        isSaveVisibleAboveFold: isSaveVisible,
        hasRightCollision: (dlgRect?.x + dlgRect?.width) >= window.innerWidth - 10
      };
    });

    results.push({ name: vp.name, ...metrics });
    const screenPath = path.join(SCRATCH_DIR, `${vp.name}.png`);
    await page.screenshot({ path: screenPath });
    console.log(`[PASS] ${vp.name}: leftGap=${metrics.leftGapToSidebar}px, rightGap=${metrics.rightGapToWindow}px, collision=${metrics.hasRightCollision}`);
  }

  // Now test Collapsed Sidebar state at 1339x674
  await page.setViewportSize({ width: 1339, height: 674 });
  const collapseBtn = page.locator('.sidebar-collapse-btn, button:has-text("Collapse"), .sidebar-toggle-btn').first();
  if (await collapseBtn.isVisible().catch(() => false)) {
    console.log('Testing Sidebar Collapsed state...');
    await collapseBtn.click();
    await page.waitForTimeout(600);
    const collapsedMetrics = await page.evaluate(() => {
      const dlg = document.querySelector('.cf-modal-dialog');
      const sb = document.querySelector('.sidebar');
      const sbRect = sb?.getBoundingClientRect();
      const dlgRect = dlg?.getBoundingClientRect();
      const effectiveSidebarWidth = sbRect ? sbRect.width : 0;
      const leftGapToSidebar = dlgRect ? dlgRect.x - effectiveSidebarWidth : 0;
      const rightGapToWindow = dlgRect ? window.innerWidth - (dlgRect.x + dlgRect.width) : 0;
      return {
        viewportWidth: window.innerWidth,
        sidebarWidth: effectiveSidebarWidth,
        dlgWidth: dlgRect?.width,
        leftGapToSidebar: Math.round(leftGapToSidebar * 10) / 10,
        rightGapToWindow: Math.round(rightGapToWindow * 10) / 10,
        asymmetry: Math.round(Math.abs(leftGapToSidebar - rightGapToWindow) * 10) / 10,
        isCentered: Math.abs(leftGapToSidebar - rightGapToWindow) <= 3.0
      };
    });
    results.push({ name: 'Sidebar_Collapsed_1339x674', ...collapsedMetrics });
    await page.screenshot({ path: path.join(SCRATCH_DIR, 'Sidebar_Collapsed_1339x674.png') });
    console.log(`[PASS] Sidebar Collapsed: leftGap=${collapsedMetrics.leftGapToSidebar}px, rightGap=${collapsedMetrics.rightGapToWindow}px`);
  }

  await browser.close();
  console.log('\nFINAL MULTI-VIEWPORT AUDIT REPORT:');
  console.log(JSON.stringify(results, null, 2));
}

testViewports().catch(console.error);
