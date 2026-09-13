const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  const page = await context.newPage();

  await page.addInitScript(() => {
    const mockUser = { id: 1, username: 'admin', name: 'Vedant Mehare', role: 'SUPER_ADMIN' };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('jwtToken', 'mock-jwt-token');
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    sessionStorage.setItem('jwtToken', 'mock-jwt-token');
  });

  await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' });

  // Let the page settle
  await page.waitForTimeout(2000);

  const tabs = [
    'dashboard', 'production', 'monthly-production', 'parties', 'sales', 'payments', 
    'raw-materials', 'vendors', 'inventory', 'employees', 'salaries', 'transports', 
    'drivers', 'invoices', 'billinghub', 'reports', 'machines', 'dispatch', 'expenses', 
    'bank', 'analytics', 'audit-logs', 'settings'
  ];

  for (const tab of tabs) {
    try {
      await page.evaluate((tabId) => {
        const scope = window.ng?.getComponent?.(document.querySelector('app-root'));
        if (scope && scope.switchTab) scope.switchTab(tabId);
      }, tab);

      await page.waitForTimeout(1000); // wait for render

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth || 
               document.body.scrollWidth > document.body.clientWidth;
      });

      console.log(`Tab [${tab}]: ${hasOverflow ? 'FAIL (Overflow detected)' : 'PASS (No overflow)'}`);
    } catch (e) {
      console.log(`Tab [${tab}]: ERROR - ${e.message}`);
    }
  }

  await browser.close();
})();
