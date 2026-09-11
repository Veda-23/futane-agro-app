const { chromium } = require('@playwright/test');
const path = require('path');
const ARTIFACTS = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e';

const sampleExpenses = [
  {
    id: 1,
    expenseDate: '2026-09-08',
    category: 'Utilities',
    description: 'MSEDCL High-Tension Power Bill - Feeder Line 2',
    amount: 68450.00,
    paidBy: 'Anil Deshmukh (Finance)',
    paymentMode: 'Bank Transfer'
  },
  {
    id: 2,
    expenseDate: '2026-09-07',
    category: 'Maintenance',
    description: 'Injection Moulding Machine 02 Hydraulic Ram Seals & Oil replacement',
    amount: 24500.00,
    paidBy: 'Sunil Patil (Plant Engineer)',
    paymentMode: 'UPI'
  },
  {
    id: 3,
    expenseDate: '2026-09-06',
    category: 'Factory Overhead',
    description: 'Factory floor safety equipment, high-grip gloves & helmet crates',
    amount: 12800.00,
    paidBy: 'Pravin Kale (Admin)',
    paymentMode: 'Cash'
  },
  {
    id: 4,
    expenseDate: '2026-09-05',
    category: 'Office & Admin',
    description: 'ERP server cloud backup lease & high-speed broadband monthly renewal',
    amount: 8500.00,
    paidBy: 'Vedant Mehare (Operations)',
    paymentMode: 'Bank Transfer'
  },
  {
    id: 5,
    expenseDate: '2026-09-04',
    category: 'Transport & Fuel',
    description: 'Diesel fuel bunk refilling for dispatch logistics trucks MH-12 & MH-27',
    amount: 32000.00,
    paidBy: 'Raju Shinde (Logistics)',
    paymentMode: 'UPI'
  },
  {
    id: 6,
    expenseDate: '2026-09-03',
    category: 'Labour',
    description: 'Contract unloading labour charges - Raw material polymer granule bags',
    amount: 9600.00,
    paidBy: 'Sunil Patil (Plant Engineer)',
    paymentMode: 'Cash'
  }
];

(async () => {
  console.log('🚀 Running Playwright visual audit for Expenses Registry & Cost Center...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  await context.addInitScript(() => {
    localStorage.setItem('user', JSON.stringify({ username: 'SUPER_ADMIN', role: 'SUPER_ADMIN' }));
    localStorage.setItem('jwtToken', 'test-token-valid-mock');
    sessionStorage.setItem('user', JSON.stringify({ username: 'SUPER_ADMIN', role: 'SUPER_ADMIN' }));
    sessionStorage.setItem('jwtToken', 'test-token-valid-mock');
  });

  const page = await context.newPage();

  // Mock /api/expenses endpoint
  await page.route('**/api/expenses**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sampleExpenses)
    });
  });

  await page.goto('http://localhost:4200', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Navigate to Expenses tab
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('app-sidebar li'));
    const expItem = navItems.find(el => el.textContent && el.textContent.toLowerCase().includes('expenses'));
    if (expItem) expItem.click();
  });
  await page.waitForTimeout(1200);

  // 1. Capture Main View
  const shot1 = path.join(ARTIFACTS, 'expenses_redesign_main.png');
  await page.screenshot({ path: shot1, fullPage: false });
  console.log('✅ Shot 1 captured (Main View with KPIs, Form & Registry):', shot1);

  // 2. Filter by Utilities category pill
  await page.evaluate(() => {
    const pills = Array.from(document.querySelectorAll('.category-filter-pills .pill-btn'));
    const utilPill = pills.find(p => p.textContent && p.textContent.includes('Utilities'));
    if (utilPill) utilPill.click();
  });
  await page.waitForTimeout(600);
  const shot2 = path.join(ARTIFACTS, 'expenses_category_filter.png');
  await page.screenshot({ path: shot2, fullPage: false });
  console.log('✅ Shot 2 captured (Category Filter: Utilities):', shot2);

  // 3. Reset category filter and search non-existent to trigger empty state
  await page.evaluate(() => {
    const allPill = document.querySelector('.category-filter-pills .pill-btn');
    if (allPill) allPill.click();
  });
  await page.waitForTimeout(300);

  const searchInput = await page.$('.toolbar-search-input');
  if (searchInput) {
    await searchInput.fill('ZZZ_NON_EXISTENT_EXPENSE_999');
    await page.evaluate(() => {
      const input = document.querySelector('.toolbar-search-input');
      if (input) input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(600);
    const shot3 = path.join(ARTIFACTS, 'expenses_empty_state.png');
    await page.screenshot({ path: shot3, fullPage: false });
    console.log('✅ Shot 3 captured (Search Empty State):', shot3);

    // Clear search
    await searchInput.fill('');
    await page.evaluate(() => {
      const input = document.querySelector('.toolbar-search-input');
      if (input) input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(400);
  }

  // 4. Click edit on first voucher to verify Edit Mode
  const editBtn = await page.$('.btn-action-icon.edit-btn');
  if (editBtn) {
    await editBtn.click();
    await page.waitForTimeout(500);
    const shot4 = path.join(ARTIFACTS, 'expenses_edit_mode.png');
    await page.screenshot({ path: shot4, fullPage: false });
    console.log('✅ Shot 4 captured (Edit Mode Active):', shot4);
  }

  await browser.close();
  console.log('🎉 Expenses visual audit completed successfully.');
})();
