import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  console.log('Launching Microsoft Edge...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to login...');
  await page.goto('http://localhost:4200/#/login', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  console.log('Logging in as SUPER_ADMIN via evaluate...');
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    if (inputs[0]) {
      inputs[0].value = 'SUPER_ADMIN';
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (inputs[1]) {
      inputs[1].value = 'superadmin123';
      inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
    }
    const btn = document.querySelector('button[type="submit"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Login') || b.textContent.includes('Sign In'));
    if (btn) btn.click();
  });

  await new Promise(r => setTimeout(r, 2000));

  // Check if 2-Step OTP screen is active
  await page.waitForSelector('.uat-otp-helper-card, button[type="submit"]', { timeout: 4000 }).catch(() => {});
  const otpHelper = await page.$('.uat-otp-helper-card');
  if (otpHelper) {
    console.log('Clicking .uat-otp-helper-card to fill OTP...');
    await otpHelper.click();
    await new Promise(r => setTimeout(r, 600));
    console.log('Clicking submit to verify OTP...');
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"], .enterprise-primary-btn');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2500));
  }

  // Double check authentication state
  let isAuth = await page.evaluate(() => {
    return document.querySelector('.header') !== null || document.querySelector('app-header') !== null;
  });

  if (!isAuth) {
    console.log('Ensuring auth session in localStorage...');
    await page.evaluate(() => {
      const u = {
        id: 1,
        username: 'SUPER_ADMIN',
        fullName: 'Super Administrator',
        role: 'SUPER_ADMIN',
        token: 'mock_jwt_token_2026',
        permissions: ['ALL']
      };
      localStorage.setItem('user', JSON.stringify(u));
      sessionStorage.setItem('user', JSON.stringify(u));
      localStorage.setItem('jwtToken', u.token);
      sessionStorage.setItem('jwtToken', u.token);
      localStorage.setItem('isLoggedIn', 'true');
    });
    await page.goto('http://localhost:4200/#/raw-materials', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
  } else {
    console.log('Navigating to raw materials...');
    await page.goto('http://localhost:4200/#/raw-materials', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
  }

  // Capture Header Omnisearch default state
  await page.screenshot({ path: 'header_omnisearch_redesign.png' });
  console.log('Saved header_omnisearch_redesign.png');

  // Open the Add Procurement Batch form
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Log Procurement Batch')) {
      console.log('Clicking Log Procurement Batch...');
      await btn.click();
      await new Promise(r => setTimeout(r, 800));
      break;
    }
  }

  // Type in the Omnisearch bar to show symbols, clear button, and flyout
  const searchInput = await page.$('.omnisearch-input');
  if (searchInput) {
    await searchInput.type('HDPE');
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'omnisearch_with_results.png' });
    console.log('Saved omnisearch_with_results.png');

    // Click the flyout item to navigate to Raw Materials
    const flyoutItem = await page.$('.flyout-item');
    if (flyoutItem) {
      console.log('Clicking flyout item to navigate to Raw Materials...');
      await flyoutItem.click();
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  // Open the Add Procurement Batch form if not already open
  const formPanel = await page.$('.procurement-form-panel');
  if (!formPanel) {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Log Procurement Batch')) {
        console.log('Clicking Log Procurement Batch...');
        await btn.click();
        await new Promise(r => setTimeout(r, 1000));
        break;
      }
    }
  }

  // Fill sample data in the form to test live batch cost preview
  const weightInput = await page.$('#netWeight');
  if (weightInput) {
    await weightInput.type('1000');
    const rateInput = await page.$('#purchaseRate');
    if (rateInput) await rateInput.type('95.50');
    await new Promise(r => setTimeout(r, 600));
  }

  // Navigate to Dispatch tab via sidebar click
  console.log('Clicking Dispatch tab in sidebar...');
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.nav-menu-list li'));
    const dispatchItem = items.find(el => el.textContent && el.textContent.trim().toLowerCase().includes('dispatch'));
    if (dispatchItem) {
      dispatchItem.click();
    }
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'dispatch_redesign_zero_blank.png' });
  console.log('Saved dispatch_redesign_zero_blank.png');

  await browser.close();
  console.log('Verification screenshot capture complete!');
})();
