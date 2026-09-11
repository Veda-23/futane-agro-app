const { chromium } = require('@playwright/test');
const path = require('path');
const ARTIFACTS = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e';

const sampleTransactions = [
  {
    id: 1,
    transactionDate: '2026-09-08',
    transactionType: 'Credit',
    amount: 150000.00,
    description: 'Client payment received - Shivaji Agro Traders',
    referenceNo: 'NEFT-MAHB-98217342'
  },
  {
    id: 2,
    transactionDate: '2026-09-07',
    transactionType: 'Debit',
    amount: 45000.00,
    description: 'Polymer raw material advance - Reliance Petro',
    referenceNo: 'RTGS-HDFC-09823411'
  },
  {
    id: 3,
    transactionDate: '2026-09-06',
    transactionType: 'Credit',
    amount: 85000.00,
    description: 'Direct sales counter receipt - APMC Crate Batch',
    referenceNo: 'UPI-98234812398@hdfc'
  },
  {
    id: 4,
    transactionDate: '2026-09-05',
    transactionType: 'Debit',
    amount: 18500.00,
    description: 'MSEDCL Factory Electricity Tariff - Substation 3',
    referenceNo: 'BBPS-2026-98124'
  },
  {
    id: 5,
    transactionDate: '2026-09-04',
    transactionType: 'Credit',
    amount: 62000.00,
    description: 'Advance payment - Kisan Organics Pvt Ltd',
    referenceNo: 'IMPS-SBI-55421980'
  },
  {
    id: 6,
    transactionDate: '2026-09-03',
    transactionType: 'Debit',
    amount: 22000.00,
    description: 'Hydraulic Press Maintenance & Oil servicing',
    referenceNo: 'CHQ-004521'
  }
];

(async () => {
  console.log('🚀 Running Playwright visual audit for Bank & Cash Ledger...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  await context.addInitScript(() => {
    localStorage.setItem('user', JSON.stringify({ username: 'SUPER_ADMIN', role: 'SUPER_ADMIN' }));
    localStorage.setItem('jwtToken', 'test-token-valid-mock');
    sessionStorage.setItem('user', JSON.stringify({ username: 'SUPER_ADMIN', role: 'SUPER_ADMIN' }));
    sessionStorage.setItem('jwtToken', 'test-token-valid-mock');
  });

  const page = await context.newPage();

  // Mock bank-transactions API endpoint
  await page.route('**/api/bank-transactions**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sampleTransactions)
    });
  });

  await page.goto('http://localhost:4200', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Navigate to Bank & Cash Ledger tab
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('app-sidebar li'));
    const bankItem = navItems.find(el => el.textContent && el.textContent.toLowerCase().includes('bank'));
    if (bankItem) bankItem.click();
  });
  await page.waitForTimeout(1200);

  // 1. Capture Main Ledger View
  const shot1 = path.join(ARTIFACTS, 'bank_redesign_main.png');
  await page.screenshot({ path: shot1, fullPage: false });
  console.log('✅ Shot 1 captured (Main View with KPIs, Form & Table):', shot1);

  // 2. Click "Credits" filter pill
  await page.evaluate(() => {
    const creditBtn = document.querySelector('.pill-btn.pill-credit');
    if (creditBtn) creditBtn.click();
  });
  await page.waitForTimeout(600);
  const shot2 = path.join(ARTIFACTS, 'bank_credit_filter.png');
  await page.screenshot({ path: shot2, fullPage: false });
  console.log('✅ Shot 2 captured (Credits Filter View):', shot2);

  // 3. Search non-existent query to capture search empty state
  await page.evaluate(() => {
    const allBtn = document.querySelector('.pill-btn:first-child');
    if (allBtn) allBtn.click();
  });
  await page.waitForTimeout(300);

  const searchInput = await page.$('.toolbar-search-input');
  if (searchInput) {
    await searchInput.fill('ZZZ_NON_EXISTENT_TXN_999');
    await page.evaluate(() => {
      const input = document.querySelector('.toolbar-search-input');
      if (input) input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(600);
    const shot3 = path.join(ARTIFACTS, 'bank_empty_state.png');
    await page.screenshot({ path: shot3, fullPage: false });
    console.log('✅ Shot 3 captured (Search Empty State):', shot3);
  }

  // 4. Click edit on first record to test edit state
  if (searchInput) {
    await searchInput.fill('');
    await page.evaluate(() => {
      const input = document.querySelector('.toolbar-search-input');
      if (input) input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(400);
  }

  const editBtn = await page.$('.btn-action-icon.edit-btn');
  if (editBtn) {
    await editBtn.click();
    await page.waitForTimeout(500);
    const shot4 = path.join(ARTIFACTS, 'bank_edit_mode.png');
    await page.screenshot({ path: shot4, fullPage: false });
    console.log('✅ Shot 4 captured (Edit Mode Active):', shot4);
  }

  await browser.close();
  console.log('🎉 Bank ledger visual audit completed successfully.');
})();
