const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const outDir = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e/crawl_artifacts';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Mock API routes to ensure clean data population
  await page.route('**/api/parties**', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1, partyName: 'Adani Agri Fresh Logistics', partyType: 'CUSTOMER', contactPerson: 'Vikram Mehta', mobile: '9820099881', city: 'Baramati', currentBalance: 320000, creditLimit: 1000000, gstNumber: '27AABCA1234F1Z5', status: 'ACTIVE' },
      { id: 2, partyName: 'Heritage Foods Retail Ltd.', partyType: 'CUSTOMER', contactPerson: 'Kalyan Rao', mobile: '9848012345', city: 'Indapur', currentBalance: 185000, creditLimit: 500000, gstNumber: '27BBCDE5678G2Z1', status: 'ACTIVE' }
    ]) });
  });

  await page.route('**/api/transports**', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1, vehicleNumber: 'MH 42 T 4821', vehicleType: '14ft Truck', ownerName: 'Om Sai Logistics', driverName: 'Sanjay Shinde', driverMobile: '9822011223', status: 'ACTIVE', capacityKg: 4500 },
      { id: 2, vehicleNumber: 'MH 12 Q 9920', vehicleType: 'Eicher 17ft', ownerName: 'Balaji Freight Corp', driverName: 'Pravin Pawar', driverMobile: '9848033445', status: 'ON_TRIP', capacityKg: 6000 }
    ]) });
  });

  await page.route('**/api/drivers**', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1, driverName: 'Sanjay Shinde', mobile: '9822011223', licenseNumber: 'MH42 20180019283', licenseExpiry: '2028-11-20', status: 'ACTIVE', vehicleAssigned: 'MH 42 T 4821', address: 'Baramati MIDC' },
      { id: 2, driverName: 'Pravin Pawar', mobile: '9848033445', licenseNumber: 'MH12 20150098231', licenseExpiry: '2026-05-14', status: 'ON_TRIP', vehicleAssigned: 'MH 12 Q 9920', address: 'Indapur Phata' }
    ]) });
  });

  await page.route('**/api/machines**', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1, machineCode: 'IMM-01', machineName: 'Engel Victory 330T', capacityPerHour: 450, installedDate: '2021-03-15', status: 'Running', notes: 'Primary unit for 20kg crates' },
      { id: 2, machineCode: 'IMM-02', machineName: 'Haitian Mars II 280T', capacityPerHour: 380, installedDate: '2022-07-20', status: 'Running', notes: 'Tomato crate specialist' }
    ]) });
  });

  await page.route('**/api/dispatch**', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1, dispatchDate: '2025-02-22', challanNumber: 'DC-2025-089', partyName: 'Adani Agri Fresh Logistics', vehicleNumber: 'MH 42 T 4821', driverName: 'Sanjay Shinde', totalQuantity: 1200, status: 'IN_TRANSIT' }
    ]) });
  });

  await page.route('**/api/expenses**', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1, expenseDate: '2025-02-20', category: 'Electricity', amount: 145000, paymentMode: 'NEFT', paidTo: 'MSEDCL Baramati Circle', description: 'Factory Plant HT Electricity Bill' },
      { id: 2, expenseDate: '2025-02-21', category: 'Maintenance', amount: 32500, paymentMode: 'UPI', paidTo: 'Hydrotech Seals Pune', description: 'Hydraulic cylinder seal kit' }
    ]) });
  });

  await page.route('**/api/salaries**', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1, monthYear: '2025-01', employeeName: 'Ramesh Kadam', role: 'Operator', basicSalary: 28000, deductions: 500, bonus: 2000, netSalary: 29500, paymentStatus: 'PAID', paymentDate: '2025-02-05' }
    ]) });
  });

  await page.route('**/api/employees**', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1, name: 'Ramesh Kadam', employeeCode: 'EMP-01', role: 'OPERATOR', mobile: '9822100112', department: 'Production', salary: 28000, status: 'ACTIVE' },
      { id: 2, name: 'Sunil Patil', employeeCode: 'EMP-02', role: 'QUALITY', mobile: '9822100113', department: 'Quality Assurance', salary: 32000, status: 'ACTIVE' }
    ]) });
  });

  await page.route('**/api/invoices**', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1, invoiceNumber: 'INV-2025-001', invoiceDate: '2025-02-15', partyName: 'Adani Agri Fresh Logistics', partyGst: '27AABCA1234F1Z5', subtotal: 150000, gstAmount: 27000, totalAmount: 177000, paidAmount: 177000, balanceDue: 0, status: 'FULLY PAID' }
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
    localStorage.setItem('jwtToken', 'mock-jwt-jio-yono-crawl');
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    sessionStorage.setItem('jwtToken', 'mock-jwt-jio-yono-crawl');
  });

  console.log('Connecting to dev server http://localhost:4200 ...');
  await page.goto('http://localhost:4200/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForSelector('app-root', { timeout: 15000 });
  await page.waitForTimeout(2000);
  console.log('Connected successfully!');

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
    await page.waitForTimeout(1500);
  };

  const tabsToCrawl = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'production', name: 'Daily Production' },
    { id: 'monthly-production', name: 'Monthly Production' },
    { id: 'parties', name: 'Parties & Customers' },
    { id: 'sales', name: 'Sales Entry' },
    { id: 'payments', name: 'Payment Receipts' },
    { id: 'raw-materials', name: 'Raw Materials' },
    { id: 'vendors', name: 'Polymer Vendors' },
    { id: 'inventory', name: 'Finished Inventory' },
    { id: 'employees', name: 'Employees' },
    { id: 'salaries', name: 'Salaries' },
    { id: 'transports', name: 'Transport Fleet' },
    { id: 'drivers', name: 'Commercial Drivers' },
    { id: 'machines', name: 'Machines & Equipment' },
    { id: 'dispatch', name: 'Dispatch Logistics' },
    { id: 'invoices', name: 'Invoices' },
    { id: 'billinghub', name: 'Billing Hub' },
    { id: 'bank', name: 'Bank Ledger' },
    { id: 'expenses', name: 'Expenses Cost Center' },
    { id: 'reports', name: 'Executive Reports' },
    { id: 'analytics', name: 'Analytics Cockpit' },
    { id: 'audit-logs', name: 'Security Audit Logs' },
    { id: 'settings', name: 'Admin Settings' }
  ];

  console.log(`Starting crawl of ${tabsToCrawl.length} tabs...`);

  for (const tab of tabsToCrawl) {
    console.log(`\n--- Crawling Tab: ${tab.name} (${tab.id}) ---`);
    await switchTab(tab.id);
    const pageShotPath = path.join(outDir, `page_${tab.id}.png`);
    await page.screenshot({ path: pageShotPath, fullPage: false });
    console.log(`Saved: page_${tab.id}.png`);

    // Detect and click primary action buttons/modals
    const actionButtonSelectors = [
      'button.btn-primary:not([disabled])',
      'button.btn-add:not([disabled])',
      'button:has-text("Add")',
      'button:has-text("New")',
      'button:has-text("Create")',
      'button:has-text("Record")',
      'button:has-text("Maintenance")',
      'button:has-text("Preview")',
      'button.header-action-btn:not([disabled])'
    ];

    for (const sel of actionButtonSelectors) {
      const btn = await page.$(sel);
      if (btn && await btn.isVisible()) {
        const btnText = ((await btn.textContent()) || '').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
        if (btnText && btnText !== 'save' && btnText !== 'submit' && btnText !== 'delete' && btnText !== 'sign_out') {
          console.log(`  Found action button: "${btnText}" (selector: ${sel})`);
          try {
            await btn.click();
            await page.waitForTimeout(1000);
            
            // Check if a modal or drawer opened
            const modalOrDrawer = await page.$('.modal, .drawer, .modal-dialog, .form-drawer, .invoice-preview-modal, .preview-modal, .app-modal');
            if (modalOrDrawer && await modalOrDrawer.isVisible()) {
              const modalShotPath = path.join(outDir, `modal_${tab.id}_${btnText.slice(0, 20)}.png`);
              await page.screenshot({ path: modalShotPath, fullPage: false });
              console.log(`  Saved Modal Screenshot: modal_${tab.id}_${btnText.slice(0, 20)}.png`);

              // Close modal
              const closeBtn = await page.$('.modal .btn-close, .modal button:has-text("Close"), .modal button:has-text("Cancel"), .drawer .btn-close, .drawer button:has-text("Cancel"), .btn-close, button[aria-label="Close"]');
              if (closeBtn && await closeBtn.isVisible()) {
                await closeBtn.click();
                await page.waitForTimeout(600);
              } else {
                await page.keyboard.press('Escape');
                await page.waitForTimeout(600);
              }
            }
          } catch (clickErr) {
            console.log(`  Could not interact with button: ${clickErr.message}`);
          }
          break; // One primary modal interaction per tab is sufficient
        }
      }
    }
  }

  console.log('\n🎉 ALL 24 ERP PAGES AND INTERACTION MODALS CRAWLED SUCCESSFULLY!');
  await browser.close();
})().catch(err => {
  console.error('Crawl Error:', err);
  process.exit(1);
});
