import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, HostListener, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { TranslatePipe } from '../../../translate.service';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { ResizableTableDirective } from '../../../directives/resizable-table.directive';
import { IndianDatePipe } from '../../../pipes/indian-date.pipe';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { SearchableSelectComponent } from '../../shared/searchable-select/searchable-select.component';

@Component({
  selector: 'app-transports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    AutoSelectDirective,
    FormStateDirective,
    ResizableTableDirective,
    IndianDatePipe,
    EmptyStateComponent,
    SearchableSelectComponent
  ],
  templateUrl: './transports.component.html',
  styleUrls: ['./transports.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransportsComponent implements OnInit, OnDestroy {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'transports';
  @Input() loggedInUser: any = null;
  @Output() onNavigateTab = new EventEmitter<string>();

  isLoading = true;
  hasError = false;

  transportsList: any[] = [];
  drivers: any[] = [];

  // Drawer and Modal States
  isFormDrawerOpen = false;
  isViewModalOpen = false;
  selectedTrip: any = null;
  showExportDropdown = false;

  transportsForm: any = {
    id: null,
    date: new Date().toISOString().substring(0, 10),
    truckNumber: '',
    driverId: '',
    rent: 0,
    advance: 0,
    truckPhotoPath: '',
    driverLicensePath: ''
  };

  // Filter & Search State
  searchInputText: string = '';
  filterSearchQuery: string = '';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  filterStatus: string = 'ALL'; // 'ALL', 'SETTLED', 'PENDING'
  filterDriver: string = 'ALL';
  filterMonth: string = 'ALL';
  filterYear: string = 'ALL';
  showFilterPopover: boolean = false;
  tableDensity: 'compact' | 'normal' | 'spacious' = 'normal';

  get activeFilterCount(): number {
    let count = 0;
    if (this.filterStatus && this.filterStatus !== 'ALL') count++;
    if (this.filterDriver && this.filterDriver !== 'ALL') count++;
    if (this.filterMonth && this.filterMonth !== 'ALL') count++;
    if (this.filterYear && this.filterYear !== 'ALL') count++;
    return count;
  }

  getVisibleColCount(table: string): number {
    const cols = this.columnsVisibility[table] || {};
    return Object.keys(cols).filter(k => cols[k]).length;
  }

  // Pagination & Sorting
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions: number[] = [10, 25, 50, 100];
  isRefreshing = false;
  sortField = 'date';
  sortAsc = false;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  defaultColumns = ['Trip Date', 'Vehicle Number', 'Assigned Driver', 'Freight Rent', 'Advance Paid', 'Balance Due', 'Status', 'Actions'];
  Math = Math;

  readonly allMonths: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService,
    public cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    try {
      localStorage.removeItem('cols_width_transports_table');
    } catch (_) {}
    this.initColumns();

    this.searchSubject.pipe(
      debounceTime(150),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.filterSearchQuery = query;
      this.currentPage = 1;
      this.cdr.markForCheck();
    });

    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(value: string) {
    this.searchInputText = value;
    this.searchSubject.next(value);
  }

  clearSearch() {
    this.searchInputText = '';
    this.filterSearchQuery = '';
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  onPageSizeChange(newSize: number) {
    this.pageSize = Number(newSize);
    this.currentPage = 1;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick() {
    this.showExportDropdown = false;
    this.showColDropdown['transports'] = false;
    this.showFilterPopover = false;
  }

  private initColumns() {
    this.columnsVisibility['transports'] = {};
    this.defaultColumns.forEach(col => {
      this.columnsVisibility['transports'][col] = true;
    });
  }

  loadData(forceRefresh: boolean = false) {
    if (forceRefresh) {
      this.isRefreshing = true;
    } else if (this.transportsList.length === 0) {
      this.isLoading = true;
    } else {
      this.isRefreshing = true;
    }
    this.hasError = false;

    forkJoin({
      drivers: this.apiService.getDrivers(),
      transports: this.apiService.getTransports()
    }).subscribe({
      next: ({ drivers, transports }: { drivers: any[]; transports: any[] }) => {
        this.drivers = drivers || [];
        this.transportsList = (transports || []).map((t: any) => ({
          ...t,
          remaining: (Number(t.rent) || 0) - (Number(t.advance) || 0)
        }));
        this._cachedFilterKey = '';
        this._countsCalculatedForLength = -1;
        this.tableFilteredCounts['transports'] = this.transportsList.length;
        this.isLoading = false;
        this.isRefreshing = false;
        if (forceRefresh) {
          this.notificationService.success('Ledger Refreshed', 'Logistics haulage data updated from server.');
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.isRefreshing = false;
        this.hasError = true;
        this.notificationService.error('Load Failed', 'Could not load transport and logistics data.');
        this.cdr.markForCheck();
      }
    });
  }

  // Permission Checks
  isViewer(): boolean {
    if (this.loggedInUser && this.loggedInUser.role === 'VIEWER') return true;
    try {
      const stored = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u && u.role === 'VIEWER') return true;
      }
    } catch (_) {}
    return false;
  }

  canDelete(): boolean {
    if (this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN')) return true;
    try {
      const stored = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u && (u.role === 'SUPER_ADMIN' || u.role === 'ADMIN')) return true;
      }
    } catch (_) {}
    return true; // default in dev/local mode if role is not restricted
  }

  isEditing(): boolean {
    return !!this.transportsForm.id;
  }

  // Telemetry KPI Calculations
  get totalTripsCount(): number {
    return this.transportsList?.length || 0;
  }

  get totalFreightAmount(): number {
    return (this.transportsList || []).reduce((acc: number, curr: any) => acc + (Number(curr.rent) || 0), 0);
  }

  get totalAdvanceDisbursed(): number {
    return (this.transportsList || []).reduce((acc: number, curr: any) => acc + (Number(curr.advance) || 0), 0);
  }

  get totalPendingBalance(): number {
    return (this.transportsList || []).reduce((acc: number, curr: any) => {
      const rem = (Number(curr.rent) || 0) - (Number(curr.advance) || 0);
      return acc + (rem > 0 ? rem : 0);
    }, 0);
  }

  formatTripId(id: any): string {
    if (!id && id !== 0) return 'TRP-000';
    const str = String(id).trim();
    if (/^\d+$/.test(str)) return `TRP-${str.padStart(4, '0')}`;
    if (str.includes('-')) {
      const parts = str.split('-');
      return `TRP-${parts[0].toUpperCase()}`;
    }
    if (str.length > 8) return `TRP-${str.slice(0, 8).toUpperCase()}`;
    return `TRP-${str.toUpperCase()}`;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isViewModalOpen) {
      this.closeViewModal();
    } else if (this.isFormDrawerOpen) {
      this.closeFormDrawer();
    }
  }

  private _cachedFilterKey = '';
  private _cachedFilteredTransports: any[] = [];
  private _cachedTotalRent = 0;
  private _cachedTotalAdvance = 0;
  private _cachedTotalBalance = 0;
  private _cachedSettledCount = 0;
  private _cachedPendingCount = 0;
  private _countsCalculatedForLength = -1;

  private _ensureFilteredCache(): void {
    const key = `${this.transportsList?.length || 0}_${this.filterStatus}_${this.filterDriver}_${this.filterMonth}_${this.filterYear}_${this.filterSearchQuery || ''}`;
    if (this._cachedFilterKey === key) return;

    let result = [...(this.transportsList || [])];

    if (this.filterStatus === 'SETTLED') {
      result = result.filter((t: any) => ((Number(t.rent) || 0) - (Number(t.advance) || 0)) <= 0);
    } else if (this.filterStatus === 'PENDING') {
      result = result.filter((t: any) => ((Number(t.rent) || 0) - (Number(t.advance) || 0)) > 0);
    }

    if (this.filterDriver !== 'ALL') {
      result = result.filter((t: any) => String(t.driver?.id || t.driverId) === String(this.filterDriver));
    }

    if (this.filterMonth !== 'ALL') {
      const monthIdx = this.allMonths.indexOf(this.filterMonth);
      if (monthIdx >= 0) {
        result = result.filter((t: any) => {
          if (!t.date) return false;
          return new Date(t.date).getMonth() === monthIdx;
        });
      }
    }

    if (this.filterYear !== 'ALL') {
      result = result.filter((t: any) => {
        if (!t.date) return false;
        return String(new Date(t.date).getFullYear()) === String(this.filterYear);
      });
    }

    if (this.filterSearchQuery && this.filterSearchQuery.trim()) {
      const q = this.filterSearchQuery.trim().toLowerCase();
      result = result.filter((t: any) => {
        const truck = (t.truckNumber || '').toLowerCase();
        const driverName = (t.driver?.driverName || '').toLowerCase();
        const driverMobile = (t.driver?.mobile || '').toLowerCase();
        const date = (t.date || '').toLowerCase();
        const rent = String(t.rent || '');
        const advance = String(t.advance || '');
        const remaining = String(t.remaining || '');

        return truck.includes(q) ||
               driverName.includes(q) ||
               driverMobile.includes(q) ||
               date.includes(q) ||
               rent.includes(q) ||
               advance.includes(q) ||
               remaining.includes(q);
      });
    }

    let totRent = 0;
    let totAdv = 0;
    let totBal = 0;
    for (let i = 0; i < result.length; i++) {
      const curr = result[i];
      const r = Number(curr.rent) || 0;
      const a = Number(curr.advance) || 0;
      totRent += r;
      totAdv += a;
      const rem = Number(curr.remaining ?? (r - a));
      if (rem > 0) totBal += rem;
    }

    this._cachedFilteredTransports = result;
    this._cachedTotalRent = totRent;
    this._cachedTotalAdvance = totAdv;
    this._cachedTotalBalance = totBal;
    this._cachedFilterKey = key;
  }

  private _ensureCountsCache(): void {
    const len = this.transportsList?.length || 0;
    if (this._countsCalculatedForLength === len) return;

    let settled = 0;
    let pending = 0;
    for (let i = 0; i < len; i++) {
      const t = this.transportsList[i];
      const rem = (Number(t.rent) || 0) - (Number(t.advance) || 0);
      if (rem <= 0) settled++;
      else pending++;
    }
    this._cachedSettledCount = settled;
    this._cachedPendingCount = pending;
    this._countsCalculatedForLength = len;
  }

  get totalFilteredRent(): number {
    this._ensureFilteredCache();
    return this._cachedTotalRent;
  }

  get totalFilteredAdvance(): number {
    this._ensureFilteredCache();
    return this._cachedTotalAdvance;
  }

  get totalFilteredBalance(): number {
    this._ensureFilteredCache();
    return this._cachedTotalBalance;
  }

  get settledCount(): number {
    this._ensureCountsCache();
    return this._cachedSettledCount;
  }

  get pendingCount(): number {
    this._ensureCountsCache();
    return this._cachedPendingCount;
  }

  get availableYears(): number[] {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    (this.transportsList || []).forEach(t => {
      if (t.date) {
        const y = new Date(t.date).getFullYear();
        if (!isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }

  // Subtab helpers
  setSubtabStatus(status: string) {
    this.filterStatus = status;
    this.currentPage = 1;
  }

  setCurrentMonthFilter() {
    const now = new Date();
    const currentMonthNum = now.getMonth();
    const currentYear = String(now.getFullYear());
    const currentMonthName = this.allMonths[currentMonthNum];

    if (this.filterMonth === currentMonthName && String(this.filterYear) === currentYear) {
      this.filterMonth = 'ALL';
      this.filterYear = 'ALL';
    } else {
      this.filterMonth = currentMonthName;
      this.filterYear = currentYear;
    }
    this.currentPage = 1;
  }

  isCurrentMonthFiltered(): boolean {
    const now = new Date();
    return this.filterMonth === this.allMonths[now.getMonth()] && String(this.filterYear) === String(now.getFullYear());
  }

  getSubtabCount(type: 'ALL' | 'SETTLED' | 'PENDING'): number {
    if (!this.transportsList) return 0;
    if (type === 'ALL') return this.transportsList.length;
    if (type === 'SETTLED') return this.settledCount;
    if (type === 'PENDING') return this.pendingCount;
    return 0;
  }

  // Filter & Search Logic (0ms instantaneous memoized cache)
  get filteredTransports(): any[] {
    this._ensureFilteredCache();
    return this._cachedFilteredTransports;
  }

  hasActiveFilters(): boolean {
    return (
      (this.filterSearchQuery && this.filterSearchQuery.trim() !== '') ||
      this.filterStatus !== 'ALL' ||
      this.filterDriver !== 'ALL' ||
      this.filterMonth !== 'ALL' ||
      this.filterYear !== 'ALL'
    );
  }

  resetFilters() {
    this.searchInputText = '';
    this.filterSearchQuery = '';
    this.filterStatus = 'ALL';
    this.filterDriver = 'ALL';
    this.filterMonth = 'ALL';
    this.filterYear = 'ALL';
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  setDensity(density: 'compact' | 'normal' | 'spacious') {
    this.tableDensity = density;
  }

  getSelectedDriver(): any {
    if (!this.transportsForm.driverId) return null;
    return this.drivers.find((d: any) => String(d.id) === String(this.transportsForm.driverId));
  }

  getFormBalanceDue(): number {
    const rent = Number(this.transportsForm.rent) || 0;
    const adv = Number(this.transportsForm.advance) || 0;
    return rent - adv;
  }

  // Format Truck Number to Uppercase
  onTruckNumberInput() {
    if (this.transportsForm.truckNumber) {
      this.transportsForm.truckNumber = this.transportsForm.truckNumber.toUpperCase().trim();
    }
  }

  // Drawer and Modal Handlers
  openAddDrawer() {
    this.cancelEdit();
    this.isFormDrawerOpen = true;
  }

  closeFormDrawer() {
    this.isFormDrawerOpen = false;
    this.cancelEdit();
  }

  openViewModal(tr: any) {
    this.selectedTrip = tr;
    this.isViewModalOpen = true;
  }

  closeViewModal() {
    this.selectedTrip = null;
    this.isViewModalOpen = false;
  }

  printWaybill() {
    window.print();
  }

  // CRUD Operations
  saveTransport() {
    if (!this.transportsForm.date || !this.transportsForm.truckNumber || !this.transportsForm.driverId) {
      this.notificationService.warning('Validation Incomplete', 'Please fill in date, truck registration number and assigned driver.');
      return;
    }

    if (this.transportsForm.rent == null || Number(this.transportsForm.rent) < 0) {
      this.notificationService.warning('Invalid Rent', 'Freight rent must be a non-negative amount.');
      return;
    }

    if (this.transportsForm.advance == null || Number(this.transportsForm.advance) < 0) {
      this.notificationService.warning('Invalid Advance', 'Advance amount must be a non-negative amount.');
      return;
    }

    const driver = this.drivers.find((d: any) => String(d.id) === String(this.transportsForm.driverId));
    if (!driver) {
      this.notificationService.error('Driver Error', 'Selected driver could not be found.');
      return;
    }

    const payload = {
      date: this.transportsForm.date,
      truckNumber: this.transportsForm.truckNumber.toUpperCase().trim(),
      driver: driver,
      rent: Number(this.transportsForm.rent) || 0,
      advance: Number(this.transportsForm.advance) || 0,
      truckPhotoPath: this.transportsForm.truckPhotoPath || '',
      driverLicensePath: this.transportsForm.driverLicensePath || ''
    };

    if (this.transportsForm.id) {
      // Update
      this.apiService.updateTransport(this.transportsForm.id, payload).subscribe({
        next: () => {
          this.notificationService.success('Record Updated', `Transport entry for truck ${payload.truckNumber} updated successfully.`);
          this.logAudit(`Updated transport trip record for truck: ${payload.truckNumber}`);
          this._cachedFilterKey = '';
          this._countsCalculatedForLength = -1;
          this.cancelEdit();
          this.isFormDrawerOpen = false;
          this.loadData();
        },
        error: (err) => {
          this.notificationService.error('Update Failed', err.error?.message || err.message || 'Could not update transport record.');
          this.cdr.markForCheck();
        }
      });
    } else {
      // Create
      this.apiService.createTransport(payload).subscribe({
        next: () => {
          this.notificationService.success('Trip Registered', `Freight trip for truck ${payload.truckNumber} logged successfully.`);
          this.logAudit(`Registered transport haulage for truck: ${payload.truckNumber} with driver ${driver.driverName}`);
          this._cachedFilterKey = '';
          this._countsCalculatedForLength = -1;
          this.cancelEdit();
          this.isFormDrawerOpen = false;
          this.loadData();
        },
        error: (err) => {
          this.notificationService.error('Registration Failed', err.error?.message || err.message || 'Could not save transport record.');
          this.cdr.markForCheck();
        }
      });
    }
  }

  editTransport(tr: any) {
    this.transportsForm = {
      id: tr.id,
      date: tr.date ? tr.date.substring(0, 10) : new Date().toISOString().substring(0, 10),
      truckNumber: tr.truckNumber || '',
      driverId: tr.driver ? String(tr.driver.id) : (tr.driverId ? String(tr.driverId) : ''),
      rent: tr.rent || 0,
      advance: tr.advance || 0,
      truckPhotoPath: tr.truckPhotoPath || '',
      driverLicensePath: tr.driverLicensePath || ''
    };

    this.isFormDrawerOpen = true;
    this.notificationService.info('Editing Record', `Loaded trip for truck ${tr.truckNumber}.`);
  }

  cancelEdit() {
    this.transportsForm = {
      id: null,
      date: new Date().toISOString().substring(0, 10),
      truckNumber: '',
      driverId: '',
      rent: 0,
      advance: 0,
      truckPhotoPath: '',
      driverLicensePath: ''
    };
  }

  deleteTransport(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', 'Only administrators can delete transport records.');
      return;
    }

    const tr = this.transportsList.find((x: any) => String(x.id) === String(id));
    const targetDesc = tr ? `for truck ${tr.truckNumber} (Driver: ${tr.driver?.driverName || 'Unassigned'})` : '';

    this.notificationService.confirmAction(
      'Confirm Transport Deletion',
      `Are you sure you want to permanently delete this transport trip record ${targetDesc}? This action cannot be undone and will remove freight haulage and advance settlement logs.`,
      'Yes, Delete Record'
    ).then(confirmed => {
      if (confirmed) {
        this.apiService.deleteTransport(id).subscribe({
          next: () => {
            this.transportsList = this.transportsList.filter((x: any) => String(x.id) !== String(id));
            this._cachedFilterKey = '';
            this._countsCalculatedForLength = -1;
            this.tableFilteredCounts['transports'] = this.transportsList.length;
            this.notificationService.success('Record Deleted', 'Transport record deleted successfully.');
            this.logAudit(`Deleted transport trip record ID: ${id}`);
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.notificationService.error('Delete Failed', err.error?.message || err.message || 'Failed to delete transport record.');
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  logAudit(action: string) {
    if (this.loggedInUser) {
      this.apiService.createAuditLog({ username: this.loggedInUser.username, action }).subscribe({
        error: () => {}
      });
    }
  }

  // Quick navigation: Drivers Directory
  goToDrivers() {
    this.onNavigateTab.emit('drivers');
  }

  // Table Column Visibility & Sorting
  toggleColDropdown(table: string, event?: Event) {
    if (event) event.stopPropagation();
    this.showColDropdown[table] = !this.showColDropdown[table];
  }

  getTableColumns(table: string): string[] {
    return this.defaultColumns;
  }

  isColumnVisible(table: string, col: string): boolean {
    return this.columnsVisibility[table] ? this.columnsVisibility[table][col] : true;
  }

  toggleColumn(table: string, col: string) {
    if (this.columnsVisibility[table]) {
      this.columnsVisibility[table][col] = !this.columnsVisibility[table][col];
    }
  }

  setSort(field: string) {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = true;
    }
  }

  private _transportsCache: any[] = [];
  private _transportsCacheKey = '';

  getProcessedList(list: any[], table: string): any[] {
    if (!list || list.length === 0) return [];

    const cacheKey = `${table}_${list.length}_${this.currentPage}_${this.pageSize}_${this.sortField}_${this.sortAsc}`;
    if (this._transportsCacheKey === cacheKey) {
      return this._transportsCache;
    }

    const sorted = [...list].sort((a: any, b: any) => {
      const valA = this.resolvePath(a, this.sortField);
      const valB = this.resolvePath(b, this.sortField);

      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });

    this.tableFilteredCounts[table] = sorted.length;
    const start = (this.currentPage - 1) * this.pageSize;
    const paginated = sorted.slice(start, start + this.pageSize);

    this._transportsCacheKey = cacheKey;
    this._transportsCache = paginated;
    return paginated;
  }

  private resolvePath(obj: any, path: string): any {
    if (!path) return '';
    return path.split('.').reduce((o, p) => o && o[p] != null ? o[p] : '', obj);
  }

  trackById(index: number, item: any): any {
    return item?.id ?? item?.transportId ?? index;
  }

  // Export Options
  toggleExportDropdown(event?: Event) {
    if (event) event.stopPropagation();
    this.showExportDropdown = !this.showExportDropdown;
  }

  exportCsv() {
    const dataToExport = this.filteredTransports;
    if (!dataToExport || dataToExport.length === 0) {
      this.notificationService.warning('Export Empty', 'No transport records to export.');
      return;
    }

    const headers = ['Trip Date', 'Truck Number', 'Assigned Driver', 'Driver Mobile', 'Freight Rent (INR)', 'Advance Disbursed (INR)', 'Balance Due (INR)', 'Settlement Status'];
    const rows = dataToExport.map((t: any) => {
      const rent = Number(t.rent) || 0;
      const adv = Number(t.advance) || 0;
      const rem = rent - adv;
      const status = rem <= 0 ? 'Settled' : 'Balance Due';

      return [
        `"${t.date || ''}"`,
        `"${t.truckNumber || ''}"`,
        `"${t.driver?.driverName || 'Unassigned'}"`,
        `"${t.driver?.mobile || ''}"`,
        rent,
        adv,
        rem,
        `"${status}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `futane_logistics_transports_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showExportDropdown = false;
    this.notificationService.success('Export Ready', 'Transport records exported to CSV successfully.');
  }

  async exportExcel() {
    const dataToExport = this.filteredTransports;
    if (!dataToExport || dataToExport.length === 0) {
      this.notificationService.warning('Export Empty', 'No transport records to export.');
      return;
    }

    const rows = dataToExport.map((t: any, idx: number) => {
      const rent = Number(t.rent) || 0;
      const adv = Number(t.advance) || 0;
      const rem = rent - adv;
      const status = rem <= 0 ? 'Settled' : 'Balance Due';

      return {
        'Sr. No.': idx + 1,
        'Haulage Date': t.date || '',
        'Vehicle / Truck Number': t.truckNumber || '',
        'Assigned Driver': t.driver?.driverName || 'Unassigned',
        'Driver Mobile': t.driver?.mobile || '—',
        'Freight Rent (INR)': rent,
        'Advance Disbursed (INR)': adv,
        'Balance Due (INR)': rem,
        'Settlement Status': status
      };
    });

    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = { Sheets: { 'Transports': worksheet }, SheetNames: ['Transports'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `futane_logistics_transports_${new Date().toISOString().substring(0, 10)}.xlsx`;
    link.click();
    this.showExportDropdown = false;
    this.notificationService.success('Export Ready', 'Transport haulage ledger exported to Excel (.xlsx) successfully.');
  }
}
