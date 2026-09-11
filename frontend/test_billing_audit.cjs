const { chromium } = require('@playwright/test');
const path = require('path');
const ARTIFACTS = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e';

(async () => {
  console.log('🚀 Running comprehensive visual audit for Billing Hub...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  await context.addInitScript(() => {
    localStorage.setItem('user', JSON.stringify({ username: 'SUPER_ADMIN', role: 'SUPER_ADMIN' }));
    localStorage.setItem('jwtToken', 'test-token-valid-mock');
    sessionStorage.setItem('user', JSON.stringify({ username: 'SUPER_ADMIN', role: 'SUPER_ADMIN' }));
    sessionStorage.setItem('jwtToken', 'test-token-valid-mock');
  });

  const page = await context.newPage();

  // Mock API endpoints to provide realistic sample data
  await page.route('**/api/sales**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 101,
          date: '2026-09-08',
          invoiceNo: 'INV-2026-0042',
          partyName: 'Shivaji Agro Traders',
          partyPhone: '+91 98220 12345',
          crateCount: 150,
          ratePerKg: 38.5,
          weightKg: 3000,
          totalAmount: 115500,
          vehicleNo: 'MH-12-AB-9876',
          destination: 'Pune APMC Yard'
        },
        {
          id: 102,
          date: '2026-09-09',
          invoiceNo: 'INV-2026-0043',
          partyName: 'Kisan Fresh Organics',
          partyPhone: '+91 94231 67890',
          crateCount: 80,
          ratePerKg: 42.0,
          weightKg: 1600,
          totalAmount: 67200,
          vehicleNo: 'MH-14-CD-1122',
          destination: 'Mumbai Vashi Mandi'
        }
      ])
    });
  });

  await page.route('**/api/dispatches**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 201,
          dispatchDate: '2026-09-08',
          challanNo: 'DC-2026-0089',
          partyName: 'Shivaji Agro Traders',
          vehicleNo: 'MH-12-AB-9876',
          driverName: 'Santosh Jadhav',
          crateCount: 150,
          grossWeightKg: 3200,
          tareWeightKg: 200,
          netWeightKg: 3000
        }
      ])
    });
  });

  await page.route('**/api/payments**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 301,
          paymentDate: '2026-09-08',
          receiptNo: 'REC-2026-0071',
          partyName: 'Shivaji Agro Traders',
          amount: 50000,
          paymentMode: 'NEFT / RTGS',
          referenceNo: 'UTR98324109823',
          remarks: 'Part payment for INV-2026-0042'
        }
      ])
    });
  });

  await page.route('**/api/raw-materials**', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
  await page.route('**/api/transports**', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
  await page.route('**/api/salaries**', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.goto('http://localhost:4200', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Navigate to Billing Hub
  await page.evaluate(() => {
    const navItem = Array.from(document.querySelectorAll('li, button, a')).find(el => el.textContent && el.textContent.includes('Billing'));
    if (navItem) navItem.click();
  });
  await page.waitForTimeout(1500);

  // 1. Capture Main View with Document Sheet
  const shot1 = path.join(ARTIFACTS, 'billing_hub_redesign_main.png');
  await page.screenshot({ path: shot1, fullPage: false });
  console.log('✅ Shot 1 captured (Main View with Tax Invoice):', shot1);

  // 2. Switch to Delivery Challan tab
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.doc-tab-btn')).find(el => el.textContent && el.textContent.includes('Delivery Challan'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1000);
  const shot2 = path.join(ARTIFACTS, 'billing_hub_delivery_challan.png');
  await page.screenshot({ path: shot2, fullPage: false });
  console.log('✅ Shot 2 captured (Delivery Challan tab):', shot2);

  // 3. Search non-existent to capture empty state
  const searchInput = await page.$('.doc-filter-toolbar .filter-search-field input');
  if (searchInput) {
    await searchInput.fill('ZZZ_NON_EXISTENT_DOCUMENT_999');
    await page.evaluate(() => {
      const input = document.querySelector('.doc-filter-toolbar .filter-search-field input');
      if (input) input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(800);
    const shot3 = path.join(ARTIFACTS, 'billing_hub_empty_state.png');
    await page.screenshot({ path: shot3, fullPage: false });
    console.log('✅ Shot 3 captured (Search Empty State):', shot3);
  }

  await browser.close();
  console.log('🎉 Billing Hub audit finished successfully.');
})();
