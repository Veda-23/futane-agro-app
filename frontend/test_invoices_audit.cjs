const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('=== STARTING GST BILLING HUB & TAX INVOICES AUDIT ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[BROWSER CONSOLE ERROR]', msg.text());
  });
  page.on('pageerror', err => console.log('[BROWSER PAGE ERROR]', err.message));

  const mockParties = [
    { id: 1, partyName: 'Sahyadri Agro Traders', gstNumber: '27AABCS1429B1Z1', email: 'sahyadri@agro.in', phone: '9822011223', address: 'Plot 14, Market Yard, Pune 411037' },
    { id: 2, partyName: 'Kisan Fresh Produce Co.', gstNumber: '27AAACK9921D1ZB', email: 'billing@kisanfresh.com', phone: '9822044556', address: 'Sector 19, APMC Vashi, Navi Mumbai 400703' },
    { id: 3, partyName: 'Shree Ganesh Polymer Pack', gstNumber: '27AABCP8832F1ZY', email: 'ganeshpoly@gmail.com', phone: '9822077889', address: 'Plot 82, MIDC Shiroli, Kolhapur 416122' },
    { id: 4, partyName: 'Maharashtra Dairy Logistics', gstNumber: '27AABCM7721H1ZQ', email: 'accounts@mahadairy.org', phone: '9822099001', address: 'Plot 5, Gokul Shirgaon, Kolhapur 416234' }
  ];

  const mockInvoices = [
    {
      id: 501,
      invoiceNo: 'FA/INV/2026/0891',
      createdDate: '2026-03-01',
      sale: {
        id: 101,
        party: mockParties[0],
        crateType: 'Jumbo Perforated Crate (600x400x325mm)',
        crateMaterial: 'Virgin HDPE (Food Grade)',
        quantity: 500,
        rate: 450,
        cgst: 20250,
        sgst: 20250,
        totalAmount: 265500,
        paid: 265500,
        remaining: 0
      }
    },
    {
      id: 502,
      invoiceNo: 'FA/INV/2026/0892',
      createdDate: '2026-03-03',
      sale: {
        id: 102,
        party: mockParties[1],
        crateType: 'Dairy Milk Pouch Crate (12-Pocket)',
        crateMaterial: 'Polypropylene Copolymer (PPCP)',
        quantity: 800,
        rate: 320,
        cgst: 23040,
        sgst: 23040,
        totalAmount: 302080,
        paid: 150000,
        remaining: 152080
      }
    },
    {
      id: 503,
      invoiceNo: 'FA/INV/2026/0893',
      createdDate: '2026-03-05',
      sale: {
        id: 103,
        party: mockParties[2],
        crateType: 'Agro Harvest Vented Tray (540x360x290mm)',
        crateMaterial: 'Recycled HDPE Heavy-Duty',
        quantity: 350,
        rate: 280,
        cgst: 8820,
        sgst: 8820,
        totalAmount: 115640,
        paid: 0,
        remaining: 115640
      }
    },
    {
      id: 504,
      invoiceNo: 'FA/INV/2026/0894',
      createdDate: '2026-03-07',
      sale: {
        id: 104,
        party: mockParties[3],
        crateType: 'Multi-Utility Industrial Crate (Heavy Duty)',
        crateMaterial: 'High-Impact Copolymer',
        quantity: 1200,
        rate: 520,
        cgst: 56160,
        sgst: 56160,
        totalAmount: 736320,
        paid: 736320,
        remaining: 0
      }
    },
    {
      id: 505,
      invoiceNo: 'FA/INV/2026/0895',
      createdDate: '2026-03-09',
      sale: {
        id: 105,
        party: mockParties[0],
        crateType: 'Standard Fruit Crate (500x325x250mm)',
        crateMaterial: 'Virgin HDPE (UV Stabilized)',
        quantity: 400,
        rate: 380,
        cgst: 13680,
        sgst: 13680,
        totalAmount: 179360,
        paid: 100000,
        remaining: 79360
      }
    }
  ];

  await page.route('**/api/parties', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockParties) }));
  await page.route('**/api/invoices', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockInvoices) }));
  await page.route('**/api/sales', route => {
    if (route.request().method() === 'POST') {
      const data = JSON.parse(route.request().postData());
      const newInv = {
        id: 506,
        invoiceNo: 'FA/INV/2026/0896',
        createdDate: data.date || '2026-03-10',
        sale: {
          id: 106,
          party: mockParties.find(p => p.id === Number(data.party?.id)) || mockParties[0],
          crateType: data.crateType,
          crateMaterial: data.crateMaterial,
          quantity: data.quantity,
          rate: data.rate,
          cgst: data.cgst,
          sgst: data.sgst,
          totalAmount: data.totalAmount,
          paid: data.paid,
          remaining: data.remaining
        }
      };
      mockInvoices.unshift(newInv);
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
    } else {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
  });

  await page.addInitScript(() => {
    const mockUser = {
      id: 1,
      username: 'admin',
      name: 'Admin User',
      role: 'SUPER_ADMIN',
      email: 'admin@futaneagro.com'
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    localStorage.setItem('jwtToken', 'mock-jwt-token-invoices-audit');
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    sessionStorage.setItem('currentUser', JSON.stringify(mockUser));
  });

  const outDir = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/63ae1ca7-044a-4a77-a0c6-a06dc2558ecf';

  console.log('Navigating to http://localhost:4200/ ...');
  await page.goto('http://localhost:4200/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);

  // Switch to invoices tab
  console.log('Switching to invoices tab...');
  await page.evaluate(() => {
    const app = document.querySelector('app-root');
    if (app && window.ng) {
      const comp = window.ng.getComponent(app);
      if (comp) comp.switchTab('invoices');
    }
  });

  try {
    await page.waitForSelector('.enterprise-header-text h2', { timeout: 5000 });
  } catch (e) {
    console.log('Retrying tab switch via sidebar click...');
    const invoiceNavItem = await page.$('.sidebar li[aria-label*="Invoice"], .sidebar li[title*="Invoice"], li:has-text("Invoices")');
    if (invoiceNavItem) {
      await invoiceNavItem.click();
    } else {
      await page.click('text="Invoices"');
    }
    await page.waitForSelector('.enterprise-header-text h2', { timeout: 10000 });
  }

  // 1. DESKTOP BASELINE AUDIT (1440px)
  console.log('--- TEST 1: DESKTOP BASELINE (1440px) ---');
  const pageTitle = await page.$eval('.enterprise-header-text h2', el => el.textContent.trim());
  console.log(`Page title: "${pageTitle}"`);
  if (!pageTitle.includes('GST Billing Hub') && !pageTitle.includes('Tax Invoices')) {
    throw new Error('Title does not match GST Billing Hub & Tax Invoices');
  }

  const breadcrumb = await page.$eval('.invoices-breadcrumb-bar', el => el.textContent.trim());
  console.log(`Breadcrumb: "${breadcrumb}"`);

  const createBtn = await page.$('.btn-create-invoice');
  if (!createBtn) throw new Error('Create Invoice button missing in header');
  console.log('Create Invoice button is present');

  const kpiCount = await page.$$eval('.inv-kpi-card', els => els.length);
  console.log(`KPI cards count: ${kpiCount}`);
  if (kpiCount !== 4) throw new Error(`Expected 4 KPI cards, got ${kpiCount}`);

  const subtabCount = await page.$$eval('.inv-subtab-btn', els => els.length);
  console.log(`Subtabs count: ${subtabCount}`);
  if (subtabCount !== 5) throw new Error(`Expected 5 subtabs, got ${subtabCount}`);

  const rowCount = await page.$$eval('.enterprise-table tbody tr', els => els.length);
  console.log(`Table row count: ${rowCount}`);
  if (rowCount !== 5) throw new Error(`Expected 5 table rows, got ${rowCount}`);

  await page.screenshot({ path: path.join(outDir, 'invoices_main_1440.png'), fullPage: false });
  console.log('Saved invoices_main_1440.png');

  // 2. SUBTAB STATUS FILTERING
  console.log('--- TEST 2: SUBTAB STATUS FILTERING ---');
  const paidSubtab = (await page.$$('.inv-subtab-btn'))[1];
  await paidSubtab.click();
  await page.waitForTimeout(500);
  const paidRows = await page.$$eval('.enterprise-table tbody tr', els => els.length);
  console.log(`Fully Paid subtab row count: ${paidRows}`);
  if (paidRows !== 2) throw new Error(`Expected 2 paid rows, got ${paidRows}`);
  await page.screenshot({ path: path.join(outDir, 'invoices_active_subtab.png'), fullPage: false });
  console.log('Saved invoices_active_subtab.png');

  // Switch back to All
  const allSubtab = (await page.$$('.inv-subtab-btn'))[0];
  await allSubtab.click();
  await page.waitForTimeout(500);

  // 3. SEARCH & FILTERS
  console.log('--- TEST 3: SEARCH & FILTERS ---');
  const searchInput = await page.$('.inv-search-input');
  await searchInput.fill('Sahyadri');
  await page.waitForTimeout(500);
  let filteredRows = await page.$$eval('.enterprise-table tbody tr', els => els.length);
  console.log(`Search "Sahyadri" row count: ${filteredRows}`);
  if (filteredRows !== 2) throw new Error(`Expected 2 rows for Sahyadri, got ${filteredRows}`);

  // Empty search state
  await searchInput.fill('NONEXISTENT_QUERY_XYZ');
  await page.waitForTimeout(500);
  const emptyState = await page.$('app-empty-state');
  if (!emptyState) throw new Error('Empty state not displayed on zero results');
  console.log('Empty state verified for no results');
  await page.screenshot({ path: path.join(outDir, 'invoices_empty_search.png'), fullPage: false });
  console.log('Saved invoices_empty_search.png');

  // Clear filters
  const clearBtn = await page.$('.inv-filter-actions .btn-outline');
  if (clearBtn) await clearBtn.click();
  await page.waitForTimeout(500);
  const restoredRows = await page.$$eval('.enterprise-table tbody tr', els => els.length);
  console.log(`Restored row count after reset: ${restoredRows}`);

  // 4. CREATE INVOICE SLIDE-OVER DRAWER
  console.log('--- TEST 4: CREATE INVOICE DRAWER ---');
  await createBtn.click();
  await page.waitForTimeout(600);
  const drawer = await page.$('.invoice-drawer-panel');
  if (!drawer) throw new Error('Create invoice drawer did not open');
  const drawerTitle = await page.$eval('.drawer-header-title-wrap h3', el => el.textContent.trim());
  console.log(`Drawer opened: "${drawerTitle}"`);

  // Verify tax computation live update
  const qtyInput = await page.$('#invQty');
  await qtyInput.fill('200');
  const rateInput = await page.$('#invRate');
  await rateInput.fill('500');
  await page.waitForTimeout(300);

  const grandTotalText = await page.$eval('.grand-row strong', el => el.textContent.trim());
  console.log(`Live computed grand total (200 * 500 = 100,000 + 18% GST = 118,000): "${grandTotalText}"`);
  if (!grandTotalText.includes('118,000')) {
    throw new Error(`Expected 118,000 grand total, got ${grandTotalText}`);
  }

  await page.screenshot({ path: path.join(outDir, 'invoices_create_drawer.png'), fullPage: false });
  console.log('Saved invoices_create_drawer.png');

  // Close drawer
  const drawerCloseBtn = await page.$('.drawer-close-btn');
  await drawerCloseBtn.click();
  await page.waitForTimeout(500);

  // 5. TAX INVOICE PREVIEW MODAL
  console.log('--- TEST 5: PREVIEW TAX INVOICE MODAL ---');
  const viewBtns = await page.$$('.btn-row-action.btn-view');
  await viewBtns[0].click();
  await page.waitForTimeout(600);

  const modal = await page.$('.invoice-modal-card');
  if (!modal) throw new Error('Tax invoice preview modal did not open');
  const companyName = await page.$eval('.company-name', el => el.textContent.trim());
  console.log(`Company name in preview: "${companyName}"`);
  if (!companyName.includes('FUTANE AGRO INDUSTRIES')) {
    throw new Error('Company name not found in invoice preview');
  }

  const gstin = await page.$eval('.company-tax-credentials', el => el.textContent.trim());
  console.log(`Tax credentials in preview: "${gstin.replace(/\s+/g, ' ')}"`);

  await page.screenshot({ path: path.join(outDir, 'invoices_preview_modal.png'), fullPage: false });
  console.log('Saved invoices_preview_modal.png');

  // Close modal
  const modalCloseBtn = await page.$('.invoice-modal-header .modal-close-btn');
  await modalCloseBtn.click();
  await page.waitForTimeout(500);

  // 6. DARK MODE AUDIT
  console.log('--- TEST 6: DARK MODE AUDIT ---');
  await page.evaluate(() => {
    document.body.classList.add('dark-mode');
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, 'invoices_dark_mode.png'), fullPage: false });
  console.log('Saved invoices_dark_mode.png');

  // 7. RESPONSIVE TABLET (768px)
  console.log('--- TEST 7: RESPONSIVE TABLET (768px) ---');
  await page.evaluate(() => {
    document.body.classList.remove('dark-mode');
    document.documentElement.removeAttribute('data-theme');
  });
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500);
  // Dismiss sidebar backdrop if present
  await page.evaluate(() => {
    const backdrop = document.querySelector('.sidebar-backdrop');
    if (backdrop) backdrop.click();
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, 'invoices_responsive_768.png'), fullPage: false });
  console.log('Saved invoices_responsive_768.png');

  // 8. RESPONSIVE MOBILE (390px)
  console.log('--- TEST 8: RESPONSIVE MOBILE (390px) ---');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const backdrop = document.querySelector('.sidebar-backdrop');
    if (backdrop) backdrop.click();
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, 'invoices_responsive_390.png'), fullPage: false });
  console.log('Saved invoices_responsive_390.png');

  await browser.close();
  console.log('=== ALL 8 GST BILLING HUB & TAX INVOICES AUDIT TESTS PASSED! ===');
})();
