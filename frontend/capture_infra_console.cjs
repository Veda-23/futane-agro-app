const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/fdd0d5e2-b9ea-49ba-889e-e88204822640';

async function captureInfraConsole() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();

  console.log('Navigating to app...');
  await page.goto('http://localhost:4200', { waitUntil: 'domcontentloaded' });

  // Setup Admin auth and navigate to settings -> governance
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
    localStorage.setItem('activeTab', 'settings');
    sessionStorage.setItem('activeTab', 'settings');
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // Click on the JVM Telemetry & Backups tab
  const tabSelector = 'button.settings-nav-pill:has-text("JVM Telemetry")';
  await page.waitForSelector(tabSelector, { timeout: 5000 });
  await page.click(tabSelector);
  await page.waitForTimeout(1500);

  // 1. Light Mode Full Page Screenshot
  const lightPath = path.join(ARTIFACT_DIR, 'infra_console_light.png');
  await page.screenshot({ path: lightPath, fullPage: true });
  console.log('Saved Light Mode screenshot to', lightPath);

  // 2. Open Restore Confirmation Modal by populating a backup and clicking the Restore button
  await page.evaluate(() => {
    const el = document.querySelector('app-settings');
    const scope = window['ng']?.getComponent?.(el);
    if (scope) {
      scope.backupsList = [
        {
          name: 'futane_erp_prod_snapshot_2026-09-14_0300.sql',
          filename: 'futane_erp_prod_snapshot_2026-09-14_0300.sql',
          size: 184549376,
          lastModified: '2026-09-14 03:00:12'
        },
        {
          name: 'futane_erp_pre_deploy_2026-09-13_1845.sql',
          filename: 'futane_erp_pre_deploy_2026-09-13_1845.sql',
          size: 179234816,
          lastModified: '2026-09-13 18:45:00'
        }
      ];
      window['ng']?.applyChanges?.(scope);
    }
  });
  await page.waitForTimeout(600);

  // Take screenshot with populated backups table
  const tableWithBackupsPath = path.join(ARTIFACT_DIR, 'infra_backups_populated.png');
  await page.screenshot({ path: tableWithBackupsPath, fullPage: true });
  console.log('Saved Populated Backups screenshot to', tableWithBackupsPath);

  // Click Restore button on the first row
  const restoreBtn = await page.$('button.btn-row-restore');
  if (restoreBtn) {
    await restoreBtn.click();
    await page.waitForTimeout(600);
    const modalPath = path.join(ARTIFACT_DIR, 'infra_restore_modal.png');
    await page.screenshot({ path: modalPath });
    console.log('Saved Restore Modal screenshot to', modalPath);

    // Close modal
    const cancelBtn = await page.$('button.btn-modal-cancel');
    if (cancelBtn) await cancelBtn.click();
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(300);

  // 3. Dark Mode Full Page Screenshot
  await page.evaluate(() => {
    document.body.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark');
  });
  await page.waitForTimeout(500);
  const darkPath = path.join(ARTIFACT_DIR, 'infra_console_dark.png');
  await page.screenshot({ path: darkPath, fullPage: true });
  console.log('Saved Dark Mode screenshot to', darkPath);

  await browser.close();
  console.log('All screenshots captured successfully!');
}

captureInfraConsole().catch(err => {
  console.error('Error capturing infra console:', err);
  process.exit(1);
});
