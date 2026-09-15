import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, HostListener, ElementRef, ViewChild, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { environment } from '../../../../environments/environment';
import { AppNotificationService, AppNotification } from '../../../services/app-notification.service';
import { ThemeService } from '../../../services/theme.service';
import { IndianDatePipe } from '../../../pipes/indian-date.pipe';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, IndianDatePipe],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  public themeService = inject(ThemeService);
  isUat: boolean = environment.uat || (!environment.production);
  isProd: boolean = environment.production && !environment.uat;
  @Input() isProduction: boolean = true;
  @Input() loggedInUser: any = null;
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = '';
  @Input() currentDateTimeString: string = '';
  @Input() sessionDuration: string = '';
  @Input() logoutCountdown: string = '';
  @Input() customBackendUrl: string = '';
  @Input() partiesList: any[] = [];
  @Input() employeesList: any[] = [];
  @Input() salesList: any[] = [];
  @Input() dispatchesList: any[] = [];
  @Input() telemetryHealth: any = null;
  @Output() onToggleAlerts = new EventEmitter<void>();
  @Output() refreshData = new EventEmitter<void>();

  triggerDataSync() {
    this.refreshData.emit();
  }

  // Live Date & Time Telemetry
  currentDate = '';
  currentTime = '';
  private timer: any;

  // Flyout State
  showNotifDropdown = false;
  showUserDropdown = false;
  showAlertDropdown = false;

  // Global Search State
  @ViewChild('searchInput') searchInputElement?: ElementRef<HTMLInputElement>;
  globalSearchQuery = '';
  globalSearchResults: any[] = [];

  public appNotifService = inject(AppNotificationService);
  private elementRef = inject(ElementRef);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.updateLiveClock();
    this.ngZone.runOutsideAngular(() => {
      this.timer = setInterval(() => {
        if (!document.hidden) {
          this.updateLiveClock();
          this.cdr.detectChanges();
        }
      }, 5000);
    });
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  getFormattedTabTitle(tab: string): string {
    if (!tab || tab.toLowerCase().trim() === 'dashboard') {
      return 'Command Center';
    }
    const cleanKey = tab.toLowerCase().trim();
    const titles: { [key: string]: string } = {
      'production': 'Daily Production',
      'monthly-production': 'Monthly Summary',
      'monthly_production': 'Monthly Summary',
      'machines': 'Factory Machines',
      'parties': 'Parties & Customers',
      'sales': 'Sales Orders',
      'payments': 'Payment Registry',
      'payment-registry': 'Payment Registry',
      'invoices': 'Invoices & Bills',
      'billinghub': 'Billing Hub',
      'billing-hub': 'Billing Hub',
      'inventory': 'Live Inventory',
      'raw-materials': 'Raw Materials',
      'raw_materials': 'Raw Materials',
      'vendors': 'Vendors Directory',
      'transports': 'Logistics & Transport',
      'drivers': 'Drivers & Fleet',
      'dispatch': 'Dispatches & Challans',
      'expenses': 'Expense Tracker',
      'bank': 'Bank & Cash Treasury',
      'employees': 'Staff & Workers',
      'salaries': 'Salary & Payroll',
      'analytics': 'Analytics & BI',
      'reports': 'Reports & Statements',
      'audit-logs': 'Security Audit Logs',
      'settings': 'System Settings'
    };
    return titles[cleanKey] || tab.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private updateLiveClock() {
    const now = new Date();
    const day = now.toLocaleDateString('en-IN', { day: '2-digit' });
    const month = now.toLocaleDateString('en-IN', { month: 'short' });
    const year = now.getFullYear();
    this.currentDate = `${day} ${month} ${year}`;
    this.currentTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  @Output() onToggleSidebar = new EventEmitter<void>();
  @Output() onLogout = new EventEmitter<void>();
  @Output() onSetLanguage = new EventEmitter<string>();
  @Output() onCustomBackendUrlChange = new EventEmitter<string>();
  @Output() onNavigateTab = new EventEmitter<string>();

  // Global Keyboard Shortcuts (Ctrl+K / Cmd+K / Escape)
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.searchInputElement?.nativeElement.focus();
    } else if (event.key === 'Escape') {
      this.globalSearchResults = [];
      this.showNotifDropdown = false;
      this.showUserDropdown = false;
      this.searchInputElement?.nativeElement.blur();
    }
  }

  // Global Click Outside Handler
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showNotifDropdown = false;
      this.showUserDropdown = false;
      this.globalSearchResults = [];
    }
  }

  doGlobalSearch() {
    if (!this.globalSearchQuery || this.globalSearchQuery.trim().length < 1) {
      this.globalSearchResults = [];
      return;
    }
    const q = this.globalSearchQuery.toLowerCase().trim();
    const results: any[] = [];

    // 1. System Module Navigation Quick Links
    const systemTabs = [
      { type: 'Navigation', label: 'Dashboard Overview', detail: 'Executive KPI telemetry and metrics', tab: 'dashboard' },
      { type: 'Navigation', label: 'Daily Production (PPD)', detail: 'Log manufactured crates & shifts', tab: 'production' },
      { type: 'Navigation', label: 'Monthly Production Summary (PPM)', detail: 'Aggregates & power consumption', tab: 'monthly-production' },
      { type: 'Navigation', label: 'Machines & Breakdown Logs', detail: 'Factory equipment & maintenance', tab: 'machines' },
      { type: 'Navigation', label: 'Party Directory (Clients)', detail: 'Customer accounts & contact details', tab: 'parties' },
      { type: 'Navigation', label: 'Sales Orders & Ledger', detail: 'Crate sales, pricing & receivables', tab: 'sales' },
      { type: 'Navigation', label: 'Invoices & Billing Hub', detail: 'GST compliant invoices & printing', tab: 'billing-hub' },
      { type: 'Navigation', label: 'Dispatches & Logistics', detail: 'Vehicle assignments & transit status', tab: 'dispatch' },
      { type: 'Navigation', label: 'Payment Registry', detail: 'Bank receipts & reconciliation', tab: 'payments' },
      { type: 'Navigation', label: 'Finished Goods Inventory', detail: 'Current stock balances & crates', tab: 'inventory' },
      { type: 'Navigation', label: 'Raw Material Stock (HDPE/PP)', detail: 'Granules, masterbatches & stock', tab: 'raw-materials' },
      { type: 'Navigation', label: 'Vendors & Suppliers', detail: 'Supplier contacts & directory', tab: 'vendors' },
      { type: 'Navigation', label: 'Expense Tracker', detail: 'Operating expenses & overheads', tab: 'expenses' },
      { type: 'Navigation', label: 'Transport Slips & Log', detail: 'Truck rentals & freight payments', tab: 'transports' },
      { type: 'Navigation', label: 'Employees & HR Portal', detail: 'Staff records & designations', tab: 'employees' },
      { type: 'Navigation', label: 'Payroll & Salaries', detail: 'Monthly salaries & slips', tab: 'salaries' },
      { type: 'Navigation', label: 'Drivers & Vehicle Crew', detail: 'Driver licenses & trip records', tab: 'drivers' },
      { type: 'Navigation', label: 'Bank Accounts & Ledgers', detail: 'Bank balances & reconciliations', tab: 'bank' },
      { type: 'Navigation', label: 'Business Intelligence Reports', detail: 'P&L, analytics & GST reports', tab: 'reports' },
      { type: 'Navigation', label: 'Audit Logs & Compliance', detail: 'User activity audit trails', tab: 'audit-logs' },
      { type: 'Navigation', label: 'System Settings & Config', detail: 'App preferences & company details', tab: 'settings' }
    ];

    systemTabs.filter(t => t.label.toLowerCase().includes(q) || t.detail.toLowerCase().includes(q) || t.tab.includes(q))
      .slice(0, 3).forEach(t => results.push(t));

    // 2. Data Records Search
    (this.partiesList || []).filter(p => p.partyName?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q)).slice(0, 3).forEach(p => {
      results.push({ type: 'Party', label: p.partyName, detail: p.city || p.partyContact || 'Client', tab: 'parties' });
    });

    (this.employeesList || []).filter(e => e.empName?.toLowerCase().includes(q) || e.designation?.toLowerCase().includes(q)).slice(0, 3).forEach(e => {
      results.push({ type: 'Employee', label: e.empName, detail: e.designation || e.empContact || 'Staff', tab: 'employees' });
    });

    (this.salesList || []).filter(s => (s.party?.partyName?.toLowerCase().includes(q) || s.crateType?.toLowerCase().includes(q))).slice(0, 3).forEach(s => {
      results.push({ type: 'Sale', label: `${s.party?.partyName || 'Customer'} - ${s.crateType}`, detail: `₹${s.totalAmount || s.amount || 0}`, tab: 'sales' });
    });

    (this.dispatchesList || []).filter(d => (d.vehicleNumber?.toLowerCase().includes(q) || d.driverName?.toLowerCase().includes(q))).slice(0, 3).forEach(d => {
      results.push({ type: 'Dispatch', label: `${d.vehicleNumber} (${d.driverName || 'Driver'})`, detail: d.dispatchStatus || 'Dispatched', tab: 'dispatch' });
    });

    this.globalSearchResults = results.slice(0, 8);
  }

  goToSearchResult(result: any) {
    this.onNavigateTab.emit(result.tab);
    this.globalSearchResults = [];
    this.globalSearchQuery = '';
  }

  clearGlobalSearch() {
    this.globalSearchQuery = '';
    this.globalSearchResults = [];
    this.searchInputElement?.nativeElement.focus();
  }

  toggleNotifDropdown() {
    this.showNotifDropdown = !this.showNotifDropdown;
    if (this.showNotifDropdown) {
      this.showUserDropdown = false;
      this.showAlertDropdown = false;
      this.globalSearchResults = [];
    }
  }

  toggleUserDropdown() {
    this.showUserDropdown = !this.showUserDropdown;
    if (this.showUserDropdown) {
      this.showNotifDropdown = false;
      this.showAlertDropdown = false;
      this.globalSearchResults = [];
    }
  }

  toggleAlertDropdown() {
    this.showAlertDropdown = !this.showAlertDropdown;
    if (this.showAlertDropdown) {
      this.showNotifDropdown = false;
      this.showUserDropdown = false;
      this.globalSearchResults = [];
    }
  }

  onNotifClick(notif: AppNotification) {
    this.appNotifService.markRead(notif.id);
    if (notif.actionRoute) {
      this.onNavigateTab.emit(notif.actionRoute);
      this.showNotifDropdown = false;
    }
  }

  getUserInitials(user: any): string {
    if (!user) return '?';
    const name = user.name || user.username || '';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  toggleSidebar() {
    this.onToggleSidebar.emit();
  }

  handleLogout() {
    this.showUserDropdown = false;
    this.onLogout.emit();
  }

  setLanguage(lang: string) {
    this.onSetLanguage.emit(lang);
  }

  navigateTo(tab: string) {
    this.showUserDropdown = false;
    this.onNavigateTab.emit(tab);
  }
}
