import { Component, OnInit, Input, OnChanges, HostListener } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { InrPipe } from '../../../pipes/inr-currency.pipe';
import { IndianDatePipe } from '../../../pipes/indian-date.pipe';
import { QrCodeComponent } from '../../shared/qr-code/qr-code.component';
import { FilterBarComponent } from '../../shared/filter-bar/filter-bar.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { DataFilterService, FilterCriteria } from '../../../services/data-filter.service';
import { NotificationService } from '../../../services/notification.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { ResizableTableDirective } from '../../../directives/resizable-table.directive';
import { SearchableSelectComponent } from '../../shared/searchable-select/searchable-select.component';

/**
 * Unified Commercial Document Generation & Multi-Layout Print Hub.
 *
 * Capabilities:
 * - Centralizes document printing across 7 core enterprise document templates:
 *     1. GST Tax Invoice
 *     2. Commercial Proforma Invoice
 *     3. Goods Delivery Challan
 *     4. Customer Payment Receipt
 *     5. Vendor Purchase Invoice
 *     6. Logistics Transport Receipt
 *     7. Employee Monthly Salary Slip
 * - Dynamic theme customization: Distinct primary, secondary, and accent colors per document type.
 * - Dynamic UPI QR Code generator: Encodes VPA, merchant name, invoice number, and exact payable amount for zero-friction mobile settlement.
 * - Interactive Canvas Zooming (0.50x to 1.25x) with exact 1:1 A4 dimensional print previews.
 * - Vector-accurate PDF generation via jsPDF and HTML5 Canvas capture.
 */
@Component({
  selector: 'app-billing-hub',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TranslatePipe, DecimalPipe,
    AutoSelectDirective, FormStateDirective, InrPipe, IndianDatePipe,
    QrCodeComponent, FilterBarComponent, EmptyStateComponent,
    ResizableTableDirective, SearchableSelectComponent
  ],
  templateUrl: './billing-hub.component.html',
  styleUrls: ['./billing-hub.component.css']
})
export class BillingHubComponent implements OnInit, OnChanges {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'billinghub';
  @Input() loggedInUser: any = null;
  @Input() salesList: any[] = [];
  @Input() dispatchesList: any[] = [];
  @Input() paymentsList: any[] = [];
  @Input() rawMaterialsList: any[] = [];
  @Input() transportsList: any[] = [];
  @Input() salariesList: any[] = [];
  @Input() settingsList: any[] = [];

  activeBillType: string = 'tax_invoice';
  selectedRecordId: string = '';
  selectedRecord: any = null;
  currentDocumentNumber: string = '';
  today: Date = new Date();

  // Smart Filter state for document selection
  filterYear: string = '';
  filterMonth: string = '';
  filterSearch: string = '';
  filterDateFrom: string = '';
  filterDateTo: string = '';

  years: number[] = [];
  months: { name: string; value: string }[] = [
    { name: 'January', value: '01' },
    { name: 'February', value: '02' },
    { name: 'March', value: '03' },
    { name: 'April', value: '04' },
    { name: 'May', value: '05' },
    { name: 'June', value: '06' },
    { name: 'July', value: '07' },
    { name: 'August', value: '08' },
    { name: 'September', value: '09' },
    { name: 'October', value: '10' },
    { name: 'November', value: '11' },
    { name: 'December', value: '12' }
  ];

  // Telemetry & Load State
  isLoading = false;
  hasError = false;
  errorMessage = '';
  isExportingPdf = false;

