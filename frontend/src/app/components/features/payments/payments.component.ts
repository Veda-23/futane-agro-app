import { Component, OnInit, Input } from '@angular/core';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { NotificationService } from '../../../services/notification.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';
import { DataTableComponent } from '../../data-table/data-table.component';

import { ResizableTableDirective } from '../../../directives/resizable-table.directive';
import { IndianDatePipe } from '../../../pipes/indian-date.pipe';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, DataTableComponent, AutoSelectDirective, FormStateDirective, ResizableTableDirective, IndianDatePipe],
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css']
})
export class PaymentsComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'payments';
  @Input() loggedInUser: any = null;

  isLoading = true;
  hasError = false;

  paymentsList: any[] = [];
  parties: any[] = [];
  invoicesList: any[] = [];
  salesList: any[] = [];
  Math = Math;
  
  paymentsForm = { id: '', invoiceNo: '', amountReceived: 0, paymentMode: 'UPI', paymentDate: '' };

  currentPage = 1;
  pageSize = 10;
  sortField = 'paymentDate';
  sortAsc = false;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  defaultColumns = ['Date', 'Party', 'Invoice Ref', 'Amount', 'Mode', 'Actions'];

  constructor(private apiService: ApiService, private notificationService: NotificationService) {}

  ngOnInit() {
    this.loadData();
    this.columnsVisibility['payments'] = {};
    this.defaultColumns.forEach(col => {
      this.columnsVisibility['payments'][col] = true;
    });
  }

  loadData() {
    this.isLoading = true;
    this.hasError = false;
    forkJoin({
      parties: this.apiService.getParties(),
      invoices: this.apiService.getInvoices(),
      sales: this.apiService.getSales(),
      payments: this.apiService.getPayments()
    }).subscribe({
      next: ({ parties, invoices, sales, payments }) => {
        this.parties = parties || [];
        this.invoicesList = invoices || [];
        this.salesList = sales || [];
        this.paymentsList = payments || [];
        this.tableFilteredCounts['payments'] = this.paymentsList.length;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.hasError = true;
        this.notificationService.error('Load Failed', 'Could not load payments data.');
      }
    });
  }

  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  getOutstandingBalance(partyId: any): number {
    if (!partyId) return 0;
    const pId = partyId.toString();
    const totalSales = (this.salesList || [])
      .filter((s: any) => (s.party?.id?.toString() === pId || s.partyId?.toString() === pId || s.party?.partyId?.toString() === pId))
      .reduce((sum: number, s: any) => sum + (Number(s.totalAmount) || 0), 0);
    const totalPayments = (this.paymentsList || [])
      .filter((p: any) => (p.party?.id?.toString() === pId || p.partyId?.toString() === pId || p.party?.partyId?.toString() === pId))
      .reduce((sum: number, p: any) => sum + (Number(p.amountReceived) || 0), 0);
    return Math.max(0, totalSales - totalPayments);
  }

  savePayment() {
    if (!this.paymentsForm.paymentDate || !this.paymentsForm.id || this.paymentsForm.amountReceived <= 0) {
      this.notificationService.warning('Invalid Input', "Please fill required valid fields");
      return;
    }

    const editId = (this.paymentsForm as any)._editId;

    if (editId) {
      // UPDATE: only safe metadata fields (mode, date)
      this.apiService.updatePayment(editId, this.paymentsForm).subscribe({
        next: () => {
          this.loadData();
          this.notificationService.success('Updated', 'Payment record updated successfully');
          this.logAudit('Updated payment record ID: ' + editId);
          this.paymentsForm = { id: '', invoiceNo: '', amountReceived: 0, paymentMode: 'UPI', paymentDate: '' };
        },
        error: (err) => this.notificationService.error('Error', 'Failed to update payment: ' + (err.error?.message || err.message))
      });
    } else {
      if (this.salesList && this.salesList.length > 0) {
        const outstanding = this.getOutstandingBalance(this.paymentsForm.id);
        if (outstanding > 0 && Number(this.paymentsForm.amountReceived) > outstanding) {
          this.notificationService.warning(
            'Overpayment Warning',
            `Amount ₹${Number(this.paymentsForm.amountReceived).toLocaleString('en-IN')} exceeds outstanding balance of ₹${outstanding.toLocaleString('en-IN')}`
          );
          return;
        }
      }
      this.apiService.createPayment(this.paymentsForm).subscribe({
        next: (res) => {
          if (res) this.paymentsList.unshift(res);
          this.loadData();
          this.notificationService.success('Data Added', 'Payment collection record added successfully');
          this.logAudit("Added new payment collection");
          this.paymentsForm = { id: '', invoiceNo: '', amountReceived: 0, paymentMode: 'UPI', paymentDate: '' };
        },
        error: (err) => this.notificationService.error('Error', "Failed to save payment: " + (err.error?.message || err.message))
      });
    }
  }

  editPayment(p: any) {
    this.paymentsForm = {
      id: p.party?.id || '',
      invoiceNo: p.invoiceNo || '',
      amountReceived: p.amountReceived || 0,
      paymentMode: p.paymentMode || 'UPI',
      paymentDate: p.paymentDate || ''
    };
    (this.paymentsForm as any)._editId = p.id;
    this.notificationService.info('Edit Mode', `Loaded payment record for ${p.party?.partyName || 'party'} for editing.`);
    const formEl = document.querySelector('.form-card');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
  }

  deletePayment(id: any) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "Permission denied");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this payment record?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deletePayment(id).subscribe({
          next: () => {
            this.paymentsList = this.paymentsList.filter(x => (x.paymentId ? x.paymentId.toString() : x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Payment record deleted successfully');
            this.logAudit("Deleted payment record ID: " + id);
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

  trackByPaymentId(index: number, item: any): any {
    return item?.id ?? item?.paymentId ?? index;
  }
}
