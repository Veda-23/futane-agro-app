import { Component, OnInit, Input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { ResizableTableDirective } from '../../../directives/resizable-table.directive';
import { IndianDatePipe } from '../../../pipes/indian-date.pipe';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';

export interface ExpenseItem {
  id?: string | number;
  expenseDate: string;
  category: string;
  description: string;
  amount: number;
  paidBy?: string;
  paymentMode?: string;
}

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    AutoSelectDirective,
    FormStateDirective,
    ResizableTableDirective,
    IndianDatePipe,
    EmptyStateComponent
  ],
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css']
})
export class ExpensesComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'expenses';
  @Input() loggedInUser: any = null;

  expensesList: ExpenseItem[] = [];

  expenseForm: {
    id?: any;
    expenseDate: string;
    category: string;
    description: string;
    amount: number | null;
    paidBy: string;
    paymentMode: string;
  } = {
    expenseDate: this.getTodayDate(),
    category: 'Maintenance',
    description: '',
    amount: null,
    paidBy: '',
    paymentMode: 'Cash'
  };

  editingId: any = null;
  isDrawerOpen: boolean = false;
  isLoading: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';

  // Voucher Inspection Modal State
  showVoucherModal: boolean = false;
  selectedExpenseForVoucher: any = null;

  openVoucherModal(e: any): void {
    this.selectedExpenseForVoucher = e;
    this.showVoucherModal = true;
  }

  closeVoucherModal(): void {
    this.showVoucherModal = false;
    this.selectedExpenseForVoucher = null;
  }

  printVoucher(): void {
    window.print();
  }

  // Filter & Search state
  selectedCategory: string = 'ALL';
  searchQuery: string = '';
  filterDateFrom: string = '';
  filterDateTo: string = '';
  showFilterPopover = false;

  get activeFilterCount(): number {
    let count = 0;
    if (this.selectedCategory && this.selectedCategory !== 'ALL') count++;
    if (this.filterDateFrom) count++;
    if (this.filterDateTo) count++;
    return count;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick() {
    this.showColDropdown['expenses'] = false;
    this.showFilterPopover = false;
  }

  // Pagination & Sorting state
  currentPage: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [10, 25, 50, 100];
  sortField: string = 'expenseDate';
  sortAsc: boolean = false;
  tableDensity: 'compact' | 'comfortable' | 'spacious' = 'comfortable';

  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};
  defaultCols = ['Date', 'Category', 'Description', 'Amount', 'Paid By', 'Mode', 'Actions'];

  categories = [
    'Maintenance',
    'Utilities',
    'Factory Overhead',
    'Office & Admin',
    'Labour',
    'Marketing',
    'Transport & Fuel',
    'Miscellaneous'
  ];

  paymentModes = ['Cash', 'UPI', 'Bank Transfer', 'Cheque'];

  Math = Math;

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.columnsVisibility['expenses'] = {};
    this.defaultCols.forEach(col => (this.columnsVisibility['expenses'][col] = true));

    const savedDensity = localStorage.getItem('futane_table_density') || localStorage.getItem('erp_table_density');
    if (savedDensity === 'compact' || savedDensity === 'comfortable' || savedDensity === 'spacious') {
      this.tableDensity = savedDensity;
    }

    try {
      localStorage.removeItem('cols_width_expenses_table');
    } catch (e) {
      // ignore
    }
    this.loadData();
  }

  getTodayDate(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  loadData(isManual: boolean = false) {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    this.apiService.getExpenses().subscribe({
      next: (res: any[]) => {
        this.expensesList = res || [];
        this.tableFilteredCounts['expenses'] = this.expensesList.length;
        this.isLoading = false;
        if (isManual) {
          this.notificationService.success('Registry Refreshed', 'Expenses records loaded successfully.');
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = err?.message || 'Failed to connect to expense management service';
        this.notificationService.error('Load Failed', 'Failed to load expenses registry. Please check network connection.');
      }
    });
  }

  get totalExpenses(): number {
    return (this.expensesList || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }

  get filteredTotalAmount(): number {
    return (this.filteredList || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }

  get currentMonthBurn(): number {
    const currentYearMonth = this.getTodayDate().substring(0, 7); // e.g. "2026-09"
    return (this.expensesList || [])
      .filter(e => e.expenseDate && e.expenseDate.startsWith(currentYearMonth))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }

  get topCategoryInfo(): { name: string; amount: number; percentage: number } {
    if (!this.expensesList || this.expensesList.length === 0) {
      return { name: 'None', amount: 0, percentage: 0 };
    }
    const catMap: { [cat: string]: number } = {};
    this.expensesList.forEach(e => {
      const cat = e.category || 'Miscellaneous';
      catMap[cat] = (catMap[cat] || 0) + (Number(e.amount) || 0);
    });

    let topCat = 'Miscellaneous';
    let maxAmt = 0;
    Object.keys(catMap).forEach(cat => {
      if (catMap[cat] > maxAmt) {
        maxAmt = catMap[cat];
        topCat = cat;
      }
    });

    const total = this.totalExpenses || 1;
    const pct = Math.round((maxAmt / total) * 100);
    return { name: topCat, amount: maxAmt, percentage: pct };
  }

  get categoryCounts(): { [key: string]: number } {
    const counts: { [key: string]: number } = {};
    (this.expensesList || []).forEach(e => {
      const c = e.category || 'Miscellaneous';
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }

  activeSubtab: string = 'ALL';

  setSubtab(tab: string) {
    this.activeSubtab = tab;
    if (tab === 'ALL' || tab === 'high_value') {
      this.selectedCategory = 'ALL';
    } else {
      this.selectedCategory = tab;
    }
    this.currentPage = 1;
  }

  getSubtabCount(tab: string): number {
    if (!this.expensesList) return 0;
    if (tab === 'ALL') return this.expensesList.length;
    if (tab === 'high_value') return this.expensesList.filter(e => Number(e.amount) >= 10000).length;
    return this.expensesList.filter(e => (e.category || '').toLowerCase() === tab.toLowerCase()).length;
  }

  printLedger() {
    window.print();
  }

  // --- Filtered & Sorted Records ---
  get filteredList(): ExpenseItem[] {
    let list = [...(this.expensesList || [])];

    // Subtab High Value Filter
    if (this.activeSubtab === 'high_value') {
      list = list.filter(e => Number(e.amount) >= 10000);
    } else if (this.selectedCategory !== 'ALL') {
      list = list.filter(e => (e.category || '').toLowerCase() === this.selectedCategory.toLowerCase());
    }

    // Filter by Date Range
    if (this.filterDateFrom) {
      list = list.filter(e => !e.expenseDate || e.expenseDate >= this.filterDateFrom);
    }
    if (this.filterDateTo) {
      list = list.filter(e => !e.expenseDate || e.expenseDate <= this.filterDateTo);
    }

    // Filter by Search Query
    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(e => {
        const desc = (e.description || '').toLowerCase();
        const cat = (e.category || '').toLowerCase();
        const payer = (e.paidBy || '').toLowerCase();
        const amt = (e.amount != null ? String(e.amount) : '').toLowerCase();
        const date = (e.expenseDate || '').toLowerCase();
        return desc.includes(q) || cat.includes(q) || payer.includes(q) || amt.includes(q) || date.includes(q);
      });
    }

    // Sort
    list.sort((a: any, b: any) => {
      let valA = a[this.sortField] ?? '';
      let valB = b[this.sortField] ?? '';

      if (this.sortField === 'amount') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      }

      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });

    this.tableFilteredCounts['expenses'] = list.length;
    return list;
  }

  get paginatedList(): ExpenseItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredList.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredList.length / this.pageSize) || 1;
  }

  setCategoryFilter(cat: string) {
    this.selectedCategory = cat;
    this.activeSubtab = cat;
    this.currentPage = 1;
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
    this.selectedCategory = 'ALL';
    this.searchQuery = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.currentPage = 1;
  }

  // --- Table Density & Column Visibility ---
  setTableDensity(d: 'compact' | 'comfortable' | 'spacious') {
    this.tableDensity = d;
    localStorage.setItem('futane_table_density', d);
  }

  toggleColDropdown(table: string) {
    this.showColDropdown[table] = !this.showColDropdown[table];
  }

  isColumnVisible(table: string, col: string): boolean {
    if (!this.columnsVisibility[table]) return true;
    return this.columnsVisibility[table][col] !== false;
  }

  toggleColumn(table: string, col: string) {
    if (!this.columnsVisibility[table]) {
      this.columnsVisibility[table] = {};
    }
    this.columnsVisibility[table][col] = !this.isColumnVisible(table, col);
  }

  getTableColumns(table: string): string[] {
    return this.defaultCols;
  }

  getProcessedList(list: any[], table: string): any[] {
    return this.paginatedList;
  }

  // --- Form & Action methods ---
  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  validateForm(): boolean {
    const f = this.expenseForm;
    if (!f.expenseDate) {
      this.notificationService.warning('Validation Error', 'Expense date is required.');
      return false;
    }
    if (!f.category) {
      this.notificationService.warning('Validation Error', 'Expense cost category is required.');
      return false;
    }
    if (f.amount === null || f.amount === undefined || Number(f.amount) <= 0) {
      this.notificationService.warning('Validation Error', 'A valid expense amount greater than zero is required.');
      return false;
    }
    if (!f.description || !f.description.trim()) {
      this.notificationService.warning('Validation Error', 'Expense description / purpose is required.');
      return false;
    }
    return true;
  }

  saveExpense() {
    if (!this.validateForm()) return;

    const payload = {
      expenseDate: this.expenseForm.expenseDate,
      category: this.expenseForm.category,
      description: this.expenseForm.description.trim(),
      amount: Number(this.expenseForm.amount),
      paidBy: (this.expenseForm.paidBy || this.loggedInUser?.name || 'Accounts').trim(),
      paymentMode: this.expenseForm.paymentMode
    };

    if (this.editingId) {
      this.apiService.updateExpense(this.editingId, payload).subscribe({
        next: () => {
          this.notificationService.success('Expense Updated', 'Expense record updated successfully.');
          this.logAudit('Updated expense: ' + payload.description);
          this.cancelEdit();
          this.loadData();
        },
        error: (err: any) => {
          this.notificationService.error('Update Failed', err?.message || 'Could not update expense.');
        }
      });
    } else {
      this.apiService.createExpense(payload).subscribe({
        next: () => {
          this.notificationService.success('Expense Recorded', 'Expense voucher saved successfully.');
          this.logAudit('Created expense: ' + payload.description);
          this.cancelEdit();
          this.loadData();
        },
        error: (err: any) => {
          this.notificationService.error('Save Failed', err?.message || 'Could not save expense voucher.');
        }
      });
    }
  }

  editExpense(e: ExpenseItem) {
    this.editingId = e.id;
    this.expenseForm = {
      id: e.id,
      expenseDate: e.expenseDate || this.getTodayDate(),
      category: e.category || 'Maintenance',
      description: e.description || '',
      amount: e.amount || null,
      paidBy: e.paidBy || '',
      paymentMode: e.paymentMode || 'Cash'
    };
    this.isDrawerOpen = true;

    this.notificationService.info('Editing Expense', `Editing voucher #${e.id} (${e.category})`);
  }

  cancelEdit() {
    this.editingId = null;
    this.isDrawerOpen = false;
    this.expenseForm = {
      expenseDate: this.getTodayDate(),
      category: 'Maintenance',
      description: '',
      amount: null,
      paidBy: '',
      paymentMode: 'Cash'
    };
  }

  openDrawer() {
    this.cancelEdit();
    this.isDrawerOpen = true;
  }

  deleteExpense(id: any) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', 'You do not have administrative privileges to delete expenses.');
      return;
    }

    this.notificationService.confirmAction(
      'Confirm Delete',
      'Are you sure you want to permanently delete this expense record? This will adjust financial cost ledgers.',
      'Yes, Delete'
    ).then(confirmed => {
      if (confirmed) {
        this.apiService.deleteExpense(id).subscribe({
          next: () => {
            this.expensesList = this.expensesList.filter(
              x => (x.id ? x.id.toString() : '') !== id.toString()
            );
            this.notificationService.success('Record Deleted', 'Expense record removed.');
            this.logAudit('Deleted expense ID: ' + id);
          },
          error: (err: any) => {
            this.notificationService.error('Delete Failed', err?.error?.message || err?.message || 'Could not delete expense.');
          }
        });
      }
    });
  }

  logAudit(action: string) {
    if (this.loggedInUser) {
      this.apiService.createAuditLog({ username: this.loggedInUser.username || this.loggedInUser.name, action }).subscribe();
    }
  }

  exportCSV() {
    if (!this.expensesList || this.expensesList.length === 0) {
      this.notificationService.warning('No Data', 'There are no expense records to export.');
      return;
    }

    const headers = ['Date', 'Category', 'Description', 'Amount', 'Paid By', 'Payment Mode'];
    const rows = this.filteredList.map(e => [
      `"${e.expenseDate || ''}"`,
      `"${e.category || ''}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      e.amount || 0,
      `"${(e.paidBy || '').replace(/"/g, '""')}"`,
      `"${e.paymentMode || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Futane_Expenses_Ledger_${this.getTodayDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.notificationService.success('Export Complete', 'Expenses CSV generated and downloaded.');
  }

  exportExcel() {
    if (!this.expensesList || this.expensesList.length === 0) {
      this.notificationService.warning('No Data', 'There are no expense records to export.');
      return;
    }

    const headers = ['Date', 'Category', 'Description', 'Amount', 'Paid By', 'Payment Mode'];
    const rows = this.filteredList.map(e => [
      `"${e.expenseDate || ''}"`,
      `"${e.category || ''}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      e.amount || 0,
      `"${(e.paidBy || '').replace(/"/g, '""')}"`,
      `"${e.paymentMode || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Futane_Expenses_Ledger_${this.getTodayDate()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.notificationService.success('Export Complete', 'Expenses Excel statement downloaded.');
  }

  getCategoryBadgeClass(cat: string): string {
    const c = (cat || '').toLowerCase();
    if (c.includes('maintenance')) return 'cat-badge-maintenance';
    if (c.includes('utilit')) return 'cat-badge-utilities';
    if (c.includes('factory') || c.includes('overhead')) return 'cat-badge-factory';
    if (c.includes('office') || c.includes('admin')) return 'cat-badge-office';
    if (c.includes('labour')) return 'cat-badge-labour';
    if (c.includes('market')) return 'cat-badge-marketing';
    if (c.includes('transport') || c.includes('fuel')) return 'cat-badge-transport';
    return 'cat-badge-misc';
  }

  trackById(index: number, item: any): any {
    return item?.id ?? index;
  }
}