  // Standardized Enterprise Document Color Themes
  docThemes: { [key: string]: { primary: string; secondary: string; title: string; prefix: string; accent: string } } = {
    tax_invoice: { primary: '#C2410C', secondary: '#FFF7ED', accent: '#EA580C', title: 'TAX INVOICE', prefix: 'FA/24-25/' },
    proforma: { primary: '#1E40AF', secondary: '#EFF6FF', accent: '#2563EB', title: 'PROFORMA INVOICE', prefix: 'FA/PI/24-25/' },
    delivery_challan: { primary: '#15803D', secondary: '#F0FDF4', accent: '#16A34A', title: 'DELIVERY CHALLAN', prefix: 'FA/DC/25-26/' },
    payment_receipt: { primary: '#0F766E', secondary: '#F0FDFA', accent: '#0D9488', title: 'PAYMENT RECEIPT', prefix: 'FA/RP/25-26/' },
    purchase_invoice: { primary: '#4338CA', secondary: '#EEF2FF', accent: '#6366F1', title: 'PURCHASE INVOICE', prefix: 'FA/PUR/25-26/' },
    transport_receipt: { primary: '#9A3412', secondary: '#FFF7ED', accent: '#C2410C', title: 'TRANSPORT RECEIPT', prefix: 'FA/TR/25-26/' },
    salary_slip: { primary: '#0369A1', secondary: '#F0F9FF', accent: '#0284C7', title: 'SALARY SLIP', prefix: 'FA/SAL/25-26/' }
  };

  // Canvas Viewport Zoom Control (default to 0.78 for perfect A4 viewport fit)
  zoomLevel: number = 0.78;

  setZoom(level: number) {
    this.zoomLevel = level;
  }

  // Invoice Print & Layout Designer Model (Dynamic from Settings & Admin)
  invoiceTemplate: any = {
    templateName: 'Standard Tax Invoice',
    invoiceTitle: 'TAX INVOICE',
    invoiceSubtitle: 'Original for Recipient (B2B)',
    termsAndConditions: '1. Goods once sold will not be accepted back or exchanged under any circumstances.\n2. Interest @ 18% p.a. will be charged on delayed payments exceeding credit terms.\n3. Any discrepancies must be reported in writing within 48 hours of delivery.',
    jurisdictionClause: 'Subject to Pune Jurisdiction only',
    signatoryTitle: 'Authorized Signatory',
    showBankDetails: true,
    showUpiQrCode: true,
    showCompanyLogo: true,
    showHsnSummary: true,
    headerNotes: 'Goods supplied for Agricultural & Industrial Material Handling purposes.',
    footerNotes: 'Thank you for partnering with Futane Agro. Quality Crates for a Stronger Future.'
  };

  companyProfiles: any[] = [];
  bankProfiles: any[] = [];

  getItemTaxableAmount(item: any): number {
    if (!item) return 0;
    if (item.quantity && item.rate) {
      return Math.round((item.quantity * item.rate) * 100) / 100;
    }
    if (item.totalAmount) {
      return Math.round((item.totalAmount / 1.18) * 100) / 100;
    }
    return item.amount || 0;
  }

  getItemCgst(item: any): number {
    return Math.round((this.getItemTaxableAmount(item) * 0.09) * 100) / 100;
  }

  getItemSgst(item: any): number {
    return Math.round((this.getItemTaxableAmount(item) * 0.09) * 100) / 100;
  }

  getItemTotal(item: any): number {
    if (!item) return 0;
    if (item.totalAmount) return item.totalAmount;
    const taxable = this.getItemTaxableAmount(item);
    return Math.round((taxable + (taxable * 0.18)) * 100) / 100;
  }

  queuePageSize: number = 40;
  visibleQueueRecords: any[] = [];
  cachedQueueCount: number = 0;
  cachedQueueValue: number = 0;
  cachedQueueTax: number = 0;

  get totalQueueCount(): number {
    return this.cachedQueueCount;
  }

  get totalQueueValue(): number {
    return this.cachedQueueValue;
  }

  get totalQueueTax(): number {
    return this.cachedQueueTax;
  }

  get activeDocTypeTitle(): string {
    return this.currentTheme.title;
  }

  trackByRecordId(index: number, item: any): any {
    return this.getRecordId(item) || index;
  }

  loadMoreQueueRecords() {
    this.queuePageSize += 40;
    this.updateVisibleQueue();
  }

