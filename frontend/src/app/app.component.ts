import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from './api.service';
import { TranslateService, Language, TranslatePipe } from './translate.service';
import { Chart, registerables } from 'chart.js';
import { jsPDF } from 'jspdf';
import { environment } from '../environments/environment';

Chart.register(...registerables);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent implements OnInit {
  title = 'Futane Agro ERP';

  // Expose Math helper for template calls
  Math = Math;

  // Environment State
  isProduction = environment.production;
  isUat = environment.uat;

  // Generic Filter, Sort & Search State
  filterSearchQuery = '';
  filterDate = '';
  filterMonth = '';
  filterYear: number | null = null;
  filterStatus = '';
  filterPartyId = '';
  filterEmployeeId = '';
  filterInvoiceNo = '';
  filterCrateType = '';
  filterMaterial = '';
  filterMinAmount: number | null = null;
  filterMaxAmount: number | null = null;

  sortField = '';
  sortAsc = true;

  currentPage = 1;
  pageSize = 10;

  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};
  backupsList: any[] = [];
  showFilters = false;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};

  // Auth State
  isAuthenticated = false;
  loggedInUser: any = null;
  loginError = '';
  loginCredentials = { username: '', password: '' };

  // UI Tabs State
  activeTab = 'dashboard';
  accessibleTabs: { [key: string]: boolean } = {};

  // Idle Timer
  private readonly IDLE_TIMEOUT = 120000; // 2 minutes in ms
  lastActivityTime = Date.now();
  logoutCountdown = '';
  computedNetProfit = 0;


  // Excel Upload State
  excelFile: File | null = null;
  uploadStatus = '';

  // Database lists
  stats: any = {};
  parties: any[] = [];
  vendors: any[] = [];
  drivers: any[] = [];
  employees: any[] = [];
  ppdList: any[] = [];
  ppmList: any[] = [];
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
  salesForm = { date: '', partyId: '', crateType: 'Apple Crate', crateMaterial: 'Plastic', quantity: 0, rate: 0, totalAmount: 0, paid: 0, remaining: 0 };
  paymentsForm = { partyId: '', invoiceNo: '', amountReceived: 0, paymentMode: 'UPI', paymentDate: '' };
  rawMaterialsForm = { date: '', materialName: 'HDPE Plastic Granules', vendorId: '', weight: 0, rate: 0, purchaseBillPath: '', weightSlipPath: '' };
  transportsForm = { date: '', truckNumber: '', driverId: '', rent: 0, advance: 0, truckPhotoPath: '', driverLicensePath: '' };
  salariesForm = { empId: '', month: 'May', year: 2026, salaryAmount: 0, status: 'Pending', paidDate: '' };

  // New enterprise form models
  machineForm = { machineName: '', machineCode: '', installedDate: '', status: 'Running', capacityPerHour: 0 };
  breakdownForm = { machineId: '', breakdownDate: '', description: '', resolvedDate: '', downtimeHours: 0 };
  dispatchForm = { saleId: '', dispatchDate: '', vehicleNumber: '', driverName: '', deliveryAddress: '', dispatchStatus: 'Pending' };
  expenseForm = { expenseDate: '', category: 'Maintenance', description: '', amount: 0, paidBy: '' };
  bankTxnForm = { transactionDate: '', transactionType: 'Credit', amount: 0, description: '', referenceNo: '' };

  // Power BI Analytics state
  powerBiEmbedUrl: SafeResourceUrl | null = null;
  powerBiUrlInput = '';
  powerBiSimulatorActive = true;
  activeAnalyticsReport = 'sales';

  // Language state
  currentLang: Language = 'en';

  // Invoice view / print details
  selectedInvoice: any = null;

  // Chart instances
  prodChart: any = null;
  salesChart: any = null;
  customersChart: any = null;

  // Reports state
  reportFilter = { type: 'production', date: '', partyId: '' };
  filteredReportData: any[] = [];

  // OTP Login Flow State
  showOtpScreen = false;
  otpValue = '';
  tempOtp = '';
  otpCountdown = 120;
  otpTimerInterval: any = null;

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
  userForm = { username: '', password: '', role: 'OPERATOR', name: '' };

  constructor(private apiService: ApiService, private translateService: TranslateService, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.translateService.init();
    this.currentLang = this.translateService.getCurrentLanguage();
    this.translateService.language$.subscribe(lang => this.currentLang = lang);

    this.customBackendUrl = localStorage.getItem('backend_url') || environment.apiUrl;

    this.initSettingsList();

    // Check local storage for session
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      this.loggedInUser = JSON.parse(cachedUser);
      this.isAuthenticated = true;
      this.loginTime = localStorage.getItem('loginTime') || '';
      this.updateAccessibleTabs();
      this.resetIdleTimer();
      this.loadAllData();
    }

    const savedDark = localStorage.getItem('erp_dark_mode');
    if (savedDark === 'true') {
      this.isDarkMode = true;
      const darkSetting = this.settingsList.find(s => s.key === 'theme_dark_mode_enabled');
      if (darkSetting) darkSetting.value = true;
      this.applyTheme();
    }

    this.setupIdleTimer();
    this.startClock();
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

  logoutDueToInactivity() {
    if (this.isAuthenticated) {
      this.lastActivityTime = Date.now();
      alert('You have been automatically logged out due to 2 minutes of inactivity.');
      this.handleLogout();
    }
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

    if (role === 'SUPER_ADMIN') {
      allTabs.forEach(t => this.accessibleTabs[t] = true);
    } else if (role === 'ADMIN') {
      // Cannot access User Management, API Settings, Restore, System Settings (which are inside settings and audit-logs)
      const adminTabs = [
        'dashboard', 'production', 'monthly-production', 'parties', 'sales',
        'payments', 'raw-materials', 'vendors', 'inventory', 'employees',
        'salaries', 'transports', 'drivers', 'machines', 'dispatch',
        'expenses', 'bank', 'invoices', 'billinghub', 'reports', 'analytics'
      ];
      adminTabs.forEach(t => this.accessibleTabs[t] = true);
    } else if (role === 'ACCOUNTANT') {
      // Payments, Salary, Expenses, Invoices, Reports
      const accountantTabs = [
        'dashboard', 'payments', 'salaries', 'expenses', 'invoices', 'billinghub', 'reports', 'analytics'
      ];
      accountantTabs.forEach(t => this.accessibleTabs[t] = true);
    } else if (role === 'OPERATOR') {
      // Production Entry, Inventory Entry, Raw Material Entry
      const operatorTabs = [
        'dashboard', 'production', 'monthly-production', 'inventory', 'raw-materials', 'machines'
      ];
      operatorTabs.forEach(t => this.accessibleTabs[t] = true);
    } else if (role === 'VIEWER') {
      // Read-only access to standard business modules
      const viewerTabs = [
        'dashboard', 'production', 'monthly-production', 'parties', 'sales',
        'payments', 'raw-materials', 'vendors', 'inventory', 'employees',
        'salaries', 'transports', 'drivers', 'machines', 'dispatch',
        'expenses', 'bank', 'invoices', 'billinghub', 'reports', 'analytics'
      ];
      viewerTabs.forEach(t => this.accessibleTabs[t] = true);
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


  saveBackendUrl() {
    if (this.customBackendUrl.trim()) {
      localStorage.setItem('backend_url', this.customBackendUrl.trim());
      alert('Backend API URL updated! The application will reload to apply the changes.');
      window.location.reload();
    } else {
      localStorage.removeItem('backend_url');
      alert('Backend API URL reset to default! The application will reload.');
      window.location.reload();
    }
  }

  // --- Auth Handlers ---
  handleLogin() {
    this.loginError = '';
    this.apiService.login(this.loginCredentials).subscribe({
      next: (res) => {
        // Backend returns either { status: 'OTP_REQUIRED', username, tempOtp }
        // or the full user token if OTP is bypassed (though not by default now)
        if (res.status === 'OTP_REQUIRED') {
          this.showOtpScreen = true;
          this.tempOtp = res.tempOtp || '';
          this.startOtpTimer();
        } else {
          this.completeLogin(res);
        }
      },
      error: (err) => {
        if (err.status === 423) {
          this.loginError = 'Account is locked due to multiple failed attempts. Please wait 30 minutes.';
        } else {
          this.loginError = err.error?.message || 'Invalid username or password.';
        }
      }
    });
  }

  startOtpTimer() {
    this.clearOtpTimer();
    this.otpCountdown = 120;
    this.otpTimerInterval = setInterval(() => {
      if (this.otpCountdown > 0) {
        this.otpCountdown--;
      } else {
        this.clearOtpTimer();
        this.loginError = 'OTP has expired. Please request a new one.';
      }
    }, 1000);
  }

  clearOtpTimer() {
    if (this.otpTimerInterval) {
      clearInterval(this.otpTimerInterval);
      this.otpTimerInterval = null;
    }
  }

  formatCountdown(): string {
    const minutes = Math.floor(this.otpCountdown / 60);
    const seconds = this.otpCountdown % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  verifyOtp() {
    this.loginError = '';
    this.apiService.verifyOtp({
      username: this.loginCredentials.username,
      otp: this.otpValue
    }).subscribe({
      next: (res) => {
        this.completeLogin(res);
        this.showOtpScreen = false;
        this.otpValue = '';
        this.tempOtp = '';
        this.clearOtpTimer();
      },
      error: (err) => {
        this.loginError = err.error?.message || 'Invalid or expired OTP.';
      }
    });
  }

  resendOtp() {
    this.handleLogin();
  }

  backToLogin() {
    this.showOtpScreen = false;
    this.otpValue = '';
    this.tempOtp = '';
    this.loginError = '';
    this.loginCredentials.password = '';
    this.clearOtpTimer();
  }

  completeLogin(res: any) {
    this.loggedInUser = res;
    this.isAuthenticated = true;
    localStorage.setItem('user', JSON.stringify(res));
    // Store JWT token for the interceptor
    if (res.token) {
      localStorage.setItem('jwtToken', res.token);
    }
    const timeStr = new Date().toString();
    this.loginTime = timeStr;
    localStorage.setItem('loginTime', timeStr);
    this.updateAccessibleTabs();
    this.resetIdleTimer();
    this.loadAllData();
    this.logAudit("Logged in successfully");
  }

  handleLogout() {
    this.logAudit("Logged out");
    this.isAuthenticated = false;
    this.loggedInUser = null;
    localStorage.removeItem('user');
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('loginTime');
    this.loginTime = '';
    this.sessionDuration = '';
    this.clearOtpTimer();
    this.showOtpScreen = false;

    this.accessibleTabs = {};
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
    this.apiService.getStats().subscribe(stats => { this.stats = stats; this.recalculateNetProfit(); });
    this.apiService.getParties().subscribe(list => this.parties = list);
    this.apiService.getVendors().subscribe(list => this.vendors = list);
    this.apiService.getDrivers().subscribe(list => this.drivers = list);
    this.apiService.getEmployees().subscribe(list => this.employees = list);
    this.apiService.getPpd().subscribe(list => this.ppdList = list);
    this.apiService.getPpm().subscribe(list => this.ppmList = list);
    this.apiService.getSales().subscribe(list => this.salesList = list);
    this.apiService.getPayments().subscribe(list => this.paymentsList = list);
    this.apiService.getInventory().subscribe(list => this.inventoryList = list);
    this.apiService.getRawMaterials().subscribe(list => this.rawMaterialsList = list);
    this.apiService.getTransports().subscribe(list => this.transportsList = list);
    this.apiService.getSalaries().subscribe(list => this.salariesList = list);
    this.apiService.getInvoices().subscribe(list => this.invoicesList = list);
    this.apiService.getAuditLogs().subscribe(list => this.auditLogsList = list);
    // Enterprise modules
    this.apiService.getMachines().subscribe(list => this.machinesList = list);
    this.apiService.getMachineBreakdowns().subscribe(list => this.machineBreakdownsList = list);
    this.apiService.getDispatches().subscribe(list => this.dispatchesList = list);
    this.apiService.getExpenses().subscribe(list => { this.expensesList = list; this.recalculateNetProfit(); });
    this.apiService.getBankTransactions().subscribe(list => this.bankTransactionsList = list);
    this.apiService.getUsers().subscribe(list => this.usersList = list);
    // Power BI settings
    this.apiService.getSettings().subscribe((settings: any[]) => {
      const biSetting = settings.find((s: any) => s.settingKey === 'powerbi_embed_url');
      if (biSetting && biSetting.settingValue) {
        this.powerBiUrlInput = biSetting.settingValue;
        this.powerBiSimulatorActive = false;
        this.powerBiEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(biSetting.settingValue);
      }
    });

    // Load charts
    setTimeout(() => {
      this.loadCharts();
      this.onBillTypeChange();
      this.loadBackups();
    }, 500);
  }

  // --- Chart.js Initializer ---
  loadCharts() {
    this.apiService.getCharts().subscribe(chartData => {
      const themeColors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

      // Destroy existing chart instances if they exist
      if (this.prodChart) this.prodChart.destroy();
      if (this.salesChart) this.salesChart.destroy();
      if (this.customersChart) this.customersChart.destroy();

      // 1. Production Bar Chart
      const prodCtx = document.getElementById('prodChartCanvas') as HTMLCanvasElement;
      if (prodCtx) {
        const labels = Object.keys(chartData.productionData);
        const data = Object.values(chartData.productionData);
        this.prodChart = new Chart(prodCtx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Crates Produced',
              data: data,
              backgroundColor: 'rgba(139, 92, 246, 0.6)',
              borderColor: '#8b5cf6',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af' } },
              x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
            },
            plugins: { legend: { display: false } }
          }
        });
      }

      // 2. Sales Line Chart
      const salesCtx = document.getElementById('salesChartCanvas') as HTMLCanvasElement;
      if (salesCtx) {
        const labels = Object.keys(chartData.salesGrowthData);
        const data = Object.values(chartData.salesGrowthData);
        this.salesChart = new Chart(salesCtx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Sales Revenue',
              data: data,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af' } },
              x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
            },
            plugins: { legend: { display: false } }
          }
        });
      }

      // 3. Top Customers Pie Chart
      const custCtx = document.getElementById('custChartCanvas') as HTMLCanvasElement;
      if (custCtx) {
        const labels = Object.keys(chartData.topCustomersData);
        const data = Object.values(chartData.topCustomersData);
        this.customersChart = new Chart(custCtx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: data,
              backgroundColor: themeColors.slice(0, labels.length),
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'right', labels: { color: '#9ca3af' } }
            }
          }
        });
      }
    });
  }

  // --- Tab Switcher ---
  switchTab(tab: string) {
    if (this.accessibleTabs[tab]) {
      this.activeTab = tab;
      this.currentPage = 1;
      if (tab === 'dashboard') {
        setTimeout(() => this.loadCharts(), 100);
      }
      if (tab === 'reports') {
        this.runReport();
      }
    }
  }


  // --- Excel Import ---
  onExcelFileSelected(event: any) {
    this.excelFile = event.target.files[0];
  }

  handleExcelUpload() {
    if (!this.excelFile) return;
    this.uploadStatus = 'Uploading and processing file...';
    this.apiService.importExcel(this.excelFile).subscribe({
      next: (res) => {
        this.uploadStatus = 'Excel spreadsheet imported successfully!';
        this.loadAllData();
        this.logAudit("Imported Excel spreadsheet data");
      },
      error: (err) => {
        this.uploadStatus = 'Error importing file: ' + err.error;
      }
    });
  }

  // --- Form Auto Calculations ---
  calculateSalesTotal() {
    this.salesForm.totalAmount = this.salesForm.quantity * this.salesForm.rate;
    this.salesForm.remaining = this.salesForm.totalAmount - this.salesForm.paid;
  }

  // --- Save / Submit Handlers ---
  savePpd() {
    if (!this.validateForm('ppd')) return;
    this.apiService.createPpd(this.ppdForm).subscribe(() => {
      this.loadAllData();
      this.logAudit("Added production entry: " + this.ppdForm.crateType);
      this.ppdForm = { date: '', crateType: 'Apple Crate', totalProduction: 0, successful: 0, rejected: 0, shift: 'Morning Shift' };
    });
  }

  deletePpd(id: number) {
    this.apiService.deletePpd(id).subscribe(() => {
      this.loadAllData();
      this.logAudit("Deleted production entry ID: " + id);
    });
  }

  savePpm() {
    if (!this.validateForm('ppm')) return;
    this.apiService.createPpm(this.ppmForm).subscribe(() => {
      this.loadAllData();
      this.logAudit("Added monthly production summary");
      this.ppmForm = { month: 'May', year: 2026, cratesProduced: 0, electricityUnits: 0, electricityBill: 0 };
    });
  }

  deletePpm(id: number) {
    this.apiService.deletePpm(id).subscribe(() => {
      this.loadAllData();
      this.logAudit("Deleted monthly production ID: " + id);
    });
  }

  saveParty() {
    if (!this.validateForm('party')) return;
    this.partyForm.city = this.partyForm.partyAddress.split(',').pop()?.trim() || '';
    this.apiService.createParty(this.partyForm).subscribe(() => {
      this.loadAllData();
      this.logAudit("Created party: " + this.partyForm.partyName);
      this.partyForm = { partyName: '', partyAddress: '', partyContact: '', gstNumber: '', email: '', city: '', state: '', gstCertPath: '', panCardPath: '', agreementPath: '' };
    });
  }

  deleteParty(id: number) {
    this.apiService.deleteParty(id).subscribe(() => {
      this.loadAllData();
      this.logAudit("Deleted party ID: " + id);
    });
  }

  saveVendor() {
    if (!this.validateForm('vendor')) return;
    this.apiService.createVendor(this.vendorForm).subscribe(() => {
      this.loadAllData();
      this.logAudit("Created vendor: " + this.vendorForm.vendorName);
      this.vendorForm = { vendorName: '', mobile: '', address: '', gstNumber: '' };
    });
  }

  deleteVendor(id: number) {
    this.apiService.deleteVendor(id).subscribe(() => {
      this.loadAllData();
      this.logAudit("Deleted vendor ID: " + id);
    });
  }

  saveDriver() {
    if (!this.validateForm('driver')) return;
    this.apiService.createDriver(this.driverForm).subscribe(() => {
      this.loadAllData();
      this.logAudit("Created driver: " + this.driverForm.driverName);
      this.driverForm = { driverName: '', mobile: '', licenseNumber: '', address: '' };
    });
  }

  deleteDriver(id: number) {
    this.apiService.deleteDriver(id).subscribe(() => {
      this.loadAllData();
      this.logAudit("Deleted driver ID: " + id);
    });
  }

  saveEmployee() {
    if (!this.validateForm('employee')) return;
    this.apiService.createEmployee(this.employeeForm).subscribe(() => {
      this.loadAllData();
      this.logAudit("Registered employee: " + this.employeeForm.empName);
      this.employeeForm = { empName: '', empContact: '', salary: 0, address: '', designation: '', joiningDate: '', aadhaarNo: '', bankAccount: '', photoPath: '', aadhaarCardPath: '', bankPassbookPath: '' };
    });
  }

  deleteEmployee(id: number) {
    this.apiService.deleteEmployee(id).subscribe(() => {
      this.loadAllData();
      this.logAudit("Deleted employee ID: " + id);
    });
  }

  saveSales() {
    if (!this.validateForm('sales')) return;
    // Find matching party object
    const party = this.parties.find(p => p.partyId === parseInt(this.salesForm.partyId));
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

    this.apiService.createSale(payload).subscribe(() => {
      this.loadAllData();
      this.logAudit("Created sales invoice for party: " + party.partyName);
      this.salesForm = { date: '', partyId: '', crateType: 'Apple Crate', crateMaterial: 'Plastic', quantity: 0, rate: 0, totalAmount: 0, paid: 0, remaining: 0 };
    });
  }

  deleteSale(id: number) {
    this.apiService.deleteSale(id).subscribe(() => {
      this.loadAllData();
      this.logAudit("Deleted sale ID: " + id);
    });
  }

  savePayment() {
    if (!this.validateForm('payment')) return;
    const party = this.parties.find(p => p.partyId === parseInt(this.paymentsForm.partyId));
    if (!party) return;

    const payload = {
      party: party,
      invoiceNo: this.paymentsForm.invoiceNo,
      amountReceived: this.paymentsForm.amountReceived,
      paymentMode: this.paymentsForm.paymentMode,
      paymentDate: this.paymentsForm.paymentDate
    };

    this.apiService.createPayment(payload).subscribe(() => {
      this.loadAllData();
      this.logAudit("Received payment from party: " + party.partyName);
      this.paymentsForm = { partyId: '', invoiceNo: '', amountReceived: 0, paymentMode: 'UPI', paymentDate: '' };
    });
  }

  deletePayment(id: number) {
    this.apiService.deletePayment(id).subscribe(() => {
      this.loadAllData();
      this.logAudit("Deleted payment ID: " + id);
    });
  }

  saveRawMaterial() {
    if (!this.validateForm('rawMaterial')) return;
    const vendor = this.vendors.find(v => v.vendorId === parseInt(this.rawMaterialsForm.vendorId));
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

    this.apiService.createRawMaterial(payload).subscribe(() => {
      this.loadAllData();
      this.logAudit("Purchased raw materials from vendor: " + vendor.vendorName);
      this.rawMaterialsForm = { date: '', materialName: 'HDPE Plastic Granules', vendorId: '', weight: 0, rate: 0, purchaseBillPath: '', weightSlipPath: '' };
    });
  }

  deleteRawMaterial(id: number) {
    this.apiService.deleteRawMaterial(id).subscribe(() => {
      this.loadAllData();
      this.logAudit("Deleted raw material ID: " + id);
    });
  }

  saveTransport() {
    if (!this.validateForm('transport')) return;
    const driver = this.drivers.find(d => d.driverId === parseInt(this.transportsForm.driverId));
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

    this.apiService.createTransport(payload).subscribe(() => {
      this.loadAllData();
      this.logAudit("Logged transport rental for truck: " + this.transportsForm.truckNumber);
      this.transportsForm = { date: '', truckNumber: '', driverId: '', rent: 0, advance: 0, truckPhotoPath: '', driverLicensePath: '' };
    });
  }

  deleteTransport(id: number) {
    this.apiService.deleteTransport(id).subscribe(() => {
      this.loadAllData();
      this.logAudit("Deleted transport record ID: " + id);
    });
  }

  saveSalary() {
    if (!this.validateForm('salary')) return;
    const emp = this.employees.find(e => e.empId === parseInt(this.salariesForm.empId));
    if (!emp) return;

    const payload = {
      employee: emp,
      month: this.salariesForm.month,
      year: this.salariesForm.year,
      salaryAmount: this.salariesForm.salaryAmount,
      status: this.salariesForm.status,
      paidDate: this.salariesForm.paidDate ? this.salariesForm.paidDate : null
    };

    this.apiService.createSalary(payload).subscribe(() => {
      this.loadAllData();
      this.logAudit("Generated salary release log for employee: " + emp.empName);
      this.salariesForm = { empId: '', month: 'May', year: 2026, salaryAmount: 0, status: 'Pending', paidDate: '' };
    });
  }

  deleteSalary(id: number) {
    this.apiService.deleteSalary(id).subscribe(() => {
      this.loadAllData();
      this.logAudit("Deleted salary record ID: " + id);
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
      if (filter.partyId) {
        this.filteredReportData = this.filteredReportData.filter(d => d.party.partyId === parseInt(filter.partyId));
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

  downloadPDFInvoice(inv: any) {
    this.logAudit("Downloaded PDF Invoice: " + inv.invoiceNo);
    const doc = new jsPDF();

    doc.setFont("Outfit", "bold");
    doc.setFontSize(22);
    doc.text("FUTANE AGRO INDUSTRIES PVT. LTD.", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("Outfit", "normal");
    doc.text("Manufacturers of High-Quality Plastic Crates & Containers", 105, 26, { align: "center" });
    doc.text("Factory: Gate No 144, Hadapsar Industrial Area, Pune - 411028", 105, 31, { align: "center" });
    doc.line(15, 36, 195, 36);

    doc.setFontSize(11);
    doc.setFont("Outfit", "bold");
    doc.text("INVOICE DETAILS", 15, 45);
    doc.setFont("Outfit", "normal");
    doc.text(`Invoice No: ${inv.invoiceNo}`, 15, 52);
    doc.text(`Invoice Date: ${inv.createdDate}`, 15, 58);
    
    doc.setFont("Outfit", "bold");
    doc.text("BILLED TO:", 115, 45);
    doc.setFont("Outfit", "normal");
    doc.text(`Name: ${inv.sale.party.partyName}`, 115, 52);
    doc.text(`Address: ${inv.sale.party.partyAddress}`, 115, 58);
    doc.text(`GSTIN: ${inv.sale.party.gstNumber || 'N/A'}`, 115, 64);

    doc.line(15, 72, 195, 72);

    doc.setFont("Outfit", "bold");
    doc.text("Description", 20, 80);
    doc.text("Material", 75, 80);
    doc.text("Qty", 105, 80);
    doc.text("Rate (INR)", 135, 80);
    doc.text("Total (INR)", 165, 80);
    doc.line(15, 84, 195, 84);

    doc.setFont("Outfit", "normal");
    doc.text(`${inv.sale.crateType}`, 20, 92);
    doc.text(`${inv.sale.crateMaterial}`, 75, 92);
    doc.text(`${inv.sale.quantity}`, 105, 92);
    doc.text(`${inv.sale.rate.toFixed(2)}`, 135, 92);
    doc.text(`${inv.sale.totalAmount.toFixed(2)}`, 165, 92);

    doc.line(15, 98, 195, 98);

    doc.setFont("Outfit", "bold");
    doc.text("Summary:", 115, 110);
    doc.setFont("Outfit", "normal");
    doc.text(`Sub-Total: INR ${inv.sale.totalAmount.toFixed(2)}`, 115, 117);
    doc.text(`Paid Amount: INR ${inv.sale.paid.toFixed(2)}`, 115, 123);
    
    doc.setFont("Outfit", "bold");
    doc.text(`Balance Due: INR ${inv.sale.remaining.toFixed(2)}`, 115, 130);

    doc.setFontSize(9);
    doc.setFont("Outfit", "normal");
    doc.text("Thank you for your business!", 105, 150, { align: "center" });
    doc.text("Note: This is a computer-generated invoice and requires no physical signature.", 105, 155, { align: "center" });

    doc.save(`${inv.invoiceNo}.pdf`);
  }

  // --- Machine Handlers ---
  saveMachine() {
    if (!this.validateForm('machine')) return;
    this.apiService.createMachine(this.machineForm).subscribe(() => {
      this.loadAllData();
      this.logAudit('Added machine: ' + this.machineForm.machineName);
      this.machineForm = { machineName: '', machineCode: '', installedDate: '', status: 'Running', capacityPerHour: 0 };
    });
  }

  deleteMachine(id: number) {
    this.apiService.deleteMachine(id).subscribe(() => {
      this.loadAllData();
      this.logAudit('Deleted machine ID: ' + id);
    });
  }

  saveBreakdown() {
    if (!this.validateForm('breakdown')) return;
    const machine = this.machinesList.find((m: any) => m.machineId === parseInt(this.breakdownForm.machineId));
    if (!machine) return;
    const payload = { ...this.breakdownForm, machine };
    this.apiService.createMachineBreakdown(payload).subscribe(() => {
      this.loadAllData();
      this.logAudit('Logged breakdown for machine: ' + machine.machineName);
      this.breakdownForm = { machineId: '', breakdownDate: '', description: '', resolvedDate: '', downtimeHours: 0 };
    });
  }

  deleteBreakdown(id: number) {
    this.apiService.deleteMachineBreakdown(id).subscribe(() => {
      this.loadAllData();
      this.logAudit('Deleted breakdown log ID: ' + id);
    });
  }

  // --- Dispatch Handlers ---
  saveDispatch() {
    if (!this.validateForm('dispatch')) return;
    const sale = this.salesList.find((s: any) => s.saleId === parseInt(this.dispatchForm.saleId));
    if (!sale) return;
    const payload = { ...this.dispatchForm, sale };
    this.apiService.createDispatch(payload).subscribe(() => {
      this.loadAllData();
      this.logAudit('Created dispatch record for sale ID: ' + this.dispatchForm.saleId);
      this.dispatchForm = { saleId: '', dispatchDate: '', vehicleNumber: '', driverName: '', deliveryAddress: '', dispatchStatus: 'Pending' };
    });
  }

  deleteDispatch(id: number) {
    this.apiService.deleteDispatch(id).subscribe(() => {
      this.loadAllData();
      this.logAudit('Deleted dispatch record ID: ' + id);
    });
  }

  // --- Expense Handlers ---
  saveExpense() {
    if (!this.validateForm('expense')) return;
    const payload = { ...this.expenseForm, paidBy: this.loggedInUser?.username || 'admin' };
    this.apiService.createExpense(payload).subscribe(() => {
      this.loadAllData();
      this.logAudit('Created expense: ' + this.expenseForm.description);
      this.expenseForm = { expenseDate: '', category: 'Maintenance', description: '', amount: 0, paidBy: '' };
    });
  }

  deleteExpense(id: number) {
    this.apiService.deleteExpense(id).subscribe(() => {
      this.loadAllData();
      this.logAudit('Deleted expense ID: ' + id);
    });
  }

  // --- Bank Transaction Handlers ---
  saveBankTransaction() {
    if (!this.validateForm('bank')) return;
    this.apiService.createBankTransaction(this.bankTxnForm).subscribe(() => {
      this.loadAllData();
      this.logAudit('Logged bank transaction: ' + this.bankTxnForm.description);
      this.bankTxnForm = { transactionDate: '', transactionType: 'Credit', amount: 0, description: '', referenceNo: '' };
    });
  }

  deleteBankTransaction(id: number) {
    this.apiService.deleteBankTransaction(id).subscribe(() => {
      this.loadAllData();
      this.logAudit('Deleted bank transaction ID: ' + id);
    });
  }

  // --- Power BI Analytics ---
  savePowerBiUrl() {
    if (!this.powerBiUrlInput.trim()) return;
    this.apiService.saveSetting('powerbi_embed_url', this.powerBiUrlInput).subscribe(() => {
      this.powerBiEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.powerBiUrlInput);
      this.powerBiSimulatorActive = false;
      this.logAudit('Updated Power BI embed URL');
    });
  }

  clearPowerBiUrl() {
    this.powerBiUrlInput = '';
    this.powerBiEmbedUrl = null;
    this.powerBiSimulatorActive = true;
  }

  // P&L calculation from dashboard stats
  recalculateNetProfit() {
    const income = this.stats.totalSalesAmount || 0;
    const material = this.stats.totalRawMaterialCost || 0;
    const transport = this.stats.totalTransportCost || 0;
    const salaries = this.stats.totalSalaries || 0;
    const expenses = this.expensesList ? this.expensesList.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) : 0;
    this.computedNetProfit = income - material - transport - salaries - expenses;
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
      return "💡 AI Tip: You can adjust the failed login lockout threshold in Security Settings.";
    }
    if (q.includes('tax') || q.includes('gst')) {
      return "💡 AI Suggestion: Optimize your CGST/SGST settings under the Tax & GST Category.";
    }
    if (q.includes('backup') || q.includes('db') || q.includes('database')) {
      return "💡 AI Suggestion: Automate database backups to AWS S3 weekly under the Database Category.";
    }
    if (q.includes('security') || q.includes('lock') || q.includes('otp')) {
      return "💡 AI Suggestion: Ensure OTP Verification is enabled to secure accountant login sessions.";
    }
    if (q.includes('ai') || q.includes('forecast') || q.includes('predict')) {
      return "💡 AI Suggestion: Enable AI Predictor to anticipate material shortfalls based on current inventory.";
    }
    if (q.includes('color') || q.includes('theme') || q.includes('dark')) {
      return "💡 AI Suggestion: Toggle 'Dark Mode Enabled' or modify brand colors to update the global dashboard styling.";
    }
    return `💡 AI Suggestion: Modifying settings in the '${this.filteredSettings[0]?.category || 'General'}' category may impact ERP automation. Please review carefully.`;
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
    
    localStorage.setItem('erp_dark_mode', this.isDarkMode ? 'true' : 'false');
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
    this.apiService.createUser(this.userForm).subscribe(() => {
      this.loadAllData();
      this.logAudit('Created user account: ' + this.userForm.username);
      this.userForm = { username: '', password: '', role: 'OPERATOR', name: '' };
    });
  }

  updateUserRole(username: string, role: string) {
    this.apiService.updateUser(username, { role }).subscribe(() => {
      this.loadAllData();
      this.logAudit('Updated role for user ' + username + ' to ' + role);
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
    this.apiService.deleteUser(username).subscribe(() => {
      this.loadAllData();
      this.logAudit('Deleted user account: ' + username);
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
    if (item.saleId !== undefined) return item.saleId;
    if (item.dispatchId !== undefined) return item.dispatchId;
    if (item.paymentId !== undefined) return item.paymentId;
    if (item.rawMaterialId !== undefined) return item.rawMaterialId;
    if (item.transportId !== undefined) return item.transportId;
    if (item.salaryId !== undefined) return item.salaryId;
    return null;
  }

  onBillRecordChange() {
    const list = this.getBillSourceList();
    const id = this.selectedBillRecordId;
    this.selectedBillRecord = list.find(item => String(this.getRecordId(item)) === id) || null;
  }

  // WhatsApp invoice sharing
  shareOnWhatsApp() {
    if (!this.selectedBillRecord) return;
    const docType = this.activeBillType.replace('_', ' ').toUpperCase();
    const id = this.getRecordId(this.selectedBillRecord);
    let amount = 0;
    let recipientName = 'Customer';

    switch(this.activeBillType) {
      case 'tax_invoice':
      case 'proforma':
        amount = this.selectedBillRecord.totalAmount;
        recipientName = this.selectedBillRecord.party.partyName;
        break;
      case 'delivery_challan':
        amount = this.selectedBillRecord.sale.quantity;
        recipientName = this.selectedBillRecord.sale.party.partyName;
        break;
      case 'payment_receipt':
        amount = this.selectedBillRecord.amountReceived;
        recipientName = this.selectedBillRecord.party.partyName;
        break;
      case 'purchase_invoice':
        amount = this.selectedBillRecord.amount;
        recipientName = this.selectedBillRecord.vendor.vendorName;
        break;
      case 'transport_receipt':
        amount = this.selectedBillRecord.rent;
        recipientName = this.selectedBillRecord.driver.driverName;
        break;
      case 'salary_slip':
        amount = this.selectedBillRecord.salaryAmount;
        recipientName = this.selectedBillRecord.employee.empName;
        break;
    }

    const message = `Hello ${recipientName},\n\nWe are sharing the details for *${docType}* (Ref ID: ${id}) from *Futane Agro Industries Pvt. Ltd.*\n\n*Amount/Qty:* ₹${amount}\n*Date:* ${this.selectedBillRecord.date || this.selectedBillRecord.paymentDate || this.selectedBillRecord.dispatchDate || 'N/A'}\n\nThank you for doing business with us!`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    this.logAudit(`Shared ${docType} ID ${id} via WhatsApp`);
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
      result = result.filter(item => {
        const statusVal = item.status || item.dispatchStatus;
        if (statusVal) return String(statusVal).toLowerCase() === this.filterStatus.toLowerCase();
        if (item.isActive !== undefined) {
          const activeStr = item.isActive ? 'active' : 'inactive';
          return activeStr === this.filterStatus.toLowerCase();
        }
        return false;
      });
    }

    // Party filter
    if (this.filterPartyId) {
      result = result.filter(item => {
        const pId = item.partyId || (item.party && item.party.partyId) || (item.sale && item.sale.party && item.sale.party.partyId);
        return pId && String(pId) === String(this.filterPartyId);
      });
    }

    // Employee filter
    if (this.filterEmployeeId) {
      result = result.filter(item => {
        const eId = item.empId || (item.employee && item.employee.empId);
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
    this.tableFilteredCounts[tableKey] = result.length;
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
      alert("No data to export!");
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
      },
      error: (err) => {
        this.uploadError = 'File upload failed: ' + (err.error?.message || err.message);
        this.uploadingFile = false;
      }
    });
  }

  forgotPassword() {
    alert('Please contact the System Administrator to reset your password.');
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
        alert(res.message || 'Backup created successfully!');
        this.loadBackups();
      },
      error: (err) => {
        alert('Backup failed: ' + (err.error?.message || err.message || err));
      }
    });
  }

  triggerRestore(filename: string) {
    if (confirm(`Are you sure you want to restore the database from ${filename}? Current data will be overwritten!`)) {
      this.apiService.runRestore(filename).subscribe({
        next: (res: any) => {
          alert(res.message || 'Database restored successfully!');
          this.loadAllData();
        },
        error: (err) => {
          alert('Restore failed: ' + (err.error?.message || err.message || err));
        }
      });
    }
  }

  // Column Visibility Handlers
  toggleColDropdown(tableKey: string) {
    this.showColDropdown[tableKey] = !this.showColDropdown[tableKey];
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
      if (!f.date) { alert('Production date is required.'); return false; }
      if (this.isFutureDate(f.date)) { alert('Production date cannot be in the future.'); return false; }
      if (f.totalProduction <= 0) { alert('Total Production must be greater than zero.'); return false; }
      if (f.successful < 0 || f.rejected < 0) { alert('Production quantities cannot be negative.'); return false; }
      if (f.successful + f.rejected !== f.totalProduction) {
        alert('Sum of successful (' + f.successful + ') and rejected (' + f.rejected + ') must equal total production (' + f.totalProduction + ').');
        return false;
      }
    }
    if (formType === 'ppm') {
      const f = this.ppmForm;
      if (f.year <= 2000 || f.year > 2100) { alert('Please enter a valid year.'); return false; }
      if (f.cratesProduced < 0 || f.electricityUnits < 0 || f.electricityBill < 0) {
        alert('All monthly metrics must be non-negative.');
        return false;
      }
    }
    if (formType === 'party') {
      const f = this.partyForm;
      if (!f.partyName.trim()) { alert('Party name is required.'); return false; }
      if (!f.gstNumber.trim()) { alert('GST Number is required.'); return false; }
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(f.gstNumber.trim().toUpperCase())) {
        alert('Invalid GST format. Must be a valid 15-character Indian GSTIN.');
        return false;
      }
      if (!f.partyContact.trim()) { alert('Contact mobile is required.'); return false; }
      const mobRegex = /^[0-9]{10}$/;
      if (!mobRegex.test(f.partyContact.trim())) {
        alert('Mobile number must be exactly 10 digits.');
        return false;
      }
      if (f.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(f.email.trim())) {
          alert('Invalid email format.');
          return false;
        }
      }
    }
    if (formType === 'vendor') {
      const f = this.vendorForm;
      if (!f.vendorName.trim()) { alert('Vendor name is required.'); return false; }
      if (f.gstNumber.trim()) {
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstRegex.test(f.gstNumber.trim().toUpperCase())) {
          alert('Invalid GST format.');
          return false;
        }
      }
      if (f.mobile.trim()) {
        const mobRegex = /^[0-9]{10}$/;
        if (!mobRegex.test(f.mobile.trim())) {
          alert('Mobile number must be exactly 10 digits.');
          return false;
        }
      }
    }
    if (formType === 'driver') {
      const f = this.driverForm;
      if (!f.driverName.trim()) { alert('Driver name is required.'); return false; }
      if (!f.mobile.trim()) { alert('Mobile number is required.'); return false; }
      const mobRegex = /^[0-9]{10}$/;
      if (!mobRegex.test(f.mobile.trim())) {
        alert('Mobile number must be exactly 10 digits.');
        return false;
      }
      if (!f.licenseNumber.trim()) { alert('License number is required.'); return false; }
    }
    if (formType === 'employee') {
      const f = this.employeeForm;
      if (!f.empName.trim()) { alert('Employee name is required.'); return false; }
      if (!f.empContact.trim()) { alert('Mobile contact is required.'); return false; }
      const mobRegex = /^[0-9]{10}$/;
      if (!mobRegex.test(f.empContact.trim())) {
        alert('Mobile number must be exactly 10 digits.');
        return false;
      }
      if (f.salary < 0) { alert('Salary cannot be negative.'); return false; }
      if (!f.aadhaarNo.trim()) { alert('Aadhaar number is required.'); return false; }
      const aadhaarRegex = /^[0-9]{12}$/;
      if (!aadhaarRegex.test(f.aadhaarNo.trim())) {
        alert('Aadhaar number must be exactly 12 digits.');
        return false;
      }
      if (f.joiningDate && this.isFutureDate(f.joiningDate)) {
        alert('Joining date cannot be in the future.');
        return false;
      }
    }
    if (formType === 'sales') {
      const f = this.salesForm;
      if (!f.date) { alert('Sales date is required.'); return false; }
      if (this.isFutureDate(f.date)) { alert('Sales date cannot be in the future.'); return false; }
      if (!f.partyId) { alert('Please select a customer party.'); return false; }
      if (f.quantity <= 0) { alert('Quantity must be greater than zero.'); return false; }
      if (f.rate <= 0) { alert('Rate must be greater than zero.'); return false; }
      if (f.paid < 0) { alert('Paid amount cannot be negative.'); return false; }
      if (f.paid > f.totalAmount) { alert('Paid amount cannot exceed total amount.'); return false; }
    }
    if (formType === 'payment') {
      const f = this.paymentsForm;
      if (!f.paymentDate) { alert('Payment date is required.'); return false; }
      if (this.isFutureDate(f.paymentDate)) { alert('Payment date cannot be in the future.'); return false; }
      if (!f.partyId) { alert('Please select a customer party.'); return false; }
      if (f.amountReceived <= 0) { alert('Payment amount must be greater than zero.'); return false; }
    }
    if (formType === 'rawMaterial') {
      const f = this.rawMaterialsForm;
      if (!f.date) { alert('Date is required.'); return false; }
      if (this.isFutureDate(f.date)) { alert('Date cannot be in the future.'); return false; }
      if (!f.vendorId) { alert('Please select a supplier vendor.'); return false; }
      if (f.weight <= 0) { alert('Weight must be greater than zero.'); return false; }
      if (f.rate <= 0) { alert('Rate must be greater than zero.'); return false; }
    }
    if (formType === 'transport') {
      const f = this.transportsForm;
      if (!f.date) { alert('Date is required.'); return false; }
      if (this.isFutureDate(f.date)) { alert('Date cannot be in the future.'); return false; }
      if (!f.truckNumber.trim()) { alert('Truck number is required.'); return false; }
      if (!f.driverId) { alert('Please select a driver.'); return false; }
      if (f.rent <= 0) { alert('Rent must be greater than zero.'); return false; }
      if (f.advance < 0) { alert('Advance cannot be negative.'); return false; }
      if (f.advance > f.rent) { alert('Advance cannot exceed total rent.'); return false; }
    }
    if (formType === 'salary') {
      const f = this.salariesForm;
      if (!f.empId) { alert('Please select an employee.'); return false; }
      if (f.salaryAmount <= 0) { alert('Salary amount must be greater than zero.'); return false; }
      if (f.paidDate && this.isFutureDate(f.paidDate)) { alert('Payment date cannot be in the future.'); return false; }
    }
    if (formType === 'machine') {
      const f = this.machineForm;
      if (!f.machineName.trim()) { alert('Machine name is required.'); return false; }
      if (!f.machineCode.trim()) { alert('Machine code is required.'); return false; }
      if (f.capacityPerHour <= 0) { alert('Capacity must be greater than zero.'); return false; }
      if (f.installedDate && this.isFutureDate(f.installedDate)) { alert('Installed date cannot be in the future.'); return false; }
    }
    if (formType === 'breakdown') {
      const f = this.breakdownForm;
      if (!f.machineId) { alert('Please select a machine.'); return false; }
      if (!f.breakdownDate) { alert('Breakdown date is required.'); return false; }
      if (this.isFutureDate(f.breakdownDate)) { alert('Breakdown date cannot be in the future.'); return false; }
      if (f.downtimeHours < 0) { alert('Downtime hours cannot be negative.'); return false; }
      if (f.resolvedDate) {
        if (this.isFutureDate(f.resolvedDate)) { alert('Resolved date cannot be in the future.'); return false; }
        if (new Date(f.resolvedDate) < new Date(f.breakdownDate)) {
          alert('Resolved date cannot be before breakdown date.');
          return false;
        }
      }
    }
    if (formType === 'dispatch') {
      const f = this.dispatchForm;
      if (!f.saleId) { alert('Please select a sales order.'); return false; }
      if (!f.dispatchDate) { alert('Dispatch date is required.'); return false; }
      if (this.isFutureDate(f.dispatchDate)) { alert('Dispatch date cannot be in the future.'); return false; }
      if (!f.vehicleNumber.trim()) { alert('Vehicle number is required.'); return false; }
      if (!f.driverName.trim()) { alert('Driver name is required.'); return false; }
    }
    if (formType === 'expense') {
      const f = this.expenseForm;
      if (!f.expenseDate) { alert('Expense date is required.'); return false; }
      if (this.isFutureDate(f.expenseDate)) { alert('Expense date cannot be in the future.'); return false; }
      if (!f.description.trim()) { alert('Expense description is required.'); return false; }
      if (f.amount <= 0) { alert('Expense amount must be greater than zero.'); return false; }
    }
    if (formType === 'bank') {
      const f = this.bankTxnForm;
      if (!f.transactionDate) { alert('Transaction date is required.'); return false; }
      if (this.isFutureDate(f.transactionDate)) { alert('Transaction date cannot be in the future.'); return false; }
      if (f.amount <= 0) { alert('Transaction amount must be greater than zero.'); return false; }
      if (!f.description.trim()) { alert('Description is required.'); return false; }
    }
    if (formType === 'user') {
      const f = this.userForm;
      if (!f.name.trim()) { alert('Full name is required.'); return false; }
      if (!f.username.trim()) { alert('Username is required.'); return false; }
      if (!f.password.trim()) { alert('Password is required.'); return false; }
      if (f.password.length < 8) { alert('Password must be at least 8 characters long.'); return false; }
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
      this.apiService.saveSetting(key, String(val)).subscribe();
    }
  }
}

