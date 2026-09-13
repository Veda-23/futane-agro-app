const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:4200');
  await page.evaluate(() => {
    const mockUser = {
      id: 1,
      username: 'admin',
      name: 'Super Administrator',
      role: 'SUPER_ADMIN',
      email: 'admin@futaneagro.com'
    };
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('user', JSON.stringify(mockUser));
    sessionStorage.setItem('activeTab', 'inventory');
  });

  await page.reload();
  await page.waitForSelector('.main-content', { timeout: 10000 });
  const title = await page.$eval('.header-main-title', el => el.innerText).catch(() => 'No title');
  console.log('Successfully rendered tab with title:', title);

  const btns = await page.$$eval('button', els => els.map(b => b.innerText.trim()).filter(Boolean));
  console.log('Buttons found:', btns.slice(0, 10));

  await browser.close();
})();
