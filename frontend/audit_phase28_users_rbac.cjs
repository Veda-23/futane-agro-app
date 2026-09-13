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

  // Navigate to Users & RBAC
  console.log('Clicking Users & RBAC subtab...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.settings-nav-pill, button')).find(e => e.textContent.includes('Users & RBAC'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1200);

  // 1. Desktop Users Directory Main View
  console.log('Capturing phase28_01_desktop_users.png...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase28_01_desktop_users.png') });

  // 2. Test User Search & Filter
  console.log('Testing User Search & Filter...');
  const searchInput = await page.$('.users-search-input');
  if (searchInput) {
    await searchInput.fill('Rajesh');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase28_02_user_search_filter.png') });
    await searchInput.fill('');
    await page.waitForTimeout(400);
  }

  // 3. Open Edit User Profile Modal
  console.log('Opening Edit User Profile Modal...');
  await page.evaluate(() => {
    const editBtns = Array.from(document.querySelectorAll('.btn-action-subtle[title*="Edit user profile"]'));
    if (editBtns.length > 1) editBtns[1].click(); // Click second user (Rajesh Patil)
    else if (editBtns.length > 0) editBtns[0].click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase28_03_edit_user_modal.png') });

  // Close modal
  await page.evaluate(() => {
    const cancelBtn = Array.from(document.querySelectorAll('.notif-btn-secondary')).find(b => b.textContent.includes('Cancel'));
    if (cancelBtn) cancelBtn.click();
  });
  await page.waitForTimeout(400);

  // 4. Open Change Role Modal
  console.log('Opening Change Role Modal...');
  await page.evaluate(() => {
    const roleBtns = Array.from(document.querySelectorAll('.btn-action-subtle[title*="Change assigned role"]'));
    if (roleBtns.length > 1) roleBtns[1].click();
    else if (roleBtns.length > 0) roleBtns[0].click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase28_04_change_role_modal.png') });

  // Close modal
  await page.evaluate(() => {
    const cancelBtn = Array.from(document.querySelectorAll('.notif-btn-secondary')).find(b => b.textContent.includes('Cancel'));
    if (cancelBtn) cancelBtn.click();
  });
  await page.waitForTimeout(400);

  // 5. Open Invite User Modal
  console.log('Opening Invite User Modal...');
  await page.evaluate(() => {
    const inviteBtn = Array.from(document.querySelectorAll('.notif-btn-action')).find(b => b.textContent.includes('Invite User'));
    if (inviteBtn) inviteBtn.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase28_05_invite_user_modal.png') });

  // Close modal
  await page.evaluate(() => {
    const cancelBtn = Array.from(document.querySelectorAll('.notif-btn-secondary')).find(b => b.textContent.includes('Cancel'));
    if (cancelBtn) cancelBtn.click();
  });
  await page.waitForTimeout(400);

  // 6. Switch to Role Permission Matrix View
  console.log('Switching to Role Permission Matrix View...');
  await page.evaluate(() => {
    const matrixBtn = Array.from(document.querySelectorAll('.notif-section-btn')).find(b => b.textContent.includes('Role Permission Matrix'));
    if (matrixBtn) matrixBtn.click();
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase28_06_rbac_matrix_view.png') });

  // 7. Select MANAGER role and trigger batch action
  console.log('Testing Manager Role & Batch Action...');
  await page.evaluate(() => {
    const rolePills = Array.from(document.querySelectorAll('.matrix-role-pill'));
    const managerPill = rolePills.find(p => p.textContent.includes('MANAGER'));
    if (managerPill) managerPill.click();
  });
  await page.waitForTimeout(600);
  // Click "All Export" batch button
  await page.evaluate(() => {
    const exportBtn = Array.from(document.querySelectorAll('.batch-btn')).find(b => b.textContent.includes('All Export'));
    if (exportBtn) exportBtn.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase28_07_matrix_toggle_batch.png') });

  // 8. Switch to Roles & Entitlements Overview Tab
  console.log('Switching to Roles & Entitlements Overview Tab...');
  await page.evaluate(() => {
    const rolesBtn = Array.from(document.querySelectorAll('.notif-section-btn')).find(b => b.textContent.includes('Roles & Entitlements'));
    if (rolesBtn) rolesBtn.click();
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase28_08_roles_overview.png') });

  // 9. Dark Mode Verification
  console.log('Enabling Dark Mode...');
  await page.evaluate(() => {
    document.body.classList.add('dark-theme');
    const matrixBtn = Array.from(document.querySelectorAll('.notif-section-btn')).find(b => b.textContent.includes('Role Permission Matrix'));
    if (matrixBtn) matrixBtn.click();
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase28_09_dark_mode.png') });

  // Restore Light Mode
  await page.evaluate(() => {
    document.body.classList.remove('dark-theme');
    const usersBtn = Array.from(document.querySelectorAll('.notif-section-btn')).find(b => b.textContent.includes('User Directory'));
    if (usersBtn) usersBtn.click();
  });
  await page.waitForTimeout(500);

  // 10. Tablet View (768px)
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
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase28_10_tablet.png') });

  // 11. Mobile View (390px)
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
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase28_11_mobile.png') });

  await browser.close();
  console.log('Audit complete! All Phase 28 screenshots generated.');
}

audit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
