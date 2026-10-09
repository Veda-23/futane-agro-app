import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { TranslatePipe } from '../../../translate.service';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { IndianDatePipe } from '../../../pipes/indian-date.pipe';
import { ResizableTableDirective } from '../../../directives/resizable-table.directive';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import * as XLSX from 'xlsx';

export interface EmployeeItem {
  id?: string | number;
  empId?: number;
  empName: string;
  empContact: string;
  designation: string;
  salary: number;
  address?: string;
  joiningDate?: string;
  aadhaarNo?: string;
  bankAccount?: string;
  photoPath?: string;
  aadhaarCardPath?: string;
  bankPassbookPath?: string;
}

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    AutoSelectDirective,
    FormStateDirective,
    IndianDatePipe,
    ResizableTableDirective,
    EmptyStateComponent
  ],
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.css']
})
export class EmployeesComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'employees';
  @Input() loggedInUser: any = null;
  @Output() onNavigateTab = new EventEmitter<string>();

  isLoading = true;
  hasError = false;

  employees: EmployeeItem[] = [];
  employeeForm: any = {
    id: null,
    empName: '',
    empContact: '',
    designation: '',
    salary: 0,
    address: '',
    joiningDate: new Date().toISOString().substring(0, 10),
    aadhaarNo: '',
    bankAccount: ''
  };

  // Form Drawer & Details Drawer State
  isFormOpen = false;
  isSaving = false;
  isDetailsOpen = false;
  selectedEmployee: EmployeeItem | null = null;
  detailsActiveTab: 'overview' | 'employment' | 'compliance' = 'overview';

  // Filter & Search State
  filterSearchQuery: string = '';
  filterRole: string = 'ALL';
  filterCompliance: string = 'ALL';
  showFilterPopover = false;
  tableDensity: 'compact' | 'normal' | 'spacious' = 'normal';

  get activeFilterCount(): number {
    let count = 0;
    if (this.filterRole && this.filterRole !== 'ALL') count++;
    if (this.filterCompliance && this.filterCompliance !== 'ALL') count++;
    return count;
  }

  // Dropdown States
  showColDropdown: { [key: string]: boolean } = {};
  showExportDropdown = false;

  // Pagination & Sorting
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 15, 25, 50];
  sortField = 'empName';
  sortAsc = true;
  tableFilteredCounts: { [key: string]: number } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  defaultColumns = [
    'Staff Member',
    'Role / Designation',
    'Mobile Contact',
    'Base Salary',
    'Joining Date',
    'Credentials',
    'Actions'
  ];
  Math = Math;

  // Common designations for quick selection
  readonly standardRoles = [
    'Machine Operator',
    'Quality Inspector',
    'Warehouse Lead',
    'Maintenance Tech',
    'Accounts Assistant',
    'Plant Supervisor',
    'Dispatch Officer'
  ];

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    try {
      localStorage.removeItem('cols_width_employees_table');
    } catch (e) {}
    this.initColumns();
    this.loadData();
  }

  get filteredTotalSalary(): number {
    return (this.filteredEmployees || []).reduce((sum, e) => sum + (Number(e.salary) || 0), 0);
  }

  // Close floating menus on outside click
  @HostListener('document:click', ['$event'])
  onDocumentClick() {
    this.showExportDropdown = false;
    this.showColDropdown['employees'] = false;
    this.showFilterPopover = false;
  }

  private initColumns() {
    this.columnsVisibility['employees'] = {};
    this.defaultColumns.forEach(col => {
      this.columnsVisibility['employees'][col] = true;
    });
  }

  loadData(forceRefresh: boolean = false) {
    if (this.employees.length === 0) this.isLoading = true;
    this.hasError = false;

    this.apiService.getEmployees(forceRefresh).subscribe({
      next: (res: any[]) => {
        this.employees = res || [];
        this.tableFilteredCounts['employees'] = this.filteredEmployees.length;
        this.isLoading = false;
        if (forceRefresh) {
          this.notificationService.success('Directory Refreshed', 'Factory workforce roster synchronized with server.');
        }
      },
      error: () => {
        this.isLoading = false;
        this.hasError = true;
        this.notificationService.error('Load Failed', 'Could not load employees directory data.');
      }
    });
  }

  // Permission Checks
  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  isEditing(): boolean {
    return !!this.employeeForm.id;
  }

  // Telemetry KPI Calculations
  get totalEmployees(): number {
    return this.employees?.length || 0;
  }

  get totalMonthlyPayroll(): number {
    return (this.employees || []).reduce((acc, curr) => acc + (Number(curr.salary) || 0), 0);
  }

  get averageSalary(): number {
    const total = this.totalEmployees;
    return total > 0 ? this.totalMonthlyPayroll / total : 0;
  }

  get distinctRoles(): string[] {
    const roles = new Set<string>();
    (this.employees || []).forEach(e => {
      if (e.designation && e.designation.trim()) {
        roles.add(e.designation.trim());
      }
    });
    return Array.from(roles).sort();
  }

  get distinctRolesCount(): number {
    return this.distinctRoles.length;
  }

  // Subtab count helpers
  getSubtabCount(role: string): number {
    if (!this.employees) return 0;
    if (role === 'ALL') return this.employees.length;
    return this.employees.filter(e =>
      (e.designation || '').toLowerCase().includes(role.toLowerCase())
    ).length;
  }

  setSubtabRole(role: string) {
    this.filterRole = role;
    this.currentPage = 1;
  }

  // Filter & Search Logic
  get filteredEmployees(): EmployeeItem[] {
    let result = [...(this.employees || [])];

    // Role / Designation Filter
    if (this.filterRole !== 'ALL') {
      result = result.filter(e =>
        (e.designation || '').toLowerCase().includes(this.filterRole.toLowerCase())
      );
    }

    // Compliance Filter
    if (this.filterCompliance !== 'ALL') {
      if (this.filterCompliance === 'VERIFIED') {
        result = result.filter(e => !!(e.aadhaarNo && e.bankAccount));
      } else if (this.filterCompliance === 'PENDING_AADHAAR') {
        result = result.filter(e => !e.aadhaarNo);
      } else if (this.filterCompliance === 'PENDING_BANK') {
        result = result.filter(e => !e.bankAccount);
      }
    }

    // Text Search
    if (this.filterSearchQuery && this.filterSearchQuery.trim()) {
      const q = this.filterSearchQuery.trim().toLowerCase();
      result = result.filter(e => {
        const name = (e.empName || '').toLowerCase();
        const desig = (e.designation || '').toLowerCase();
        const contact = (e.empContact || '').toLowerCase();
        const addr = (e.address || '').toLowerCase();
        const aadhaar = (e.aadhaarNo || '').toLowerCase();
        const bank = (e.bankAccount || '').toLowerCase();
        const salary = String(e.salary || '');
        const id = String(e.id || '');

        return name.includes(q) ||
               desig.includes(q) ||
               contact.includes(q) ||
               addr.includes(q) ||
               aadhaar.includes(q) ||
               bank.includes(q) ||
               salary.includes(q) ||
               id.includes(q);
      });
    }

    this.tableFilteredCounts['employees'] = result.length;
    return result;
  }

  get totalPages(): number {
    const total = this.filteredEmployees.length;
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  hasActiveFilters(): boolean {
    return (
      (this.filterSearchQuery && this.filterSearchQuery.trim() !== '') ||
      this.filterRole !== 'ALL' ||
      this.filterCompliance !== 'ALL'
    );
  }

  resetFilters() {
    this.filterSearchQuery = '';
    this.filterRole = 'ALL';
    this.filterCompliance = 'ALL';
    this.currentPage = 1;
  }

  setDensity(density: 'compact' | 'normal' | 'spacious') {
    this.tableDensity = density;
  }

  // Drawer Controls
  openAddDrawer() {
    if (this.isViewer()) return;
    this.cancelEdit();
    this.isFormOpen = true;
  }

  openEditDrawer(emp: EmployeeItem) {
    if (this.isViewer()) return;
    this.editEmployee(emp);
    this.isFormOpen = true;
  }

  closeDrawer() {
    this.isFormOpen = false;
    this.cancelEdit();
  }

  // Details Drawer Controls
  openDetails(emp: EmployeeItem) {
    this.selectedEmployee = emp;
    this.detailsActiveTab = 'overview';
    this.isDetailsOpen = true;
  }

  closeDetails() {
    this.isDetailsOpen = false;
    this.selectedEmployee = null;
  }

  // CRUD Operations
  isDuplicateEmployee(): boolean {
    const name = this.employeeForm.empName?.trim().toLowerCase();
    const aadhaar = this.employeeForm.aadhaarNo?.trim();
    const currentId = this.employeeForm.id ? String(this.employeeForm.id) : null;

    const dupe = (this.employees || []).find(e => {
      if (currentId && String(e.id) === currentId) return false;
      const nameMatch = name && (e.empName || '').trim().toLowerCase() === name;
      const aadhaarMatch = aadhaar && e.aadhaarNo && e.aadhaarNo.trim() === aadhaar;
      return nameMatch || aadhaarMatch;
    });

    if (dupe) {
      this.notificationService.error(
        'Duplicate Staff Record',
        `An employee with name "${dupe.empName}" or matching Aadhaar already exists.`
      );
      return true;
    }
    return false;
  }

  validateBankDetails(bankAccount: string): boolean {
    if (!bankAccount || !bankAccount.trim()) return true;
    const clean = bankAccount.trim();
    if (clean.length < 9) {
      this.notificationService.warning(
        'Invalid Bank Details',
        'Bank account details must be at least 9 characters (e.g. Account No or IFSC / Account No).'
      );
      return false;
    }
    return true;
  }

  saveEmployee() {
    if (!this.employeeForm.empName || !this.employeeForm.empName.trim()) {
      this.notificationService.warning('Validation Incomplete', 'Staff member name is mandatory.');
      return;
    }

    if (!this.employeeForm.empContact || !this.employeeForm.empContact.trim()) {
      this.notificationService.warning('Validation Incomplete', 'Contact number is mandatory.');
      return;
    }

    const contactClean = this.employeeForm.empContact.replace(/\D/g, '');
    if (contactClean.length < 10) {
      this.notificationService.warning('Invalid Mobile', 'Contact number must be at least 10 digits.');
      return;
    }

    if (!this.employeeForm.designation || !this.employeeForm.designation.trim()) {
      this.notificationService.warning('Validation Incomplete', 'Designation / role is mandatory.');
      return;
    }

    if (this.employeeForm.salary == null || Number(this.employeeForm.salary) < 0) {
      this.notificationService.warning('Invalid Salary', 'Base salary cannot be negative.');
      return;
    }

    if (this.employeeForm.aadhaarNo && this.employeeForm.aadhaarNo.trim()) {
      const aadhaarClean = this.employeeForm.aadhaarNo.trim();
      if (!/^[2-9]{1}[0-9]{11}$/.test(aadhaarClean)) {
        this.notificationService.warning('Invalid Aadhaar', 'Aadhaar number must be exactly 12 digits and cannot start with 0 or 1.');
        return;
      }
    }

    if (!this.validateBankDetails(this.employeeForm.bankAccount)) {
      return;
    }

    if (this.isDuplicateEmployee()) {
      return;
    }

    this.isSaving = true;
    const payload = {
      empName: this.employeeForm.empName.trim(),
      empContact: this.employeeForm.empContact.trim(),
      designation: this.employeeForm.designation.trim(),
      salary: Number(this.employeeForm.salary) || 0,
      address: this.employeeForm.address ? this.employeeForm.address.trim() : '',
      joiningDate: this.employeeForm.joiningDate || new Date().toISOString().substring(0, 10),
      aadhaarNo: this.employeeForm.aadhaarNo ? this.employeeForm.aadhaarNo.trim() : '',
      bankAccount: this.employeeForm.bankAccount ? this.employeeForm.bankAccount.trim() : ''
    };

    if (this.employeeForm.id) {
      // Update
      this.apiService.updateEmployee(this.employeeForm.id, payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.notificationService.success('Staff Updated', `Profile for ${payload.empName} updated successfully.`);
          this.logAudit(`Updated employee profile: ${payload.empName} (${payload.designation})`);
          this.closeDrawer();
          this.loadData(true);
        },
        error: (err) => {
          this.isSaving = false;
          this.notificationService.error('Update Failed', err.error?.message || err.message || 'Could not update staff profile.');
        }
      });
    } else {
      // Create
      this.apiService.createEmployee(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.notificationService.success('Staff Enrolled', `Profile for ${payload.empName} enrolled successfully.`);
          this.logAudit(`Registered new staff member: ${payload.empName} (${payload.designation})`);
          this.closeDrawer();
          this.loadData(true);
        },
        error: (err) => {
          this.isSaving = false;
          this.notificationService.error('Enrollment Failed', err.error?.message || err.message || 'Could not save employee.');
        }
      });
    }
  }

  editEmployee(emp: any) {
    this.employeeForm = {
      id: emp.id,
      empName: emp.empName || '',
      empContact: emp.empContact || '',
      designation: emp.designation || '',
      salary: emp.salary || 0,
      address: emp.address || '',
      joiningDate: emp.joiningDate ? emp.joiningDate.substring(0, 10) : new Date().toISOString().substring(0, 10),
      aadhaarNo: emp.aadhaarNo || '',
      bankAccount: emp.bankAccount || ''
    };
  }

  cancelEdit() {
    this.employeeForm = {
      id: null,
      empName: '',
      empContact: '',
      designation: '',
      salary: 0,
      address: '',
      joiningDate: new Date().toISOString().substring(0, 10),
      aadhaarNo: '',
      bankAccount: ''
    };
  }

  deleteEmployee(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', 'Only administrators can remove staff records.');
      return;
    }

    this.notificationService.confirmAction(
      'Confirm Deletion',
      'Are you sure you want to delete this staff record? This action will remove their payroll credentials.',
      'Yes, Delete'
    ).then(confirmed => {
      if (confirmed) {
        this.apiService.deleteEmployee(id).subscribe({
          next: () => {
            this.employees = this.employees.filter(x => String(x.id) !== String(id));
            this.tableFilteredCounts['employees'] = this.filteredEmployees.length;
            this.notificationService.success('Record Removed', 'Staff record deleted successfully.');
            this.logAudit(`Deleted staff record ID: ${id}`);
          },
          error: (err) => {
            this.notificationService.error('Delete Failed', err.error?.message || err.message || 'Failed to delete employee.');
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

  // Quick action: navigate to Salaries tab
  goToSalaries() {
    this.onNavigateTab.emit('salaries');
  }

  // Table Column Visibility & Sorting
  toggleColDropdown(table: string, event?: Event) {
    if (event) event.stopPropagation();
    this.showColDropdown[table] = !this.showColDropdown[table];
    this.showExportDropdown = false;
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

  resetColumns() {
    this.defaultColumns.forEach(col => {
      this.columnsVisibility['employees'][col] = true;
    });
  }

  get visibleColumnCount(): number {
    return this.defaultColumns.filter(col => this.isColumnVisible('employees', col)).length;
  }

  setSort(field: string) {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = true;
    }
    this.currentPage = 1;
  }

  getProcessedList(list: any[], table: string): any[] {
    if (!list) return [];

    const sorted = [...list].sort((a, b) => {
      const valA = this.resolvePath(a, this.sortField);
      const valB = this.resolvePath(b, this.sortField);

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
    return path.split('.').reduce((o, p) => o && o[p] != null ? o[p] : '', obj);
  }

  trackById(index: number, item: any): any {
    return item?.id ?? index;
  }

  // Export Dropdown
  toggleExportDropdown(event?: Event) {
    if (event) event.stopPropagation();
    this.showExportDropdown = !this.showExportDropdown;
    this.showColDropdown['employees'] = false;
  }

  // Export CSV
  exportCsv() {
    const dataToExport = this.filteredEmployees;
    if (!dataToExport || dataToExport.length === 0) {
      this.notificationService.warning('Export Empty', 'No employee records to export.');
      return;
    }

    const headers = ['ID', 'Staff Name', 'Designation', 'Mobile Contact', 'Monthly Salary (INR)', 'Joining Date', 'Aadhaar Verified', 'Bank Details', 'Address'];
    const rows = dataToExport.map(e => [
      e.id || '',
      `"${(e.empName || '').replace(/"/g, '""')}"`,
      `"${(e.designation || '').replace(/"/g, '""')}"`,
      `"${(e.empContact || '').replace(/"/g, '""')}"`,
      e.salary || 0,
      `"${e.joiningDate || ''}"`,
      e.aadhaarNo ? 'Yes' : 'No',
      `"${(e.bankAccount || '').replace(/"/g, '""')}"`,
      `"${(e.address || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `futane_workforce_directory_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showExportDropdown = false;
    this.notificationService.success('Export Ready', 'Workforce directory exported to CSV successfully.');
  }

  // Export Excel (.xlsx)
  exportExcel() {
    const dataToExport = this.filteredEmployees;
    if (!dataToExport || dataToExport.length === 0) {
      this.notificationService.warning('Export Empty', 'No employee records to export.');
      return;
    }

    const rows = dataToExport.map(e => ({
      'Employee ID': `EMP-${e.id}`,
      'Full Name': e.empName,
      'Role / Designation': e.designation,
      'Contact Number': e.empContact,
      'Base Salary (INR/Month)': e.salary,
      'Joining Date': e.joiningDate || 'N/A',
      'Aadhaar Status': e.aadhaarNo ? 'Verified (Present)' : 'Pending',
      'Bank Linked': e.bankAccount ? 'Linked (Present)' : 'Pending',
      'Residential Address': e.address || 'N/A'
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(rows);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Staff Directory');
    XLSX.writeFile(wb, `futane_workforce_roster_${new Date().toISOString().substring(0, 10)}.xlsx`);

    this.showExportDropdown = false;
    this.notificationService.success('Excel Generated', 'Workforce directory exported to Excel successfully.');
  }
}
