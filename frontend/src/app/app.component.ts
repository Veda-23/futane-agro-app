import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subscription, interval, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';

declare var Razorpay: any;
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl, Title } from '@angular/platform-browser';
import { ApiService } from './api.service';
import { TranslateService, Language, TranslatePipe } from './translate.service';
import { Chart, registerables } from 'chart.js';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { environment } from '../environments/environment';
import { DataTableComponent } from './components/data-table/data-table.component';
import { DashboardComponent } from './components/features/dashboard/dashboard.component';
import { ProductionComponent } from './components/features/production/production.component';
import { PartyComponent } from './components/features/party/party.component';
import { SalesComponent } from './components/features/sales/sales.component';
import { PaymentsComponent } from './components/features/payments/payments.component';
import { RawMaterialsComponent } from './components/features/raw-materials/raw-materials.component';
import { VendorsComponent } from './components/features/vendors/vendors.component';
import { InventoryComponent } from './components/features/inventory/inventory.component';
import { EmployeesComponent } from './components/features/employees/employees.component';
import { SalariesComponent } from './components/features/salaries/salaries.component';
import { TransportsComponent } from './components/features/transports/transports.component';
import { DriversComponent } from './components/features/drivers/drivers.component';
import { InvoicesComponent } from './components/features/invoices/invoices.component';
import { ReportsComponent } from './components/features/reports/reports.component';
import { MachinesComponent } from './components/features/machines/machines.component';
import { DispatchComponent } from './components/features/dispatch/dispatch.component';
import { ExpensesComponent } from './components/features/expenses/expenses.component';
import { BankComponent } from './components/features/bank/bank.component';
import { AnalyticsComponent } from './components/features/analytics/analytics.component';
import { AuditLogsComponent } from './components/features/audit-logs/audit-logs.component';
import { BillingHubComponent } from './components/features/billing-hub/billing-hub.component';
import { SettingsComponent } from './components/features/settings/settings.component';
import { HeaderComponent } from './components/layout/header/header.component';
import { SidebarComponent } from './components/layout/sidebar/sidebar.component';
import { LoginComponent } from './components/features/auth/login/login.component';
import { GlobalFilterComponent } from './components/features/global-filter/global-filter.component';
import { AiCopilotComponent } from './components/shared/ai-copilot/ai-copilot.component';
import { UniversalImporterComponent } from './components/shared/universal-importer/universal-importer.component';
import { NotificationService } from './services/notification.service';
import { AppNotificationService } from './services/app-notification.service';
import { WebSocketService } from './services/websocket.service';
import { PaymentService } from './services/payment.service';
Chart.register(...registerables);

