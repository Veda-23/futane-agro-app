const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Clear any existing session to ensure we see the login page
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  console.log('Navigating to http://localhost:4200/login ...');
  await page.goto('http://localhost:4200/login', { waitUntil: 'networkidle' });

  await page.waitForTimeout(1500); // Wait for entrance animations

  // Take screenshot of main login screen
  console.log('Capturing login_screen.png...');
  await page.screenshot({ path: 'login_screen.png', fullPage: true });

  // Type in username and submit to trigger OTP screen
  console.log('Filling username and triggering OTP screen...');
  await page.fill('input#username', 'SUPER_ADMIN');
  await page.fill('input#password', 'admin123'); // any password to pass required check
  
  await page.click('button#login-submit-btn');

  await page.waitForTimeout(1500); // Wait for API response and OTP screen animation

  // Take screenshot of OTP screen
  console.log('Capturing login_otp_screen.png...');
  await page.screenshot({ path: 'login_otp_screen.png', fullPage: true });

  console.log('Login visual audit successfully completed!');
  await browser.close();
})();
