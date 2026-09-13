const { chromium } = require('playwright');

async function debugPagination() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:4200', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const mockUser = {
      id: 1,
      username: 'admin',
      name: 'Super Administrator',
      role: 'SUPER_ADMIN',
      email: 'admin@futaneagro.com'
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    localStorage.setItem('jwtToken', 'mock-token');
    localStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('activeTab', 'production');
    localStorage.setItem('activeTab', 'production');
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const data = await page.evaluate(() => {
    const container = document.querySelector('.page-nav-btns');
    if (!container) return 'No .page-nav-btns found';
    const rect = container.getBoundingClientRect();
    const children = Array.from(container.children).map(c => {
      const cr = c.getBoundingClientRect();
      const style = window.getComputedStyle(c);
      return {
        tag: c.tagName,
        text: c.textContent.trim(),
        width: cr.width,
        height: cr.height,
        left: cr.left,
        right: cr.right,
        display: style.display,
        position: style.position,
        boxSizing: style.boxSizing,
        padding: style.padding,
        margin: style.margin
      };
    });
    return { container: { width: rect.width, left: rect.left, display: window.getComputedStyle(container).display }, children };
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
}

debugPagination().catch(console.error);
