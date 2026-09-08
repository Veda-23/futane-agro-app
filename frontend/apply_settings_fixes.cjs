const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/components/features/settings/settings.component.html');
let content = fs.readFileSync(filePath, 'utf8');

const iconMap = {
  'tune': 'bi bi-sliders',
  'verified_user': 'bi bi-shield-check',
  'sensors': 'bi bi-broadcast',
  'bolt': 'bi bi-lightning-charge-fill',
  'database': 'bi bi-database',
  'mail': 'bi bi-envelope',
  'security': 'bi bi-shield-lock',
  'sync': 'bi bi-arrow-clockwise',
  'palette': 'bi bi-palette',
  'corporate_fare': 'bi bi-building',
  'apartment': 'bi bi-buildings',
  'extension': 'bi bi-puzzle',
  'chat': 'bi bi-chat-dots',
  'badge': 'bi bi-person-badge',
  'toggle_on': 'bi bi-toggle-on',
  'terminal': 'bi bi-terminal',
  'memory': 'bi bi-cpu',
  'lock_reset': 'bi bi-key',
  'save': 'bi bi-floppy',
  'image': 'bi bi-image',
  'cloud_upload': 'bi bi-cloud-arrow-up',
  'check': 'bi bi-check-lg',
  'account_balance': 'bi bi-bank',
  'domain': 'bi bi-building',
  'factory': 'bi bi-buildings',
  'edit': 'bi bi-pencil',
  'star': 'bi bi-star-fill',
  'delete': 'bi bi-trash',
  'location_on': 'bi bi-geo-alt',
  'precision_manufacturing': 'bi bi-gear-wide-connected',
  'call': 'bi bi-telephone',
  'payments': 'bi bi-cash-stack',
  'check_circle': 'bi bi-check-circle-fill',
  'receipt_long': 'bi bi-receipt',
  'design_services': 'bi bi-palette2',
  'print': 'bi bi-printer',
  'qr_code_2': 'bi bi-qr-code',
  'verified': 'bi bi-patch-check-fill',
  'key': 'bi bi-key',
  'webhook': 'bi bi-link-45deg',
  'monitoring': 'bi bi-activity',
  'block': 'bi bi-slash-circle',
  'open_in_new': 'bi bi-box-arrow-up-right',
  'dashboard_customize': 'bi bi-speedometer2',
  'dashboard': 'bi bi-speedometer2',
  'speed': 'bi bi-speedometer',
  'router': 'bi bi-router',
  'dns': 'bi bi-hdd-network',
  'monetization_on': 'bi bi-currency-rupee',
  'credit_card': 'bi bi-credit-card',
  'article': 'bi bi-file-earmark-text',
  'troubleshoot': 'bi bi-tools',
  'refresh': 'bi bi-arrow-clockwise',
  'download': 'bi bi-download',
  'heap_snapshot_multiple': 'bi bi-stack',
  'hub': 'bi bi-diagram-3',
  'delete_sweep': 'bi bi-trash3',
  'logout': 'bi bi-box-arrow-right',
  'history_toggle_off': 'bi bi-clock-history',
  'add': 'bi bi-plus-lg',
  'signal_cellular_4_bar': 'bi bi-reception-4',
  'battery_full': 'bi bi-battery-full',
  'done_all': 'bi bi-check-all',
  'send_to_mobile': 'bi bi-phone',
  'send': 'bi bi-send',
  'person_add': 'bi bi-person-plus',
  'people': 'bi bi-people',
  'table_chart': 'bi bi-table',
  'groups': 'bi bi-people-fill',
  'more_vert': 'bi bi-three-dots-vertical',
  'history': 'bi bi-clock-history',
  'search': 'bi bi-search',
  'lock': 'bi bi-lock',
  'warning': 'bi bi-exclamation-triangle'
};

// 1. Replace sync button in header banner to pass true
content = content.replace(
  '(click)="loadAllControlCenterData()"',
  '(click)="loadAllControlCenterData(true)"'
);

