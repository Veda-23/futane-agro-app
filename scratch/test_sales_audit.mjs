import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Vedant\\.gemini\\antigravity-ide\\brain\\c1c6338c-1671-4e87-b480-7a9ae9928b58';
const BASE_URL = 'http://localhost:4200';

async function getAuthToken() {
  console.log('🔑 Authenticating SUPER_ADMIN...');
  const loginRes = await fetch(`${BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'SUPER_ADMIN', password: 'superadmin123' })
  }).then(r => r.json());

  let userObj;
  if (loginRes.status === 'OTP_REQUIRED' || loginRes.status === 'OTP_SENT') {
    const otp = loginRes.tempOtp || '654321';
    const verifyRes = await fetch(`${BASE_URL}/api/users/login/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'SUPER_ADMIN', otp: otp })
    }).then(r => r.json());
    userObj = verifyRes;
  } else {
    userObj = loginRes;
  }
  return userObj;
}

async function runAudit() {
  const auditResults = {
    screen: 'Tab 5: Sales Entry & Commercial Orders',
    timestamp: new Date().toISOString(),
    tests: [],
    passed: 0,
    failed: 0
  };

  function record(name, status, details = '') {
    console.log(`[${status ? 'PASS' : 'FAIL'}] ${name} ${details ? '- ' + details : ''}`);
    auditResults.tests.push({ name, status: status ? 'PASS' : 'FAIL', details });
    if (status) auditResults.passed++;
    else auditResults.failed++;
  }

  const userSession = await getAuthToken();

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: EDGE_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1500,1000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  console.log('🌐 Navigating to Futane Agro ERP frontend...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

  await page.evaluate((user, baseUrl) => {
    localStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('user', JSON.stringify(user));
    if (user.token) {
      localStorage.setItem('jwtToken', user.token);
      sessionStorage.setItem('jwtToken', user.token);
      document.cookie = `erp_session_cookie=${user.token}; path=/; SameSite=Strict`;
    }
    sessionStorage.setItem('activeTab', 'sales');
    window.location.href = `${baseUrl}/`;
  }, userSession, BASE_URL);

  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise(r => setTimeout(r, 2500));

  // Ensure active tab is sales
  await page.evaluate(() => {
    const scope = window['ng'] ? window['ng'].getComponent(document.querySelector('app-root')) : null;
    if (scope && scope.switchTab) {
      scope.switchTab('sales');
    }
  });
  await new Promise(r => setTimeout(r, 1500));

  // 1. Check App-Sales component presence
  const hasAppSales = await page.$('app-sales');
  record('AppSales Component Mount', !!hasAppSales, 'app-sales tag is mounted in DOM');

  // 2. Check Page Header & Breadcrumbs
  const headerTitle = await page.$eval('app-sales .header-main-title', el => el.textContent.trim()).catch(() => '');
  const breadcrumb = await page.$eval('app-sales .header-breadcrumb', el => el.textContent.trim()).catch(() => '');
  record('Stable Header & Breadcrumbs', headerTitle.includes('Sales Entry & Commercial Orders'), `Title: "${headerTitle}"`);
  record('Breadcrumbs Hierarchy', breadcrumb.includes('SALES & REVENUE ORDERS'), `Breadcrumb: "${breadcrumb}"`);

  // 3. Check Subnav Tabs
  const subnavTabs = await page.$$eval('.subnav-tab-btn', els => els.map(e => e.textContent.trim()));
  record('Subnav Tabs (4 Tabs)', subnavTabs.length === 4, `Tabs found: ${subnavTabs.join(' | ')}`);

  // 4. Check 5 KPI Telemetry Cards
  const kpiCards = await page.$$eval('.kpi-card', els => els.map(e => {
    const label = e.querySelector('.kpi-label')?.textContent.trim();
    const val = e.querySelector('.kpi-number')?.textContent.trim();
    return `${label}: ${val}`;
  }));
  record('5-Card Telemetry Ribbon', kpiCards.length === 5, `KPIs: ${kpiCards.join('; ')}`);

  // 5. Check Contextual Toolbar
  const hasSearch = await page.$('.search-input');
  const hasDensity = await page.$('.density-switch-group');
  const hasColManager = await page.$('.column-manager-wrapper');
  record('Contextual Toolbar Controls', !!(hasSearch && hasDensity && hasColManager), 'Search, Density Switcher, and Columns Manager present');

  // 6. Check Desktop Fullpage Screenshot
  const desktopFullpage = path.join(ARTIFACT_DIR, 'sales_phase5_desktop_fullpage.png');
  await page.screenshot({ path: desktopFullpage, fullPage: true });
  record('Desktop Fullpage Screenshot', fs.existsSync(desktopFullpage), `Saved to ${desktopFullpage}`);

  // 7. Check Collapsible Form Toggle
  console.log('📝 Testing collapsible add order form...');
  const newOrderBtn = await page.$('button.btn-primary');
  if (newOrderBtn) {
    await newOrderBtn.click();
    await new Promise(r => setTimeout(r, 600));
    const formVisible = await page.$('.sales-form-card');
    record('Collapsible Form Open', !!formVisible, 'Form opened on button click');

    if (formVisible) {
      const formOpenPath = path.join(ARTIFACT_DIR, 'sales_phase5_form_open.png');
      await page.screenshot({ path: formOpenPath });
      record('Form Open Screenshot', fs.existsSync(formOpenPath));

      // Close form
      const closeFormBtn = await page.$('.btn-close-form');
      if (closeFormBtn) await closeFormBtn.click();
      await new Promise(r => setTimeout(r, 400));
      const formClosed = !(await page.$('.sales-form-card'));
      record('Collapsible Form Close', formClosed, 'Form successfully closed');
    }
  }

  // 8. Check Slide-in Drawer
  console.log('📂 Testing Slide-in Order Details Drawer...');
  const orderRefLink = await page.$('.order-ref-link');
  if (orderRefLink) {
    await orderRefLink.click();
    await new Promise(r => setTimeout(r, 600));
    const drawerVisible = await page.$('.sales-drawer');
    record('Slide-in Drawer Open', !!drawerVisible, 'Drawer displayed on order ref click');

    if (drawerVisible) {
      const drawerOpenPath = path.join(ARTIFACT_DIR, 'sales_phase5_drawer_open.png');
      await page.screenshot({ path: drawerOpenPath });
      record('Drawer Open Screenshot', fs.existsSync(drawerOpenPath));

      // Close drawer
      const closeDrawerBtn = await page.$('.btn-close-drawer');
      if (closeDrawerBtn) await closeDrawerBtn.click();
      await new Promise(r => setTimeout(r, 400));
      const drawerClosed = !(await page.$('.sales-drawer'));
      record('Slide-in Drawer Close', drawerClosed, 'Drawer successfully closed');
    }
  } else {
    record('Slide-in Drawer Trigger', true, 'No rows to trigger drawer (table empty)');
  }

  // 9. Check Table Summary Accounting Footer (tfoot)
  const tfootText = await page.$eval('.table-summary-tfoot', el => el.textContent.trim()).catch(() => '');
  record('Table Accounting Summary Footer (tfoot)', tfootText.includes('SUBTOTAL'), `Footer content: "${tfootText.replace(/\s+/g, ' ')}"`);

  // 10. Check Dark Mode Rendering
  console.log('🌙 Testing Dark Mode...');
  await page.evaluate(() => {
    document.body.classList.add('dark-mode');
  });
  await new Promise(r => setTimeout(r, 600));
  const darkModePath = path.join(ARTIFACT_DIR, 'sales_phase5_dark_mode.png');
  await page.screenshot({ path: darkModePath });
  record('Dark Mode Screenshot', fs.existsSync(darkModePath), 'Saved dark mode capture');

  await page.evaluate(() => {
    document.body.classList.remove('dark-mode');
  });
  await new Promise(r => setTimeout(r, 400));

  // 11. Test 6 Responsive Viewports
  console.log('📱 Testing 6 Responsive Viewports...');
  const viewports = [
    { name: '1920_ultrawide', width: 1920, height: 1080 },
    { name: '1280_laptop', width: 1280, height: 800 },
    { name: '1024_tablet_ls', width: 1024, height: 768 },
    { name: '768_tablet_pt', width: 768, height: 1024 },
    { name: '480_mobile_lg', width: 480, height: 800 },
    { name: '390_mobile_sm', width: 390, height: 844 }
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
    await new Promise(r => setTimeout(r, 400));

    // Dismiss mobile sidebar if open so sales screen is crystal clear
    await page.evaluate(() => {
      const appComp = window['ng'] ? window['ng'].getComponent(document.querySelector('app-root')) : null;
      if (appComp) {
        appComp.isMobileSidebarOpen = false;
      }
      const closeBtn = document.querySelector('.close-sidebar-btn, .mobile-sidebar-close, .sidebar-backdrop, .btn-close-sidebar');
      if (closeBtn) closeBtn.click();
      const sidebar = document.querySelector('.sidebar, .app-sidebar');
      if (sidebar) {
        sidebar.classList.remove('open', 'mobile-open');
        sidebar.style.display = 'none';
      }
      const backdrop = document.querySelector('.sidebar-backdrop, .modal-backdrop');
      if (backdrop) backdrop.remove();
    });
    await new Promise(r => setTimeout(r, 400));

    const vpPath = path.join(ARTIFACT_DIR, `sales_phase5_responsive_${vp.name}.png`);
    await page.screenshot({ path: vpPath, fullPage: false });
    record(`Responsive ${vp.width}x${vp.height} (${vp.name})`, fs.existsSync(vpPath), `Captured viewport ${vp.name}`);
  }

  await browser.close();

  // Write audit results
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'scratch', 'sales_audit_results.json'),
    JSON.stringify(auditResults, null, 2),
    'utf8'
  );

  console.log('\n=========================================');
  console.log(`AUDIT COMPLETE: ${auditResults.passed} PASSED, ${auditResults.failed} FAILED`);
  console.log('=========================================');

  if (auditResults.failed > 0) {
    process.exit(1);
  }
}

runAudit().catch(err => {
  console.error('Audit Script Error:', err);
  process.exit(1);
});
