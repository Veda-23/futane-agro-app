const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const mockSales = [
    { id: 1, party: { id: 101, partyName: 'Sai Dairy Farm & Chilling Center', address: 'Plot 12, MIDC Shiroli, Kolhapur' }, crateType: 'Milk Pouch Crate 12L', quantity: 350, date: '2025-02-18', totalAmount: 45500 },
    { id: 2, party: { id: 102, partyName: 'Krishna Agro Logistics Pvt Ltd', address: 'Gate 4, Market Yard, Sangli' }, crateType: 'Heavy Industrial Crate', quantity: 500, date: '2025-02-19', totalAmount: 75000 },
    { id: 3, party: { id: 103, partyName: 'Gokul Milk Co-operative Union', address: 'Subhash Nagar, Karad' }, crateType: 'Milk Pouch Crate 12L', quantity: 600, date: '2025-02-20', totalAmount: 78000 },
    { id: 4, party: { id: 104, partyName: 'Mahalaxmi Fruit & Vegetable Depot', address: 'Shop 8, APMC Market, Ichalkaranji' }, crateType: 'Vented Vegetable Crate', quantity: 400, date: '2025-02-21', totalAmount: 48000 },
    { id: 5, party: { id: 105, partyName: 'Warana Dairy & Agro Products', address: 'Warananagar Industrial Area, Kolhapur' }, crateType: 'Standard Solid Crate', quantity: 250, date: '2025-02-22', totalAmount: 32500 }
  ];

  const mockDispatches = [
    {
      id: 1,
      sale: mockSales[0],
      saleId: 1,
      dispatchDate: '2025-02-18',
      vehicleNumber: 'MH-12-RN-4819',
      driverName: 'Sanjay B. Shinde',
      deliveryAddress: 'Plot 12, MIDC Shiroli, Kolhapur',
      dispatchStatus: 'Delivered'
    },
    {
      id: 2,
      sale: mockSales[1],
      saleId: 2,
      dispatchDate: '2025-02-19',
      vehicleNumber: 'MH-09-CV-1092',
      driverName: 'Anil R. Kadam',
      deliveryAddress: 'Gate 4, Market Yard, Sangli',
      dispatchStatus: 'In Transit'
    },
    {
      id: 3,
      sale: mockSales[2],
      saleId: 3,
      dispatchDate: '2025-02-20',
      vehicleNumber: 'MH-12-PQ-7721',
      driverName: 'Pravin S. Jadhav',
      deliveryAddress: 'Subhash Nagar, Karad',
      dispatchStatus: 'In Transit'
    },
    {
      id: 4,
      sale: mockSales[3],
      saleId: 4,
      dispatchDate: '2025-02-21',
      vehicleNumber: 'MH-14-BT-3310',
      driverName: 'Sunil D. Bhosale',
      deliveryAddress: 'Shop 8, APMC Market, Ichalkaranji',
      dispatchStatus: 'Pending'
    }
  ];

  // Intercept backend API routes
  await page.route(url => url.pathname.includes('/sales'), route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSales)
    });
  });

  await page.route(url => url.pathname.includes('/dispatches'), route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockDispatches)
    });
  });

  // Seed authenticated user into storage
  await page.addInitScript(() => {
    const mockUser = {
      id: 1,
      username: 'admin',
      name: 'Vedant Mehare',
      role: 'SUPER_ADMIN',
      email: 'admin@futaneagro.com'
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('jwtToken', 'mock-jwt-token-dispatch-audit');
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    sessionStorage.setItem('jwtToken', 'mock-jwt-token-dispatch-audit');
  });

  console.log('Navigating to http://localhost:4200 ...');
  await page.goto('http://localhost:4200/', { waitUntil: 'networkidle', timeout: 30000 });

  // Dismiss any overlay
  try {
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      const overlay = document.querySelector('vite-error-overlay');
      if (overlay) overlay.remove();
    });
  } catch (e) {}

  // Switch to dispatch tab
  console.log('Switching to dispatch tab...');
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('app-sidebar li'));
    const dispatchItem = navItems.find(el => el.textContent && el.textContent.toLowerCase().includes('dispatch'));
    if (dispatchItem) {
      dispatchItem.click();
    } else {
      const scope = window.ng?.getComponent?.(document.querySelector('app-root'));
      if (scope && scope.switchTab) scope.switchTab('dispatch');
    }
  });

  // Wait for dispatch module container
  await page.waitForSelector('.dispatch-module-container', { timeout: 10000 });
  await page.waitForTimeout(1200);

  const outDir = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e';

  // 1. Capture Main View
  console.log('Capturing dispatch_redesign_main.png...');
  await page.screenshot({
    path: path.join(outDir, 'dispatch_redesign_main.png'),
    fullPage: false
  });

  // 2. Status Filter: In Transit
  console.log('Filtering by In Transit...');
  const transitPill = page.locator('.status-pill-btn', { hasText: 'In Transit' });
  if (await transitPill.isVisible()) {
    await transitPill.click();
    await page.waitForTimeout(800);
  }
  console.log('Capturing dispatch_status_filter.png...');
  await page.screenshot({
    path: path.join(outDir, 'dispatch_status_filter.png'),
    fullPage: false
  });

  // 3. Search Empty State
  console.log('Testing search empty state...');
  const searchInput = page.locator('.table-search-input');
  if (await searchInput.isVisible()) {
    await searchInput.fill('NonExistentTruckXYZ');
    await page.waitForTimeout(800);
  }
  console.log('Capturing dispatch_empty_state.png...');
  await page.screenshot({
    path: path.join(outDir, 'dispatch_empty_state.png'),
    fullPage: false
  });

  // Restore filter
  if (await searchInput.isVisible()) {
    await searchInput.fill('');
    await page.waitForTimeout(400);
  }
  const allPill = page.locator('.status-pill-btn', { hasText: 'All' });
  if (await allPill.isVisible()) {
    await allPill.click();
    await page.waitForTimeout(600);
  }

  // 4. Edit Mode Active
  console.log('Activating Edit Mode on first dispatch manifest...');
  const editBtn = page.locator('.btn-edit').first();
  if (await editBtn.isVisible({ timeout: 3000 })) {
    await editBtn.click();
    await page.waitForTimeout(800);
  }
  console.log('Capturing dispatch_edit_mode.png...');
  await page.screenshot({
    path: path.join(outDir, 'dispatch_edit_mode.png'),
    fullPage: false
  });

  console.log('Dispatch visual audit successfully completed!');
  await browser.close();
})().catch(err => {
  console.error('Audit run error:', err);
  process.exit(1);
});
