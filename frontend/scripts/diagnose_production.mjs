import { chromium } from '@playwright/test';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  if (await page.locator('#username').isVisible().catch(() => false)) {
    await page.fill('#username', 'SUPER_ADMIN');
    await page.fill('#password', 'superadmin123');
    await page.click('#login-submit-btn');
    await page.waitForSelector('.uat-otp-helper-pill', { timeout: 15000 });
    await page.click('.uat-otp-helper-pill');
    await page.click('#otp-verify-submit-btn');
    await page.waitForSelector('.sidebar, .app-header', { timeout: 20000 });
  }

  // Switch to production
  await page.evaluate(() => {
    // @ts-ignore
    const app = window.ng?.getComponent(document.querySelector('app-root'));
    if (app) app.switchTab('production');
  });
  await page.waitForTimeout(1500);

  const diag = await page.evaluate(() => {
    // @ts-ignore
    const comp = window.ng?.getComponent(document.querySelector('app-production'));
    if (!comp) return { error: 'app-production component not found' };
    return {
      activeTab: comp.activeTab,
      ppdListLen: comp.ppdList?.length,
      ppmListLen: comp.ppmList?.length,
      showPpdDossierModal: comp.showPpdDossierModal,
      selectedPpdForDossier: !!comp.selectedPpdForDossier
    };
  });
  console.log('Production component state:', diag);

  // Now trigger openPpdDossier
  const afterOpen = await page.evaluate(() => {
    // @ts-ignore
    const comp = window.ng?.getComponent(document.querySelector('app-production'));
    if (!comp.ppdList || comp.ppdList.length === 0) {
      comp.ppdList = [{ id: '99', date: '2026-10-12', crateType: 'Standard Agro Crate', totalProduction: 450, successful: 440, rejected: 10 }];
    }
    comp.openPpdDossier(comp.ppdList[0]);
    // @ts-ignore
    window.ng?.applyChanges(comp);
    return {
      showPpdDossierModal: comp.showPpdDossierModal,
      selectedPpdForDossier: !!comp.selectedPpdForDossier,
      domHasDossier: !!document.querySelector('.dossier-modal-container')
    };
  });
  console.log('After openPpdDossier:', afterOpen);

  await page.waitForTimeout(500);
  console.log('DOM has container:', await page.locator('.dossier-modal-container').count());
  console.log('Container visible:', await page.locator('.dossier-modal-container').isVisible().catch(() => false));

  await browser.close();
}

run();
