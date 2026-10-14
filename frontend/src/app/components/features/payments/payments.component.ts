import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { TranslatePipe } from '../../../translate.service';
import { IndianDatePipe } from '../../../pipes/indian-date.pipe';
import { InrPipe } from '../../../pipes/inr-currency.pipe';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { ResizableTableDirective } from '../../../directives/resizable-table.directive';

export interface PaymentItem {
  id?: string | number;
  paymentId?: number | string;
  party?: {
    id?: number | string;
    partyName?: string;
    city?: string;
    state?: string;
    gstNumber?: string;
    contactNumber?: string;
  };
  partyId?: number | string;
  invoiceNo?: string;
  amountReceived: number;
  paymentMode: string; // Cash, UPI, Cheque, Bank Transfer, NEFT/RTGS
  paymentDate: string;
  referenceNo?: string;
  notes?: string;
  createdDate?: string;
}

import { SearchableSelectComponent } from '../../shared/searchable-select/searchable-select.component';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    IndianDatePipe,
    InrPipe,
    AutoSelectDirective,
    FormStateDirective,
    ResizableTableDirective,
    SearchableSelectComponent
  ],
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css']
})
export class PaymentsComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'payments';
  @Input() loggedInUser: any = null;
  @Output() onNavigateTab = new EventEmitter<string>();

  Math = Math;
  isLoading = true;
  isRefreshing = false;
  hasError = false;

  // Data collections
  paymentsList: PaymentItem[] = [];
  parties: any[] = [];
  invoicesList: any[] = [];
  salesList: any[] = [];

  // Subtab filtering
  subTab: 'all' | 'upi' | 'bank' | 'cash' | 'cheque' | 'high_value' = 'all';

  // Toolbar & Search Filters
  searchQuery: string = '';
  filterPartyId: string = '';
  filterPaymentMode: string = 'ALL';
  filterInvoiceType: string = 'ALL'; // 'ALL', 'INVOICE_LINKED', 'GENERAL'
  filterDateFrom: string = '';
  filterDateTo: string = '';
  isFilterPopoverOpen: boolean = false;

  // Table View & Pagination
  tableDensity: 'compact' | 'comfortable' | 'spacious' = 'comfortable';
  currentPage: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [10, 25, 50, 100];
  sortField: string = 'paymentDate';
  sortAsc: boolean = false;
  pagedPayments: PaymentItem[] = [];
  filteredPaymentsCount: number = 0;
  totalPages: number = 1;

  // Multi-Selection
  selectedPaymentIds: { [id: string]: boolean } = {};
  selectAllChecked: boolean = false;

  // Form State (Collapsible Add/Edit Panel)
  isFormVisible: boolean = false;
  editingPaymentId: string | null = null;
  paymentsForm = {
    paymentDate: new Date().toISOString().split('T')[0],
    partyId: '',
    invoiceNo: '',
    amountReceived: 0,
    paymentMode: 'UPI',
    referenceNo: '',
    notes: ''
  };

  // Receipt Voucher Slip Modal State
  isVoucherModalOpen: boolean = false;
  selectedPaymentForVoucher: PaymentItem | null = null;

  // Column Manager
  showColDropdown: boolean = false;
  columnsConfig = [
    { key: 'paymentDate', label: 'Receipt Date', visible: true, locked: true },
    { key: 'voucherRef', label: 'Voucher #', visible: true, locked: true },
    { key: 'party', label: 'Customer / Party', visible: true, locked: true },
    { key: 'invoiceRef', label: 'Invoice Reference', visible: true },
    { key: 'paymentMode', label: 'Payment Mode', visible: true },
    { key: 'amountReceived', label: 'Amount Received (₹)', visible: true },
    { key: 'outstanding', label: 'Party Balance (₹)', visible: true },
    { key: 'status', label: 'Reconciliation', visible: true },
    { key: 'actions', label: 'Actions', visible: true, locked: true }
  ];

  // Preset payment channels
  paymentModes = [
    { id: 'UPI', label: 'UPI (GPay / PhonePe / QR)', icon: 'bi-qr-code-scan', badgeClass: 'mode-upi' },
    { id: 'Bank Transfer', label: 'Bank Transfer / NEFT / RTGS', icon: 'bi-bank', badgeClass: 'mode-bank' },
    { id: 'Cash', label: 'Cash Receipt', icon: 'bi-cash-stack', badgeClass: 'mode-cash' },
    { id: 'Cheque', label: 'Cheque Clearance', icon: 'bi-card-heading', badgeClass: 'mode-cheque' }
  ];

  get selectableInvoices(): any[] {
    return (this.invoicesList || []).map(inv => {
      const remainingVal = inv.sale?.remaining !== undefined ? Number(inv.sale.remaining) : 0;
      return {
        invoiceNo: inv.invoiceNo,
        partyName: inv.party?.partyName || inv.partyName || 'Customer',
        displayLabel: `${inv.invoiceNo} — ${inv.party?.partyName || 'Customer'}`,
        dueText: `Due: ₹${remainingVal.toLocaleString('en-IN')}`
      };
    });
  }

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData(notify: boolean = false) {
    if (notify) {
      this.isRefreshing = true;
    } else if (this.paymentsList.length === 0) {
      this.isLoading = true;
    } else {
      this.isRefreshing = true;
    }
    this.hasError = false;

    forkJoin({
      parties: this.apiService.getParties().pipe(catchError(() => of([]))),
      invoices: this.apiService.getInvoices().pipe(catchError(() => of([]))),
      sales: this.apiService.getSales().pipe(catchError(() => of([]))),
      payments: this.apiService.getPayments().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ parties, invoices, sales, payments }) => {
        this.parties = parties || [];
        this.invoicesList = invoices || [];
        this.salesList = sales || [];
        this.paymentsList = payments || [];
        this.isLoading = false;
        this.isRefreshing = false;
        this.updateFilteredPayments();
        if (notify) {
          this.notificationService.success('Refreshed', 'Customer receipts and payment registry updated.');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.isRefreshing = false;
        this.hasError = true;
        this.notificationService.error('Load Failed', 'Could not load customer payment records.');
      }
    });
  }

  // Security / Role checks
  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  // Subtab switching
  setSubTab(tab: 'all' | 'upi' | 'bank' | 'cash' | 'cheque' | 'high_value') {
    this.subTab = tab;
    this.currentPage = 1;
    this.clearSelection();
    this.updateFilteredPayments();
  }

  // Party Outstanding Balance calculations
  getOutstandingBalance(partyId: any): number {
    if (!partyId) return 0;
    const pId = String(partyId);
    const totalSales = (this.salesList || [])
      .filter((s: any) => String(s.party?.id || s.partyId || s.party?.partyId) === pId)
      .reduce((sum: number, s: any) => sum + (Number(s.totalAmount) || 0), 0);
    const totalPayments = (this.paymentsList || [])
      .filter((p: any) => String(p.party?.id || p.partyId || p.party?.partyId) === pId)
      .reduce((sum: number, p: any) => sum + (Number(p.amountReceived) || 0), 0);
    return Math.max(0, totalSales - totalPayments);
  }

  getTotalOutstandingAcrossAllParties(): number {
    const partyIds = new Set(this.parties.map(p => String(p.id)));
    let total = 0;
    partyIds.forEach(id => {
      total += this.getOutstandingBalance(id);
    });
    return total;
  }

  // Financial Summary Metrics
  getTotalCollections(): number {
    return this.paymentsList.reduce((sum, p) => sum + (Number(p.amountReceived) || 0), 0);
  }

  getMonthlyCollections(): number {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return this.paymentsList
      .filter(p => (p.paymentDate || '').startsWith(currentMonth))
      .reduce((sum, p) => sum + (Number(p.amountReceived) || 0), 0);
  }

  getDigitalCollections(): number {
    return this.paymentsList
      .filter(p => {
        const m = (p.paymentMode || '').toUpperCase();
        return m.includes('UPI') || m.includes('BANK') || m.includes('NEFT') || m.includes('RTGS');
      })
      .reduce((sum, p) => sum + (Number(p.amountReceived) || 0), 0);
  }

  getCashCollections(): number {
    return this.paymentsList
      .filter(p => (p.paymentMode || '').toUpperCase().includes('CASH'))
      .reduce((sum, p) => sum + (Number(p.amountReceived) || 0), 0);
  }

  getAverageReceipt(): number {
    if (!this.paymentsList || this.paymentsList.length === 0) return 0;
    return Math.round(this.getTotalCollections() / this.paymentsList.length);
  }

  // Subtab count helpers
  getAllCount(): number {
    return this.paymentsList.length;
  }

  getUpiCount(): number {
    return this.paymentsList.filter(p => (p.paymentMode || '').toUpperCase().includes('UPI')).length;
  }

  getBankCount(): number {
    return this.paymentsList.filter(p => {
      const m = (p.paymentMode || '').toUpperCase();
      return m.includes('BANK') || m.includes('NEFT') || m.includes('RTGS');
    }).length;
  }

  getCashCount(): number {
    return this.paymentsList.filter(p => (p.paymentMode || '').toUpperCase().includes('CASH')).length;
  }

  getChequeCount(): number {
    return this.paymentsList.filter(p => (p.paymentMode || '').toUpperCase().includes('CHEQUE')).length;
  }

  getHighValueCount(): number {
    return this.paymentsList.filter(p => Number(p.amountReceived) >= 50000).length;
  }

  // Filters Popover
  toggleFilterPopover() {
    this.isFilterPopoverOpen = !this.isFilterPopoverOpen;
  }

  closeFilterPopover() {
    this.isFilterPopoverOpen = false;
  }

  resetFilters() {
    this.searchQuery = '';
    this.filterPartyId = '';
    this.filterPaymentMode = 'ALL';
    this.filterInvoiceType = 'ALL';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.subTab = 'all';
    this.currentPage = 1;
    this.closeFilterPopover();
    this.updateFilteredPayments();
    this.notificationService.info('Filters Reset', 'Showing all receipt records.');
  }

  getActiveFilterCount(): number {
    let count = 0;
    if (this.filterPartyId) count++;
    if (this.filterPaymentMode !== 'ALL') count++;
    if (this.filterInvoiceType !== 'ALL') count++;
    if (this.filterDateFrom || this.filterDateTo) count++;
    return count;
  }

  // Filter & Search pipeline
  getFilteredPayments(): PaymentItem[] {
    let list = [...this.paymentsList];

    // 1. Subtab filter
    switch (this.subTab) {
      case 'upi':
        list = list.filter(p => (p.paymentMode || '').toUpperCase().includes('UPI'));
        break;
      case 'bank':
        list = list.filter(p => {
          const m = (p.paymentMode || '').toUpperCase();
          return m.includes('BANK') || m.includes('NEFT') || m.includes('RTGS');
        });
        break;
      case 'cash':
        list = list.filter(p => (p.paymentMode || '').toUpperCase().includes('CASH'));
        break;
      case 'cheque':
        list = list.filter(p => (p.paymentMode || '').toUpperCase().includes('CHEQUE'));
        break;
      case 'high_value':
        list = list.filter(p => Number(p.amountReceived) >= 50000);
        break;
      case 'all':
      default:
        break;
    }

    // 2. Search query (Party name, city, voucher ref, invoice #, mode)
    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(p => {
        const partyName = (p.party?.partyName || '').toLowerCase();
        const city = (p.party?.city || '').toLowerCase();
        const voucher = this.getVoucherNumber(p).toLowerCase();
        const inv = (p.invoiceNo || '').toLowerCase();
        const mode = (p.paymentMode || '').toLowerCase();
        const ref = (p.referenceNo || '').toLowerCase();
        const notes = (p.notes || '').toLowerCase();
        return partyName.includes(q) || city.includes(q) || voucher.includes(q) || inv.includes(q) || mode.includes(q) || ref.includes(q) || notes.includes(q);
      });
    }

    // 3. Party Filter
    if (this.filterPartyId) {
      list = list.filter(p => String(p.party?.id || p.partyId) === String(this.filterPartyId));
    }

    // 4. Payment Mode Filter
    if (this.filterPaymentMode !== 'ALL') {
      list = list.filter(p => (p.paymentMode || '').toUpperCase().includes(this.filterPaymentMode.toUpperCase()));
    }

    // 5. Invoice Linkage Filter
    if (this.filterInvoiceType === 'INVOICE_LINKED') {
      list = list.filter(p => !!p.invoiceNo && p.invoiceNo.trim().length > 0);
    } else if (this.filterInvoiceType === 'GENERAL') {
      list = list.filter(p => !p.invoiceNo || p.invoiceNo.trim().length === 0);
    }

    // 6. Date Range Filters
    if (this.filterDateFrom) {
      list = list.filter(p => (p.paymentDate || '') >= this.filterDateFrom);
    }
    if (this.filterDateTo) {
      list = list.filter(p => (p.paymentDate || '') <= this.filterDateTo);
    }

    // 7. Sort
    list.sort((a, b) => {
      let valA: any = this.resolveFieldValue(a, this.sortField);
      let valB: any = this.resolveFieldValue(b, this.sortField);

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }

  resolveFieldValue(item: any, field: string): any {
    switch (field) {
      case 'party':
        return item.party?.partyName || '';
      case 'amountReceived':
        return Number(item.amountReceived) || 0;
      case 'voucherRef':
        return this.getVoucherNumber(item);
      case 'paymentDate':
      default:
        return item[field] || '';
    }
  }


  setPageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.updateFilteredPayments();
  }

  setPage(page: number) {
    this.currentPage = page;
    this.updateFilteredPayments();
  }

  updateFilteredPayments() {
    const filtered = this.getFilteredPayments();
    this.filteredPaymentsCount = filtered.length;
    this.totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedPayments = filtered.slice(start, start + this.pageSize);
  }

  getPaginatedPayments(): PaymentItem[] {
    return this.pagedPayments;
  }

  getTotalPages(): number {
    return this.totalPages;
  }

  setSort(field: string) {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = (field === 'party');
    }
    this.updateFilteredPayments();
  }

  // Voucher Number Formatter
  getVoucherNumber(p: PaymentItem): string {
    if (!p) return 'RCT-000';
    if (p.paymentId) return `RCT-${String(p.paymentId).padStart(4, '0')}`;
    const rawId = String(p.id || '1');
    const numPart = rawId.replace(/\D/g, '');
    if (numPart.length > 0) return `RCT-${numPart.slice(-4).padStart(4, '0')}`;
    return `RCT-${rawId.slice(0, 4).toUpperCase()}`;
  }

  // Mode badge styling helper
  getModeMeta(mode: string) {
    const m = (mode || '').toUpperCase();
    if (m.includes('UPI')) {
      return { label: 'UPI / QR', icon: 'bi-qr-code', badgeClass: 'badge-mode-upi' };
    }
    if (m.includes('BANK') || m.includes('NEFT') || m.includes('RTGS')) {
      return { label: 'Bank Transfer', icon: 'bi-bank', badgeClass: 'badge-mode-bank' };
    }
    if (m.includes('CHEQUE')) {
      return { label: 'Cheque', icon: 'bi-card-heading', badgeClass: 'badge-mode-cheque' };
    }
    return { label: 'Cash', icon: 'bi-cash-stack', badgeClass: 'badge-mode-cash' };
  }

  // Multi-Selection
  toggleSelectAll() {
    this.selectAllChecked = !this.selectAllChecked;
    const currentList = this.getPaginatedPayments();
    currentList.forEach(p => {
      const id = String(p.id || p.paymentId);
      this.selectedPaymentIds[id] = this.selectAllChecked;
    });
  }

  toggleSelectPayment(id: string | number) {
    const sid = String(id);
    this.selectedPaymentIds[sid] = !this.selectedPaymentIds[sid];
    const currentList = this.getPaginatedPayments();
    this.selectAllChecked = currentList.every(p => this.selectedPaymentIds[String(p.id || p.paymentId)]);
  }

  isPaymentSelected(id: string | number): boolean {
    return !!this.selectedPaymentIds[String(id)];
  }

  getSelectedCount(): number {
    return Object.values(this.selectedPaymentIds).filter(v => v).length;
  }

  clearSelection() {
    this.selectedPaymentIds = {};
    this.selectAllChecked = false;
  }

  // Form Management
  toggleFormVisibility() {
    this.isFormVisible = !this.isFormVisible;
    if (!this.isFormVisible) {
      this.resetForm();
    }
  }

  openForm() {
    this.isFormVisible = true;
  }

  resetForm() {
    this.editingPaymentId = null;
    this.paymentsForm = {
      paymentDate: new Date().toISOString().split('T')[0],
      partyId: '',
      invoiceNo: '',
      amountReceived: 0,
      paymentMode: 'UPI',
      referenceNo: '',
      notes: ''
    };
  }

  formatPaymentId(id: any): string {
    if (!id && id !== 0) return 'PAY-000';
    const str = String(id).trim();
    if (/^\d+$/.test(str)) return `PAY-${str.padStart(4, '0')}`;
    if (str.includes('-')) {
      const parts = str.split('-');
      return `PAY-${parts[0].toUpperCase()}`;
    }
    if (str.length > 8) return `PAY-${str.slice(0, 8).toUpperCase()}`;
    return `PAY-${str.toUpperCase()}`;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isVoucherModalOpen) {
      this.closeVoucherModal();
    } else if (this.isFormVisible) {
      this.cancelEditPayment();
    }
  }

  editPayment(p: PaymentItem) {
    if (this.isViewer()) return;
    this.editingPaymentId = String(p.id || p.paymentId);
    this.paymentsForm = {
      paymentDate: p.paymentDate || new Date().toISOString().split('T')[0],
      partyId: String(p.party?.id || p.partyId || ''),
      invoiceNo: p.invoiceNo || '',
      amountReceived: Number(p.amountReceived) || 0,
      paymentMode: p.paymentMode || 'UPI',
      referenceNo: p.referenceNo || '',
      notes: p.notes || ''
    };
    this.isFormVisible = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.notificationService.info('Edit Mode', `Loaded payment record #${this.formatPaymentId(this.editingPaymentId)} for ${p.party?.partyName || 'Customer'}.`);
  }

  cancelEditPayment() {
    this.resetForm();
    this.isFormVisible = false;
  }

  savePayment() {
    if (this.isViewer()) return;

    if (!this.paymentsForm.partyId) {
      this.notificationService.warning('Validation', 'Please select a registered Customer / Party.');
      return;
    }
    if (!this.paymentsForm.paymentDate) {
      this.notificationService.warning('Validation', 'Please provide the receipt date.');
      return;
    }
    if (!this.paymentsForm.amountReceived || this.paymentsForm.amountReceived <= 0) {
      this.notificationService.warning('Validation', 'Please enter a valid received amount greater than ₹0.');
      return;
    }

    const payload: any = {
      party: { id: this.paymentsForm.partyId },
      paymentDate: this.paymentsForm.paymentDate,
      amountReceived: Number(this.paymentsForm.amountReceived),
      paymentMode: this.paymentsForm.paymentMode,
      invoiceNo: this.paymentsForm.invoiceNo ? this.paymentsForm.invoiceNo.trim() : null,
      referenceNo: this.paymentsForm.referenceNo ? this.paymentsForm.referenceNo.trim() : null,
      notes: this.paymentsForm.notes ? this.paymentsForm.notes.trim() : null
    };

    if (this.editingPaymentId) {
      // Update safe metadata fields
      this.apiService.updatePayment(this.editingPaymentId, payload).subscribe({
        next: (res) => {
          const idx = this.paymentsList.findIndex(p => String(p.id) === String(this.editingPaymentId));
          if (idx !== -1) {
            this.paymentsList[idx] = { ...this.paymentsList[idx], ...payload, ...(res || {}) };
            this.paymentsList = [...this.paymentsList];
          }
          this.notificationService.success('Receipt Updated', 'Customer payment record updated successfully.');
          this.logAudit('Updated payment record ID: ' + this.editingPaymentId);
          this.cancelEditPayment();
        },
        error: (err) => {
          this.notificationService.error('Update Failed', err.error?.message || err.message || 'Could not update record.');
        }
      });
    } else {
      // Overpayment guard if invoice is selected
      if (this.paymentsForm.invoiceNo) {
        const inv = this.invoicesList.find(i => i.invoiceNo === this.paymentsForm.invoiceNo);
        if (inv && inv.sale && inv.sale.remaining !== undefined) {
          const remainingDue = Number(inv.sale.remaining) || 0;
          if (remainingDue > 0 && Number(this.paymentsForm.amountReceived) > remainingDue) {
            this.notificationService.warning(
              'Overpayment Warning',
              `Received amount ₹${Number(this.paymentsForm.amountReceived).toLocaleString('en-IN')} exceeds remaining invoice due of ₹${remainingDue.toLocaleString('en-IN')}.`
            );
            return;
          }
        }
      }

      this.apiService.createPayment(payload).subscribe({
        next: (res) => {
          const created = res || { ...payload, id: Date.now() };
          this.paymentsList.unshift(created);
          this.paymentsList = [...this.paymentsList];
          this.notificationService.success('Receipt Recorded', 'Customer payment collection successfully registered.');
          this.logAudit(`Recorded payment of ₹${payload.amountReceived} for party ${payload.party.id}`);
          this.cancelEditPayment();
        },
        error: (err) => {
          this.notificationService.error('Save Failed', err.error?.message || err.message || 'Could not register receipt.');
        }
      });
    }
  }

  deletePayment(p: PaymentItem) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', 'Only administrators can remove payment records.');
      return;
    }

    const id = String(p.id || p.paymentId);
    const voucherRef = this.getVoucherNumber(p);
    const partyName = p.party?.partyName || 'Customer';
    const amountStr = Number(p.amountReceived).toLocaleString('en-IN', { minimumFractionDigits: 2 });

    Swal.fire({
      title: 'Reverse / Delete Receipt?',
      html: `Are you sure you want to delete receipt voucher <strong>${voucherRef}</strong> for <strong>${partyName}</strong>?<br><br>
             <span style="color: #ef4444; font-weight: 700; font-size: 15px;">Amount: ₹${amountStr}</span><br>
             <small style="color: #64748b;">This will revert the credited balance back to the customer's ledger account.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete Record',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (result.isConfirmed) {
        this.apiService.deletePayment(id).subscribe({
          next: () => {
            this.paymentsList = this.paymentsList.filter(x => String(x.id || x.paymentId) !== id);
            this.notificationService.success('Deleted', `Payment record ${voucherRef} has been removed.`);
            this.logAudit(`Deleted payment record ${voucherRef} for ${partyName}`);
          },
          error: (err) => {
            this.notificationService.error('Delete Failed', err.error?.message || err.message || 'Could not delete payment record.');
          }
        });
      }
    });
  }

  // Voucher Slip Modal
  openVoucherModal(payment: PaymentItem) {
    this.selectedPaymentForVoucher = payment;
    this.isVoucherModalOpen = true;
  }

  closeVoucherModal() {
    this.isVoucherModalOpen = false;
    this.selectedPaymentForVoucher = null;
  }

  printVoucher() {
    window.print();
  }

  // Amount in words generator (Indian currency numbering)
  getAmountInWords(amount: number): string {
    if (!amount || isNaN(amount) || amount <= 0) return 'Zero Rupees Only';

    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
                   'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const numToWords = (n: number): string => {
      if (n === 0) return '';
      if (n < 20) return units[n] + ' ';
      if (n < 100) return tens[Math.floor(n / 10)] + ' ' + (n % 10 !== 0 ? units[n % 10] + ' ' : '');
      return units[Math.floor(n / 100)] + ' Hundred ' + (n % 100 !== 0 ? numToWords(n % 100) : '');
    };

    let n = Math.floor(amount);
    let words = '';

    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    if (crore > 0) words += numToWords(crore) + 'Crore ';

    const lakh = Math.floor(n / 100000);
    n %= 100000;
    if (lakh > 0) words += numToWords(lakh) + 'Lakh ';

    const thousand = Math.floor(n / 1000);
    n %= 1000;
    if (thousand > 0) words += numToWords(thousand) + 'Thousand ';

    const hundred = Math.floor(n / 100);
    n %= 100;
    if (hundred > 0) words += units[hundred] + ' Hundred ';

    if (n > 0) words += numToWords(n);

    const paise = Math.round((amount - Math.floor(amount)) * 100);
    let paiseText = '';
    if (paise > 0) {
      paiseText = ' and ' + numToWords(paise) + 'Paise';
    }

    return (words.trim() + ' Rupees' + paiseText + ' Only').replace(/\s+/g, ' ');
  }

  // Export handlers
  exportToCsv() {
    const list = this.getFilteredPayments();
    if (list.length === 0) {
      this.notificationService.info('Export', 'No receipt records available to export.');
      return;
    }

    const headers = ['Voucher Ref', 'Date', 'Customer Name', 'City', 'Invoice Ref', 'Payment Mode', 'Amount Received (INR)', 'Reference No'];
    const rows = list.map(p => [
      `"${this.getVoucherNumber(p)}"`,
      `"${p.paymentDate || ''}"`,
      `"${p.party?.partyName || ''}"`,
      `"${p.party?.city || ''}"`,
      `"${p.invoiceNo || 'General'}"`,
      `"${p.paymentMode || ''}"`,
      `"${Number(p.amountReceived) || 0}"`,
      `"${p.referenceNo || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Futane_Agro_Customer_Receipts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notificationService.success('CSV Exported', `Exported ${list.length} payment records.`);
  }

  exportToExcel() {
    this.exportToCsv(); // CSV provides full native compatibility with Microsoft Excel
  }

  bulkExportSelected() {
    const selectedList = this.paymentsList.filter(p => this.isPaymentSelected(String(p.id || p.paymentId)));
    if (selectedList.length === 0) return;

    const headers = ['Voucher Ref', 'Date', 'Customer Name', 'City', 'Invoice Ref', 'Payment Mode', 'Amount Received (INR)'];
    const rows = selectedList.map(p => [
      `"${this.getVoucherNumber(p)}"`,
      `"${p.paymentDate || ''}"`,
      `"${p.party?.partyName || ''}"`,
      `"${p.party?.city || ''}"`,
      `"${p.invoiceNo || 'General'}"`,
      `"${p.paymentMode || ''}"`,
      `"${Number(p.amountReceived) || 0}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Futane_Agro_Selected_Receipts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notificationService.success('Exported', `Exported ${selectedList.length} selected receipts.`);
  }

  // Column Visibility
  isColVisible(key: string): boolean {
    const col = this.columnsConfig.find(c => c.key === key);
    return col ? col.visible : true;
  }

  toggleColumnVisibility(col: any) {
    if (col.locked) return;
    col.visible = !col.visible;
  }

  resetColumns() {
    this.columnsConfig.forEach(c => c.visible = true);
  }

  getVisibleColCount(): number {
    return this.columnsConfig.filter(c => c.visible).length;
  }

  logAudit(action: string) {
    if (this.loggedInUser) {
      this.apiService.createAuditLog({
        username: this.loggedInUser.username,
        action: `[Payments] ${action}`
      }).subscribe({ error: () => {} });
    }
  }

  trackByPaymentId(index: number, item: PaymentItem): any {
    return item?.id || item?.paymentId || index;
  }
}