  updateVisibleQueue() {
    this.visibleQueueRecords = (this._cachedHubFilteredRecords || []).slice(0, this.queuePageSize);
  }

  getRecordAmount(item: any): number {
    if (!item) return 0;
    return item.totalAmount || (item.quantity && item.rate ? item.quantity * item.rate : 0) || item.amountReceived || item.amount || item.salaryAmount || 0;
  }

  getRecordPartyName(item: any): string {
    if (!item) return 'Customer';
    return item.party?.partyName || item.partyName || item.customerName || item.sale?.party?.partyName || item.vendor?.vendorName || item.employee?.empName || item.driver?.driverName || item.driverName || 'Customer';
  }

  getRecordRefId(item: any): string {
    if (!item) return 'DOC';
    if (item.saleId) return `INV-${item.saleId}`;
    if (item.referenceNo) return `${item.referenceNo}`;
    if (item.id) {
      const idStr = String(item.id);
      return idStr.length > 8 ? idStr.substring(0, 8).toUpperCase() : idStr.toUpperCase();
    }
    return 'DOC';
  }

  selectRecordItem(item: any) {
    this.selectedRecord = item;
    this.selectedRecordId = String(this.getRecordId(item));
    this.generateDocNumber();
  }

  isItemSelected(item: any): boolean {
    if (!item) return false;
    if (this.selectedRecord === item) return true;
    return String(this.getRecordId(item)) === String(this.selectedRecordId);
  }

  constructor(
    private apiService: ApiService,
    private filterService: DataFilterService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.extractAvailableYears();
    this.loadAllSources();
  }

  ngOnChanges() {
    this.extractAvailableYears();
    if (!this.selectedRecord) {
      this.autoSelectFirst();
    }
  }

  extractAvailableYears() {
    const yearSet = new Set<number>();
    const currentYear = new Date().getFullYear();
    yearSet.add(currentYear);
    yearSet.add(currentYear - 1);
    yearSet.add(currentYear - 2);

    const checkAndAdd = (dateStr: any) => {
      if (!dateStr) return;
      const str = String(dateStr).trim();
      const match = str.match(/^(\d{4})/);
      if (match) {
        const y = parseInt(match[1], 10);
        if (y >= 2000 && y <= 2100) yearSet.add(y);
      }
    };

    (this.salesList || []).forEach(s => checkAndAdd(s.date));
    (this.dispatchesList || []).forEach(d => checkAndAdd(d.dispatchDate || d.date));
    (this.paymentsList || []).forEach(p => checkAndAdd(p.paymentDate || p.date));
    (this.rawMaterialsList || []).forEach(rm => checkAndAdd(rm.inwardDate || rm.date));
    (this.transportsList || []).forEach(tr => checkAndAdd(tr.transportDate || tr.date));
    (this.salariesList || []).forEach(sal => {
      if (sal.year) yearSet.add(parseInt(String(sal.year), 10));
      checkAndAdd(sal.disbursementDate || sal.date);
    });

    this.years = Array.from(yearSet).sort((a, b) => b - a);
  }

