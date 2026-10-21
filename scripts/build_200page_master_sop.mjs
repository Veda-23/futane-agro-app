import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('../frontend/node_modules/playwright');
import fs from 'fs';
import path from 'path';

import { bookStyles } from './generator/styles.mjs';
import { generateVolume1 } from './generator/volume1_architecture.mjs';
import { generateVolume2 } from './generator/volume2_database.mjs';
import { generateVolume3 } from './generator/volume3_rest_api.mjs';
import { generateVolume4 } from './generator/volume4_ui_tabs.mjs';
import { generateVolume5 } from './generator/volume5_department_sops.mjs';
import { generateVolume6 } from './generator/volume6_devops_friend.mjs';

function countPdfPages(pdfPath) {
  const buf = fs.readFileSync(pdfPath);
  const str = buf.toString('latin1');
  const matches = str.match(/\/Type\s*\/Page\b/g);
  return matches ? matches.length : 0;
}

async function buildBook() {
  console.log('=== ASSEMBLING FUTANE AGRO 200+ PAGE MASTER MANUAL ===');

  console.log('1. Compiling Volume 1: Architecture & Zero-Trust Security...');
  const vol1 = generateVolume1();

  console.log('2. Compiling Volume 2: Relational Database 39 Tables & DDL Catalog...');
  const vol2 = generateVolume2();

  console.log('3. Compiling Volume 3: REST Microservices & 39 Controllers...');
  const vol3 = generateVolume3();

  console.log('4. Compiling Volume 4: Visual UI Directory (24 Distinct Screens & SOPs)...');
  const vol4 = generateVolume4();

  console.log('5. Compiling Volume 5: Plant Operations & Departmental SOPs...');
  const vol5 = generateVolume5();

  console.log('6. Compiling Volume 6: DevOps, Disaster Recovery & Friend Runbook...');
  const vol6 = generateVolume6();

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FUTANE AGRO ERP — Master Operating Manual & Technical Specification</title>
  <style>
    ${bookStyles}
  </style>
</head>
<body>
  ${vol1}
  <div class="page-break"></div>
  ${vol2}
  <div class="page-break"></div>
  ${vol3}
  <div class="page-break"></div>
  ${vol4}
  <div class="page-break"></div>
  ${vol5}
  <div class="page-break"></div>
  ${vol6}
</body>
</html>`;

  const htmlPath = path.resolve('docs', 'FUTANE_AGRO_ERP_COMPLETE_SOP.html');
  fs.writeFileSync(htmlPath, fullHtml, 'utf8');
  console.log(`✓ Master HTML generated: ${htmlPath} (${fullHtml.length} characters)`);

  console.log('7. Compiling Master PDF via Playwright rendering engine...');
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--allow-file-access-from-files', '--disable-web-security']
    });
  } catch (err) {
    console.log(`Standard chromium launch failed (${err.message}), falling back to msedge channel...`);
    try {
      browser = await chromium.launch({
        channel: 'msedge',
        headless: true,
        args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
      });
    } catch (err2) {
      console.log(`msedge launch failed (${err2.message}), falling back to chrome channel...`);
      browser = await chromium.launch({
        channel: 'chrome',
        headless: true,
        args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
      });
    }
  }

  try {
    const page = await browser.newPage();
    const httpUrl = 'http://127.0.0.1:4300/docs/FUTANE_AGRO_ERP_COMPLETE_SOP.html';
    await page.goto(httpUrl, { waitUntil: 'load', timeout: 120000 });
    await page.waitForTimeout(2000);

    const pdfPath = path.resolve('docs', 'FUTANE_AGRO_ERP_COMPLETE_SOP.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      timeout: 180000,
      headerTemplate: `
        <div style="font-family: -apple-system, sans-serif; font-size: 7.5pt; color: #94a3b8; width: 100%; display: flex; justify-content: space-between; padding: 0 12mm;">
          <span>FUTANE AGRO ERP — Enterprise Master Operating Manual</span>
          <span>Confidential & Proprietary</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-family: -apple-system, sans-serif; font-size: 7.5pt; color: #64748b; width: 100%; display: flex; justify-content: space-between; padding: 0 12mm;">
          <span>Section IV: Technical & Operational Specification</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
      margin: {
        top: '14mm',
        bottom: '14mm',
        left: '12mm',
        right: '12mm'
      }
    });

    console.log(`✓ PDF compiled successfully: ${pdfPath}`);
    const pages = countPdfPages(pdfPath);
    console.log(`========================================`);
    console.log(`TOTAL GENERATED PDF PAGES: ${pages}`);
    console.log(`========================================`);
    return pages;
  } finally {
    await browser.close();
  }
}

buildBook().catch(console.error);
