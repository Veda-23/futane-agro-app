import { Component, OnInit, Input } from '@angular/core';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { NotificationService } from '../../../services/notification.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, AutoSelectDirective, FormStateDirective],
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css']
})
export class ExpensesComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'expenses';
  @Input() loggedInUser: any = null;

  expensesList: any[] = [];

  expenseForm = { expenseDate: '', category: 'Maintenance', description: '', amount: 0, paidBy: '' };

  Math = Math;

  currentPage = 1;
  pageSize = 10;
  sortField = 'id';
  sortAsc = false;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  defaultCols = ['Date', 'Category', 'Description', 'Amount', 'Paid By', 'Actions'];

  constructor(private apiService: ApiService, private notificationService: NotificationService) {}

  ngOnInit() {
    this.loadData();
    this.columnsVisibility['expenses'] = {};
    this.defaultCols.forEach(col => this.columnsVisibility['expenses'][col] = true);
  }

  loadData() {
    this.apiService.getExpenses().subscribe((res: any[]) => {
      this.expensesList = res;
      this.tableFilteredCounts['expenses'] = this.expensesList.length;
    });
  }

  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  validateForm(): boolean {
    const f = this.expenseForm;
    if (!f.expenseDate || !f.category || !f.description || f.amount <= 0) {
      this.notificationService.warning('Invalid Input', 'Please fill out all required expense fields correctly.');
      return false;
    }
    return true;
  }

  saveExpense() {
    if (!this.validateForm()) return;
    const payload = { ...this.expenseForm, paidBy: this.loggedInUser?.username || 'admin' };
    this.apiService.createExpense(payload).subscribe({
      next: (res) => {
        if (res) this.expensesList.unshift(res);
        this.loadData();
        this.notificationService.success('Data Added', 'Expense record added successfully');
        this.logAudit('Created expense: ' + this.expenseForm.description);
        this.expenseForm = { expenseDate: '', category: 'Maintenance', description: '', amount: 0, paidBy: '' };
      },
      error: (err) => this.notificationService.error('Error', "Failed to save expense: " + (err.error?.message || err.message))
    });
  }

  deleteExpense(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "Permission denied");
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

  logAudit(action: string) {
    if (this.loggedInUser) {
      this.apiService.createAuditLog({ username: this.loggedInUser.username, action }).subscribe();
    }
  }

  toggleColDropdown(table: string) {
    this.showColDropdown[table] = !this.showColDropdown[table];
  }

  getTableColumns(table: string): string[] {
    return this.defaultCols;
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
