import { Component, OnInit, Input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { IndianDatePipe } from '../../../pipes/indian-date.pipe';
import { ResizableTableDirective } from '../../../directives/resizable-table.directive';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';

export interface BankTransactionItem {
  id?: string | number;
  transactionDate: string;
  transactionType: 'Credit' | 'Debit';
  amount: number;
  description: string;
  referenceNo?: string;
  createdAt?: string;
}

/**
 * Corporate Treasury, Bank Inflows & Account Reconciliation Ledger.
 *
 * Capabilities:
 * - Records corporate bank account inflows (Credit) and disbursements (Debit) with transaction reference numbers (UTR / Cheque).
 * - Real-time Treasury Balances: Computes running bank balance, total cumulative credits, total debits, and net cashflow.
 * - Subtabs: All Banking Vouchers, Customer Credits, Supplier Debits, and High-Value Transactions (>₹50,000).
 * - Multi-criteria filters: Date range, transaction type, reference UTR search, and pagination.
 */
@Component({
  selector: 'app-bank',
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
  templateUrl: './bank.component.html',
  styleUrls: ['./bank.component.css']
})
export class BankComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'bank';
  @Input() loggedInUser: any = null;

  bankTransactionsList: BankTransactionItem[] = [];
  bankTxnForm: {
    id?: any;
    transactionDate: string;
    transactionType: 'Credit' | 'Debit';
    amount: number | null;
    description: string;
    referenceNo: string;
  } = {
    transactionDate: this.getTodayDate(),
    transactionType: 'Credit',
    amount: null,
    description: '',
    referenceNo: ''
  };

  editingId: any = null;
  isDrawerOpen: boolean = false;
  showViewModal: boolean = false;
  selectedTxnForView: BankTransactionItem | null = null;
  isLoading: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';

  // Filter & Search state
  filterType: 'ALL' | 'Credit' | 'Debit' = 'ALL';
  searchQuery: string = '';
  filterDateFrom: string = '';
  filterDateTo: string = '';
  showFilterPopover = false;

  get activeFilterCount(): number {
    let count = 0;
    if (this.filterType && this.filterType !== 'ALL') count++;
    if (this.filterDateFrom) count++;
    if (this.filterDateTo) count++;
    return count;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick() {
    this.showColDropdown['bank'] = false;
    this.showFilterPopover = false;
  }

  // Pagination & Sorting state
  currentPage: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [10, 25, 50, 100];
  sortField: string = 'transactionDate';
  sortAsc: boolean = false;
  tableDensity: 'compact' | 'comfortable' | 'spacious' = 'comfortable';

  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};
  defaultCols = ['Date', 'Type', 'Amount', 'Description', 'Reference', 'Actions'];

  Math = Math;

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    try {
      localStorage.removeItem('cols_width_bank_table');
    } catch (e) {}
    this.columnsVisibility['bank'] = {};
    this.defaultCols.forEach(col => (this.columnsVisibility['bank'][col] = true));

    const savedDensity = localStorage.getItem('futane_table_density') || localStorage.getItem('erp_table_density');
    if (savedDensity === 'compact' || savedDensity === 'comfortable' || savedDensity === 'spacious') {
      this.tableDensity = savedDensity;
    }

    this.loadData();
  }

  get filteredTotalAmount(): number {
    return (this.filteredList || []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }

  getTodayDate(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  loadData(isManual: boolean = false) {
    if (this.bankTransactionsList.length === 0) this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    this.apiService.getBankTransactions().subscribe({
      next: (res: any[]) => {
        this.bankTransactionsList = res || [];
        this.tableFilteredCounts['bank'] = this.bankTransactionsList.length;
        this.isLoading = false;
        if (isManual) {
          this.notificationService.success('Ledger Refreshed', 'Bank transactions loaded successfully.');
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = err?.message || 'Failed to connect to bank transaction ledger';
        this.notificationService.error('Load Failed', 'Failed to load bank ledger. Please check network connection.');
      }
    });
  }

  // --- Treasury KPIs ---
  get totalInflow(): number {
    return (this.bankTransactionsList || [])
      .filter(t => t.transactionType === 'Credit')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }

  get totalOutflow(): number {
    return (this.bankTransactionsList || [])
      .filter(t => t.transactionType === 'Debit')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }

  get netBalance(): number {
    return this.totalInflow - this.totalOutflow;
  }

  get creditCount(): number {
    return (this.bankTransactionsList || []).filter(t => t.transactionType === 'Credit').length;
  }

  get debitCount(): number {
    return (this.bankTransactionsList || []).filter(t => t.transactionType === 'Debit').length;
  }

  activeSubtab: string = 'ALL';

  setSubtab(tab: string) {
    this.activeSubtab = tab;
    if (tab === 'ALL' || tab === 'high_value' || tab === 'contra') {
      this.filterType = 'ALL';
    } else {
      this.filterType = tab as ('Credit' | 'Debit');
    }
    this.currentPage = 1;
  }

  getSubtabCount(tab: string): number {
    if (!this.bankTransactionsList) return 0;
    if (tab === 'ALL') return this.bankTransactionsList.length;
    if (tab === 'Credit') return this.creditCount;
    if (tab === 'Debit') return this.debitCount;
    if (tab === 'high_value') return this.bankTransactionsList.filter(t => Number(t.amount) >= 50000).length;
    if (tab === 'contra') {
      return this.bankTransactionsList.filter(t => {
        const d = (t.description || '').toLowerCase();
        return d.includes('cash') || d.includes('contra') || d.includes('transfer') || d.includes('self');
      }).length;
    }
    return 0;
  }

  printLedger() {
    window.print();
  }

  // --- Filtered & Sorted Records (Memoized for 10,000+ Records) ---
  private _cachedBankFilterKey: string = '';
  private _cachedBankFilteredList: BankTransactionItem[] = [];
  private _cachedBankPageKey: string = '';
  private _cachedBankPaginatedList: BankTransactionItem[] = [];

  get filteredList(): BankTransactionItem[] {
    const key = `${(this.bankTransactionsList || []).length}_${this.activeSubtab}_${this.filterType}_${this.filterDateFrom}_${this.filterDateTo}_${this.searchQuery}_${this.sortField}_${this.sortAsc}`;
    if (key === this._cachedBankFilterKey && this._cachedBankFilteredList) {
      return this._cachedBankFilteredList;
    }

    let list = [...(this.bankTransactionsList || [])];

    // Filter by Subtab
    if (this.activeSubtab === 'Credit' || this.activeSubtab === 'Debit') {
      list = list.filter(t => t.transactionType === this.activeSubtab);
    } else if (this.activeSubtab === 'high_value') {
      list = list.filter(t => Number(t.amount) >= 50000);
    } else if (this.activeSubtab === 'contra') {
      list = list.filter(t => {
        const d = (t.description || '').toLowerCase();
        return d.includes('cash') || d.includes('contra') || d.includes('transfer') || d.includes('self');
      });
    } else if (this.filterType !== 'ALL') {
      list = list.filter(t => t.transactionType === this.filterType);
    }

    // Filter by date range
    if (this.filterDateFrom) {
      list = list.filter(t => !t.transactionDate || t.transactionDate >= this.filterDateFrom);
    }
    if (this.filterDateTo) {
      list = list.filter(t => !t.transactionDate || t.transactionDate <= this.filterDateTo);
    }

    // Filter by search query
    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(t => {
        const desc = (t.description || '').toLowerCase();
        const ref = (t.referenceNo || '').toLowerCase();
        const amt = (t.amount != null ? String(t.amount) : '').toLowerCase();
        const date = (t.transactionDate || '').toLowerCase();
        return desc.includes(q) || ref.includes(q) || amt.includes(q) || date.includes(q);
      });
    }

    // Sort list
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

    this.tableFilteredCounts['bank'] = list.length;
    this._cachedBankFilterKey = key;
    this._cachedBankFilteredList = list;
    return this._cachedBankFilteredList;
  }

  get paginatedList(): BankTransactionItem[] {
    const list = this.filteredList;
    const pageKey = `${this._cachedBankFilterKey}_${this.currentPage}_${this.pageSize}`;
    if (pageKey === this._cachedBankPageKey && this._cachedBankPaginatedList) {
      return this._cachedBankPaginatedList;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    this._cachedBankPageKey = pageKey;
    this._cachedBankPaginatedList = list.slice(start, start + this.pageSize);
    return this._cachedBankPaginatedList;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredList.length / this.pageSize) || 1;
  }

  setFilterType(type: 'ALL' | 'Credit' | 'Debit') {
    this.filterType = type;
    this.activeSubtab = type;
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
    this.filterType = 'ALL';
    this.searchQuery = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.currentPage = 1;
  }

  // --- Table density & column visibility ---
  setTableDensity(d: 'compact' | 'comfortable' | 'spacious') {
    this.tableDensity = d;
    localStorage.setItem('futane_table_density', d);
  }

  toggleColDropdown(tableKey: string) {
    this.showColDropdown[tableKey] = !this.showColDropdown[tableKey];
  }

  isColumnVisible(tableKey: string, colName: string): boolean {
    if (!this.columnsVisibility[tableKey]) return true;
    return this.columnsVisibility[tableKey][colName] !== false;
  }

  toggleColumn(tableKey: string, colName: string) {
    if (!this.columnsVisibility[tableKey]) {
      this.columnsVisibility[tableKey] = {};
    }
    this.columnsVisibility[tableKey][colName] = !this.isColumnVisible(tableKey, colName);
  }

  getTableColumns(tableKey: string): string[] {
    return this.defaultCols;
  }

  // Compatibility helper
  getProcessedList(list: any[], tableKey: string): any[] {
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
    const f = this.bankTxnForm;
    if (!f.transactionDate) {
      this.notificationService.warning('Validation Error', 'Transaction date is required.');
      return false;
    }
    if (!f.transactionType) {
      this.notificationService.warning('Validation Error', 'Transaction type is required.');
      return false;
    }
    if (f.amount === null || f.amount === undefined || Number(f.amount) <= 0) {
      this.notificationService.warning('Validation Error', 'A valid transaction amount greater than zero is required.');
      return false;
    }
    if (!f.description || !f.description.trim()) {
      this.notificationService.warning('Validation Error', 'Transaction description / purpose is required.');
      return false;
    }
    return true;
  }

  saveBankTransaction() {
    if (this.isViewer()) {
      this.notificationService.warning('Read-Only Access', 'Viewer role cannot modify bank transactions.');
      return;
    }
    if (!this.validateForm()) return;

    const payload = {
      transactionDate: this.bankTxnForm.transactionDate,
      transactionType: this.bankTxnForm.transactionType,
      amount: Number(this.bankTxnForm.amount),
      description: this.bankTxnForm.description.trim(),
      referenceNo: (this.bankTxnForm.referenceNo || '').trim()
    };

    if (this.editingId) {
      this.apiService.updateBankTransaction(this.editingId, payload).subscribe({
        next: () => {
          this.notificationService.success('Transaction Updated', 'Bank transaction updated successfully.');
          this.cancelEdit();
          this.loadData();
        },
        error: (err: any) => {
          this.notificationService.error('Update Failed', err?.message || 'Could not update transaction.');
        }
      });
    } else {
      this.apiService.createBankTransaction(payload).subscribe({
        next: () => {
          this.notificationService.success('Transaction Saved', 'Bank transaction recorded successfully.');
          this.cancelEdit();
          this.loadData();
        },
        error: (err: any) => {
          this.notificationService.error('Save Failed', err?.message || 'Could not record transaction.');
        }
      });
    }
  }

  // Read-Only Transaction Voucher Inspection
  openViewModal(bt: BankTransactionItem) {
    this.selectedTxnForView = bt;
    this.showViewModal = true;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedTxnForView = null;
  }

  printBankVoucher() {
    window.print();
  }

  formatTxnId(id: any): string {
    if (!id && id !== 0) return 'BNK-000';
    const str = String(id).trim();
    if (/^\d+$/.test(str)) return `BNK-${str.padStart(4, '0')}`;
    if (str.includes('-')) {
      const parts = str.split('-');
      return `BNK-${parts[0].toUpperCase()}`;
    }
    if (str.length > 8) return `BNK-${str.slice(0, 8).toUpperCase()}`;
    return `BNK-${str.toUpperCase()}`;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showViewModal) {
      this.closeViewModal();
    } else if (this.isDrawerOpen) {
      this.cancelEdit();
    }
  }

  editBankTransaction(bt: BankTransactionItem) {
    if (this.isViewer()) {
      this.notificationService.warning('Read-Only Access', 'Viewer role cannot edit bank transactions.');
      return;
    }
    this.editingId = bt.id;
    this.bankTxnForm = {
      id: bt.id,
      transactionDate: bt.transactionDate || this.getTodayDate(),
      transactionType: bt.transactionType || 'Credit',
      amount: bt.amount || null,
      description: bt.description || '',
      referenceNo: bt.referenceNo || ''
    };
    this.isDrawerOpen = true;

    this.notificationService.info('Editing Transaction', `Editing record #${this.formatTxnId(bt.id)}`);
  }

  cancelEdit() {
    this.editingId = null;
    this.isDrawerOpen = false;
    this.bankTxnForm = {
      transactionDate: this.getTodayDate(),
      transactionType: 'Credit',
      amount: null,
      description: '',
      referenceNo: ''
    };
  }

  openDrawer() {
    if (this.isViewer()) {
      this.notificationService.warning('Read-Only Access', 'Viewer role cannot record bank transactions.');
      return;
    }
    this.cancelEdit();
    this.isDrawerOpen = true;
  }

  deleteBankTransaction(id: any) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', 'You do not have administrative privileges to delete transactions.');
      return;
    }

    this.notificationService.confirmAction(
      'Confirm Delete',
      'Are you sure you want to permanently delete this bank transaction record? This affects cash ledger balances.',
      'Yes, Delete'
    ).then(confirmed => {
      if (confirmed) {
        this.apiService.deleteBankTransaction(id).subscribe({
          next: () => {
            this.bankTransactionsList = this.bankTransactionsList.filter(
              x => (x.id ? x.id.toString() : '') !== id.toString()
            );
            this.notificationService.success('Record Deleted', 'Transaction removed from ledger.');
          },
          error: (err: any) => {
            this.notificationService.error('Delete Failed', err?.error?.message || err?.message || 'Could not delete transaction.');
          }
        });
      }
    });
  }

  exportCSV() {
    if (!this.bankTransactionsList || this.bankTransactionsList.length === 0) {
      this.notificationService.warning('No Data', 'There are no bank records to export.');
      return;
    }

    const headers = ['Date', 'Type', 'Amount', 'Description', 'Reference No'];
    const rows = this.filteredList.map(t => [
      `"${t.transactionDate || ''}"`,
      `"${t.transactionType || ''}"`,
      t.amount || 0,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(t.referenceNo || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Futane_Bank_Ledger_${this.getTodayDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.notificationService.success('Export Complete', 'Bank ledger CSV generated and downloaded.');
  }

  exportExcel() {
    if (!this.bankTransactionsList || this.bankTransactionsList.length === 0) {
      this.notificationService.warning('No Data', 'There are no bank records to export.');
      return;
    }

    const headers = ['Date', 'Type', 'Amount', 'Description', 'Reference No'];
    const rows = this.filteredList.map(t => [
      `"${t.transactionDate || ''}"`,
      `"${t.transactionType || ''}"`,
      t.amount || 0,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(t.referenceNo || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Futane_Bank_Ledger_${this.getTodayDate()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.notificationService.success('Export Complete', 'Bank ledger Excel statement downloaded.');
  }

  trackById(index: number, item: any): any {
    return item?.id ?? index;
  }
}
