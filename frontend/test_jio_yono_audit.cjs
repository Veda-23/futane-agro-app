const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Mock API endpoints
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

  await page.route(url => url.pathname.includes('/machines'), route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1, machineCode: 'IMM-01', machineName: 'Line #1 Windsor Sprint', hourlyCapacity: 120, status: 'Running' },
      { id: 2, machineCode: 'IMM-02', machineName: 'Line #2 Windsor Sprint', hourlyCapacity: 140, status: 'Running' }
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

  // Dismiss any overlay
  try {
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      const overlay = document.querySelector('vite-error-overlay');
      if (overlay) overlay.remove();
    });
  } catch (e) {}

  const outDir = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e';

  // 1. Capture Jio & YONO Dashboard
  console.log('Capturing jio_yono_dashboard.png...');
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: path.join(outDir, 'jio_yono_dashboard.png'),
    fullPage: false
  });

  // 2. Navigate to Billing Hub
  console.log('Navigating to Billing Hub tab...');
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('app-sidebar li'));
    const billingItem = navItems.find(el => el.textContent && el.textContent.toLowerCase().includes('billing hub'));
    if (billingItem) {
      billingItem.click();
    } else {
      const scope = window.ng?.getComponent?.(document.querySelector('app-root'));
      if (scope && scope.switchTab) scope.switchTab('billing-hub');
    }
  });
  await page.waitForTimeout(1200);
  console.log('Capturing jio_yono_billing_hub.png...');
  await page.screenshot({
    path: path.join(outDir, 'jio_yono_billing_hub.png'),
    fullPage: false
  });

  // 3. Navigate to Analytics & BI
  console.log('Navigating to Analytics & BI tab...');
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('app-sidebar li'));
    const analyticsItem = navItems.find(el => el.textContent && (el.textContent.toLowerCase().includes('analytics') || el.textContent.toLowerCase().includes('power bi')));
    if (analyticsItem) {
      analyticsItem.click();
    } else {
      const scope = window.ng?.getComponent?.(document.querySelector('app-root'));
      if (scope && scope.switchTab) scope.switchTab('analytics');
    }
  });
  await page.waitForTimeout(1200);
  console.log('Capturing jio_yono_analytics_cockpit.png...');
  await page.screenshot({
    path: path.join(outDir, 'jio_yono_analytics_cockpit.png'),
    fullPage: false
  });

  // 4. Toggle Dark Theme
  console.log('Toggling Dark Theme...');
  await page.evaluate(() => {
    document.body.classList.add('dark-theme');
  });
  await page.waitForTimeout(800);
  console.log('Capturing jio_yono_dark_mode.png...');
  await page.screenshot({
    path: path.join(outDir, 'jio_yono_dark_mode.png'),
    fullPage: false
  });

  console.log('Jio & YONO Visual Audit completed successfully!');
  await browser.close();
})().catch(err => {
  console.error('Audit run error:', err);
  process.exit(1);
});
