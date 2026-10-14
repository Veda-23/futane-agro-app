import { chromium } from '@playwright/test';

async function check() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1339, height: 674 } });
  await page.goto('http://localhost:4300');
  await page.waitForTimeout(1000);
  const loginInput = page.locator('#username');
  if (await loginInput.isVisible().catch(() => false)) {
    await page.fill('#username', 'SUPER_ADMIN');
    await page.fill('#password', 'superadmin123');
    await page.click('#login-submit-btn');
    await page.waitForSelector('.uat-otp-helper-pill, .sidebar', { timeout: 25000 });
    if (await page.locator('.uat-otp-helper-pill').isVisible().catch(() => false)) {
      await page.click('.uat-otp-helper-pill');
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Verify"), button[type="submit"]').first().click();
    }
  }
  await page.waitForSelector('.sidebar', { timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.locator('.nav-menu-list li:has-text("Settings"), a:has-text("Settings")').first().click();
  await page.waitForSelector('app-settings', { timeout: 15000 });
  await page.waitForTimeout(1000);
  
  await page.locator('#subtab-custom-fields').click();
  await page.waitForTimeout(600);
  // Click MACHINES tab pill if available
  const machinesPill = page.locator('.cf-entity-pill:has-text("MACHINES"), button:has-text("MACHINES")');
  if (await machinesPill.first().isVisible().catch(() => false)) {
    await machinesPill.first().click();
    await page.waitForTimeout(500);
  }
  // Click edit on the first custom field
  await page.locator('.cf-action-btn:has-text("Edit"), button:has-text("Edit")').first().click();
  await page.waitForTimeout(600);
  
  await page.screenshot({ path: '../scratch/user_situation_screenshot.png' });
  
  const debugInfo = await page.evaluate(() => {
    const bd = document.querySelector('.cf-modal-backdrop');
    const dlg = document.querySelector('.cf-modal-dialog');
    const sb = document.querySelector('.sidebar');
    const bdRect = bd ? bd.getBoundingClientRect() : null;
    const dlgRect = dlg ? dlg.getBoundingClientRect() : null;
    const sbRect = sb ? sb.getBoundingClientRect() : null;
    const bdStyle = bd ? window.getComputedStyle(bd) : null;
    const dlgStyle = dlg ? window.getComputedStyle(dlg) : null;
    return {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      sbRect: sbRect ? { x: sbRect.x, width: sbRect.width } : null,
      bdRect: bdRect ? { x: bdRect.x, y: bdRect.y, width: bdRect.width, height: bdRect.height } : null,
      dlgRect: dlgRect ? { x: dlgRect.x, y: dlgRect.y, width: dlgRect.width, height: dlgRect.height } : null,
      bdPaddingLeft: bdStyle?.paddingLeft,
      bdPaddingRight: bdStyle?.paddingRight,
      bdDisplay: bdStyle?.display,
      bdJustifyContent: bdStyle?.justifyContent,
      bdAlignItems: bdStyle?.alignItems,
      dlgMargin: dlgStyle?.margin,
      dlgPosition: dlgStyle?.position,
      dlgLeft: dlgStyle?.left,
      dlgTransform: dlgStyle?.transform,
      offsetParent: dlg?.offsetParent ? dlg.offsetParent.tagName + '.' + dlg.offsetParent.className : 'null',
      bdOffsetParent: bd?.offsetParent ? bd.offsetParent.tagName + '.' + bd.offsetParent.className : 'null'
    };
  });
  console.log('USER SITUATION DEBUG:', JSON.stringify(debugInfo, null, 2));
  await browser.close();
}

check().catch(console.error);
