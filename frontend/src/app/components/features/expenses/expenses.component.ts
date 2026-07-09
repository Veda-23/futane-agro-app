import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
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

  // Pagination & Sort state
  currentPage = 1;
  pageSize = 10;
  sortField = 'id';
  sortAsc = false;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  defaultCols = ['Date', 'Category', 'Description', 'Amount', 'Paid By', 'Actions'];

  constructor(private apiService: ApiService) {}

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

  isViewer() {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete() {
    return this.loggedInUser && this.loggedInUser.role === 'ADMIN';
  }

  validateForm(): boolean {
    const f = this.expenseForm;
    if (!f.expenseDate || !f.category || !f.description || f.amount <= 0) {
      alert('Please fill out all required expense fields correctly.');
      return false;
    }
    return true;
  }

  saveExpense() {
    if (!this.validateForm()) return;
    const payload = { ...this.expenseForm, paidBy: this.loggedInUser?.username || 'admin' };
    this.apiService.createExpense(payload).subscribe(() => {
      this.loadData();
      this.logAudit('Created expense: ' + this.expenseForm.description);
      this.expenseForm = { expenseDate: '', category: 'Maintenance', description: '', amount: 0, paidBy: '' };
    });
  }

  deleteExpense(id: string) {
    this.apiService.deleteExpense(id).subscribe(() => {
      this.loadData();
      this.logAudit('Deleted expense ID: ' + id);
    });
  }

  logAudit(action: string) {
    if (this.loggedInUser) {
      this.apiService.createAuditLog({ username: this.loggedInUser.username, action }).subscribe();
    }
  }

  // Table handling methods
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

