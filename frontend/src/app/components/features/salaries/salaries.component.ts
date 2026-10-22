import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { TranslatePipe } from '../../../translate.service';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { IndianDatePipe } from '../../../pipes/indian-date.pipe';
import { ResizableTableDirective } from '../../../directives/resizable-table.directive';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { SearchableSelectComponent } from '../../shared/searchable-select/searchable-select.component';

/**
 * Factory Payroll Disbursement & Monthly Wage Liability Ledger.
 *
 * Capabilities:
 * - Records monthly salary payments for factory staff and machine operators across billing cycles (Month/Year).
 * - Voucher lifecycle management: Tracks status (Paid, Pending, Partial, Cancelled) and payment settlement dates.
 * - Employee wage reconciliation: Automatically links disbursements against contracted employee base salaries.
 * - Subtab workflows: All Vouchers, Paid Disbursements, Pending Payouts, and High Wage Vouchers.
 * - Generates individual employee monthly salary slips with printable deductions and bank disbursement details.
 */
@Component({
  selector: 'app-salaries',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    AutoSelectDirective,
    FormStateDirective,
    IndianDatePipe,
    ResizableTableDirective,
    EmptyStateComponent,
    SearchableSelectComponent
  ],
  templateUrl: './salaries.component.html',
  styleUrls: ['./salaries.component.css']
})
export class SalariesComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'salaries';
  @Input() loggedInUser: any = null;
  @Output() onNavigateTab = new EventEmitter<string>();

  isLoading = true;
  isRefreshing = false;
  hasError = false;

  salariesList: any[] = [];
  employees: any[] = [];

  // Drawer and Modal States
  isFormDrawerOpen = false;
  isViewModalOpen = false;
  selectedVoucher: any = null;
  showExportDropdown = false;

  salariesForm = {
    id: '',
    month: 'May',
    year: 2026,
    salaryAmount: 0,
    status: 'Paid',
    paidDate: new Date().toISOString().substring(0, 10)
  };
  editingSalaryId: string | null = null;

  // Filter & Search State
  filterSearchQuery: string = '';
  filterStatus: string = 'ALL';
  filterMonth: string = 'ALL';
  filterYear: string = 'ALL';
  filterEmployee: string = 'ALL';
  showFilterPopover = false;
  tableDensity: 'compact' | 'normal' | 'spacious' = 'normal';

  get activeFilterCount(): number {
    let count = 0;
    if (this.filterMonth && this.filterMonth !== 'ALL') count++;
    if (this.filterYear && this.filterYear !== 'ALL') count++;
    if (this.filterEmployee && this.filterEmployee !== 'ALL') count++;
    if (this.filterStatus && this.filterStatus !== 'ALL') count++;
    return count;
  }

  // Pagination & Sorting
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions: number[] = [10, 25, 50, 100];
  sortField = 'paidDate';
  sortAsc = false;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  defaultColumns = ['Employee', 'Designation', 'Cycle', 'Salary Amount', 'Paid Date', 'Status', 'Actions'];
  Math = Math;

  readonly allMonths: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    try {
      localStorage.removeItem('cols_width_salaries_table');
    } catch (e) {}
    this.initColumns();
    this.setDefaultDates();
    this.loadData();
  }

  get filteredTotalDisbursed(): number {
    return (this.filteredSalaries || []).reduce((sum, s) => sum + (Number(s.salaryAmount) || 0), 0);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick() {
    this.showExportDropdown = false;
    this.showColDropdown['salaries'] = false;
    this.showFilterPopover = false;
  }

  private initColumns() {
    this.columnsVisibility['salaries'] = {};
    this.defaultColumns.forEach(col => {
      this.columnsVisibility['salaries'][col] = true;
    });
  }

  private setDefaultDates() {
    const now = new Date();
    const currentMonthName = this.allMonths[now.getMonth()];
    this.salariesForm.month = currentMonthName;
    this.salariesForm.year = now.getFullYear();
    this.salariesForm.paidDate = now.toISOString().substring(0, 10);
  }

  loadData(forceRefresh: boolean = false) {
    if (forceRefresh) {
      this.isRefreshing = true;
    } else if (this.salariesList.length === 0) {
      this.isLoading = true;
    } else {
      this.isRefreshing = true;
    }
    this.hasError = false;

    forkJoin({
      employees: this.apiService.getEmployees(),
      salaries: this.apiService.getSalaries()
    }).subscribe({
      next: ({ employees, salaries }) => {
        this.employees = employees || [];
        this.salariesList = salaries || [];
        this.tableFilteredCounts['salaries'] = this.salariesList.length;
        this.isLoading = false;
        this.isRefreshing = false;
        if (forceRefresh) {
          this.notificationService.success('Ledger Refreshed', 'Payroll data updated from central database.');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.isRefreshing = false;
        this.hasError = true;
        this.notificationService.error('Load Failed', 'Could not load salaries and payroll data.');
      }
    });
  }

  onPageSizeChange(newSize: any) {
    this.pageSize = Number(newSize);
    this.currentPage = 1;
  }

  // Permission Checks
  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  isEditing(): boolean {
    return !!this.editingSalaryId;
  }

  // Telemetry KPI Calculations
  get totalPaidAmount(): number {
    return (this.salariesList || [])
      .filter(s => s.status === 'Paid')
      .reduce((acc, curr) => acc + (Number(curr.salaryAmount) || 0), 0);
  }

  get totalPendingAmount(): number {
    return (this.salariesList || [])
      .filter(s => s.status === 'Pending')
      .reduce((acc, curr) => acc + (Number(curr.salaryAmount) || 0), 0);
  }

  get paidCount(): number {
    return (this.salariesList || []).filter(s => s.status === 'Paid').length;
  }

  get pendingCount(): number {
    return (this.salariesList || []).filter(s => s.status === 'Pending').length;
  }

  get disbursalRate(): number {
    const paid = this.totalPaidAmount;
    const total = paid + this.totalPendingAmount;
    return total > 0 ? (paid / total) * 100 : 100;
  }

  get totalPayoutCount(): number {
    return this.salariesList?.length || 0;
  }

  get availableYears(): number[] {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    (this.salariesList || []).forEach(s => {
      if (s.year) years.add(Number(s.year));
    });
    return Array.from(years).sort((a, b) => b - a);
  }

  // Employee Selection Logic
  onEmployeeSelectChange() {
    if (this.salariesForm.id) {
      const emp = this.employees.find(e => String(e.id) === String(this.salariesForm.id));
      if (emp && emp.salary && (!this.salariesForm.salaryAmount || this.salariesForm.salaryAmount === 0)) {
        this.salariesForm.salaryAmount = Number(emp.salary);
      }
    }
  }

  getSelectedEmployee(): any {
    if (!this.salariesForm.id) return null;
    return this.employees.find(e => String(e.id) === String(this.salariesForm.id));
  }

  // Subtab helpers
  setSubtabStatus(status: string) {
    this.filterStatus = status;
    this.currentPage = 1;
  }

  setCurrentMonthFilter() {
    const now = new Date();
    const currentMonth = this.allMonths[now.getMonth()];
    const currentYear = String(now.getFullYear());
    if (this.filterMonth === currentMonth && String(this.filterYear) === currentYear) {
      this.filterMonth = 'ALL';
      this.filterYear = 'ALL';
    } else {
      this.filterMonth = currentMonth;
      this.filterYear = currentYear;
    }
    this.currentPage = 1;
  }

  isCurrentMonthFiltered(): boolean {
    const now = new Date();
    return this.filterMonth === this.allMonths[now.getMonth()] && String(this.filterYear) === String(now.getFullYear());
  }

  getSubtabCount(type: 'ALL' | 'Paid' | 'Pending'): number {
    if (!this.salariesList) return 0;
    if (type === 'ALL') return this.salariesList.length;
    return this.salariesList.filter(s => s.status === type).length;
  }

  // Filter & Search Logic
  get filteredSalaries(): any[] {
    let result = [...(this.salariesList || [])];

    // Status Filter
    if (this.filterStatus !== 'ALL') {
      result = result.filter(s => s.status === this.filterStatus);
    }

    // Month Filter
    if (this.filterMonth !== 'ALL') {
      result = result.filter(s => String(s.month).toLowerCase() === this.filterMonth.toLowerCase());
    }

    // Year Filter
    if (this.filterYear !== 'ALL') {
      result = result.filter(s => String(s.year) === String(this.filterYear));
    }

    // Staff / Employee Filter
    if (this.filterEmployee !== 'ALL') {
      result = result.filter(s => String(s.employee?.id || s.employeeId) === String(this.filterEmployee));
    }

    // Text Search
    if (this.filterSearchQuery && this.filterSearchQuery.trim()) {
      const q = this.filterSearchQuery.trim().toLowerCase();
      result = result.filter(s => {
        const empName = (s.employee?.empName || '').toLowerCase();
        const designation = (s.employee?.designation || '').toLowerCase();
        const month = (s.month || '').toLowerCase();
        const year = String(s.year || '');
        const amount = String(s.salaryAmount || '');
        const status = (s.status || '').toLowerCase();
        const date = (s.paidDate || '').toLowerCase();

        return empName.includes(q) ||
               designation.includes(q) ||
               month.includes(q) ||
               year.includes(q) ||
               amount.includes(q) ||
               status.includes(q) ||
               date.includes(q);
      });
    }

    return result;
  }

  hasActiveFilters(): boolean {
    return (
      (this.filterSearchQuery && this.filterSearchQuery.trim() !== '') ||
      this.filterStatus !== 'ALL' ||
      this.filterMonth !== 'ALL' ||
      this.filterYear !== 'ALL' ||
      this.filterEmployee !== 'ALL'
    );
  }

  resetFilters() {
    this.filterSearchQuery = '';
    this.filterStatus = 'ALL';
    this.filterMonth = 'ALL';
    this.filterYear = 'ALL';
    this.filterEmployee = 'ALL';
    this.currentPage = 1;
  }

  setDensity(density: 'compact' | 'normal' | 'spacious') {
    this.tableDensity = density;
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

  openViewModal(sal: any) {
    this.selectedVoucher = sal;
    this.isViewModalOpen = true;
  }

  closeViewModal() {
    this.selectedVoucher = null;
    this.isViewModalOpen = false;
  }

  formatVoucherId(id: any): string {
    if (!id) return 'NEW';
    const s = String(id).replace(/-/g, '');
    return s.length > 8 ? s.substring(0, 8).toUpperCase() : s.toUpperCase();
  }

  formatEmpId(id: any): string {
    if (!id) return '—';
    const s = String(id).replace(/-/g, '');
    return 'EMP-' + (s.length > 6 ? s.substring(0, 6).toUpperCase() : s.toUpperCase());
  }

  formatStaffName(name: string): string {
    if (!name) return 'Staff Member';
    return name.replace(/\s+\d{10,}$/, '').trim();
  }

  printVoucher() {
    window.print();
  }

  // CRUD Operations
  isSalaryAlreadyPaid(): boolean {
    const empId = parseInt(this.salariesForm.id, 10);
    const month = this.salariesForm.month;
    const year = this.salariesForm.year;
    const existing = (this.salariesList || []).find(s =>
      (s.employee?.id === empId || s.employeeId === empId) &&
      String(s.month).toLowerCase() === String(month).toLowerCase() &&
      String(s.year) === String(year)
    );
    if (existing) {
      this.notificationService.error(
        'Already Recorded',
        `Salary for ${month} ${year} has already been registered for this staff member.`
      );
      return true;
    }
    return false;
  }

  editSalary(sal: any) {
    this.editingSalaryId = sal.id ? String(sal.id) : null;
    this.salariesForm = {
      id: sal.employee ? String(sal.employee.id) : (sal.employeeId ? String(sal.employeeId) : ''),
      month: sal.month || 'May',
      year: sal.year || new Date().getFullYear(),
      salaryAmount: sal.salaryAmount || 0,
      status: sal.status || 'Paid',
      paidDate: sal.paidDate ? sal.paidDate.substring(0, 10) : ''
    };

    this.isFormDrawerOpen = true;
    this.notificationService.info('Editing Record', `Editing payroll record for ${sal.employee?.empName || 'Staff Member'}`);
  }

  cancelEdit() {
    this.editingSalaryId = null;
    this.salariesForm = {
      id: '',
      month: this.allMonths[new Date().getMonth()],
      year: new Date().getFullYear(),
      salaryAmount: 0,
      status: 'Paid',
      paidDate: new Date().toISOString().substring(0, 10)
    };
  }

  saveSalary() {
    if (!this.salariesForm.id || !this.salariesForm.month || !this.salariesForm.year || !this.salariesForm.salaryAmount) {
      this.notificationService.warning('Validation Incomplete', 'Please fill in all mandatory fields.');
      return;
    }

    if (this.salariesForm.salaryAmount <= 0) {
      this.notificationService.warning('Invalid Amount', 'Salary amount must be greater than zero.');
      return;
    }

    const emp = this.employees.find(e => String(e.id) === String(this.salariesForm.id));
    if (!emp) {
      this.notificationService.error('Invalid Staff Member', 'Selected employee could not be found.');
      return;
    }

    const payload = {
      employee: emp,
      month: this.salariesForm.month,
      year: Number(this.salariesForm.year),
      salaryAmount: Number(this.salariesForm.salaryAmount),
      status: this.salariesForm.status,
      paidDate: this.salariesForm.paidDate ? this.salariesForm.paidDate : null
    };

    if (this.editingSalaryId) {
      // Update existing record
      this.apiService.updateSalary(this.editingSalaryId, payload).subscribe({
        next: () => {
          this.notificationService.success('Record Updated', `Salary record for ${emp.empName} updated successfully.`);
          this.logAudit(`Updated salary record for employee: ${emp.empName} (${payload.month} ${payload.year})`);
          this.cancelEdit();
          this.isFormDrawerOpen = false;
          this.loadData();
        },
        error: (err) => {
          this.notificationService.error('Update Failed', err.error?.message || err.message || 'Could not update salary record.');
        }
      });
    } else {
      // Create new salary release
      const now = new Date();
      const monthIndex = this.allMonths.indexOf(this.salariesForm.month);
      if (this.salariesForm.year > now.getFullYear() || (this.salariesForm.year === now.getFullYear() && monthIndex > now.getMonth())) {
        this.notificationService.warning('Future Date Restricted', 'Cannot register payroll records for future months.');
        return;
      }

      if (this.isSalaryAlreadyPaid()) {
        return;
      }

      this.apiService.createSalary(payload).subscribe({
        next: (res) => {
          if (res) this.salariesList.unshift(res);
          this.notificationService.success('Salary Disbursed', `Payroll recorded successfully for ${emp.empName}.`);
          this.logAudit(`Disbursed salary for ${emp.empName}: ₹${payload.salaryAmount} (${payload.month} ${payload.year})`);
          this.cancelEdit();
          this.isFormDrawerOpen = false;
          this.loadData();
        },
        error: (err) => {
          this.notificationService.error('Disbursal Failed', err.error?.message || err.message || 'Could not create salary record.');
        }
      });
    }
  }

  deleteSalary(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', 'Only administrators can delete payroll records.');
      return;
    }

    const record = (this.salariesList || []).find(s => String(s.id) === String(id));
    const empName = record?.employee?.empName || 'Staff Member';
    const cycle = record ? `${record.month} ${record.year}` : '';

    this.notificationService.confirmAction(
      'Confirm Voucher Deletion',
      `Are you sure you want to delete the payroll voucher for ${empName} (${cycle})? This financial record will be permanently deleted and this action cannot be reversed.`,
      'Delete Voucher'
    ).then(confirmed => {
      if (confirmed) {
        this.apiService.deleteSalary(id).subscribe({
          next: () => {
            this.salariesList = this.salariesList.filter(x => String(x.id) !== String(id));
            this.notificationService.success('Record Deleted', 'Salary record deleted successfully.');
            this.logAudit(`Deleted salary voucher ID: ${id} for ${empName} (${cycle})`);
          },
          error: (err) => {
            this.notificationService.error('Delete Failed', err.error?.message || err.message || 'Failed to delete record.');
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

  // Navigation
  goToEmployees() {
    this.onNavigateTab.emit('employees');
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

  private _salariesCache: any[] = [];
  private _salariesCacheKey = '';

  getProcessedList(list: any[], table: string): any[] {
    if (!list || list.length === 0) return [];

    const cacheKey = `${table}_${list.length}_${this.currentPage}_${this.pageSize}_${this.sortField}_${this.sortAsc}`;
    if (this._salariesCacheKey === cacheKey) {
      return this._salariesCache;
    }

    const sorted = [...list].sort((a, b) => {
      const valA = this.resolvePath(a, this.sortField);
      const valB = this.resolvePath(b, this.sortField);

      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });

    this.tableFilteredCounts[table] = sorted.length;
    const start = (this.currentPage - 1) * this.pageSize;
    const paginated = sorted.slice(start, start + this.pageSize);

    this._salariesCacheKey = cacheKey;
    this._salariesCache = paginated;
    return paginated;
  }

  private resolvePath(obj: any, path: string): any {
    if (!path) return '';
    return path.split('.').reduce((o, p) => o && o[p] != null ? o[p] : '', obj);
  }

  trackById(index: number, item: any): any {
    return item?.id ?? item?.salaryId ?? index;
  }

  // Export Options
  toggleExportDropdown(event?: Event) {
    if (event) event.stopPropagation();
    this.showExportDropdown = !this.showExportDropdown;
  }

  exportCsv() {
    const dataToExport = this.filteredSalaries;
    if (!dataToExport || dataToExport.length === 0) {
      this.notificationService.warning('Export Empty', 'No salary records to export.');
      return;
    }

    const headers = ['Staff ID', 'Employee Name', 'Designation', 'Month', 'Year', 'Salary Amount (INR)', 'Payment Status', 'Paid Date'];
    const rows = dataToExport.map(s => [
      `"${s.employee?.id || s.employeeId || ''}"`,
      `"${s.employee?.empName || 'Staff #' + (s.employee?.id || s.employeeId || '')}"`,
      `"${s.employee?.designation || 'Staff'}"`,
      `"${s.month || ''}"`,
      s.year || '',
      s.salaryAmount || 0,
      `"${s.status || ''}"`,
      `"${s.paidDate || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `futane_salaries_payroll_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showExportDropdown = false;
    this.notificationService.success('Export Ready', 'Salary records exported to CSV successfully.');
  }

  async exportExcel() {
    const dataToExport = this.filteredSalaries;
    if (!dataToExport || dataToExport.length === 0) {
      this.notificationService.warning('Export Empty', 'No salary records to export.');
      return;
    }

    const rows = dataToExport.map((s, idx) => ({
      'Sr. No.': idx + 1,
      'Staff ID': s.employee?.id || s.employeeId || '—',
      'Employee Name': s.employee?.empName || 'Staff #' + (s.employee?.id || s.employeeId || ''),
      'Designation': s.employee?.designation || 'Staff',
      'Wage Month': s.month || '',
      'Wage Year': s.year || '',
      'Salary Amount (INR)': s.salaryAmount || 0,
      'Payment Status': s.status || '',
      'Disbursement Date': s.paidDate || '—'
    }));

    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = { Sheets: { 'Salaries': worksheet }, SheetNames: ['Salaries'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `futane_salaries_ledger_${new Date().toISOString().substring(0, 10)}.xlsx`;
    link.click();
    this.showExportDropdown = false;
    this.notificationService.success('Export Ready', 'Salary ledger exported to Excel (.xlsx) successfully.');
  }
}
