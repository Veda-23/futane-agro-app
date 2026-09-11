const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const mockDrivers = [
    { id: 1, driverName: 'Sanjay B. Shinde', mobile: '9822012345', licenseNumber: 'MH12 20180012345', address: 'Plot 4, MIDC Shiroli, Kolhapur' },
    { id: 2, driverName: 'Anil R. Kadam', mobile: '9822023456', licenseNumber: 'MH09 20190023456', address: 'Kagal MIDC Logistics Hub, Kolhapur' },
    { id: 3, driverName: 'Pravin S. Jadhav', mobile: '9822034567', licenseNumber: 'MH12 20200034567', address: 'Near Toll Plaza, Gokul Shirgaon' },
    { id: 4, driverName: 'Sunil M. Bhosale', mobile: '9822045678', licenseNumber: 'MH09 20210045678', address: 'Gandhinagar Freight Terminal, Kolhapur' },
    { id: 5, driverName: 'Dattatray G. Patil', mobile: '9822056789', licenseNumber: 'MH12 20220056789', address: 'Udyamnagar Transport Nagar, Kolhapur' }
  ];

  const mockTransports = [
    { 
      id: 101, 
      date: '2026-03-01', 
      truckNumber: 'MH-12-RN-4819', 
      rent: 14500, 
      advance: 5000, 
      remaining: 9500, 
      driver: mockDrivers[0]
    },
    { 
      id: 102, 
      date: '2026-03-03', 
      truckNumber: 'MH-09-CV-1092', 
      rent: 12000, 
      advance: 12000, 
      remaining: 0, 
      driver: mockDrivers[1]
    },
    { 
      id: 103, 
      date: '2026-03-04', 
      truckNumber: 'MH-12-PQ-7721', 
      rent: 8500, 
      advance: 3000, 
      remaining: 5500, 
      driver: mockDrivers[2]
    },
    { 
      id: 104, 
      date: '2026-03-06', 
      truckNumber: 'MH-14-BT-3310', 
      rent: 18000, 
      advance: 6000, 
      remaining: 12000, 
      driver: mockDrivers[0]
    },
    { 
      id: 105, 
      date: '2026-03-08', 
      truckNumber: 'MH-09-EM-9988', 
      rent: 9200, 
      advance: 9200, 
      remaining: 0, 
      driver: mockDrivers[3]
    }
  ];

  // Intercept API routes
  await page.route(url => url.pathname.includes('/transports'), route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockTransports)
    });
  });

  await page.route(url => url.pathname.includes('/drivers'), route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockDrivers)
    });
  });

  // Seed authenticated user into browser storage
  await page.addInitScript(() => {
    const mockUser = {
      id: 1,
      username: 'admin',
      name: 'Vedant Mehare',
      role: 'SUPER_ADMIN',
      email: 'admin@futaneagro.com'
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('jwtToken', 'mock-jwt-token-drivers-audit');
    localStorage.removeItem('cols_width_drivers_table');
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    sessionStorage.setItem('jwtToken', 'mock-jwt-token-drivers-audit');
  });

  console.log('Navigating to http://[::1]:4200/ ...');
  await page.goto('http://[::1]:4200/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('.main-content', { timeout: 15000 });
  await page.waitForTimeout(800);

  // Switch to drivers tab
  console.log('Switching to drivers tab...');
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('app-sidebar li'));
    const drItem = navItems.find(el => el.textContent && el.textContent.toLowerCase().includes('driver'));
    if (drItem) {
      drItem.click();
    }
  });

  // Wait for drivers container
  await page.waitForSelector('.drivers-enterprise-container', { timeout: 10000 });
  await page.waitForTimeout(1200);

  const outDir = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/63ae1ca7-044a-4a77-a0c6-a06dc2558ecf';

  // 1. Capture Main Desktop View (1440px)
  console.log('1. Capturing drivers_main_1440.png...');
  await page.screenshot({
    path: path.join(outDir, 'drivers_main_1440.png'),
    fullPage: false
  });

  // 2. Subtab Filter: Active on Trips
  console.log('2. Filtering by Active on Trips subtab...');
  const activeSubtab = await page.$('.subtab-pill-btn:has-text("Active on Trips")');
  if (activeSubtab) {
    await activeSubtab.click();
    await page.waitForTimeout(500);
    console.log('Capturing drivers_active_subtab.png...');
    await page.screenshot({
      path: path.join(outDir, 'drivers_active_subtab.png'),
      fullPage: false
    });
  }

  // Reset to All Drivers
  const allSubtab = await page.$('.subtab-pill-btn:has-text("All Drivers")');
  if (allSubtab) await allSubtab.click();
  await page.waitForTimeout(400);

  // 3. Open Slide-Over Drawer (+ Enroll Commercial Driver)
  console.log('3. Opening Enroll Commercial Driver Drawer...');
  const addBtn = await page.$('.btn-action-primary');
  if (addBtn) {
    await addBtn.click();
    await page.waitForSelector('.slide-drawer', { timeout: 5000 });
    await page.waitForTimeout(600);

    // Enter mock values to show live compliance status gauge
    const nameInput = await page.$('input[name="driverName"]');
    if (nameInput) await nameInput.fill('Kiran V. More');
    const mobileInput = await page.$('input[name="mobile"]');
    if (mobileInput) await mobileInput.fill('9822099999');
    const licenseInput = await page.$('input[name="licenseNumber"]');
    if (licenseInput) await licenseInput.fill('MH12 20230099999');
    const addressInput = await page.$('textarea[name="address"]');
    if (addressInput) await addressInput.fill('MIDC Logistics Park, Satara');
    await page.waitForTimeout(400);

    console.log('Capturing drivers_create_drawer.png...');
    await page.screenshot({
      path: path.join(outDir, 'drivers_create_drawer.png'),
      fullPage: false
    });

    // Close drawer using cancel button
    const closeBtn = await page.$('.btn-drawer-close');
    if (closeBtn) await closeBtn.click();
    await page.waitForSelector('.drawer-backdrop', { state: 'detached', timeout: 5000 });
    await page.waitForTimeout(400);
  }

  // 4. Edit Driver Profile Drawer
  console.log('4. Opening Edit Driver Profile Drawer...');
  const editBtn = await page.$('.enterprise-table tbody tr:first-child .btn-edit');
  if (editBtn) {
    await editBtn.click();
    await page.waitForSelector('.slide-drawer', { timeout: 5000 });
    await page.waitForTimeout(600);

    console.log('Capturing drivers_edit_drawer.png...');
    await page.screenshot({
      path: path.join(outDir, 'drivers_edit_drawer.png'),
      fullPage: false
    });

    // Close drawer
    const closeBtn = await page.$('.btn-drawer-close');
    if (closeBtn) await closeBtn.click();
    await page.waitForSelector('.drawer-backdrop', { state: 'detached', timeout: 5000 });
    await page.waitForTimeout(400);
  }

  // 5. Empty Search State
  console.log('5. Testing search empty state...');
  const searchInput = await page.$('.toolbar-search-box .search-input');
  if (searchInput) {
    await searchInput.fill('XYZ NonExistent Driver 99999');
    await page.waitForTimeout(600);
    console.log('Capturing drivers_empty_search.png...');
    await page.screenshot({
      path: path.join(outDir, 'drivers_empty_search.png'),
      fullPage: false
    });

    const resetBtn = await page.$('.btn-reset-filters');
    if (resetBtn) {
      await resetBtn.click();
    } else {
      await searchInput.fill('');
    }
    await page.waitForTimeout(500);
  }

  // 6. Dark Mode Audit
  console.log('6. Auditing Dark Mode...');
  await page.evaluate(() => {
    document.body.classList.add('dark-theme');
    document.body.classList.add('dark-mode');
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(600);
  console.log('Capturing drivers_dark_mode.png...');
  await page.screenshot({
    path: path.join(outDir, 'drivers_dark_mode.png'),
    fullPage: false
  });

  // Revert dark mode for mobile tests
  await page.evaluate(() => {
    document.body.classList.remove('dark-theme');
    document.body.classList.remove('dark-mode');
    document.documentElement.removeAttribute('data-theme');
  });
  await page.waitForTimeout(400);

  // 7. Responsive Viewport: Tablet (768px)
  console.log('7. Testing Tablet Viewport (768px)...');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const btn = document.querySelector('.mobile-close-btn, .sidebar-backdrop');
    if (btn) btn.click();
  });
  await page.waitForTimeout(400);
  console.log('Capturing drivers_responsive_768.png...');
  await page.screenshot({
    path: path.join(outDir, 'drivers_responsive_768.png'),
    fullPage: false
  });

  // 8. Responsive Viewport: Mobile (390px)
  console.log('8. Testing Mobile Viewport (390px)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  const mobileClose = await page.$('.mobile-close-btn');
  if (mobileClose) {
    try {
      await mobileClose.click({ force: true, timeout: 2000 });
    } catch (e) {}
  }
  await page.waitForTimeout(500);
  console.log('Capturing drivers_responsive_390.png...');
  await page.screenshot({
    path: path.join(outDir, 'drivers_responsive_390.png'),
    fullPage: false
  });

  console.log('All 8 audit steps completed successfully!');
  await browser.close();
})();
