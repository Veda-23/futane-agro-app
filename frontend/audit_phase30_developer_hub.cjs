const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e';

(async () => {
  console.log('Starting Phase 30 Developer Hub Audit...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));

  try {
    console.log('1. Setting mock authentication...');
    await page.goto('http://localhost:4200', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

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

    console.log('2. Reloading app with auth active...');
    await page.goto('http://localhost:4200', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);

    console.log('3. Clicking Settings in Sidebar...');
    const settingsClicked = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('.nav-link, .sidebar-item, .sidebar-nav-item, span, li')).find(e => e.textContent && e.textContent.includes('Settings'));
      if (el) {
        el.click();
        return true;
      }
      return false;
    });
    console.log('Settings clicked:', settingsClicked);
    await page.waitForTimeout(1200);

    console.log('4. Clicking Developer Hub nav pill...');
    const devClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('.settings-nav-pill, button, a')).find(e => e.textContent && (e.textContent.includes('Developer Hub') || e.textContent.includes('API Keys') || e.textContent.includes('Developer')));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log('Developer Hub clicked:', devClicked);
    await page.waitForTimeout(1200);

    // Capture 1: Desktop API Keys view
    console.log('Capturing phase30_01_desktop_api_keys.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase30_01_desktop_api_keys.png') });

    // Capture 2: Search & Filter in API Keys
    console.log('Testing search in API Keys...');
    await page.evaluate(() => {
      const input = document.querySelector('input.devhub-search-input');
      if (input) {
        input.value = 'Zapier';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(600);
    console.log('Capturing phase30_02_api_keys_search.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase30_02_api_keys_search.png') });

    // Reset search
    await page.evaluate(() => {
      const input = document.querySelector('input.devhub-search-input');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(400);

    // Capture 3: API Key Inspect Modal
    console.log('Opening API Key Inspect modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.devhub-table button')).filter(b => b.textContent.includes('Inspect'));
      if (btns.length > 0) btns[0].click();
    });
    await page.waitForTimeout(800);
    console.log('Capturing phase30_03_api_key_inspect_modal.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase30_03_api_key_inspect_modal.png') });

    // Close inspect modal
    await page.evaluate(() => {
      const closeBtn = Array.from(document.querySelectorAll('.modal-content button')).find(b => b.textContent.includes('Close Inspector') || b.getAttribute('aria-label') === 'Close dialog');
      if (closeBtn) closeBtn.click();
    });
    await page.waitForTimeout(500);

    // Capture 4: Create API Key Modal
    console.log('Opening Generate API Key modal...');
    await page.evaluate(() => {
      const genBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Generate API Key'));
      if (genBtn) genBtn.click();
    });
    await page.waitForTimeout(800);
    console.log('Capturing phase30_04_create_api_key_modal.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase30_04_create_api_key_modal.png') });

    // Close generate key modal
    await page.evaluate(() => {
      const cancelBtn = Array.from(document.querySelectorAll('.modal-content button')).find(b => b.textContent.includes('Cancel') || b.getAttribute('aria-label') === 'Close dialog');
      if (cancelBtn) cancelBtn.click();
    });
    await page.waitForTimeout(500);

    // Capture 5: Switch to Event Webhooks subtab
    console.log('Switching to Event Webhooks subtab...');
    await page.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('.devhub-subnav-btn')).find(b => b.textContent.includes('Event Webhooks'));
      if (tab) tab.click();
    });
    await page.waitForTimeout(1000);
    console.log('Capturing phase30_05_event_webhooks.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase30_05_event_webhooks.png') });

    // Capture 6: Webhook Payload & Delivery Inspector Modal
    console.log('Opening Webhook Payload Inspector modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.devhub-table button')).filter(b => b.textContent.includes('Inspect'));
      if (btns.length > 0) btns[0].click();
    });
    await page.waitForTimeout(800);
    console.log('Capturing phase30_06_webhook_payload_modal.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase30_06_webhook_payload_modal.png') });

    // Close webhook inspector
    await page.evaluate(() => {
      const closeBtn = Array.from(document.querySelectorAll('.modal-content button')).find(b => b.textContent.includes('Close Inspector') || b.getAttribute('aria-label') === 'Close dialog');
      if (closeBtn) closeBtn.click();
    });
    await page.waitForTimeout(500);

    // Capture 7: Create Webhook Modal
    console.log('Opening Add Webhook modal...');
    await page.evaluate(() => {
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add Webhook'));
      if (addBtn) addBtn.click();
    });
    await page.waitForTimeout(800);
    console.log('Capturing phase30_07_create_webhook_modal.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase30_07_create_webhook_modal.png') });

    // Close add webhook modal
    await page.evaluate(() => {
      const cancelBtn = Array.from(document.querySelectorAll('.modal-content button')).find(b => b.textContent.includes('Cancel') || b.getAttribute('aria-label') === 'Close dialog');
      if (cancelBtn) cancelBtn.click();
    });
    await page.waitForTimeout(500);

    // Capture 8: Switch to API Gateway Documentation
    console.log('Switching to API Gateway Documentation subtab...');
    await page.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('.devhub-subnav-btn')).find(b => b.textContent.includes('API Gateway Documentation'));
      if (tab) tab.click();
    });
    await page.waitForTimeout(1000);
    console.log('Capturing phase30_08_api_documentation.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase30_08_api_documentation.png') });

    // Capture 9: HMAC Guide in Docs
    console.log('Selecting HMAC Verification Guide...');
    await page.evaluate(() => {
      const hmacBtn = Array.from(document.querySelectorAll('.docs-endpoint-item')).find(b => b.textContent.includes('HMAC Verification Guide'));
      if (hmacBtn) hmacBtn.click();
    });
    await page.waitForTimeout(800);
    console.log('Capturing phase30_09_hmac_guide.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase30_09_hmac_guide.png') });

    // Capture 10: Switch to SRE Observability Wallboards
    console.log('Switching to SRE Observability Wallboards subtab...');
    await page.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('.devhub-subnav-btn')).find(b => b.textContent.includes('SRE Observability Wallboards'));
      if (tab) tab.click();
    });
    await page.waitForTimeout(1000);
    console.log('Capturing phase30_10_sre_wallboards.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase30_10_sre_wallboards.png') });

    // Capture 11: Dark Mode
    console.log('Testing Dark Mode...');
    await page.evaluate(() => {
      document.body.classList.add('dark-theme');
      const tab = Array.from(document.querySelectorAll('.flags-subtab-btn')).find(b => b.textContent.includes('API Bearer Keys'));
      if (tab) tab.click();
    });
    await page.waitForTimeout(800);
    console.log('Capturing phase30_11_dark_mode.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase30_11_dark_mode.png') });
    await page.evaluate(() => {
      document.body.classList.remove('dark-theme');
    });

    // Capture 12: Tablet Viewport
    console.log('Testing Tablet Viewport (1024x768)...');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(600);
    console.log('Capturing phase30_12_tablet.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase30_12_tablet.png') });

    // Capture 13: Mobile Viewport
    console.log('Testing Mobile Viewport (390x844)...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(600);
    console.log('Capturing phase30_13_mobile.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase30_13_mobile.png') });

    console.log('Audit completed successfully! All 13 screenshots captured.');
  } catch (err) {
    console.error('Audit failed with error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
