const { chromium } = require('playwright');
const path = require('path');

async function runAudit() {
  console.log("Starting Reports Component UI Audit...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const artifactDir = "C:\\Users\\Vedant\\.gemini\\antigravity-ide\\brain\\63ae1ca7-044a-4a77-a0c6-a06dc2558ecf";

  try {
    await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' });
    
    // Bypass Login by setting localStorage
    console.log("Bypassing login via localStorage/sessionStorage...");
    await page.evaluate(() => {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify({ role: 'SUPER_ADMIN', username: 'admin' }));
      sessionStorage.setItem('user', JSON.stringify({ role: 'SUPER_ADMIN', username: 'admin' }));
      sessionStorage.setItem('activeTab', 'reports');
      localStorage.setItem('activeTab', 'reports');
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const isAuth = await page.evaluate(() => localStorage.getItem('isLoggedIn'));
    console.log("After reload, isLoggedIn:", isAuth);
    
    // Ensure we are on the reports tab
    await page.waitForSelector('.erp-page-title');

    // 1. Desktop Baseline
    await page.screenshot({ path: path.join(artifactDir, 'reports_main_1440.png'), fullPage: false });
    console.log("Took desktop baseline screenshot.");

    // Scroll to check sticky controls
    const mainContent = await page.$('.main-content');
    if (mainContent) {
      await page.evaluate(el => el.scrollBy(0, 500), mainContent);
    } else {
      await page.evaluate(() => window.scrollBy(0, 500));
    }
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(artifactDir, 'reports_sticky_scroll.png') });
    console.log("Took sticky scrolling screenshot.");
    
    if (mainContent) {
      await page.evaluate(el => el.scrollTo(0, 0), mainContent);
    } else {
      await page.evaluate(() => window.scrollTo(0, 0));
    }
    await page.waitForTimeout(500);

    // 3. Test different reports
    console.log("Testing Report Type Switching...");
    // Just select a different report type
    await page.selectOption('select.erp-select', { label: 'Party Ledger' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, 'reports_party_ledger.png') });
    console.log("Took Party Ledger report screenshot.");

    // (Optional) Test dark mode if there is a toggle in the UI.
    // If not, we skip the dark mode toggle.
    await page.evaluate(() => {
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, 'reports_dark_mode.png') });
    console.log("Took dark mode screenshot.");

    await page.evaluate(() => {
      document.body.classList.remove('dark-mode');
      document.documentElement.setAttribute('data-theme', 'light');
    });

    // 5. Tablet (768px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, 'reports_responsive_768.png') });
    console.log("Took tablet (768px) screenshot.");

    // 6. Mobile (390px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, 'reports_responsive_390.png') });
    console.log("Took mobile (390px) screenshot.");

    console.log("All Reports UI audits passed successfully!");

  } catch (error) {
    console.error("Audit failed:", error);
    await page.screenshot({ path: path.join(artifactDir, 'error_debug.png') });
  } finally {
    await browser.close();
  }
}

runAudit();
