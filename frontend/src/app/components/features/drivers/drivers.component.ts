import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { TranslatePipe } from '../../../translate.service';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { ResizableTableDirective } from '../../../directives/resizable-table.directive';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';

@Component({
  selector: 'app-drivers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    AutoSelectDirective,
    ResizableTableDirective,
    EmptyStateComponent
  ],
  templateUrl: './drivers.component.html',
  styleUrls: ['./drivers.component.css']
})
export class DriversComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'drivers';
  @Input() loggedInUser: any = null;
  @Input() transportsList: any[] = [];
  @Output() onNavigateTab = new EventEmitter<string>();

  drivers: any[] = [];
  isLoading = false;
  isRefreshing = false;
  hasError = false;
  isFormDrawerOpen = false;

  driverForm: {
    id: any;
    driverName: string;
    mobile: string;
    licenseNumber: string;
    address: string;
  } = {
    id: null,
    driverName: '',
    mobile: '',
    licenseNumber: '',
    address: ''
  };

  // Filter & Search State
  filterStatus: 'ALL' | 'ACTIVE' | 'LICENSED' | 'STANDBY' = 'ALL';
  filterSearchQuery: string = '';

  // Table Configuration & Pagination
  tableDensity: 'compact' | 'normal' | 'spacious' = 'normal';
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions: number[] = [10, 25, 50, 100];
  sortField = 'id';
  sortAsc = false;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {
    drivers: {
      'Driver': true,
      'Mobile Contact': true,
      'Driving License': true,
      'Base Depot / Address': true,
      'Trips Logged': true,
      'Gross Earnings': true,
      'Status': true,
      'Actions': true
    }
  };

  defaultColumns = [
    'Driver',
    'Mobile Contact',
    'Driving License',
    'Base Depot / Address',
    'Trips Logged',
    'Gross Earnings',
    'Status',
    'Actions'
  ];

  Math = Math;

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    try {
      localStorage.removeItem('cols_width_drivers_table');
    } catch (_) {}
    this.loadData();
  }

  loadData(forceRefresh: boolean = false) {
    if (forceRefresh) {
      this.isRefreshing = true;
    } else if (this.drivers.length === 0) {
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
        this.transportsList = transports || [];
        this.tableFilteredCounts['drivers'] = this.drivers.length;
        this.isLoading = false;
        this.isRefreshing = false;
        if (forceRefresh) {
          this.notificationService.success('Roster Refreshed', 'Drivers registry and transport activity updated.');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.isRefreshing = false;
        this.hasError = true;
        this.notificationService.error('Load Failed', 'Could not load drivers directory and transport logs.');
      }
    });
  }

  // Permission Checks
  isViewer(): boolean {
    if (this.loggedInUser) {
      return this.loggedInUser.role === 'VIEWER';
    }
    try {
      const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        return u.role === 'VIEWER';
      }
    } catch (e) {}
    return false;
  }

  canDelete(): boolean {
    if (this.loggedInUser) {
      return this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN';
    }
    try {
      const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        return u.role === 'SUPER_ADMIN' || u.role === 'ADMIN';
      }
    } catch (e) {}
    return true;
  }

  isEditing(): boolean {
    return !!this.driverForm.id;
  }

  // Telemetry KPI Calculations
  get totalDriversCount(): number {
    return this.drivers?.length || 0;
  }

  get licensedDriversCount(): number {
    return (this.drivers || []).filter((d: any) => !!d.licenseNumber && d.licenseNumber.trim() !== '').length;
  }

  get totalTripsLogged(): number {
    return (this.transportsList || []).length;
  }

  get totalFreightVolume(): number {
    return (this.transportsList || []).reduce((acc: number, curr: any) => acc + (Number(curr.rent) || 0), 0);
  }

  // Driver Statistics Helper
  getDriverStats(driverId: string | number): { trips: number; earnings: number } {
    if (!driverId) return { trips: 0, earnings: 0 };
    const trips = (this.transportsList || []).filter((t: any) => 
      (t.driver && String(t.driver.id) === String(driverId)) || 
      (t.driverId && String(t.driverId) === String(driverId))
    );
    return {
      trips: trips.length,
      earnings: trips.reduce((acc: number, t: any) => acc + (Number(t.rent) || 0), 0)
    };
  }

  getTotalFilteredTrips(): number {
    return (this.filteredDrivers || []).reduce((sum: number, d: any) => sum + this.getDriverStats(d.id).trips, 0);
  }

  getTotalFilteredEarnings(): number {
    return (this.filteredDrivers || []).reduce((sum: number, d: any) => sum + this.getDriverStats(d.id).earnings, 0);
  }

  // Filter Counts
  get activeDriversCount(): number {
    return (this.drivers || []).filter((d: any) => this.getDriverStats(d.id).trips > 0).length;
  }

  get standbyDriversCount(): number {
    return (this.drivers || []).filter((d: any) => this.getDriverStats(d.id).trips === 0).length;
  }

  // Filter & Search Logic
  get filteredDrivers(): any[] {
    let result = [...(this.drivers || [])];

    // Status Filter
    if (this.filterStatus === 'ACTIVE') {
      result = result.filter((d: any) => this.getDriverStats(d.id).trips > 0);
    } else if (this.filterStatus === 'LICENSED') {
      result = result.filter((d: any) => !!d.licenseNumber && d.licenseNumber.trim() !== '');
    } else if (this.filterStatus === 'STANDBY') {
      result = result.filter((d: any) => this.getDriverStats(d.id).trips === 0);
    }

    // Text Search
    if (this.filterSearchQuery && this.filterSearchQuery.trim()) {
      const q = this.filterSearchQuery.trim().toLowerCase();
      result = result.filter((d: any) => {
        const name = (d.driverName || '').toLowerCase();
        const mobile = (d.mobile || '').toLowerCase();
        const license = (d.licenseNumber || '').toLowerCase();
        const address = (d.address || '').toLowerCase();
        return name.includes(q) || mobile.includes(q) || license.includes(q) || address.includes(q);
      });
    }

    return result;
  }

  hasActiveFilters(): boolean {
    return (
      (this.filterSearchQuery && this.filterSearchQuery.trim() !== '') ||
      this.filterStatus !== 'ALL'
    );
  }

  setSubtabStatus(status: 'ALL' | 'ACTIVE' | 'LICENSED' | 'STANDBY') {
    this.filterStatus = status;
    this.currentPage = 1;
  }

  getSubtabCount(status: string): number {
    if (status === 'ALL') return this.totalDriversCount;
    if (status === 'ACTIVE') return this.activeDriversCount;
    if (status === 'LICENSED') return this.licensedDriversCount;
    if (status === 'STANDBY') return this.standbyDriversCount;
    return 0;
  }

  resetFilters() {
    this.filterSearchQuery = '';
    this.filterStatus = 'ALL';
    this.currentPage = 1;
  }

  setDensity(density: 'compact' | 'normal' | 'spacious') {
    this.tableDensity = density;
  }

  onPageSizeChange(newSize: any) {
    this.pageSize = Number(newSize) || 10;
    this.currentPage = 1;
  }

  // Drawer Management
  openEnrollDrawer() {
    this.cancelEdit();
    this.isFormDrawerOpen = true;
  }

  openEditDrawer(driver: any) {
    this.editDriver(driver);
  }

  closeFormDrawer() {
    this.isFormDrawerOpen = false;
    this.cancelEdit();
  }

  // Format Commercial License to Uppercase
  onLicenseInput() {
    if (this.driverForm.licenseNumber) {
      this.driverForm.licenseNumber = this.driverForm.licenseNumber.toUpperCase().trim();
    }
  }

  // Live Profile Readiness Check
  getProfileReadiness(): { valid: boolean; label: string; tagClass: string } {
    const hasName = !!this.driverForm.driverName && this.driverForm.driverName.trim().length >= 2;
    const hasMobile = !!this.driverForm.mobile && this.driverForm.mobile.trim().length >= 10;
    const hasLicense = !!this.driverForm.licenseNumber && this.driverForm.licenseNumber.trim().length >= 6;
    const hasAddress = !!this.driverForm.address && this.driverForm.address.trim().length >= 3;

    if (hasName && hasMobile && hasLicense && hasAddress) {
      return { valid: true, label: 'Verified Commercial Roster', tagClass: 'badge-success' };
    } else if (hasName && hasMobile) {
      return { valid: false, label: 'Pending RTO License / Address', tagClass: 'badge-warning' };
    }
    return { valid: false, label: 'Incomplete Personnel Profile', tagClass: 'badge-danger' };
  }

  // CRUD Operations
  saveDriver() {
    if (!this.driverForm.driverName || !this.driverForm.driverName.trim()) {
      this.notificationService.warning('Validation Required', 'Driver full name is required.');
      return;
    }

    if (!this.driverForm.mobile || this.driverForm.mobile.trim().length < 10) {
      this.notificationService.warning('Invalid Contact', 'Please provide a valid 10-digit mobile number.');
      return;
    }

    if (!this.driverForm.licenseNumber || !this.driverForm.licenseNumber.trim()) {
      this.notificationService.warning('License Required', 'Commercial driving license number is required for compliance.');
      return;
    }

    const payload = {
      driverName: this.driverForm.driverName.trim(),
      mobile: this.driverForm.mobile.trim(),
      licenseNumber: this.driverForm.licenseNumber.toUpperCase().trim(),
      address: this.driverForm.address ? this.driverForm.address.trim() : ''
    };

    if (this.driverForm.id) {
      // Update
      this.apiService.updateDriver(this.driverForm.id, payload).subscribe({
        next: () => {
          this.notificationService.success('Profile Updated', `Driver ${payload.driverName} updated successfully.`);
          this.logAudit(`Updated driver profile: ${payload.driverName}`);
          this.closeFormDrawer();
          this.loadData();
        },
        error: (err) => {
          this.notificationService.error('Update Failed', err.error?.message || err.message || 'Could not update driver record.');
        }
      });
    } else {
      // Create
      this.apiService.createDriver(payload).subscribe({
        next: (res: any) => {
          this.notificationService.success('Driver Enrolled', `Driver ${payload.driverName} added to fleet roster.`);
          this.logAudit(`Enrolled commercial driver: ${payload.driverName}`);
          this.closeFormDrawer();
          this.loadData();
        },
        error: (err) => {
          this.notificationService.error('Enrollment Failed', err.error?.message || err.message || 'Could not add driver to roster.');
        }
      });
    }
  }

  editDriver(driver: any) {
    this.driverForm = {
      id: driver.id,
      driverName: driver.driverName || '',
      mobile: driver.mobile || '',
      licenseNumber: driver.licenseNumber || '',
      address: driver.address || ''
    };
    this.isFormDrawerOpen = true;
    this.notificationService.info('Editing Driver', `Editing credentials for ${driver.driverName}.`);
  }

  cancelEdit() {
    this.driverForm = {
      id: null,
      driverName: '',
      mobile: '',
      licenseNumber: '',
      address: ''
    };
  }

  deleteDriver(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', 'Only administrators can delete driver profiles.');
      return;
    }

    const driver = this.drivers.find((d: any) => String(d.id) === String(id));
    const name = driver ? driver.driverName : 'this driver';

    this.notificationService.confirmAction(
      'Confirm Driver Removal',
      `Are you sure you want to remove ${name} from the fleet roster? This action cannot be undone.`,
      'Yes, Remove'
    ).then(confirmed => {
      if (confirmed) {
        this.apiService.deleteDriver(id).subscribe({
          next: () => {
            this.drivers = this.drivers.filter((x: any) => String(x.id) !== String(id));
            this.notificationService.success('Driver Removed', `${name} removed from fleet roster.`);
            this.logAudit(`Removed driver ID ${id} (${name})`);
          },
          error: (err) => {
            this.notificationService.error('Removal Failed', err.error?.message || err.message || 'Failed to remove driver.');
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

  // Quick navigation: Log Haulage Trip
  goToTransports() {
    this.onNavigateTab.emit('transports');
  }

  // Table Column Visibility & Sorting
  toggleColDropdown(table: string) {
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

  getProcessedList(list: any[], table: string): any[] {
    if (!list) return [];

    const sorted = [...list].sort((a: any, b: any) => {
      let valA: any;
      let valB: any;

      if (this.sortField === 'trips') {
        valA = this.getDriverStats(a.id).trips;
        valB = this.getDriverStats(b.id).trips;
      } else if (this.sortField === 'earnings') {
        valA = this.getDriverStats(a.id).earnings;
        valB = this.getDriverStats(b.id).earnings;
      } else {
        valA = this.resolvePath(a, this.sortField);
        valB = this.resolvePath(b, this.sortField);
      }

      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });

    this.tableFilteredCounts[table] = sorted.length;
    const start = (this.currentPage - 1) * this.pageSize;
    return sorted.slice(start, start + this.pageSize);
  }

  private resolvePath(obj: any, path: string): any {
    if (!path) return '';
    return path.split('.').reduce((o: any, p: string) => o && o[p] != null ? o[p] : '', obj);
  }

  trackById(index: number, item: any): any {
    return item?.id ?? item?.driverId ?? index;
  }

  getDriverInitials(name: string): string {
    if (!name) return 'DR';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // Export CSV
  exportCsv() {
    const dataToExport = this.filteredDrivers;
    if (!dataToExport || dataToExport.length === 0) {
      this.notificationService.warning('Export Empty', 'No driver records to export.');
      return;
    }

    const headers = ['Driver Name', 'Mobile Number', 'Driving License Number', 'Base Depot / Address', 'Lifetime Trips', 'Total Freight Earned (INR)', 'RTO Status'];
    const rows = dataToExport.map((d: any) => {
      const stats = this.getDriverStats(d.id);
      const isLicensed = !!d.licenseNumber && d.licenseNumber.trim() !== '';

      return [
        `"${d.driverName || ''}"`,
        `"${d.mobile || ''}"`,
        `"${d.licenseNumber || ''}"`,
        `"${(d.address || '').replace(/"/g, '""')}"`,
        stats.trips,
        stats.earnings,
        `"${isLicensed ? 'Verified License' : 'Unlicensed'}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `futane_drivers_roster_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notificationService.success('Export Ready', 'Drivers roster exported to CSV successfully.');
  }

  exportExcel() {
    const dataToExport = this.filteredDrivers;
    if (!dataToExport || dataToExport.length === 0) {
      this.notificationService.warning('Export Empty', 'No driver records to export.');
      return;
    }

    const headers = ['Driver Name', 'Mobile Number', 'Driving License Number', 'Base Depot / Address', 'Lifetime Trips', 'Total Freight Earned (INR)', 'RTO Status'];
    const rows = dataToExport.map((d: any) => {
      const stats = this.getDriverStats(d.id);
      const isLicensed = !!d.licenseNumber && d.licenseNumber.trim() !== '';

      return [
        `"${d.driverName || ''}"`,
        `"${d.mobile || ''}"`,
        `"${d.licenseNumber || ''}"`,
        `"${(d.address || '').replace(/"/g, '""')}"`,
        stats.trips,
        stats.earnings,
        `"${isLicensed ? 'Verified License' : 'Unlicensed'}"`
      ];
    });

    const csvString = '\uFEFF' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\r\n');
    const blob = new Blob([csvString], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `futane_drivers_roster_${new Date().toISOString().substring(0, 10)}.xls`;
    link.click();
    this.notificationService.success('Export Ready', 'Drivers roster downloaded for Excel.');
  }
}