  loadAllSources(isManual: boolean = false) {
    if ((!this.salesList || this.salesList.length === 0) && (!this.dispatchesList || this.dispatchesList.length === 0)) {
      this.isLoading = true;
    }
    this.hasError = false;
    this.errorMessage = '';

    if (!this.salesList || this.salesList.length === 0 || isManual) {
      this.apiService.getSales().subscribe({
        next: res => { 
          if (res) { 
            this.salesList = res; 
            this.extractAvailableYears();
            this.autoSelectFirst(); 
          } 
        },
        error: (err) => { 
          console.warn('BillingHub: sales error', err);
          if (this.activeBillType === 'tax_invoice' || this.activeBillType === 'proforma') {
            this.hasError = true;
          }
        }
      });
    }
    if (!this.dispatchesList || this.dispatchesList.length === 0 || isManual) {
      this.apiService.getDispatches().subscribe({
        next: res => { 
          if (res) { 
            this.dispatchesList = res; 
            this.extractAvailableYears();
          } 
        },
        error: (err) => { 
          console.warn('BillingHub: dispatches error', err);
          if (this.activeBillType === 'challan') {
            this.hasError = true;
          }
        }
      });
    }
    if (!this.paymentsList || this.paymentsList.length === 0 || isManual) {
      this.apiService.getPayments().subscribe({
        next: res => { 
          if (res) { 
            this.paymentsList = res; 
            this.extractAvailableYears();
          } 
        },
        error: (err) => { 
          console.warn('BillingHub: payments error', err);
          if (this.activeBillType === 'receipt') {
            this.hasError = true;
          }
        }
      });
    }
    if (!this.rawMaterialsList || this.rawMaterialsList.length === 0 || isManual) {
      this.apiService.getRawMaterials().subscribe({
        next: res => { 
          if (res) { 
            this.rawMaterialsList = res; 
            this.extractAvailableYears();
          } 
        },
        error: (err) => { 
          console.warn('BillingHub: raw-materials error', err);
          if (this.activeBillType === 'purchase_invoice') {
            this.hasError = true;
          }
        }
      });
    }
    if (!this.transportsList || this.transportsList.length === 0 || isManual) {
      this.apiService.getTransports().subscribe({
        next: res => { 
          if (res) { 
            this.transportsList = res; 
            this.extractAvailableYears();
          } 
        },
        error: (err) => { 
          console.warn('BillingHub: transports error', err);
          if (this.activeBillType === 'transport') {
            this.hasError = true;
          }
        }
      });
    }
    if (!this.salariesList || this.salariesList.length === 0 || isManual) {
      this.apiService.getSalaries().subscribe({
        next: res => { 
          if (res) { 
            this.salariesList = res; 
            this.extractAvailableYears();
          } 
        },
        error: (err) => { 
          console.warn('BillingHub: salaries error', err);
          if (this.activeBillType === 'salary_slip') {
            this.hasError = true;
          }
        }
      });
    }

    // Dynamic Invoice Template, Company Profiles & Bank Coordinates from Settings & Admin
    try {
      const cached = localStorage.getItem('futane_invoice_template_config');
      if (cached) {
        this.invoiceTemplate = { ...this.invoiceTemplate, ...JSON.parse(cached) };
      }
    } catch (e) {}

    this.apiService.getInvoiceTemplateConfig().subscribe({
      next: (cfg) => {
        if (cfg) {
          this.invoiceTemplate = { ...this.invoiceTemplate, ...cfg };
          try {
            localStorage.setItem('futane_invoice_template_config', JSON.stringify(this.invoiceTemplate));
          } catch (e) {}
        }
      },
      error: () => {}
    });

    this.apiService.getCompanyProfiles().subscribe({
      next: (res) => {
        if (Array.isArray(res) && res.length > 0) {
          this.companyProfiles = res;
        }
      },
      error: () => {}
    });

    this.apiService.getBankProfiles().subscribe({
      next: (res) => {
        if (Array.isArray(res) && res.length > 0) {
          this.bankProfiles = res;
        }
      },
      error: () => {}
    });

    setTimeout(() => {
      this.isLoading = false;
      this.autoSelectFirst();
      if (isManual) {
        if (this.hasError) {
          this.notificationService.error('Sync Incomplete', 'Could not retrieve some document records.');
        } else {
          this.notificationService.success('Documents Refreshed', 'Billing Hub records synchronized.');
        }
      }
    }, 600);
  }

  @HostListener('window:storage', ['$event'])
  onStorageChange(event: StorageEvent) {
    if (event.key === 'futane_invoice_template_config' && event.newValue) {
      try {
        this.invoiceTemplate = { ...this.invoiceTemplate, ...JSON.parse(event.newValue) };
      } catch (e) {}
    }
  }

