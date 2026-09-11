const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const outDir = 'C:\\Users\\Vedant\\.gemini\\antigravity-ide\\brain\\929ca2c9-cbc5-40f8-b8ee-bc60ac7e3a69';

  // Add auth init script on context BEFORE opening page
  await context.addInitScript(() => {
    const mockUser = {
      id: 1,
      username: 'SUPER_ADMIN',
      name: 'Vedant Mehare',
      role: 'SUPER_ADMIN',
      email: 'admin@futaneagro.com'
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('jwtToken', 'test-token-valid-mock');
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    sessionStorage.setItem('jwtToken', 'test-token-valid-mock');
    sessionStorage.setItem('activeTab', 'salaries');
  });

  const page = await context.newPage();

  const mockEmployees = [
    { id: 1, empName: 'Ramesh Pawar', designation: 'Machine Operator', salary: 18000, phone: '9876543210' },
    { id: 2, empName: 'Sunita Patil', designation: 'Quality Inspector', salary: 19500, phone: '9876543211' },
    { id: 3, empName: 'Ganesh Shinde', designation: 'Warehouse Lead', salary: 22000, phone: '9876543212' },
    { id: 4, empName: 'Amit Deshmukh', designation: 'Maintenance Tech', salary: 20500, phone: '9876543213' },
    { id: 5, empName: 'Priya Kulkarni', designation: 'Accounts Assistant', salary: 25000, phone: '9876543214' }
  ];

  const mockSalaries = [
    {
      id: 101,
      employee: mockEmployees[0],
      employeeId: 1,
      month: 'May',
      year: 2026,
      salaryAmount: 18000,
      status: 'Paid',
      paidDate: '2026-05-01'
    },
    {
      id: 102,
      employee: mockEmployees[1],
      employeeId: 2,
      month: 'May',
      year: 2026,
      salaryAmount: 19500,
      status: 'Paid',
      paidDate: '2026-05-01'
    },
    {
      id: 103,
      employee: mockEmployees[2],
      employeeId: 3,
      month: 'May',
      year: 2026,
      salaryAmount: 22000,
      status: 'Paid',
      paidDate: '2026-05-02'
    },
    {
      id: 104,
      employee: mockEmployees[3],
      employeeId: 4,
      month: 'May',
      year: 2026,
      salaryAmount: 20500,
      status: 'Pending',
      paidDate: null
    },
    {
      id: 105,
      employee: mockEmployees[4],
      employeeId: 5,
      month: 'May',
      year: 2026,
      salaryAmount: 25000,
      status: 'Pending',
      paidDate: null
    },
    {
      id: 106,
      employee: mockEmployees[0],
      employeeId: 1,
      month: 'April',
      year: 2026,
      salaryAmount: 18000,
      status: 'Paid',
      paidDate: '2026-04-01'
    }
  ];

  // Intercept backend API routes
  await page.route(url => url.pathname.includes('/salaries'), route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSalaries)
    });
  });

  await page.route(url => url.pathname.includes('/employees'), route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockEmployees)
    });
  });

  console.log('Navigating to http://localhost:4200 ...');
  await page.goto('http://localhost:4200/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Switch to salaries tab if needed
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('app-sidebar li'));
    const salItem = navItems.find(el => el.textContent && el.textContent.toLowerCase().includes('salar'));
    if (salItem) salItem.click();
  });

  // Wait for salaries module container
  await page.waitForSelector('.salaries-enterprise-container', { timeout: 15000 });
  await page.waitForTimeout(1000);

  // 1. Capture Main View with Mock Data Loaded
  console.log('1. Capturing salaries_main_1440.png...');
  await page.screenshot({
    path: path.join(outDir, 'salaries_main_1440.png'),
    fullPage: false
  });

  // 2. Filter by Pending clearance subtab
  console.log('2. Filtering by Pending Clearance subtab...');
  const pendingSubtab = await page.$('.subtab-pill-btn:has-text("Pending Clearance")');
  if (pendingSubtab) {
    await pendingSubtab.click();
    await page.waitForTimeout(500);
    console.log('Capturing salaries_pending_subtab.png...');
    await page.screenshot({
      path: path.join(outDir, 'salaries_pending_subtab.png'),
      fullPage: false
    });
  }

  // Reset to All Vouchers
  const allSubtab = await page.$('.subtab-pill-btn:has-text("All Vouchers")');
  if (allSubtab) {
    await allSubtab.click();
    await page.waitForTimeout(400);
  }

  // 3. Open Slide-Over Drawer for "+ Create Salary Voucher"
  console.log('3. Opening Create Salary Voucher drawer...');
  const createBtn = await page.$('.btn-action-primary:has-text("Create Salary Voucher")');
  if (createBtn) {
    await createBtn.click();
    await page.waitForTimeout(500);
    console.log('Capturing salaries_create_drawer.png...');
    await page.screenshot({
      path: path.join(outDir, 'salaries_create_drawer.png'),
      fullPage: false
    });

    // Close drawer
    const closeDrawerBtn = await page.$('.btn-drawer-close');
    if (closeDrawerBtn) await closeDrawerBtn.click();
    await page.waitForTimeout(400);
  }

  // 4. Open View Salary Voucher Modal & Printable Slip
  console.log('4. Opening View Salary Voucher modal...');
  const viewBtn = await page.$('.ledger-row .btn-view');
  if (viewBtn) {
    await viewBtn.click();
    await page.waitForTimeout(500);
    console.log('Capturing salaries_view_voucher_modal.png...');
    await page.screenshot({
      path: path.join(outDir, 'salaries_view_voucher_modal.png'),
      fullPage: false
    });

    // Close modal
    const closeModalBtn = await page.$('.modal-header-actions .btn-secondary');
    if (closeModalBtn) await closeModalBtn.click();
    await page.waitForTimeout(400);
  }

  // 5. Test Search & Empty State
  console.log('5. Testing search empty state...');
  const searchInput = await page.$('.toolbar-search-box .search-input');
  if (searchInput) {
    await searchInput.fill('NonExistentStaffMemberXYZ');
    await page.waitForTimeout(500);
    console.log('Capturing salaries_empty_search.png...');
    await page.screenshot({
      path: path.join(outDir, 'salaries_empty_search.png'),
      fullPage: false
    });

    const resetBtn = await page.$('.btn-reset-filters');
    if (resetBtn) {
      await resetBtn.click();
    } else {
      await searchInput.fill('');
    }
    await page.waitForTimeout(400);
  }

  // 6. Test Dark Mode
  console.log('6. Testing Dark Mode...');
  await page.evaluate(() => {
    document.body.classList.add('dark-theme');
    document.body.classList.add('dark-mode');
  });
  await page.waitForTimeout(500);
  console.log('Capturing salaries_dark_mode.png...');
  await page.screenshot({
    path: path.join(outDir, 'salaries_dark_mode.png'),
    fullPage: false
  });

  // Open voucher modal in dark mode
  const viewBtnDark = await page.$('.ledger-row .btn-view');
  if (viewBtnDark) {
    await viewBtnDark.click();
    await page.waitForTimeout(500);
    console.log('Capturing salaries_dark_voucher_modal.png...');
    await page.screenshot({
      path: path.join(outDir, 'salaries_dark_voucher_modal.png'),
      fullPage: false
    });
    const closeModalBtn = await page.$('.modal-header-actions .btn-secondary');
    if (closeModalBtn) await closeModalBtn.click();
    await page.waitForTimeout(400);
  }

  // Restore light mode
  await page.evaluate(() => {
    document.body.classList.remove('dark-theme');
    document.body.classList.remove('dark-mode');
  });

  // 7. Responsive Viewport: Tablet 768px
  console.log('7. Testing Tablet 768px...');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(400);
  const mobileCloseBtn768 = await page.$('.mobile-close-btn, .sidebar-backdrop');
  if (mobileCloseBtn768) {
    await mobileCloseBtn768.click();
    await page.waitForTimeout(300);
  }
  console.log('Capturing salaries_responsive_768.png...');
  await page.screenshot({
    path: path.join(outDir, 'salaries_responsive_768.png'),
    fullPage: false
  });

  // 8. Responsive Viewport: Mobile 390px
  console.log('8. Testing Mobile 390px...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const btn = document.querySelector('.mobile-close-btn');
    if (btn) (btn).click();
    const backdrop = document.querySelector('.sidebar-backdrop');
    if (backdrop) (backdrop).click();
  });
  await page.waitForTimeout(300);
  console.log('Capturing salaries_responsive_390.png...');
  await page.screenshot({
    path: path.join(outDir, 'salaries_responsive_390.png'),
    fullPage: false
  });

  console.log('All Playwright tests and screenshots completed successfully!');
  await browser.close();
})();
