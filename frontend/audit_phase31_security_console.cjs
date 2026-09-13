const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e';

(async () => {
  console.log('Starting Phase 31 Security & Master Password Reset Audit...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
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

    console.log('4. Clicking Security nav pill...');
    const secClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('.settings-nav-pill, button, a')).find(e => e.textContent && e.textContent.includes('Security'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log('Security nav pill clicked:', secClicked);
    await page.waitForTimeout(1200);

    // Capture 1: Desktop Security Console View
    console.log('Capturing phase31_01_desktop_security_console.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase31_01_desktop_security_console.png') });

    // Step 5: Test typing in password fields and real-time policy compliance
    console.log('5. Testing password input and policy checklist...');
    await page.evaluate(() => {
      const currentInput = document.querySelector('#sec-current-password');
      if (currentInput) {
        currentInput.value = 'superadmin123';
        currentInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const newInput = document.querySelector('#sec-new-password');
      if (newInput) {
        newInput.value = 'SecureP@ss2026!';
        newInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const confirmInput = document.querySelector('#sec-confirm-password');
      if (confirmInput) {
        confirmInput.value = 'SecureP@ss2026!';
        confirmInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(600);

    // Capture 2: Password policy compliance active
    console.log('Capturing phase31_02_password_policy_active.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase31_02_password_policy_active.png') });

    // Step 6: Test eye toggle visibility buttons
    console.log('6. Testing password visibility toggle buttons...');
    await page.evaluate(() => {
      const eyeButtons = document.querySelectorAll('.sec-eye-btn');
      if (eyeButtons && eyeButtons.length > 0) {
        eyeButtons.forEach(btn => btn.click());
      }
    });
    await page.waitForTimeout(500);

    // Capture 3: Password visibility toggled
    console.log('Capturing phase31_03_password_visibility_toggled.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase31_03_password_visibility_toggled.png') });

    // Step 7: Open Master Password Confirmation Modal
    console.log('7. Triggering Master Password Reset confirmation modal...');
    await page.evaluate(() => {
      const submitBtn = document.querySelector('.btn-sec-primary');
      if (submitBtn) {
        submitBtn.click();
      }
    });
    await page.waitForTimeout(600);

    // Capture 4: Confirmation Modal Dialog
    console.log('Capturing phase31_04_master_password_confirm_modal.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase31_04_master_password_confirm_modal.png') });

    // Close modal
    await page.evaluate(() => {
      const cancelBtn = document.querySelector('.btn-sec-modal-cancel, .btn-close');
      if (cancelBtn) cancelBtn.click();
    });
    await page.waitForTimeout(400);

    // Step 8: Dark Mode View
    console.log('8. Enabling dark mode...');
    await page.evaluate(() => {
      document.body.classList.add('dark-theme');
    });
    await page.waitForTimeout(600);

    console.log('Capturing phase31_05_dark_mode.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase31_05_dark_mode.png') });

    // Restore light theme
    await page.evaluate(() => {
      document.body.classList.remove('dark-theme');
    });
    await page.waitForTimeout(400);

    // Step 9: Tablet Viewport (768px)
    console.log('9. Testing tablet viewport (768x1024)...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(400);
    // Dismiss mobile/tablet sidebar drawer if open
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.mobile-close-btn, .sidebar-backdrop');
      if (closeBtn) closeBtn.click();
    });
    await page.waitForTimeout(600);
    console.log('Capturing phase31_06_tablet.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase31_06_tablet.png') });

    // Step 10: Mobile Viewport (390px)
    console.log('10. Testing mobile viewport (390x844)...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    try {
      await page.click('button.mobile-close-btn', { timeout: 2000 });
    } catch (e) {
      console.log('No mobile close button found or already closed');
    }
    await page.waitForTimeout(600);
    console.log('Capturing phase31_07_mobile.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase31_07_mobile.png') });

    console.log('Phase 31 Security Console audit completed successfully!');
  } catch (err) {
    console.error('Audit failed with error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
