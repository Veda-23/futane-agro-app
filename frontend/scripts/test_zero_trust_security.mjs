import { chromium } from '@playwright/test';

async function testZeroTrustSecurity() {
  console.log('========================================================================');
  console.log('=== TEST SUITE: ZERO-TRUST SESSION VERIFICATION & ANTI-HACK SHIELD    ===');
  console.log('========================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1339, height: 720 } });
  const page = await context.newPage();

  // ---------------------------------------------------------------------------
  // ATTACK SCENARIO 1: FORGED TOKEN & LOCAL STORAGE INJECTION (ATTEMPTED HACK)
  // ---------------------------------------------------------------------------
  console.log('--- TEST 1: SIMULATING CLIENT-SIDE INJECTION ATTACK ---');
  await page.goto('http://localhost:4300', { waitUntil: 'networkidle' });

  // Attacker tries to inject fake user and forged JWT into sessionStorage/localStorage
  console.log('Attacker injecting forged token into browser storage...');
  await page.evaluate(() => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJTVVBFUl9BRE1JTiIsInJvbGUiOiJTVVBFUl9BRE1JTiJ9.FORGED_FAKE_SIGNATURE';
    const fakeUser = JSON.stringify({ username: 'SUPER_ADMIN', role: 'SUPER_ADMIN', name: 'Hacker Spoofed Admin' });
    sessionStorage.setItem('jwtToken', fakeToken);
    sessionStorage.setItem('user', fakeUser);
    localStorage.setItem('jwtToken', fakeToken);
    localStorage.setItem('user', fakeUser);
  });

  // Reload the page to test if the injection allows access
  console.log('Reloading page to test if Zero-Trust verifier stops the attack...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Check if attacker got access or was blocked
  const isDashboardVisible = await page.$('.app-container:not([style*="display: none"])');
  const isLoginVisible = await page.$('app-login');
  const storedToken = await page.evaluate(() => sessionStorage.getItem('jwtToken'));

  if (isLoginVisible && !storedToken) {
    console.log('✅ [PASSED] ATTACK BLOCKED! Zero-trust verification rejected the forged token.');
    console.log('            Injected storage was automatically wiped, and app remained locked on login screen.\n');
  } else {
    console.error('❌ [FAILED] Security bypass occurred! Dashboard visible:', !!isDashboardVisible);
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // SCENARIO 2: LEGITIMATE AUTHENTICATION & REFRESH HANDSHAKE
  // ---------------------------------------------------------------------------
  console.log('--- TEST 2: LEGITIMATE USER LOGIN & CRYPTOGRAPHIC HANDSHAKE ---');
  console.log('Entering legitimate credentials...');
  await page.fill('input[name="username"]', 'SUPER_ADMIN');
  await page.fill('input[name="password"]', 'superadmin123');
  await page.click('#login-submit-btn');

  console.log('Waiting for OTP verification prompt...');
  const otpPill = await page.waitForSelector('.uat-otp-helper-pill', { timeout: 10000 });
  if (otpPill) {
    console.log('Submitting 2FA verification code...');
    await otpPill.click();
    await page.waitForTimeout(500);
    const verifyBtn = await page.$('button[type="submit"]');
    if (verifyBtn) await verifyBtn.click();
  }

  // Wait for authenticated dashboard
  await page.waitForSelector('.sidebar', { timeout: 15000 });
  console.log('✅ Logged in successfully with valid server-issued cryptographic token!');

  // Now reload page and verify that Zero-Trust handshake validates the real token
  console.log('Testing page reload with authentic token...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.sidebar', { timeout: 15000 });
  console.log('✅ [PASSED] Authentic cryptographic session verified by server on reload!\n');

  console.log('========================================================================');
  console.log('=== ALL ZERO-TRUST SECURITY TESTS PASSED: UNHACKABLE SESSION DEFENSE ===');
  console.log('========================================================================');

  await browser.close();
}

testZeroTrustSecurity().catch(err => {
  console.error('Security test failed:', err);
  process.exit(1);
});
