const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e';

async function audit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1150 } });
  const page = await context.newPage();

  console.log('Navigating to root...');
  await page.goto('http://localhost:4200', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  // Set mock authentication
  await page.evaluate(() => {
    const mockUser = {
      id: 1,
      username: 'admin',
      name: 'Neha Sharma',
      role: 'SUPER_ADMIN',
      email: 'admin@futaneagro.com'
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('jwtToken', 'valid-mock-jwt-token');
  });

  await page.goto('http://localhost:4200', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Navigate to Settings
  console.log('Clicking Settings in Sidebar...');
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('.nav-link, .sidebar-item, .sidebar-nav-item, span')).find(e => e.textContent.includes('Settings'));
    if (el) el.click();
  });
  await page.waitForTimeout(1000);

  // Navigate to Feature Flags subtab
  console.log('Clicking Feature Flags subtab...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.settings-nav-pill, button')).find(e => e.textContent.includes('Feature Flags'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1200);

  // 1. Desktop Feature Flags Directory (Table View)
  console.log('Capturing phase29_01_desktop_feature_flags.png...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase29_01_desktop_feature_flags.png') });

  // 2. Search & Category Filter
  console.log('Testing Search & Category Filter...');
  const searchInput = await page.$('.users-search-input');
  if (searchInput) {
    await searchInput.fill('Production');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase29_02_search_and_filter.png') });
    await searchInput.fill('');
    await page.waitForTimeout(400);
  }

  // 3. Switch to Cards View
  console.log('Switching to Cards View...');
  await page.evaluate(() => {
    const cardsBtn = Array.from(document.querySelectorAll('.density-btn')).find(b => b.textContent.includes('Cards'));
    if (cardsBtn) cardsBtn.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase29_03_cards_view.png') });

  // Switch back to Table View
  await page.evaluate(() => {
    const tableBtn = Array.from(document.querySelectorAll('.density-btn')).find(b => b.textContent.includes('Table'));
    if (tableBtn) tableBtn.click();
  });
  await page.waitForTimeout(400);

  // 4. Open Flag Detail Inspector Modal
  console.log('Opening Flag Detail Inspector Modal...');
  await page.evaluate(() => {
    const infoBtns = Array.from(document.querySelectorAll('.btn-action-subtle[title*="Inspect flag metadata"]'));
    if (infoBtns.length > 0) infoBtns[0].click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase29_04_flag_detail_modal.png') });

  // Close modal
  await page.evaluate(() => {
    const closeBtn = Array.from(document.querySelectorAll('.config-btn-secondary, .modal-close-btn')).find(b => b.textContent.includes('Close') || b.getAttribute('aria-label') === 'Close dialog');
    if (closeBtn) closeBtn.click();
  });
  await page.waitForTimeout(400);

  // 5. Switch to AI Copilot Governance subtab
  console.log('Switching to AI Copilot Governance subtab...');
  await page.evaluate(() => {
    const copilotBtn = Array.from(document.querySelectorAll('.notif-section-btn')).find(b => b.textContent.includes('AI Copilot Governance'));
    if (copilotBtn) copilotBtn.click();
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase29_05_ai_copilot_governance.png') });

  // 6. Execute Diagnostic Probe
  console.log('Executing Diagnostic Probe...');
  await page.evaluate(() => {
    const execBtn = Array.from(document.querySelectorAll('.notif-btn-action')).find(b => b.textContent.includes('Execute Diagnostic'));
    if (execBtn) execBtn.click();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase29_06_copilot_diagnostic_query.png') });

  // 7. Switch to Subsystem Rollout Matrix
  console.log('Switching to Subsystem Rollout Matrix...');
  await page.evaluate(() => {
    const matrixBtn = Array.from(document.querySelectorAll('.notif-section-btn')).find(b => b.textContent.includes('Subsystem Rollout Matrix'));
    if (matrixBtn) matrixBtn.click();
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase29_07_subsystem_rollout_matrix.png') });

  // 8. Dark Mode Verification
  console.log('Enabling Dark Mode...');
  await page.evaluate(() => {
    document.body.classList.add('dark-theme');
    const copilotBtn = Array.from(document.querySelectorAll('.notif-section-btn')).find(b => b.textContent.includes('AI Copilot Governance'));
    if (copilotBtn) copilotBtn.click();
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase29_08_dark_mode.png') });

  // Restore Light Mode
  await page.evaluate(() => {
    document.body.classList.remove('dark-theme');
    const flagsBtn = Array.from(document.querySelectorAll('.notif-section-btn')).find(b => b.textContent.includes('Feature Flags Directory'));
    if (flagsBtn) flagsBtn.click();
  });
  await page.waitForTimeout(500);

  // 9. Tablet View (768px)
  console.log('Testing Tablet View (768px)...');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const sb = document.querySelector('.sidebar.open');
    if (sb) {
      const btn = document.querySelector('.mobile-close-btn');
      if (btn) btn.click();
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase29_09_tablet.png') });

  // 10. Mobile View (390px)
  console.log('Testing Mobile View (390px)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const sb = document.querySelector('.sidebar.open');
    if (sb) {
      const btn = document.querySelector('.mobile-close-btn');
      if (btn) btn.click();
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase29_10_mobile.png') });

  await browser.close();
  console.log('Audit complete! All Phase 29 screenshots generated.');
}

audit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
