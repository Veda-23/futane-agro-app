const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const mockEmployees = [
    { 
      id: 1, 
      empName: 'Ramesh Pawar', 
      designation: 'Machine Operator', 
      salary: 18000, 
      empContact: '9876543210',
      joiningDate: '2024-01-15',
      aadhaarNo: '234567890123',
      bankAccount: 'HDFC0001234 / 50100234567890',
      address: 'Plot 14, MIDC Shiroli, Kolhapur'
    },
    { 
      id: 2, 
      empName: 'Sunita Patil', 
      designation: 'Quality Inspector', 
      salary: 19500, 
      empContact: '9876543211',
      joiningDate: '2024-03-01',
      aadhaarNo: '345678901234',
      bankAccount: 'SBI0004321 / 30987654321',
      address: 'Near Water Tank, Gokul Shirgaon'
    },
    { 
      id: 3, 
      empName: 'Ganesh Shinde', 
      designation: 'Warehouse Lead', 
      salary: 22000, 
      empContact: '9876543212',
      joiningDate: '2023-11-20',
      aadhaarNo: '456789012345',
      bankAccount: 'ICIC0009876 / 123405678901',
      address: 'Shivaji Nagar, Hatkanangale'
    },
    { 
      id: 4, 
      empName: 'Amit Deshmukh', 
      designation: 'Maintenance Tech', 
      salary: 20500, 
      empContact: '9876543213',
      joiningDate: '2024-06-10',
      aadhaarNo: '',
      bankAccount: '',
      address: 'Industrial Colony, Jaysingpur'
    },
    { 
      id: 5, 
      empName: 'Priya Kulkarni', 
      designation: 'Accounts Assistant', 
      salary: 25000, 
      empContact: '9876543214',
      joiningDate: '2024-02-01',
      aadhaarNo: '567890123456',
      bankAccount: 'BARB0POONA / 04560100012345',
      address: 'Tarabai Park, Kolhapur'
    }
  ];

  // Intercept backend API routes (matching both /employees and /api/employees, on any port)
  await page.route(url => url.pathname.includes('/employees'), route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockEmployees)
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
    localStorage.setItem('jwtToken', 'mock-jwt-token-employees-audit');
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    sessionStorage.setItem('jwtToken', 'mock-jwt-token-employees-audit');
  });

  console.log('Navigating to http://localhost:4200 ...');
  await page.goto('http://localhost:4200/', { waitUntil: 'networkidle', timeout: 30000 });

  // Switch to employees tab
  console.log('Switching to employees tab...');
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('app-sidebar li'));
    const empItem = navItems.find(el => el.textContent && el.textContent.toLowerCase().includes('employee'));
    if (empItem) {
      empItem.click();
    }
  });

  // Wait for employees module container
  await page.waitForSelector('.employees-module-container', { timeout: 10000 });
  await page.waitForTimeout(1200);

  const outDir = 'C:\\Users\\Vedant\\.gemini\\antigravity-ide\\brain\\31dd588e-fd68-4426-9deb-3030e10b9d4e';

  // 1. Capture Main View with Mock Data Loaded
  console.log('Capturing employees_redesign_main.png...');
  await page.screenshot({
    path: path.join(outDir, 'employees_redesign_main.png'),
    fullPage: false
  });

  // 2. Filter by Role pill (e.g. Operator)
  console.log('Filtering by Operator role...');
  const opBtn = await page.$('.pill-btn:has-text("Operator")');
  if (opBtn) {
    await opBtn.click();
    await page.waitForTimeout(600);
    console.log('Capturing employees_role_filter.png...');
    await page.screenshot({
      path: path.join(outDir, 'employees_role_filter.png'),
      fullPage: false
    });
  }

  // 3. Reset filters and trigger Search Empty State
  console.log('Testing empty search state...');
  const allBtn = await page.$('.pill-btn:has-text("All")');
  if (allBtn) await allBtn.click();
  await page.waitForTimeout(300);

  const searchInput = await page.$('.toolbar-search-box .search-input');
  if (searchInput) {
    await searchInput.fill('NonExistentStaffMemberXYZ');
    await page.waitForTimeout(600);
    console.log('Capturing employees_empty_state.png...');
    await page.screenshot({
      path: path.join(outDir, 'employees_empty_state.png'),
      fullPage: false
    });
    // Clear search using clear button
    const clearBtn = await page.$('.btn-clear-search');
    if (clearBtn) {
      await clearBtn.click();
    } else {
      await searchInput.fill('');
    }
    await page.waitForTimeout(500);
  }

  // 4. Test Edit Mode
  console.log('Activating Edit Mode for first row...');
  const editBtn = await page.$('.ledger-row .btn-edit');
  if (editBtn) {
    await editBtn.click();
    await page.waitForTimeout(600);
    console.log('Capturing employees_edit_mode.png...');
    await page.screenshot({
      path: path.join(outDir, 'employees_edit_mode.png'),
      fullPage: false
    });
  }

  console.log('Playwright Employees visual audit completed successfully.');
  await browser.close();
})();
