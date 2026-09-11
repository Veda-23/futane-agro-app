const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const outDir = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e/crawl_artifacts';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Seed storage
  await page.addInitScript(() => {
    const mockUser = {
      id: 1,
      username: 'admin',
      name: 'Vedant Mehare',
      role: 'SUPER_ADMIN',
      email: 'admin@futaneagro.com'
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('jwtToken', 'mock-jwt-jio-yono-crawl');
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    sessionStorage.setItem('jwtToken', 'mock-jwt-jio-yono-crawl');
  });

  console.log('Connecting to static server http://localhost:4200 ...');
  await page.goto('http://localhost:4200/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForSelector('app-root', { timeout: 15000 });
  await page.waitForTimeout(2000);
  console.log('Connected successfully!');

  // Helper tab switcher
  const switchTab = async (tabName) => {
    console.log(`Navigating to tab: ${tabName}`);
    const navItems = await page.$$('app-sidebar li, app-sidebar button, .nav-item, .sidebar-nav a, .nav-link, .menu-item');
    for (const item of navItems) {
      const text = await item.textContent();
      if (text && text.toLowerCase().includes(tabName.toLowerCase())) {
        await item.click();
        await page.waitForTimeout(1500);
        return;
      }
    }
    // Fallback: try routing directly or hash
    await page.evaluate((t) => {
      const el = Array.from(document.querySelectorAll('*')).find(e => e.textContent && e.textContent.trim().toLowerCase() === t.toLowerCase());
      if (el) el.click();
    }, tabName);
    await page.waitForTimeout(1500);
  };

  // 1. Transports: Register Freight Trip Drawer
  try {
    console.log('1. Capturing Transports Freight Drawer...');
    await switchTab('Transport');
    const addBtn = await page.$('button:has-text("Register Freight Trip"), button:has-text("Freight Trip"), .btn-action-primary');
    if (addBtn && await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(outDir, 'modal_transports_freight_drawer.png'), fullPage: false });
      console.log('  Saved: modal_transports_freight_drawer.png');
      const closeBtn = await page.$('.btn-drawer-close, .drawer-backdrop, button:has-text("Cancel")');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(600);
    } else {
      console.log('  Could not find register freight trip button');
    }
  } catch (err) {
    console.log('  Transports error:', err.message);
  }

  // 2. Drivers: Enroll Commercial Driver Drawer
  try {
    console.log('2. Capturing Drivers Enroll Drawer...');
    await switchTab('Drivers');
    const enrollBtn = await page.$('button:has-text("Enroll Commercial Driver"), button:has-text("Enroll Driver"), .btn-action-primary');
    if (enrollBtn && await enrollBtn.isVisible()) {
      await enrollBtn.click();
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(outDir, 'modal_drivers_enroll_drawer.png'), fullPage: false });
      console.log('  Saved: modal_drivers_enroll_drawer.png');
      const closeBtn = await page.$('.btn-drawer-close, .drawer-backdrop, button:has-text("Cancel")');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(600);
    } else {
      console.log('  Could not find enroll driver button');
    }
  } catch (err) {
    console.log('  Drivers error:', err.message);
  }

  // 3. Parties: Register Commercial Party / Add Party Form
  try {
    console.log('3. Capturing Parties Form / Detail Drawer...');
    await switchTab('Parties');
    const addPartyBtn = await page.$('button:has-text("+ Add Party"), button:has-text("Add Party")');
    if (addPartyBtn && await addPartyBtn.isVisible()) {
      await addPartyBtn.click();
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(outDir, 'modal_parties_detail_drawer.png'), fullPage: false });
      console.log('  Saved: modal_parties_detail_drawer.png');
    }
  } catch (err) {
    console.log('  Parties error:', err.message);
  }

  // 4. Invoices: Create Invoice Drawer / Preview
  try {
    console.log('4. Capturing Invoices Create Drawer...');
    await switchTab('Invoices');
    const createInvBtn = await page.$('.btn-create-invoice, button:has-text("Create Invoice")');
    if (createInvBtn && await createInvBtn.isVisible()) {
      await createInvBtn.click();
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(outDir, 'modal_invoices_create_drawer.png'), fullPage: false });
      console.log('  Saved: modal_invoices_create_drawer.png');
    }
  } catch (err) {
    console.log('  Invoices error:', err.message);
  }

  // 5. Billing Hub: Invoice & Challan view
  try {
    console.log('5. Capturing Billing Hub Document Mode...');
    await switchTab('Billing');
    await page.waitForTimeout(1200);
    const challanTab = await page.$('button:has-text("Delivery Challan"), .doc-tab:has-text("Challan")');
    if (challanTab && await challanTab.isVisible()) {
      await challanTab.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(outDir, 'modal_billing_hub_challan_mode.png'), fullPage: false });
      console.log('  Saved: modal_billing_hub_challan_mode.png');
    }
  } catch (err) {
    console.log('  Billing Hub error:', err.message);
  }

  console.log('\n🎉 ALL TARGETED MODALS AND DRAWERS CAPTURED!');
  await browser.close();
  process.exit(0);
})().catch(err => {
  console.error('Crawler failed:', err);
  process.exit(1);
});
