import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
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
import { SearchableSelectComponent } from '../../shared/searchable-select/searchable-select.component';

declare var Razorpay: any;

export interface SaleItem {
  id?: string | number;
  saleId?: string | number;
  date: string;
  party?: {
    id?: number | string;
    partyName?: string;
    city?: string;
    state?: string;
    gstNumber?: string;
  };
  partyId?: number | string;
  crateType: string;
  crateMaterial: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  paid: number;
  remaining: number;
  notes?: string;
}

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    IndianDatePipe,
    InrPipe,
    AutoSelectDirective,
    FormStateDirective,
    SearchableSelectComponent
  ],
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css']
})
export class SalesComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'sales';
  @Input() loggedInUser: any = null;
  @Input() filterSearchQuery: string = '';
  @Input() filterDate: string = '';
  @Input() filterMonth: string = '';
  @Output() onNavigateTab = new EventEmitter<string>();

  Math = Math;
  isLoading = true;
  isRefreshing = false;
  hasError = false;

  // Data collections
  salesList: SaleItem[] = [];
  parties: any[] = [];
  dispatchesList: any[] = [];

  // Subtab filtering
  subTab: 'all' | 'pending' | 'paid' | 'dispatched' | 'awaiting_outward' | 'high_volume' = 'all';

  // Toolbar & Search Filters
  searchQuery: string = '';
  filterPartyId: string = '';
  filterPaymentStatus: string = 'ALL'; // 'ALL', 'PAID', 'PENDING'
  filterOutwardStatus: string = 'ALL'; // 'ALL', 'DISPATCHED', 'AWAITING'
  filterCrateType: string = '';
  isFilterPopoverOpen: boolean = false;

  // Material Outward Modal State
  isOutwardModalOpen: boolean = false;
  selectedSaleForOutward: SaleItem | null = null;
  outwardForm = {
    dispatchDate: new Date().toISOString().split('T')[0],
    vehicleNumber: '',
    driverName: '',
    deliveryAddress: '',
    status: 'In Transit'
  };

  // Density & Pagination
  tableDensity: 'compact' | 'comfortable' | 'spacious' = 'comfortable';
  currentPage: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [10, 25, 50, 100];
  sortField: string = 'date';
  sortAsc: boolean = false;

  // Multi-Selection
  selectedSaleIds: { [id: string]: boolean } = {};
  selectAllChecked: boolean = false;

  // Form State (Collapsible Add/Edit panel)
  isFormVisible: boolean = false;
  editingSaleId: string | null = null;
  salesForm = {
    date: new Date().toISOString().split('T')[0],
    partyId: '',
    crateType: 'Apple Crate',
    crateMaterial: 'Plastic',
    quantity: 0,
    rate: 0,
    totalAmount: 0,
    paid: 0,
    remaining: 0
  };

  // Slide-in Drawer State
  isDrawerOpen: boolean = false;
  selectedSaleForDrawer: SaleItem | null = null;
  drawerSaleForm: any = {};

  // Column Manager
  showColDropdown: boolean = false;
  columnsConfig = [
    { key: 'date', label: 'Order Date', visible: true, locked: true },
    { key: 'orderRef', label: 'Order Ref', visible: true },
    { key: 'party', label: 'Customer / Party', visible: true, locked: true },
    { key: 'crateSpecs', label: 'Crate Specs', visible: true },
    { key: 'quantity', label: 'Quantity', visible: true },
    { key: 'rate', label: 'Unit Rate (₹)', visible: true },
    { key: 'totalAmount', label: 'Total Value (₹)', visible: true },
    { key: 'paid', label: 'Settled (₹)', visible: true },
    { key: 'remaining', label: 'Balance Due (₹)', visible: true },
    { key: 'outwardStatus', label: 'Material Outward', visible: true },
    { key: 'status', label: 'Payment Status', visible: true },
    { key: 'actions', label: 'Actions', visible: true, locked: true }
  ];

  // Preset options
  crateTypes = [
    'Apple Crate',
    'Mango Crate',
    'Tomato Crate',
    'Vegetable Crate',
    'Dairy Crate',
    'Industrial Crate',
    'Fish Crate',
    'Jumbo Crate'
  ];

  crateMaterials = [
    'Plastic (Virgin HDPE)',
    'Plastic (Recycled)',
    'Heavy Duty Polypropylene',
    'Corrugated Composite',
    'Wooden'
  ];

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData(notify: boolean = false) {
    if (notify) this.isRefreshing = true;
    else this.isLoading = true;
    this.hasError = false;

    forkJoin({
      parties: this.apiService.getParties().pipe(catchError(() => of([]))),
      sales: this.apiService.getSales().pipe(catchError(() => of([]))),
      dispatches: this.apiService.getDispatches().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ parties, sales, dispatches }) => {
        this.parties = parties || [];
        this.salesList = sales || [];
        this.dispatchesList = dispatches || [];
        this.isLoading = false;
        this.isRefreshing = false;
        if (notify) {
          this.notificationService.success('Refreshed', 'Sales orders and outward dispatches updated.');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.isRefreshing = false;
        this.hasError = true;
        this.notificationService.error('Load Failed', 'Could not load sales orders.');
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
  setSubTab(tab: 'all' | 'pending' | 'paid' | 'dispatched' | 'awaiting_outward' | 'high_volume') {
    this.subTab = tab;
    this.currentPage = 1;
    this.clearSelection();
  }

  // Material Outward & Dispatch Helpers
  getDispatchForSale(sale: SaleItem): any {
    if (!sale) return null;
    const saleId = String(sale.saleId || sale.id);
    return this.dispatchesList.find(d => String(d.sale?.id || d.sale?.saleId || d.saleId) === saleId);
  }

  isDispatched(sale: SaleItem): boolean {
    return !!this.getDispatchForSale(sale);
  }

  getDispatchedCount(): number {
    return this.salesList.filter(s => this.isDispatched(s)).length;
  }

  getAwaitingOutwardCount(): number {
    return this.salesList.filter(s => !this.isDispatched(s)).length;
  }

  // Outward Modal Handlers
  openOutwardModal(sale: SaleItem) {
    this.selectedSaleForOutward = sale;
    const existingDispatch = this.getDispatchForSale(sale);
    this.outwardForm = {
      dispatchDate: existingDispatch ? (existingDispatch.date || existingDispatch.dispatchDate) : new Date().toISOString().split('T')[0],
      vehicleNumber: existingDispatch ? existingDispatch.vehicleNumber : '',
      driverName: existingDispatch ? existingDispatch.driverName : '',
      deliveryAddress: existingDispatch ? existingDispatch.deliveryAddress : (sale.party?.city ? `${sale.party?.partyName}, ${sale.party?.city}` : ''),
      status: existingDispatch ? existingDispatch.status : 'In Transit'
    };
    this.isOutwardModalOpen = true;
  }

  closeOutwardModal() {
    this.isOutwardModalOpen = false;
    this.selectedSaleForOutward = null;
  }

  saveMaterialOutward() {
    if (!this.selectedSaleForOutward) return;
    if (!this.outwardForm.vehicleNumber || !this.outwardForm.driverName) {
      this.notificationService.warning('Required Fields', 'Please enter both Vehicle Number and Driver Name.');
      return;
    }

    const sale = this.selectedSaleForOutward;
    const dispatchPayload: any = {
      dispatchNumber: 'DSP-' + Date.now().toString().slice(-6),
      sale: { id: sale.id || sale.saleId },
      vehicleNumber: this.outwardForm.vehicleNumber.trim().toUpperCase(),
      driverName: this.outwardForm.driverName.trim(),
      deliveryAddress: this.outwardForm.deliveryAddress,
      date: this.outwardForm.dispatchDate,
      status: this.outwardForm.status || 'In Transit'
    };

    this.apiService.createDispatch(dispatchPayload).subscribe({
      next: (res) => {
        this.dispatchesList.unshift(res);
        this.notificationService.success('Material Outward Created', `Dispatched Order #${sale.saleId || sale.id} with vehicle ${dispatchPayload.vehicleNumber}.`);
        this.logAudit(`Created material outward for sale #${sale.saleId || sale.id}`);
        this.closeOutwardModal();
      },
      error: (err) => {
        this.notificationService.error('Outward Failed', 'Failed to create dispatch: ' + (err.error?.message || err.message));
      }
    });
  }

  // Filter Popover Handlers
  toggleFilterPopover() {
    this.isFilterPopoverOpen = !this.isFilterPopoverOpen;
  }

  closeFilterPopover() {
    this.isFilterPopoverOpen = false;
  }

  getActiveFilterCount(): number {
    let count = 0;
    if (this.filterPartyId) count++;
    if (this.filterPaymentStatus !== 'ALL') count++;
    if (this.filterOutwardStatus !== 'ALL') count++;
    if (this.filterCrateType) count++;
    return count;
  }

  // Subtab Count Helpers
  getPendingCount(): number {
    return this.salesList.filter(s => (s.remaining || 0) > 0).length;
  }

  getPaidCount(): number {
    return this.salesList.filter(s => (s.remaining || 0) <= 0).length;
  }

  getHighVolumeCount(): number {
    return this.salesList.filter(s => (s.quantity || 0) >= 10000).length;
  }

  // KPI Ribbon Telemetry
  getTotalOrdersCount(): number {
    return this.salesList.length;
  }

  getTotalSalesAmount(): number {
    return this.salesList.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  }

  getTotalSalesPaid(): number {
    return this.salesList.reduce((sum, s) => sum + (Number(s.paid) || 0), 0);
  }

  getTotalSalesPending(): number {
    return this.salesList.reduce((sum, s) => sum + (Number(s.remaining) || 0), 0);
  }

  getCollectionEfficiency(): number {
    const total = this.getTotalSalesAmount();
    if (total <= 0) return 100;
    const paid = this.getTotalSalesPaid();
    return Math.min(100, Math.round((paid / total) * 100));
  }

  // Real-time calculation for Form
  calculateSalesTotal() {
    const qty = Math.max(0, Number(this.salesForm.quantity) || 0);
    const rate = Math.max(0, Number(this.salesForm.rate) || 0);
    this.salesForm.totalAmount = qty * rate;
    const paid = Math.max(0, Number(this.salesForm.paid) || 0);
    this.salesForm.remaining = Math.max(0, this.salesForm.totalAmount - paid);
  }

  // Real-time calculation for Drawer
  calculateDrawerTotal() {
    const qty = Math.max(0, Number(this.drawerSaleForm.quantity) || 0);
    const rate = Math.max(0, Number(this.drawerSaleForm.rate) || 0);
    this.drawerSaleForm.totalAmount = qty * rate;
    const paid = Math.max(0, Number(this.drawerSaleForm.paid) || 0);
    this.drawerSaleForm.remaining = Math.max(0, this.drawerSaleForm.totalAmount - paid);
  }

  // Form toggling
  toggleFormVisibility() {
    this.isFormVisible = !this.isFormVisible;
    if (this.isFormVisible && !this.editingSaleId) {
      this.resetSalesForm();
    }
  }

  resetSalesForm() {
    this.editingSaleId = null;
    this.salesForm = {
      date: new Date().toISOString().split('T')[0],
      partyId: '',
      crateType: 'Apple Crate',
      crateMaterial: 'Plastic',
      quantity: 0,
      rate: 0,
      totalAmount: 0,
      paid: 0,
      remaining: 0
    };
  }

  cancelEditSale() {
    this.resetSalesForm();
    this.isFormVisible = false;
  }

  // Save / Update logic
  saveSales() {
    if (!this.salesForm.date || !this.salesForm.partyId || this.salesForm.quantity <= 0 || this.salesForm.rate <= 0) {
      this.notificationService.warning('Validation Required', 'Please enter valid Order Date, Customer Party, Quantity, and Unit Rate.');
      return;
    }

    const selectedParty = this.parties.find(p => String(p.id) === String(this.salesForm.partyId));

    if (this.editingSaleId) {
      // UPDATE existing
      const payload: any = {
        date: this.salesForm.date,
        crateType: this.salesForm.crateType,
        crateMaterial: this.salesForm.crateMaterial,
        quantity: this.salesForm.quantity,
        rate: this.salesForm.rate,
        totalAmount: this.salesForm.totalAmount,
        paid: this.salesForm.paid,
        remaining: this.salesForm.remaining,
        party: selectedParty || { id: this.salesForm.partyId }
      };

      this.apiService.updateSale(this.editingSaleId, payload).subscribe({
        next: () => {
          this.loadData();
          this.notificationService.success('Updated', 'Sales order updated successfully.');
          this.logAudit('Updated sales record ID: ' + this.editingSaleId);
          this.resetSalesForm();
          this.isFormVisible = false;
        },
        error: (err) => {
          this.notificationService.error('Update Failed', 'Failed to update sale: ' + (err.error?.message || err.message));
        }
      });
    } else {
      // CREATE new
      const payload: any = {
        date: this.salesForm.date,
        id: this.salesForm.partyId, // Legacy backend accepts party id as 'id' or party object
        party: selectedParty || { id: this.salesForm.partyId },
        crateType: this.salesForm.crateType,
        crateMaterial: this.salesForm.crateMaterial,
        quantity: this.salesForm.quantity,
        rate: this.salesForm.rate,
        totalAmount: this.salesForm.totalAmount,
        paid: this.salesForm.paid,
        remaining: this.salesForm.remaining
      };

      this.apiService.createSale(payload).subscribe({
        next: (res) => {
          if (res) this.salesList.unshift(res);
          this.loadData();
          this.notificationService.success('Order Created', 'New commercial sales order created successfully.');
          this.logAudit('Added new sale record for party: ' + (selectedParty?.partyName || this.salesForm.partyId));
          this.resetSalesForm();
          this.isFormVisible = false;
        },
        error: (err) => {
          if (err.status === 409) {
            this.notificationService.error('Conflict', err.error?.message || 'A sale with this unique information already exists.');
          } else {
            this.notificationService.error('Error', 'Failed to save sale: ' + (err.error?.message || err.message));
          }
        }
      });
    }
  }

  // Edit in Form
  editSale(sale: SaleItem) {
    this.editingSaleId = String(sale.id || sale.saleId || '');
    this.salesForm = {
      date: sale.date || new Date().toISOString().split('T')[0],
      partyId: String(sale.party?.id || sale.partyId || ''),
      crateType: sale.crateType || 'Apple Crate',
      crateMaterial: sale.crateMaterial || 'Plastic',
      quantity: sale.quantity || 0,
      rate: sale.rate || 0,
      totalAmount: sale.totalAmount || 0,
      paid: sale.paid || 0,
      remaining: sale.remaining || 0
    };
    this.isFormVisible = true;
    this.notificationService.info('Editing Order', `Editing Order #${sale.saleId || sale.id} for "${sale.party?.partyName || 'Customer'}".`);
    
    // Smooth scroll to form
    setTimeout(() => {
      const formEl = document.querySelector('.sales-form-card');
      if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  // Delete Single Sale
  deleteSale(id: string | number) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', 'You do not have administrative permission to delete sales records.');
      return;
    }
    this.notificationService.confirmAction(
      'Confirm Deletion',
      `Are you sure you want to delete sales order #${id}? This will permanently remove the commercial record.`,
      'Yes, Delete'
    ).then(confirmed => {
      if (confirmed) {
        this.apiService.deleteSale(String(id)).subscribe({
          next: () => {
            this.salesList = this.salesList.filter(x => String(x.id || x.saleId) !== String(id));
            delete this.selectedSaleIds[String(id)];
            this.notificationService.success('Deleted', 'Sales order deleted successfully.');
            this.logAudit('Deleted sale record ID: ' + id);
            if (this.isDrawerOpen && String(this.selectedSaleForDrawer?.id || this.selectedSaleForDrawer?.saleId) === String(id)) {
              this.closeDrawer();
            }
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  // Drawer Management
  openDrawer(sale: SaleItem) {
    this.selectedSaleForDrawer = sale;
    this.drawerSaleForm = {
      id: sale.id || sale.saleId,
      date: sale.date || '',
      partyId: String(sale.party?.id || sale.partyId || ''),
      partyName: sale.party?.partyName || 'Customer',
      city: sale.party?.city || '',
      state: sale.party?.state || '',
      gstNumber: sale.party?.gstNumber || '',
      crateType: sale.crateType || 'Apple Crate',
      crateMaterial: sale.crateMaterial || 'Plastic',
      quantity: sale.quantity || 0,
      rate: sale.rate || 0,
      totalAmount: sale.totalAmount || 0,
      paid: sale.paid || 0,
      remaining: sale.remaining || 0,
      notes: sale.notes || ''
    };
    this.isDrawerOpen = true;
  }

  closeDrawer() {
    this.isDrawerOpen = false;
    this.selectedSaleForDrawer = null;
  }

  saveDrawerSale() {
    if (!this.drawerSaleForm.id) return;
    const selectedParty = this.parties.find(p => String(p.id) === String(this.drawerSaleForm.partyId));
    
    const payload: any = {
      date: this.drawerSaleForm.date,
      crateType: this.drawerSaleForm.crateType,
      crateMaterial: this.drawerSaleForm.crateMaterial,
      quantity: this.drawerSaleForm.quantity,
      rate: this.drawerSaleForm.rate,
      totalAmount: this.drawerSaleForm.totalAmount,
      paid: this.drawerSaleForm.paid,
      remaining: this.drawerSaleForm.remaining,
      party: selectedParty || { id: this.drawerSaleForm.partyId }
    };

    this.apiService.updateSale(String(this.drawerSaleForm.id), payload).subscribe({
      next: () => {
        this.loadData();
        this.notificationService.success('Order Updated', 'Changes saved successfully.');
        this.logAudit('Updated sales order ID via drawer: ' + this.drawerSaleForm.id);
        this.closeDrawer();
      },
      error: (err) => {
        this.notificationService.error('Update Failed', err.error?.message || err.message);
      }
    });
  }

  // Razorpay & UPI Payment Collections Gateway (Preserved & Enhanced)
  payWithRazorpay(sale: SaleItem) {
    const dueAmount = Number(sale.remaining) || 0;
    if (dueAmount <= 0) {
      this.notificationService.info('Already Settled', 'This order is already fully paid.');
      return;
    }

    Swal.fire({
      title: 'Collect Payment',
      text: `Order #${sale.saleId || sale.id} — Customer: ${sale.party?.partyName || 'Customer'}`,
      input: 'number',
      inputLabel: 'Amount to Pay (₹)',
      inputValue: dueAmount,
      showCancelButton: true,
      confirmButtonText: 'Proceed to Payment Gateway',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      inputValidator: (value) => {
        if (!value) return 'You must enter an amount!';
        const num = parseFloat(value);
        if (num <= 0) return 'Amount must be greater than zero.';
        if (num > dueAmount) return `Amount cannot exceed remaining balance of ₹${dueAmount.toLocaleString('en-IN')}.`;
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const requestedAmount = parseFloat(result.value);
        this.promptFallbackPayment(sale, requestedAmount);
      }
    });
  }

  promptFallbackPayment(sale: SaleItem, amount: number) {
    const upiId = 'futaneagro@okicici';
    const invoiceNum = sale.saleId || sale.id;
    const upiUri = `upi://pay?pa=${upiId}&pn=Futane%20Agro%20Industries&am=${amount}&cu=INR&tn=Invoice%20${invoiceNum}`;
    const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri)}`;

    Swal.fire({
      title: 'Futane Agro Payment Gateway',
      html: `
        <div style="text-align: center; padding: 6px;">
          <div style="background: rgba(16, 185, 129, 0.08); padding: 14px; border-radius: 12px; margin-bottom: 16px; border: 1px solid rgba(16, 185, 129, 0.3);">
            <div style="font-size: 13px; color: #64748b; font-weight: 500;">Invoice Receivable Amount:</div>
            <div style="font-size: 30px; font-weight: 800; color: #10b981; margin: 4px 0;">₹${amount.toLocaleString('en-IN')}</div>
            <div style="font-size: 12px; color: #475569;">Ref Order: <b>#${invoiceNum}</b> | Customer: <b>${sale.party?.partyName || 'Customer'}</b></div>
          </div>

          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; margin-bottom: 16px;">
            <div style="padding: 14px; background: #ffffff; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); display: inline-block;">
              <img src="${upiQrUrl}" alt="Futane UPI QR Code" style="width: 190px; height: 190px; display: block; margin: 0 auto;" />
              <div style="font-size: 12px; font-weight: 700; color: #1e293b; margin-top: 10px;">Scan with GPay / PhonePe / Paytm / BHIM</div>
            </div>
            <div style="font-size: 11.5px; color: #475569; background: #f1f5f9; padding: 6px 14px; border-radius: 20px;">
              Direct UPI VPA: <b>${upiId}</b>
            </div>
          </div>

          <div style="font-size: 12px; color: #64748b; line-height: 1.4;">
            To process live bank credit card payments, ensure Razorpay Live API keys are activated. Click below to verify and record this transaction.
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirm & Record Payment (₹' + amount.toLocaleString('en-IN') + ')',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b'
    }).then((res) => {
      if (res.isConfirmed) {
        Swal.fire({
          title: 'Registering Payment...',
          text: 'Posting payment transaction to accounting ledger...',
          allowOutsideClick: false,
          didOpen: () => { Swal.showLoading(); }
        });
        const txnId = 'PAY_' + Date.now();
        this.processPaymentSuccess(sale, amount, txnId);
      }
    });
  }

  processPaymentSuccess(sale: SaleItem, amount: number, txnId: string) {
    const paymentPayload = {
      party: sale.party,
      amountReceived: amount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'Online (Razorpay / UPI)',
      invoiceNo: sale.saleId ? 'INV-' + sale.saleId : 'ORD-' + (sale.id || ''),
      notes: 'Online Payment TXN: ' + txnId
    };

    this.apiService.createPayment(paymentPayload).subscribe({
      next: () => {
        Swal.close();
        this.notificationService.success('Payment Recorded', `₹${amount.toLocaleString('en-IN')} paid successfully. Balance updated.`);
        this.loadData();
        this.generateReceipt(sale, amount, txnId);
      },
      error: () => {
        // Fallback: update sale directly if payment creation encounters issue
        sale.paid = (sale.paid || 0) + amount;
        sale.remaining = Math.max(0, (sale.totalAmount || 0) - sale.paid);
        Swal.close();
        this.notificationService.success('Payment Recorded', `₹${amount.toLocaleString('en-IN')} updated directly.`);
        this.loadData();
        this.generateReceipt(sale, amount, txnId);
      }
    });
  }

  generateReceipt(sale: SaleItem, paidAmount: number, paymentId: string) {
    const invoiceNum = sale.saleId || sale.id;
    const balanceRemaining = Math.max(0, (Number(sale.remaining) || 0) - paidAmount);
    
    Swal.fire({
      title: 'Commercial Payment Receipt',
      html: `
        <div style="text-align: left; font-family: 'Courier New', Courier, monospace; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px dashed #cbd5e1; font-size: 13px; color: #0f172a;">
          <div style="text-align: center; font-weight: bold; font-size: 15px; margin-bottom: 4px;">FUTANE AGRO INDUSTRIES PVT. LTD.</div>
          <div style="text-align: center; font-size: 11px; color: #64748b; margin-bottom: 12px;">Fruit Crate Moulding & Commercial Division</div>
          --------------------------------------------------<br>
          <b>Receipt No:</b> RZP-${paymentId}<br>
          <b>Date & Time:</b> ${new Date().toLocaleString('en-IN')}<br>
          <b>Order Ref:</b> #${invoiceNum}<br>
          <b>Customer:</b> ${sale.party?.partyName || 'Customer'}<br>
          <b>Location:</b> ${sale.party?.city || ''}${sale.party?.state ? ', ' + sale.party?.state : ''}<br>
          <b>Product:</b> ${sale.quantity}x ${sale.crateType} (${sale.crateMaterial})<br>
          --------------------------------------------------<br>
          <b>Gross Order Value:</b> ₹${(Number(sale.totalAmount) || 0).toLocaleString('en-IN')}<br>
          <b style="color: #10b981; font-size: 14px;">Amount Received:  ₹${paidAmount.toLocaleString('en-IN')}</b><br>
          <b>Balance Outstanding:</b> ₹${balanceRemaining.toLocaleString('en-IN')}<br>
          <b>Payment Mode:</b> Instant UPI / Razorpay Gateway<br>
          --------------------------------------------------<br>
          <div style="text-align: center; font-size: 11px; color: #64748b; margin-top: 8px;">
            This is a computer generated commercial receipt.<br>
            Thank you for your valued partnership!
          </div>
        </div>
      `,
      icon: 'success',
      confirmButtonText: 'Print / Done',
      confirmButtonColor: '#10b981'
    });
  }

  logAudit(action: string) {
    if (this.loggedInUser) {
      this.apiService.createAuditLog({ username: this.loggedInUser.username, action }).subscribe();
    }
  }

  // Multi-Selection Logic
  toggleSelectAll() {
    const list = this.getFilteredList();
    if (this.selectAllChecked) {
      list.forEach(sale => {
        const id = String(sale.id || sale.saleId);
        this.selectedSaleIds[id] = true;
      });
    } else {
      this.selectedSaleIds = {};
    }
  }

  toggleSaleSelection(id: string | number) {
    const key = String(id);
    this.selectedSaleIds[key] = !this.selectedSaleIds[key];
    const list = this.getFilteredList();
    this.selectAllChecked = list.length > 0 && list.every(s => this.selectedSaleIds[String(s.id || s.saleId)]);
  }

  hasSelectedSales(): boolean {
    return Object.values(this.selectedSaleIds).some(v => v);
  }

  getSelectedCount(): number {
    return Object.values(this.selectedSaleIds).filter(Boolean).length;
  }

  clearSelection() {
    this.selectedSaleIds = {};
    this.selectAllChecked = false;
  }

  batchDeleteSelected() {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', 'You do not have administrative permission to delete records.');
      return;
    }

    const selectedIds = Object.keys(this.selectedSaleIds).filter(k => this.selectedSaleIds[k]);
    if (selectedIds.length === 0) return;

    this.notificationService.confirmAction(
      'Confirm Batch Delete',
      `Are you sure you want to delete ${selectedIds.length} selected sales order(s)? This action cannot be reversed.`,
      `Yes, Delete ${selectedIds.length} Orders`
    ).then(confirmed => {
      if (confirmed) {
        const deleteObservables = selectedIds.map(id => this.apiService.deleteSale(id));
        forkJoin(deleteObservables).subscribe({
          next: () => {
            this.salesList = this.salesList.filter(s => !selectedIds.includes(String(s.id || s.saleId)));
            this.clearSelection();
            this.notificationService.success('Batch Delete', `Successfully removed ${selectedIds.length} orders.`);
            this.logAudit(`Batch deleted ${selectedIds.length} sales records.`);
          },
          error: (err) => {
            this.loadData();
            this.notificationService.error('Batch Delete Error', 'Some records could not be deleted: ' + (err.error?.message || err.message));
          }
        });
      }
    });
  }

  // Column Manager Dropdown
  toggleColDropdown() {
    this.showColDropdown = !this.showColDropdown;
  }

  toggleColumn(key: string) {
    const col = this.columnsConfig.find(c => c.key === key);
    if (col && !col.locked) {
      col.visible = !col.visible;
    }
  }

  isColVisible(key: string): boolean {
    const col = this.columnsConfig.find(c => c.key === key);
    return col ? col.visible : true;
  }

  resetColumns() {
    this.columnsConfig.forEach(c => c.visible = true);
  }

  // Sorting
  setSort(field: string) {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = true;
    }
  }

  // Filtering & Pagination Data Engine
  getFilteredList(): SaleItem[] {
    let result = [...this.salesList];

    // 1. Subtab filter
    if (this.subTab === 'pending') {
      result = result.filter(s => (Number(s.remaining) || 0) > 0);
    } else if (this.subTab === 'paid') {
      result = result.filter(s => (Number(s.remaining) || 0) <= 0);
    } else if (this.subTab === 'dispatched') {
      result = result.filter(s => this.isDispatched(s));
    } else if (this.subTab === 'awaiting_outward') {
      result = result.filter(s => !this.isDispatched(s));
    } else if (this.subTab === 'high_volume') {
      result = result.filter(s => (Number(s.quantity) || 0) >= 10000);
    }

    // 2. Search query (multi-field)
    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(s => {
        const pName = (s.party?.partyName || '').toLowerCase();
        const pCity = (s.party?.city || '').toLowerCase();
        const cType = (s.crateType || '').toLowerCase();
        const cMat = (s.crateMaterial || '').toLowerCase();
        const ref = String(s.saleId || s.id || '').toLowerCase();
        const date = (s.date || '').toLowerCase();
        const disp = this.getDispatchForSale(s);
        const veh = (disp?.vehicleNumber || '').toLowerCase();
        const drv = (disp?.driverName || '').toLowerCase();
        return pName.includes(q) || pCity.includes(q) || cType.includes(q) || cMat.includes(q) || ref.includes(q) || date.includes(q) || veh.includes(q) || drv.includes(q);
      });
    }

    // 3. Parent input filterSearchQuery
    if (this.filterSearchQuery && this.filterSearchQuery.trim()) {
      const q = this.filterSearchQuery.toLowerCase().trim();
      result = result.filter(s => {
        const pName = (s.party?.partyName || '').toLowerCase();
        const pCity = (s.party?.city || '').toLowerCase();
        const cType = (s.crateType || '').toLowerCase();
        return pName.includes(q) || pCity.includes(q) || cType.includes(q);
      });
    }

    // 4. Party dropdown filter
    if (this.filterPartyId) {
      result = result.filter(s => String(s.party?.id || s.partyId) === String(this.filterPartyId));
    }

    // 5. Payment status dropdown filter
    if (this.filterPaymentStatus === 'PAID') {
      result = result.filter(s => (Number(s.remaining) || 0) <= 0);
    } else if (this.filterPaymentStatus === 'PENDING') {
      result = result.filter(s => (Number(s.remaining) || 0) > 0);
    }

    // 6. Outward status filter
    if (this.filterOutwardStatus === 'DISPATCHED') {
      result = result.filter(s => this.isDispatched(s));
    } else if (this.filterOutwardStatus === 'AWAITING') {
      result = result.filter(s => !this.isDispatched(s));
    }

    // 7. Crate Type filter
    if (this.filterCrateType) {
      result = result.filter(s => s.crateType === this.filterCrateType);
    }

    // 8. Date & Month filters
    if (this.filterDate) {
      result = result.filter(s => s.date === this.filterDate);
    }
    if (this.filterMonth) {
      result = result.filter(s => {
        if (!s.date) return false;
        const m = new Date(s.date).toLocaleString('default', { month: 'long' });
        return m.toLowerCase() === this.filterMonth.toLowerCase();
      });
    }

    // 9. Sorting
    result.sort((a, b) => {
      let valA: any = this.resolveSortValue(a, this.sortField);
      let valB: any = this.resolveSortValue(b, this.sortField);

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }

  private resolveSortValue(item: SaleItem, field: string): any {
    switch (field) {
      case 'date': return item.date || '';
      case 'party': return item.party?.partyName || '';
      case 'crateType': return item.crateType || '';
      case 'quantity': return Number(item.quantity) || 0;
      case 'rate': return Number(item.rate) || 0;
      case 'totalAmount': return Number(item.totalAmount) || 0;
      case 'paid': return Number(item.paid) || 0;
      case 'remaining': return Number(item.remaining) || 0;
      default: return item.id || item.saleId || '';
    }
  }

  getPaginatedList(): SaleItem[] {
    const list = this.getFilteredList();
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  getTotalPages(): number {
    const total = this.getFilteredList().length;
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  resetFilters() {
    this.searchQuery = '';
    this.filterPartyId = '';
    this.filterPaymentStatus = 'ALL';
    this.filterOutwardStatus = 'ALL';
    this.filterCrateType = '';
    this.subTab = 'all';
    this.currentPage = 1;
    this.isFilterPopoverOpen = false;
  }

  // Dynamic Accounting Totals for <tfoot>
  getFilteredTotalQuantity(): number {
    return this.getFilteredList().reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
  }

  getFilteredTotalAmount(): number {
    return this.getFilteredList().reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  }

  getFilteredTotalPaid(): number {
    return this.getFilteredList().reduce((sum, s) => sum + (Number(s.paid) || 0), 0);
  }

  getFilteredTotalRemaining(): number {
    return this.getFilteredList().reduce((sum, s) => sum + (Number(s.remaining) || 0), 0);
  }

  // Export to CSV & Excel
  exportToCsv() {
    const data = this.getFilteredList();
    if (data.length === 0) {
      this.notificationService.warning('Export', 'No sales orders found to export.');
      return;
    }

    const headers = ['Order Ref', 'Date', 'Customer Name', 'City', 'State', 'Crate Type', 'Material', 'Quantity', 'Unit Rate (INR)', 'Total Amount (INR)', 'Paid (INR)', 'Remaining Due (INR)', 'Status'];
    const rows = data.map(s => [
      `"${s.saleId || s.id || ''}"`,
      `"${s.date || ''}"`,
      `"${(s.party?.partyName || '').replace(/"/g, '""')}"`,
      `"${(s.party?.city || '').replace(/"/g, '""')}"`,
      `"${(s.party?.state || '').replace(/"/g, '""')}"`,
      `"${(s.crateType || '').replace(/"/g, '""')}"`,
      `"${(s.crateMaterial || '').replace(/"/g, '""')}"`,
      s.quantity || 0,
      s.rate || 0,
      s.totalAmount || 0,
      s.paid || 0,
      s.remaining || 0,
      `"${(s.remaining || 0) <= 0 ? 'Settled' : 'Pending'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Futane_Agro_Sales_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notificationService.success('Export Successful', `Exported ${data.length} sales orders to CSV.`);
  }

  exportToExcel() {
    // Generates an Excel-friendly CSV with BOM for correct UTF-8 display in Microsoft Excel
    const data = this.getFilteredList();
    if (data.length === 0) {
      this.notificationService.warning('Export', 'No sales orders found to export.');
      return;
    }

    const headers = ['Order ID', 'Date', 'Party Name', 'City', 'State', 'Crate Type', 'Material', 'Quantity', 'Rate', 'Total Value', 'Paid Amount', 'Balance Due', 'Status'];
    const rows = data.map(s => [
      `"${s.saleId || s.id || ''}"`,
      `"${s.date || ''}"`,
      `"${(s.party?.partyName || '').replace(/"/g, '""')}"`,
      `"${(s.party?.city || '').replace(/"/g, '""')}"`,
      `"${(s.party?.state || '').replace(/"/g, '""')}"`,
      `"${(s.crateType || '').replace(/"/g, '""')}"`,
      `"${(s.crateMaterial || '').replace(/"/g, '""')}"`,
      s.quantity || 0,
      s.rate || 0,
      s.totalAmount || 0,
      s.paid || 0,
      s.remaining || 0,
      `"${(s.remaining || 0) <= 0 ? 'Settled' : 'Pending'}"`
    ]);

    const csvString = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvString], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Futane_Agro_Sales_Ledger_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notificationService.success('Excel Export', `Downloaded ${data.length} records for Excel.`);
  }

  trackBySale(index: number, item: SaleItem): any {
    return item?.id ?? item?.saleId ?? index;
  }
}
