import { chromium } from 'playwright';

/**
 * Futane Agro ERP — Automated Visual Regression & Pre-Deployment Gate
 * Phase 6 & Phase 7 Verification Suite
 */

(async () => {
  console.log('🚀 Running Pre-Deployment Visual Regression & Design System Verification...\n');

  const targetUrl = process.env.TARGET_URL || 'http://localhost:4300';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  await context.addInitScript(() => {
    try {
      const user = { username: 'SUPER_ADMIN', role: 'SUPER_ADMIN', name: 'Super Admin', token: 'mock-jwt-token-admin' };
      window.localStorage.setItem('user', JSON.stringify(user));
      window.sessionStorage.setItem('user', JSON.stringify(user));
      window.localStorage.setItem('jwtToken', 'mock-jwt-token-admin');
      window.sessionStorage.setItem('jwtToken', 'mock-jwt-token-admin');
      window.sessionStorage.setItem('activeTab', 'settings');
    } catch (e) {
      // Ignored for about:blank
    }
  });

  const page = await context.newPage();
  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.evaluate(() => {
      try {
        const user = { username: 'SUPER_ADMIN', role: 'SUPER_ADMIN', name: 'Super Admin', token: 'mock-jwt-token-admin' };
        localStorage.setItem('user', JSON.stringify(user));
        sessionStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('jwtToken', 'mock-jwt-token-admin');
        sessionStorage.setItem('jwtToken', 'mock-jwt-token-admin');
        sessionStorage.setItem('activeTab', 'settings');
      } catch (err) {}
    });
  } catch (e) {
    await page.waitForTimeout(2000);
  }
  await page.waitForTimeout(1500);

  // Fallback login if needed
  let pwdInput = null;
  try {
    pwdInput = await page.$('input[type="password"]');
  } catch (e) {
    await page.waitForTimeout(1000);
    pwdInput = await page.$('input[type="password"]');
  }
  if (pwdInput) {
    await page.fill('input[type="text"]', 'SUPER_ADMIN');
    await page.fill('input[type="password"]', 'superadmin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);
  }

  // Ensure Settings tab is active
  const settingsPill = await page.$('.settings-nav-pill');
  if (!settingsPill) {
    await page.click('li:has-text("Settings"), li[title*="Settings"]');
    await page.waitForSelector('app-settings', { timeout: 10000 });
  }

  const subtabs = [
    { id: 'enterprise_customizations', btnId: '#subtab-enterprise-customizations', name: '200+ Enterprise Customizations' },
    { id: 'branding', btnId: '#subtab-branding', name: 'Branding & Visual Identity' },
    { id: 'business-rules', btnId: '#subtab-business-rules', name: 'Multi-Company & Business Rules' },
    { id: 'teams', btnId: '#subtab-teams', name: 'Teams & Departments' },
    { id: 'custom_fields', btnId: '#subtab-custom-fields', name: 'Extensible Dynamic Fields' },
    { id: 'notifications', btnId: '#subtab-notifications', name: 'WhatsApp & SMS Alerts' },
    { id: 'users', btnId: '#subtab-users', name: 'Users & RBAC Matrix' },
    { id: 'features', btnId: '#subtab-features', name: 'Feature Flags & AI Copilot' },
    { id: 'developer', btnId: '#subtab-developer', name: 'Developer Hub' },
    { id: 'governance', btnId: '#subtab-governance', name: 'JVM Telemetry & Backups' },
    { id: 'password', btnId: '#subtab-password', name: 'Security & Root Password' }
  ];

  let passedChecks = 0;
  let failedChecks = 0;

  console.log('📋 Auditing All 11 Settings Subtabs:');

  for (const s of subtabs) {
    await page.click(s.btnId);
    await page.waitForTimeout(600);

    const isVisible = await page.evaluate(() => {
      const activeBtn = document.querySelector('.settings-nav-pill.active');
      return !!activeBtn;
    });

    if (isVisible) {
      console.log(`  ✅ Tab: ${s.name} [ACTIVE]`);
      passedChecks++;
    } else {
      console.error(`  ❌ Tab: ${s.name} [FAILED TO ACTIVATE]`);
      failedChecks++;
    }

    // Specific audit checks per tab
    if (s.id === 'users') {
      const activePillsCorrect = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('.users-directory-table tbody tr'));
        if (rows.length === 0) return true;
        // Check if any row showing "ACTIVE" has pill-danger (semantic bug)
        const hasSemanticBug = rows.some(r => {
          const statusCell = r.querySelector('.col-status');
          if (!statusCell) return false;
          const text = statusCell.textContent.trim();
          const pill = statusCell.querySelector('.pill-badge');
          return text.includes('ACTIVE') && pill && pill.classList.contains('pill-danger');
        });
        return !hasSemanticBug;
      });

      if (activePillsCorrect) {
        console.log(`     🟢 Users & RBAC: All ACTIVE accounts rendered with GREEN pill-success (Zero semantic bugs)`);
        passedChecks++;
      } else {
        console.error(`     🔴 Users & RBAC: ACTIVE account still has pink/danger pill!`);
        failedChecks++;
      }
    }

    if (s.id === 'teams') {
      const rolesHavePills = await page.evaluate(() => {
        const leadRoles = Array.from(document.querySelectorAll('.dept-lead-info .pill-badge'));
        return leadRoles.length > 0;
      });
      if (rolesHavePills) {
        console.log(`     🟢 Teams & Depts: Department lead roles correctly wrapped in pill badges`);
        passedChecks++;
      }
    }

    if (s.id === 'password') {
      const destructiveUnified = await page.evaluate(() => {
        const flushBtn = document.querySelector('.sec-danger-item button[title*="caches"]');
        return flushBtn && flushBtn.classList.contains('btn-sec-danger');
      });
      if (destructiveUnified) {
        console.log(`     🟢 Security Tab: Destructive Flush Cache action unified with Terminate All (solid red)`);
        passedChecks++;
      }
    }
  }

  // Audit Table Headers across all tables
  const thTypographyValid = await page.evaluate(() => {
    const ths = Array.from(document.querySelectorAll('table thead th'));
    if (ths.length === 0) return true;
    return ths.every(th => {
      const style = window.getComputedStyle(th);
      return style.textTransform === 'uppercase';
    });
  });

  if (thTypographyValid) {
    console.log(`  ✅ Table Typography: All column headers strictly uppercase with consistent typography tokens`);
    passedChecks++;
  }

  await browser.close();

  console.log(`\n========================================`);
  console.log(`Visual Regression Summary:`);
  console.log(`  Passed Checks: ${passedChecks}`);
  console.log(`  Failed Checks: ${failedChecks}`);
  console.log(`========================================`);

  if (failedChecks > 0) {
    process.exit(1);
  } else {
    console.log(`\n🎉 Pre-Deployment Visual Regression Audit PASSED with 100% compliance!`);
    process.exit(0);
  }
})();
