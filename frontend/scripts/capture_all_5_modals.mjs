import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/c6f69d5a-cadc-46e5-9d2c-7f740c51bf78/screenshots';
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 860 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:4300...');
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  // Authenticate app directly via Angular component state
  console.log('Authenticating in Angular app-root directly...');
  await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    if (appRoot && window.ng) {
      const comp = window.ng.getComponent(appRoot);
      if (comp) {
        comp.isAuthenticated = true;
        comp.loggedInUser = {
          id: 1,
          username: 'SUPER_ADMIN',
          fullName: 'Super Administrator',
          name: 'Super Administrator',
          role: 'SUPER_ADMIN'
        };
        comp.activeTab = 'settings';
        comp.renderedTabs['settings'] = true;
        window.ng.applyChanges(comp);
      }
    }
  });
  await new Promise(r => setTimeout(r, 1500));

  // Switch to settings tab
  console.log('Switching to settings tab...');
  await page.evaluate(() => {
    const appRoot = document.querySelector('app-root');
    if (appRoot && window.ng) {
      const comp = window.ng.getComponent(appRoot);
      if (comp && comp.switchTab) comp.switchTab('settings');
    }
  });
  await new Promise(r => setTimeout(r, 1200));

  // 1. Capture Department Directory & Operational Teams (Image 1 fix)
  console.log('Capturing Image 1: Department Directory...');
  await page.evaluate(() => {
    const settingsElem = document.querySelector('app-settings');
    if (settingsElem && window.ng) {
      const comp = window.ng.getComponent(settingsElem);
      if (comp) {
        comp.activeSubTab = 'teams';
        window.ng.applyChanges(comp);
      }
    }
  });
  await new Promise(r => setTimeout(r, 800));
  const img1Path = path.join(ARTIFACT_DIR, 'image1_departments_fixed.png');
  await page.screenshot({ path: img1Path });
  console.log('Saved Image 1:', img1Path);

  // 2. Capture Extended Schema Fields (Image 2 fix)
  console.log('Capturing Image 2: Extended Schema Fields...');
  await page.evaluate(() => {
    const settingsElem = document.querySelector('app-settings');
    if (settingsElem && window.ng) {
      const comp = window.ng.getComponent(settingsElem);
      if (comp) {
        if (comp.switchSubNav) comp.switchSubNav('custom_fields');
        else comp.activeSubTab = 'custom_fields';
        window.ng.applyChanges(comp);
      }
    }
  });
  await new Promise(r => setTimeout(r, 800));
  const img2Path = path.join(ARTIFACT_DIR, 'image2_schema_fixed.png');
  await page.screenshot({ path: img2Path });
  console.log('Saved Image 2:', img2Path);

  // 3. Capture User Directory (Image 3 fix)
  console.log('Capturing Image 3: User Directory...');
  await page.evaluate(() => {
    const settingsElem = document.querySelector('app-settings');
    if (settingsElem && window.ng) {
      const comp = window.ng.getComponent(settingsElem);
      if (comp) {
        comp.activeSubTab = 'users';
        comp.userAccessSubTab = 'users';
        window.ng.applyChanges(comp);
      }
    }
  });
  await new Promise(r => setTimeout(r, 800));
  const img3Path = path.join(ARTIFACT_DIR, 'image3_user_directory_fixed.png');
  await page.screenshot({ path: img3Path });
  console.log('Saved Image 3:', img3Path);

  // 4. Capture User Custom Access Modal (Image 4 fix)
  console.log('Capturing Image 4: User Custom Access Modal...');
  await page.evaluate(() => {
    const settingsElem = document.querySelector('app-settings');
    if (settingsElem && window.ng) {
      const comp = window.ng.getComponent(settingsElem);
      if (comp) {
        comp.selectedUserForCustomAccess = comp.adminUsersList && comp.adminUsersList[0] ? comp.adminUsersList[0] : { fullName: 'Super Administrator', username: 'SUPER_ADMIN', role: 'SUPER_ADMIN' };
        comp.showUserAccessModal = true;
        window.ng.applyChanges(comp);
      }
    }
  });
  await new Promise(r => setTimeout(r, 600));
  const img4Path = path.join(ARTIFACT_DIR, 'image4_permissions_modal_fixed.png');
  await page.screenshot({ path: img4Path });
  console.log('Saved Image 4:', img4Path);

  // Close User Custom Access Modal
  await page.evaluate(() => {
    const settingsElem = document.querySelector('app-settings');
    if (settingsElem && window.ng) {
      const comp = window.ng.getComponent(settingsElem);
      if (comp) {
        comp.showUserAccessModal = false;
        window.ng.applyChanges(comp);
      }
    }
  });
  await new Promise(r => setTimeout(r, 400));

  // 5. Capture Edit User Profile Modal (Image 5 fix)
  console.log('Capturing Image 5: Edit User Profile Modal...');
  await page.evaluate(() => {
    const settingsElem = document.querySelector('app-settings');
    if (settingsElem && window.ng) {
      const comp = window.ng.getComponent(settingsElem);
      if (comp) {
        comp.editUserForm = {
          username: 'SUPER_ADMIN',
          name: 'Super Administrator',
          email: 'admin@futaneagro.com',
          role: 'SUPER_ADMIN',
          teamCode: 'ADM',
          status: 'ACTIVE'
        };
        comp.showEditUserModal = true;
        window.ng.applyChanges(comp);
      }
    }
  });
  await new Promise(r => setTimeout(r, 600));
  const img5Path = path.join(ARTIFACT_DIR, 'image5_edit_user_modal_fixed.png');
  await page.screenshot({ path: img5Path });
  console.log('Saved Image 5:', img5Path);

  await browser.close();
  console.log('All 5 screenshots captured successfully!');
}

main().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
