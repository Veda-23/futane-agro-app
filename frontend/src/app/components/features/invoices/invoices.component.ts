import { Component, OnInit, Input, HostListener } from '@angular/core';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';

import { ResizableTableDirective } from '../../../directives/resizable-table.directive';
import { IndianDatePipe } from '../../../pipes/indian-date.pipe';
import { NotificationService } from '../../../services/notification.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { SearchableSelectComponent } from '../../shared/searchable-select/searchable-select.component';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    AutoSelectDirective,
    ResizableTableDirective,
    IndianDatePipe,
    EmptyStateComponent,
    SearchableSelectComponent
  ],
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.css']
})
// Standardized Invoices Component per reference master
export class InvoicesComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'invoices';
  @Input() loggedInUser: any = null;
  @Input() parties: any[] = [];

  invoicesList: any[] = [];
  selectedInvoice: any = null;
  Math = Math;

  // Subtabs status filter
  activeSubtab: 'all' | 'paid' | 'partial' | 'unpaid' | 'high_value' = 'all';

  // Pagination & Sort
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50];
  sortField = 'id';
  sortAsc = false;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  // Filter state
  filterSearchQuery = '';
  filterDate = '';
  filterMinAmount: number | null = null;
  filterMaxAmount: number | null = null;
  filterPartyId = '';
  filterPaymentStatus = 'all';

  tableDensity: 'compact' | 'comfortable' | 'spacious' = 'comfortable';
  defaultColumns = [
    'ID',
    'Invoice No',
    'Date',
    'Party',
    'Description',
    'Taxable Val',
    'GST 18%',
    'Total Bill',
    'Status',
    'Actions'
  ];

  // Telemetry & Load State
  isLoading = false;
  hasError = false;
  errorMessage = '';
  isPdfGenerating = false;

  // Create Invoice Drawer State
  isCreateDrawerOpen = false;
  isSubmitting = false;

  crateOptions = [
    'Jumbo Perforated Crate (600x400x325mm)',
    'Standard Fruit Crate (500x325x250mm)',
    'Dairy Milk Pouch Crate (12-Pocket)',
    'Agro Harvest Vented Tray (540x360x290mm)',
    'Multi-Utility Industrial Crate (Heavy Duty)'
  ];

  materialOptions = [
    'Virgin HDPE (Food Grade)',
    'Virgin HDPE (UV Stabilized)',
    'Polypropylene Copolymer (PPCP)',
    'Recycled HDPE Heavy-Duty'
  ];

  newInvoice: {
    partyId: string;
    crateType: string;
    crateMaterial: string;
    quantity: number;
    rate: number;
    paid: number;
    invoiceDate: string;
    notes: string;
  } = {
    partyId: '',
    crateType: 'Jumbo Perforated Crate (600x400x325mm)',
    crateMaterial: 'Virgin HDPE (Food Grade)',
    quantity: 100,
    rate: 350,
    paid: 0,
    invoiceDate: new Date().toISOString().slice(0, 10),
    notes: ''
  };

  selectedPartyDetails: any = null;

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    const saved = localStorage.getItem('futane_table_density');
    if (saved === 'compact' || saved === 'comfortable' || saved === 'spacious') {
      this.tableDensity = saved;
    }
    this.loadData();
    this.loadPartiesIfEmpty();

    this.columnsVisibility['invoices'] = {};
    this.defaultColumns.forEach(col => {
      this.columnsVisibility['invoices'][col] = true;
    });
  }

  loadPartiesIfEmpty() {
    if (!this.parties || this.parties.length === 0) {
      this.apiService.getParties().subscribe({
        next: (res: any[]) => {
          if (res && res.length > 0) {
            this.parties = res;
          }
        },
        error: () => {}
      });
    }
  }

  setDensity(d: 'compact' | 'comfortable' | 'spacious') {
    this.tableDensity = d;
    localStorage.setItem('futane_table_density', d);
    document.body.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
    document.body.classList.add('density-' + d);
  }

  loadData(isManual: boolean = false) {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    this.apiService.getInvoices().subscribe({
      next: (res: any[]) => {
        this.isLoading = false;
        this.hasError = false;
        this.invoicesList = res || [];
        this.tableFilteredCounts['invoices'] = (res || []).length;
        if (isManual) {
          this.notificationService.success('Invoices Synced', `Loaded ${this.invoicesList.length} invoice records from ledger.`);
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = 'Failed to retrieve invoice ledger records from server. Check network connection or database health.';
        this.notificationService.error('Load Failed', 'Unable to retrieve invoice registry records.');
      }
    });
  }

  // ── Subtabs Filtering ────────────────────────────────────────────────────────
  setSubtab(tab: 'all' | 'paid' | 'partial' | 'unpaid' | 'high_value') {
    this.activeSubtab = tab;
    this.currentPage = 1;
  }

  getCountBySubtab(tab: 'all' | 'paid' | 'partial' | 'unpaid' | 'high_value'): number {
    if (!this.invoicesList) return 0;
    if (tab === 'all') return this.invoicesList.length;
    if (tab === 'paid') return this.invoicesList.filter(i => (i.sale?.remaining ?? 0) === 0).length;
    if (tab === 'partial') return this.invoicesList.filter(i => (i.sale?.remaining ?? 0) > 0 && (i.sale?.remaining ?? 0) < (i.sale?.totalAmount ?? 0)).length;
    if (tab === 'unpaid') return this.invoicesList.filter(i => (i.sale?.remaining ?? 0) >= (i.sale?.totalAmount ?? 0) && (i.sale?.remaining ?? 0) > 0).length;
    if (tab === 'high_value') return this.invoicesList.filter(i => (i.sale?.totalAmount ?? 0) >= 50000).length;
    return 0;
  }

  filterByKpi(type: 'all' | 'paid' | 'pending') {
    if (type === 'all') this.setSubtab('all');
    else if (type === 'paid') this.setSubtab('paid');
    else if (type === 'pending') this.setSubtab('partial');
  }

  clearFilters() {
    this.filterSearchQuery = '';
    this.filterDate = '';
    this.filterMinAmount = null;
    this.filterMaxAmount = null;
    this.filterPartyId = '';
    this.filterPaymentStatus = 'all';
    this.activeSubtab = 'all';
    this.currentPage = 1;
  }

  // ── KPI & Tax Helpers ────────────────────────────────────────────────────────
  formatDate(d: any): string {
    if (!d) return '—';
    if (Array.isArray(d)) {
      const [y, m, day] = d;
      const dateObj = new Date(y, m - 1, day);
      return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    if (typeof d === 'string' || typeof d === 'number' || d instanceof Date) {
      const dateObj = new Date(d);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }
    return String(d);
  }

  getTotalInvoiceAmount(): number {
    return this.invoicesList.reduce((s, i) => s + (i.sale?.totalAmount || 0), 0);
  }

  getTotalInvoicePaid(): number {
    return this.invoicesList.reduce((s, i) => s + (i.sale?.paid || 0), 0);
  }

  getTotalInvoicePending(): number {
    return this.invoicesList.reduce((s, i) => s + (i.sale?.remaining || 0), 0);
  }

  getTotalTaxableAmount(): number {
    return this.invoicesList.reduce((s, i) => s + ((i.sale?.quantity || 0) * (i.sale?.rate || 0)), 0);
  }

  getTotalTaxAmount(): number {
    return this.invoicesList.reduce((s, i) => s + ((i.sale?.cgst || 0) + (i.sale?.sgst || 0)), 0);
  }

  getTaxableAmount(inv: any): number {
    if (!inv?.sale) return 0;
    return (inv.sale.quantity || 0) * (inv.sale.rate || 0);
  }

  getGstAmount(inv: any): number {
    if (!inv?.sale) return 0;
    return (inv.sale.cgst || 0) + (inv.sale.sgst || 0);
  }

  // ── Modal & Printing ──────────────────────────────────────────────────────────
  viewInvoice(inv: any) {
    this.selectedInvoice = inv;
  }

  closeInvoiceModal() {
    this.selectedInvoice = null;
  }

  closeInvoiceModalOnBackdrop(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('invoice-modal-overlay')) {
      this.closeInvoiceModal();
    }
  }

  printInvoice(inv: any) {
    this.selectedInvoice = inv;
    setTimeout(() => {
      window.print();
    }, 300);
  }

  printCurrentInvoice() {
    window.print();
  }

  printRegistry() {
    window.print();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.selectedInvoice) this.closeInvoiceModal();
    if (this.isCreateDrawerOpen) this.closeCreateDrawer();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!(event.target as HTMLElement).closest('.column-visibility-dropdown')) {
      Object.keys(this.showColDropdown).forEach(k => this.showColDropdown[k] = false);
    }
  }

  // ── PDF Download (opens modal first, then captures DOM) ─────────────────────
  downloadPDFInvoice(inv: any) {
    this.selectedInvoice = inv;
    this.logAudit('Downloaded PDF Invoice: ' + inv.invoiceNo);
    setTimeout(() => {
      const element = document.querySelector('.invoice-bill-content') as HTMLElement;
      if (!element) { this.generateInvoicePDFFallback(inv); return; }
      Swal.fire({ title: 'Generating PDF...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });
      html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgW = 210, pageH = 297;
        const imgH = (canvas.height * imgW) / canvas.width;
        let leftH = imgH, pos = 0;
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, pos, imgW, imgH);
        leftH -= pageH;
        while (leftH >= 0) { pos = leftH - imgH; pdf.addPage(); pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, pos, imgW, imgH); leftH -= pageH; }
        pdf.save(`invoice_${inv.invoiceNo}.pdf`);
        Swal.close();
      }).catch(() => {
        Swal.close();
        this.generateInvoicePDFFallback(inv);
      });
    }, 250);
  }

  private generateInvoicePDFFallback(inv: any) {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
    doc.text('FUTANE AGRO INDUSTRIES PVT. LTD.', 105, 20, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('Manufacturers of High-Quality Plastic Crates & Containers', 105, 26, { align: 'center' });
    doc.text('Factory: Gate No 144, Hadapsar Industrial Area, Pune - 411028', 105, 31, { align: 'center' });
    doc.line(15, 36, 195, 36);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE DETAILS', 15, 45); doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: ${inv.invoiceNo}`, 15, 52);
    doc.text(`Invoice Date: ${inv.createdDate}`, 15, 58);
    doc.setFont('helvetica', 'bold'); doc.text('BILLED TO:', 115, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${inv.sale?.party?.partyName}`, 115, 52);
    doc.text(`GSTIN: ${inv.sale?.party?.gstNumber || 'N/A'}`, 115, 58);
    doc.line(15, 72, 195, 72);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 20, 80); doc.text('Qty', 105, 80); doc.text('Rate', 135, 80); doc.text('Total', 165, 80);
    doc.line(15, 84, 195, 84);
    doc.setFont('helvetica', 'normal');
    doc.text(`${inv.sale?.crateType}`, 20, 92);
    doc.text(`${inv.sale?.quantity}`, 105, 92);
    doc.text(`${inv.sale?.rate?.toFixed(2)}`, 135, 92);
    doc.text(`${inv.sale?.totalAmount?.toFixed(2)}`, 165, 92);
    doc.line(15, 98, 195, 98);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total: INR ${inv.sale?.totalAmount?.toFixed(2)}`, 115, 110);
    doc.text(`Balance Due: INR ${inv.sale?.remaining?.toFixed(2)}`, 115, 117);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your business! Computer-generated tax invoice.', 105, 140, { align: 'center' });
    doc.save(`${inv.invoiceNo}.pdf`);
  }

  // ── Create Invoice Slide-Over Drawer Methods ──────────────────────────────
  openCreateDrawer() {
    this.newInvoice = {
      partyId: this.parties && this.parties.length > 0 ? String(this.parties[0].id) : '',
      crateType: 'Jumbo Perforated Crate (600x400x325mm)',
      crateMaterial: 'Virgin HDPE (Food Grade)',
      quantity: 100,
      rate: 350,
      paid: 0,
      invoiceDate: new Date().toISOString().slice(0, 10),
      notes: ''
    };
    this.onPartySelectChange();
    this.isCreateDrawerOpen = true;
  }

  closeCreateDrawer() {
    this.isCreateDrawerOpen = false;
  }

  onPartySelectChange() {
    if (!this.newInvoice.partyId) {
      this.selectedPartyDetails = null;
      return;
    }
    this.selectedPartyDetails = this.parties.find(p => String(p.id) === String(this.newInvoice.partyId)) || null;
  }

  getNewInvoiceSubtotal(): number {
    return (Number(this.newInvoice.quantity) || 0) * (Number(this.newInvoice.rate) || 0);
  }

  getNewInvoiceCgst(): number {
    return this.getNewInvoiceSubtotal() * 0.09;
  }

  getNewInvoiceSgst(): number {
    return this.getNewInvoiceSubtotal() * 0.09;
  }

  getNewInvoiceTotalTax(): number {
    return this.getNewInvoiceCgst() + this.getNewInvoiceSgst();
  }

  getNewInvoiceTotal(): number {
    return this.getNewInvoiceSubtotal() + this.getNewInvoiceTotalTax();
  }

  getNewInvoiceBalance(): number {
    const paid = Number(this.newInvoice.paid) || 0;
    return Math.max(0, this.getNewInvoiceTotal() - paid);
  }

  getPreviewInvoiceNumber(): string {
    const dt = (this.newInvoice.invoiceDate || '2026-03-10').replace(/-/g, '');
    return `INV-${dt}-NEW`;
  }

  submitCreateInvoice() {
    if (!this.newInvoice.partyId) {
      this.notificationService.warning('Validation Warning', 'Please select a customer/party for this invoice.');
      return;
    }
    if (!this.newInvoice.quantity || this.newInvoice.quantity <= 0) {
      this.notificationService.warning('Validation Warning', 'Quantity must be greater than zero.');
      return;
    }
    if (!this.newInvoice.rate || this.newInvoice.rate <= 0) {
      this.notificationService.warning('Validation Warning', 'Rate per unit must be greater than zero.');
      return;
    }

    this.isSubmitting = true;

    const subtotal = this.getNewInvoiceSubtotal();
    const cgst = this.getNewInvoiceCgst();
    const sgst = this.getNewInvoiceSgst();
    const totalAmount = this.getNewInvoiceTotal();
    const paid = Math.min(Number(this.newInvoice.paid) || 0, totalAmount);
    const remaining = Math.max(0, totalAmount - paid);

    const payload = {
      party: { id: this.newInvoice.partyId },
      crateType: this.newInvoice.crateType,
      crateMaterial: this.newInvoice.crateMaterial,
      quantity: this.newInvoice.quantity,
      rate: this.newInvoice.rate,
      cgst: cgst,
      sgst: sgst,
      totalAmount: totalAmount,
      paid: paid,
      remaining: remaining,
      date: this.newInvoice.invoiceDate
    };

    this.apiService.createSale(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.closeCreateDrawer();
        this.notificationService.success('Tax Invoice Created', `Invoice generated successfully for ${this.selectedPartyDetails?.partyName || 'Party'}.`);
        this.logAudit(`Generated Tax Invoice for party ID: ${this.newInvoice.partyId} totaling ₹${totalAmount.toFixed(2)}`);
        this.loadData(false);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        const msg = err.error?.message || err.message || 'Server error while generating invoice';
        this.notificationService.error('Invoice Creation Failed', msg);
      }
    });
  }

  // ── Export CSV ────────────────────────────────────────────────────────────────
  exportTableCSV(table: string) {
    const list = this.getProcessedList(this.invoicesList, table, true);
    const headers = [
      'Invoice No',
      'Date',
      'Party Name',
      'Party GSTIN',
      'Description',
      'Quantity',
      'Rate (INR)',
      'Taxable Subtotal (INR)',
      'CGST 9% (INR)',
      'SGST 9% (INR)',
      'Total GST 18% (INR)',
      'Grand Total (INR)',
      'Amount Paid (INR)',
      'Balance Due (INR)',
      'Payment Status'
    ];
    const rows = list.map(inv => {
      const taxable = (inv.sale?.quantity || 0) * (inv.sale?.rate || 0);
      const cgst = inv.sale?.cgst || 0;
      const sgst = inv.sale?.sgst || 0;
      const totalTax = cgst + sgst;
      const status = inv.sale?.remaining === 0 ? 'Paid' : (inv.sale?.remaining || 0) >= (inv.sale?.totalAmount || 0) ? 'Unpaid' : 'Partial';
      return [
        inv.invoiceNo,
        inv.createdDate || inv.date,
        inv.sale?.party?.partyName,
        inv.sale?.party?.gstNumber || 'N/A',
        inv.sale?.crateType,
        inv.sale?.quantity,
        inv.sale?.rate,
        taxable.toFixed(2),
        cgst.toFixed(2),
        sgst.toFixed(2),
        totalTax.toFixed(2),
        inv.sale?.totalAmount?.toFixed(2),
        inv.sale?.paid?.toFixed(2),
        inv.sale?.remaining?.toFixed(2),
        status
      ];
    });
    const csv = [headers, ...rows].map(r => r.map((v: any) => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `GST_Invoices_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    this.logAudit('Exported GST Invoices CSV Ledger');
  }

  // ── Column & Page Management ──────────────────────────────────────────────────
  toggleColDropdown(table: string) {
    this.showColDropdown[table] = !this.showColDropdown[table];
  }

  getTableColumns(table: string): string[] {
    return this.defaultColumns;
  }

  isColumnVisible(table: string, col: string): boolean {
    return this.columnsVisibility[table] ? (this.columnsVisibility[table][col] !== false) : true;
  }

  toggleColumn(table: string, col: string) {
    if (this.columnsVisibility[table]) {
      this.columnsVisibility[table][col] = !this.columnsVisibility[table][col];
    }
  }

  setPageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  setSort(field: string) {
    this.sortField === field ? (this.sortAsc = !this.sortAsc) : (this.sortField = field, this.sortAsc = true);
  }

  getProcessedList(list: any[], table: string, allRecords = false): any[] {
    if (!list) return [];
    let result = [...list];

    // 1. Subtab filtering
    if (this.activeSubtab === 'paid') {
      result = result.filter(inv => (inv.sale?.remaining ?? 0) === 0);
    } else if (this.activeSubtab === 'partial') {
      result = result.filter(inv => (inv.sale?.remaining ?? 0) > 0 && (inv.sale?.remaining ?? 0) < (inv.sale?.totalAmount ?? 0));
    } else if (this.activeSubtab === 'unpaid') {
      result = result.filter(inv => (inv.sale?.remaining ?? 0) >= (inv.sale?.totalAmount ?? 0) && (inv.sale?.remaining ?? 0) > 0);
    } else if (this.activeSubtab === 'high_value') {
      result = result.filter(inv => (inv.sale?.totalAmount ?? 0) >= 50000);
    }

    // 2. Search filtering
    if (this.filterSearchQuery) {
      const q = this.filterSearchQuery.toLowerCase().trim();
      result = result.filter(inv =>
        inv.invoiceNo?.toLowerCase().includes(q) ||
        inv.sale?.party?.partyName?.toLowerCase().includes(q) ||
        inv.sale?.party?.gstNumber?.toLowerCase().includes(q) ||
        inv.sale?.crateType?.toLowerCase().includes(q) ||
        String(inv.id).includes(q)
      );
    }

    // 3. Date filtering
    if (this.filterDate) {
      result = result.filter(inv => {
        const d = inv.createdDate || inv.date;
        return d && String(d).startsWith(this.filterDate);
      });
    }

    // 4. Amount range filtering
    if (this.filterMinAmount != null && this.filterMinAmount > 0) {
      result = result.filter(inv => (inv.sale?.totalAmount || 0) >= this.filterMinAmount!);
    }
    if (this.filterMaxAmount != null && this.filterMaxAmount > 0) {
      result = result.filter(inv => (inv.sale?.totalAmount || 0) <= this.filterMaxAmount!);
    }

    // 5. Party dropdown filtering
    if (this.filterPartyId) {
      result = result.filter(inv => String(inv.sale?.party?.id) === String(this.filterPartyId));
    }

    // 6. Payment status dropdown filter
    if (this.filterPaymentStatus && this.filterPaymentStatus !== 'all') {
      if (this.filterPaymentStatus === 'paid') {
        result = result.filter(inv => (inv.sale?.remaining ?? 0) === 0);
      } else if (this.filterPaymentStatus === 'partial') {
        result = result.filter(inv => (inv.sale?.remaining ?? 0) > 0 && (inv.sale?.remaining ?? 0) < (inv.sale?.totalAmount ?? 0));
      } else if (this.filterPaymentStatus === 'unpaid') {
        result = result.filter(inv => (inv.sale?.remaining ?? 0) >= (inv.sale?.totalAmount ?? 0) && (inv.sale?.remaining ?? 0) > 0);
      }
    }

    // 7. Dynamic sorting
    result.sort((a, b) => {
      let vA = this.resolvePath(a, this.sortField);
      let vB = this.resolvePath(b, this.sortField);
      if (this.sortField === 'taxable') {
        vA = this.getTaxableAmount(a);
        vB = this.getTaxableAmount(b);
      } else if (this.sortField === 'gst') {
        vA = this.getGstAmount(a);
        vB = this.getGstAmount(b);
      }
      if (vA < vB) return this.sortAsc ? -1 : 1;
      if (vA > vB) return this.sortAsc ? 1 : -1;
      return 0;
    });

    this.tableFilteredCounts[table] = result.length;
    if (allRecords) return result;
    const start = (this.currentPage - 1) * this.pageSize;
    return result.slice(start, start + this.pageSize);
  }

  private resolvePath(obj: any, path: string): any {
    if (!path) return '';
    return path.split('.').reduce((o, p) => o && o[p] != null ? o[p] : '', obj);
  }

  logAudit(action: string) {
    if (this.loggedInUser) {
      this.apiService.createAuditLog({ username: this.loggedInUser.username, action }).subscribe();
    }
  }

  trackByInvoiceId(index: number, item: any): any {
    return item?.id ?? item?.invoiceId ?? item?.invoiceNo ?? index;
  }
}
