const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Mock API endpoints for reports, audit-logs, settings
  await page.route(url => url.pathname.includes('/audit-logs'), route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1042, action: 'UPDATE', tableName: 'raw_materials', recordId: 44, timestamp: '2025-02-23T10:15:30Z', username: 'admin', ipAddress: '192.168.1.102', details: 'Updated stock quantity for HDPE Granules from 4,500kg to 5,200kg' },
      { id: 1041, action: 'CREATE', tableName: 'dispatch', recordId: 89, timestamp: '2025-02-23T09:42:10Z', username: 'sanjay.ops', ipAddress: '192.168.1.115', details: 'Generated delivery challan DC-2025-089 for Adani Agri' },
      { id: 1040, action: 'LOGIN', tableName: 'users', recordId: 1, timestamp: '2025-02-23T08:30:00Z', username: 'admin', ipAddress: '192.168.1.102', details: 'Super Admin interactive login session authenticated' }
    ]) });
  });

  // Seed storage
  await page.addInitScript(() => {
    const mockUser = {
      id: 1,
      username: 'admin',
      name: 'Vedant Mehare',
      role: 'SUPER_ADMIN',
      email: 'admin@futaneagro.com'
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('jwtToken', 'mock-jwt-jio-yono-audit');
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    sessionStorage.setItem('jwtToken', 'mock-jwt-jio-yono-audit');
  });

  console.log('Connecting to dev server http://localhost:4200 ...');
  await page.goto('http://localhost:4200/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForSelector('app-root', { timeout: 15000 });
  await page.waitForTimeout(2000);
  console.log('Connected successfully!');

  const outDir = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/31dd588e-fd68-4426-9deb-3030e10b9d4e';

  // Helper tab switcher
  const switchTab = async (tabName) => {
    await page.evaluate((t) => {
      const scope = window.ng?.getComponent?.(document.querySelector('app-root'));
      if (scope && scope.switchTab) {
        scope.switchTab(t);
      } else {
        const navItems = Array.from(document.querySelectorAll('app-sidebar li, app-sidebar button, .nav-item'));
        const item = navItems.find(el => el.textContent && el.textContent.toLowerCase().includes(t.toLowerCase()));
        if (item) item.click();
      }
    }, tabName);
    await page.waitForTimeout(1400);
  };

  // 1. Reports & Intelligence
  console.log('Capturing jio_yono_reports.png...');
  await switchTab('reports');
  await page.screenshot({ path: path.join(outDir, 'jio_yono_reports.png'), fullPage: false });

  // 2. Security Audit Logs
  console.log('Capturing jio_yono_audit_logs.png...');
  await switchTab('audit-logs');
  await page.screenshot({ path: path.join(outDir, 'jio_yono_audit_logs.png'), fullPage: false });

  // 3. Settings & Admin Control Center
  console.log('Capturing jio_yono_settings.png...');
  await switchTab('settings');
  await page.screenshot({ path: path.join(outDir, 'jio_yono_settings.png'), fullPage: false });

  console.log('🎉 Phase 7 Visual Audits Captured Successfully!');
  await browser.close();
})().catch(err => {
  console.error('Phase 7 audit error:', err);
  process.exit(1);
});
