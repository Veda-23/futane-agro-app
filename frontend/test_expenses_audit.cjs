const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.addInitScript(() => {
    const mockUser = { id: 1, username: 'admin', name: 'Vedant Mehare', role: 'SUPER_ADMIN' };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('jwtToken', 'mock-jwt-token');
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    sessionStorage.setItem('jwtToken', 'mock-jwt-token');
  });

  console.log('Navigating to http://localhost:4200 ...');
  await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' });

  // Switch to expenses tab
  console.log('Switching to expenses tab...');
  await page.evaluate(() => {
    const scope = window.ng?.getComponent?.(document.querySelector('app-root'));
    if (scope && scope.switchTab) scope.switchTab('expenses');
  });

  await page.waitForTimeout(2000); // Wait for animations and data load

  // Take screenshot of main screen
  console.log('Capturing expenses_main.png...');
  await page.screenshot({ path: 'expenses_main.png', fullPage: true });

  // Open drawer
  console.log('Opening drawer...');
  await page.evaluate(() => {
    const btn = document.querySelector('.erp-page-header-right .btn-primary');
    if (btn) btn.click();
  });

  await page.waitForTimeout(1000); // Wait for drawer animation

  console.log('Capturing expenses_drawer.png...');
  await page.screenshot({ path: 'expenses_drawer.png', fullPage: true });

  console.log('Expenses visual audit successfully completed!');
  await browser.close();
})();
