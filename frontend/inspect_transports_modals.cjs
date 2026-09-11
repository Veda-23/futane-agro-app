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
    { id: 2, driverName: 'Anil R. Kadam', mobile: '9822023456', licenseNumber: 'MH09 20190023456', address: 'Kagal MIDC Logistics Hub, Kolhapur' }
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
    }
  ];

  await page.route('**/api/drivers', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockDrivers) }));
  await page.route('**/api/transports', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockTransports) }));

  await page.addInitScript(() => {
    const mockUser = { id: 1, username: 'admin', name: 'Admin User', role: 'SUPER_ADMIN', email: 'admin@futaneagro.com' };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    localStorage.setItem('jwtToken', 'mock-jwt-token-transports-audit');
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    sessionStorage.setItem('currentUser', JSON.stringify(mockUser));
  });

  try {
    await page.goto('http://127.0.0.1:4200/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      const navItems = Array.from(document.querySelectorAll('app-sidebar li'));
      const trItem = navItems.find(el => el.textContent && el.textContent.toLowerCase().includes('transport'));
      if (trItem) trItem.click();
    });

    await page.waitForSelector('.transports-enterprise-container', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const artifactDir = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/63ae1ca7-044a-4a77-a0c6-a06dc2558ecf';

    // 1. Open Add Drawer
    const addBtn = await page.$('.btn-action-primary');
    if (addBtn) {
      await addBtn.click();
      await page.waitForSelector('.slide-drawer', { timeout: 5000 });
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(artifactDir, 'transports_initial_drawer.png'), fullPage: false });
      console.log('Saved transports_initial_drawer.png');

      const closeBtn = await page.$('.btn-drawer-close');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(600);
    }

    // 2. Open View Waybill Modal
    const viewBtn = await page.$('.btn-view');
    if (viewBtn) {
      await viewBtn.click();
      await page.waitForSelector('.waybill-modal-dialog', { timeout: 5000 });
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(artifactDir, 'transports_initial_waybill.png'), fullPage: false });
      console.log('Saved transports_initial_waybill.png');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
})();
