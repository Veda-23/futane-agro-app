const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/63ae1ca7-044a-4a77-a0c6-a06dc2558ecf/all_tabs';

async function updateSpecificTabs() {
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
    localStorage.setItem('auth_token', 'mock-token');
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('isLoggedIn', 'true');
  });

  const tabsToUpdate = [
    'production',
    'billinghub',
    'machines',
    'vendors',
    'raw-materials',
    'expenses',
    'bank',
    'drivers'
  ];

  for (const tab of tabsToUpdate) {
    console.log(`Capturing ${tab} tab...`);
    await page.evaluate((t) => {
      sessionStorage.setItem('activeTab', t);
      localStorage.setItem('activeTab', t);
    }, tab);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `tab_${tab}.png`) });
  }

  await browser.close();
  console.log('Updated tabs successfully!');
}

updateSpecificTabs().catch(err => {
  console.error(err);
  process.exit(1);
});
