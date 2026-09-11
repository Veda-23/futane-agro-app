const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('[BROWSER CONSOLE]', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('[BROWSER PAGE ERROR]', err.message));

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
    },
    { 
      id: 106, 
      date: '2026-03-09', 
      truckNumber: 'MH-12-KL-4455', 
      rent: 16000, 
      advance: 8000, 
      remaining: 8000, 
      driver: mockDrivers[4]
    }
  ];

  await page.route('**/api/drivers', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockDrivers) }));
  await page.route('**/api/transports', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockTransports) }));

  await page.addInitScript(() => {
    const mockUser = {
      id: 1,
      username: 'admin',
      name: 'Admin User',
      role: 'SUPER_ADMIN',
      email: 'admin@futaneagro.com'
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    localStorage.setItem('jwtToken', 'mock-jwt-token-transports-audit');
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    sessionStorage.setItem('currentUser', JSON.stringify(mockUser));
  });

  const outDir = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/63ae1ca7-044a-4a77-a0c6-a06dc2558ecf';

  try {
    console.log('Navigating to http://127.0.0.1:4200/ ...');
    await page.goto('http://127.0.0.1:4200/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.main-content', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Switch to transports tab
    console.log('Switching to transports tab...');
    await page.evaluate(() => {
      const navItems = Array.from(document.querySelectorAll('app-sidebar li'));
      const trItem = navItems.find(el => el.textContent && el.textContent.toLowerCase().includes('transport'));
      if (trItem) trItem.click();
    });

    await page.waitForSelector('.transports-enterprise-container', { timeout: 10000 });
    await page.waitForSelector('.enterprise-table tbody tr', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // 1. Capture Main Desktop View (1440px)
    console.log('1. Capturing transports_main_1440.png...');
    await page.screenshot({
      path: path.join(outDir, 'transports_main_1440.png'),
      fullPage: false
    });

    // 2. Subtab Filter: Settled / Paid in Full
    console.log('2. Filtering by Settled subtab...');
    const settledSubtab = await page.$('.subtab-pill-btn:has-text("Settled / Paid in Full")');
    if (settledSubtab) {
      await settledSubtab.click();
      await page.waitForTimeout(500);
      console.log('Capturing transports_active_subtab.png...');
      await page.screenshot({
        path: path.join(outDir, 'transports_active_subtab.png'),
        fullPage: false
      });
    }

    // Reset to All Haulage Trips
    const allSubtab = await page.$('.subtab-pill-btn:has-text("All Haulage Trips")');
    if (allSubtab) await allSubtab.click();
    await page.waitForTimeout(400);

    // 3. Open Slide-Over Drawer (+ Register Freight Trip)
    console.log('3. Opening Register Freight Trip Drawer...');
    const addBtn = await page.$('.btn-action-primary');
    if (addBtn) {
      await addBtn.click();
      await page.waitForSelector('.slide-drawer', { timeout: 5000 });
      await page.waitForTimeout(600);

      // Enter test values to showcase live settlement calculation
      const truckInput = await page.$('input[name="trTruck"]');
      if (truckInput) await truckInput.fill('MH-12-PQ-9999');
      const driverSelect = await page.$('select[name="trDriver"]');
      if (driverSelect) await driverSelect.selectOption({ index: 1 });
      const rentInput = await page.$('input[name="trRent"]');
      if (rentInput) await rentInput.fill('15000');
      const advInput = await page.$('input[name="trAdv"]');
      if (advInput) await advInput.fill('5000');
      await page.waitForTimeout(500);

      console.log('Capturing transports_create_drawer.png...');
      await page.screenshot({
        path: path.join(outDir, 'transports_create_drawer.png'),
        fullPage: false
      });

      // Close drawer using close button
      const closeBtn = await page.$('.btn-drawer-close');
      if (closeBtn) await closeBtn.click();
      await page.waitForSelector('.drawer-backdrop', { state: 'detached', timeout: 5000 });
      await page.waitForTimeout(400);
    }

    // 4. Edit Transport Record Drawer
    console.log('4. Opening Edit Transport Record Drawer...');
    const editBtn = await page.$('.enterprise-table tbody tr:first-child .btn-edit');
    if (editBtn) {
      await editBtn.click();
      await page.waitForSelector('.slide-drawer', { timeout: 5000 });
      await page.waitForTimeout(600);

      console.log('Capturing transports_edit_drawer.png...');
      await page.screenshot({
        path: path.join(outDir, 'transports_edit_drawer.png'),
        fullPage: false
      });

      const cancelBtn = await page.$('.btn-cancel-drawer');
      if (cancelBtn) await cancelBtn.click();
      await page.waitForSelector('.drawer-backdrop', { state: 'detached', timeout: 5000 });
      await page.waitForTimeout(400);
    }

    // 5. Open Consignment Waybill Modal
    console.log('5. Opening Consignment Waybill Modal...');
    const viewBtn = await page.$('.enterprise-table tbody tr:first-child .btn-view');
    if (viewBtn) {
      await viewBtn.click();
      await page.waitForSelector('.waybill-modal-dialog', { timeout: 5000 });
      await page.waitForTimeout(600);

      console.log('Capturing transports_waybill_modal.png...');
      await page.screenshot({
        path: path.join(outDir, 'transports_waybill_modal.png'),
        fullPage: false
      });

      const modalClose = await page.$('.waybill-modal-header button:last-child');
      if (modalClose) await modalClose.click();
      await page.waitForSelector('.waybill-modal-backdrop', { state: 'detached', timeout: 5000 });
      await page.waitForTimeout(400);
    }

    // 6. Test Empty Search & Filter State
    console.log('6. Testing Empty Search Filter State...');
    const searchInput = await page.$('.toolbar-search-box .search-input');
    if (searchInput) {
      await searchInput.fill('ZZZ-NONEXISTENT-HAULAGE');
      await page.waitForTimeout(600);
      console.log('Capturing transports_empty_search.png...');
      await page.screenshot({
        path: path.join(outDir, 'transports_empty_search.png'),
        fullPage: false
      });

      // Clear search
      const clearBtn = await page.$('.btn-clear-search');
      if (clearBtn) {
        await clearBtn.click();
      } else {
        await searchInput.fill('');
      }
      await page.waitForTimeout(400);
    }

    // 7. Dark Mode View
    console.log('7. Switching to Dark Theme...');
    await page.evaluate(() => {
      document.body.setAttribute('data-theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    });
    await page.waitForTimeout(600);

    console.log('Capturing transports_dark_mode.png...');
    await page.screenshot({
      path: path.join(outDir, 'transports_dark_mode.png'),
      fullPage: false
    });

    // Reset back to light mode for responsive tests
    await page.evaluate(() => {
      document.body.removeAttribute('data-theme');
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    });
    await page.waitForTimeout(400);

    // 8. Tablet Responsive View (768px)
    console.log('8. Testing Tablet Responsive View (768px)...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      const backdrop = document.querySelector('.sidebar-backdrop');
      if (backdrop) backdrop.click();
    });
    await page.waitForTimeout(400);

    console.log('Capturing transports_responsive_768.png...');
    await page.screenshot({
      path: path.join(outDir, 'transports_responsive_768.png'),
      fullPage: false
    });

    // 9. Mobile Responsive View (390px)
    console.log('9. Testing Mobile Responsive View (390px)...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      const backdrop = document.querySelector('.sidebar-backdrop');
      if (backdrop) backdrop.click();
    });
    await page.waitForTimeout(400);

    console.log('Capturing transports_responsive_390.png...');
    await page.screenshot({
      path: path.join(outDir, 'transports_responsive_390.png'),
      fullPage: false
    });

    console.log('✅ ALL AUDIT TESTS COMPLETED SUCCESSFULLY!');

  } catch (err) {
    console.error('❌ Error during transports audit:', err);
  } finally {
    await browser.close();
  }
})();
