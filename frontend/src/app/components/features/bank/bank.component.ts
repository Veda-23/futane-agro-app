import { Component, OnInit, Input, ElementRef } from '@angular/core';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { NotificationService } from '../../../services/notification.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';

import { IndianDatePipe } from '../../../pipes/indian-date.pipe';
import { ResizableTableDirective } from '../../../directives/resizable-table.directive';

@Component({
  selector: 'app-bank',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, AutoSelectDirective, FormStateDirective, IndianDatePipe, ResizableTableDirective],
  templateUrl: './bank.component.html',
  styleUrls: ['./bank.component.css']
})
export class BankComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'bank';
  @Input() loggedInUser: any = null;

  bankTransactionsList: any[] = [];
  bankTxnForm = { transactionDate: '', transactionType: 'Credit', amount: 0, description: '', referenceNo: '' };
  Math = Math;

  // Pagination & Sort state
  currentPage = 1;
  pageSize = 10;
  sortField = 'id';
  sortAsc = false;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  defaultCols = ['Date', 'Type', 'Amount', 'Description', 'Reference', 'Actions'];

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadData();
    this.columnsVisibility['bank'] = {};
    this.defaultCols.forEach(col => this.columnsVisibility['bank'][col] = true);
  }

  loadData() {
    this.apiService.getBankTransactions().subscribe((res: any[]) => {
      this.bankTransactionsList = res || [];
      this.tableFilteredCounts['bank'] = this.bankTransactionsList.length;
    });
  }

  isViewer() {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete() {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  validateForm(): boolean {
    const f = this.bankTxnForm;
    if (!f.transactionDate || !f.transactionType || !f.description || f.amount <= 0) {
      this.notificationService.showValidationError('Please fill out all required bank transaction fields correctly.');
      return false;
    }
    return true;
  }

  toggleColDropdown(tableKey: string) {
    this.showColDropdown[tableKey] = !this.showColDropdown[tableKey];
  }

  isColumnVisible(tableKey: string, colName: string): boolean {
    if (!this.columnsVisibility[tableKey]) return true;
    return this.columnsVisibility[tableKey][colName] !== false;
  }

  getProcessedList(list: any[], tableKey: string): any[] {
    return list || [];
  }

  editBankTransaction(bt: any) {
    this.bankTxnForm = {
      transactionDate: bt.transactionDate || '',
      transactionType: bt.transactionType || 'Credit',
      amount: bt.amount || 0,
      description: bt.description || '',
      referenceNo: bt.referenceNo || ''
    };
    const formEl = document.querySelector('.form-card');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
    this.notificationService.info('Editing', `Editing transaction: ${bt.description}`);
  }

  deleteBankTransaction(id: any) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', 'Permission denied');
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Delete this bank transaction?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteBankTransaction(id).subscribe({
          next: () => {
            this.bankTransactionsList = this.bankTransactionsList.filter(x => (x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Transaction deleted');
          },
          error: (err) => this.notificationService.error('Error', err.error?.message || err.message)
        });
      }
    });
  }

  saveBankTransaction() {
    if (!this.validateForm()) return;
    this.apiService.createBankTransaction(this.bankTxnForm).subscribe(() => {
      this.loadData();
      this.notificationService.showSaveSuccess('Bank transaction recorded successfully.');
      this.bankTxnForm = { transactionDate: '', transactionType: 'Credit', amount: 0, description: '', referenceNo: '' };
    });
  }

  trackById(index: number, item: any): any {
    return item?.id ?? item?.bankTransactionId ?? index;
  }
}
