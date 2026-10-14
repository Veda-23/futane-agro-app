import { chromium } from '@playwright/test';
import path from 'path';

const AUDIT_OUT_DIR = 'c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit';

async function captureInventoryAndSales() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1339, height: 720 } });

  await context.addInitScript(() => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: 'SUPER_ADMIN', role: 'SUPER_ADMIN', exp: 2000000000 }));
    const dummyJwt = header + '.' + payload + '.signature';
    const userObj = JSON.stringify({ username: 'SUPER_ADMIN', role: 'SUPER_ADMIN', name: 'Super Administrator' });
    sessionStorage.setItem('jwtToken', dummyJwt);
    sessionStorage.setItem('user', userObj);
    localStorage.setItem('user', userObj);
    sessionStorage.setItem('activeTab', 'dashboard');
  });

  const page = await context.newPage();
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.sidebar', { timeout: 20000 });

  // 1. INVENTORY TAB
  console.log('Navigating to Inventory...');
  await page.locator('.sidebar li[title*="inventory" i], .sidebar li:has-text("Inventory")').first().click();
  await page.waitForTimeout(1000);

  // Open Inventory Stock Adjustment Modal
  console.log('Opening Inventory Stock Adjustment...');
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-inventory'));
    if (comp) {
      comp.adjustItem = {
        id: 1,
        inventoryId: 1,
        crateType: '50-Liter Reinforced Harvest Crate (Red)',
        warehouseZone: 'Zone A - Vegetable Crate Staging',
        currentStock: 480
      };
      comp.adjustMode = 'add';
      comp.adjustQuantity = 50;
      comp.adjustReason = 'Physical stock audit';
      comp.isAdjustmentOpen = true;
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(AUDIT_OUT_DIR, '03_inventory_stock_adjustment_modal.png') });
  console.log('Captured: 03_inventory_stock_adjustment_modal.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-inventory'));
    if (comp) {
      comp.closeAdjustmentModal();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // Open Inventory Details Drawer
  console.log('Opening Inventory Details Drawer...');
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-inventory'));
    if (comp) {
      comp.selectedItem = {
        id: 1,
        inventoryId: 1,
        crateType: '50-Liter Reinforced Harvest Crate (Red)',
        materialType: 'Virgin HDPE Polymer Grade 100',
        warehouseZone: 'Zone A - Vegetable Crate Staging',
        currentStock: 480,
        unitPrice: 450
      };
      comp.isDetailsOpen = true;
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(AUDIT_OUT_DIR, '04_inventory_sku_details_drawer.png') });
  console.log('Captured: 04_inventory_sku_details_drawer.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-inventory'));
    if (comp) {
      comp.closeDetails();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // 2. SALES TAB
  console.log('Navigating to Sales...');
  await page.locator('.sidebar li[title*="sales" i], .sidebar li:has-text("Sales")').first().click();
  await page.waitForTimeout(1000);

  // Open Commercial Sales Dossier Modal
  console.log('Opening Commercial Sales Dossier...');
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-sales'));
    if (comp) {
      comp.openSalesDossier({
        id: 101,
        saleId: 'SO-2026-0089',
        date: '2026-10-11',
        crateType: 'Tomato Harvest Crates (Standard)',
        crateMaterial: 'Food-Grade Virgin HDPE',
        quantity: 250,
        rate: 450,
        totalAmount: 112500,
        paid: 112500,
        remaining: 0,
        party: { partyName: 'Sahyadri Farmers Producer Co.', city: 'Nashik', gstNumber: '27AABCS1234F1Z5' }
      });
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(AUDIT_OUT_DIR, '05_sales_commercial_dossier_modal.png') });
  console.log('Captured: 05_sales_commercial_dossier_modal.png');

  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-sales'));
    if (comp) {
      comp.closeSalesDossier();
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(400);

  // Open Outward Gate-Pass Modal
  console.log('Opening Material Outward Modal...');
  await page.evaluate(() => {
    const comp = window.ng.getComponent(document.querySelector('app-sales'));
    if (comp) {
      comp.openOutwardModal({
        id: 101,
        saleId: 'SO-2026-0089',
        crateType: 'Tomato Harvest Crates (Standard)',
        quantity: 250,
        party: { partyName: 'Sahyadri Farmers Producer Co.' }
      });
      window.ng.applyChanges(comp);
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(AUDIT_OUT_DIR, '06_sales_outward_dispatch_modal.png') });
  console.log('Captured: 06_sales_outward_dispatch_modal.png');

  await browser.close();
  console.log('ALL POP CARDS CAPTURED SUCCESSFULLY!');
}

captureInventoryAndSales().catch(console.error);