// 2. Replace all material symbols
content = content.replace(/<span class="material-symbols-outlined([^"]*)"([^>]*)>([^<]+)<\/span>/g, (fullMatch, extraClasses, extraAttrs, innerText) => {
  const sym = innerText.trim();
  if (iconMap[sym]) {
    const biClass = iconMap[sym];
    const combinedClasses = `${biClass} ${extraClasses.trim()}`.trim();
    return `<i class="${combinedClasses}"${extraAttrs}></i>`;
  }
  if (sym.includes('{{')) {
    if (sym.includes('dt.icon')) {
      return `<i class="bi bi-file-earmark-text"${extraAttrs}></i>`;
    }
    if (sym.includes('t.icon')) {
      return `<i class="bi bi-people-fill"${extraAttrs}></i>`;
    }
    if (sym.includes('accountLocked')) {
      return `<i [class]="u.accountLocked ? 'bi bi-unlock' : 'bi bi-slash-circle'"${extraAttrs}></i>`;
    }
    if (sym.includes('f.icon')) {
      return `<i class="bi bi-star-fill"${extraAttrs}></i>`;
    }
    if (sym.includes('showCurrent')) {
      return `<i [class]="changePasswordForm.showCurrent ? 'bi bi-eye-slash' : 'bi bi-eye'"${extraAttrs}></i>`;
    }
    if (sym.includes('showNew')) {
      return `<i [class]="changePasswordForm.showNew ? 'bi bi-eye-slash' : 'bi bi-eye'"${extraAttrs}></i>`;
    }
    if (sym.includes('m.icon')) {
      return `<i class="bi bi-folder"${extraAttrs}></i>`;
    }
  }
  return fullMatch;
});

// 3. Add density switch group to Users Directory toolbar
const densitySwitchHtml = `
            <!-- Density Toggle -->
            <div class="density-switch-group">
              <button type="button" class="density-btn" [class.active]="tableDensity === 'compact'" (click)="setDensity('compact')" title="Compact density"><i class="bi bi-distribute-vertical"></i> Compact</button>
              <button type="button" class="density-btn" [class.active]="tableDensity === 'comfortable'" (click)="setDensity('comfortable')" title="Standard density"><i class="bi bi-list-ul"></i> Normal</button>
              <button type="button" class="density-btn" [class.active]="tableDensity === 'spacious'" (click)="setDensity('spacious')" title="Spacious density"><i class="bi bi-grid-3x2-gap"></i> Spacious</button>
            </div>
`;

content = content.replace(
  '<div style="display: flex; gap: 8px;">\n            <button class="btn btn-primary btn-sm" (click)="openInviteUserModal()"',
  `<div style="display: flex; align-items: center; gap: 10px;">\n${densitySwitchHtml}            <button class="btn btn-primary btn-sm" (click)="openInviteUserModal()"`
);

// 4. Bind table-compact & table-spacious to the users table and teams table
content = content.replace(
  '<table class="table enterprise-table users-directory-table">',
  '<table class="table enterprise-table users-directory-table" [class.table-compact]="tableDensity === \'compact\'" [class.table-spacious]="tableDensity === \'spacious\'">'
);

// 5. Update modals to Image 1 standard header (modal-title-group, modal-icon-shield, modal-subtitle)
// Modal 1: User Custom Access
content = content.replace(
  `<div class="modal-header">
      <div>
        <h4>Custom Module Access: {{ selectedUserForCustomAccess?.fullName || selectedUserForCustomAccess?.username }}</h4>
        <span style="font-size: 11.5px; color: var(--text-secondary);">Role: <strong>{{ selectedUserForCustomAccess?.role }}</strong></span>
      </div>`,
  `<div class="modal-header">
      <div class="modal-title-group">
        <div class="modal-icon-shield" style="background: rgba(217, 119, 6, 0.12); color: var(--brand-primary, #d97706);">
          <i class="bi bi-shield-lock"></i>
        </div>
        <div>
          <h4>Custom Module Access: {{ selectedUserForCustomAccess?.fullName || selectedUserForCustomAccess?.username }}</h4>
          <span class="modal-subtitle">Role: <strong>{{ selectedUserForCustomAccess?.role }}</strong></span>
        </div>
      </div>`
);

// Modal 2: API Key
content = content.replace(
  `<div class="modal-header">
      <h4>Generate Scoped API Key</h4>`,
  `<div class="modal-header">
      <div class="modal-title-group">
        <div class="modal-icon-shield" style="background: rgba(16, 185, 129, 0.12); color: #059669;">
          <i class="bi bi-key-fill"></i>
        </div>
        <div>
          <h4>Generate Scoped API Key</h4>
          <span class="modal-subtitle">Bearer Token Authentication for External Services</span>
        </div>
      </div>`
);

