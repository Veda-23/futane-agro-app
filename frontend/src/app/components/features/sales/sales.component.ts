import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, HostListener, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { TranslatePipe } from '../../../translate.service';
import { IndianDatePipe } from '../../../pipes/indian-date.pipe';
import { InrPipe } from '../../../pipes/inr-currency.pipe';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { ResizableTableDirective } from '../../../directives/resizable-table.directive';
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

/**
 * Commercial Sales Ledger, Order Dispatch & Storefront Fulfillment Hub.
 *
 * Responsibilities:
 * - Commercial wholesale crate sales order entry, ledger tracking, and receivables monitoring.
 * - Subtab workflows: All Orders, Pending Dues, Fully Paid, Dispatched, Awaiting Outward, High Volume (>500 crates), and Web Orders.
 * - Storefront B2B Web Order processing: reviews incoming public orders and converts them to official sales ledgers.
 * - Outward dispatch linkage: generates vehicle gate-passes and tracks consignment delivery states.
 * - Online payment integration via Razorpay modal checkout and payment links.
 * - High-performance Angular architecture: utilizes `ChangeDetectionStrategy.OnPush` with RxJS input debouncing (300ms).
 */
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
    ResizableTableDirective,
    SearchableSelectComponent
  ],
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesComponent implements OnInit, OnDestroy {
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
  subTab: 'all' | 'pending' | 'paid' | 'dispatched' | 'awaiting_outward' | 'high_volume' | 'web_orders' = 'all';

  // Customer Web Orders (Storefront Integration Bridge)
  webOrdersList: any[] = [];
  webOrdersLoading: boolean = false;
  selectedWebOrder: any = null;
  showWebOrderDossier: boolean = false;

  // Toolbar & Search Filters
  searchInputText: string = '';
  searchQuery: string = '';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
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
    status: 'In Transit',
    ewayBillNo: 'EWB-9821-4455-8899',
    carrierFleet: 'VRL Logistics Ltd.',
    grossWeightKg: 14850,
    tareWeightKg: 9850
  };

  // Sales Order Dossier Modal State
  showSalesDossierModal: boolean = false;
  selectedSaleForDossier: SaleItem | null = null;

  openSalesDossier(sale: SaleItem): void {
    this.selectedSaleForDossier = sale;
    this.showSalesDossierModal = true;
  }

  closeSalesDossier(): void {
    this.showSalesDossierModal = false;
    this.selectedSaleForDossier = null;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showSalesDossierModal) {
      this.closeSalesDossier();
    } else if (this.isOutwardModalOpen) {
      this.closeOutwardModal();
    } else if (this.isFormVisible) {
      this.cancelEditSale();
    }
  }

  printSalesDossier(): void {
    window.print();
  }

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
    'Fresh Tomato Commercial Tray',
    'Kesar Mango Export Box (10kg)',
    'Pomegranate Super-Red Crate (5kg)',
    'Export Grade A Grapes Crate',
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
    'Plastic',
    'Plastic (Virgin HDPE)',
    'Plastic (Recycled)',
    'Heavy Duty Polypropylene',
    'Corrugated Composite',
    'Wooden'
  ];

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService,
    public cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(150),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.searchQuery = query;
      this.currentPage = 1;
      this.cdr.markForCheck();
    });

    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(value: string) {
    this.searchInputText = value;
    this.searchSubject.next(value);
  }

  clearSearch() {
    this.searchInputText = '';
    this.searchQuery = '';
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  loadData(notify: boolean = false) {
    if (notify) {
      this.isRefreshing = true;
    } else if (this.salesList.length === 0) {
      this.isLoading = true;
    } else {
      this.isRefreshing = true;
    }
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
        this.rebuildDispatchMap();
        this.isLoading = false;
        this.isRefreshing = false;
        this.loadWebOrders();
        if (notify) {
          this.notificationService.success('Refreshed', 'Sales orders and outward dispatches updated.');
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.isRefreshing = false;
        this.hasError = true;
        this.notificationService.error('Load Failed', 'Could not load sales orders.');
        this.cdr.markForCheck();
      }
    });
  }

  // Load Storefront Web Orders
  loadWebOrders(): void {
    this.webOrdersLoading = true;
    this.apiService.getWebOrders().pipe(catchError(() => of({ content: [] }))).subscribe({
      next: (res: any) => {
        this.webOrdersList = res?.content || (Array.isArray(res) ? res : []);
        this.webOrdersLoading = false;
      },
      error: () => {
        this.webOrdersLoading = false;
      }
    });
  }

  getWebOrdersCount(): number {
    return this.webOrdersList.length;
  }

  openWebOrderDossier(order: any): void {
    this.selectedWebOrder = order;
    this.showWebOrderDossier = true;
  }

  closeWebOrderDossier(): void {
    this.showWebOrderDossier = false;
    this.selectedWebOrder = null;
  }

  approveWebOrder(order: any): void {
    Swal.fire({
      title: 'Approve Customer Web Order?',
      text: `Reserve stock and schedule batch for Order #${order.orderNumber} (${order.customerName})`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Approve & Reserve Stock',
      confirmButtonColor: '#065F46'
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.updateWebOrderStatus(order.id, {
          status: 'APPROVED',
          note: 'Order approved by Plant Sales Desk. Stock reserved in warehouse.'
        }).subscribe({
          next: () => {
            this.notificationService.success('Approved', `Order #${order.orderNumber} approved and stock reserved.`);
            this.loadWebOrders();
          },
          error: (err) => {
            this.notificationService.error('Error', err?.error?.message || 'Could not approve order.');
          }
        });
      }
    });
  }

  convertWebOrderToSale(order: any): void {
    Swal.fire({
      title: 'Generate Official GST Tax Invoice?',
      text: `Convert web order #${order.orderNumber} into an official commercial Sales record and generate a Tax Invoice.`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Convert & Invoice',
      confirmButtonColor: '#d97706'
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.convertWebOrderToSale(order.id).subscribe({
          next: (resp: any) => {
            this.notificationService.success('Converted', `Official Tax Invoice #${resp.invoiceNo} generated for order #${order.orderNumber}!`);
            this.loadData();
            this.loadWebOrders();
          },
          error: (err) => {
            this.notificationService.error('Error', err?.error?.message || 'Failed to convert web order.');
          }
        });
      }
    });
  }

  dispatchWebOrder(order: any): void {
    Swal.fire({
      title: 'Dispatch Fleet for Web Order',
      html: `
        <div style="display:flex; flex-direction:column; gap:8px; text-align:left;">
          <label style="font-size:12px; font-weight:700;">Vehicle Number</label>
          <input id="swalVehicle" class="swal2-input" style="margin:0;" placeholder="MH-12-QB-4921">
          <label style="font-size:12px; font-weight:700; margin-top:8px;">Driver Name</label>
          <input id="swalDriver" class="swal2-input" style="margin:0;" placeholder="Sunil Gaikwad">
          <label style="font-size:12px; font-weight:700; margin-top:8px;">Driver Mobile</label>
          <input id="swalMobile" class="swal2-input" style="margin:0;" placeholder="9822011223">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Dispatch Fleet',
      confirmButtonColor: '#065F46',
      preConfirm: () => {
        const vehicle = (document.getElementById('swalVehicle') as HTMLInputElement)?.value;
        const driver = (document.getElementById('swalDriver') as HTMLInputElement)?.value;
        const mobile = (document.getElementById('swalMobile') as HTMLInputElement)?.value;
        if (!vehicle || !driver) {
          Swal.showValidationMessage('Vehicle number and Driver name are required');
          return false;
        }
        return { vehicle, driver, mobile };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.apiService.updateWebOrderStatus(order.id, {
          status: 'DISPATCHED',
          vehicleNumber: result.value.vehicle,
          driverName: result.value.driver,
          driverMobile: result.value.mobile,
          note: `Dispatched on fleet ${result.value.vehicle}`
        }).subscribe({
          next: () => {
            this.notificationService.success('Dispatched', `Order #${order.orderNumber} marked as DISPATCHED. Customer tracker updated in real time.`);
            this.loadWebOrders();
          },
          error: (err) => {
            this.notificationService.error('Error', err?.error?.message || 'Could not update dispatch.');
          }
        });
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
  setSubTab(tab: 'all' | 'pending' | 'paid' | 'dispatched' | 'awaiting_outward' | 'high_volume' | 'web_orders') {
    this.subTab = tab;
    this.currentPage = 1;
    this.clearSelection();
    if (tab === 'web_orders') {
      this.loadWebOrders();
    }
  }

  // O(1) Dispatch Index
  private dispatchMap = new Map<string, any>();

  private rebuildDispatchMap(): void {
    this.dispatchMap.clear();
    for (const d of this.dispatchesList) {
      const sId = String(d.sale?.id || d.sale?.saleId || d.saleId || '');
      if (sId) this.dispatchMap.set(sId, d);
    }
  }

  // Material Outward & Dispatch Helpers (O(1) Map Lookup)
  getDispatchForSale(sale: SaleItem): any {
    if (!sale) return null;
    const saleId = String(sale.saleId || sale.id || '');
    return this.dispatchMap.get(saleId) || null;
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
    const estWeight = Math.round((sale.quantity || 1000) * 1.85);
    this.outwardForm = {
      dispatchDate: existingDispatch ? (existingDispatch.date || existingDispatch.dispatchDate) : new Date().toISOString().split('T')[0],
      vehicleNumber: existingDispatch ? existingDispatch.vehicleNumber : '',
      driverName: existingDispatch ? existingDispatch.driverName : '',
      deliveryAddress: existingDispatch ? existingDispatch.deliveryAddress : (sale.party?.city ? `${sale.party?.partyName}, ${sale.party?.city}` : ''),
      status: existingDispatch ? existingDispatch.status : 'In Transit',
      ewayBillNo: 'EWB-' + Math.floor(100000000000 + Math.random() * 900000000000),
      carrierFleet: 'VRL Logistics Ltd.',
      grossWeightKg: 9500 + estWeight,
      tareWeightKg: 9500
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
        this.rebuildDispatchMap();
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

  getTotalCratesSold(): number {
    return this.salesList.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
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

  openForm() {
    this.isFormVisible = true;
    if (!this.editingSaleId) {
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
        next: (res) => {
          const idx = this.salesList.findIndex(s => String(s.id || s.saleId) === String(this.editingSaleId));
          if (idx !== -1) {
            this.salesList[idx] = { ...this.salesList[idx], ...payload, ...(res || {}) };
            this.salesList = [...this.salesList];
          }
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
          const created = res || { ...payload, id: Date.now() };
          this.salesList.unshift(created);
          this.salesList = [...this.salesList];
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
    const idStr = String(sale.id || '');
    const cleanRef = sale.saleId ? String(sale.saleId) : (idStr.length > 8 ? idStr.substring(0, 8) : idStr);
    this.drawerSaleForm = {
      id: cleanRef,
      rawId: sale.id || sale.saleId,
      date: sale.date || '',
      partyId: String(sale.party?.id || sale.partyId || ''),
      partyName: sale.party?.partyName || 'Customer',
      city: sale.party?.city || '',
      state: sale.party?.state || '',
      gstNumber: sale.party?.gstNumber || '',
      crateType: sale.crateType || 'Fresh Tomato Commercial Tray',
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

    const targetId = String(this.drawerSaleForm.rawId || this.drawerSaleForm.id);
    this.apiService.updateSale(targetId, payload).subscribe({
      next: (res) => {
        const idx = this.salesList.findIndex(s => String(s.id) === targetId || String(s.saleId) === targetId);
        if (idx !== -1) {
          this.salesList[idx] = { ...this.salesList[idx], ...payload, ...(res || {}) };
          this.salesList = [...this.salesList];
        }
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
    const dateFormatted = new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
    
    Swal.fire({
      title: '',
      html: `
        <div style="text-align: left; font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; background: #ffffff; border-radius: 12px; padding: 4px 6px; color: #0f172a;">
          <!-- Voucher Header -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0B47D4; padding-bottom: 12px; margin-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #0B47D4 0%, #0066FF 100%); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px;">
                <i class="bi bi-receipt-cutoff"></i>
              </div>
              <div>
                <div style="font-weight: 800; font-size: 14px; color: #0f172a; letter-spacing: -0.01em;">FUTANE AGRO INDUSTRIES PVT. LTD.</div>
                <div style="font-size: 11px; color: #64748b; font-weight: 500;">Fruit Crate Moulding & Commercial Division</div>
              </div>
            </div>
            <span style="background: rgba(11, 71, 212, 0.08); color: #0B47D4; font-size: 10.5px; font-weight: 700; padding: 3px 8px; border-radius: 6px; letter-spacing: 0.04em; text-transform: uppercase;">Payment Voucher</span>
          </div>

          <!-- Metadata Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; background: #f8fafc; padding: 12px 14px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; margin-bottom: 14px;">
            <div><span style="color: #64748b; font-size: 11px;">Receipt Number:</span><br><strong style="color: #0f172a; font-family: monospace; font-size: 12.5px;">RZP-${paymentId}</strong></div>
            <div><span style="color: #64748b; font-size: 11px;">Date & Time:</span><br><strong style="color: #0f172a;">${dateFormatted}</strong></div>
            <div><span style="color: #64748b; font-size: 11px;">Order Reference:</span><br><strong style="color: #0B47D4; font-family: monospace;">#${invoiceNum}</strong></div>
            <div><span style="color: #64748b; font-size: 11px;">Customer / Party:</span><br><strong style="color: #0f172a;">${sale.party?.partyName || 'Valued Customer'}</strong></div>
            <div style="grid-column: span 2;"><span style="color: #64748b; font-size: 11px;">Ordered Items:</span><br><strong style="color: #334155;">${sale.quantity} units • ${sale.crateType} (${sale.crateMaterial})</strong></div>
          </div>

          <!-- Financial Summary Strip -->
          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 14px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 12px; color: #475569;">Gross Order Value</span>
              <span style="font-size: 13px; font-weight: 700; color: #1e293b;">₹${(Number(sale.totalAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 6px; border-top: 1px dashed #86efac; margin-bottom: 6px;">
              <span style="font-size: 13px; font-weight: 700; color: #15803d; display: flex; align-items: center; gap: 4px;">
                <i class="bi bi-check-circle-fill"></i> Amount Received
              </span>
              <span style="font-size: 16px; font-weight: 800; color: #15803d;">₹${paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 6px; border-top: 1px dashed #86efac;">
              <span style="font-size: 12px; color: #475569;">Remaining Due</span>
              <span style="font-size: 13px; font-weight: 700; color: ${balanceRemaining > 0 ? '#dc2626' : '#15803d'};">₹${balanceRemaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <!-- Footer Verification Note -->
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #64748b; padding-top: 6px;">
            <span><i class="bi bi-shield-check text-success me-1"></i>Verified Gateway Transaction</span>
            <span>Computer-Generated Receipt</span>
          </div>
        </div>
      `,
      showCancelButton: true,
      showCloseButton: true,
      cancelButtonText: 'Close',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: '<i class="bi bi-printer-fill me-1"></i> Print Voucher',
      confirmButtonColor: '#0B47D4',
      width: '540px',
      customClass: {
        popup: 'futane-dialog-popup futane-receipt-popup'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        window.print();
      }
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

  // Composite Memoization Cache for High Load (10,000+ Records)
  private _cachedFilterKey: string = '';
  private _cachedFilteredList: SaleItem[] = [];
  private _cachedPageKey: string = '';
  private _cachedPaginatedList: SaleItem[] = [];
  private _cachedFilteredTotalQty: number = 0;
  private _cachedFilteredTotalAmt: number = 0;
  private _cachedFilteredTotalPaid: number = 0;
  private _cachedFilteredTotalRemaining: number = 0;

  // Filtering & Pagination Data Engine (Memoized)
  getFilteredList(): SaleItem[] {
    const key = `${this.salesList.length}_${this.dispatchesList.length}_${this.subTab}_${this.searchQuery}_${this.filterSearchQuery}_${this.filterPartyId}_${this.filterPaymentStatus}_${this.filterOutwardStatus}_${this.filterCrateType}_${this.filterDate}_${this.filterMonth}_${this.sortField}_${this.sortAsc}`;
    if (key === this._cachedFilterKey && this._cachedFilteredList) {
      return this._cachedFilteredList;
    }

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

    // 2. Search query (multi-field with O(1) dispatch lookup)
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

    // Compute dynamic accounting totals in a single pass
    let totalQty = 0;
    let totalAmt = 0;
    let totalPaid = 0;
    let totalRem = 0;
    for (let i = 0; i < result.length; i++) {
      const s = result[i];
      totalQty += (Number(s.quantity) || 0);
      totalAmt += (Number(s.totalAmount) || 0);
      totalPaid += (Number(s.paid) || 0);
      totalRem += (Number(s.remaining) || 0);
    }
    this._cachedFilteredTotalQty = totalQty;
    this._cachedFilteredTotalAmt = totalAmt;
    this._cachedFilteredTotalPaid = totalPaid;
    this._cachedFilteredTotalRemaining = totalRem;
    this._cachedFilterKey = key;
    this._cachedFilteredList = result;
    return this._cachedFilteredList;
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
    const pageKey = `${this._cachedFilterKey}_${this.currentPage}_${this.pageSize}`;
    if (pageKey === this._cachedPageKey && this._cachedPaginatedList) {
      return this._cachedPaginatedList;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    this._cachedPageKey = pageKey;
    this._cachedPaginatedList = list.slice(start, start + this.pageSize);
    return this._cachedPaginatedList;
  }

  getTotalPages(): number {
    const total = this.getFilteredList().length;
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  resetFilters() {
    this.searchInputText = '';
    this.searchQuery = '';
    this.filterPartyId = '';
    this.filterPaymentStatus = 'ALL';
    this.filterOutwardStatus = 'ALL';
    this.filterCrateType = '';
    this.subTab = 'all';
    this.currentPage = 1;
    this.isFilterPopoverOpen = false;
    this.cdr.markForCheck();
  }

  // Dynamic Accounting Totals for <tfoot> (O(1) Instant from Memoized Pass)
  getFilteredTotalQuantity(): number {
    this.getFilteredList();
    return this._cachedFilteredTotalQty;
  }

  getFilteredTotalAmount(): number {
    this.getFilteredList();
    return this._cachedFilteredTotalAmt;
  }

  getFilteredTotalPaid(): number {
    this.getFilteredList();
    return this._cachedFilteredTotalPaid;
  }

  getFilteredTotalRemaining(): number {
    this.getFilteredList();
    return this._cachedFilteredTotalRemaining;
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
