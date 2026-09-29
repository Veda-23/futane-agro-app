const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1336, height: 750 } });
  
  await context.addInitScript(() => {
    const mockUser = { id: 1, username: 'admin', name: 'Super Administrator', role: 'SUPER_ADMIN' };
    window.sessionStorage.setItem('user', JSON.stringify(mockUser));
    window.localStorage.setItem('user', JSON.stringify(mockUser));
    window.sessionStorage.setItem('jwtToken', 'test-jwt-token-valid');
    window.localStorage.setItem('jwtToken', 'test-jwt-token-valid');
  });

  const page = await context.newPage();
  await page.goto('http://localhost:4200');
  await page.waitForTimeout(4000);
  console.log('Current URL:', page.url());

  const navItems = await page.$$eval('.sidebar-nav li', items => items.map(i => i.textContent.trim()));
  console.log('Found nav items:', navItems);

  await browser.close();
})();
