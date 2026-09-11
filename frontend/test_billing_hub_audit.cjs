const { chromium } = require('@playwright/test');
const path = require('path');

const ARTIFACTS = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e';

async function runBillingHubAudit() {
  console.log('🚀 Launching Playwright audit for Billing Hub & Document Center...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Navigating to ERP...');
  await page.goto('http://localhost:4200', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check login
  const usernameInput = await page.$('input[placeholder*="Username" i], input[type="text"]');
  if (usernameInput) {
    console.log('2. Authenticating as SUPER_ADMIN...');
    await page.fill('input[placeholder*="Username" i], input[type="text"]', 'SUPER_ADMIN');
    await page.fill('input[type="password"]', 'superadmin123');
    await page.click('button:has-text("Sign In to ERP"), button[type="submit"]');

    try {
      await page.waitForSelector('input[placeholder*="otp" i], input[name*="otp" i]', { timeout: 3500 });
      console.log('   Entering OTP 654321...');
      await page.fill('input[placeholder*="otp" i], input[name*="otp" i]', '654321');
      const verifyBtn = await page.$('button[type="submit"]');
      if (verifyBtn) await verifyBtn.click();
    } catch (e) {
      console.log('   No OTP prompt encountered');
    }
  }

  await page.waitForTimeout(1500);

  console.log('3. Navigating to Billing Hub tab...');
  await page.evaluate(() => {
    const sidebar = document.querySelector('app-sidebar');
    if (sidebar) {
      const items = Array.from(sidebar.querySelectorAll('li'));
      const hubItem = items.find(el => el.textContent && el.textContent.toLowerCase().includes('billing'));
      if (hubItem) hubItem.click();
    }
  });

  await page.waitForTimeout(1500);

  // Screenshot 1: Billing Hub Main View
  const shot1Path = path.join(ARTIFACTS, 'billing_hub_redesign_main.png');
  await page.screenshot({ path: shot1Path, fullPage: false });
  console.log('✅ Screenshot 1 saved to:', shot1Path);

  // Screenshot 2: Empty Filter State
  console.log('4. Testing empty filter state...');
  const searchInput = await page.$('.filter-search-field input');
  if (searchInput) {
    await searchInput.fill('ZZZ_NON_EXISTENT_DOCUMENT_999');
    await page.waitForTimeout(600);
    const shot2Path = path.join(ARTIFACTS, 'billing_hub_empty_state.png');
    await page.screenshot({ path: shot2Path, fullPage: false });
    console.log('✅ Screenshot 2 (Empty State) saved to:', shot2Path);

    // Reset search
    await page.click('button:has-text("Reset Filters")');
    await page.waitForTimeout(600);
  }

  // Screenshot 3: Switch Document Tab to Delivery Challan
  console.log('5. Switching to Delivery Challan tab...');
  const challanBtn = await page.$('button.doc-tab-btn:has-text("Delivery Challan")');
  if (challanBtn) {
    await challanBtn.click();
    await page.waitForTimeout(800);
    const shot3Path = path.join(ARTIFACTS, 'billing_hub_challan_view.png');
    await page.screenshot({ path: shot3Path, fullPage: false });
    console.log('✅ Screenshot 3 (Delivery Challan) saved to:', shot3Path);
  }

  await browser.close();
  console.log('🎉 Billing Hub Audit Complete!');
}

runBillingHubAudit().catch(err => {
  console.error('❌ Audit failed:', err);
  process.exit(1);
});