  @HostListener('window:futane-invoice-template-updated', ['$event'])
  onTemplateUpdated(event: any) {
    if (event.detail) {
      this.invoiceTemplate = { ...this.invoiceTemplate, ...event.detail };
    }
  }

  get currentTheme() {
    return this.docThemes[this.activeBillType] || this.docThemes['tax_invoice'];
  }

  onBillTypeChange() {
    this.selectedRecordId = '';
    this.selectedRecord = null;
    this.autoSelectFirst();
  }

  onRecordSelectChange() {
    const list = this.getFilteredRecords();
    this.selectedRecord = list.find((item: any) => String(this.getRecordId(item)) === String(this.selectedRecordId)) || null;
    if (this.selectedRecord) {
      this.generateDocNumber();
    }
  }

  onFilterCriteriaChange() {
    const filtered = this.getFilteredRecords();
    const currentStillMatches = filtered.some((item: any) => String(this.getRecordId(item)) === String(this.selectedRecordId));
    if (!currentStillMatches) {
      if (filtered.length > 0) {
        this.selectedRecord = filtered[0];
        this.selectedRecordId = String(this.getRecordId(this.selectedRecord));
        this.generateDocNumber();
      } else {
        this.selectedRecord = null;
        this.selectedRecordId = '';
      }
    }
  }

  resetFilters() {
    this.filterYear = '';
    this.filterMonth = '';
    this.filterSearch = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.onFilterCriteriaChange();
  }

  autoSelectFirst() {
    const list = this.getFilteredRecords();
    if (list && list.length > 0) {
      this.selectedRecord = list[0];
      this.selectedRecordId = String(this.getRecordId(this.selectedRecord));
      this.generateDocNumber();
    } else {
      this.selectedRecord = null;
      this.selectedRecordId = '';
    }
  }

  getCurrentSourceList(): any[] {
    switch (this.activeBillType) {
      case 'tax_invoice':
      case 'proforma':
        return this.salesList || [];
      case 'delivery_challan':
        return this.dispatchesList || [];
      case 'payment_receipt':
        return this.paymentsList || [];
      case 'purchase_invoice':
        return this.rawMaterialsList || [];
      case 'transport_receipt':
        return this.transportsList || [];
      case 'salary_slip':
        return this.salariesList || [];
      default:
        return [];
    }
  }

  // Memoization Cache for High Load (10,000+ Records)
  private _cachedHubFilterKey: string = '';
  private _cachedHubFilteredRecords: any[] = [];
  private _cachedHubSelectableRecords: any[] = [];

  getFilteredRecords(): any[] {
    const source = this.getCurrentSourceList();
    if (!source || source.length === 0) {
      this._cachedHubFilteredRecords = [];
      this._cachedHubSelectableRecords = [];
      return [];
    }

    const key = `${source.length}_${this.activeBillType}_${this.filterYear}_${this.filterMonth}_${this.filterDateFrom}_${this.filterDateTo}_${this.filterSearch}`;
    if (key === this._cachedHubFilterKey && this._cachedHubFilteredRecords) {
      return this._cachedHubFilteredRecords;
    }

    const filtered = source.filter((item: any) => {
      const recDate = this.getRecordDateString(item);
      const recYear = this.getRecordYear(item, recDate);
      const recMonth = this.getRecordMonth(item, recDate);

      // Filter by Year
      if (this.filterYear) {
        if (recYear !== this.filterYear) return false;
      }

      // Filter by Month
      if (this.filterMonth) {
        if (recMonth !== this.filterMonth) return false;
      }

      // Filter by Date Range From
      if (this.filterDateFrom && recDate) {
        if (recDate < this.filterDateFrom) return false;
      }

      // Filter by Date Range To
      if (this.filterDateTo && recDate) {
        if (recDate > this.filterDateTo) return false;
      }

      // Filter by Search Query
      if (this.filterSearch && this.filterSearch.trim()) {
        const query = this.filterSearch.toLowerCase().trim();
        const searchPool = [
          item.party?.partyName,
          item.sale?.party?.partyName,
          item.vendor?.vendorName,
          item.employee?.empName,
          item.driver?.driverName,
          item.driverName,
          item.vehicleNumber,
          item.truckNumber,
          item.materialName,
          item.crateType,
          item.sale?.crateType,
          item.referenceNo,
          item.remarks,
          item.deliveryAddress,
          item.id,
          item.saleId,
          item.rawMaterialId,
          item.paymentId
        ].filter(Boolean).join(' ').toLowerCase();

        if (!searchPool.includes(query)) return false;
      }

      return true;
    });

    this._cachedHubFilterKey = key;
    this._cachedHubFilteredRecords = filtered;
    this._cachedHubSelectableRecords = filtered.map(item => ({
      id: String(this.getRecordId(item)),
      label: this.getRecordLabel(item),
      subLabel: this.getRecordDateString(item)
    }));

    this.cachedQueueCount = filtered.length;
    let sum = 0;
    for (let i = 0; i < filtered.length; i++) {
      sum += this.getRecordAmount(filtered[i]);
    }
    this.cachedQueueValue = Math.round(sum * 100) / 100;
    this.cachedQueueTax = (this.activeBillType === 'tax_invoice' || this.activeBillType === 'purchase_invoice')
      ? Math.round((sum * 0.18) * 100) / 100
      : 0;

    this.updateVisibleQueue();
    return this._cachedHubFilteredRecords;
  }

