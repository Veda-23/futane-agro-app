import { Component, OnInit, Input } from '@angular/core';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { NotificationService } from '../../../services/notification.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';

import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-salaries',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, AutoSelectDirective, FormStateDirective],
  templateUrl: './salaries.component.html',
  styleUrls: ['./salaries.component.css']
})
export class SalariesComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'salaries';
  @Input() loggedInUser: any = null;

  isLoading = true;
  hasError = false;

  salariesList: any[] = [];
  employees: any[] = [];
  salariesForm = { id: '', month: 'May', year: 2026, salaryAmount: 0, status: 'Pending', paidDate: '' };
  Math = Math;

  currentPage = 1;
  pageSize = 10;
  sortField = 'paidDate';
  sortAsc = false;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  defaultColumns = ['Name', 'Month/Year', 'Amount', 'Date', 'Status', 'Actions'];

  constructor(private apiService: ApiService, private notificationService: NotificationService) {}

  ngOnInit() {
    this.loadData();
    this.columnsVisibility['salaries'] = {};
    this.defaultColumns.forEach(col => {
      this.columnsVisibility['salaries'][col] = true;
    });
  }

  get maxSalaryMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  loadData() {
    this.isLoading = true;
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
      },
      error: (err) => {
        this.isLoading = false;
        this.hasError = true;
        this.notificationService.error('Load Failed', 'Could not load salaries data.');
      }
    });
  }

  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  get currentYear(): number {
    return new Date().getFullYear();
  }

  get allMonths(): string[] {
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  isSalaryAlreadyPaid(): boolean {
    const empId = parseInt(this.salariesForm.id);
    const month = this.salariesForm.month;
    const year = this.salariesForm.year;
    const existing = (this.salariesList || []).find(s =>
      (s.employee?.id === empId || s.employeeId === empId) &&
      String(s.month).toLowerCase() === String(month).toLowerCase() &&
      String(s.year) === String(year)
    );
    if (existing) {
      this.notificationService.error(
        'Already Paid',
        `Salary for ${month}/${year} has already been recorded for this employee.`
      );
      return true;
    }
    return false;
  }

  saveSalary() {
    if (!this.salariesForm.id || !this.salariesForm.month || !this.salariesForm.year || !this.salariesForm.salaryAmount) {
      this.notificationService.warning('Invalid Input', "Please fill required fields");
      return;
    }

    const now = new Date();
    const monthIndex = this.allMonths.indexOf(this.salariesForm.month);
    if (this.salariesForm.year > now.getFullYear() || (this.salariesForm.year === now.getFullYear() && monthIndex > now.getMonth())) {
      this.notificationService.warning('Invalid Date', 'Cannot generate salary records for future months.');
      return;
    }

    if (this.isSalaryAlreadyPaid()) {
      return;
    }

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

    this.apiService.createSalary(payload).subscribe({
      next: (res) => {
        if (res) this.salariesList.unshift(res);
        this.loadData();
        this.notificationService.success('Data Added', 'Salary record added successfully');
        this.logAudit("Generated salary release log for employee: " + emp.empName);
        this.salariesForm = { id: '', month: 'May', year: 2026, salaryAmount: 0, status: 'Pending', paidDate: '' };
      },
      error: (err) => this.notificationService.error('Error', "Failed to save salary: " + (err.error?.message || err.message))
    });
  }

  deleteSalary(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "Permission denied");
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

  logAudit(action: string) {
    if (this.loggedInUser) {
      this.apiService.createAuditLog({ username: this.loggedInUser.username, action }).subscribe();
    }
  }

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
    
    let sorted = [...list].sort((a, b) => {
      let valA = this.resolvePath(a, this.sortField);
      let valB = this.resolvePath(b, this.sortField);
      
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
}
