const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:8081', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const usernameInput = await page.$('input[placeholder*="username" i], input[type="text"]');
  const passwordInput = await page.$('input[placeholder*="password" i], input[type="password"]');

  if (usernameInput && passwordInput) {
    await usernameInput.fill('SUPER_ADMIN');
    await passwordInput.fill('superadmin123');
    
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await page.waitForTimeout(1200);

    // Click OTP helper box to auto-fill
    const otpBox = await page.$('.otp-display-box');
    if (otpBox) {
      await otpBox.click();
      await page.waitForTimeout(500);
      const verifyBtn = await page.$('button[type="submit"]');
      if (verifyBtn) await verifyBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  // Scroll sidebar and click Audit Logs
  await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar-nav, .app-sidebar');
    if (sidebar) sidebar.scrollTop = sidebar.scrollHeight;
    
    const rootEl = document.querySelector('app-root');
    const comp = window.ng ? window.ng.getComponent(rootEl) : null;
    if (comp) {
      comp.switchTab('audit-logs');
      if (window.ng.applyChanges) window.ng.applyChanges(comp);
    }
  });

  // Also try clicking element
  const auditLink = page.locator('text=Audit Logs').first();
  if (await auditLink.isVisible()) {
    await auditLink.click({ force: true });
  }

  await page.waitForTimeout(2000);

  const outputPath = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/c1c6338c-1671-4e87-b480-7a9ae9928b58/new_unified_header_audit_logs.png';
  await page.screenshot({ path: outputPath, fullPage: false });
  console.log('Saved screenshot to: ' + outputPath);
  await browser.close();
})();
