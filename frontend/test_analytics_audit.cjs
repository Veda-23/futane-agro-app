const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const mockSales = [
    { id: 1, billDate: '2025-02-18', billNumber: 'INV-1001', partyName: 'Adani Agri Fresh Logistics', party: { partyName: 'Adani Agri Fresh Logistics', mobile: '9820099881' }, quantity: 450, totalAmount: 71136, paidAmount: 0, remaining: 71136 },
    { id: 2, billDate: '2025-02-19', billNumber: 'INV-1002', partyName: 'Heritage Foods Retail Ltd.', party: { partyName: 'Heritage Foods Retail Ltd.', mobile: '9848012345' }, quantity: 380, totalAmount: 57024, paidAmount: 0, remaining: 57024 },
    { id: 3, billDate: '2025-02-20', billNumber: 'INV-1003', partyName: 'Gujarat Agro Cold Chain Exporters', party: { partyName: 'Gujarat Agro Cold Chain Exporters', mobile: '9727054321' }, quantity: 320, totalAmount: 49536, paidAmount: 0, remaining: 49536 },
    { id: 4, billDate: '2025-02-21', billNumber: 'INV-1004', partyName: 'Mahindra Agri Solutions Ltd.', party: { partyName: 'Mahindra Agri Solutions Ltd.', mobile: '9822014589' }, quantity: 270, totalAmount: 41040, paidAmount: 0, remaining: 41040 },
    { id: 5, billDate: '2025-02-22', billNumber: 'INV-1005', partyName: 'Reliance Fresh Distribution Hub', party: { partyName: 'Reliance Fresh Distribution Hub', mobile: '9136098765' }, quantity: 240, totalAmount: 37152, paidAmount: 0, remaining: 37152 }
  ];

  const mockPpd = [
    { id: 1, date: '2025-02-22', shift: 'Morning Shift', machineCode: 'IMM-01', itemName: 'Apple Crate 20kg', operatorName: 'Ramesh Kadam', quantity: 820, rejectedQuantity: 4 },
    { id: 2, date: '2025-02-22', shift: 'Afternoon Shift', machineCode: 'IMM-02', itemName: 'Mango Crate 10kg', operatorName: 'Sanjay Patil', quantity: 690, rejectedQuantity: 2 },
    { id: 3, date: '2025-02-22', shift: 'Night Shift', machineCode: 'IMM-03', itemName: 'Tomato Crate 25kg', operatorName: 'Vikram Shinde', quantity: 510, rejectedQuantity: 6 }
  ];

  const mockExpenses = [
    { id: 1, date: '2025-02-20', category: 'Electricity', description: 'MSEDCL Industrial Power Bill HT-12', paymentMode: 'NEFT', amount: 145000 },
    { id: 2, date: '2025-02-21', category: 'Maintenance', description: 'Hydraulic Oil & Seal Replacement IMM-04', paymentMode: 'Cheque', amount: 18500 },
    { id: 3, date: '2025-02-22', category: 'Logistics', description: 'Fuel Disbursement Fleet Trucks', paymentMode: 'UPI', amount: 12400 }
  ];

  // Intercept backend API routes
  await page.route(url => url.pathname.includes('/sales'), route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSales) });
  });

  await page.route(url => url.pathname.includes('/ppd'), route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPpd) });
  });

  await page.route(url => url.pathname.includes('/expenses'), route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockExpenses) });
  });

  await page.route(url => url.pathname.includes('/settings'), route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  // Seed authenticated user into storage
  await page.addInitScript(() => {
    const mockUser = {
      id: 1,
      username: 'admin',
      name: 'Vedant Mehare',
      role: 'SUPER_ADMIN',
      email: 'admin@futaneagro.com'
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('jwtToken', 'mock-jwt-token-analytics-audit');
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    sessionStorage.setItem('jwtToken', 'mock-jwt-token-analytics-audit');
  });

  console.log('Waiting for http://localhost:4200 to be ready...');
  let connected = false;
  for (let i = 0; i < 35; i++) {
    try {
      await page.goto('http://localhost:4200/', { waitUntil: 'networkidle', timeout: 8000 });
      connected = true;
      console.log('Successfully connected to http://localhost:4200!');
      break;
    } catch (e) {
      console.log(`Waiting for dev server... (${i + 1}/35)`);
      await new Promise(r => setTimeout(r, 2500));
    }
  }

  if (!connected) {
    throw new Error('Could not connect to http://localhost:4200 after 35 attempts');
  }

  // Dismiss overlay
  try {
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      const overlay = document.querySelector('vite-error-overlay');
      if (overlay) overlay.remove();
    });
  } catch (e) {}

  // Switch to analytics tab
  console.log('Switching to analytics tab...');
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

  // Wait for analytics container
  await page.waitForSelector('.analytics-container', { timeout: 10000 });
  await page.waitForTimeout(1200);

  const outDir = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e';

  // 1. Capture Main Cockpit View
  console.log('Capturing analytics_cockpit_main.png...');
  await page.screenshot({
    path: path.join(outDir, 'analytics_cockpit_main.png'),
    fullPage: false
  });

  // 2. View Mode: Reports Tab
  console.log('Switching to Reports mode...');
  const reportsBtn = page.locator('#btn-view-reports');
  if (await reportsBtn.isVisible()) {
    await reportsBtn.click();
    await page.waitForTimeout(800);
  }
  console.log('Capturing analytics_reports_tab.png...');
  await page.screenshot({
    path: path.join(outDir, 'analytics_reports_tab.png'),
    fullPage: false
  });

  // 3. Switch back to Cockpit and focus on Debtor Ranking / AI Insights
  console.log('Switching back to Cockpit and scrolling to Debtors / AI insights...');
  const cockpitBtn = page.locator('#btn-view-cockpit');
  if (await cockpitBtn.isVisible()) {
    await cockpitBtn.click();
    await page.waitForTimeout(600);
  }
  await page.evaluate(() => {
    window.scrollBy(0, 320);
  });
  await page.waitForTimeout(600);
  console.log('Capturing analytics_debtor_ranking.png...');
  await page.screenshot({
    path: path.join(outDir, 'analytics_debtor_ranking.png'),
    fullPage: false
  });

  // 4. View Mode: Embed Mode
  console.log('Switching to Embed mode...');
  const embedBtn = page.locator('#btn-view-embed');
  if (await embedBtn.isVisible()) {
    await embedBtn.click();
    await page.waitForTimeout(800);
  }
  console.log('Capturing analytics_embed_mode.png...');
  await page.screenshot({
    path: path.join(outDir, 'analytics_embed_mode.png'),
    fullPage: false
  });

  console.log('Analytics visual audit successfully completed!');
  await browser.close();
})().catch(err => {
  console.error('Audit run error:', err);
  process.exit(1);
});
