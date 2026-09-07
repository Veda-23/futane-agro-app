const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) {
    console.warn('File not found: ' + filePath);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  let count = 0;
  for (const { search, replace } of replacements) {
    if (typeof search === 'string') {
      if (content.includes(search)) {
        content = content.split(search).join(replace);
        count++;
      }
    } else if (search instanceof RegExp) {
      const match = content.match(search);
      if (match) {
        content = content.replace(search, replace);
        count++;
      }
    }
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}: applied ${count} replacement rules.`);
}

// 1. translate.service.ts
replaceInFile('src/app/translate.service.ts', [
  { search: "'dashboard.excel_importer': '📋 Excel Importer (Import Party / Inventory Sheets)',", replace: "'dashboard.excel_importer': 'Excel Importer (Import Party / Inventory Sheets)'," },
  { search: "'dashboard.excel_importer': '📋 एक्सेल आयात साधन (ग्राहक / स्टॉक आयात करा)',", replace: "'dashboard.excel_importer': 'एक्सेल आयात साधन (ग्राहक / स्टॉक आयात करा)'," },
  { search: "'dashboard.excel_importer': '📋 एक्सेल आयातक (पार्टी / स्टॉक आयात करें)',", replace: "'dashboard.excel_importer': 'एक्सेल आयातक (पार्टी / स्टॉक आयात करें)'," }
]);

// 2. data-table.component.html
replaceInFile('src/app/components/data-table/data-table.component.html', [
  { search: '✓ {{ selectedRows.size }} Selected', replace: '<i class="bi bi-check2 me-1"></i>{{ selectedRows.size }} Selected' },
  { search: '✕ Clear', replace: '<i class="bi bi-x-lg me-1"></i>Clear' },
  { search: "{{ sortDirection === 'asc' ? '▲' : '▼' }}", replace: "<i class=\"bi ms-1\" [ngClass]=\"sortDirection === 'asc' ? 'bi-chevron-up' : 'bi-chevron-down'\"></i>" }
]);

// 3. analytics.component.html
replaceInFile('src/app/components/features/analytics/analytics.component.html', [
  { search: '<h3>📊 System & Infrastructure Dashboard</h3>', replace: '<h3><i class="bi bi-graph-up me-2"></i>System & Infrastructure Dashboard</h3>' },
  { search: "💰 Sales Performance", replace: '<i class="bi bi-cash-stack me-1"></i>Sales Performance' },
  { search: "⚙️ Production Efficiency", replace: '<i class="bi bi-gear-wide-connected me-1"></i>Production Efficiency' },
  { search: "💸 Expense Breakdown", replace: '<i class="bi bi-receipt me-1"></i>Expense Breakdown' },
  { search: "📊 P&L Summary", replace: '<i class="bi bi-bar-chart-line me-1"></i>P&L Summary' }
]);

// 4. bank.component.html
replaceInFile('src/app/components/features/bank/bank.component.html', [
  { search: "<h3>🏦 {{ 'bank.title' | translate:currentLang }}</h3>", replace: "<h3><i class=\"bi bi-bank me-2\"></i>{{ 'bank.title' | translate:currentLang }}</h3>" },
  { search: '⚙️ Columns', replace: '<i class="bi bi-layout-three-columns me-1"></i>Columns' },
  { search: "{{ sortAsc ? '▲' : '▼' }}", replace: "<i class=\"bi ms-1\" [ngClass]=\"sortAsc ? 'bi-chevron-up' : 'bi-chevron-down'\"></i>" },
  { search: '✏️ Edit', replace: '<i class="bi bi-pencil me-1"></i>Edit' }
]);

// 5. billing-hub.component.html
replaceInFile('src/app/components/features/billing-hub/billing-hub.component.html', [
  { search: '<label>📅 Year:</label>', replace: '<label><i class="bi bi-calendar-event me-1"></i>Year:</label>' },
  { search: '<label>🗓️ Month:</label>', replace: '<label><i class="bi bi-calendar-month me-1"></i>Month:</label>' },
  { search: '<label>🔍 Search Party/Doc #:</label>', replace: '<label><i class="bi bi-search me-1"></i>Search Party/Doc #:</label>' },
  { search: '✕ Reset Filters', replace: '<i class="bi bi-arrow-counterclockwise me-1"></i>Reset Filters' },
  { search: '<span>⚠️ No {{ currentTheme.title.toLowerCase() }} records found matching the current year, month, or search filter.</span>', replace: '<span><i class="bi bi-exclamation-triangle me-1"></i>No {{ currentTheme.title.toLowerCase() }} records found matching the current year, month, or search filter.</span>' },
  { search: '<!-- 📄 PRINTABLE DOCUMENT CONTAINER (A4 FORMAT) -->', replace: '<!-- PRINTABLE DOCUMENT CONTAINER (A4 FORMAT) -->' },
  { search: '📍 Gat No. 242', replace: 'Gat No. 242' },
  { search: '📞 07224-XXXXXX', replace: 'Tel: 07224-XXXXXX' },
  { search: '✉️ info@futaneagro.com', replace: 'info@futaneagro.com' },
  { search: '🌐 www.futaneagro.com', replace: 'www.futaneagro.com' },
  { search: '<span>[✓] UPI</span>', replace: '<span><i class="bi bi-check-square me-1"></i>UPI</span>' },
  { search: '<span>🛡️ 100% QUALITY</span>', replace: '<span><i class="bi bi-shield-check me-1"></i>100% QUALITY</span>' },
  { search: '<span>🌿 STRONG & DURABLE</span>', replace: '<span><i class="bi bi-patch-check me-1"></i>STRONG & DURABLE</span>' },
  { search: '<span>🤝 TRUSTED BY CUSTOMERS</span>', replace: '<span><i class="bi bi-hand-thumbs-up me-1"></i>TRUSTED BY CUSTOMERS</span>' },
  { search: '<span>🏆 ISO CERTIFIED COMPANY</span>', replace: '<span><i class="bi bi-award me-1"></i>ISO CERTIFIED COMPANY</span>' }
]);

// 6. dashboard.component.html
replaceInFile('src/app/components/features/dashboard/dashboard.component.html', [
  { search: '<span>🛒</span> + New Sale', replace: '<i class="bi bi-cart-plus me-1"></i>+ New Sale' },
  { search: '<span>🏭</span> + Production', replace: '<i class="bi bi-building-add me-1"></i>+ Production' },
  { search: '<span>💳</span> + Payment', replace: '<i class="bi bi-credit-card-2-front me-1"></i>+ Payment' },
  { search: '<span>🧾</span> + Tax Invoice', replace: '<i class="bi bi-receipt me-1"></i>+ Tax Invoice' },
  { search: '<span>🚚</span> + Dispatch', replace: '<i class="bi bi-truck me-1"></i>+ Dispatch' },
  { search: '<span>📦</span> + Inventory Stock', replace: '<i class="bi bi-box-seam me-1"></i>+ Inventory Stock' },
  { search: '<span class="alert-icon">⚠️</span>', replace: '<span class="alert-icon"><i class="bi bi-exclamation-triangle-fill text-warning"></i></span>' },
  { search: '<span class="alert-icon">🧪</span>', replace: '<span class="alert-icon"><i class="bi bi-droplet-half text-info"></i></span>' },
  { search: '<span class="alert-icon">🏭</span>', replace: '<span class="alert-icon"><i class="bi bi-gear-fill text-primary"></i></span>' },
  { search: "{{ computedNetProfit >= 0 ? '▲' : '▼' }}", replace: "<i class=\"bi me-1\" [ngClass]=\"computedNetProfit >= 0 ? 'bi-caret-up-fill text-success' : 'bi-caret-down-fill text-danger'\"></i>" },
  { search: '<div class="tpc-icon" style="background: var(--color-warning-bg); color: var(--color-warning);">📦</div>', replace: '<div class="tpc-icon" style="background: var(--color-warning-bg); color: var(--color-warning);"><i class="bi bi-box-seam"></i></div>' },
  { search: '<div class="tpc-icon" style="background: var(--accent-soft); color: var(--accent);">🧪</div>', replace: '<div class="tpc-icon" style="background: var(--accent-soft); color: var(--accent);"><i class="bi bi-droplet-half"></i></div>' },
  { search: '<div class="tpc-icon" style="background: var(--color-info-bg); color: var(--color-info);">👥</div>', replace: '<div class="tpc-icon" style="background: var(--color-info-bg); color: var(--color-info);"><i class="bi bi-people"></i></div>' },
  { search: '<div class="tpc-icon" style="background: var(--color-danger-bg); color: var(--color-danger);">🚛</div>', replace: '<div class="tpc-icon" style="background: var(--color-danger-bg); color: var(--color-danger);"><i class="bi bi-truck"></i></div>' },
  { search: '<span>⚡</span> Recent Activity Stream', replace: '<i class="bi bi-activity me-1"></i>Recent Activity Stream' },
  { search: '<span style="font-size: 13px; margin-top: 2px;">📝</span>', replace: '<i class="bi bi-card-text me-1"></i>' },
  { search: '<span>🚀</span> Operations Navigation', replace: '<i class="bi bi-grid-fill me-1"></i>Operations Navigation' },
  { search: '<div class="shortcut-icon">🛒</div>', replace: '<div class="shortcut-icon"><i class="bi bi-cart"></i></div>' },
  { search: '<div class="shortcut-icon">🏭</div>', replace: '<div class="shortcut-icon"><i class="bi bi-buildings"></i></div>' },
  { search: '<div class="shortcut-icon">📈</div>', replace: '<div class="shortcut-icon"><i class="bi bi-graph-up-arrow"></i></div>' },
  { search: '<div class="shortcut-icon">📊</div>', replace: '<div class="shortcut-icon"><i class="bi bi-bar-chart-line"></i></div>' },
  { search: '<span style="font-size: 15px;">🖥️</span>', replace: '<i class="bi bi-display me-1"></i>' },
  { search: '🛒 + New Sale', replace: '+ New Sale' },
  { search: '🏭 + Production', replace: '+ Production' },
  { search: '💳 + Payment', replace: '+ Payment' },
  { search: "{{ showFabMenu ? '✕' : '➕' }}", replace: "<i class=\"bi\" [ngClass]=\"showFabMenu ? 'bi-x-lg' : 'bi-plus-lg'\"></i>" }
]);

// 7. dispatch.component.html
replaceInFile('src/app/components/features/dispatch/dispatch.component.html', [
  { search: '<div class="enterprise-header-icon">🚚</div>', replace: '<div class="enterprise-header-icon"><i class="bi bi-truck"></i></div>' },
  { search: "<h3 style=\"margin:0; font-weight:700;\">📤 {{ 'dispatch.title' | translate:currentLang }}</h3>", replace: "<h3 style=\"margin:0; font-weight:700;\"><i class=\"bi bi-box-arrow-up-right me-2\"></i>{{ 'dispatch.title' | translate:currentLang }}</h3>" },
  { search: '📷 Scan QR', replace: '<i class="bi bi-qr-code-scan me-1"></i>Scan QR' },
  { search: '⚠️ All sales have been dispatched already.', replace: '<i class="bi bi-info-circle me-1"></i>All sales have been dispatched already.' },
  { search: '<div style="font-size:48px; margin-bottom:12px;">⚠️</div>', replace: '<div style="margin-bottom:12px;"><i class="bi bi-exclamation-triangle text-danger" style="font-size:48px;"></i></div>' },
  { search: '<button class="btn btn-primary" (click)="loadData()">🔄 Retry</button>', replace: '<button class="btn btn-primary" (click)="loadData()"><i class="bi bi-arrow-repeat me-1"></i>Retry</button>' },
  { search: '⚙️ Columns', replace: '<i class="bi bi-layout-three-columns me-1"></i>Columns' },
  { search: "{{ sortAsc ? '▲' : '▼' }}", replace: "<i class=\"bi ms-1\" [ngClass]=\"sortAsc ? 'bi-chevron-up' : 'bi-chevron-down'\"></i>" },
  { search: '<button class="btn btn-secondary btn-sm" (click)="editDispatch(d)">✏️ Edit</button>', replace: '<button class="btn btn-secondary btn-sm" (click)="editDispatch(d)"><i class="bi bi-pencil me-1"></i>Edit</button>' }
]);

// 8. drivers.component.html
replaceInFile('src/app/components/features/drivers/drivers.component.html', [
  { search: '⚙️ Columns', replace: '<i class="bi bi-layout-three-columns me-1"></i>Columns' },
  { search: "{{ sortAsc ? '▲' : '▼' }}", replace: "<i class=\"bi ms-1\" [ngClass]=\"sortAsc ? 'bi-chevron-up' : 'bi-chevron-down'\"></i>" },
  { search: '✏️ Edit', replace: '<i class="bi bi-pencil me-1"></i>Edit' }
]);

// 9. employees.component.html & .ts
replaceInFile('src/app/components/features/employees/employees.component.html', [
  { search: '<div class="enterprise-header-icon">👷</div>', replace: '<div class="enterprise-header-icon"><i class="bi bi-person-badge"></i></div>' },
  { search: "➕ {{ 'hr.add_title' | translate:currentLang }}", replace: "<i class=\"bi bi-person-plus me-1\"></i>{{ 'hr.add_title' | translate:currentLang }}" }
]);
replaceInFile('src/app/components/features/employees/employees.component.ts', [
  { search: "{ label: '✏️ Edit', action: 'edit', class: 'btn btn-sm btn-secondary' }", replace: "{ label: 'Edit', action: 'edit', class: 'btn btn-sm btn-secondary' }" },
  { search: "{ label: '🗑️ Delete', action: 'delete', class: 'btn btn-sm btn-danger' }", replace: "{ label: 'Delete', action: 'delete', class: 'btn btn-sm btn-danger' }" }
]);

// 10. expenses.component.html
replaceInFile('src/app/components/features/expenses/expenses.component.html', [
  { search: "<h3>💸 {{ 'expense.title' | translate:currentLang }}</h3>", replace: "<h3><i class=\"bi bi-receipt me-2\"></i>{{ 'expense.title' | translate:currentLang }}</h3>" },
  { search: '⚙️ Columns', replace: '<i class="bi bi-layout-three-columns me-1"></i>Columns' },
  { search: "{{ sortAsc ? '▲' : '▼' }}", replace: "<i class=\"bi ms-1\" [ngClass]=\"sortAsc ? 'bi-chevron-up' : 'bi-chevron-down'\"></i>" },
  { search: '<button class="btn btn-secondary btn-sm" (click)="editExpense(e)">✏️ Edit</button>', replace: '<button class="btn btn-secondary btn-sm" (click)="editExpense(e)"><i class="bi bi-pencil me-1"></i>Edit</button>' }
]);

// 11. inventory.component.html
replaceInFile('src/app/components/features/inventory/inventory.component.html', [
  { search: '⚙️ Columns', replace: '<i class="bi bi-layout-three-columns me-1"></i>Columns' },
  { search: "{{ sortAsc ? '▲' : '▼' }}", replace: "<i class=\"bi ms-1\" [ngClass]=\"sortAsc ? 'bi-chevron-up' : 'bi-chevron-down'\"></i>" }
]);

// 12. machines.component.html & .ts
replaceInFile('src/app/components/features/machines/machines.component.html', [
  { search: '<div class="enterprise-header-icon">🏭</div>', replace: '<div class="enterprise-header-icon"><i class="bi bi-cpu"></i></div>' },
  { search: '<span style="font-size:24px;">🔧</span>', replace: '<i class="bi bi-tools text-primary" style="font-size:24px;"></i>' },
  { search: "'✏️ Edit Machine'", replace: "'Edit Machine'" },
  { search: "('➕ ' + ('machine.title' | translate:currentLang))", replace: "('+ ' + ('machine.title' | translate:currentLang))" },
  { search: "'💾 Update Machine'", replace: "'Update Machine'" },
  { search: '✕ Cancel Edit', replace: '<i class="bi bi-x-lg me-1"></i>Cancel Edit' },
  { search: "'💾 Update Breakdown'", replace: "'Update Breakdown'" },
  { search: '⚙️ Columns', replace: '<i class="bi bi-layout-three-columns me-1"></i>Columns' },
  { search: "{{ sortAsc ? '▲' : '▼' }}", replace: "<i class=\"bi ms-1\" [ngClass]=\"sortAsc ? 'bi-chevron-up' : 'bi-chevron-down'\"></i>" },
  { search: 'title="Edit machine">✏️ Edit</button>', replace: 'title="Edit machine"><i class="bi bi-pencil me-1"></i>Edit</button>' },
  { search: 'title="Delete machine">🗑️</button>', replace: 'title="Delete machine"><i class="bi bi-trash"></i></button>' },
  { search: 'title="Edit breakdown log">✏️ Edit</button>', replace: 'title="Edit breakdown log"><i class="bi bi-pencil me-1"></i>Edit</button>' },
  { search: 'title="Delete breakdown">🗑️</button>', replace: 'title="Delete breakdown"><i class="bi bi-trash"></i></button>' }
]);
replaceInFile('src/app/components/features/machines/machines.component.ts', [
  { search: "label: '⚠️ No Service Log'", replace: "label: 'No Service Log'" },
  { search: "label: `⚠️ Due (${daysSince}d)`", replace: "label: `Due (${daysSince}d)`" },
  { search: "label: `✅ OK (${daysSince}d ago)`", replace: "label: `OK (${daysSince}d ago)`" }
]);

// 13. party.component.ts & vendors.component.ts
replaceInFile('src/app/components/features/party/party.component.ts', [
  { search: "{ label: '✏️ Edit', action: 'edit', class: 'btn btn-sm btn-secondary' }", replace: "{ label: 'Edit', action: 'edit', class: 'btn btn-sm btn-secondary' }" },
  { search: "{ label: '🗑️ Delete', action: 'delete', class: 'btn btn-sm btn-danger' }", replace: "{ label: 'Delete', action: 'delete', class: 'btn btn-sm btn-danger' }" }
]);
replaceInFile('src/app/components/features/vendors/vendors.component.ts', [
  { search: "{ label: '✏️ Edit', action: 'edit', class: 'btn btn-sm btn-outline' }", replace: "{ label: 'Edit', action: 'edit', class: 'btn btn-sm btn-outline' }" },
  { search: "{ label: '🗑️ Delete', action: 'delete', class: 'btn btn-sm btn-danger' }", replace: "{ label: 'Delete', action: 'delete', class: 'btn btn-sm btn-danger' }" }
]);

// 14. payments.component.html
replaceInFile('src/app/components/features/payments/payments.component.html', [
  { search: '<div class="enterprise-header-icon">💳</div>', replace: '<div class="enterprise-header-icon"><i class="bi bi-credit-card"></i></div>' },
  { search: "➕ {{ 'payments.add_title' | translate:currentLang }}", replace: "<i class=\"bi bi-plus-lg me-1\"></i>{{ 'payments.add_title' | translate:currentLang }}" },
  { search: '<div style="font-size:48px; margin-bottom:12px;">⚠️</div>', replace: '<div style="margin-bottom:12px;"><i class="bi bi-exclamation-triangle text-danger" style="font-size:48px;"></i></div>' },
  { search: '<button class="btn btn-primary" (click)="loadData()">🔄 Retry</button>', replace: '<button class="btn btn-primary" (click)="loadData()"><i class="bi bi-arrow-repeat me-1"></i>Retry</button>' },
  { search: '⚙️ Columns', replace: '<i class="bi bi-layout-three-columns me-1"></i>Columns' },
  { search: "{{ sortAsc ? '▲' : '▼' }}", replace: "<i class=\"bi ms-1\" [ngClass]=\"sortAsc ? 'bi-chevron-up' : 'bi-chevron-down'\"></i>" },
  { search: '<button class="btn btn-secondary btn-sm" (click)="editPayment(payment)">✏️ Edit</button>', replace: '<button class="btn btn-secondary btn-sm" (click)="editPayment(payment)"><i class="bi bi-pencil me-1"></i>Edit</button>' }
]);

// 15. raw-materials.component.html
replaceInFile('src/app/components/features/raw-materials/raw-materials.component.html', [
  { search: '<div style="font-size:48px; margin-bottom:12px;">⚠️</div>', replace: '<div style="margin-bottom:12px;"><i class="bi bi-exclamation-triangle text-danger" style="font-size:48px;"></i></div>' },
  { search: '<button class="btn btn-primary" (click)="loadData()">🔄 Retry</button>', replace: '<button class="btn btn-primary" (click)="loadData()"><i class="bi bi-arrow-repeat me-1"></i>Retry</button>' },
  { search: '⚙️ Columns', replace: '<i class="bi bi-layout-three-columns me-1"></i>Columns' },
  { search: "{{ sortAsc ? '▲' : '▼' }}", replace: "<i class=\"bi ms-1\" [ngClass]=\"sortAsc ? 'bi-chevron-up' : 'bi-chevron-down'\"></i>" },
  { search: '<button class="btn btn-secondary btn-sm" (click)="editRawMaterial(rm)">✏️ Edit</button>', replace: '<button class="btn btn-secondary btn-sm" (click)="editRawMaterial(rm)"><i class="bi bi-pencil me-1"></i>Edit</button>' }
]);

// 16. salaries.component.html
replaceInFile('src/app/components/features/salaries/salaries.component.html', [
  { search: '<div style="font-size:48px; margin-bottom:12px;">⚠️</div>', replace: '<div style="margin-bottom:12px;"><i class="bi bi-exclamation-triangle text-danger" style="font-size:48px;"></i></div>' },
  { search: '<button class="btn btn-primary" (click)="loadData()">🔄 Retry</button>', replace: '<button class="btn btn-primary" (click)="loadData()"><i class="bi bi-arrow-repeat me-1"></i>Retry</button>' },
  { search: '⚙️ Columns', replace: '<i class="bi bi-layout-three-columns me-1"></i>Columns' },
  { search: "{{ sortAsc ? '▲' : '▼' }}", replace: "<i class=\"bi ms-1\" [ngClass]=\"sortAsc ? 'bi-chevron-up' : 'bi-chevron-down'\"></i>" },
  { search: '<button class="btn btn-outline btn-sm" style="margin-right: 5px; font-weight:700; font-size: 11.5px; padding: 4px 8px;" (click)="editSalary(sal)">✏️ Edit</button>', replace: '<button class="btn btn-outline btn-sm" style="margin-right: 5px; font-weight:700; font-size: 11.5px; padding: 4px 8px;" (click)="editSalary(sal)"><i class="bi bi-pencil me-1"></i>Edit</button>' }
]);

// 17. sales.component.html & .ts
replaceInFile('src/app/components/features/sales/sales.component.html', [
  { search: '<div class="enterprise-header-icon">📈</div>', replace: '<div class="enterprise-header-icon"><i class="bi bi-graph-up-arrow"></i></div>' },
  { search: "➕ {{ 'sales.add_title' | translate:currentLang }}", replace: "<i class=\"bi bi-plus-lg me-1\"></i>{{ 'sales.add_title' | translate:currentLang }}" },
  { search: '<div style="font-size:48px; margin-bottom:12px;">⚠️</div>', replace: '<div style="margin-bottom:12px;"><i class="bi bi-exclamation-triangle text-danger" style="font-size:48px;"></i></div>' },
  { search: '<button class="btn btn-primary" (click)="loadData()">🔄 Retry</button>', replace: '<button class="btn btn-primary" (click)="loadData()"><i class="bi bi-arrow-repeat me-1"></i>Retry</button>' },
  { search: '⚙️ Columns', replace: '<i class="bi bi-layout-three-columns me-1"></i>Columns' },
  { search: "{{ sortAsc ? '▲' : '▼' }}", replace: "<i class=\"bi ms-1\" [ngClass]=\"sortAsc ? 'bi-chevron-up' : 'bi-chevron-down'\"></i>" },
  { search: '<button class="btn btn-secondary btn-sm" *ngIf="!isViewer()" (click)="editSale(sale)">✏️ Edit</button>', replace: '<button class="btn btn-secondary btn-sm" *ngIf="!isViewer()" (click)="editSale(sale)"><i class="bi bi-pencil me-1"></i>Edit</button>' }
]);
replaceInFile('src/app/components/features/sales/sales.component.ts', [
  { search: "title: '💳 Futane Agro Production Payment Gateway'", replace: "title: 'Futane Agro Production Payment Gateway'" },
  { search: "confirmButtonText: '⚡ Confirm & Record Payment ₹' + amount", replace: "confirmButtonText: 'Confirm & Record Payment ₹' + amount" }
]);

// 18. settings.component.html & .ts
replaceInFile('src/app/components/features/settings/settings.component.html', [
  { search: '<h3>🎨 Branding & Visual Identity System</h3>', replace: '<h3><i class="bi bi-palette me-2"></i>Branding & Visual Identity System</h3>' },
  { search: '<option value="light">☀️ Light Mode (Clean Enterprise)</option>', replace: '<option value="light">Light Mode (Clean Enterprise)</option>' },
  { search: '<option value="dark">🌙 Midnight Slate (Dark Mode)</option>', replace: '<option value="dark">Midnight Slate (Dark Mode)</option>' },
  { search: '<option value="oled">🖤 OLED True Black (High Contrast)</option>', replace: '<option value="oled">OLED True Black (High Contrast)</option>' },
  { search: '<h3>🏢 Multi-Company Billing & ERP Business Rules</h3>', replace: '<h3><i class="bi bi-building me-2"></i>Multi-Company Billing & ERP Business Rules</h3>' },
  { search: '📱 {{ b.upiId }}', replace: 'UPI: {{ b.upiId }}' },
  { search: '🏦 Bank Remittance Details:', replace: '<i class="bi bi-bank me-1"></i>Bank Remittance Details:' },
  { search: '<h3>⚡ Developer Hub & API Gateways</h3>', replace: '<h3><i class="bi bi-code-slash me-2"></i>Developer Hub & API Gateways</h3>' },
  { search: '<h3>📡 System Governance, Live Telemetry & Backups</h3>', replace: '<h3><i class="bi bi-hdd-network me-2"></i>System Governance, Live Telemetry & Backups</h3>' },
  { search: "'📥 Export Backup Snapshot'", replace: "'Export Backup Snapshot'" },
  { search: '<h3>👥 Teams & Department Directory</h3>', replace: '<h3><i class="bi bi-people me-2"></i>Teams & Department Directory</h3>' },
  { search: '<h3>🧩 Extensible Custom Fields Engine</h3>', replace: '<h3><i class="bi bi-puzzle me-2"></i>Extensible Custom Fields Engine</h3>' },
  { search: '<h3>💬 Automated Messaging & WhatsApp Dispatch Engine</h3>', replace: '<h3><i class="bi bi-chat-dots me-2"></i>Automated Messaging & WhatsApp Dispatch Engine</h3>' },
  { search: '<span *ngIf="t.channel === \'WHATSAPP\'">🟢 WhatsApp</span>', replace: '<span *ngIf="t.channel === \'WHATSAPP\'"><i class="bi bi-whatsapp text-success me-1"></i>WhatsApp</span>' },
  { search: '<span *ngIf="t.channel === \'SMS\'">📱 SMS</span>', replace: '<span *ngIf="t.channel === \'SMS\'"><i class="bi bi-chat-text me-1"></i>SMS</span>' },
  { search: '<span *ngIf="t.channel === \'EMAIL\'">✉️ Email</span>', replace: '<span *ngIf="t.channel === \'EMAIL\'"><i class="bi bi-envelope me-1"></i>Email</span>' },
  { search: '<span class="verified-check">✓</span>', replace: '<i class="bi bi-patch-check-fill text-success ms-1"></i>' },
  { search: '<h3>🛡️ Users, Roles & Access Control Matrix</h3>', replace: '<h3><i class="bi bi-shield-lock me-2"></i>Users, Roles & Access Control Matrix</h3>' },
  { search: '<h3>🚩 Dynamic Feature Flags & Subsystem Modules</h3>', replace: '<h3><i class="bi bi-flag me-2"></i>Dynamic Feature Flags & Subsystem Modules</h3>' },
  { search: '<h3>🔒 Security Administration & Credentials</h3>', replace: '<h3><i class="bi bi-lock me-2"></i>Security Administration & Credentials</h3>' },
  { search: '<button class="modal-close-btn" (click)="showUserAccessModal = false">✕</button>', replace: '<button class="modal-close-btn" (click)="showUserAccessModal = false" aria-label="Close dialog"><i class="bi bi-x-lg"></i></button>' },
  { search: '<button class="modal-close-btn" (click)="showApiKeyModal = false">✕</button>', replace: '<button class="modal-close-btn" (click)="showApiKeyModal = false" aria-label="Close dialog"><i class="bi bi-x-lg"></i></button>' },
  { search: '<button class="modal-close-btn" (click)="showWebhookModal = false">✕</button>', replace: '<button class="modal-close-btn" (click)="showWebhookModal = false" aria-label="Close dialog"><i class="bi bi-x-lg"></i></button>' },
  { search: '<button class="modal-close-btn" (click)="showTeamModal = false">✕</button>', replace: '<button class="modal-close-btn" (click)="showTeamModal = false" aria-label="Close dialog"><i class="bi bi-x-lg"></i></button>' },
  { search: '<button class="modal-close-btn" (click)="showCustomFieldModal = false">✕</button>', replace: '<button class="modal-close-btn" (click)="showCustomFieldModal = false" aria-label="Close dialog"><i class="bi bi-x-lg"></i></button>' },
  { search: '<button class="modal-close-btn" (click)="showInviteUserModal = false">✕</button>', replace: '<button class="modal-close-btn" (click)="showInviteUserModal = false" aria-label="Close dialog"><i class="bi bi-x-lg"></i></button>' },
  { search: '<button class="modal-close-btn" (click)="showCompanyModal = false">✕</button>', replace: '<button class="modal-close-btn" (click)="showCompanyModal = false" aria-label="Close dialog"><i class="bi bi-x-lg"></i></button>' },
  { search: '<button class="modal-close-btn" (click)="showBankModal = false">✕</button>', replace: '<button class="modal-close-btn" (click)="showBankModal = false" aria-label="Close dialog"><i class="bi bi-x-lg"></i></button>' }
]);
replaceInFile('src/app/components/features/settings/settings.component.ts', [
  { search: 'Namaste {customer_name}! 🚛', replace: 'Namaste {customer_name}!' },
  { search: '📄 Invoice No:', replace: 'Invoice No:' },
  { search: '💰 Amount:', replace: 'Amount:' },
  { search: '🚚 Vehicle:', replace: 'Vehicle:' },
  { search: '📍 Live Consignment Tracking:', replace: 'Live Consignment Tracking:' },
  { search: '💳 Settle via UPI:', replace: 'Settle via UPI:' },
  { search: '🏦 Bank A/C:', replace: 'Bank A/C:' },
  { search: 'Hello {customer_name}! 🎉', replace: 'Hello {customer_name}!' },
  { search: '🚨 *CRITICAL INVENTORY ALERT*', replace: '*CRITICAL INVENTORY ALERT*' }
]);

// 19. transports.component.html
replaceInFile('src/app/components/features/transports/transports.component.html', [
  { search: '⚙️ Columns', replace: '<i class="bi bi-layout-three-columns me-1"></i>Columns' },
  { search: "{{ sortAsc ? '▲' : '▼' }}", replace: "<i class=\"bi ms-1\" [ngClass]=\"sortAsc ? 'bi-chevron-up' : 'bi-chevron-down'\"></i>" },
  { search: '<button class="btn btn-secondary btn-sm" (click)="editTransport(tr)">✏️ Edit</button>', replace: '<button class="btn btn-secondary btn-sm" (click)="editTransport(tr)"><i class="bi bi-pencil me-1"></i>Edit</button>' }
]);

// 20. shared components
replaceInFile('src/app/components/shared/ai-copilot/ai-copilot.component.html', [
  { search: '<button class="close-btn" (click)="isOpen = false" title="Close drawer">✕</button>', replace: '<button class="close-btn" (click)="isOpen = false" title="Close drawer"><i class="bi bi-x-lg"></i></button>' },
  { search: '<option value="en-IN">🇬🇧 English</option>', replace: '<option value="en-IN">English</option>' },
  { search: '<option value="hi-IN">🇮🇳 हिंदी (Hindi)</option>', replace: '<option value="hi-IN">हिंदी (Hindi)</option>' },
  { search: '<option value="mr-IN">🚩 मराठी (Marathi)</option>', replace: '<option value="mr-IN">मराठी (Marathi)</option>' },
  { search: '<span>⚡ Tool: <code>{{ msg.tool }}</code></span>', replace: '<span><i class="bi bi-cpu me-1"></i>Tool: <code>{{ msg.tool }}</code></span>' },
  { search: '<div class="action-title">⚡ Proposed Operational Action</div>', replace: '<div class="action-title"><i class="bi bi-lightning-charge me-1"></i>Proposed Operational Action</div>' }
]);
replaceInFile('src/app/components/shared/ai-copilot/ai-copilot.component.ts', [
  { search: "⚠️ **ERP Copilot Service Notice**", replace: "**ERP Copilot Service Notice**" },
  { search: "✨ **New Chat Session Started**", replace: "**New Chat Session Started**" }
]);

replaceInFile('src/app/components/shared/password-strength/password-strength.component.ts', [
  { search: "'✓ Strong password'", replace: "'Strong password'" }
]);

replaceInFile('src/app/components/shared/qr-scanner-modal/qr-scanner-modal.component.ts', [
  { search: '(click)="closeScanner()">✕</button>', replace: '(click)="closeScanner()"><i class="bi bi-x-lg"></i></button>' }
]);

replaceInFile('src/app/components/shared/universal-importer/universal-importer.component.html', [
  { search: '<!-- 🔍 DRY-RUN VALIDATION & PREVIEW MODAL -->', replace: '<!-- DRY-RUN VALIDATION & PREVIEW MODAL -->' }
]);
replaceInFile('src/app/components/shared/universal-importer/universal-importer.component.ts', [
  { search: "icon: '👥'", replace: "icon: 'bi-people'" },
  { search: "icon: '📦'", replace: "icon: 'bi-box-seam'" },
  { search: "icon: '🏭'", replace: "icon: 'bi-buildings'" },
  { search: "icon: '📋'", replace: "icon: 'bi-clipboard-check'" },
  { search: "icon: '🏬'", replace: "icon: 'bi-shop'" },
  { search: "icon: '👷'", replace: "icon: 'bi-person-badge'" },
  { search: "icon: '⚙️'", replace: "icon: 'bi-gear'" },
  { search: "icon: '💰'", replace: "icon: 'bi-cash-coin'" }
]);

// 21. app.component.html
replaceInFile('src/app/app.component.html', [
  { search: '<button class="btn-row-action" style="color:var(--primary); border-color:var(--primary-border); background:var(--primary-soft);" *ngIf="sale.remaining > 0" (click)="payWithRazorpay(sale)">💳 Pay</button>', replace: '<button class="btn-row-action" style="color:var(--primary); border-color:var(--primary-border); background:var(--primary-soft);" *ngIf="sale.remaining > 0" (click)="payWithRazorpay(sale)"><i class="bi bi-credit-card me-1"></i>Pay</button>' },
  { search: '<span class="kpi-icon">🧪</span>', replace: '<span class="kpi-icon"><i class="bi bi-droplet-half"></i></span>' },
  { search: '<span class="kpi-icon">⚡</span>', replace: '<span class="kpi-icon"><i class="bi bi-lightning-charge"></i></span>' },
  { search: '<span>🌅 Morning Shift</span>', replace: '<span><i class="bi bi-sunrise me-1"></i>Morning Shift</span>' },
  { search: '<span>☀️ Afternoon Shift</span>', replace: '<span><i class="bi bi-sun me-1"></i>Afternoon Shift</span>' },
  { search: '<span>🌙 Night Shift</span>', replace: '<span><i class="bi bi-moon-stars me-1"></i>Night Shift</span>' },
  { search: '📞 9820099881', replace: 'Tel: 9820099881' },
  { search: '📞 9848012345', replace: 'Tel: 9848012345' },
  { search: '📞 9727054321', replace: 'Tel: 9727054321' },
  { search: '📞 9822014589', replace: 'Tel: 9822014589' },
  { search: '📞 9136098765', replace: 'Tel: 9136098765' },
  { search: '<span class="aii-bullet green">🎯</span>', replace: '<span class="aii-bullet green"><i class="bi bi-bullseye"></i></span>' },
  { search: '<span class="aii-bullet purple">⚡</span>', replace: '<span class="aii-bullet purple"><i class="bi bi-lightning-charge"></i></span>' }
]);

// 22. app.component.ts
replaceInFile('src/app/app.component.ts', [
  { search: "{ label: '✏️ Edit', action: 'edit', class: 'btn btn-sm btn-primary' }", replace: "{ label: 'Edit', action: 'edit', class: 'btn btn-sm btn-primary' }" },
  { search: "{ label: '🗑️ Delete', action: 'delete', class: 'btn btn-sm btn-danger' }", replace: "{ label: 'Delete', action: 'delete', class: 'btn btn-sm btn-danger' }" },
  { search: "`🔄 Live Update: ${update.module}`", replace: "`Live Update: ${update.module}`" },
  { search: "new Notification('⚠️ Low Inventory Alert',", replace: "new Notification('Low Inventory Alert'," },
  { search: "'⚠️ Low Inventory Alert',", replace: "'Low Inventory Alert'," },
  { search: "'🚛 Overdue Transport Payments',", replace: "'Overdue Transport Payments'," },
  { search: "'💼 Pending Salaries Alert',", replace: "'Pending Salaries Alert'," },
  { search: "title: '💳 Futane Agro Production Payment Gateway'", replace: "title: 'Futane Agro Production Payment Gateway'" },
  { search: "confirmButtonText: '⚡ Confirm & Record Payment ₹' + amount", replace: "confirmButtonText: 'Confirm & Record Payment ₹' + amount" },
  { search: "this.appNotificationService.push('info', `📊 Telemetry Environment: ${env.toUpperCase()}`", replace: "this.appNotificationService.push('info', `Telemetry Environment: ${env.toUpperCase()}`" },
  { search: "this.appNotificationService.push('success', `🔄 Telemetry Refreshed`", replace: "this.appNotificationService.push('success', `Telemetry Refreshed`" },
  { search: "this.appNotificationService.push('error', '🔴 Backend Offline'", replace: "this.appNotificationService.push('error', 'Backend Offline'" },
  { search: "this.appNotificationService.push('warning', '💰 Outstanding Receivables'", replace: "this.appNotificationService.push('warning', 'Outstanding Receivables'" },
  { search: "this.appNotificationService.push('info', '📦 Warehouse Stock Sync'", replace: "this.appNotificationService.push('info', 'Warehouse Stock Sync'" },
  { search: '💡 AI Tip:', replace: 'AI Tip:' },
  { search: '💡 AI Suggestion:', replace: 'AI Suggestion:' },
  { search: '💡 <strong>Tip:</strong>', replace: '<strong>Tip:</strong>' }
]);

console.log('Finished applying standardizations.');
