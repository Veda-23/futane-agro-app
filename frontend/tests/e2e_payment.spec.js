const { test, expect } = require('@playwright/test');

test.use({ ignoreHTTPSErrors: true });

test.describe('Razorpay E2E Payment Test', () => {
  test('Should complete payment via Razorpay Test Card', async ({ page }) => {
    test.setTimeout(90000); // 90 seconds

    console.log('Logging in...');
    await page.goto('https://80.225.192.171/', { waitUntil: 'networkidle' });
    
    if (await page.isVisible('input[name="username"]')) {
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000); // Wait for login transition
    }

    console.log('Navigating to Sales...');
    await page.click('text=Sales');
    await page.waitForTimeout(3000); // wait for component to mount
    
    // Take a screenshot to see where we are
    await page.screenshot({ path: 'sales_page.png' });
    console.log('Saved screenshot to sales_page.png');
    
    console.log('Clicking Pay Now...');
    const payNowBtns = page.locator('button:has-text("Pay Now")');
    const count = await payNowBtns.count();
    
    if (count > 0) {
      console.log(`Found ${count} Pay Now buttons. Clicking the first one.`);
      await payNowBtns.first().click();
      
      // SweetAlert2 input
      await page.waitForSelector('.swal2-input', { timeout: 10000 });
      await page.fill('.swal2-input', '10');
      await page.click('.swal2-confirm');
      
      console.log('Waiting for Razorpay Modal...');
      const iframeElement = await page.waitForSelector('.razorpay-checkout-frame', { state: 'attached', timeout: 15000 });
      await page.screenshot({ path: 'razorpay_modal.png' });
      
      const frame = await iframeElement.contentFrame();
      if (!frame) throw new Error("Could not find Razorpay frame content.");

      console.log('Interacting with Razorpay iframe...');
      const isContactVisible = await frame.isVisible('input#contact', { timeout: 5000 }).catch(() => false);
      if (isContactVisible) {
        await frame.fill('input#contact', '9999999999');
        await frame.click('button#redesign-v15-cta');
      }

      await frame.waitForSelector('button[method="card"]', { timeout: 15000 });
      await frame.click('button[method="card"]');

      console.log('Filling Card Details...');
      await frame.fill('input#card_number', '4111 1111 1111 1111');
      await frame.fill('input#card_expiry', '12/26');
      await frame.fill('input#card_name', 'Test User');
      await frame.fill('input#card_cvv', '123');

      await frame.click('button#redesign-v15-cta');
      await page.waitForTimeout(2000);
      
      // Select SUCCESS on Razorpay test gateway
      const successBtn = frame.locator('button:has-text("Success")').first();
      if (await successBtn.isVisible()) {
          await successBtn.click();
      }

      console.log('Waiting for success confirmation in Main Window...');
      await page.waitForSelector('h2:has-text("Payment Receipt")', { timeout: 20000 });
      await page.screenshot({ path: 'receipt.png' });
      
      console.log('✅ Payment Receipt verified successfully!');
      expect(true).toBe(true);

    } else {
      console.log('No unpaid sales available to test. Creating a dummy sale...');
      
      // Let's create a quick dummy sale to test it
      await page.fill('input[name="salesDate"]', new Date().toISOString().split('T')[0]);
      
      // Fill the first party from dropdown
      const firstOption = await page.$eval('select[name="salesParty"] option:nth-child(2)', el => el.value).catch(() => '1');
      await page.selectOption('select[name="salesParty"]', firstOption);
      
      await page.selectOption('select[name="salesCrateType"]', 'Apple Crate');
      await page.fill('input[name="salesMaterial"]', 'Plastic');
      await page.fill('input[name="salesQty"]', '1');
      await page.fill('input[name="salesRate"]', '100');
      await page.fill('input[name="salesPaid"]', '0');
      await page.click('button:has-text("Save Record")');
      
      console.log('Saved dummy sale. Waiting for refresh...');
      await page.waitForTimeout(2000);
      
      const newPayNow = page.locator('button:has-text("Pay Now")').first();
      await newPayNow.click();
      
      await page.waitForSelector('.swal2-input');
      await page.fill('.swal2-input', '10');
      await page.click('.swal2-confirm');
      
      const iframeElement = await page.waitForSelector('.razorpay-checkout-frame', { state: 'attached', timeout: 15000 });
      const frame = await iframeElement.contentFrame();
      
      const isContactVisible = await frame.isVisible('input#contact', { timeout: 5000 }).catch(() => false);
      if (isContactVisible) {
        await frame.fill('input#contact', '9999999999');
        await frame.click('button#redesign-v15-cta');
      }

      await frame.waitForSelector('button[method="card"]', { timeout: 15000 });
      await frame.click('button[method="card"]');

      await frame.fill('input#card_number', '4111 1111 1111 1111');
      await frame.fill('input#card_expiry', '12/26');
      await frame.fill('input#card_name', 'Test User');
      await frame.fill('input#card_cvv', '123');

      await frame.click('button#redesign-v15-cta');
      await page.waitForTimeout(2000);
      
      const successBtn = frame.locator('button:has-text("Success")').first();
      if (await successBtn.isVisible()) {
          await successBtn.click();
      }

      await page.waitForSelector('h2:has-text("Payment Receipt")', { timeout: 20000 });
      console.log('✅ Payment Receipt verified successfully on newly created invoice!');
    }
  });
});
