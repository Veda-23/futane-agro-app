const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1336, height: 750 } });

  await context.addInitScript(() => {
    const mockUser = { id: 1, username: 'admin', name: 'Super Administrator', role: 'SUPER_ADMIN' };
    window.sessionStorage.setItem('user', JSON.stringify(mockUser));
    window.localStorage.setItem('user', JSON.stringify(mockUser));
    window.localStorage.setItem('currentUser', JSON.stringify(mockUser));
    window.localStorage.setItem('jwtToken', 'mock-token');
    window.localStorage.setItem('isLoggedIn', 'true');
  });

  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4200', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);

  const tabEl = await page.$('li[title*="sales" i], .sidebar-nav li:has-text("Sales")');
  if (tabEl) await tabEl.click();
  await page.waitForTimeout(3000);

  const rules = await page.evaluate(() => {
    const el = document.querySelector('.subnav-tab-btn.active');
    if (!el) return 'NO ELEMENT FOUND';
    const matched = [];
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText && el.matches(rule.selectorText)) {
            if (rule.style.background || rule.style.backgroundColor) {
              matched.push({
                selector: rule.selectorText,
                bg: rule.style.background,
                cssText: rule.cssText
              });
            }
          }
        }
      } catch (e) {}
    }
    return matched;
  });

  console.log('MATCHED RULES FOR SUBNAV TAB:', JSON.stringify(rules, null, 2));

  await browser.close();
})();
