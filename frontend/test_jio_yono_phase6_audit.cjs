const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Mock API endpoints
  await page.route(url => url.pathname.includes('/drivers'), route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1, driverName: 'Sanjay Shinde', mobile: '9822011223', licenseNumber: 'MH42 20180019283', licenseExpiry: '2028-11-20', status: 'ACTIVE', vehicleAssigned: 'MH 42 T 4821', address: 'Baramati MIDC' },
      { id: 2, driverName: 'Pravin Pawar', mobile: '9848033445', licenseNumber: 'MH12 20150098231', licenseExpiry: '2026-05-14', status: 'ON_TRIP', vehicleAssigned: 'MH 12 Q 9920', address: 'Indapur Phata' },
      { id: 3, driverName: 'Ganesh More', mobile: '9890044556', licenseNumber: 'MH42 20200034125', licenseExpiry: '2030-08-01', status: 'ACTIVE', vehicleAssigned: 'MH 42 B 1204', address: 'Daund Road' }
    ]) });
  });

  await page.route(url => url.pathname.includes('/machines'), route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1, machineCode: 'IMM-01', machineName: 'Engel Victory 330T', capacityPerHour: 450, installedDate: '2021-03-15', status: 'Running', notes: 'Primary unit for 20kg crates' },
      { id: 2, machineCode: 'IMM-02', machineName: 'Haitian Mars II 280T', capacityPerHour: 380, installedDate: '2022-07-20', status: 'Running', notes: 'Tomato crate specialist' },
      { id: 3, machineCode: 'IMM-03', machineName: 'Toshiba IS 350GT', capacityPerHour: 420, installedDate: '2023-01-10', status: 'Under Maintenance', notes: 'Scheduled oil change' }
    ]) });
  });

  await page.route(url => url.pathname.includes('/dispatch'), route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1, dispatchDate: '2025-02-22', challanNumber: 'DC-2025-089', partyName: 'Adani Agri Fresh Logistics', vehicleNumber: 'MH 42 T 4821', driverName: 'Sanjay Shinde', totalQuantity: 1200, status: 'IN_TRANSIT' },
      { id: 2, dispatchDate: '2025-02-23', challanNumber: 'DC-2025-090', partyName: 'Heritage Foods Retail Ltd.', vehicleNumber: 'MH 12 Q 9920', driverName: 'Pravin Pawar', totalQuantity: 850, status: 'DELIVERED' }
    ]) });
  });

  await page.route(url => url.pathname.includes('/expenses'), route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1, expenseDate: '2025-02-20', category: 'Electricity', amount: 145000, paymentMode: 'NEFT', paidTo: 'MSEDCL Baramati Circle', description: 'Factory Plant HT Electricity Bill' },
      { id: 2, expenseDate: '2025-02-21', category: 'Maintenance', amount: 32500, paymentMode: 'UPI', paidTo: 'Hydrotech Seals Pune', description: 'Hydraulic cylinder seal kit' },
      { id: 3, expenseDate: '2025-02-22', category: 'Fuel', amount: 18400, paymentMode: 'Company Card', paidTo: 'HPCL Fuel Station Indapur', description: 'Diesel for plant logistics trucks' }
    ]) });
  });

  await page.route(url => url.pathname.includes('/salaries'), route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1, monthYear: '2025-01', employeeName: 'Ramesh Kadam', role: 'Operator', basicSalary: 28000, deductions: 500, bonus: 2000, netSalary: 29500, paymentStatus: 'PAID', paymentDate: '2025-02-05' },
      { id: 2, monthYear: '2025-01', employeeName: 'Sunil Patil', role: 'Quality', basicSalary: 32000, deductions: 0, bonus: 1500, netSalary: 33500, paymentStatus: 'PAID', paymentDate: '2025-02-05' }
    ]) });
  });

  await page.route(url => url.pathname.includes('/parties'), route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1, partyName: 'Adani Agri Fresh Logistics', partyType: 'CUSTOMER', contactPerson: 'Vikram Mehta', mobile: '9820099881', city: 'Baramati', currentBalance: 320000, creditLimit: 1000000 },
      { id: 2, partyName: 'Heritage Foods Retail Ltd.', partyType: 'CUSTOMER', contactPerson: 'Kalyan Rao', mobile: '9848012345', city: 'Indapur', currentBalance: 185000, creditLimit: 500000 }
    ]) });
  });

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
    localStorage.setItem('jwtToken', 'mock-jwt-jio-yono-audit');
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    sessionStorage.setItem('jwtToken', 'mock-jwt-jio-yono-audit');
  });

  console.log('Connecting to dev server http://localhost:4200 ...');
  await page.goto('http://localhost:4200/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForSelector('app-root', { timeout: 15000 });
  await page.waitForTimeout(2000);
  console.log('Connected successfully!');

  const outDir = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e';

  // Helper tab switcher
  const switchTab = async (tabName) => {
    await page.evaluate((t) => {
      const scope = window.ng?.getComponent?.(document.querySelector('app-root'));
      if (scope && scope.switchTab) {
        scope.switchTab(t);
      } else {
        const navItems = Array.from(document.querySelectorAll('app-sidebar li, app-sidebar button, .nav-item'));
        const item = navItems.find(el => el.textContent && el.textContent.toLowerCase().includes(t.toLowerCase()));
        if (item) item.click();
      }
    }, tabName);
    await page.waitForTimeout(1400);
  };

  // 1. Drivers Directory
  console.log('Capturing jio_yono_drivers.png...');
  await switchTab('drivers');
  await page.screenshot({ path: path.join(outDir, 'jio_yono_drivers.png'), fullPage: false });

  // 2. Machines & Factory Assets
  console.log('Capturing jio_yono_machines.png...');
  await switchTab('machines');
  await page.screenshot({ path: path.join(outDir, 'jio_yono_machines.png'), fullPage: false });

  // 3. Dispatch Logistics
  console.log('Capturing jio_yono_dispatch.png...');
  await switchTab('dispatch');
  await page.screenshot({ path: path.join(outDir, 'jio_yono_dispatch.png'), fullPage: false });

  // 4. Expenses & Cost Center
  console.log('Capturing jio_yono_expenses.png...');
  await switchTab('expenses');
  await page.screenshot({ path: path.join(outDir, 'jio_yono_expenses.png'), fullPage: false });

  // 5. Salaries & Payroll
  console.log('Capturing jio_yono_salaries.png...');
  await switchTab('salaries');
  await page.screenshot({ path: path.join(outDir, 'jio_yono_salaries.png'), fullPage: false });

  // 6. Parties & Wholesalers
  console.log('Capturing jio_yono_party.png...');
  await switchTab('parties');
  await page.screenshot({ path: path.join(outDir, 'jio_yono_party.png'), fullPage: false });

  console.log('🎉 All Jio & YONO Phase 6 visual screenshots captured successfully!');
  await browser.close();
})().catch(err => {
  console.error('Audit run error:', err);
  process.exit(1);
});