  getRecordDateString(item: any): string {
    if (!item) return '';
    return item.date || item.dispatchDate || item.paymentDate || item.inwardDate || item.transportDate || item.disbursementDate || '';
  }

  private getRecordYear(item: any, dateStr: string): string {
    if (this.activeBillType === 'salary_slip' && item.year) {
      return String(item.year);
    }
    if (dateStr && dateStr.length >= 4) {
      return dateStr.substring(0, 4);
    }
    return '';
  }

  private getRecordMonth(item: any, dateStr: string): string {
    if (this.activeBillType === 'salary_slip' && item.month) {
      const m = String(item.month).trim();
      if (!isNaN(Number(m))) {
        return m.padStart(2, '0');
      }
      // Month name match
      const found = this.months.find(mon => mon.name.toLowerCase() === m.toLowerCase());
      if (found) return found.value;
    }
    if (dateStr && dateStr.length >= 7) {
      return dateStr.substring(5, 7);
    }
    return '';
  }

  getRecordId(rec: any): string {
    return rec?.id || rec?.saleId || rec?.paymentId || rec?.rawMaterialId || rec?.empId || '';
  }

  getRecordLabel(item: any): string {
    if (!item) return '';
    switch (this.activeBillType) {
      case 'tax_invoice':
      case 'proforma':
        return `${item.party?.partyName || 'Customer'} — Qty: ${item.quantity || 0} Crates (₹${(item.totalAmount || 0).toLocaleString('en-IN')}) — ${item.date || ''}`;
      case 'delivery_challan':
        return `${item.sale?.party?.partyName || 'Customer'} — Vehicle: ${item.vehicleNumber || 'N/A'} (Qty: ${item.sale?.quantity || 0}) — ${item.dispatchDate || ''}`;
      case 'payment_receipt':
        return `${item.party?.partyName || 'Customer'} — Received: ₹${(item.amountReceived || 0).toLocaleString('en-IN')} (${item.paymentDate || ''})`;
      case 'purchase_invoice':
        return `${item.vendor?.vendorName || 'Vendor'} — ${item.materialName || 'Raw Material'} (₹${(item.amount || 0).toLocaleString('en-IN')}) — ${item.inwardDate || ''}`;
      case 'transport_receipt':
        return `${item.truckNumber || 'Vehicle'} — Driver: ${item.driver?.driverName || 'N/A'} (Rent: ₹${(item.rent || 0).toLocaleString('en-IN')}) — ${item.transportDate || item.date || ''}`;
      case 'salary_slip':
        return `${item.employee?.empName || 'Employee'} — ${item.month}/${item.year} (₹${(item.salaryAmount || 0).toLocaleString('en-IN')})`;
      default:
        return item.id || 'Record';
    }
  }

