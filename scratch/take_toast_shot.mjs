import http from 'http';
import fs from 'fs';
import WebSocket from '../frontend/node_modules/ws/index.js';

async function main() {
  // 1. Get or create target
  const newTarget = await new Promise((resolve, reject) => {
    const req = http.request('http://127.0.0.1:9222/json/new?http://localhost:4200', { method: 'PUT' }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });

  console.log('Target created:', newTarget.id);
  const wsUrl = newTarget.webSocketDebuggerUrl;

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const callbacks = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      callbacks.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      const { resolve, reject } = callbacks.get(data.id);
      callbacks.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise(resolve => ws.onopen = resolve);
  console.log('WebSocket connected');

  await send('Page.enable');
  await send('Runtime.enable');

  // Set viewport to desktop 1400x850
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1400,
    height: 850,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Set logged-in session in localStorage
  await send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('user', JSON.stringify({
        username: 'Vedant Mehare',
        role: 'SUPER_ADMIN',
        roles: ['ROLE_SUPER_ADMIN']
      }));
      sessionStorage.setItem('user', JSON.stringify({
        username: 'Vedant Mehare',
        role: 'SUPER_ADMIN',
        roles: ['ROLE_SUPER_ADMIN']
      }));
      localStorage.setItem('futane_sidebar_collapsed', 'false');
      location.href = 'http://localhost:4200';
    `
  });

  // Wait 3.5 seconds for ERP dashboard to fully bootstrap
  await new Promise(r => setTimeout(r, 3500));

  // Inject both the redesigned Error toast (from user's screenshot) and Success toast into DOM
  const triggerResult = await send('Runtime.evaluate', {
    expression: `
      (() => {
        let container = document.querySelector('.futane-toast-container-top');
        if (!container) {
          container = document.createElement('div');
          container.className = 'futane-toast-container-top';
          container.style.cssText = 'position:fixed; top:18px; right:18px; z-index:999999; display:flex; flex-direction:column; align-items:flex-end; gap:12px; pointer-events:none;';
          document.body.appendChild(container);
        }

        container.innerHTML = \`
          <div class="swal2-popup swal2-toast futane-toast-popup futane-toast-error swal2-show" role="alert" style="display: flex; animation: futaneToastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;">
            <div class="swal2-icon futane-toast-icon-wrapper futane-toast-icon-error" style="display: flex;">
              <i class="bi bi-x-circle-fill"></i>
            </div>
            <div class="swal2-html-container futane-toast-html-container" style="display: block;">
              <div class="futane-toast-body-wrapper">
                <div class="futane-toast-heading">Load Failed</div>
                <div class="futane-toast-message">Could not load sales orders.</div>
              </div>
            </div>
            <button type="button" class="swal2-close futane-toast-close" style="display: flex;">×</button>
            <div class="swal2-timer-progress-bar futane-toast-progress futane-toast-progress-error" style="width: 72%;"></div>
          </div>
          <div class="swal2-popup swal2-toast futane-toast-popup futane-toast-success swal2-show" role="alert" style="display: flex; animation: futaneToastSlideIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;">
            <div class="swal2-icon futane-toast-icon-wrapper futane-toast-icon-success" style="display: flex;">
              <i class="bi bi-check-circle-fill"></i>
            </div>
            <div class="swal2-html-container futane-toast-html-container" style="display: block;">
              <div class="futane-toast-body-wrapper">
                <div class="futane-toast-heading">Production Synced</div>
                <div class="futane-toast-message">60 manufacturing batches reconciled successfully.</div>
              </div>
            </div>
            <button type="button" class="swal2-close futane-toast-close" style="display: flex;">×</button>
            <div class="swal2-timer-progress-bar futane-toast-progress futane-toast-progress-success" style="width: 48%;"></div>
          </div>
        \`;
        return 'injected';
      })()
    `
  });

  console.log('Toast trigger result:', triggerResult);

  // Wait 1.0s for slide-in animation to complete
  await new Promise(r => setTimeout(r, 1000));

  // Capture screenshot
  const screenshot = await send('Page.captureScreenshot', {
    format: 'png'
  });

  const outPath = 'C:\\Users\\Vedant\\.gemini\\antigravity-ide\\brain\\31dd588e-fd68-4426-9deb-3030e10b9d4e\\toast_redesign_screenshot.png';
  fs.writeFileSync(outPath, Buffer.from(screenshot.data, 'base64'));
  console.log('Screenshot saved to:', outPath);

  ws.close();
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
