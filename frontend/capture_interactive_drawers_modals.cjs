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
      { id: 1, partyName: 'Adani Agri Fresh Logistics', partyType: 'CUSTOMER', contactPerson: 'Vikram Mehta', mobile: '9820099881', city: 'Baramati', state: 'Maharashtra', currentBalance: 320000, creditLimit: 1000000, gstNumber: '27AABCA1234F1Z5', status: 'ACTIVE' },
      { id: 2, partyName: 'Heritage Foods Retail Ltd.', partyType: 'CUSTOMER', contactPerson: 'Kalyan Rao', mobile: '9848012345', city: 'Indapur', state: 'Maharashtra', currentBalance: 185000, creditLimit: 500000, gstNumber: '27BBCDE5678G2Z1', status: 'ACTIVE' }
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
      { id: 1, driverName: 'Sanjay Shinde', mobile: '9822011223', licenseNumber: 'MH42 20180019283', licenseExpiry: '2028-11-20', status: 'ACTIVE', vehicleAssigned: 'MH 42 T 4821', address: 'Baramati MIDC' }
    ]) });
  });

  await page.route('**/api/invoices**', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1, invoiceNumber: 'INV-2025-001', invoiceNo: 'INV-2025-001', invoiceDate: '2025-02-15', partyName: 'Adani Agri Fresh Logistics', partyGst: '27AABCA1234F1Z5', subtotal: 150000, gstAmount: 27000, totalAmount: 177000, paidAmount: 177000, balanceDue: 0, status: 'FULLY PAID' }
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
      }
    }, tabName);
    await page.waitForTimeout(1200);
  };

  // 1. Transports: Open Freight Trip Drawer
  console.log('Capturing Transports Freight Drawer...');
  await switchTab('transports');
  await page.evaluate(() => {
    const comp = window.ng?.getComponent?.(document.querySelector('app-transports'));
    if (comp && comp.openAddModal) comp.openAddModal();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'modal_transports_freight_drawer.png'), fullPage: false });

  // 2. Drivers: Open Enroll Driver Drawer
  console.log('Capturing Drivers Enroll Drawer...');
  await switchTab('drivers');
  await page.evaluate(() => {
    const comp = window.ng?.getComponent?.(document.querySelector('app-drivers'));
    if (comp && comp.openEnrollDrawer) comp.openEnrollDrawer();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'modal_drivers_enroll_drawer.png'), fullPage: false });

  // 3. Invoices: Open Create Tax Invoice Drawer
  console.log('Capturing Invoices Create Drawer...');
  await switchTab('invoices');
  await page.evaluate(() => {
    const comp = window.ng?.getComponent?.(document.querySelector('app-invoices'));
    if (comp && comp.openCreateDrawer) comp.openCreateDrawer();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'modal_invoices_create_drawer.png'), fullPage: false });

  // 4. Invoices: Open Invoice Preview Modal
  console.log('Capturing Invoices Preview Modal...');
  await page.evaluate(() => {
    const comp = window.ng?.getComponent?.(document.querySelector('app-invoices'));
    if (comp) {
      if (comp.closeCreateDrawer) comp.closeCreateDrawer();
      if (comp.openInvoiceModal) {
        comp.openInvoiceModal({
          id: 1, invoiceNumber: 'INV-2025-001', invoiceNo: 'INV-2025-001', invoiceDate: '2025-02-15',
          partyName: 'Adani Agri Fresh Logistics', partyGst: '27AABCA1234F1Z5',
          subtotal: 150000, gstAmount: 27000, totalAmount: 177000, paidAmount: 177000, balanceDue: 0, status: 'FULLY PAID'
        });
      }
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'modal_invoices_preview_modal.png'), fullPage: false });

  // 5. Parties: Open Edit Party Drawer
  console.log('Capturing Parties Detail Drawer...');
  await switchTab('parties');
  await page.evaluate(() => {
    const comp = window.ng?.getComponent?.(document.querySelector('app-party'));
    if (comp && comp.openEditDrawer) {
      comp.openEditDrawer({
        id: 1, partyName: 'Adani Agri Fresh Logistics', partyType: 'CUSTOMER',
        partyContact: '9820099881', city: 'Baramati', state: 'Maharashtra',
        gstNumber: '27AABCA1234F1Z5', email: 'billing@adaniagri.com'
      });
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'modal_parties_detail_drawer.png'), fullPage: false });

  console.log('\n🎉 ALL INTERACTIVE DRAWERS & MODALS CAPTURED SUCCESSFULLY!');
  await browser.close();
})().catch(err => {
  console.error('Drawer crawl error:', err);
  process.exit(1);
});