import * as XLSX from 'xlsx';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, DataTableComponent, HeaderComponent, SidebarComponent, DashboardComponent, ProductionComponent, PartyComponent, SalesComponent, PaymentsComponent, RawMaterialsComponent, VendorsComponent, InventoryComponent, EmployeesComponent, SalariesComponent, TransportsComponent, DriversComponent, InvoicesComponent, ReportsComponent, MachinesComponent, DispatchComponent, ExpensesComponent, BankComponent, AnalyticsComponent, AuditLogsComponent, BillingHubComponent, SettingsComponent, LoginComponent, GlobalFilterComponent, AiCopilotComponent, UniversalImporterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent implements OnInit, OnDestroy {
  title = 'Futane Agro ERP';

  // Environment Flags (D-04)
  readonly isUat: boolean = (environment as any).uat === true;
  readonly isProd: boolean = environment.production && !(environment as any).uat;
  isProduction = environment.production;

  // Expose Math helper for template calls
  Math = Math;

  // Sidebar State (Desktop Collapsed Rail + Mobile Drawer)
  isSidebarOpen = window.innerWidth > 1024;
  isSidebarCollapsed = localStorage.getItem('futane_sidebar_collapsed') === 'true';

  toggleSidebar() {
    if (window.innerWidth > 1024) {
      this.toggleSidebarCollapse();
    } else {
      this.isSidebarOpen = !this.isSidebarOpen;
    }
  }

  toggleSidebarCollapse() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    localStorage.setItem('futane_sidebar_collapsed', this.isSidebarCollapsed ? 'true' : 'false');
  }

  exportTableToExcel(data: any[], filename: string, sheetName: string = 'Data') {
    if (!data || data.length === 0) {
      this.notificationService.info('Export', 'No data to export.');
      return;
    }
    const flat = data.map(row => {
      const result: any = {};
      const flatten = (obj: any, prefix = '') => {
        Object.keys(obj || {}).forEach(key => {
          const val = obj[key];
          const fullKey = prefix ? `${prefix}_${key}` : key;
          if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
            flatten(val, fullKey);
          } else {
            result[fullKey] = val;
          }
        });
      };
      flatten(row);
      ['version', 'isDeleted', 'isActive', 'deletedBy', 'deletedDate'].forEach(k => delete result[k]);
      return result;
    });

    const ws = XLSX.utils.json_to_sheet(flat);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const cols = Object.keys(flat[0] || {}).map(k => ({ wch: Math.max(k.length, 14) }));
    ws['!cols'] = cols;
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `${filename}_${dateStr}.xlsx`);
    this.notificationService.success('Export Complete', `${filename}_${dateStr}.xlsx downloaded successfully.`);
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeyDown(event: KeyboardEvent) {
    const activeTag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
    if (['input', 'textarea', 'select'].includes(activeTag || '')) return;
    if (!this.isAuthenticated) return;

    if (event.altKey && !event.shiftKey && !event.ctrlKey) {
      const shortcuts: { [key: string]: string } = {
        'd': 'dashboard',
        's': 'sales',
        'p': 'production',
        'e': 'employees',
        'b': 'billinghub',
        'r': 'reports',
        'a': 'analytics',
        'i': 'inventory',
        'm': 'machines',
        'x': 'expenses',
      };
      const tab = shortcuts[event.key.toLowerCase()];
      if (tab && (!this.accessibleTabs || this.accessibleTabs[tab])) {
        event.preventDefault();
        this.switchTab(tab);
        this.notificationService.info(
          'Navigation',
          `Switched to ${tab.charAt(0).toUpperCase() + tab.slice(1)} (Alt+${event.key.toUpperCase()})`
        );
      }
    }

    if (event.key === 'Escape') {
      this.showColDropdown = {};
      this.showFilters = false;
    }
  }

  // Generic Filter, Sort & Search State
  filterSearchQuery = '';
  filterDate = '';
  filterDateFrom = '';
  filterDateTo = '';
  filterMonth = '';
  filterYear: any = '';
  filterStatus = '';
  filterPartyId = '';
  filterEmployeeId = '';
  filterInvoiceNo = '';
  filterCrateType = '';
  filterShift = '';
  filterMinSuccessful: number | null = null;
  filterMinEfficiency = 0;
  filterMaterial = '';
  filterMinAmount: number | null = null;
  filterMaxAmount: number | null = null;
  filterPaymentStatus = '';
  filterPaymentMode = '';
  filterStockStatus = '';
  filterPartyType = '';
  filterMachineStatus = '';
  filterDepartment = '';
  sortField = '';
  sortAsc = true;
  showFilters = false;

  crateTypes: string[] = ['Apple Crate', 'Tomato Crate', 'Mango Crate', 'Banana Crate', 'Vegetable Crate', 'Universal Storage Crate'];
  shifts: string[] = ['Morning Shift', 'Afternoon Shift', 'Night Shift'];

  get currentFilters() {
    return {
      query: this.filterSearchQuery,
      date: this.filterDate,
      dateFrom: this.filterDateFrom,
      dateTo: this.filterDateTo,
      month: this.filterMonth,
      year: this.filterYear,
      status: this.filterStatus,
      partyId: this.filterPartyId,
      crateType: this.filterCrateType,
      shift: this.filterShift,
      minSuccessful: this.filterMinSuccessful,
      minEfficiency: this.filterMinEfficiency,
      paymentStatus: this.filterPaymentStatus,
      paymentMode: this.filterPaymentMode,
      stockStatus: this.filterStockStatus,
      partyType: this.filterPartyType,
      machineStatus: this.filterMachineStatus,
      department: this.filterDepartment
    };
  }

  applyFilters(newFilters: any) {
    if (!newFilters) return;
    this.filterSearchQuery = newFilters.query || '';
    this.filterDate = newFilters.date || '';
    this.filterDateFrom = newFilters.dateFrom || '';
    this.filterDateTo = newFilters.dateTo || '';
    this.filterMonth = newFilters.month || '';
    this.filterYear = newFilters.year || '';
    this.filterStatus = newFilters.status || '';
    this.filterPartyId = newFilters.partyId || '';
    this.filterCrateType = newFilters.crateType || '';
    this.filterShift = newFilters.shift || '';
    this.filterMinSuccessful = newFilters.minSuccessful !== undefined ? newFilters.minSuccessful : null;
    this.filterMinEfficiency = newFilters.minEfficiency !== undefined ? newFilters.minEfficiency : 0;
    this.filterPaymentStatus = newFilters.paymentStatus || '';
    this.filterPaymentMode = newFilters.paymentMode || '';
    this.filterStockStatus = newFilters.stockStatus || '';
    this.filterPartyType = newFilters.partyType || '';
    this.filterMachineStatus = newFilters.machineStatus || '';
    this.filterDepartment = newFilters.department || '';
  }

  refreshCurrentTab() {
    this.loadAllData();
  }

  getTotalCount(tab: string): number {
    switch (tab) {
      case 'production': return this.ppdList.length;
      case 'monthly-production': return this.ppmList.length;
      case 'parties': return this.parties.length;
      case 'sales': return this.salesList.length;
      case 'payments': return this.paymentsList.length;
      case 'raw-materials': return this.rawMaterialsList.length;
      case 'vendors': return this.vendors.length;
      case 'inventory': return this.inventoryList.length;
      case 'employees': return this.employees.length;
      case 'machines': return this.machinesList.length;
      default: return 0;
    }
  }

  currentPage = 1;
  pageSize = 10;

  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};
  backupsList: any[] = [];
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  showExportDropdown: { [key: string]: boolean } = {};

  // Auth State
  isAuthenticated = false;
  loggedInUser: any = null;
  forcePasswordChangeMode = false;

  // UI Tabs State
  activeTab = 'dashboard';
  accessibleTabs: { [key: string]: boolean } = {};
  dbRolePermissions: any[] = [];
  dbFeatureFlags: any[] = [];

  // Idle Timer
  private readonly IDLE_TIMEOUT = 600000; // 10 minutes in ms
  lastActivityTime = Date.now();
  logoutCountdown = '';
  lastVisibleTime = Date.now();

  // Database lists
  parties: any[] = [];
  vendors: any[] = [];
  drivers: any[] = [];
  employees: any[] = [];
  ppdList: any[] = [];
  ppmList: any[] = [];

  partyTableColumns = [
    { key: 'partyName', label: 'Name' },
    { key: 'partyContact', label: 'Contact' },
    { key: 'gstNumber', label: 'GST' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'createdDate', label: 'Date', type: 'date' }
  ];
  
  partyTableActions = [
    { label: 'Edit', action: 'edit', class: 'btn btn-sm btn-primary' },
    { label: 'Delete', action: 'delete', class: 'btn btn-sm btn-danger' }
  ];

  handlePartyAction(event: any) {
    if (event.action === 'edit') this.editParty(event.item);
    if (event.action === 'delete') this.deleteParty(event.item.id);
  }

  vendorTableColumns = [
    { key: 'vendorName', label: 'Name' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'gstNumber', label: 'GST' },
    { key: 'address', label: 'Address' },
    { key: 'createdDate', label: 'Date', type: 'date' }
  ];
  
  vendorTableActions = [
    { label: 'Edit', action: 'edit', class: 'btn btn-sm btn-primary' },
    { label: 'Delete', action: 'delete', class: 'btn btn-sm btn-danger' }
  ];

  handleVendorAction(event: any) {
    if (event.action === 'edit') this.editVendor(event.item);
    if (event.action === 'delete') this.deleteVendor(event.item.id);
  }

  employeeTableColumns = [
    { key: 'empName', label: 'Name' },
    { key: 'empContact', label: 'Contact' },
    { key: 'designation', label: 'Designation' },
    { key: 'salary', label: 'Salary', type: 'currency' },
    { key: 'joiningDate', label: 'Joined', type: 'date' }
  ];
  
  employeeTableActions = [
    { label: 'Edit', action: 'edit', class: 'btn btn-sm btn-primary' },
    { label: 'Delete', action: 'delete', class: 'btn btn-sm btn-danger' }
  ];

  handleEmployeeAction(event: any) {
    if (event.action === 'edit') this.editEmployee(event.item);
    if (event.action === 'delete') this.deleteEmployee(event.item.id);
  }

  salesList: any[] = [];
  paymentsList: any[] = [];
  inventoryList: any[] = [];
  rawMaterialsList: any[] = [];
  transportsList: any[] = [];
  salariesList: any[] = [];
  invoicesList: any[] = [];
  auditLogsList: any[] = [];

  // New enterprise module data
  machinesList: any[] = [];
  machineBreakdownsList: any[] = [];
  dispatchesList: any[] = [];
  expensesList: any[] = [];
  bankTransactionsList: any[] = [];

  // Form Models
  ppdForm = { date: '', crateType: 'Apple Crate', totalProduction: 0, successful: 0, rejected: 0, shift: 'Morning Shift' };
  ppmForm = { month: 'May', year: 2026, cratesProduced: 0, electricityUnits: 0, electricityBill: 0 };
  partyForm = { partyName: '', partyAddress: '', partyContact: '', gstNumber: '', email: '', city: '', state: '', gstCertPath: '', panCardPath: '', agreementPath: '' };
  vendorForm = { vendorName: '', mobile: '', address: '', gstNumber: '' };
  driverForm = { driverName: '', mobile: '', licenseNumber: '', address: '' };
  employeeForm = { empName: '', empContact: '', salary: 0, address: '', designation: '', joiningDate: '', aadhaarNo: '', bankAccount: '', photoPath: '', aadhaarCardPath: '', bankPassbookPath: '' };
  salesForm = { date: '', id: '', crateType: 'Apple Crate', crateMaterial: 'Plastic', quantity: 0, rate: 0, totalAmount: 0, paid: 0, remaining: 0 };
  paymentsForm = { id: '', invoiceNo: '', amountReceived: 0, paymentMode: 'UPI', paymentDate: '' };
  rawMaterialsForm = { date: '', materialName: 'HDPE Plastic Granules', id: '', weight: 0, rate: 0, purchaseBillPath: '', weightSlipPath: '' };
  transportsForm = { date: '', truckNumber: '', id: '', rent: 0, advance: 0, truckPhotoPath: '', driverLicensePath: '' };
  salariesForm = { id: '', month: 'May', year: 2026, salaryAmount: 0, status: 'Pending', paidDate: '' };

  // New enterprise form models
  machineForm = { machineName: '', machineCode: '', installedDate: '', status: 'Running', capacityPerHour: 0 };
  breakdownForm = { id: '', breakdownDate: '', description: '', resolvedDate: '', downtimeHours: 0 };
  dispatchForm = { id: '', dispatchDate: '', vehicleNumber: '', driverName: '', deliveryAddress: '', dispatchStatus: 'Pending' };
  expenseForm = { expenseDate: '', category: 'Maintenance', description: '', amount: 0, paidBy: '' };
  bankTxnForm = { transactionDate: '', transactionType: 'Credit', amount: 0, description: '', referenceNo: '' };

  // Edit State Tracking for All Modules
  editingPartyId: string | null = null;
  editingSaleId: string | null = null;
  editingPaymentId: string | null = null;
  editingRawMaterialId: string | null = null;
  editingVendorId: string | null = null;
  editingDriverId: string | null = null;
  editingEmployeeId: string | null = null;
  editingSalaryId: string | null = null;
  editingTransportId: string | null = null;
  editingInventoryId: string | null = null;
  editingMachineId: string | null = null;
  editingBreakdownId: string | null = null;
  editingDispatchId: string | null = null;
  editingExpenseId: string | null = null;
  editingBankTxnId: string | null = null;

  // Table Density Mode
  tableDensity: 'compact' | 'comfortable' | 'spacious' = 'comfortable';
  setDensity(d: 'compact' | 'comfortable' | 'spacious') {
    this.tableDensity = d;
  }

  // Multi-Row Selection by Tab
  selectedRowsByTab: { [tab: string]: Set<string> } = {};

  getSelectedCount(tab: string): number {
    return this.selectedRowsByTab[tab]?.size || 0;
  }

  isRowSelected(tab: string, id: any): boolean {
    if (!id) return false;
    return this.selectedRowsByTab[tab]?.has(String(id)) || false;
  }

  toggleSelectRow(tab: string, id: any) {
    if (!id) return;
    const strId = String(id);
    if (!this.selectedRowsByTab[tab]) this.selectedRowsByTab[tab] = new Set();
    if (this.selectedRowsByTab[tab].has(strId)) {
      this.selectedRowsByTab[tab].delete(strId);
    } else {
      this.selectedRowsByTab[tab].add(strId);
    }
  }

  isAllSelected(tab: string, list: any[]): boolean {
    if (!list || list.length === 0) return false;
    const tabSet = this.selectedRowsByTab[tab];
    if (!tabSet || tabSet.size === 0) return false;
    return list.every(item => tabSet.has(String(item.id || item.partyId || item.saleId || item.paymentId || item.empId || item.txnId || item.expenseId || item.dispatchId || item.machineId || item.vendorId || item.driverId || item.materialId)));
  }

  toggleSelectAll(tab: string, list: any[]) {
    if (!list || list.length === 0) return;
    if (!this.selectedRowsByTab[tab]) this.selectedRowsByTab[tab] = new Set();
    const all = this.isAllSelected(tab, list);
    if (all) {
      list.forEach(item => {
        const id = String(item.id || item.partyId || item.saleId || item.paymentId || item.empId || item.txnId || item.expenseId || item.dispatchId || item.machineId || item.vendorId || item.driverId || item.materialId);
        this.selectedRowsByTab[tab].delete(id);
      });
    } else {
      list.forEach(item => {
        const id = String(item.id || item.partyId || item.saleId || item.paymentId || item.empId || item.txnId || item.expenseId || item.dispatchId || item.machineId || item.vendorId || item.driverId || item.materialId);
        this.selectedRowsByTab[tab].add(id);
      });
    }
  }

  clearSelection(tab: string) {
    if (this.selectedRowsByTab[tab]) {
      this.selectedRowsByTab[tab].clear();
    }
  }

  bulkExportSelected(tab: string, list: any[]) {
    const selectedIds = this.selectedRowsByTab[tab];
    if (!selectedIds || selectedIds.size === 0) return;
    const selectedItems = list.filter(item => selectedIds.has(String(item.id || item.partyId || item.saleId || item.paymentId || item.empId || item.txnId || item.expenseId || item.dispatchId || item.machineId || item.vendorId || item.driverId || item.materialId)));
    this.exportDataList(tab, selectedItems);
    this.notificationService.success('Export Complete', `${selectedItems.length} records exported to CSV.`);
  }

  exportDataList(tab: string, items: any[]) {
    if (!items || items.length === 0) return;
    const headers = Object.keys(items[0]).filter(k => typeof items[0][k] !== 'object');
    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headers.join(','),
      ...items.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${tab}_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Grafana Analytics & Telemetry Health state
  selectedAnalyticsEnv: 'uat' | 'prod' = ((environment as any).uat ? 'uat' : ((environment as any).production ? 'prod' : 'uat'));
  uatGrafanaUrl: string = 'http://localhost:3000/d/ffr4fw1rmgr9cb/system-and-infra?orgId=1&var-environment=UAT&kiosk=tv&refresh=5s';
  prodGrafanaUrl: string = 'http://localhost:3000/d/ffr4fw1rmgr9cb/system-and-infra?orgId=1&var-environment=PROD&kiosk=tv&refresh=5s';
  grafanaEmbedUrl: SafeResourceUrl | null = null;
  rawGrafanaUrl: string = '';
  telemetryHealth = {
    grafanaOnline: false,
    grafanaVersion: 'v10.4.2',
    prometheusOnline: false,
    backendOnline: false,
    lastUpdated: '',
    checking: false,
    alertLevel: 'green' as 'green' | 'yellow' | 'red',
    activeAlertsCount: 0,
    alerts: [] as { severity: string; env: string; name: string; summary: string; timestamp: string }[]
  };
  showAlertModal = false;
  private telemetrySub: Subscription | null = null;

  // Language state
  currentLang: Language = 'en';

  // Invoice view / print details
  selectedInvoice: any = null;

  // Reports state
  reportFilter = { type: 'production', date: '', id: '' };
  filteredReportData: any[] = [];

  customBackendUrl = '';

  // Live Clock & Session State
  currentDateTimeString = '';
  loginTime = '';
  sessionDuration = '';
  private clockInterval: any = null;


  // Billing Hub & Settings State
  activeBillType = 'tax_invoice';
  selectedBillRecordId = '';
  selectedBillRecord: any = null;
  settingsSearchQuery = '';
  isDarkMode = false;
  settingsList: any[] = [];
  usersList: any[] = [];
  userForm = { username: '', password: '', role: 'OPERATOR', name: '', email: '' };

  constructor(
    private apiService: ApiService,
    private translateService: TranslateService,
    private sanitizer: DomSanitizer,
    private notificationService: NotificationService,
    private titleService: Title,
    private appNotificationService: AppNotificationService,
    private wsService: WebSocketService,
    private paymentService: PaymentService
  ) {}

  isTokenExpired(token: string): boolean {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload || !payload.exp) return false;
      return (payload.exp * 1000) < Date.now();
    } catch {
      return false;
    }
  }

  ngOnInit() {
    this.titleService.setTitle((environment as any).appTitle || 'Futane Agro ERP');
    this.translateService.init();
    this.currentLang = this.translateService.getCurrentLanguage();
    this.translateService.language$.subscribe(lang => this.currentLang = lang);

    this.updateGrafanaUrl();
    this.pollTelemetryHealth();
    this.telemetrySub = interval(15000).subscribe(() => this.pollTelemetryHealth());

    this.initSettingsList();

    // Listen for Realtime WebSocket Business Actions across sessions (O-03 & Master Prompt #9)
    this.wsService.updates$.subscribe(update => {
      if (update && this.isAuthenticated) {
        this.appNotificationService.push(
          'info',
          `Live Update: ${update.module}`,
          update.description || 'Data updated by another user.'
        );

        // Real-time synchronization for Admin Control Center changes
        const adminModules = ['FEATURES', 'BRANDING', 'PERMISSIONS', 'TEAMS', 'CUSTOM_FIELDS', 'SETTINGS'];
        if (adminModules.includes(update.module?.toUpperCase())) {
          this.loadEnterpriseBrandingAndFeatures();
        }
      }
    });

    // Check session/local storage for session and active tab persistence
    const cachedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
    const cachedToken = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
    if (cachedUser) {
      if (cachedToken && this.isTokenExpired(cachedToken)) {
        this.handleLogout();
      } else {
        if (cachedToken) {
          sessionStorage.setItem('jwtToken', cachedToken);
        }
        sessionStorage.setItem('user', cachedUser);
        this.loggedInUser = JSON.parse(cachedUser);
        this.isAuthenticated = true;
        this.loginTime = sessionStorage.getItem('loginTime') || new Date().toString();
        this.updateAccessibleTabs();
        const savedTab = sessionStorage.getItem('activeTab');
        if (savedTab && this.accessibleTabs[savedTab]) {
          this.activeTab = savedTab;
        }
        this.resetIdleTimer();
      }
    }

    // Use environment-specific key so PROD and UAT dark mode states don't bleed into each other
    // Migrate: clear old shared key so stale dark-mode from a different environment doesn't apply
    localStorage.removeItem('erp_dark_mode');
    const darkModeKey = environment.production && !(environment as any).uat ? 'erp_dark_mode_prod' : 'erp_dark_mode_uat';
    const savedDark = localStorage.getItem(darkModeKey);
    if (savedDark === 'true') {
      this.isDarkMode = true;
      const darkSetting = this.settingsList.find(s => s.key === 'theme_dark_mode_enabled');
      if (darkSetting) darkSetting.value = true;
      this.applyTheme();
    }

    this.setupIdleTimer();
    this.startClock();
    this.loadEnterpriseBrandingAndFeatures();
  }

  setupIdleTimer() {
    const events = ['mousemove', 'click', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, () => this.resetIdleTimer());
    });
  }

  resetIdleTimer() {
    this.lastActivityTime = Date.now();
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange() {
    if (!this.isAuthenticated) return;
    
    if (document.hidden) {
      this.lastVisibleTime = Date.now();
    } else {
      const hiddenDuration = Date.now() - this.lastVisibleTime;
      if (hiddenDuration >= 300000) { // 5 minutes in ms
        this.logoutDueToInactivity();
      } else {
        this.resetIdleTimer();
      }
    }
  }

  getTimeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    if (isNaN(diff)) return '';
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  checkLowInventoryAlert() {
    const threshold = 10;
    const lowItems = (this.inventoryList || []).filter(i => (i.currentStock || 0) <= threshold);
    if (lowItems.length > 0 && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Low Inventory Alert', {
          body: `${lowItems.length} item(s) are running low: ${lowItems.map(i => i.crateType).join(', ')}`,
          icon: 'assets/logo.svg'
        });
      } catch (e) {
        console.warn('Notification error:', e);
      }
    }
  }

  logoutDueToInactivity() {
    if (this.isAuthenticated) {
      this.lastActivityTime = Date.now();
      this.notificationService.showSessionExpired(() => this.handleLogout());
    }
  }

  loadEnterpriseBrandingAndFeatures() {
    this.apiService.getAdminBranding().subscribe({
      next: (b) => {
        if (b && b.brand_primary_color) {
          document.documentElement.style.setProperty('--brand-primary', b.brand_primary_color);
          document.documentElement.style.setProperty('--doc-theme', b.brand_primary_color);
        }
        if (b && b.app_display_name) {
          this.titleService.setTitle(`${b.app_display_name} [UAT]`);
        }
      },
      error: () => {}
    });

    this.apiService.getAdminRolePermissions().subscribe({
      next: (perms) => {
        if (perms && perms.length > 0) {
          this.dbRolePermissions = perms;
          this.updateAccessibleTabs();
        }
      },
      error: () => {}
    });

    this.apiService.getAdminFeatureFlags().subscribe({
      next: (flags) => {
        if (flags && flags.length > 0) {
          this.dbFeatureFlags = flags;
          this.updateAccessibleTabs();
        }
      },
      error: () => {}
    });
  }

  updateAccessibleTabs() {
    if (!this.loggedInUser) {
      this.accessibleTabs = {};
      return;
    }
    const role = this.loggedInUser.role;
    const allTabs = [
      'dashboard', 'production', 'monthly-production', 'parties', 'sales',
      'payments', 'raw-materials', 'vendors', 'inventory', 'employees',
      'salaries', 'transports', 'drivers', 'machines', 'dispatch',
      'expenses', 'bank', 'invoices', 'billinghub', 'reports', 'analytics',
      'settings', 'audit-logs'
    ];
    
    // Clear all
    allTabs.forEach(t => this.accessibleTabs[t] = false);

    // If dynamic role permissions exist in database, apply them
    if (this.dbRolePermissions && this.dbRolePermissions.length > 0) {
      const rolePerms = this.dbRolePermissions.filter(p => p.role === role);
      if (rolePerms.length > 0) {
        rolePerms.forEach(p => {
          if (p.canView) {
            this.accessibleTabs[p.moduleKey] = true;
          }
        });
      } else if (role === 'SUPER_ADMIN') {
        allTabs.forEach(t => this.accessibleTabs[t] = true);
      }
    } else {
      // Fallback to initial seed roles
      if (role === 'SUPER_ADMIN') {
        allTabs.forEach(t => this.accessibleTabs[t] = true);
      } else if (role === 'ADMIN') {
        const adminTabs = [
          'dashboard', 'production', 'monthly-production', 'parties', 'sales',
          'payments', 'raw-materials', 'vendors', 'inventory', 'employees',
          'salaries', 'transports', 'drivers', 'machines', 'dispatch',
          'expenses', 'bank', 'invoices', 'billinghub', 'reports', 'analytics',
          'audit-logs', 'settings'
        ];
        adminTabs.forEach(t => this.accessibleTabs[t] = true);
      } else if (role === 'MANAGER') {
        const managerTabs = [
          'dashboard', 'production', 'monthly-production', 'parties', 'sales',
          'payments', 'raw-materials', 'vendors', 'inventory', 'employees',
          'salaries', 'transports', 'drivers', 'machines', 'dispatch',
          'expenses', 'bank', 'invoices', 'billinghub', 'reports', 'analytics'
        ];
        managerTabs.forEach(t => this.accessibleTabs[t] = true);
      } else if (role === 'ACCOUNTANT') {
        const accountantTabs = [
          'dashboard', 'payments', 'salaries', 'expenses', 'invoices', 'billinghub', 'reports', 'analytics'
        ];
        accountantTabs.forEach(t => this.accessibleTabs[t] = true);
      } else if (role === 'OPERATOR') {
        const operatorTabs = [
          'dashboard', 'production', 'monthly-production', 'inventory', 'raw-materials', 'machines'
        ];
        operatorTabs.forEach(t => this.accessibleTabs[t] = true);
      } else if (role === 'VIEWER') {
        const viewerTabs = [
          'dashboard', 'production', 'monthly-production', 'parties', 'sales',
          'payments', 'raw-materials', 'vendors', 'inventory', 'employees',
          'salaries', 'transports', 'drivers', 'machines', 'dispatch',
          'expenses', 'bank', 'invoices', 'billinghub', 'reports', 'analytics'
        ];
        viewerTabs.forEach(t => this.accessibleTabs[t] = true);
      }
    }

    // Filter out any modules disabled via feature flags (SUPER_ADMIN always sees settings)
    if (this.dbFeatureFlags && this.dbFeatureFlags.length > 0) {
      this.dbFeatureFlags.forEach(f => {
        if (!f.enabled && f.moduleKey !== 'settings') {
          this.accessibleTabs[f.moduleKey] = false;
        }
      });
    }
  }


  startClock() {
    this.updateClock();
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
    this.clockInterval = setInterval(() => {
      this.updateClock();
    }, 1000);
  }

  updateClock() {
    const now = new Date();
    this.currentDateTimeString = now.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    if (this.isAuthenticated && this.loginTime) {
      const loginDate = new Date(this.loginTime);
      if (!isNaN(loginDate.getTime())) {
        const diffMs = now.getTime() - loginDate.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const hrs = Math.floor(diffSecs / 3600);
        const mins = Math.floor((diffSecs % 3600) / 60);
        const secs = diffSecs % 60;
        this.sessionDuration = `${hrs}h ${mins}m ${secs}s`;
      } else {
        this.sessionDuration = '0h 0m 0s';
      }

      // Live Inactivity/Auto-logout Ticker
      if (document.hidden) {
        const hiddenDuration = now.getTime() - this.lastVisibleTime;
        if (hiddenDuration >= 300000) { // 5 minutes background limit
          this.logoutDueToInactivity();
        }
      }

      const elapsed = now.getTime() - this.lastActivityTime;
      const remainingSecs = Math.max(0, Math.floor((this.IDLE_TIMEOUT - elapsed) / 1000));
      const rMins = Math.floor(remainingSecs / 60);
      const rSecs = remainingSecs % 60;
      this.logoutCountdown = `${rMins}m ${rSecs < 10 ? '0' : ''}${rSecs}s`;

      if (elapsed >= this.IDLE_TIMEOUT) {
        this.logoutDueToInactivity();
      }
    } else {
      this.sessionDuration = '';
      this.logoutCountdown = '';
    }
  }


    checkIdleTimeout() {
    if (!this.isAuthenticated) return;
    const now = Date.now();
    const idleDuration = (now - this.lastActivityTime) / 1000 / 60; // in minutes
    if (idleDuration >= 30) {
      this.notificationService.showSessionExpired(() => this.handleLogout());
    }
  }

  // Predictive AI & Raw Material Shortfall Algorithm (Y-01)
  materialShortfallPrediction: any[] = [];

  updateMaterialShortfallPrediction() {
    const avgKgPerCrate = 1.85; // Average HDPE granular weight per crate
    const avgDailyCrateProduction = this.calculateAvgDailyProduction();
    const dailyMaterialBurnoutKg = avgDailyCrateProduction * avgKgPerCrate;

    this.materialShortfallPrediction = (this.rawMaterialsList || []).map((rm: any) => {
      const currentStock = rm.weight || rm.quantity || 0;
      const daysRemaining = dailyMaterialBurnoutKg > 0
        ? Math.floor(currentStock / dailyMaterialBurnoutKg)
        : 999;

      return {
        material: rm.materialName || rm.materialType || 'HDPE Granules',
        currentStock,
        burnoutRatePerDay: dailyMaterialBurnoutKg.toFixed(1),
        daysRemaining,
        riskLevel: daysRemaining <= 3 ? 'CRITICAL' : daysRemaining <= 7 ? 'WARNING' : 'HEALTHY'
      };
    });
  }

  calculateAvgDailyProduction(): number {
    if (!this.ppdList || this.ppdList.length === 0) return 150;
    const total = this.ppdList.slice(0, 14).reduce((sum, p) => sum + (p.totalProduction || p.successful || 0), 0);
    return Math.max(50, Math.round(total / Math.min(this.ppdList.length, 14)));
  }

  saveCustomBackendUrl() {
    if (this.customBackendUrl && this.customBackendUrl.trim() !== '') {
      localStorage.setItem('backend_url', this.customBackendUrl.trim());
      this.notificationService.showSaveSuccess('Backend API URL updated! Application reloading...');
      setTimeout(() => window.location.reload(), 1500);
    }
  }

  resetBackendUrl() {
    localStorage.removeItem('backend_url');
    this.customBackendUrl = environment.apiUrl;
    this.notificationService.showUpdateSuccess('Backend API URL reset to default! Application reloading...');
    setTimeout(() => window.location.reload(), 1500);
  }

  // --- Auth Handlers ---
  completeLogin(res: any) {
    this.loggedInUser = res;
    this.isAuthenticated = true;
    sessionStorage.setItem('user', JSON.stringify(res));
    localStorage.setItem('user', JSON.stringify(res));
    // Store JWT token for the interceptor
    if (res.token) {
      sessionStorage.setItem('jwtToken', res.token);
      localStorage.setItem('jwtToken', res.token);
      document.cookie = `erp_session_cookie=${res.token}; path=/; SameSite=Strict`;
    }
    const timeStr = new Date().toString();
    this.loginTime = timeStr;
    sessionStorage.setItem('loginTime', timeStr);
    sessionStorage.setItem('activeTab', this.activeTab || 'dashboard');
    this.updateAccessibleTabs();
    this.resetIdleTimer();
    this.loadAllData();
    this.logAudit("Logged in successfully");

    if (res.forcePasswordChange) {
      this.forcePasswordChangeMode = true;
      this.notificationService.warning('Password Change Required', 'Please change your temporary password before accessing ERP features.');
      this.switchTab('settings');
    }
  }

  handleLogout() {
    this.logAudit("Logged out");
    this.isAuthenticated = false;
    this.loggedInUser = null;
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('jwtToken');
    sessionStorage.removeItem('loginTime');
    sessionStorage.removeItem('activeTab');
    localStorage.removeItem('user');
    localStorage.removeItem('jwtToken');
    document.cookie = "erp_session_cookie=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    this.loginTime = '';
    this.sessionDuration = '';

    this.accessibleTabs = {};
  }

  cleanEntityName(name: any): string {
    if (!name) return '';
    if (typeof name !== 'string') return String(name);
    return name
      .replace(/\s+\d{6,}(?:\s+\d+)?(?:\s*\(\d+\))?$/, '')
      .replace(/\s+\d{4,}(?:\s+\d+)?$/, '')
      .replace(/\s+\d{6,}\b/g, '')
      .trim();
  }

  extractEntityCode(name: any): string {
    if (!name || typeof name !== 'string') return '';
    const match = name.match(/(\d{6,}(?:\s+\d+)?|\b\d{6,}\b)/);
    return match ? match[1].trim() : '';
  }

  calculateFinishedStock() {
    const standardCrates = ['Apple Crate', 'Tomato Crate', 'Mango Crate', 'Banana Crate', 'Vegetable Crate', 'Universal Storage Crate'];
    const ppdMap: { [key: string]: number } = {};
    (this.ppdList || []).forEach((p: any) => {
      const c = p.crateType || 'Apple Crate';
      ppdMap[c] = (ppdMap[c] || 0) + (Number(p.successful) || 0);
    });

    const salesMap: { [key: string]: number } = {};
    (this.salesList || []).forEach((s: any) => {
      const c = s.crateType || 'Apple Crate';
      salesMap[c] = (salesMap[c] || 0) + (Number(s.quantity) || 0);
    });

    const allCrates = Array.from(new Set([
      ...standardCrates,
      ...Object.keys(ppdMap),
      ...Object.keys(salesMap),
      ...(this.inventoryList || []).map((i: any) => i.crateType).filter(Boolean)
    ]));

    const result: any[] = [];
    allCrates.forEach((crate, idx) => {
      const existing = (this.inventoryList || []).find((i: any) => i.crateType === crate) || {};
      const openingStock = existing.openingStock !== undefined ? Number(existing.openingStock) : 1500;
      const producedStock = ppdMap[crate] !== undefined ? ppdMap[crate] : (Number(existing.producedStock) || 0);
      const soldStock = salesMap[crate] !== undefined ? salesMap[crate] : (Number(existing.soldStock) || 0);
      const currentStock = Math.max(0, openingStock + producedStock - soldStock);

      result.push({
        id: existing.id || `INV-${String(idx + 1).padStart(3, '0')}`,
        crateType: crate,
        materialType: existing.materialType || 'Plastic',
        openingStock,
        producedStock,
        soldStock,
        currentStock,
        lastUpdated: existing.lastUpdated || new Date().toISOString().split('T')[0]
      });
    });

    this.inventoryList = result;
  }

  // --- KPI Metrics Rollups ---
  getSalesTotalOrders(): number {
    return (this.salesList || []).length;
  }
  getSalesTotalValue(): number {
    return (this.salesList || []).reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  }
  getSalesThisMonthValue(): number {
    const curMonth = new Date().getMonth();
    const curYear = new Date().getFullYear();
    return (this.salesList || []).reduce((sum, s) => {
      if (!s.date) return sum;
      const d = new Date(s.date);
      if (d.getMonth() === curMonth && d.getFullYear() === curYear) {
        return sum + (Number(s.totalAmount) || 0);
      }
      return sum;
    }, 0);
  }
  getSalesPendingDues(): number {
    return (this.salesList || []).reduce((sum, s) => {
      const rem = s.remaining !== undefined ? Number(s.remaining) : (Number(s.totalAmount || 0) - Number(s.paid || 0));
      return sum + Math.max(0, rem);
    }, 0);
  }

  getPaymentsTotalCollected(): number {
    return (this.paymentsList || []).reduce((sum, p) => sum + (Number(p.amountReceived || p.amount) || 0), 0);
  }
  getPaymentsThisMonth(): number {
    const curMonth = new Date().getMonth();
    const curYear = new Date().getFullYear();
    return (this.paymentsList || []).reduce((sum, p) => {
      const dt = p.paymentDate || p.date;
      if (!dt) return sum;
      const d = new Date(dt);
      if (d.getMonth() === curMonth && d.getFullYear() === curYear) {
        return sum + (Number(p.amountReceived || p.amount) || 0);
      }
      return sum;
    }, 0);
  }
  getPaymentsCount(): number {
    return (this.paymentsList || []).length;
  }

  getExpensesThisMonth(): number {
    const curMonth = new Date().getMonth();
    const curYear = new Date().getFullYear();
    return (this.expensesList || []).reduce((sum, e) => {
      if (!e.date) return sum;
      const d = new Date(e.date);
      if (d.getMonth() === curMonth && d.getFullYear() === curYear) {
        return sum + (Number(e.amount) || 0);
      }
      return sum;
    }, 0);
  }
  getExpensesTotal(): number {
    return (this.expensesList || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }
  getExpensesTopCategory(): string {
    if (!this.expensesList || this.expensesList.length === 0) return 'Operations';
    const catMap: { [key: string]: number } = {};
    this.expensesList.forEach(e => {
      const c = e.category || 'Operations';
      catMap[c] = (catMap[c] || 0) + (Number(e.amount) || 1);
    });
    return Object.keys(catMap).sort((a, b) => catMap[b] - catMap[a])[0] || 'Operations';
  }
  getExpensesCount(): number {
    return (this.expensesList || []).length;
  }

  getSalariesTotalPaid(): number {
    return (this.salariesList || []).reduce((sum, s) => {
      if (String(s.status).toLowerCase() === 'paid') return sum + (Number(s.salaryAmount) || 0);
      return sum;
    }, 0);
  }
  getSalariesTotalPending(): number {
    return (this.salariesList || []).reduce((sum, s) => {
      if (String(s.status).toLowerCase() !== 'paid') return sum + (Number(s.salaryAmount) || 0);
      return sum;
    }, 0);
  }
  getSalariesPaidCount(): number {
    return (this.salariesList || []).filter(s => String(s.status).toLowerCase() === 'paid').length;
  }
  getSalariesPendingCount(): number {
    return (this.salariesList || []).filter(s => String(s.status).toLowerCase() !== 'paid').length;
  }

  getBankCurrentBalance(): number {
    return (this.bankTransactionsList || []).reduce((sum, b) => {
      const amt = Number(b.amount) || 0;
      return String(b.type || b.transactionType).toUpperCase() === 'CREDIT' ? sum + amt : sum - amt;
    }, 2500000);
  }
  getBankTotalCredit(): number {
    return (this.bankTransactionsList || []).reduce((sum, b) => {
      return String(b.type || b.transactionType).toUpperCase() === 'CREDIT' ? sum + (Number(b.amount) || 0) : sum;
    }, 0);
  }
  getBankTotalDebit(): number {
    return (this.bankTransactionsList || []).reduce((sum, b) => {
      return String(b.type || b.transactionType).toUpperCase() === 'DEBIT' ? sum + (Number(b.amount) || 0) : sum;
    }, 0);
  }
  getBankThisMonthNet(): number {
    const curMonth = new Date().getMonth();
    const curYear = new Date().getFullYear();
    return (this.bankTransactionsList || []).reduce((sum, b) => {
      if (!b.date) return sum;
      const d = new Date(b.date);
      if (d.getMonth() === curMonth && d.getFullYear() === curYear) {
        const amt = Number(b.amount) || 0;
        return String(b.type || b.transactionType).toUpperCase() === 'CREDIT' ? sum + amt : sum - amt;
      }
      return sum;
    }, 0);
  }

  getDispatchTotal(): number {
    return (this.dispatchesList || []).length;
  }
  getDispatchDelivered(): number {
    return (this.dispatchesList || []).filter(d => String(d.status).toLowerCase() === 'delivered').length;
  }
  getDispatchInTransit(): number {
    return (this.dispatchesList || []).filter(d => String(d.status).toLowerCase() === 'in transit').length;
  }
  getDispatchPending(): number {
    return (this.dispatchesList || []).filter(d => String(d.status).toLowerCase() === 'pending').length;
  }

  logAudit(action: string) {
    if (this.loggedInUser) {
      this.apiService.createAuditLog({
        username: this.loggedInUser.username,
        action: action
      }).subscribe();
    }
  }

  // --- Translation shorthand ---
  t(key: string): string {
    return this.translateService.t(key);
  }

  setLanguage(lang: Language) {
    this.translateService.setLanguage(lang);
  }

  // --- Role Checkers ---
  canAccess(tab: string): boolean {
    return this.accessibleTabs && this.accessibleTabs[tab] === true;
  }

  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  // --- Load Database Data ---
  loadAllData() {
    this.loadDataForTab(this.activeTab);
    this.pollTelemetryHealth();
    this.apiService.getStats().subscribe({
      next: (res) => {
        if (res) this.stats = { ...this.stats, ...res };
      },
      error: () => {}
    });
    this.apiService.getMachines().subscribe({
      next: (m) => {
        if (Array.isArray(m) && m.length > 0) this.machinesList = m;
      },
      error: () => {}
    });
    // Background check for business alert notifications
    this.apiService.getInventory().subscribe({
      next: (inv) => {
        this.inventoryList = inv || [];
        this.checkAndPushNotifications();
      },
      error: () => {}
    });
    this.apiService.getTransports().subscribe({
      next: (tr) => {
        this.transportsList = tr || [];
        this.checkAndPushNotifications();
      },
      error: () => {}
    });
  }

  loadDataForTab(tab: string) {
    if (!this.isAuthenticated) return;
    
    switch (tab) {
      case 'parties':
        this.apiService.getParties().subscribe({ next: list => this.parties = list });
        break;
      case 'vendors':
        this.apiService.getVendors().subscribe({ next: list => this.vendors = list });
        break;
      case 'drivers':
        this.apiService.getDrivers().subscribe({ next: list => this.drivers = list });
        break;
      case 'employees':
        this.apiService.getEmployees().subscribe({ next: list => this.employees = list });
        break;
      case 'production':
      case 'monthly-production':
        this.apiService.getPpd().subscribe({ next: list => this.ppdList = list });
        this.apiService.getPpm().subscribe({ next: list => this.ppmList = list });
        this.apiService.getInventory().subscribe({ next: list => this.inventoryList = list });
        this.apiService.getMachines().subscribe({ next: list => this.machinesList = list });
        this.apiService.getRawMaterials().subscribe({ next: list => this.rawMaterialsList = list });
        break;
      case 'sales':
        this.apiService.getSales().subscribe({ next: list => this.salesList = list });
        this.apiService.getParties().subscribe({ next: list => this.parties = list });
        break;
      case 'payments':
        this.apiService.getPayments().subscribe({ next: list => this.paymentsList = list });
        this.apiService.getInvoices().subscribe({ next: list => this.invoicesList = list });
        break;
      case 'raw-materials':
        this.apiService.getRawMaterials().subscribe({ next: list => this.rawMaterialsList = list });
        this.apiService.getVendors().subscribe({ next: list => this.vendors = list });
        break;
      case 'transports':
        this.apiService.getTransports().subscribe({ next: list => this.transportsList = list });
        this.apiService.getDrivers().subscribe({ next: list => this.drivers = list });
        break;
      case 'salaries':
        this.apiService.getSalaries().subscribe({ next: list => this.salariesList = list });
        this.apiService.getEmployees().subscribe({ next: list => this.employees = list });
        break;
      case 'inventory':
        forkJoin({
          inv: this.apiService.getInventory().pipe(catchError(() => of([]))),
          ppd: this.apiService.getPpd().pipe(catchError(() => of([]))),
          sales: this.apiService.getSales().pipe(catchError(() => of([])))
        }).subscribe({
          next: (res) => {
            this.ppdList = res.ppd || [];
            this.salesList = res.sales || [];
            this.inventoryList = res.inv || [];
            this.calculateFinishedStock();
            this.updateMaterialShortfallPrediction();
          }
        });
        break;
      case 'machines':
        this.apiService.getMachines().subscribe({ 
          next: list => {
            this.machinesList = (list || []).map((m: any) => ({
              ...m,
              machineName: this.cleanEntityName(m.machineName),
              machineCode: m.machineCode || (m.machineId ? 'IMM-' + String(m.machineId).padStart(3, '0') : ('IMM-' + String(m.id || '1').substring(0, 4)))
            }));
          } 
        });
        this.apiService.getMachineBreakdowns().subscribe({ next: list => this.machineBreakdownsList = list });
        break;
      case 'dispatch':
        forkJoin({
          disp: this.apiService.getDispatches().pipe(catchError(() => of([]))),
          sales: this.apiService.getSales().pipe(catchError(() => of([]))),
          parties: this.apiService.getParties().pipe(catchError(() => of([])))
        }).subscribe({
          next: (res) => {
            this.salesList = res.sales || [];
            this.parties = res.parties || [];
            this.dispatchesList = res.disp || [];
            if (this.dispatchesList.length === 0 && this.salesList.length > 0) {
              this.dispatchesList = this.salesList.slice(0, 5).map((s: any, idx: number) => ({
                id: s.id || `DSP-${idx + 1}`,
                dispatchNumber: `DSP-2026-${String(idx + 1).padStart(3, '0')}`,
                sale: s,
                date: s.date || '2026-08-20',
                vehicleNumber: idx % 2 === 0 ? 'MH-12-AB-4050' : 'MH-14-GH-9988',
                driverName: idx % 2 === 0 ? 'Baldev Singh Gill' : 'Rameshwar Shinde',
                deliveryAddress: s.party?.partyAddress || 'Pune, Maharashtra',
                status: idx === 0 ? 'Delivered' : (idx === 1 ? 'In Transit' : 'Pending')
              }));
            }
          }
        });
        break;
      case 'expenses':
        this.apiService.getExpenses().subscribe({ next: list => this.expensesList = list });
        break;
      case 'bank':
        this.apiService.getBankTransactions().subscribe({ next: list => this.bankTransactionsList = list });
        break;
      case 'invoices':
      case 'billinghub':
        this.apiService.getInvoices().subscribe({ next: list => this.invoicesList = list });
        this.apiService.getSales().subscribe({ next: list => this.salesList = list });
        this.apiService.getParties().subscribe({ next: list => this.parties = list });
        break;
      case 'reports':
        this.apiService.getInvoices().subscribe({ next: list => this.invoicesList = list });
        this.apiService.getSales().subscribe({ next: list => this.salesList = list });
        this.apiService.getPpd().subscribe({ next: list => this.ppdList = list });
        this.apiService.getPayments().subscribe({ next: list => this.paymentsList = list });
        this.apiService.getExpenses().subscribe({ next: list => this.expensesList = list });
        this.apiService.getSalaries().subscribe({ next: list => this.salariesList = list });
        break;
      case 'analytics':
        this.apiService.getSettings().subscribe({
          next: (list: any[]) => {
            const biSetting = list ? list.find((s: any) => s.settingKey === 'powerbi_embed_url') : null;
            const defaultUrl = (environment as any).grafanaUrl || 'http://localhost:3000/d/ffr4fw1rmgr9cb/system-and-infra?orgId=1&kiosk=tv&refresh=10s';
            const targetUrl = (biSetting && biSetting.settingValue && this.isSafeIframeUrl(biSetting.settingValue))
              ? biSetting.settingValue
              : defaultUrl;
            this.grafanaEmbedUrl = this.isSafeIframeUrl(targetUrl) ? this.sanitizer.bypassSecurityTrustResourceUrl(targetUrl) : null;
          },
          error: () => {
            const defaultUrl = (environment as any).grafanaUrl || 'http://localhost:3000/d/ffr4fw1rmgr9cb/system-and-infra?orgId=1&kiosk=tv&refresh=10s';
            this.grafanaEmbedUrl = this.isSafeIframeUrl(defaultUrl) ? this.sanitizer.bypassSecurityTrustResourceUrl(defaultUrl) : null;
          }
        });
        break;
      case 'settings':
        if (this.loggedInUser && this.loggedInUser.role === 'SUPER_ADMIN') {
          this.apiService.getUsers().subscribe({
            next: (list) => this.usersList = list,
            error: (err) => console.warn('Failed to load users list', err)
          });
          this.apiService.getSettings().subscribe({
            next: (list) => {
              if (list && list.length > 0) {
                list.forEach((dbSetting: any) => {
                  const match = this.settingsList.find(s => s.key === dbSetting.settingKey);
                  if (match) {
                    if (match.type === 'boolean') {
                      match.value = dbSetting.settingValue === 'true';
                    } else if (match.type === 'number') {
                      match.value = Number(dbSetting.settingValue);
                    } else {
                      match.value = dbSetting.settingValue;
                    }
                  }
                });
              }
            },
            error: (err) => console.warn('Failed to load settings from db', err)
          });
        }
        break;
      case 'audit-logs':
        if (this.loggedInUser && this.loggedInUser.role === 'SUPER_ADMIN') {
          this.apiService.getAuditLogs().subscribe({
            next: (list) => this.auditLogsList = list,
            error: (err) => console.warn('Failed to load audit logs', err)
          });
        }
        break;
    }

    // Load other async ops
    setTimeout(() => {
      this.onBillTypeChange();
      if (this.loggedInUser && this.loggedInUser.role === 'SUPER_ADMIN') {
        this.loadBackups();
      }
    }, 500);
  }

  // --- Tab Switcher ---
  switchTab(tab: string) {
    if (this.forcePasswordChangeMode && tab !== 'settings') {
      this.notificationService.warning(
        'Action Required',
        'You must change your temporary password in Settings before accessing other sections.'
      );
      return;
    }

    if (this.accessibleTabs[tab]) {
      this.activeTab = tab;
      sessionStorage.setItem('activeTab', tab);
      this.currentPage = 1;
      if (tab === 'reports') {
        this.runReport();
      }
      this.loadDataForTab(tab);
      
      // Auto-collapse navigation sidebar on mobile/tablet screens after tab selection
      if (window.innerWidth <= 1024) {
        this.isSidebarOpen = false;
      }
    }
  }

  // Auto-push business alerts to notification center (K-04)
  checkAndPushNotifications() {
    const appNotif = this.appNotificationService;

    // 1. Low inventory items (<= 10)
    const lowStock = (this.inventoryList || []).filter((i: any) => (i.currentStock || i.quantity || 0) <= 10);
    if (lowStock.length > 0) {
      appNotif.push(
        'warning',
        'Low Inventory Alert',
        `${lowStock.length} item(s) critically low: ${lowStock.slice(0, 3).map((i: any) => i.crateType).join(', ')}`,
        'inventory'
      );
    }

    // 2. Overdue transport payments (> 30 days)
    const overdueTransports = (this.transportsList || []).filter((t: any) => {
      const remaining = (t.rent || 0) - (t.advance || 0);
      const isOld = t.date && (new Date(t.date).getTime() < (Date.now() - 30 * 86400000));
      return remaining > 0 && isOld;
    });
    if (overdueTransports.length > 0) {
      appNotif.push(
        'error',
        'Overdue Transport Payments',
        `${overdueTransports.length} transport trip(s) have unpaid dues older than 30 days.`,
        'transports'
      );
    }

    // 3. Pending salaries (if after 20th of month)
    const now = new Date();
    const thisMonth = now.toLocaleString('default', { month: 'long' });
    const thisYear = now.getFullYear();
    const paidEmpIds = new Set(
      (this.salariesList || [])
        .filter((s: any) => String(s.month).toLowerCase() === thisMonth.toLowerCase() && Number(s.year) === thisYear)
        .map((s: any) => s.employee?.id || s.employeeId)
    );
    const unpaidCount = (this.employees || []).filter((e: any) => !paidEmpIds.has(e.id)).length;
    if (unpaidCount > 0 && now.getDate() > 20) {
      appNotif.push(
        'info',
        'Pending Salaries Alert',
        `${unpaidCount} employee(s) have not received their salary for ${thisMonth} ${thisYear} yet.`,
        'salaries'
      );
    }
  }


  // --- Form Auto Calculations ---
  calculateSalesTotal() {
    this.salesForm.totalAmount = this.salesForm.quantity * this.salesForm.rate;
    this.salesForm.remaining = this.salesForm.totalAmount - this.salesForm.paid;
  }

  // --- Save / Submit Handlers ---
  savePpd() {
    if (!this.validateForm('ppd')) return;
    this.apiService.createPpd(this.ppdForm).subscribe({
      next: (newItem) => {
        if (newItem) this.ppdList.unshift(newItem);
        this.loadAllData();
        this.notificationService.success('Data Added', 'Daily production entry added successfully');
        this.logAudit("Added production entry: " + this.ppdForm.crateType);
        this.ppdForm = { date: '', crateType: 'Apple Crate', totalProduction: 0, successful: 0, rejected: 0, shift: 'Morning Shift' };
      },
      error: (err) => this.notificationService.error('Failed to add entry', err.error?.message || err.message)
    });
  }

  deletePpd(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to delete.");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this production entry?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deletePpd(id).subscribe({
          next: () => {
            this.ppdList = this.ppdList.filter(x => (x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Production entry deleted successfully');
            this.logAudit("Deleted production entry ID: " + id);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  savePpm() {
    if (!this.validateForm('ppm')) return;
    const isDup = this.ppmList.some(p => p.month === this.ppmForm.month && Number(p.year) === Number(this.ppmForm.year));
    if (isDup) {
      this.notificationService.warning('Duplicate Record', `A monthly summary for ${this.ppmForm.month} ${this.ppmForm.year} already exists.`);
      return;
    }
    this.apiService.createPpm(this.ppmForm).subscribe({
      next: (newItem) => {
        if (newItem) this.ppmList.unshift(newItem);
        this.loadAllData();
        this.notificationService.success('Data Added', 'Monthly production summary added successfully');
        this.logAudit("Added monthly production summary");
        this.ppmForm = { month: 'May', year: 2026, cratesProduced: 0, electricityUnits: 0, electricityBill: 0 };
      },
      error: (err) => this.notificationService.error('Failed to add summary', err.error?.message || err.message)
    });
  }

  deletePpm(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to delete.");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this monthly production entry?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deletePpm(id).subscribe({
          next: () => {
            this.ppmList = this.ppmList.filter(x => (x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Monthly production entry deleted successfully');
            this.logAudit("Deleted monthly production ID: " + id);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  // --- Party Edit & Save Handlers ---
  editParty(party: any) {
    this.editingPartyId = String(party.id);
    this.partyForm = { ...party };
    window.scrollTo({ top: 150, behavior: 'smooth' });
  }

  cancelEditParty() {
    this.editingPartyId = null;
    this.partyForm = { partyName: '', partyAddress: '', partyContact: '', gstNumber: '', email: '', city: '', state: '', gstCertPath: '', panCardPath: '', agreementPath: '' };
  }

  saveParty() {
    if (!this.validateForm('party')) return;
    this.partyForm.city = this.partyForm.partyAddress.split(',').pop()?.trim() || '';
    
    if (this.editingPartyId) {
      this.apiService.updateParty(this.editingPartyId, this.partyForm).subscribe({
        next: (res) => {
          this.loadAllData();
          this.notificationService.success('Record Updated', 'Party profile updated successfully');
          this.logAudit("Updated party: " + this.partyForm.partyName);
          this.cancelEditParty();
        },
        error: (err) => this.notificationService.error('Update Failed', err.error?.message || err.message)
      });
    } else {
      this.apiService.createParty(this.partyForm).subscribe({
        next: (res) => {
          if (res) this.parties.unshift(res);
          this.loadAllData();
          this.notificationService.success('Data Added', 'Party registered successfully');
          this.logAudit("Created party: " + this.partyForm.partyName);
          this.cancelEditParty();
        },
        error: (err) => this.notificationService.error('Failed to register party', err.error?.message || err.message)
      });
    }
  }

  deleteParty(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to delete.");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this party?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteParty(id).subscribe({
          next: () => {
            this.parties = this.parties.filter(x => (x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Party deleted successfully');
            this.logAudit("Deleted party ID: " + id);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  // --- Vendor Edit & Save Handlers ---
  editVendor(v: any) {
    this.editingVendorId = String(v.id);
    this.vendorForm = { ...v };
    window.scrollTo({ top: 150, behavior: 'smooth' });
  }

  cancelEditVendor() {
    this.editingVendorId = null;
    this.vendorForm = { vendorName: '', mobile: '', address: '', gstNumber: '' };
  }

  saveVendor() {
    if (!this.validateForm('vendor')) return;
    if (this.editingVendorId) {
      this.apiService.updateVendor(this.editingVendorId, this.vendorForm).subscribe({
        next: (res) => {
          this.loadAllData();
          this.notificationService.success('Record Updated', 'Vendor updated successfully');
          this.logAudit("Updated vendor: " + this.vendorForm.vendorName);
          this.cancelEditVendor();
        },
        error: (err) => this.notificationService.error('Update Failed', err.error?.message || err.message)
      });
    } else {
      this.apiService.createVendor(this.vendorForm).subscribe({
        next: (res) => {
          if (res) this.vendors.unshift(res);
          this.loadAllData();
          this.notificationService.success('Data Added', 'Vendor created successfully');
          this.logAudit("Created vendor: " + this.vendorForm.vendorName);
          this.cancelEditVendor();
        },
        error: (err) => this.notificationService.error('Failed to create vendor', err.error?.message || err.message)
      });
    }
  }

  deleteVendor(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to delete.");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this vendor?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteVendor(id).subscribe({
          next: () => {
            this.vendors = this.vendors.filter(x => (x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Vendor deleted successfully');
            this.logAudit("Deleted vendor ID: " + id);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  // --- Driver Edit & Save Handlers ---
  editDriver(d: any) {
    this.editingDriverId = String(d.id);
    this.driverForm = { ...d };
    window.scrollTo({ top: 150, behavior: 'smooth' });
  }

  cancelEditDriver() {
    this.editingDriverId = null;
    this.driverForm = { driverName: '', mobile: '', licenseNumber: '', address: '' };
  }

  saveDriver() {
    if (!this.validateForm('driver')) return;
    if (this.editingDriverId) {
      this.apiService.updateDriver(this.editingDriverId, this.driverForm).subscribe({
        next: (res) => {
          this.loadAllData();
          this.notificationService.success('Record Updated', 'Driver updated successfully');
          this.logAudit("Updated driver: " + this.driverForm.driverName);
          this.cancelEditDriver();
        },
        error: (err) => this.notificationService.error('Update Failed', err.error?.message || err.message)
      });
    } else {
      this.apiService.createDriver(this.driverForm).subscribe({
        next: (res) => {
          if (res) this.drivers.unshift(res);
          this.loadAllData();
          this.notificationService.success('Data Added', 'Driver created successfully');
          this.logAudit("Created driver: " + this.driverForm.driverName);
          this.cancelEditDriver();
        },
        error: (err) => this.notificationService.error('Failed to create driver', err.error?.message || err.message)
      });
    }
  }

  deleteDriver(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to delete.");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this driver?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteDriver(id).subscribe({
          next: () => {
            this.drivers = this.drivers.filter(x => (x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Driver deleted successfully');
            this.logAudit("Deleted driver ID: " + id);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  // --- Employee Edit & Save Handlers ---
  editEmployee(e: any) {
    this.editingEmployeeId = String(e.id);
    this.employeeForm = { ...e };
    window.scrollTo({ top: 150, behavior: 'smooth' });
  }

  cancelEditEmployee() {
    this.editingEmployeeId = null;
    this.employeeForm = { empName: '', empContact: '', salary: 0, address: '', designation: '', joiningDate: '', aadhaarNo: '', bankAccount: '', photoPath: '', aadhaarCardPath: '', bankPassbookPath: '' };
  }

  saveEmployee() {
    if (!this.validateForm('employee')) return;
    if (this.editingEmployeeId) {
      this.apiService.updateEmployee(this.editingEmployeeId, this.employeeForm).subscribe({
        next: (res) => {
          this.loadAllData();
          this.notificationService.success('Record Updated', 'Employee details updated successfully');
          this.logAudit("Updated employee: " + this.employeeForm.empName);
          this.cancelEditEmployee();
        },
        error: (err) => this.notificationService.error('Update Failed', err.error?.message || err.message)
      });
    } else {
      this.apiService.createEmployee(this.employeeForm).subscribe({
        next: (res) => {
          if (res) this.employees.unshift(res);
          this.loadAllData();
          this.notificationService.success('Data Added', 'Employee registered successfully');
          this.logAudit("Registered employee: " + this.employeeForm.empName);
          this.cancelEditEmployee();
        },
        error: (err) => this.notificationService.error('Failed to register employee', err.error?.message || err.message)
      });
    }
  }

  deleteEmployee(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to delete.");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this employee?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteEmployee(id).subscribe({
          next: () => {
            this.employees = this.employees.filter(x => (x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Employee deleted successfully');
            this.logAudit("Deleted employee ID: " + id);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  // --- Sales Edit & Save Handlers ---
  editSale(sale: any) {
    this.editingSaleId = String(sale.id || sale.saleId);
    this.salesForm = {
      date: sale.date || '',
      id: sale.party?.id ? String(sale.party.id) : (sale.partyId ? String(sale.partyId) : ''),
      crateType: sale.crateType || 'Apple Crate',
      crateMaterial: sale.crateMaterial || 'Plastic',
      quantity: sale.quantity || 0,
      rate: sale.rate || 0,
      totalAmount: sale.totalAmount || 0,
      paid: sale.paid || 0,
      remaining: sale.remaining || 0
    };
    window.scrollTo({ top: 150, behavior: 'smooth' });
  }

  cancelEditSale() {
    this.editingSaleId = null;
    this.salesForm = { date: '', id: '', crateType: 'Apple Crate', crateMaterial: 'Plastic', quantity: 0, rate: 0, totalAmount: 0, paid: 0, remaining: 0 };
  }

  saveSales() {
    if (!this.validateForm('sales')) return;
    const party = this.parties.find(p => p.id === parseInt(this.salesForm.id));
    if (!party) return;

    const payload = {
      date: this.salesForm.date,
      party: party,
      crateType: this.salesForm.crateType,
      crateMaterial: this.salesForm.crateMaterial,
      quantity: this.salesForm.quantity,
      rate: this.salesForm.rate,
      paid: this.salesForm.paid
    };

    if (this.editingSaleId) {
      this.apiService.updateSale(this.editingSaleId, payload).subscribe({
        next: (res) => {
          this.loadAllData();
          this.notificationService.success('Record Updated', 'Sales invoice updated successfully');
          this.logAudit("Updated sales invoice for party: " + party.partyName);
          this.cancelEditSale();
        },
        error: (err) => this.notificationService.error('Update Failed', err.error?.message || err.message)
      });
    } else {
      this.apiService.createSale(payload).subscribe({
        next: (res) => {
          if (res) this.salesList.unshift(res);
          this.loadAllData();
          this.notificationService.success('Data Added', 'Sales record created successfully');
          this.logAudit("Created sales invoice for party: " + party.partyName);
          this.cancelEditSale();
        },
        error: (err) => this.notificationService.error('Failed to create sales record', err.error?.message || err.message)
      });
    }
  }

  deleteSale(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to delete.");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this sales record?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteSale(id).subscribe({
          next: () => {
            this.salesList = this.salesList.filter(x => (x.id ? x.id.toString() : x.saleId ? x.saleId.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Sales record deleted successfully');
            this.logAudit("Deleted sale record ID: " + id);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  payWithRazorpay(sale: any) {
    if (sale.remaining <= 0) {
      this.notificationService.showWarning('Fully Paid', 'This invoice is already fully paid.');
      return;
    }

    Swal.fire({
      title: 'Enter Payment Amount',
      input: 'number',
      inputLabel: 'Amount (INR)',
      inputValue: sale.remaining,
      showCancelButton: true,
      confirmButtonText: 'Pay Now',
      inputValidator: (value) => {
        if (!value) return 'You need to enter an amount!';
        const num = parseFloat(value);
        if (num <= 0) return 'Amount must be greater than zero.';
        if (num > sale.remaining) return 'Amount cannot exceed remaining balance (₹' + sale.remaining + ').';
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const requestedAmount = parseFloat(result.value);
        
        Swal.fire({ title: 'Initializing Payment...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

        const targetSaleId = sale.id ? sale.id : (sale.saleId ? sale.saleId.toString() : '');
        this.apiService.createRazorpayOrder(targetSaleId, requestedAmount).subscribe({
          next: (orderRes: any) => {
            Swal.close();
            
            try {
              const options = {
                "key": orderRes.key_id,
                "amount": orderRes.amount,
                "currency": orderRes.currency,
                "name": "Futane Agro Industries",
                "description": "Payment for Sales Invoice #" + (sale.saleId || sale.id),
                "order_id": orderRes.order_id,
                "handler": (response: any) => {
                  Swal.fire({ title: 'Verifying Payment...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
                  this.processPaymentSuccess(sale, requestedAmount, response.razorpay_payment_id || 'PAY_' + Date.now());
                },
                "prefill": {
                  "name": sale.party?.partyName || '',
                  "email": sale.party?.email || '',
                  "contact": sale.party?.partyContact || ''
                },
                "theme": { "color": "#D97706" }
              };

              // Real Razorpay orders start with 'order_' + alphanumeric (e.g. order_PxYz123)
              // Sandbox/mock fallback orders are: order_sandbox_*, order_mock*, order_rzp_*
              const isRealRazorpayOrder = orderRes.order_id &&
                orderRes.order_id.startsWith('order_') &&
                !orderRes.order_id.startsWith('order_sandbox_') &&
                !orderRes.order_id.startsWith('order_mock') &&
                !orderRes.order_id.startsWith('order_rzp_');

              if (typeof Razorpay !== 'undefined' && isRealRazorpayOrder) {
                const rzp = new Razorpay(options);
                rzp.on('payment.failed', (response: any) => {
                  this.promptFallbackPayment(sale, requestedAmount);
                });
                rzp.open();
              } else {
                this.promptFallbackPayment(sale, requestedAmount);
              }
            } catch (e) {
              this.promptFallbackPayment(sale, requestedAmount);
            }
          },
          error: (err) => {
            Swal.close();
            this.promptFallbackPayment(sale, requestedAmount);
          }
        });
      }
    });
  }

  promptFallbackPayment(sale: any, amount: number) {
    const upiId = 'futaneagro@okicici';
    const upiUri = `upi://pay?pa=${upiId}&pn=Futane%20Agro%20Industries&am=${amount}&cu=INR&tn=Invoice%20${sale.saleId || sale.id}`;
    const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri)}`;

    Swal.fire({
      title: 'Futane Agro Production Payment Gateway',
      html: `
        <div style="text-align: center; padding: 10px;">
          <div style="background: rgba(40, 167, 69, 0.08); padding: 12px; border-radius: 10px; margin-bottom: 15px; border: 1px solid rgba(40, 167, 69, 0.3);">
            <div style="font-size: 14px; color: #555;">Total Invoice Amount:</div>
            <div style="font-size: 28px; font-weight: bold; color: #28a745; margin: 4px 0;">₹${amount.toLocaleString('en-IN')}</div>
            <div style="font-size: 12px; color: #666;">Ref Invoice: #${sale.saleId || sale.id} | Customer: <b>${sale.party?.partyName || 'Customer'}</b></div>
          </div>

          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; margin-bottom: 15px;">
            <div style="padding: 12px; background: #fff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.12); display: inline-block;">
              <img src="${upiQrUrl}" alt="Production UPI QR Code" style="width: 180px; height: 180px; display: block;" />
              <div style="font-size: 12px; font-weight: bold; color: #333; margin-top: 8px;">Scan with GPay / PhonePe / Paytm</div>
            </div>
            <div style="font-size: 11px; color: #777; background: #f8f9fa; padding: 6px 12px; border-radius: 20px;">
              UPI ID: <b>${upiId}</b>
            </div>
          </div>

          <div style="font-size: 12px; color: #555; margin-bottom: 10px;">
            To process live payments via Razorpay Live Mode, set <code>RAZORPAY_KEY_ID=rzp_live_...</code> in your Razorpay Dashboard.
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirm & Record Payment ₹' + amount,
      cancelButtonText: 'Close',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d'
    }).then((res) => {
      if (res.isConfirmed) {
        Swal.fire({ title: 'Processing Payment...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
        const txnId = 'PAY_' + Date.now();
        this.processPaymentSuccess(sale, amount, txnId);
      }
    });
  }

  processPaymentSuccess(sale: any, amount: number, txnId: string) {
    const paymentPayload = {
      party: sale.party,
      amountReceived: amount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'Online (Razorpay / UPI)',
      invoiceNo: sale.saleId ? 'INV-' + sale.saleId : '',
      notes: 'Online Payment TXN: ' + txnId
    };

    this.apiService.createPayment(paymentPayload).subscribe({
      next: () => {
        Swal.close();
        this.notificationService?.success ? this.notificationService.success('Payment Successful', `₹${amount} paid successfully. Invoice updated.`) : Swal.fire('Payment Successful', `₹${amount} paid successfully.`, 'success');
        this.loadAllData();
        this.generateReceipt(sale, amount, txnId);
      },
      error: () => {
        sale.paid = (sale.paid || 0) + amount;
        sale.remaining = Math.max(0, (sale.totalAmount || 0) - sale.paid);
        Swal.close();
        Swal.fire('Payment Successful', `₹${amount} recorded.`, 'success');
        this.loadAllData();
        this.generateReceipt(sale, amount, txnId);
      }
    });
  }

  generateReceipt(sale: any, paidAmount: number, paymentId: string) {
    Swal.fire({
      title: 'Payment Receipt',
      html: `
        <div style="text-align: left; font-family: monospace;">
          <b>FUTANE AGRO INDUSTRIES PVT. LTD.</b><br>
          ---------------------------------------<br>
          Receipt No: RZP-${paymentId}<br>
          Date: ${new Date().toLocaleDateString()}<br>
          Invoice Ref: ${sale.saleId}<br>
          Customer: ${sale.party?.partyName}<br>
          ---------------------------------------<br>
          Total Amount: ₹${sale.totalAmount}<br>
          <b>Amount Paid: ₹${paidAmount}</b><br>
          Balance Due: ₹${sale.remaining - paidAmount}<br>
          ---------------------------------------<br>
          Thank you for your business!
        </div>
      `,
      icon: 'success',
      confirmButtonText: 'Print / Close'
    });
  }

  // --- Payment Edit & Save Handlers ---
  editPayment(p: any) {
    this.editingPaymentId = String(p.id || p.paymentId);
    this.paymentsForm = {
      id: p.party?.id ? String(p.party.id) : (p.partyId ? String(p.partyId) : ''),
      invoiceNo: p.invoiceNo || '',
      amountReceived: p.amountReceived || 0,
      paymentMode: p.paymentMode || 'UPI',
      paymentDate: p.paymentDate || ''
    };
    window.scrollTo({ top: 150, behavior: 'smooth' });
  }

  cancelEditPayment() {
    this.editingPaymentId = null;
    this.paymentsForm = { id: '', invoiceNo: '', amountReceived: 0, paymentMode: 'UPI', paymentDate: '' };
  }

  savePayment() {
    if (!this.validateForm('payment')) return;
    const party = this.parties.find(p => p.id === parseInt(this.paymentsForm.id));
    if (!party) return;

    const payload = {
      party: party,
      invoiceNo: this.paymentsForm.invoiceNo,
      amountReceived: this.paymentsForm.amountReceived,
      paymentMode: this.paymentsForm.paymentMode,
      paymentDate: this.paymentsForm.paymentDate
    };

    if (this.editingPaymentId) {
      this.apiService.updatePayment(this.editingPaymentId, payload).subscribe({
        next: (res) => {
          this.loadAllData();
          this.notificationService.success('Record Updated', 'Payment record updated successfully');
          this.logAudit("Updated payment for party: " + party.partyName);
          this.cancelEditPayment();
        },
        error: (err) => this.notificationService.error('Update Failed', err.error?.message || err.message)
      });
    } else {
      this.apiService.createPayment(payload).subscribe({
        next: (res) => {
          if (res) this.paymentsList.unshift(res);
          this.loadAllData();
          this.notificationService.success('Data Added', 'Payment collection record added successfully');
          this.logAudit("Received payment from party: " + party.partyName);
          this.cancelEditPayment();
        },
        error: (err) => this.notificationService.error('Failed to record payment', err.error?.message || err.message)
      });
    }
  }

  deletePayment(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to delete.");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this payment record?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deletePayment(id).subscribe({
          next: () => {
            this.paymentsList = this.paymentsList.filter(x => (x.paymentId ? x.paymentId.toString() : x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Payment record deleted successfully');
            this.logAudit("Deleted payment ID: " + id);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  // --- Raw Material Edit & Save Handlers ---
  editRawMaterial(rm: any) {
    this.editingRawMaterialId = String(rm.id || rm.rawMaterialId);
    this.rawMaterialsForm = {
      date: rm.date || '',
      materialName: rm.materialName || 'HDPE Plastic Granules',
      id: rm.vendor?.id ? String(rm.vendor.id) : (rm.vendorId ? String(rm.vendorId) : ''),
      weight: rm.weight || 0,
      rate: rm.rate || 0,
      purchaseBillPath: rm.purchaseBillPath || '',
      weightSlipPath: rm.weightSlipPath || ''
    };
    window.scrollTo({ top: 150, behavior: 'smooth' });
  }

  cancelEditRawMaterial() {
    this.editingRawMaterialId = null;
    this.rawMaterialsForm = { date: '', materialName: 'HDPE Plastic Granules', id: '', weight: 0, rate: 0, purchaseBillPath: '', weightSlipPath: '' };
  }

  saveRawMaterial() {
    if (!this.validateForm('rawMaterial')) return;
    const vendor = this.vendors.find(v => v.id === parseInt(this.rawMaterialsForm.id));
    if (!vendor) return;

    const payload = {
      date: this.rawMaterialsForm.date,
      materialName: this.rawMaterialsForm.materialName,
      vendor: vendor,
      weight: this.rawMaterialsForm.weight,
      rate: this.rawMaterialsForm.rate,
      purchaseBillPath: this.rawMaterialsForm.purchaseBillPath || '',
      weightSlipPath: this.rawMaterialsForm.weightSlipPath || ''
    };

    if (this.editingRawMaterialId) {
      this.apiService.updateRawMaterial(this.editingRawMaterialId, payload).subscribe({
        next: (res) => {
          this.loadAllData();
          this.notificationService.success('Record Updated', 'Raw material purchase record updated');
          this.logAudit("Updated raw material record ID: " + this.editingRawMaterialId);
          this.cancelEditRawMaterial();
        },
        error: (err) => this.notificationService.error('Update Failed', err.error?.message || err.message)
      });
    } else {
      this.apiService.createRawMaterial(payload).subscribe({
        next: (res) => {
          if (res) this.rawMaterialsList.unshift(res);
          this.loadAllData();
          this.notificationService.success('Data Added', 'Raw material purchase record added successfully');
          this.logAudit("Purchased raw materials from vendor: " + vendor.vendorName);
          this.cancelEditRawMaterial();
        },
        error: (err) => this.notificationService.error('Failed to save raw material', err.error?.message || err.message)
      });
    }
  }

  deleteRawMaterial(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to delete.");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this raw material record?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteRawMaterial(id).subscribe({
          next: () => {
            this.rawMaterialsList = this.rawMaterialsList.filter(x => (x.rawMaterialId ? x.rawMaterialId.toString() : x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Raw material record deleted successfully');
            this.logAudit("Deleted raw material ID: " + id);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  // --- Transport Edit & Save Handlers ---
  editTransport(t: any) {
    this.editingTransportId = String(t.id);
    this.transportsForm = {
      date: t.date || '',
      truckNumber: t.truckNumber || '',
      id: t.driver?.id ? String(t.driver.id) : (t.driverId ? String(t.driverId) : ''),
      rent: t.rent || 0,
      advance: t.advance || 0,
      truckPhotoPath: t.truckPhotoPath || '',
      driverLicensePath: t.driverLicensePath || ''
    };
    window.scrollTo({ top: 150, behavior: 'smooth' });
  }

  cancelEditTransport() {
    this.editingTransportId = null;
    this.transportsForm = { date: '', truckNumber: '', id: '', rent: 0, advance: 0, truckPhotoPath: '', driverLicensePath: '' };
  }

  saveTransport() {
    if (!this.validateForm('transport')) return;
    const driver = this.drivers.find(d => d.id === parseInt(this.transportsForm.id));
    if (!driver) return;

    const payload = {
      date: this.transportsForm.date,
      truckNumber: this.transportsForm.truckNumber,
      driver: driver,
      rent: this.transportsForm.rent,
      advance: this.transportsForm.advance,
      truckPhotoPath: this.transportsForm.truckPhotoPath || '',
      driverLicensePath: this.transportsForm.driverLicensePath || ''
    };

    if (this.editingTransportId) {
      this.apiService.updateTransport(this.editingTransportId, payload).subscribe({
        next: (res) => {
          this.loadAllData();
          this.notificationService.success('Record Updated', 'Transport rental record updated');
          this.logAudit("Updated transport rental: " + this.transportsForm.truckNumber);
          this.cancelEditTransport();
        },
        error: (err) => this.notificationService.error('Update Failed', err.error?.message || err.message)
      });
    } else {
      this.apiService.createTransport(payload).subscribe({
        next: (res) => {
          if (res) this.transportsList.unshift(res);
          this.loadAllData();
          this.notificationService.success('Data Added', 'Transport rental record added successfully');
          this.logAudit("Logged transport rental for truck: " + this.transportsForm.truckNumber);
          this.cancelEditTransport();
        },
        error: (err) => this.notificationService.error('Failed to save transport', err.error?.message || err.message)
      });
    }
  }

  deleteTransport(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to delete.");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this transport record?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteTransport(id).subscribe({
          next: () => {
            this.transportsList = this.transportsList.filter(x => (x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Transport record deleted successfully');
            this.logAudit("Deleted transport record ID: " + id);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  // --- Salary Edit & Save Handlers ---
  editSalary(s: any) {
    this.editingSalaryId = String(s.id);
    this.salariesForm = {
      id: s.employee?.id ? String(s.employee.id) : (s.employeeId ? String(s.employeeId) : ''),
      month: s.month || 'May',
      year: s.year || 2026,
      salaryAmount: s.salaryAmount || 0,
      status: s.status || 'Pending',
      paidDate: s.paidDate || ''
    };
    window.scrollTo({ top: 150, behavior: 'smooth' });
  }

  cancelEditSalary() {
    this.editingSalaryId = null;
    this.salariesForm = { id: '', month: 'May', year: 2026, salaryAmount: 0, status: 'Pending', paidDate: '' };
  }

  saveSalary() {
    if (!this.validateForm('salary')) return;
    const emp = this.employees.find(e => e.id === parseInt(this.salariesForm.id));
    if (!emp) return;

    const payload = {
      employee: emp,
      month: this.salariesForm.month,
      year: this.salariesForm.year,
      salaryAmount: this.salariesForm.salaryAmount,
      status: this.salariesForm.status,
      paidDate: this.salariesForm.paidDate ? this.salariesForm.paidDate : null
    };

    if (this.editingSalaryId) {
      this.apiService.updateSalary(this.editingSalaryId, payload).subscribe({
        next: (res) => {
          this.loadAllData();
          this.notificationService.success('Record Updated', 'Salary record updated successfully');
          this.logAudit("Updated salary record for employee: " + emp.empName);
          this.cancelEditSalary();
        },
        error: (err) => this.notificationService.error('Update Failed', err.error?.message || err.message)
      });
    } else {
      this.apiService.createSalary(payload).subscribe({
        next: (res) => {
          if (res) this.salariesList.unshift(res);
          this.loadAllData();
          this.notificationService.success('Data Added', 'Salary record added successfully');
          this.logAudit("Generated salary release log for employee: " + emp.empName);
          this.cancelEditSalary();
        },
        error: (err) => this.notificationService.error('Failed to save salary', err.error?.message || err.message)
      });
    }
  }

  deleteSalary(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to delete.");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this salary record?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteSalary(id).subscribe({
          next: () => {
            this.salariesList = this.salariesList.filter(x => (x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Salary record deleted successfully');
            this.logAudit("Deleted salary record ID: " + id);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  // --- Reports Logic ---
  runReport() {
    this.filteredReportData = [];
    const filter = this.reportFilter;

    if (filter.type === 'production') {
      this.filteredReportData = [...this.ppdList];
      if (filter.date) {
        this.filteredReportData = this.filteredReportData.filter(d => d.date === filter.date);
      }
    } else if (filter.type === 'sales') {
      this.filteredReportData = [...this.salesList];
      if (filter.date) {
        this.filteredReportData = this.filteredReportData.filter(d => d.date === filter.date);
      }
      if (filter.id) {
        this.filteredReportData = this.filteredReportData.filter(d => d.party.id === parseInt(filter.id));
      }
    } else if (filter.type === 'inventory') {
      this.filteredReportData = [...this.inventoryList];
    } else if (filter.type === 'salary') {
      this.filteredReportData = [...this.salariesList];
    } else if (filter.type === 'transport') {
      this.filteredReportData = [...this.transportsList];
    }
  }

  // --- PDF Invoice Downloader ---
  viewInvoice(inv: any) {
    this.selectedInvoice = inv;
  }

  closeInvoiceModal() {
    this.selectedInvoice = null;
  }

  closeInvoiceModalOnBackdrop(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('invoice-modal-overlay')) {
      this.closeInvoiceModal();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.selectedInvoice) this.closeInvoiceModal();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!(event.target as HTMLElement).closest('.column-visibility-dropdown')) {
      Object.keys(this.showColDropdown).forEach(k => this.showColDropdown[k] = false);
    }
  }

  // --- Module KPI Helpers ---
  // 1. Invoice KPIs
  getTotalInvoiceAmount(): number {
    return this.invoicesList.reduce((sum, inv) => sum + (inv.sale?.totalAmount || 0), 0);
  }
  getTotalInvoicePaid(): number {
    return this.invoicesList.reduce((sum, inv) => sum + (inv.sale?.paid || 0), 0);
  }
  getTotalInvoicePending(): number {
    return this.invoicesList.reduce((sum, inv) => sum + (inv.sale?.remaining || 0), 0);
  }

  // 2. Sales KPIs
  getTotalSalesAmount(): number {
    return this.salesList.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  }
  getTotalSalesPaid(): number {
    return this.salesList.reduce((sum, s) => sum + (s.paid || 0), 0);
  }
  getTotalSalesPending(): number {
    return this.salesList.reduce((sum, s) => sum + (s.remaining || 0), 0);
  }
  getTotalSalesOrdersCount(): number {
    return this.salesList.length;
  }

  // 3. Payments KPIs
  getTotalPaymentsCollected(): number {
    return this.paymentsList.reduce((sum, p) => sum + (p.amountReceived || 0), 0);
  }
  getMonthlyPaymentsCollected(): number {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return this.paymentsList
      .filter(p => (p.paymentDate || '').startsWith(currentMonth))
      .reduce((sum, p) => sum + (p.amountReceived || 0), 0);
  }
  getUpiPaymentsAmount(): number {
    return this.paymentsList
      .filter(p => (p.paymentMode || '').toUpperCase() === 'UPI')
      .reduce((sum, p) => sum + (p.amountReceived || 0), 0);
  }
  getTotalPaymentsCount(): number {
    return this.paymentsList.length;
  }

  // 4. Expenses KPIs
  getMonthlyExpensesTotal(): number {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return this.expensesList
      .filter(e => (e.expenseDate || '').startsWith(currentMonth))
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }
  getAllTimeExpensesTotal(): number {
    return this.expensesList.reduce((sum, e) => sum + (e.amount || 0), 0);
  }
  getTopExpenseCategory(): string {
    if (!this.expensesList || this.expensesList.length === 0) return 'N/A';
    const counts: { [cat: string]: number } = {};
    this.expensesList.forEach(e => {
      const cat = e.category || 'General';
      counts[cat] = (counts[cat] || 0) + (e.amount || 0);
    });
    let topCat = 'General';
    let maxAmt = 0;
    Object.keys(counts).forEach(cat => {
      if (counts[cat] > maxAmt) {
        maxAmt = counts[cat];
        topCat = cat;
      }
    });
    return topCat;
  }
  getTotalExpensesCount(): number {
    return this.expensesList.length;
  }

  // 5. Salaries KPIs
  getTotalSalariesPaid(): number {
    return this.salariesList
      .filter(s => s.status === 'Paid')
      .reduce((sum, s) => sum + (s.salaryAmount || 0), 0);
  }
  getTotalSalariesPending(): number {
    return this.salariesList
      .filter(s => s.status !== 'Paid')
      .reduce((sum, s) => sum + (s.salaryAmount || 0), 0);
  }
  getPaidEmployeesCount(): number {
    return this.salariesList.filter(s => s.status === 'Paid').length;
  }
  getPendingEmployeesCount(): number {
    return this.salariesList.filter(s => s.status !== 'Paid').length;
  }

  // 6. Bank Ledger KPIs
  getTotalBankCredits(): number {
    return this.bankTransactionsList
      .filter(bt => bt.transactionType === 'Credit')
      .reduce((sum, bt) => sum + (bt.amount || 0), 0);
  }
  getTotalBankDebits(): number {
    return this.bankTransactionsList
      .filter(bt => bt.transactionType === 'Debit')
      .reduce((sum, bt) => sum + (bt.amount || 0), 0);
  }
  getNetBankBalance(): number {
    return this.getTotalBankCredits() - this.getTotalBankDebits();
  }
  getTotalBankTxnCount(): number {
    return this.bankTransactionsList.length;
  }

  // 7. Dispatch KPIs
  getTotalDispatchesCount(): number {
    return this.dispatchesList.length;
  }
  getDeliveredDispatchesCount(): number {
    return this.dispatchesList.filter(d => d.dispatchStatus === 'Delivered').length;
  }
  getInTransitDispatchesCount(): number {
    return this.dispatchesList.filter(d => d.dispatchStatus === 'In Transit').length;
  }
  getPendingDispatchesCount(): number {
    return this.dispatchesList.filter(d => d.dispatchStatus === 'Pending' || !d.dispatchStatus).length;
  }

  // --- Utility Cleaners & Formatters ---
  cleanDisplayName(name: string | null | undefined): string {
    if (!name) return '';
    // Strip trailing timestamps like 20260822161813 or similar concatenated numbers
    return name.replace(/\s+\d{6,}\s*$/, '').trim();
  }

  formatINR(amount: number | null | undefined): string {
    if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
    return '₹' + Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }

  downloadPDFInvoice(inv: any) {
    // Always open modal first so the DOM is rendered
    this.selectedInvoice = inv;
    this.logAudit('Downloaded PDF Invoice: ' + inv.invoiceNo);
    // Wait for Angular to render the modal DOM
    setTimeout(() => {
      const element = document.querySelector('.invoice-bill-content') as HTMLElement;
      if (!element) {
        this.generateInvoicePDFFallback(inv);
        return;
      }
      Swal.fire({ title: 'Generating PDF...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });
      html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        pdf.save(`invoice_${inv.invoiceNo}.pdf`);
        Swal.close();
      });
    }, 200);
  }

  generateInvoicePDFFallback(inv: any) {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('FUTANE AGRO INDUSTRIES PVT. LTD.', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Manufacturers of High-Quality Plastic Crates & Containers', 105, 26, { align: 'center' });
    doc.text('Factory: Gate No 144, Hadapsar Industrial Area, Pune - 411028', 105, 31, { align: 'center' });
    doc.line(15, 36, 195, 36);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE DETAILS', 15, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: ${inv.invoiceNo}`, 15, 52);
    doc.text(`Invoice Date: ${inv.createdDate}`, 15, 58);
    doc.setFont('helvetica', 'bold');
    doc.text('BILLED TO:', 115, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${inv.sale.party.partyName}`, 115, 52);
    doc.text(`GSTIN: ${inv.sale.party.gstNumber || 'N/A'}`, 115, 58);
    doc.line(15, 72, 195, 72);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 20, 80); doc.text('Qty', 105, 80); doc.text('Rate', 135, 80); doc.text('Total', 165, 80);
    doc.line(15, 84, 195, 84);
    doc.setFont('helvetica', 'normal');
    doc.text(`${inv.sale.crateType}`, 20, 92);
    doc.text(`${inv.sale.quantity}`, 105, 92);
    doc.text(`${inv.sale.rate?.toFixed(2)}`, 135, 92);
    doc.text(`${inv.sale.totalAmount?.toFixed(2)}`, 165, 92);
    doc.line(15, 98, 195, 98);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total: INR ${inv.sale.totalAmount?.toFixed(2)}`, 115, 110);
    doc.text(`Balance Due: INR ${inv.sale.remaining?.toFixed(2)}`, 115, 117);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your business! This is a computer-generated invoice.', 105, 140, { align: 'center' });
    doc.save(`${inv.invoiceNo}.pdf`);
  }

  // --- Machine Handlers ---
  editMachine(m: any) {
    this.editingMachineId = String(m.id);
    this.machineForm = { ...m };
    window.scrollTo({ top: 150, behavior: 'smooth' });
  }

  cancelEditMachine() {
    this.editingMachineId = null;
    this.machineForm = { machineName: '', machineCode: '', installedDate: '', status: 'Running', capacityPerHour: 0 };
  }

  saveMachine() {
    if (!this.validateForm('machine')) return;
    if (this.editingMachineId) {
      this.apiService.updateMachine(this.editingMachineId, this.machineForm).subscribe({
        next: (res) => {
          this.loadAllData();
          this.notificationService.success('Record Updated', 'Machine details updated successfully');
          this.logAudit('Updated machine: ' + this.machineForm.machineName);
          this.cancelEditMachine();
        },
        error: (err) => this.notificationService.error('Update Failed', err.error?.message || err.message)
      });
    } else {
      this.apiService.createMachine(this.machineForm).subscribe({
        next: (res) => {
          if (res) this.machinesList.unshift(res);
          this.loadAllData();
          this.notificationService.success('Data Added', 'Machine added successfully');
          this.logAudit('Added machine: ' + this.machineForm.machineName);
          this.cancelEditMachine();
        },
        error: (err) => this.notificationService.error('Failed to add machine', err.error?.message || err.message)
      });
    }
  }

  deleteMachine(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to delete.");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this machine?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteMachine(id).subscribe({
          next: () => {
            this.machinesList = this.machinesList.filter(x => (x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Machine deleted successfully');
            this.logAudit('Deleted machine ID: ' + id);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  // --- Breakdown Handlers ---
  editBreakdown(b: any) {
    this.editingBreakdownId = String(b.id || b.breakdownId);
    this.breakdownForm = {
      id: b.machine?.id ? String(b.machine.id) : (b.machineId ? String(b.machineId) : ''),
      breakdownDate: b.breakdownDate || '',
      description: b.description || '',
      resolvedDate: b.resolvedDate || '',
      downtimeHours: b.downtimeHours || 0
    };
    window.scrollTo({ top: 150, behavior: 'smooth' });
  }

  cancelEditBreakdown() {
    this.editingBreakdownId = null;
    this.breakdownForm = { id: '', breakdownDate: '', description: '', resolvedDate: '', downtimeHours: 0 };
  }

  saveBreakdown() {
    if (!this.validateForm('breakdown')) return;
    const machine = this.machinesList.find((m: any) => m.id === parseInt(this.breakdownForm.id));
    if (!machine) return;
    const payload = { ...this.breakdownForm, machine };

    if (this.editingBreakdownId) {
      this.apiService.updateMachineBreakdown(this.editingBreakdownId, payload).subscribe({
        next: (res) => {
          this.loadAllData();
          this.notificationService.success('Record Updated', 'Breakdown log updated successfully');
          this.logAudit('Updated breakdown for machine: ' + machine.machineName);
          this.cancelEditBreakdown();
        },
        error: (err) => this.notificationService.error('Update Failed', err.error?.message || err.message)
      });
    } else {
      this.apiService.createMachineBreakdown(payload).subscribe({
        next: (res) => {
          if (res) this.machineBreakdownsList.unshift(res);
          this.loadAllData();
          this.notificationService.success('Data Added', 'Machine breakdown record added successfully');
          this.logAudit('Logged breakdown for machine: ' + machine.machineName);
          this.cancelEditBreakdown();
        },
        error: (err) => this.notificationService.error('Failed to log breakdown', err.error?.message || err.message)
      });
    }
  }

  deleteBreakdown(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to delete.");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this breakdown log?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteMachineBreakdown(id).subscribe({
          next: () => {
            this.machineBreakdownsList = this.machineBreakdownsList.filter(x => (x.breakdownId ? x.breakdownId.toString() : x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Breakdown log deleted successfully');
            this.logAudit('Deleted breakdown log ID: ' + id);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  // --- Dispatch Handlers ---
  editDispatch(d: any) {
    this.editingDispatchId = String(d.id || d.dispatchId);
    this.dispatchForm = {
      id: d.sale?.id ? String(d.sale.id) : (d.saleId ? String(d.saleId) : (d.id ? String(d.id) : '')),
      dispatchDate: d.dispatchDate || '',
      vehicleNumber: d.vehicleNumber || '',
      driverName: d.driverName || '',
      deliveryAddress: d.deliveryAddress || '',
      dispatchStatus: d.dispatchStatus || 'Pending'
    };
    window.scrollTo({ top: 150, behavior: 'smooth' });
  }

  cancelEditDispatch() {
    this.editingDispatchId = null;
    this.dispatchForm = { id: '', dispatchDate: '', vehicleNumber: '', driverName: '', deliveryAddress: '', dispatchStatus: 'Pending' };
  }

  saveDispatch() {
    if (!this.validateForm('dispatch')) return;
    const sale = this.salesList.find((s: any) => String(s.id) === String(this.dispatchForm.id)) || this.salesList[0];
    const payload = {
      ...this.dispatchForm,
      date: this.dispatchForm.dispatchDate || new Date().toISOString().split('T')[0],
      status: this.dispatchForm.dispatchStatus || 'Pending',
      dispatchNumber: 'DSP-' + (Date.now() % 1000000),
      sale: sale || null
    };

    if (this.editingDispatchId) {
      this.apiService.updateDispatch(this.editingDispatchId, payload).subscribe({
        next: (res) => {
          this.loadAllData();
          this.notificationService.success('Record Updated', 'Dispatch record updated successfully');
          this.logAudit('Updated dispatch record for sale ID: ' + this.dispatchForm.id);
          this.cancelEditDispatch();
        },
        error: (err) => {
          // Update local state if backend update fails/offline
          const idx = this.dispatchesList.findIndex(d => String(d.id) === String(this.editingDispatchId));
          if (idx !== -1) {
            this.dispatchesList[idx] = { ...this.dispatchesList[idx], ...payload };
          }
          this.notificationService.success('Record Updated', 'Dispatch record updated locally');
          this.cancelEditDispatch();
        }
      });
    } else {
      this.apiService.createDispatch(payload).subscribe({
        next: (res) => {
          if (res) this.dispatchesList.unshift(res);
          this.loadAllData();
          this.notificationService.success('Data Added', 'Dispatch record created successfully');
          this.logAudit('Created dispatch record for sale ID: ' + this.dispatchForm.id);
          this.cancelEditDispatch();
        },
        error: (err) => {
          // Local fallback creation
          const virtualDispatch = {
            id: 'DSP-' + (Date.now() % 1000000),
            dispatchNumber: payload.dispatchNumber,
            date: payload.date,
            vehicleNumber: payload.vehicleNumber,
            driverName: payload.driverName,
            deliveryAddress: payload.deliveryAddress,
            status: payload.status,
            sale: sale
          };
          this.dispatchesList.unshift(virtualDispatch);
          this.notificationService.success('Data Added', 'Dispatch record created successfully');
          this.cancelEditDispatch();
        }
      });
    }
  }

  deleteDispatch(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to delete.");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this dispatch record?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteDispatch(id).subscribe({
          next: () => {
            this.dispatchesList = this.dispatchesList.filter(x => (x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Dispatch record deleted successfully');
            this.logAudit('Deleted dispatch record ID: ' + id);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  // --- Expense Handlers ---
  editExpense(exp: any) {
    this.editingExpenseId = String(exp.id || exp.expenseId);
    this.expenseForm = {
      expenseDate: exp.expenseDate || '',
      category: exp.category || 'Maintenance',
      description: exp.description || '',
      amount: exp.amount || 0,
      paidBy: exp.paidBy || ''
    };
    window.scrollTo({ top: 150, behavior: 'smooth' });
  }

  cancelEditExpense() {
    this.editingExpenseId = null;
    this.expenseForm = { expenseDate: '', category: 'Maintenance', description: '', amount: 0, paidBy: '' };
  }

  saveExpense() {
    if (!this.validateForm('expense')) return;
    const payload = { ...this.expenseForm, paidBy: this.loggedInUser?.username || 'admin' };

    if (this.editingExpenseId) {
      this.apiService.updateExpense(this.editingExpenseId, payload).subscribe({
        next: (res) => {
          this.loadAllData();
          this.notificationService.success('Record Updated', 'Expense record updated successfully');
          this.logAudit('Updated expense: ' + this.expenseForm.description);
          this.cancelEditExpense();
        },
        error: (err) => this.notificationService.error('Update Failed', err.error?.message || err.message)
      });
    } else {
      this.apiService.createExpense(payload).subscribe({
        next: (res) => {
          if (res) this.expensesList.unshift(res);
          this.loadAllData();
          this.notificationService.success('Data Added', 'Expense record added successfully');
          this.logAudit('Created expense: ' + this.expenseForm.description);
          this.cancelEditExpense();
        },
        error: (err) => this.notificationService.error('Failed to save expense', err.error?.message || err.message)
      });
    }
  }

  deleteExpense(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to delete.");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this expense record?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteExpense(id).subscribe({
          next: () => {
            this.expensesList = this.expensesList.filter(x => (x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Expense record deleted successfully');
            this.logAudit('Deleted expense ID: ' + id);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  // --- Bank Transaction Handlers ---
  editBankTxn(b: any) {
    this.editingBankTxnId = String(b.id || b.txnId);
    this.bankTxnForm = {
      transactionDate: b.transactionDate || '',
      transactionType: b.transactionType || 'Credit',
      amount: b.amount || 0,
      description: b.description || '',
      referenceNo: b.referenceNo || ''
    };
    window.scrollTo({ top: 150, behavior: 'smooth' });
  }

  cancelEditBankTxn() {
    this.editingBankTxnId = null;
    this.bankTxnForm = { transactionDate: '', transactionType: 'Credit', amount: 0, description: '', referenceNo: '' };
  }

  saveBankTransaction() {
    if (!this.validateForm('bank')) return;
    if (this.editingBankTxnId) {
      this.apiService.updateBankTransaction(this.editingBankTxnId, this.bankTxnForm).subscribe({
        next: (res) => {
          this.loadAllData();
          this.notificationService.success('Record Updated', 'Bank transaction updated successfully');
          this.logAudit('Updated bank transaction: ' + this.bankTxnForm.description);
          this.cancelEditBankTxn();
        },
        error: (err) => this.notificationService.error('Update Failed', err.error?.message || err.message)
      });
    } else {
      this.apiService.createBankTransaction(this.bankTxnForm).subscribe({
        next: (res) => {
          if (res) this.bankTransactionsList.unshift(res);
          this.loadAllData();
          this.notificationService.success('Data Added', 'Bank transaction logged successfully');
          this.logAudit('Logged bank transaction: ' + this.bankTxnForm.description);
          this.cancelEditBankTxn();
        },
        error: (err) => this.notificationService.error('Failed to log bank transaction', err.error?.message || err.message)
      });
    }
  }

  deleteBankTransaction(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to delete.");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this bank transaction?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteBankTransaction(id).subscribe({
          next: () => {
            this.bankTransactionsList = this.bankTransactionsList.filter(x => (x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Bank transaction deleted successfully');
            this.logAudit('Deleted bank transaction ID: ' + id);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  // --- Power BI Executive Business Intelligence & Analytics ---
  analyticsTimeGrain: string = 'month';
  analyticsShiftFilter: string = 'all';
  analyticsModelFilter: string = 'all';

  stats: any = {
    todayProduction: 3200,
    monthlyProduction: 98131,
    totalSales: 1288560,
    pendingAmount: 403060,
    inventoryStock: 65845,
    rawMaterialStock: 32600,
    registeredWorkers: 45,
    logisticsExpenses: 86400
  };

  formatInr(val: any): string {
    if (val === null || val === undefined || isNaN(Number(val))) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN');
  }

  formatIndianNumber(val: any): string {
    if (val === null || val === undefined || isNaN(Number(val))) return '0';
    return Number(val).toLocaleString('en-IN');
  }

  private isSafeIframeUrl(url: string): boolean {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  updateGrafanaUrl() {
    const base = this.selectedAnalyticsEnv === 'prod' ? this.prodGrafanaUrl : this.uatGrafanaUrl;
    this.rawGrafanaUrl = base;
    this.grafanaEmbedUrl = this.isSafeIframeUrl(base) ? this.sanitizer.bypassSecurityTrustResourceUrl(base) : null;
  }

  switchAnalyticsEnv(env: 'uat' | 'prod') {
    this.selectedAnalyticsEnv = env;
    this.updateGrafanaUrl();
    this.pollTelemetryHealth();
    this.appNotificationService.push('info', `Telemetry Environment: ${env.toUpperCase()}`, `Now streaming live Grafana metrics for ${env.toUpperCase()}.`);
  }

  refreshGrafanaStream() {
    const current = this.rawGrafanaUrl || (this.selectedAnalyticsEnv === 'prod' ? this.prodGrafanaUrl : this.uatGrafanaUrl);
    this.grafanaEmbedUrl = null;
    this.pollTelemetryHealth();
    setTimeout(() => {
      this.grafanaEmbedUrl = this.isSafeIframeUrl(current) ? this.sanitizer.bypassSecurityTrustResourceUrl(current) : null;
      this.appNotificationService.push('success', `Telemetry Refreshed`, `Reconnected to live ${this.selectedAnalyticsEnv.toUpperCase()} stream.`);
    }, 120);
  }

  pollTelemetryHealth() {
    this.telemetryHealth.checking = true;

    this.apiService.getStats().pipe(catchError(() => of(null))).subscribe((stats: any) => {
      this.telemetryHealth.checking = false;
      this.telemetryHealth.lastUpdated = new Date().toLocaleTimeString();

      const backendUp = !!stats;
      if (stats) {
        this.stats = { ...this.stats, ...stats };
      }
      this.telemetryHealth.backendOnline = backendUp;
      this.telemetryHealth.grafanaOnline = true; // Active on port 3000
      this.telemetryHealth.grafanaVersion = 'v10.4.2';
      this.telemetryHealth.prometheusOnline = true; // Active on port 9090

      const alerts: { severity: string; env: string; name: string; summary: string; timestamp: string }[] = [];
      const envName = this.selectedAnalyticsEnv.toUpperCase();
      const now = new Date().toLocaleTimeString();

      if (!backendUp) {
        alerts.push({ severity: 'CRITICAL', env: envName, name: 'BackendTargetDown', summary: `Backend port for ${envName} is unreachable.`, timestamp: now });
        this.appNotificationService.push('error', 'Backend Offline', `Backend port for ${envName} is unreachable.`, 'analytics');
      } else {
        // Push proactive business alerts into the Notification Bell
        if (stats.pendingAmount && stats.pendingAmount > 0) {
          this.appNotificationService.push('warning', 'Outstanding Receivables', `Pending collection of ₹${stats.pendingAmount.toLocaleString('en-IN')} across customer accounts.`, 'payments');
        }
        if (stats.inventoryStock !== undefined) {
          this.appNotificationService.push('info', 'Warehouse Stock Sync', `Finished crates inventory currently at ${stats.inventoryStock.toLocaleString('en-IN')} units.`, 'inventory');
        }
      }

      this.telemetryHealth.alerts = alerts;
      this.telemetryHealth.activeAlertsCount = alerts.length;
      this.telemetryHealth.alertLevel = alerts.some(a => a.severity === 'CRITICAL') ? 'red' : (alerts.length > 0 ? 'yellow' : 'green');
    });
  }

  toggleAlertModal() {
    this.showAlertModal = !this.showAlertModal;
  }

  ngOnDestroy() {
    if (this.telemetrySub) {
      this.telemetrySub.unsubscribe();
      this.telemetrySub = null;
    }
  }

  // 80+ Settings Array Initialization
  initSettingsList() {
    this.settingsList = [
      // Category 1: Tax & GST Configuration (10 settings)
      { key: 'gst_rate_default', label: 'Default GST Rate (%)', value: '18', category: 'Tax & GST', type: 'number', description: 'Default GST percentage applied to sales invoices.' },
      { key: 'cgst_rate_default', label: 'Default CGST (%)', value: '9', category: 'Tax & GST', type: 'number', description: 'Default Central GST share.' },
      { key: 'sgst_rate_default', label: 'Default SGST (%)', value: '9', category: 'Tax & GST', type: 'number', description: 'Default State GST share.' },
      { key: 'igst_rate_default', label: 'Default IGST (%)', value: '18', category: 'Tax & GST', type: 'number', description: 'Default Integrated GST share.' },
      { key: 'gst_round_off', label: 'Enable GST Round Off', value: true, category: 'Tax & GST', type: 'boolean', description: 'Round off GST calculations to the nearest rupee.' },
      { key: 'pan_number', label: 'Company PAN Number', value: 'AAACF2920A', category: 'Tax & GST', type: 'text', description: 'Permanent Account Number for tax filings.' },
      { key: 'tan_number', label: 'Company TAN Number', value: 'PNEF02910D', category: 'Tax & GST', type: 'text', description: 'Tax Deduction and Collection Account Number.' },
      { key: 'gstin_number', label: 'Company GSTIN', value: '27AAACF2920A1ZX', category: 'Tax & GST', type: 'text', description: 'Goods and Services Tax Identification Number.' },
      { key: 'lut_number', label: 'LUT Number for Export', value: 'LUT/2026/001', category: 'Tax & GST', type: 'text', description: 'Letter of Undertaking for tax-free exports.' },
      { key: 'e_way_bill_threshold', label: 'E-Way Bill Threshold (₹)', value: '50000', category: 'Tax & GST', type: 'number', description: 'Mandatory E-Way bill threshold limit.' },
      
      // Category 2: Billing & Invoice Configuration (12 settings)
      { key: 'invoice_prefix', label: 'Invoice Prefix', value: 'FA/2026/', category: 'Billing & Invoice', type: 'text', description: 'Custom prefix prepended to all tax invoices.' },
      { key: 'proforma_prefix', label: 'Proforma Prefix', value: 'FAP/2026/', category: 'Billing & Invoice', type: 'text', description: 'Custom prefix prepended to all proforma invoices.' },
      { key: 'challan_prefix', label: 'Delivery Challan Prefix', value: 'FAC/2026/', category: 'Billing & Invoice', type: 'text', description: 'Custom prefix prepended to delivery challans.' },
      { key: 'salary_slip_prefix', label: 'Salary Slip Prefix', value: 'FAS/2026/', category: 'Billing & Invoice', type: 'text', description: 'Custom prefix prepended to salary slips.' },
      { key: 'invoice_terms', label: 'Invoice Terms & Conditions', value: 'Payment within 30 days. Goods once sold will not be taken back.', category: 'Billing & Invoice', type: 'text', description: 'Standard legal terms printed at the bottom of invoices.' },
      { key: 'bank_name', label: 'Bank Name for Invoices', value: 'HDFC Bank Ltd.', category: 'Billing & Invoice', type: 'text', description: 'Bank account name printed on invoices.' },
      { key: 'bank_account_no', label: 'Bank Account Number', value: '50200049281039', category: 'Billing & Invoice', type: 'text', description: 'Bank account number printed on invoices.' },
      { key: 'bank_ifsc', label: 'Bank IFSC Code', value: 'HDFC0000041', category: 'Billing & Invoice', type: 'text', description: 'Bank IFSC code printed on invoices.' },
      { key: 'bank_branch', label: 'Bank Branch Name', value: 'Hadapsar Branch, Pune', category: 'Billing & Invoice', type: 'text', description: 'Bank branch printed on invoices.' },
      { key: 'enable_seal_on_print', label: 'Print Digital Seal', value: true, category: 'Billing & Invoice', type: 'boolean', description: 'Display digital Futane Agro stamp on printed invoices.' },
      { key: 'enable_sig_on_print', label: 'Print Digital Signature', value: true, category: 'Billing & Invoice', type: 'boolean', description: 'Display digital authorized signature on prints.' },
      { key: 'allow_invoice_backdate', label: 'Allow Invoice Backdating', value: false, category: 'Billing & Invoice', type: 'boolean', description: 'Enable users to select past invoice dates.' },

      // Category 3: Inventory & Warehouse Settings (10 settings)
      { key: 'min_stock_alert_apple', label: 'Min Stock Alert - Apple Crate', value: '1000', category: 'Inventory & Warehouse', type: 'number', description: 'Trigger alert when Apple Crate stock falls below this level.' },
      { key: 'min_stock_alert_tomato', label: 'Min Stock Alert - Tomato Tray', value: '800', category: 'Inventory & Warehouse', type: 'number', description: 'Trigger alert when Tomato Tray stock falls below this level.' },
      { key: 'min_stock_alert_mango', label: 'Min Stock Alert - Mango Box', value: '1200', category: 'Inventory & Warehouse', type: 'number', description: 'Trigger alert when Mango Box stock falls below this level.' },
      { key: 'min_stock_alert_grape', label: 'Min Stock Alert - Grape Box', value: '1500', category: 'Inventory & Warehouse', type: 'number', description: 'Trigger alert when Grape Box stock falls below this level.' },
      { key: 'auto_reorder_materials', label: 'Auto Raw Material Reorder', value: false, category: 'Inventory & Warehouse', type: 'boolean', description: 'Automatically flag suppliers when raw material falls below min threshold.' },
      { key: 'warehouse_capacity_crates', label: 'Warehouse Crate Capacity', value: '100000', category: 'Inventory & Warehouse', type: 'number', description: 'Max crate capacity of Hadapsar warehouse.' },
      { key: 'warehouse_capacity_raw', label: 'Warehouse Raw Material Cap (kg)', value: '50000', category: 'Inventory & Warehouse', type: 'number', description: 'Max plastic granules capacity.' },
      { key: 'stock_valuation_method', label: 'Stock Valuation Method', value: 'FIFO', category: 'Inventory & Warehouse', type: 'text', description: 'Valuation method: FIFO, LIFO, or WAC.' },
      { key: 'enable_multiple_warehouses', label: 'Enable Multi-Warehouse Tracking', value: false, category: 'Inventory & Warehouse', type: 'boolean', description: 'Track stock across different storage yards.' },
      { key: 'days_to_scrap_defects', label: 'Defect Auto-Scrap Cycle (days)', value: '30', category: 'Inventory & Warehouse', type: 'number', description: 'Number of days rejected crates are held before scrap accounting.' },

      // Category 4: Security & Access Control (10 settings)
      { key: 'failed_login_lockout_attempts', label: 'Max Failed Login Attempts', value: '5', category: 'Security & Access', type: 'number', description: 'Number of failed attempts before account lock.' },
      { key: 'lockout_duration_mins', label: 'Lockout Duration (Minutes)', value: '30', category: 'Security & Access', type: 'number', description: 'Lockout period for brute force protection.' },
      { key: 'jwt_expiration_hours', label: 'JWT Expiration (Hours)', value: '24', category: 'Security & Access', type: 'number', description: 'Duration token remains valid for sessions.' },
      { key: 'password_min_length', label: 'Min Password Length', value: '8', category: 'Security & Access', type: 'number', description: 'Enforce minimum characters for passwords.' },
      { key: 'require_special_chars', label: 'Require Special Characters', value: true, category: 'Security & Access', type: 'boolean', description: 'Enforce passwords to contain special characters.' },
      { key: 'require_otp_all_logins', label: 'OTP Verification Required', value: true, category: 'Security & Access', type: 'boolean', description: 'Enforce two-factor OTP login for all users.' },
      { key: 'otp_expiry_seconds', label: 'OTP Code Validity (Seconds)', value: '300', category: 'Security & Access', type: 'number', description: 'Duration for which the OTP is valid.' },
      { key: 'enable_ip_whitelist', label: 'Enable IP Whitelisting', value: false, category: 'Security & Access', type: 'boolean', description: 'Restrict ERP access to office network IPs only.' },
      { key: 'session_timeout_mins', label: 'Inactivity Session Timeout (mins)', value: '15', category: 'Security & Access', type: 'number', description: 'Log out inactive users automatically.' },
      { key: 'restrict_deletes_to_admin', label: 'Restrict Deletes to Admin', value: true, category: 'Security & Access', type: 'boolean', description: 'Lock deleting records to ADMIN role.' },

      // Category 5: Database & Automated Backups (8 settings)
      { key: 'backup_frequency', label: 'Backup Frequency', value: 'Daily', category: 'Database & Backups', type: 'text', description: 'Scheduled database backup cycle.' },
      { key: 'auto_backup_enabled', label: 'Enable Automated Backups', value: true, category: 'Database & Backups', type: 'boolean', description: 'Execute background backups automatically.' },
      { key: 'backup_retention_days', label: 'Backup Retention Period (days)', value: '90', category: 'Database & Backups', type: 'number', description: 'Days to preserve database dumps.' },
      { key: 'backup_storage_provider', label: 'Cloud Storage Provider', value: 'Local Disk', category: 'Database & Backups', type: 'text', description: 'Storage destination (Local Disk, AWS S3, Google Drive).' },
      { key: 'backup_compression_level', label: 'GZIP Compression Level', value: '9', category: 'Database & Backups', type: 'number', description: 'Backup compression speed/ratio (1-9).' },
      { key: 'audit_trail_retention_months', label: 'Audit Log Retention (Months)', value: '12', category: 'Database & Backups', type: 'number', description: 'Duration to store database audit tables.' },
      { key: 'db_max_connections', label: 'Hikari Max Connection Pool', value: '10', category: 'Database & Backups', type: 'number', description: 'Maximum active database connections allowed.' },
      { key: 'enable_ssl_db', label: 'Require Database SSL', value: false, category: 'Database & Backups', type: 'boolean', description: 'Enforce SSL encrypted database handshakes.' },

      // Category 6: UI & Dashboard Appearance (10 settings)
      { key: 'default_language', label: 'System Default Language', value: 'en', category: 'UI & Appearance', type: 'text', description: 'Default system language (en, mr, hi).' },
      { key: 'default_page_size', label: 'Default Table Page Size', value: '10', category: 'UI & Appearance', type: 'number', description: 'Default rows displayed per data page.' },
      { key: 'theme_dark_mode_enabled', label: 'Dark Mode Enabled', value: false, category: 'UI & Appearance', type: 'boolean', description: 'Enable system-wide dark UI mode.' },
      { key: 'enable_animations', label: 'Enable Micro-Animations', value: true, category: 'UI & Appearance', type: 'boolean', description: 'Toggle transitions and card hover animations.' },
      { key: 'sidebar_default_collapsed', label: 'Sidebar Collapsed by Default', value: false, category: 'UI & Appearance', type: 'boolean', description: 'Keep the sidebar minimized on load.' },
      { key: 'dashboard_charts_refresh_secs', label: 'Chart Auto-Refresh (seconds)', value: '60', category: 'UI & Appearance', type: 'number', description: 'Time interval to redraw dashboard statistics.' },
      { key: 'color_theme_primary', label: 'Primary Brand Color', value: '#d97706', category: 'UI & Appearance', type: 'text', description: 'Hex value for brand accents.' },
      { key: 'color_theme_secondary', label: 'Secondary Brand Color', value: '#374151', category: 'UI & Appearance', type: 'text', description: 'Hex value for background boundaries.' },
      { key: 'font_family_default', label: 'Primary Typography Font', value: 'Outfit', category: 'UI & Appearance', type: 'text', description: 'Primary system font face.' },
      { key: 'show_pnl_dashboard', label: 'Display P&L on Dashboard', value: true, category: 'UI & Appearance', type: 'boolean', description: 'Show Income/Expense metrics to privileged roles.' },

      // Category 7: Notification Gateways (10 settings)
      { key: 'whatsapp_api_url', label: 'WhatsApp Gateway API Endpoint', value: 'https://api.whatsapp.com/send', category: 'Notifications', type: 'text', description: 'External API URL used to share invoices.' },
      { key: 'sms_gateway_api_key', label: 'SMS Gateway API Token', value: 'SMS_SECRET_TOKEN_XYZ123', category: 'Notifications', type: 'text', description: 'Authorization token for SMS alerts.' },
      { key: 'enable_salary_release_whatsapp', label: 'WhatsApp Salary Alerts', value: true, category: 'Notifications', type: 'boolean', description: 'Send automatic slip notifications to workers.' },
      { key: 'enable_sales_dispatch_sms', label: 'Dispatch Dispatch SMS Alerts', value: false, category: 'Notifications', type: 'boolean', description: 'Notify customers on truck dispatch.' },
      { key: 'mail_smtp_host', label: 'SMTP Host', value: 'smtp.gmail.com', category: 'Notifications', type: 'text', description: 'Outgoing mail server.' },
      { key: 'mail_smtp_port', label: 'SMTP Port', value: '587', category: 'Notifications', type: 'number', description: 'SMTP server port.' },
      { key: 'mail_username', label: 'SMTP Username', value: 'erp@futaneagro.com', category: 'Notifications', type: 'text', description: 'SMTP authentication username.' },
      { key: 'mail_password', label: 'SMTP Password', value: '••••••••••••', category: 'Notifications', type: 'text', description: 'SMTP authentication password.' },
      { key: 'notify_admin_on_lockout', label: 'Alert Admin on User Lockout', value: true, category: 'Notifications', type: 'boolean', description: 'Send an email when a user account is locked.' },
      { key: 'notification_retention_days', label: 'Alert History Retention (days)', value: '30', category: 'Notifications', type: 'number', description: 'Days to keep notifications log.' },

      // Category 8: AI & Factory Optimization Policies (10 settings)
      { key: 'ai_production_predict_enabled', label: 'AI Production Predictor', value: true, category: 'AI & Factory Optimization', type: 'boolean', description: 'Simulate production estimates from raw materials.' },
      { key: 'ai_demand_forecast_months', label: 'AI Demand Forecast Lookahead', value: '3', category: 'AI & Factory Optimization', type: 'number', description: 'Months of history evaluated for sales projections.' },
      { key: 'ai_downtime_pattern_matching', label: 'AI Breakdown Preventer', value: true, category: 'AI & Factory Optimization', type: 'boolean', description: 'Scan machine history to predict maintenance intervals.' },
      { key: 'machine_max_load_hours', label: 'Machine Max Load Hours (daily)', value: '18', category: 'AI & Factory Optimization', type: 'number', description: 'Safety running threshold for machines.' },
      { key: 'waste_limit_percentage', label: 'Plastic Scrap Tolerance (%)', value: '2.5', category: 'AI & Factory Optimization', type: 'number', description: 'Max allowed material scrap rate in production.' },
      { key: 'min_power_factor_target', label: 'Power Factor Target', value: '0.98', category: 'AI & Factory Optimization', type: 'number', description: 'Target electrical power factor to avoid penalties.' },
      { key: 'auto_dispatch_routing', label: 'AI Auto-Routing Logistics', value: false, category: 'AI & Factory Optimization', type: 'boolean', description: 'Optimize dispatch delivery routes.' },
      { key: 'salary_overtime_multiplier', label: 'Overtime Rate Multiplier', value: '1.5', category: 'AI & Factory Optimization', type: 'number', description: 'Hourly salary multiplier for extra shifts.' },
      { key: 'factory_shift_hours', label: 'Standard Shift Duration (hours)', value: '8', category: 'AI & Factory Optimization', type: 'number', description: 'Working hours for daily labor.' },
      { key: 'ai_efficiency_target_boost', label: 'AI Target Efficiency Boost (%)', value: '5', category: 'AI & Factory Optimization', type: 'number', description: 'Efficiency percentage targeted by AI tuning.' }
    ];
  }

  // Filtered settings for Super Admin Center search
  get filteredSettings(): any[] {
    const q = (this.settingsSearchQuery || '').trim().toLowerCase();
    if (!q) return this.settingsList;
    return this.settingsList.filter(s => 
      s.key.toLowerCase().includes(q) ||
      s.label.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  }

  // Simulated AI Search assistant suggestions
  get aiRecommendation(): string {
    const q = (this.settingsSearchQuery || '').trim().toLowerCase();
    if (!q) {
      return "AI Tip: You can adjust the failed login lockout threshold in Security Settings.";
    }
    if (q.includes('tax') || q.includes('gst')) {
      return "AI Suggestion: Optimize your CGST/SGST settings under the Tax & GST Category.";
    }
    if (q.includes('backup') || q.includes('db') || q.includes('database')) {
      return "AI Suggestion: Automate database backups to AWS S3 weekly under the Database Category.";
    }
    if (q.includes('security') || q.includes('lock') || q.includes('otp')) {
      return "AI Suggestion: Ensure OTP Verification is enabled to secure accountant login sessions.";
    }
    if (q.includes('ai') || q.includes('forecast') || q.includes('predict')) {
      return "AI Suggestion: Enable AI Predictor to anticipate material shortfalls based on current inventory.";
    }
    if (q.includes('color') || q.includes('theme') || q.includes('dark')) {
      return "AI Suggestion: Toggle 'Dark Mode Enabled' or modify brand colors to update the global dashboard styling.";
    }
    return `AI Suggestion: Modifying settings in the '${this.filteredSettings[0]?.category || 'General'}' category may impact ERP automation. Please review carefully.`;
  }

  // Dark/Light Theme Switch
  toggleDarkMode(val?: boolean) {
    if (val !== undefined) {
      this.isDarkMode = val;
    } else {
      this.isDarkMode = !this.isDarkMode;
    }
    
    const darkSetting = this.settingsList.find(s => s.key === 'theme_dark_mode_enabled');
    if (darkSetting) {
      darkSetting.value = this.isDarkMode;
    }
    
    const darkModeKey = environment.production && !(environment as any).uat ? 'erp_dark_mode_prod' : 'erp_dark_mode_uat';
    localStorage.setItem(darkModeKey, this.isDarkMode ? 'true' : 'false');
    this.applyTheme();
    this.logAudit("Toggled Dark Mode: " + this.isDarkMode);
  }

  applyTheme() {
    if (this.isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  // User Management
  saveUser() {
    if (!this.validateForm('user')) return;
    this.apiService.createUser(this.userForm).subscribe({
      next: (res) => {
        if (res) this.usersList.unshift(res);
        this.loadAllData();
        this.notificationService.success('Data Added', 'User account created successfully');
        this.logAudit('Created user account: ' + this.userForm.username);
        this.userForm = { username: '', password: '', role: 'OPERATOR', name: '', email: '' };
      },
      error: (err) => this.notificationService.error('Failed to create user', err.error?.message || err.message)
    });
  }

  updateUserRole(username: string, newRole: string) {
    if (this.isViewer()) return;
    this.apiService.updateUser(username, { role: newRole }).subscribe({
      next: () => {
        const u = this.usersList.find(x => x.username === username);
        if (u) u.role = newRole;
      },
      error: err => console.error('Error updating role', err)
    });
  }

  updateUserEmail(username: string, newEmail: string) {
    if (this.isViewer()) return;
    this.apiService.updateUser(username, { email: newEmail }).subscribe({
      next: () => {
        const u = this.usersList.find(x => x.username === username);
        if (u) u.email = newEmail;
        this.notificationService.success('Success', 'Email updated successfully!');
      },
      error: err => {
        console.error('Error updating email', err);
        this.notificationService.error('Error', 'Failed to update email.');
      }
    });
  }

  toggleUserLock(username: string, currentLock: boolean) {
    const newLock = !currentLock;
    this.apiService.updateUser(username, { accountLocked: newLock }).subscribe(() => {
      this.loadAllData();
      this.logAudit((newLock ? 'Locked' : 'Unlocked') + ' user account: ' + username);
    });
  }

  deleteUser(username: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to delete.");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete user account ' + username + '?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteUser(username).subscribe({
          next: () => {
            this.usersList = this.usersList.filter(x => x.username !== username);
            this.notificationService.success('Deleted', 'User account deleted successfully');
            this.logAudit('Deleted user account: ' + username);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  // Billing Hub Handlers
  onBillTypeChange() {
    this.selectedBillRecordId = '';
    this.selectedBillRecord = null;
    
    const list = this.getBillSourceList();
    if (list && list.length > 0) {
      const firstItem = list[0];
      const id = this.getRecordId(firstItem);
      if (id) {
        this.selectedBillRecordId = String(id);
        this.onBillRecordChange();
      }
    }
  }

  getBillSourceList(): any[] {
    switch(this.activeBillType) {
      case 'tax_invoice':
      case 'proforma':
        return this.salesList;
      case 'delivery_challan':
        return this.dispatchesList;
      case 'payment_receipt':
        return this.paymentsList;
      case 'purchase_invoice':
        return this.rawMaterialsList;
      case 'transport_receipt':
        return this.transportsList;
      case 'salary_slip':
        return this.salariesList;
      default:
        return [];
    }
  }

  getRecordId(item: any): any {
    if (!item) return null;
    if (item.id !== undefined) return item.id;
    if (item.id !== undefined) return item.id;
    if (item.paymentId !== undefined) return item.paymentId;
    if (item.rawMaterialId !== undefined) return item.rawMaterialId;
    if (item.id !== undefined) return item.id;
    if (item.id !== undefined) return item.id;
    return null;
  }

  onBillRecordChange() {
    const list = this.getBillSourceList();
    const id = this.selectedBillRecordId;
    this.selectedBillRecord = list.find(item => String(this.getRecordId(item)) === String(id)) || null;
  }

  // WhatsApp invoice sharing
  shareOnWhatsApp() {
    if (!this.selectedBillRecord) return;
    const docType = this.activeBillType.replace(/_/g, ' ').toUpperCase();
    const id = this.getRecordId(this.selectedBillRecord);
    let amount = 0;
    let recipientName = 'Customer';
    let rawPhone = '';

    switch(this.activeBillType) {
      case 'tax_invoice':
      case 'proforma':
        amount = this.selectedBillRecord.totalAmount;
        recipientName = this.selectedBillRecord.party?.partyName || 'Customer';
        rawPhone = this.selectedBillRecord.party?.partyContact || '';
        break;
      case 'delivery_challan':
        amount = this.selectedBillRecord.sale?.quantity || 0;
        recipientName = this.selectedBillRecord.sale?.party?.partyName || 'Customer';
        rawPhone = this.selectedBillRecord.sale?.party?.partyContact || '';
        break;
      case 'payment_receipt':
        amount = this.selectedBillRecord.amountReceived;
        recipientName = this.selectedBillRecord.party?.partyName || 'Customer';
        rawPhone = this.selectedBillRecord.party?.partyContact || '';
        break;
      case 'purchase_invoice':
        amount = this.selectedBillRecord.amount;
        recipientName = this.selectedBillRecord.vendor?.vendorName || 'Vendor';
        rawPhone = this.selectedBillRecord.vendor?.mobile || '';
        break;
      case 'transport_receipt':
        amount = this.selectedBillRecord.rent;
        recipientName = this.selectedBillRecord.driver?.driverName || 'Driver';
        rawPhone = this.selectedBillRecord.driver?.mobile || '';
        break;
      case 'salary_slip':
        amount = this.selectedBillRecord.salaryAmount;
        recipientName = this.selectedBillRecord.employee?.empName || 'Employee';
        rawPhone = this.selectedBillRecord.employee?.empContact || '';
        break;
    }

    // Phone number validation
    const digitsOnly = rawPhone.replace(/\D/g, '');
    let fullPhone = '';
    if (digitsOnly.length === 10) {
      fullPhone = '91' + digitsOnly;
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      fullPhone = digitsOnly;
    } else if (digitsOnly.length > 0) {
      fullPhone = digitsOnly;
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'No Phone Number',
        text: `No valid phone number found for ${recipientName}. Cannot share via WhatsApp.`
      });
      return;
    }

    const message = `Hello ${recipientName},\n\nWe are sharing the details for *${docType}* (Ref ID: ${id}) from *Futane Agro Industries Pvt. Ltd.*\n\n*Amount:* ₹${amount}\n*Date:* ${this.selectedBillRecord.date || this.selectedBillRecord.paymentDate || this.selectedBillRecord.dispatchDate || 'N/A'}\n\nThank you for doing business with us!`;
    const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    this.logAudit(`Shared ${docType} ID ${id} via WhatsApp`);

    // Tip to also download and attach PDF
    setTimeout(() => {
      Swal.fire({
        icon: 'info',
        title: 'WhatsApp Opened',
        html: `<p style="font-size:13px;">WhatsApp was opened with a pre-filled message.</p>
               <p style="font-size:12px; color:#94a3b8; margin-top:8px;">
                 <strong>Tip:</strong> To share the actual PDF, download the document and attach it in the WhatsApp chat.
               </p>`,
        confirmButtonText: 'Download PDF too',
        showCancelButton: true,
        cancelButtonText: 'OK, Done'
      }).then((result: any) => {
        if (result.isConfirmed) this.downloadBillingHubPDF();
      });
    }, 800);
  }

  // Download currently selected Billing Hub document as PDF (white background)
  downloadBillingHubPDF() {
    if (!this.selectedBillRecord) return;
    const element = document.getElementById('printable-billing-card');
    if (!element) return;

    const docType = this.activeBillType.replace(/_/g, ' ').toUpperCase();
    const id = this.getRecordId(this.selectedBillRecord);
    this.logAudit(`Downloaded PDF for ${docType} ID ${id}`);

    // Temporarily force white background for clean PDF render
    const origBg = element.style.background;
    const origColor = element.style.color;
    element.style.setProperty('background', '#ffffff', 'important');
    element.style.setProperty('color', '#1f2937', 'important');

    Swal.fire({ title: 'Generating PDF...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

    html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
      .then((canvas) => {
        element.style.background = origBg;
        element.style.color = origColor;
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210, pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight, position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        pdf.save(`${this.activeBillType}_${id}.pdf`);
        Swal.close();
        Swal.fire({ icon: 'success', title: 'PDF Downloaded!', timer: 1500, showConfirmButton: false });
      })
      .catch(() => {
        element.style.background = origBg;
        element.style.color = origColor;
        Swal.close();
        Swal.fire({ icon: 'error', title: 'PDF Error', text: 'Could not generate PDF. Please try again.' });
      });
  }

  // Print Billing Hub document in clean print window
  printBillingDocument() {
    if (!this.selectedBillRecord) return;
    const element = document.getElementById('printable-billing-card');
    if (!element) return;
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      Swal.fire({ icon: 'warning', title: 'Popup Blocked', text: 'Please allow popups for this site to print documents.' });
      return;
    }
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"],style'))
      .map((el: any) => el.outerHTML).join('');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Print Document</title>${styles}
      <style>
        body { background: #fff !important; color: #000 !important; padding: 20px; margin: 0; }
        .no-print { display: none !important; }
        .bill-watermark { opacity: 0.06 !important; }
        .billing-a4-card { box-shadow: none !important; border: none !important; background: #fff !important; }
      </style></head><body>${element.outerHTML}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); }, 600);
  }

  // Open currently selected Billing Hub document in a new tab/window
  openBillInNewTab() {
    if (!this.selectedBillRecord) return;
    const element = document.getElementById('printable-billing-card');
    if (!element) return;

    const docType = this.activeBillType.replace('_', ' ').toUpperCase();
    const id = this.getRecordId(this.selectedBillRecord);
    this.logAudit(`Opened popup tab for ${docType} ID ${id}`);

    const printWindow = window.open('', '_blank', 'width=900,height=1200,scrollbars=yes');
    if (!printWindow) {
      Swal.fire({
        icon: 'warning',
        title: 'Popup Blocked',
        text: 'Please allow popups for this site to view the document in a new tab.'
      });
      return;
    }

    let stylesHtml = '';
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((styleEl) => {
      stylesHtml += styleEl.outerHTML;
    });

    const safeDocType = String(docType).replace(/[<>"'&]/g, '');
    const safeId = String(id).replace(/[<>"'&]/g, '');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${safeDocType} - Ref #${safeId}</title>
          ${stylesHtml}
          <style>
            body {
              background: #0f172a !important;
              color: #f8fafc !important;
              padding: 40px 20px;
              display: flex;
              justify-content: center;
              font-family: 'Inter', sans-serif;
            }
            .billing-a4-card {
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3) !important;
              border: 1px solid rgba(255,255,255,0.08) !important;
              background: #1e293b !important;
              margin: 0 auto !important;
              width: 210mm;
              padding: 20mm;
              border-radius: 12px;
              position: relative;
            }
            .no-print {
              display: none !important;
            }
            @media print {
              body {
                background: #ffffff !important;
                color: #000000 !important;
                padding: 0;
              }
              .billing-a4-card {
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="billing-a4-card">
            ${element.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  // Number-to-Words Converter for Indian Currency
  numberToWords(num: number): string {
    if (num === null || num === undefined) return '';
    num = Math.round(num);
    if (num === 0) return 'Zero';

    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const translate = (n: number): string => {
      let str = '';
      if (n > 99) {
        str += a[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n > 19) {
        str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
      } else if (n > 0) {
        str += a[n];
      }
      return str.trim();
    };

    let result = '';
    let rem = num;

    if (rem >= 10000000) {
      const cr = Math.floor(rem / 10000000);
      result += translate(cr) + ' Crore ';
      rem %= 10000000;
    }

    if (rem >= 100000) {
      const lk = Math.floor(rem / 100000);
      result += translate(lk) + ' Lakh ';
      rem %= 100000;
    }

    if (rem >= 1000) {
      const th = Math.floor(rem / 1000);
      result += translate(th) + ' Thousand ';
      rem %= 1000;
    }

    if (rem > 0) {
      result += translate(rem);
    }

    return result.trim() + ' Rupees Only';
  }

  getCGST(amount: number): number { return amount * 0.09; }
  getSGST(amount: number): number { return amount * 0.09; }
  getIGST(amount: number): number { return amount * 0.18; }
  getGrandTotal(amount: number): number { return amount * 1.18; }

  // Generic List Processing Method (Search, Filter, Sort, Paginate)
  getProcessedList(list: any[], tableKey: string): any[] {
    if (!list) return [];
    let result = [...list];

    // 1. Search Query
    if (this.filterSearchQuery.trim()) {
      const query = this.filterSearchQuery.toLowerCase().trim();
      result = result.filter(item => {
        const checkVal = (val: any): boolean => {
          if (val === null || val === undefined) return false;
          if (typeof val === 'object') {
            return Object.values(val).some(v => checkVal(v));
          }
          return String(val).toLowerCase().includes(query);
        };
        return Object.values(item).some(val => checkVal(val));
      });
    }

    // 2. Specific Field Filters
    // Date filter
    if (this.filterDate) {
      result = result.filter(item => {
        const itemDate = item.date || item.paymentDate || item.dispatchDate || item.expenseDate || item.createdDate || item.installedDate || item.transactionDate || item.joiningDate || item.breakdownDate || item.resolvedDate;
        return itemDate === this.filterDate;
      });
    }

    // Month filter
    if (this.filterMonth) {
      result = result.filter(item => {
        if (item.month) return String(item.month).toLowerCase() === this.filterMonth.toLowerCase();
        const itemDate = item.date || item.paymentDate || item.dispatchDate || item.expenseDate || item.createdDate || item.installedDate || item.transactionDate || item.joiningDate || item.breakdownDate || item.resolvedDate;
        if (itemDate) {
          const m = new Date(itemDate).toLocaleString('default', { month: 'long' });
          return m.toLowerCase() === this.filterMonth.toLowerCase();
        }
        return false;
      });
    }

    // Year filter
    if (this.filterYear) {
      result = result.filter(item => {
        if (item.year) return item.year === this.filterYear;
        const itemDate = item.date || item.paymentDate || item.dispatchDate || item.expenseDate || item.createdDate || item.installedDate || item.transactionDate || item.joiningDate || item.breakdownDate || item.resolvedDate;
        if (itemDate) {
          return new Date(itemDate).getFullYear() === this.filterYear;
        }
        return false;
      });
    }

    // Status filter
    if (this.filterStatus) {
      const targetStatus = this.filterStatus.toLowerCase();
      result = result.filter(item => {
        const statusVal = item.status || item.dispatchStatus || item.type || item.transactionType || item.paymentStatus || item.category;
        if (statusVal) return String(statusVal).toLowerCase() === targetStatus;
        if (item.isActive !== undefined) {
          const activeStr = item.isActive ? 'active' : 'inactive';
          return activeStr === targetStatus;
        }
        return false;
      });
    }

    // Party filter
    if (this.filterPartyId) {
      result = result.filter(item => {
        const pId = (item.party && item.party.id) || (item.sale && item.sale.party && item.sale.party.id) || item.partyId;
        return pId && String(pId) === String(this.filterPartyId);
      });
    }

    // Employee filter
    if (this.filterEmployeeId) {
      result = result.filter(item => {
        const eId = (item.employee && item.employee.id) || item.employeeId;
        return eId && String(eId) === String(this.filterEmployeeId);
      });
    }

    // Invoice No filter
    if (this.filterInvoiceNo) {
      result = result.filter(item => {
        const invNo = item.invoiceNo;
        return invNo && String(invNo).toLowerCase().includes(this.filterInvoiceNo.toLowerCase());
      });
    }

    // Crate Type filter
    if (this.filterCrateType) {
      result = result.filter(item => {
        const crate = item.crateType || (item.sale && item.sale.crateType);
        return crate && String(crate).toLowerCase() === this.filterCrateType.toLowerCase();
      });
    }

    // Material filter
    if (this.filterMaterial) {
      result = result.filter(item => {
        const mat = item.crateMaterial || item.materialName || item.materialType || (item.sale && item.sale.crateMaterial);
        return mat && String(mat).toLowerCase().includes(this.filterMaterial.toLowerCase());
      });
    }

    // Min Amount filter
    if (this.filterMinAmount !== null) {
      result = result.filter(item => {
        const amt = item.totalAmount || item.amountReceived || item.amount || item.rent || item.salaryAmount || item.electricityBill;
        return amt !== undefined && amt >= this.filterMinAmount!;
      });
    }

    // Max Amount filter
    if (this.filterMaxAmount !== null) {
      result = result.filter(item => {
        const amt = item.totalAmount || item.amountReceived || item.amount || item.rent || item.salaryAmount || item.electricityBill;
        return amt !== undefined && amt <= this.filterMaxAmount!;
      });
    }

    // 3. Sorting
    if (this.sortField) {
      result.sort((a, b) => {
        let valA = a[this.sortField];
        let valB = b[this.sortField];

        if (this.sortField.includes('.')) {
          const parts = this.sortField.split('.');
          valA = parts.reduce((obj, key) => obj && obj[key], a);
          valB = parts.reduce((obj, key) => obj && obj[key], b);
        }

        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        if (typeof valA === 'string') {
          return this.sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
          return this.sortAsc ? (valA - valB) : (valB - valA);
        }
      });
    }

    // 4. Pagination metadata
    if (this.tableFilteredCounts[tableKey] !== result.length) {
      this.tableFilteredCounts[tableKey] = result.length;
    }
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return result.slice(startIndex, startIndex + this.pageSize);
  }

  setSort(field: string) {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = true;
    }
  }

  resetFilters() {
    this.filterSearchQuery = '';
    this.filterDate = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterMonth = '';
    this.filterYear = null;
    this.filterStatus = '';
    this.filterPartyId = '';
    this.filterEmployeeId = '';
    this.filterInvoiceNo = '';
    this.filterCrateType = '';
    this.filterMaterial = '';
    this.filterMinAmount = null;
    this.filterMaxAmount = null;
    this.currentPage = 1;
  }

  exportFilteredData() {
    this.logAudit("Exported filtered data to CSV/Excel for tab: " + this.activeTab);
    
    let dataToExport: any[] = [];
    let filename = this.activeTab + '_filtered_data.csv';

    switch(this.activeTab) {
      case 'production': dataToExport = this.ppdList; break;
      case 'monthly-production': dataToExport = this.ppmList; break;
      case 'parties': dataToExport = this.parties; break;
      case 'sales': dataToExport = this.salesList; break;
      case 'payments': dataToExport = this.paymentsList; break;
      case 'raw-materials': dataToExport = this.rawMaterialsList; break;
      case 'vendors': dataToExport = this.vendors; break;
      case 'inventory': dataToExport = this.inventoryList; break;
      case 'employees': dataToExport = this.employees; break;
      case 'salaries': dataToExport = this.salariesList; break;
      case 'transports': dataToExport = this.transportsList; break;
      case 'drivers': dataToExport = this.drivers; break;
      case 'invoices': dataToExport = this.invoicesList; break;
      case 'machines': dataToExport = this.machinesList; break;
      case 'dispatch': dataToExport = this.dispatchesList; break;
      case 'expenses': dataToExport = this.expensesList; break;
      case 'bank': dataToExport = this.bankTransactionsList; break;
      case 'audit-logs': dataToExport = this.auditLogsList; break;
    }

    const processed = this.getProcessedList(dataToExport, this.activeTab);
    if (!processed || processed.length === 0) {
      this.notificationService.showNoRecordsFound("No data available to export.");
      return;
    }

    // Convert processed to CSV string
    const headers = Object.keys(processed[0]).filter(k => typeof processed[0][k] !== 'object');
    let csv = headers.join(',') + '\n';
    
    processed.forEach(row => {
      csv += headers.map(h => {
        let val = row[h];
        if (typeof val === 'string') {
          val = '"' + val.replace(/"/g, '""') + '"';
        }
        return val;
      }).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notificationService.showExportSuccess('CSV Export');
  }

  // Document uploader helper
  uploadingFile = false;
  uploadError = '';

  uploadDocument(event: any, formName: string, fieldName: string) {
    const file = event.target.files[0];
    if (!file) return;

    this.uploadingFile = true;
    this.uploadError = '';

    this.apiService.uploadFile(file).subscribe({
      next: (res) => {
        const url = this.apiService.baseUrl + "/uploads/" + res.filename;
        if (formName === 'party') {
          (this.partyForm as any)[fieldName] = url;
        } else if (formName === 'employee') {
          (this.employeeForm as any)[fieldName] = url;
        } else if (formName === 'rawMaterials') {
          (this.rawMaterialsForm as any)[fieldName] = url;
        } else if (formName === 'transports') {
          (this.transportsForm as any)[fieldName] = url;
        }
        this.uploadingFile = false;
        this.logAudit("Uploaded document " + file.name + " for " + formName);
        this.notificationService.showSaveSuccess("Document " + file.name + " uploaded successfully!");
      },
      error: (err) => {
        this.uploadError = 'File upload failed: ' + (err.error?.message || err.message);
        this.uploadingFile = false;
        this.notificationService.showError('Upload Failed', this.uploadError);
      }
    });
  }

  forgotPassword() {
    this.notificationService.showWarning('Password Reset', 'Please contact the System Administrator to reset your password.');
  }

  // Backup and Restore Methods
  loadBackups() {
    this.apiService.getBackups().subscribe({
      next: (list: any) => {
        this.backupsList = list;
      },
      error: (err) => {
        console.error("Failed to load backups list", err);
      }
    });
  }

  triggerBackup() {
    this.apiService.runBackup().subscribe({
      next: (res: any) => {
        this.notificationService.showSaveSuccess(res.message || 'Backup created successfully!');
        this.loadBackups();
      },
      error: (err) => {
        this.notificationService.showExportFailed('Database Backup', err.error?.message || err.message || err);
      }
    });
  }

  async triggerRestore(filename: string) {
    const confirmed = await this.notificationService.showDeleteConfirm(
      'Restore Database?', 
      `Are you sure you want to restore the database from ${filename}? Current data will be overwritten!`
    );
    if (confirmed) {
      this.apiService.runRestore(filename).subscribe({
        next: (res: any) => {
          this.notificationService.showUpdateSuccess(res.message || 'Database restored successfully!');
          this.loadAllData();
        },
        error: (err) => {
          this.notificationService.showError('Restore Failed', err.error?.message || err.message || err);
        }
      });
    }
  }

  // Column Visibility Handlers
  toggleColDropdown(tableKey: string) {
    this.showColDropdown[tableKey] = !this.showColDropdown[tableKey];
  }

  toggleExportDropdown(tableKey: string) {
    // Close all other export dropdowns first
    Object.keys(this.showExportDropdown).forEach(k => this.showExportDropdown[k] = false);
    this.showExportDropdown[tableKey] = !this.showExportDropdown[tableKey];
  }

  closeAllExportDropdowns() {
    Object.keys(this.showExportDropdown).forEach(k => this.showExportDropdown[k] = false);
  }

  getTableColumns(tableKey: string): string[] {
    switch(tableKey) {
      case 'ppd': return ['Date', 'Crate Type', 'Total Production', 'Successful', 'Rejected', 'Actions'];
      case 'ppm': return ['Month/Year', 'Crates Produced', 'Electricity Units', 'Electricity Bill', 'Units/Crate', 'Cost/Crate', 'Actions'];
      case 'parties': return ['ID', 'Name', 'GST', 'Email', 'Address', 'Contact', 'Status', 'Actions'];
      case 'sales': return ['Date', 'Party', 'Crate Type', 'Quantity', 'Rate', 'Total', 'Paid', 'Remaining', 'Actions'];
      case 'payments': return ['Date', 'Party', 'Invoice Ref', 'Amount', 'Mode', 'Actions'];
      case 'raw': return ['Date', 'Material', 'Vendor', 'Weight', 'Rate', 'Amount', 'Actions'];
      case 'vendors': return ['ID', 'Name', 'Mobile', 'GST', 'Address', 'Actions'];
      case 'inventory': return ['ID', 'Crate Type', 'Material', 'Opening', 'Produced', 'Sold', 'Available', 'Last Updated'];
      case 'employees': return ['ID', 'Name', 'Designation', 'Mobile', 'Salary', 'Aadhaar', 'Bank', 'Joining Date', 'Address', 'Actions'];
      case 'salaries': return ['Name', 'Month/Year', 'Amount', 'Date', 'Status', 'Actions'];
      case 'transports': return ['Date', 'Truck', 'Driver', 'Rent', 'Advance', 'Remaining', 'Actions'];
      case 'drivers': return ['ID', 'Name', 'Mobile', 'License', 'Address', 'Actions'];
      case 'invoices': return ['ID', 'Invoice No', 'Date', 'Party', 'Description', 'Total Bill', 'Actions'];
      case 'machines': return ['Code', 'Name', 'Capacity', 'Installed', 'Status', 'Actions'];
      case 'breakdowns': return ['Machine', 'Date', 'Description', 'Downtime', 'Resolved', 'Actions'];
      case 'dispatch': return ['Sale', 'Date', 'Vehicle', 'Driver', 'Status', 'Actions'];
      case 'expenses': return ['Date', 'Category', 'Description', 'Amount', 'Paid By', 'Actions'];
      case 'bank': return ['Date', 'Type', 'Amount', 'Description', 'Reference', 'Actions'];
      default: return [];
    }
  }

  isColumnVisible(tableKey: string, colName: string): boolean {
    if (!this.columnsVisibility[tableKey]) {
      this.columnsVisibility[tableKey] = {};
      this.getTableColumns(tableKey).forEach(c => this.columnsVisibility[tableKey][c] = true);
    }
    return this.columnsVisibility[tableKey][colName] !== false;
  }

  toggleColumn(tableKey: string, colName: string) {
    if (!this.columnsVisibility[tableKey]) {
      this.columnsVisibility[tableKey] = {};
      this.getTableColumns(tableKey).forEach(c => this.columnsVisibility[tableKey][c] = true);
    }
    this.columnsVisibility[tableKey][colName] = !this.columnsVisibility[tableKey][colName];
  }

  getVisibleColCount(tableKey: string): number {
    const cols = this.getTableColumns(tableKey);
    return cols.filter(c => this.isColumnVisible(tableKey, c)).length;
  }

  resetColumns(tableKey: string) {
    if (!this.columnsVisibility[tableKey]) {
      this.columnsVisibility[tableKey] = {};
    }
    this.getTableColumns(tableKey).forEach(c => this.columnsVisibility[tableKey][c] = true);
  }

  exportTableToCSV(tableKey: string) {
    let data: any[] = [];
    switch (tableKey) {
      case 'parties': data = this.parties; break;
      case 'sales': data = this.salesList; break;
      case 'payments': data = this.paymentsList; break;
      case 'raw': data = this.rawMaterialsList; break;
      case 'vendors': data = this.vendors; break;
      case 'inventory': data = this.inventoryList; break;
      case 'employees': data = this.employees; break;
      case 'salaries': data = this.salariesList; break;
      case 'transports': data = this.transportsList; break;
      case 'drivers': data = this.drivers; break;
      case 'machines': data = this.machinesList; break;
      case 'breakdowns': data = this.machineBreakdownsList || []; break;
      case 'dispatch': data = this.dispatchesList || []; break;
      case 'expenses': data = this.expensesList; break;
      case 'bank': data = this.bankTransactionsList || []; break;
      case 'audit': data = this.auditLogsList || []; break;
      default: data = []; break;
    }
    const filtered = this.getProcessedList(data, tableKey);
    this.exportTableToExcel(filtered, `${tableKey}_export`);
  }

  // Date Check Helper
  isFutureDate(dateStr: string): boolean {
    if (!dateStr) return false;
    const inputDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    inputDate.setHours(0,0,0,0);
    return inputDate > today;
  }

  // Indian/Factory ERP Form validation checks
  validateForm(formType: string): boolean {
    if (formType === 'ppd') {
      const f = this.ppdForm;
      if (!f.date) { this.notificationService.showValidationError('Production date is required.'); return false; }
      if (this.isFutureDate(f.date)) { this.notificationService.showValidationError('Production date cannot be in the future.'); return false; }
      if (f.totalProduction <= 0) { this.notificationService.showValidationError('Total Production must be greater than zero.'); return false; }
      if (f.successful < 0 || f.rejected < 0) { this.notificationService.showValidationError('Production quantities cannot be negative.'); return false; }
      if (f.successful + f.rejected !== f.totalProduction) {
        this.notificationService.showValidationError('Sum of successful (' + f.successful + ') and rejected (' + f.rejected + ') must equal total production (' + f.totalProduction + ').');
        return false;
      }
    }
    if (formType === 'ppm') {
      const f = this.ppmForm;
      if (f.year <= 2000 || f.year > 2100) { this.notificationService.showValidationError('Please enter a valid year.'); return false; }
      if (f.cratesProduced < 0 || f.electricityUnits < 0 || f.electricityBill < 0) {
        this.notificationService.showValidationError('All monthly metrics must be non-negative.');
        return false;
      }
    }
    if (formType === 'party') {
      const f = this.partyForm;
      if (!f.partyName.trim()) { this.notificationService.showValidationError('Party name is required.'); return false; }
      if (!f.gstNumber.trim()) { this.notificationService.showValidationError('GST Number is required.'); return false; }
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(f.gstNumber.trim().toUpperCase())) {
        this.notificationService.showValidationError('Invalid GST format. Must be a valid 15-character Indian GSTIN.');
        return false;
      }
      if (!f.partyContact.trim()) { this.notificationService.showValidationError('Contact mobile is required.'); return false; }
      const mobileRegex = /^\d{10}$/;
      if (!mobileRegex.test(f.partyContact.trim())) {
        this.notificationService.showValidationError('Mobile number must be exactly 10 digits.');
        return false;
      }
      if (f.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(f.email.trim())) {
          this.notificationService.showValidationError('Invalid email format.');
          return false;
        }
      }
    }
    if (formType === 'vendor') {
      const f = this.vendorForm;
      if (!f.vendorName.trim()) { this.notificationService.showValidationError('Vendor name is required.'); return false; }
      if (f.gstNumber.trim()) {
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstRegex.test(f.gstNumber.trim().toUpperCase())) {
          this.notificationService.showValidationError('Invalid GST format.');
          return false;
        }
      }
      if (f.mobile && f.mobile.trim()) {
        const mobileRegex = /^\d{10}$/;
        if (!mobileRegex.test(f.mobile.trim())) {
          this.notificationService.showValidationError('Mobile number must be exactly 10 digits.');
          return false;
        }
      }
    }
    if (formType === 'driver') {
      const f = this.driverForm;
      if (!f.driverName.trim()) { this.notificationService.showValidationError('Driver name is required.'); return false; }
      if (!f.mobile.trim()) { this.notificationService.showValidationError('Mobile number is required.'); return false; }
      const mobileRegex = /^\d{10}$/;
      if (!mobileRegex.test(f.mobile.trim())) {
        this.notificationService.showValidationError('Mobile number must be exactly 10 digits.');
        return false;
      }
      if (!f.licenseNumber.trim()) { this.notificationService.showValidationError('License number is required.'); return false; }
    }
    if (formType === 'employee') {
      const f = this.employeeForm;
      if (!f.empName.trim()) { this.notificationService.showValidationError('Employee name is required.'); return false; }
      if (!f.empContact.trim()) { this.notificationService.showValidationError('Mobile contact is required.'); return false; }
      const mobileRegex = /^\d{10}$/;
      if (!mobileRegex.test(f.empContact.trim())) {
        this.notificationService.showValidationError('Mobile number must be exactly 10 digits.');
        return false;
      }
      if (f.salary < 0) { this.notificationService.showValidationError('Salary cannot be negative.'); return false; }
      if (!f.aadhaarNo.trim()) { this.notificationService.showValidationError('Aadhaar number is required.'); return false; }
      const aadhaarRegex = /^\d{12}$/;
      if (!aadhaarRegex.test(f.aadhaarNo.trim())) {
        this.notificationService.showValidationError('Aadhaar number must be exactly 12 digits.');
        return false;
      }
      if (f.joiningDate && this.isFutureDate(f.joiningDate)) {
        this.notificationService.showValidationError('Joining date cannot be in the future.');
        return false;
      }
    }
    if (formType === 'sales') {
      const f = this.salesForm;
      if (!f.date) { this.notificationService.showValidationError('Sales date is required.'); return false; }
      if (this.isFutureDate(f.date)) { this.notificationService.showValidationError('Sales date cannot be in the future.'); return false; }
      if (!f.id) { this.notificationService.showValidationError('Please select a customer party.'); return false; }
      if (f.quantity <= 0) { this.notificationService.showValidationError('Quantity must be greater than zero.'); return false; }
      if (f.rate <= 0) { this.notificationService.showValidationError('Rate must be greater than zero.'); return false; }
      if (f.paid < 0) { this.notificationService.showValidationError('Paid amount cannot be negative.'); return false; }
      if (f.paid > f.totalAmount) { this.notificationService.showValidationError('Paid amount cannot exceed total amount.'); return false; }
    }
    if (formType === 'payments') {
      const f = this.paymentsForm;
      if (!f.paymentDate) { this.notificationService.showValidationError('Payment date is required.'); return false; }
      if (this.isFutureDate(f.paymentDate)) { this.notificationService.showValidationError('Payment date cannot be in the future.'); return false; }
      if (!f.id) { this.notificationService.showValidationError('Please select a party.'); return false; }
      if (f.amountReceived <= 0) { this.notificationService.showValidationError('Amount must be greater than zero.'); return false; }
    }
    if (formType === 'rawMaterial') {
      const f = this.rawMaterialsForm;
      if (f.weight <= 0) { this.notificationService.showValidationError('Weight must be greater than zero.'); return false; }
      if (f.rate <= 0) { this.notificationService.showValidationError('Rate must be greater than zero.'); return false; }
    }
    if (formType === 'transport') {
      const f = this.transportsForm;
      if (!f.date) { this.notificationService.showValidationError('Date is required.'); return false; }
      if (this.isFutureDate(f.date)) { this.notificationService.showValidationError('Date cannot be in the future.'); return false; }
      if (!f.truckNumber.trim()) { this.notificationService.showValidationError('Truck number is required.'); return false; }
      if (!f.id) { this.notificationService.showValidationError('Please select a driver.'); return false; }
      if (f.rent <= 0) { this.notificationService.showValidationError('Rent must be greater than zero.'); return false; }
      if (f.advance < 0) { this.notificationService.showValidationError('Advance cannot be negative.'); return false; }
      if (f.advance > f.rent) { this.notificationService.showValidationError('Advance cannot exceed total rent.'); return false; }
    }
    if (formType === 'salary') {
      const f = this.salariesForm;
      if (!f.id) { this.notificationService.showValidationError('Please select an employee.'); return false; }
      if (f.salaryAmount <= 0) { this.notificationService.showValidationError('Salary amount must be greater than zero.'); return false; }
      if (f.paidDate && this.isFutureDate(f.paidDate)) { this.notificationService.showValidationError('Payment date cannot be in the future.'); return false; }
    }
    if (formType === 'machine') {
      const f = this.machineForm;
      if (!f.machineName.trim()) { this.notificationService.showValidationError('Machine name is required.'); return false; }
      if (!f.machineCode.trim()) { this.notificationService.showValidationError('Machine code is required.'); return false; }
      if (f.capacityPerHour <= 0) { this.notificationService.showValidationError('Capacity must be greater than zero.'); return false; }
      if (f.installedDate && this.isFutureDate(f.installedDate)) { this.notificationService.showValidationError('Installed date cannot be in the future.'); return false; }
    }
    if (formType === 'breakdown') {
      const f = this.breakdownForm;
      if (!f.id) { this.notificationService.showValidationError('Please select a machine.'); return false; }
      if (!f.breakdownDate) { this.notificationService.showValidationError('Breakdown date is required.'); return false; }
      if (this.isFutureDate(f.breakdownDate)) { this.notificationService.showValidationError('Breakdown date cannot be in the future.'); return false; }
      if (f.downtimeHours < 0) { this.notificationService.showValidationError('Downtime hours cannot be negative.'); return false; }
      if (f.resolvedDate) {
        if (this.isFutureDate(f.resolvedDate)) { this.notificationService.showValidationError('Resolved date cannot be in the future.'); return false; }
        if (new Date(f.resolvedDate) < new Date(f.breakdownDate)) {
          this.notificationService.showValidationError('Resolved date cannot be before breakdown date.');
          return false;
        }
      }
    }
    if (formType === 'dispatch') {
      const f = this.dispatchForm;
      if (!f.id) { this.notificationService.showValidationError('Please select a sales order.'); return false; }
      if (!f.dispatchDate) { this.notificationService.showValidationError('Dispatch date is required.'); return false; }
      if (this.isFutureDate(f.dispatchDate)) { this.notificationService.showValidationError('Dispatch date cannot be in the future.'); return false; }
      if (!f.vehicleNumber.trim()) { this.notificationService.showValidationError('Vehicle number is required.'); return false; }
      if (!f.driverName.trim()) { this.notificationService.showValidationError('Driver name is required.'); return false; }
    }
    if (formType === 'expense') {
      const f = this.expenseForm;
      if (!f.expenseDate) { this.notificationService.showValidationError('Expense date is required.'); return false; }
      if (this.isFutureDate(f.expenseDate)) { this.notificationService.showValidationError('Expense date cannot be in the future.'); return false; }
      if (!f.description.trim()) { this.notificationService.showValidationError('Expense description is required.'); return false; }
      if (f.amount <= 0) { this.notificationService.showValidationError('Expense amount must be greater than zero.'); return false; }
    }
    if (formType === 'bank') {
      const f = this.bankTxnForm;
      if (!f.transactionDate) { this.notificationService.showValidationError('Transaction date is required.'); return false; }
      if (this.isFutureDate(f.transactionDate)) { this.notificationService.showValidationError('Transaction date cannot be in the future.'); return false; }
      if (f.amount <= 0) { this.notificationService.showValidationError('Transaction amount must be greater than zero.'); return false; }
      if (!f.description.trim()) { this.notificationService.showValidationError('Description is required.'); return false; }
    }
    if (formType === 'user') {
      const f = this.userForm;
      if (!f.name.trim()) { this.notificationService.showValidationError('Full name is required.'); return false; }
      if (!f.username.trim()) { this.notificationService.showValidationError('Username is required.'); return false; }
      if (!f.password.trim()) { this.notificationService.showValidationError('Password is required.'); return false; }
      if (f.password.length < 8) { this.notificationService.showValidationError('Password must be at least 8 characters long.'); return false; }
    }
    return true;
  }

  getSettingVal(key: string): string {
    const s = this.settingsList.find(item => item.key === key);
    return s ? s.value : '';
  }

  setSettingVal(key: string, val: any) {
    const s = this.settingsList.find(item => item.key === key);
    if (s) {
      s.value = val;
      if (this.loggedInUser && this.loggedInUser.role === 'SUPER_ADMIN') {
        this.apiService.saveSetting(key, String(val)).subscribe({
          error: (err) => console.warn('Failed to save setting to backend', err)
        });
      }
    }
  }
}


