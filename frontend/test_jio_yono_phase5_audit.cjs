const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Mock API endpoints
  await page.route(url => url.pathname.includes('/employees'), route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1, employeeId: 'EMP-001', name: 'Ramesh Kadam', role: 'Operator', contact: '9820011223', salary: 28000, joiningDate: '2023-04-10', aadhaarNumber: '1234-5678-9012', bankAccount: 'SBI 20491029384', address: 'Plot 42, MIDC, Baramati' },
      { id: 2, employeeId: 'EMP-002', name: 'Sunil Patil', role: 'Quality', contact: '9848022334', salary: 32000, joiningDate: '2023-06-15', aadhaarNumber: '2345-6789-0123', bankAccount: 'HDFC 50100293847', address: 'Flat 12, Shiv Colony, Baramati' },
      { id: 3, employeeId: 'EMP-003', name: 'Ajay Shinde', role: 'Warehouse', contact: '9890033445', salary: 24000, joiningDate: '2024-01-20', aadhaarNumber: '3456-7890-1234', bankAccount: 'BOI 10293847561', address: 'Near Bus Stand, Indapur' },
      { id: 4, employeeId: 'EMP-004', name: 'Mahesh Jadhav', role: 'Maintenance', contact: '9765044556', salary: 35000, joiningDate: '2022-11-01', aadhaarNumber: '4567-8901-2345', bankAccount: 'ICICI 00192837465', address: 'MIDC Phase 2, Baramati' }
    ]) });
  });

  await page.route(url => url.pathname.includes('/vendors'), route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1, name: 'Reliance Polymers Ltd.', contactPerson: 'Arun Verma', mobile: '9820123456', polymerGrade: 'PPCP Injection Grade 030M', currentBalance: 450000, address: 'Dabhol Petrochemicals, Ratnagiri' },
      { id: 2, name: 'IOCL Petrochemicals', contactPerson: 'Rajesh Sharma', mobile: '9833098765', polymerGrade: 'PPCP 1110MAS', currentBalance: 320000, address: 'Panipat Complex, Haryana' }
    ]) });
  });

  await page.route(url => url.pathname.includes('/raw-materials'), route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1, date: '2025-02-20', vendorName: 'Reliance Polymers Ltd.', invoiceNumber: 'INV-REL-992', grade: 'PPCP 030M', quantityBags: 200, netWeightKg: 5000, ratePerKg: 104, totalAmount: 520000 },
      { id: 2, date: '2025-02-21', vendorName: 'IOCL Petrochemicals', invoiceNumber: 'INV-IOC-441', grade: 'PPCP 1110MAS', quantityBags: 160, netWeightKg: 4000, ratePerKg: 102, totalAmount: 408000 }
    ]) });
  });

  await page.route(url => url.pathname.includes('/sales'), route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1, billDate: '2025-02-18', billNumber: 'INV-1001', partyName: 'Adani Agri Fresh Logistics', party: { partyName: 'Adani Agri Fresh Logistics', mobile: '9820099881' }, quantity: 450, totalAmount: 71136, paidAmount: 0, remaining: 71136 },
      { id: 2, billDate: '2025-02-19', billNumber: 'INV-1002', partyName: 'Heritage Foods Retail Ltd.', party: { partyName: 'Heritage Foods Retail Ltd.', mobile: '9848012345' }, quantity: 380, totalAmount: 57024, paidAmount: 0, remaining: 57024 }
    ]) });
  });

  await page.route(url => url.pathname.includes('/ppd'), route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1, date: '2025-02-22', shift: 'Morning Shift', machineCode: 'IMM-01', itemName: 'Apple Crate 20kg', operatorName: 'Ramesh Kadam', quantity: 820, rejectedQuantity: 4 }
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
  let connected = false;
  for (let i = 0; i < 30; i++) {
    try {
      await page.goto('http://localhost:4200/', { waitUntil: 'networkidle', timeout: 8000 });
      connected = true;
      console.log('Connected successfully!');
      break;
    } catch (e) {
      console.log(`Waiting for server... (${i + 1}/30)`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  if (!connected) throw new Error('Could not connect to dev server');

  try {
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      const overlay = document.querySelector('vite-error-overlay');
      if (overlay) overlay.remove();
    });
  } catch (e) {}

  const outDir = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e';

  // Helper tab switcher
  const switchTab = async (tabName) => {
    await page.evaluate((t) => {
      const scope = window.ng?.getComponent?.(document.querySelector('app-root'));
      if (scope && scope.switchTab) {
        scope.switchTab(t);
      } else {
        const navItems = Array.from(document.querySelectorAll('app-sidebar li'));
        const item = navItems.find(el => el.textContent && el.textContent.toLowerCase().includes(t.toLowerCase()));
        if (item) item.click();
      }
    }, tabName);
    await page.waitForTimeout(1000);
  };

  // 1. Employees Directory
  console.log('Capturing jio_yono_employees.png...');
  await switchTab('employees');
  await page.screenshot({ path: path.join(outDir, 'jio_yono_employees.png'), fullPage: false });

  // 2. Production & Manufacturing
  console.log('Capturing jio_yono_production.png...');
  await switchTab('production');
  await page.screenshot({ path: path.join(outDir, 'jio_yono_production.png'), fullPage: false });

  // 3. Inventory & Finished Stock
  console.log('Capturing jio_yono_inventory.png...');
  await switchTab('inventory');
  await page.screenshot({ path: path.join(outDir, 'jio_yono_inventory.png'), fullPage: false });

  // 4. Polymer Vendors
  console.log('Capturing jio_yono_vendors.png...');
  await switchTab('vendors');
  await page.screenshot({ path: path.join(outDir, 'jio_yono_vendors.png'), fullPage: false });

  // 5. Raw Materials Inventory
  console.log('Capturing jio_yono_raw_materials.png...');
  await switchTab('raw-materials');
  await page.screenshot({ path: path.join(outDir, 'jio_yono_raw_materials.png'), fullPage: false });

  console.log('All Jio & YONO Phase 5 visual screenshots captured successfully!');
  await browser.close();
})().catch(err => {
  console.error('Audit run error:', err);
  process.exit(1);
});
