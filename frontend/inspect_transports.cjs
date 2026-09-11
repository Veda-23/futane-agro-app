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

  await page.route('**/api/drivers', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockDrivers)
    });
  });

  await page.route('**/api/transports', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockTransports)
    });
  });

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
    sessionStorage.setItem('jwtToken', 'mock-jwt-token-transports-audit');
  });

  try {
    console.log('Navigating to http://127.0.0.1:4200/ ...');
    await page.goto('http://127.0.0.1:4200/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.main-content', { timeout: 15000 });
    await page.waitForTimeout(1000);

    console.log('Switching to transports tab...');
    await page.evaluate(() => {
      const navItems = Array.from(document.querySelectorAll('app-sidebar li'));
      const trItem = navItems.find(el => el.textContent && el.textContent.toLowerCase().includes('transport'));
      if (trItem) {
        trItem.click();
      }
    });

    console.log('Waiting for transports container...');
    await page.waitForSelector('.transports-enterprise-container', { timeout: 10000 });
    await page.waitForTimeout(1200);

    const artifactDir = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/63ae1ca7-044a-4a77-a0c6-a06dc2558ecf';
    await page.screenshot({ path: path.join(artifactDir, 'transports_initial_inspect.png'), fullPage: false });
    console.log('Screenshot saved to transports_initial_inspect.png!');

    const title = await page.textContent('.header-main-title');
    console.log('Header main title:', title?.trim());

    const rows = await page.$$('.ledger-row, tbody tr');
    console.log(`Found ${rows.length} rows in table.`);

  } catch (err) {
    console.error('Error during inspect:', err);
  } finally {
    await browser.close();
  }
})();
