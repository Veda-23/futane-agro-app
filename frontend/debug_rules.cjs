const { chromium } = require('playwright');

async function debugOrigin() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:4200', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const mockUser = { id: 1, username: 'admin', name: 'Super Administrator', role: 'SUPER_ADMIN' };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    localStorage.setItem('jwtToken', 'mock-token');
    localStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('activeTab', 'production');
    localStorage.setItem('activeTab', 'production');
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const matchedRules = await page.evaluate(() => {
    const btn = document.querySelector('.page-nav-btns button');
    if (!btn) return 'button not found';
    const rules = [];
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText && rule.selectorText.includes('page-nav-btns')) {
            rules.push({
              href: sheet.href,
              ownerNode: sheet.ownerNode ? sheet.ownerNode.outerHTML.slice(0, 100) : null,
              selector: rule.selectorText,
              cssText: rule.cssText
            });
          }
        }
      } catch (e) {}
    }
    return rules;
  });

  console.log(JSON.stringify(matchedRules, null, 2));
  await browser.close();
}

debugOrigin().catch(console.error);
