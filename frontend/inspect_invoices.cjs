const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('[BROWSER CONSOLE]', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('[BROWSER PAGE ERROR]', err.message));

  const mockParties = [
    { id: 1, partyName: 'Sahyadri Agro Traders', gstNumber: '27AABCS1429B1Z1', email: 'sahyadri@agro.in', phone: '9822011223', address: 'Market Yard, Pune 411037' },
    { id: 2, partyName: 'Kisan Fresh Produce Co.', gstNumber: '27AAACK9921D1ZB', email: 'billing@kisanfresh.com', phone: '9822044556', address: 'APMC Vashi, Navi Mumbai 400703' },
    { id: 3, partyName: 'Shree Ganesh Polymer Pack', gstNumber: '27AABCP8832F1ZY', email: 'ganeshpoly@gmail.com', phone: '9822077889', address: 'MIDC Shiroli, Kolhapur 416122' },
    { id: 4, partyName: 'Maharashtra Dairy Logistics', gstNumber: '27AABCM7721H1ZQ', email: 'accounts@mahadairy.org', phone: '9822099001', address: 'Gokul Shirgaon, Kolhapur 416234' }
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
  try {
    await page.goto('http://localhost:4200/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  } catch (e) {
    console.error('Failed to load page:', e.message);
    await browser.close();
    process.exit(1);
  }

  await page.waitForTimeout(2000);

  // Switch to invoices tab
  console.log('Switching to invoices tab...');
  await page.evaluate(() => {
    const app = document.querySelector('app-root');
    if (app && window.ng) {
      const comp = window.ng.getComponent(app);
      if (comp) {
        comp.switchTab('invoices');
        return;
      }
    }
    // Fallback: click sidebar item
    const navItems = Array.from(document.querySelectorAll('.sidebar li, [aria-label*="Invoice"], [title*="Invoice"]'));
    for (const item of navItems) {
      if (item.textContent.includes('Invoice') || item.getAttribute('title')?.includes('Invoice')) {
        item.click();
        return;
      }
    }
  });

  await page.waitForTimeout(1500);

  await page.screenshot({ path: path.join(outDir, 'invoices_initial_inspect.png'), fullPage: false });
  console.log('Captured invoices_initial_inspect.png');

  // Try opening View modal if there are rows
  const viewButtons = await page.$$('.btn-row-action.btn-view');
  console.log(`Found ${viewButtons.length} view buttons`);
  if (viewButtons.length > 0) {
    await viewButtons[0].click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, 'invoices_initial_modal.png'), fullPage: false });
    console.log('Captured invoices_initial_modal.png');
    // Close modal
    const closeBtn = await page.$('.modal-close-btn');
    if (closeBtn) await closeBtn.click();
    await page.waitForTimeout(500);
  }

  // Dark mode test
  await page.evaluate(() => {
    document.body.classList.add('dark-mode');
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, 'invoices_initial_dark.png'), fullPage: false });
  console.log('Captured invoices_initial_dark.png');

  await browser.close();
  console.log('Inspection complete.');
})();
