import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function test() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto('http://localhost:4200/#/login', { waitUntil: 'networkidle2' });

  await page.evaluate(() => {
    document.querySelectorAll('input')[0].value = 'SUPER_ADMIN';
    document.querySelectorAll('input')[0].dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelectorAll('input')[1].value = 'superadmin123';
    document.querySelectorAll('input')[1].dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('button[type="submit"]').click();
  });

  await new Promise(r => setTimeout(r, 2000));

  const domInfo = await page.evaluate(() => {
    const root = document.querySelector('app-login');
    if (!root) return { error: 'No app-login' };
    const elements = Array.from(root.querySelectorAll('*')).map(el => ({
      tag: el.tagName,
      className: el.className,
      text: el.textContent?.trim().slice(0, 40),
      rect: el.getBoundingClientRect()
    }));
    return { elements };
  });

  console.log('DOM Elements count:', domInfo.elements?.length);
  domInfo.elements?.forEach(e => {
    if (e.text || e.className) {
      console.log(`${e.tag}.${e.className} -> "${e.text}" | y: ${e.rect.y}, h: ${e.rect.height}`);
    }
  });

  await browser.close();
}

test().catch(console.error);
