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

  await page.route(url => url.pathname.includes('/salaries'), route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1, monthYear: '2025-01', employeeName: 'Ramesh Kadam', role: 'Operator', basicSalary: 28000, deductions: 500, bonus: 2000, netSalary: 29500, paymentStatus: 'PAID', paymentDate: '2025-02-05' },
      { id: 2, monthYear: '2025-01', employeeName: 'Sunil Patil', role: 'Quality', basicSalary: 32000, deductions: 0, bonus: 1500, netSalary: 33500, paymentStatus: 'PAID', paymentDate: '2025-02-05' }
    ]) });
  });

  // Seed storage
  await page.addInitScript(() => {
    const mockUser = {
      id: 1,
      name: 'Executive Director',
      role: 'ADMIN',
      companyId: 1,
      tenantId: 'futane_agro_hq',
      token: 'fake-jwt-token'
    };
    window.localStorage.setItem('auth_user', JSON.stringify(mockUser));
    window.localStorage.setItem('currentUser', JSON.stringify(mockUser));
    window.localStorage.setItem('token', 'fake-jwt-token');
  });

  const artifactDir = 'C:\\Users\\Vedant\\.gemini\\antigravity-ide\\brain\\31dd588e-fd68-4426-9deb-3030e10b9d4e';

  console.log('1. Navigating to Drivers...');
  await page.goto('http://localhost:4200/drivers', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('app-root');
  await page.waitForTimeout(1000);

  // Take screenshot of Drivers page with unified toolbar
  await page.screenshot({ path: path.join(artifactDir, 'jio_yono_drivers_toolbar.png'), fullPage: false });
  console.log('Saved jio_yono_drivers_toolbar.png');

  // Try clicking the Register Driver button
  const registerBtn = await page.locator('button:has-text("Register Driver"), button:has-text("Add Driver"), .btn-action-primary').first();
  if (await registerBtn.isVisible()) {
    console.log('Clicking Register Driver button...');
    await registerBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(artifactDir, 'jio_yono_drivers_drawer.png'), fullPage: false });
    console.log('Saved jio_yono_drivers_drawer.png');
  }

  console.log('2. Navigating to Salaries...');
  await page.goto('http://localhost:4200/salaries', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('app-root');
  await page.waitForTimeout(1000);

  const salaryBtn = await page.locator('button:has-text("New Voucher"), button:has-text("Add Salary"), .btn-action-primary').first();
  if (await salaryBtn.isVisible()) {
    console.log('Clicking New Voucher button...');
    await salaryBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(artifactDir, 'jio_yono_salaries_drawer.png'), fullPage: false });
    console.log('Saved jio_yono_salaries_drawer.png');
  }

  await browser.close();
  console.log('All drawer & modal screenshots captured successfully!');
})();
