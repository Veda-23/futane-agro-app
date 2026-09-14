const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/ba9f908a-f4fc-45e1-9126-b90978811490';
const SCREENSHOTS_DIR = path.join(ARTIFACT_DIR, 'audit_screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const ALL_TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'production', label: 'Production' },
  { key: 'monthly-production', label: 'Monthly Summary' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'machines', label: 'Machines' },
  { key: 'raw-materials', label: 'Raw Materials' },
  { key: 'vendors', label: 'Vendors' },
  { key: 'sales', label: 'Sales' },
  { key: 'dispatch', label: 'Dispatch' },
  { key: 'transports', label: 'Transport' },
  { key: 'drivers', label: 'Drivers' },
  { key: 'parties', label: 'Parties' },
  { key: 'payments', label: 'Payments' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'billinghub', label: 'Billing Hub' },
  { key: 'bank', label: 'Bank Ledger' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'salaries', label: 'Salaries' },
  { key: 'employees', label: 'Employees' },
  { key: 'reports', label: 'Reports' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'audit-logs', label: 'Audit Logs' },
  { key: 'settings', label: 'Settings' }
];

async function runAudit() {
  console.log('--- STARTING COMPREHENSIVE UI AUDIT ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Connecting to http://localhost:4200...');
  await page.goto('http://localhost:4200', { waitUntil: 'domcontentloaded' });

  // Authenticate as Super Admin
  await page.evaluate(() => {
    const mockUser = {
      id: 1,
      username: 'SUPER_ADMIN',
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
    localStorage.setItem('theme', 'light');
    document.body.classList.remove('dark-theme');
  });

  const auditReport = {
    tabs: [],
    inconsistencies: []
  };

  for (const tab of ALL_TABS) {
    console.log(`Auditing tab: ${tab.key} (${tab.label})...`);
    await page.evaluate((k) => {
      localStorage.setItem('activeTab', k);
      sessionStorage.setItem('activeTab', k);
      const appComp = window['ng']?.getComponent?.(document.querySelector('app-root'));
      if (appComp && appComp.switchTab) {
        appComp.switchTab(k);
      }
    }, tab.key);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1400);

    const shotFile = `tab_${tab.key}.png`;
    const shotPath = path.join(SCREENSHOTS_DIR, shotFile);
    await page.screenshot({ path: shotPath, fullPage: false });

    // Inspect metrics on this page
    const metrics = await page.evaluate((tabKey) => {
      const buttons = Array.from(document.querySelectorAll('button:not(.mobile-close-btn):not(.user-card-hide-btn)')).map(b => {
        const style = window.getComputedStyle(b);
        const rect = b.getBoundingClientRect();
        return {
          text: b.innerText.trim().replace(/\\n/g, ' ').slice(0, 30),
          className: b.className,
          height: Math.round(rect.height),
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          background: style.backgroundColor,
          borderRadius: style.borderRadius,
          padding: style.padding
        };
      }).filter(b => b.height > 0 && b.text);

      const tables = Array.from(document.querySelectorAll('table')).map(t => {
        const th = t.querySelector('th');
        const td = t.querySelector('td');
        const thStyle = th ? window.getComputedStyle(th) : null;
        const tdStyle = td ? window.getComputedStyle(td) : null;
        return {
          headerHeight: th ? Math.round(th.getBoundingClientRect().height) : null,
          rowHeight: td ? Math.round(td.getBoundingClientRect().height) : null,
          headerBg: thStyle ? thStyle.backgroundColor : null,
          headerFontSize: thStyle ? thStyle.fontSize : null,
          cellFontSize: tdStyle ? tdStyle.fontSize : null
        };
      });

      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea')).map(inp => {
        const rect = inp.getBoundingClientRect();
        const style = window.getComputedStyle(inp);
        return {
          type: inp.tagName.toLowerCase() + (inp.type ? `[${inp.type}]` : ''),
          placeholder: inp.placeholder || '',
          height: Math.round(rect.height),
          fontSize: style.fontSize,
          borderRadius: style.borderRadius
        };
      }).filter(i => i.height > 0);

      const cards = Array.from(document.querySelectorAll('.card, .kpi-card, .stat-card, .data-card, .metric-card, .glass-panel')).map(c => {
        const style = window.getComputedStyle(c);
        const rect = c.getBoundingClientRect();
        return {
          className: c.className.split(' ').slice(0, 3).join(' '),
          padding: style.padding,
          borderRadius: style.borderRadius,
          border: style.border,
          height: Math.round(rect.height)
        };
      }).filter(c => c.height > 0);

      const subtabs = Array.from(document.querySelectorAll('.subtab-btn, .tab-btn, .nav-tabs .nav-link, .pill-btn, .action-pill')).map(st => {
        const style = window.getComputedStyle(st);
        const rect = st.getBoundingClientRect();
        return {
          text: st.innerText.trim(),
          height: Math.round(rect.height),
          isActive: st.classList.contains('active') || style.fontWeight > 600,
          fontSize: style.fontSize,
          borderRadius: style.borderRadius
        };
      });

      const titles = Array.from(document.querySelectorAll('.page-title, .header-main-title, h1, h2, .tab-title, .cch-titles h2, .master-hub-title')).map(h => {
        const style = window.getComputedStyle(h);
        return {
          tag: h.tagName,
          text: h.innerText.trim().slice(0, 40),
          fontSize: style.fontSize,
          fontWeight: style.fontWeight
        };
      });

      return {
        buttonsCount: buttons.length,
        buttonSamples: buttons.slice(0, 8),
        tablesCount: tables.length,
        tableMetrics: tables[0] || null,
        inputsCount: inputs.length,
        inputSamples: inputs.slice(0, 5),
        cardsCount: cards.length,
        cardSamples: cards.slice(0, 4),
        subtabsCount: subtabs.length,
        subtabSamples: subtabs.slice(0, 6),
        titles: titles.slice(0, 3)
      };
    }, tab.key);

    auditReport.tabs.push({
      tab: tab.key,
      label: tab.label,
      screenshot: shotFile,
      metrics
    });
  }

  // Also capture Dark Mode for Dashboard and a couple of tabs
  console.log('Capturing dark mode samples...');
  await page.evaluate(() => {
    document.body.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark');
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'dark_dashboard.png'), fullPage: false });

  // Production tab in dark mode
  await page.evaluate(() => {
    localStorage.setItem('activeTab', 'production');
    sessionStorage.setItem('activeTab', 'production');
    const appComp = window['ng']?.getComponent?.(document.querySelector('app-root'));
    if (appComp && appComp.switchTab) appComp.switchTab('production');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    document.body.classList.add('dark-theme');
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'dark_production.png'), fullPage: false });

  // Invoices tab in dark mode
  await page.evaluate(() => {
    localStorage.setItem('activeTab', 'invoices');
    sessionStorage.setItem('activeTab', 'invoices');
    const appComp = window['ng']?.getComponent?.(document.querySelector('app-root'));
    if (appComp && appComp.switchTab) appComp.switchTab('invoices');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    document.body.classList.add('dark-theme');
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'dark_invoices.png'), fullPage: false });

  // Capture responsive viewports for Dashboard and Production
  console.log('Capturing responsive viewports...');
  for (const vp of [
    { w: 1024, h: 768, name: 'tablet_1024' },
    { w: 768, h: 1024, name: 'tablet_768' },
    { w: 390, h: 844, name: 'mobile_390' }
  ]) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.evaluate(() => {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
      localStorage.setItem('activeTab', 'dashboard');
      sessionStorage.setItem('activeTab', 'dashboard');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `responsive_dashboard_${vp.name}.png`), fullPage: false });
  }

  fs.writeFileSync(path.join(ARTIFACT_DIR, 'audit_report.json'), JSON.stringify(auditReport, null, 2));
  console.log(`Audit complete! Saved ${ALL_TABS.length + 6} screenshots and audit_report.json.`);

  await browser.close();
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