// Modal 3: Webhook
content = content.replace(
  `<div class="modal-header">
      <h4>Register Outbound Webhook</h4>`,
  `<div class="modal-header">
      <div class="modal-title-group">
        <div class="modal-icon-shield" style="background: rgba(37, 99, 235, 0.12); color: #2563eb;">
          <i class="bi bi-link-45deg"></i>
        </div>
        <div>
          <h4>Register Outbound Webhook</h4>
          <span class="modal-subtitle">Real-time HTTP Event Broadcast Dispatcher</span>
        </div>
      </div>`
);

// Modal 4: Team Modal
content = content.replace(
  `<div class="modal-header">
      <h4>{{ editingTeam ? 'Edit Team' : 'Create Team' }}</h4>`,
  `<div class="modal-header">
      <div class="modal-title-group">
        <div class="modal-icon-shield" style="background: rgba(124, 58, 237, 0.12); color: #7c3aed;">
          <i class="bi bi-people-fill"></i>
        </div>
        <div>
          <h4>{{ editingTeam ? 'Edit Department / Team' : 'Create Department / Team' }}</h4>
          <span class="modal-subtitle">Organizational Hierarchy & Operational Units</span>
        </div>
      </div>`
);

// Modal 5: Custom Field Modal
content = content.replace(
  `<div class="modal-header">
      <h4>Add Custom Field to {{ selectedEntityForCustomFields }}</h4>`,
  `<div class="modal-header">
      <div class="modal-title-group">
        <div class="modal-icon-shield" style="background: rgba(16, 185, 129, 0.12); color: #059669;">
          <i class="bi bi-puzzle-fill"></i>
        </div>
        <div>
          <h4>Add Custom Field to {{ selectedEntityForCustomFields }}</h4>
          <span class="modal-subtitle">Schema Extension & User-Defined Attributes</span>
        </div>
      </div>`
);

// Modal 6: Invite User Modal
content = content.replace(
  `<div class="modal-header">
      <h4>Invite New ERP User</h4>`,
  `<div class="modal-header">
      <div class="modal-title-group">
        <div class="modal-icon-shield" style="background: rgba(14, 165, 233, 0.12); color: #0ea5e9;">
          <i class="bi bi-person-plus-fill"></i>
        </div>
        <div>
          <h4>Invite New ERP User</h4>
          <span class="modal-subtitle">User Credentials & Initial RBAC Role Assignment</span>
        </div>
      </div>`
);

// Modal 7: Company Modal
content = content.replace(
  `<div class="modal-header">
      <h4><i class="bi bi-building" style="vertical-align: middle;"></i> {{ editingCompany ? 'Edit Company Profile' : 'Add Legal Entity / Plant Profile' }}</h4>`,
  `<div class="modal-header">
      <div class="modal-title-group">
        <div class="modal-icon-shield" style="background: rgba(217, 119, 6, 0.12); color: #d97706;">
          <i class="bi bi-building"></i>
        </div>
        <div>
          <h4>{{ editingCompany ? 'Edit Company Profile' : 'Add Legal Entity / Plant Profile' }}</h4>
          <span class="modal-subtitle">GSTIN, CIN, Plant Addresses & Compliance Details</span>
        </div>
      </div>`
);

// Modal 8: Bank Modal
content = content.replace(
  `<div class="modal-header">
      <h4><i class="bi bi-bank" style="vertical-align: middle;"></i> {{ editingBank ? 'Edit Bank Account' : 'Add Corporate Bank Account' }}</h4>`,
  `<div class="modal-header">
      <div class="modal-title-group">
        <div class="modal-icon-shield" style="background: rgba(5, 150, 105, 0.12); color: #059669;">
          <i class="bi bi-bank"></i>
        </div>
        <div>
          <h4>{{ editingBank ? 'Edit Bank Account' : 'Add Corporate Bank Account' }}</h4>
          <span class="modal-subtitle">IFSC, Account Number & Settlement Gateway Details</span>
        </div>
      </div>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated settings.component.html');
