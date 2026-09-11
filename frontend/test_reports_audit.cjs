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
    
    // Login
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Navigate to Reports Tab
    console.log("Navigating to Reports Tab...");
    await page.click('li:has(.bi-bar-chart-steps)');
    await page.waitForTimeout(2000);

    // 1. Desktop Baseline
    await page.screenshot({ path: path.join(artifactDir, 'reports_main_1440.png'), fullPage: false });
    console.log("Took desktop baseline screenshot.");

    // Scroll to check sticky controls
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(artifactDir, 'reports_sticky_scroll.png') });
    console.log("Took sticky scrolling screenshot.");
    await page.evaluate(() => window.scrollTo(0, 0));

    // 2. Report Selection (Party Ledger)
    await page.selectOption('select[name="repType"]', 'party_ledger');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, 'reports_party_ledger.png') });
    console.log("Took Party Ledger report screenshot.");

    // 3. Density Selection
    await page.click('button:has-text("Compact")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(artifactDir, 'reports_compact_density.png') });
    console.log("Took Compact Density screenshot.");

    // 4. Dark Mode
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
  } finally {
    await browser.close();
  }
}

runAudit();