  get selectableRecords(): any[] {
    this.getFilteredRecords();
    return this._cachedHubSelectableRecords;
  }

  getMatchCountText(): string {
    const count = this.getFilteredRecords().length;
    const total = this.getCurrentSourceList().length;
    const typeTitle = this.currentTheme.title;
    
    let filterDesc = '';
    if (this.filterMonth) {
      const mObj = this.months.find(m => m.value === this.filterMonth);
      filterDesc += ` for ${mObj ? mObj.name : this.filterMonth}`;
    }
    if (this.filterYear) {
      filterDesc += ` ${this.filterYear}`;
    }
    if (this.filterSearch) {
      filterDesc += ` matching "${this.filterSearch}"`;
    }

    return `Found ${count} ${typeTitle.toLowerCase()} record(s)${filterDesc} (out of ${total} total)`;
  }

  generateDocNumber() {
    const seq = Math.floor(1000 + Math.random() * 9000);
    this.currentDocumentNumber = `${this.currentTheme.prefix}${seq}`;
  }

  get upiQrString(): string {
    const amount = this.getTotalPayableAmount();
    const upiId = this.bankProfiles[0]?.upiId || 'futaneagro@okhdfcbank';
    const name = encodeURIComponent(this.companyProfiles[0]?.companyName || 'Futane Agro Industries');
    const note = encodeURIComponent(`Invoice_${this.currentDocumentNumber}`);
    return `upi://pay?pa=${upiId}&pn=${name}&am=${amount.toFixed(2)}&tn=${note}&cu=INR`;
  }

  getTotalPayableAmount(): number {
    if (!this.selectedRecord) return 0;
    if (this.activeBillType === 'tax_invoice') {
      return this.getItemTotal(this.selectedRecord);
    }
    if (this.activeBillType === 'purchase_invoice') {
      const base = this.selectedRecord.amount || (this.selectedRecord.weight * this.selectedRecord.rate) || 0;
      return Math.round((base * 1.18) * 100) / 100;
    }
    return this.selectedRecord.totalAmount || this.selectedRecord.amountReceived || this.selectedRecord.amount || this.selectedRecord.salaryAmount || (this.selectedRecord.quantity * this.selectedRecord.rate) || 0;
  }

  amountInWords(amount: number): string {
    if (!amount || isNaN(amount)) return 'Zero Rupees Only';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const numToWords = (n: number): string => {
      if (n === 0) return '';
      if (n < 20) return ones[n] + ' ';
      if (n < 100) return tens[Math.floor(n / 10)] + ' ' + ones[n % 10] + ' ';
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + numToWords(n % 100);
      if (n < 100000) return numToWords(Math.floor(n / 1000)) + 'Thousand ' + numToWords(n % 1000);
      if (n < 10000000) return numToWords(Math.floor(n / 100000)) + 'Lakh ' + numToWords(n % 100000);
      return numToWords(Math.floor(n / 10000000)) + 'Crore ' + numToWords(n % 10000000);
    };

    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);
    let str = numToWords(rupees).trim() + ' Rupees';
    if (paise > 0) str += ' and ' + numToWords(paise).trim() + ' Paise';
    return str + ' Only';
  }

  printDocument() {
    window.print();
  }

  async downloadPDF() {
    const el = document.getElementById('printable-document-sheet');
    if (!el) return;
    this.isExportingPdf = true;
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${this.activeBillType}_${this.currentDocumentNumber.replace(/\//g, '-')}.pdf`);
      this.notificationService.success('PDF Exported', `Generated ${this.currentTheme.title} successfully.`);
    } catch (err) {
      console.error('PDF Export failed', err);
      this.notificationService.error('Export Failed', 'Could not generate PDF document. Please try printing directly.');
    } finally {
      this.isExportingPdf = false;
    }
  }
}
