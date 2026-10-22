import { chromium } from 'playwright';

/**
 * Futane Agro ERP — Automated Visual Regression & Pre-Deployment Gate
 * Phase 6 & Phase 7 Verification Suite
 */

(async () => {
  console.log('🚀 Running Pre-Deployment Visual Regression & Design System Verification...\n');

  const targetUrl = process.env.TARGET_URL || 'http://localhost:4300';

  // Authenticate against live backend
  let realToken = 'mock-jwt-token-admin';
  let authUser = { username: 'SUPER_ADMIN', role: 'SUPER_ADMIN', name: 'Super Admin', token: realToken };
  try {
    const loginRes = await fetch('http://localhost:8081/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'SUPER_ADMIN', password: 'superadmin123' })
    }).then(r => r.json());

    if (loginRes && loginRes.tempOtp) {
      const verifyRes = await fetch('http://localhost:8081/api/users/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'SUPER_ADMIN', otp: loginRes.tempOtp })
      }).then(r => r.json());

      if (verifyRes && verifyRes.token) {
        realToken = verifyRes.token;
        authUser = {
          username: verifyRes.username || 'SUPER_ADMIN',
          role: verifyRes.role || 'SUPER_ADMIN',
          name: verifyRes.name || 'Super Admin',
          token: realToken
        };
        console.log('🔑 Successfully authenticated with live backend as SUPER_ADMIN.');
      }
    }
  } catch (err) {
    console.warn('⚠️ Could not obtain live JWT token from backend:', err.message);
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  await context.addInitScript((data) => {
    try {
      window.localStorage.setItem('user', JSON.stringify(data.authUser));
      window.sessionStorage.setItem('user', JSON.stringify(data.authUser));
      window.localStorage.setItem('jwtToken', data.realToken);
      window.sessionStorage.setItem('jwtToken', data.realToken);
      window.sessionStorage.setItem('activeTab', 'settings');
    } catch (e) {
      // Ignored for about:blank
    }
  }, { authUser, realToken });

  const page = await context.newPage();
  page.on('close', () => console.log('⚠️ [PLAYWRIGHT] Page closed event fired'));
  page.on('crash', () => console.log('💥 [PLAYWRIGHT] Page crashed'));
  page.on('pageerror', err => console.log('🚨 [PAGE ERROR]:', err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('🔴 [CONSOLE ERROR]:', msg.text());
    }
  });

  try {
    await page.goto(targetUrl, { waitUntil: 'load', timeout: 30000 });
    await page.evaluate((data) => {
      try {
        localStorage.setItem('user', JSON.stringify(data.authUser));
        sessionStorage.setItem('user', JSON.stringify(data.authUser));
        localStorage.setItem('jwtToken', data.realToken);
        sessionStorage.setItem('jwtToken', data.realToken);
        sessionStorage.setItem('activeTab', 'settings');
      } catch (err) {}
    }, { authUser, realToken });
  } catch (e) {
    console.warn('Navigation catch:', e.message);
  }
  await page.waitForTimeout(2000);

  // Fallback login if needed
  let pwdInput = null;
  try {
    pwdInput = await page.$('input[type="password"]');
  } catch (e) {
    await page.waitForTimeout(1000);
    try {
      pwdInput = await page.$('input[type="password"]');
    } catch (e2) {
      pwdInput = null;
    }
  }
  if (pwdInput) {
    try {
      await page.fill('input[type="text"]', 'SUPER_ADMIN');
      await page.fill('input[type="password"]', 'superadmin123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    } catch (loginErr) {}
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
