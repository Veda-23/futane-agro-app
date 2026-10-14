import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/Vedant/.gemini/antigravity-ide/brain/c6f69d5a-cadc-46e5-9d2c-7f740c51bf78/settings_audit';
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const SUBTABS = [
  { id: 'enterprise_customizations', label: '01_Customizations_Hub' },
  { id: 'branding', label: '02_Branding_Themes' },
  { id: 'business-rules', label: '03_Business_Rules' },
  { id: 'teams', label: '04_Teams_Depts' },
  { id: 'custom_fields', label: '05_Extensible_Fields' },
  { id: 'notifications', label: '06_WhatsApp_Alerts' },
  { id: 'users', label: '07_Users_RBAC' },
  { id: 'features', label: '08_Feature_Flags' },
  { id: 'developer', label: '09_Developer_Hub' },
  { id: 'governance', label: '10_System_Telemetry' },
  { id: 'password', label: '11_Security_Password' }
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:4300...');
  await page.goto('http://localhost:4300', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  // Authenticate app directly via Angular state
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

  const auditReport = [];

  // Capture all 11 Subtabs
  for (const subtab of SUBTABS) {
    console.log(`Auditing & capturing subtab: ${subtab.label}...`);
    await page.evaluate((tabId) => {
      const settingsElem = document.querySelector('app-settings');
      if (settingsElem && window.ng) {
        const comp = window.ng.getComponent(settingsElem);
        if (comp) {
          if (comp.switchSubNav) comp.switchSubNav(tabId);
          else comp.activeSubTab = tabId;
          window.ng.applyChanges(comp);
        }
      }
    }, subtab.id);
    await new Promise(r => setTimeout(r, 800));

    // Audit layout metrics
    const metrics = await page.evaluate(() => {
      const mainContent = document.querySelector('.main-content');
      const table = document.querySelector('.table, table');
      const toolbar = document.querySelector('.dept-toolbar, .cf-toolbar, .users-filter-toolbar, .filter-toolbar');
      return {
        bodyScrollHeight: document.body.scrollHeight,
        windowInnerHeight: window.innerHeight,
        hasTable: !!table,
        tableFirstColWidth: table ? table.querySelector('th, td')?.getBoundingClientRect().width : null,
        toolbarWidth: toolbar ? toolbar.getBoundingClientRect().width : null,
        containerWidth: mainContent ? mainContent.getBoundingClientRect().width : null
      };
    });

    const screenshotPath = path.join(ARTIFACT_DIR, `subtab_${subtab.label}.png`);
    await page.screenshot({ path: screenshotPath });
    auditReport.push({ subtab: subtab.label, metrics, screenshot: screenshotPath });
  }

  // Capture representative Modals / Popcards
  const MODAL_TESTS = [
    {
      name: 'modal_team_add',
      trigger: (comp) => { comp.openAddTeamModal ? comp.openAddTeamModal() : (comp.showTeamModal = true); }
    },
    {
      name: 'modal_custom_field_add',
      trigger: (comp) => { comp.openCreateFieldModal ? comp.openCreateFieldModal() : (comp.showCustomFieldModal = true); }
    },
    {
      name: 'modal_api_key_create',
      trigger: (comp) => { comp.openCreateApiKeyModal ? comp.openCreateApiKeyModal() : (comp.showApiKeyModal = true); }
    },
    {
      name: 'modal_webhook_add',
      trigger: (comp) => { comp.openCreateWebhookModal ? comp.openCreateWebhookModal() : (comp.showWebhookModal = true); }
    },
    {
      name: 'modal_invite_user',
      trigger: (comp) => { comp.openInviteUserModal ? comp.openInviteUserModal() : (comp.showInviteUserModal = true); }
    },
    {
      name: 'modal_edit_user',
      trigger: (comp) => {
        comp.editUserForm = { username: 'SUPER_ADMIN', name: 'Super Administrator', email: 'admin@futaneagro.com', role: 'SUPER_ADMIN', status: 'ACTIVE' };
        comp.showEditUserModal = true;
      }
    },
    {
      name: 'modal_change_role',
      trigger: (comp) => {
        comp.selectedUserForRoleChange = { username: 'rajesh.patil', fullName: 'Rajesh Patil', role: 'ADMIN' };
        comp.showChangeRoleModal = true;
      }
    },
    {
      name: 'modal_user_permissions',
      trigger: (comp) => {
        comp.selectedUserForCustomAccess = { username: 'SUPER_ADMIN', fullName: 'Super Administrator', role: 'SUPER_ADMIN' };
        comp.showUserAccessModal = true;
      }
    },
    {
      name: 'modal_add_notification_template',
      trigger: (comp) => { comp.openAddTemplateModal ? comp.openAddTemplateModal() : (comp.showAddTemplateModal = true); }
    },
    {
      name: 'modal_feature_flag_detail',
      trigger: (comp) => {
        comp.selectedFlagForDetail = {
          moduleKey: 'FLAG_AI_ASSISTANT',
          moduleName: 'AI Voice & Document Copilot',
          category: 'CORE',
          description: 'Enable multimodal LLM copilot intelligence and voice orchestration.',
          isEnabled: true,
          rolloutPercentage: 100
        };
        comp.showFlagDetailModal = true;
      }
    }
  ];

  for (const modalTest of MODAL_TESTS) {
    console.log(`Auditing & capturing modal: ${modalTest.name}...`);
    // Close any previous open modals
    await page.evaluate(() => {
      const settingsElem = document.querySelector('app-settings');
      if (settingsElem && window.ng) {
        const comp = window.ng.getComponent(settingsElem);
        if (comp) {
          comp.showTeamModal = false;
          comp.showCustomFieldModal = false;
          comp.showApiKeyModal = false;
          comp.showWebhookModal = false;
          comp.showInviteUserModal = false;
          comp.showEditUserModal = false;
          comp.showChangeRoleModal = false;
          comp.showUserAccessModal = false;
          comp.showAddTemplateModal = false;
          comp.showFlagDetailModal = false;
          comp.showCompanyModal = false;
          comp.showBankModal = false;
          comp.showMasterPasswordConfirmModal = false;
          window.ng.applyChanges(comp);
        }
      }
    });
    await new Promise(r => setTimeout(r, 200));

    // Open target modal
    await page.evaluate((fnStr) => {
      const settingsElem = document.querySelector('app-settings');
      if (settingsElem && window.ng) {
        const comp = window.ng.getComponent(settingsElem);
        if (comp) {
          eval(`(${fnStr})(comp)`);
          window.ng.applyChanges(comp);
        }
      }
    }, modalTest.trigger.toString());
    await new Promise(r => setTimeout(r, 500));

    // Check modal geometry (is it cropped at top? is header visible?)
    const modalMetrics = await page.evaluate(() => {
      const modal = document.querySelector('.modal-dialog, .modal-content, .notif-modal-dialog, .cf-modal-dialog, [class*="-modal-dialog"]');
      if (!modal) return null;
      const rect = modal.getBoundingClientRect();
      const header = modal.querySelector('.modal-header, .cf-modal-header, [class*="-modal-header"]');
      const closeBtn = modal.querySelector('.modal-close-btn, .notif-modal-close, .cf-modal-close-btn, button[aria-label="Close"], button[aria-label="Close dialog"], .btn-close');
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height,
        isClippedTop: rect.top < 0,
        isClippedBottom: rect.bottom > window.innerHeight,
        headerExists: !!header,
        closeBtnExists: !!closeBtn
      };
    });

    const modalScreenshot = path.join(ARTIFACT_DIR, `${modalTest.name}.png`);
    await page.screenshot({ path: modalScreenshot });
    auditReport.push({ modal: modalTest.name, metrics: modalMetrics, screenshot: modalScreenshot });
  }

  await browser.close();
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'audit_report.json'), JSON.stringify(auditReport, null, 2));
  console.log('All 11 subtabs and 10 modals captured and audited!');
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
