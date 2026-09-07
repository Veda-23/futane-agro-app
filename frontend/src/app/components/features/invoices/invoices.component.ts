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

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, AutoSelectDirective, ResizableTableDirective, IndianDatePipe],
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.css']
})
export class InvoicesComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'invoices';
  @Input() loggedInUser: any = null;
  @Input() parties: any[] = [];

  invoicesList: any[] = [];
  selectedInvoice: any = null;
  Math = Math;

  // Pagination & Sort
  currentPage = 1;
  pageSize = 10;
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

  defaultColumns = ['ID', 'Invoice No', 'Date', 'Party', 'Description', 'Total Bill', 'Status', 'Actions'];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
    this.columnsVisibility['invoices'] = {};
    this.defaultColumns.forEach(col => {
      this.columnsVisibility['invoices'][col] = true;
    });
  }

  loadData() {
    this.apiService.getInvoices().subscribe((res: any[]) => {
      this.invoicesList = res;
      this.tableFilteredCounts['invoices'] = res.length;
    });
  }

  // ── KPI Helpers ──────────────────────────────────────────────────────────────
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

  // ── Modal ─────────────────────────────────────────────────────────────────────
  viewInvoice(inv: any) { this.selectedInvoice = inv; }
  closeInvoiceModal() { this.selectedInvoice = null; }

  closeInvoiceModalOnBackdrop(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('invoice-modal-overlay')) {
      this.closeInvoiceModal();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.selectedInvoice) this.closeInvoiceModal();
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
      });
    }, 200);
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
    doc.text('INVOICE DETAILS', 15, 45); doc.setFont('helvetica', 'normal');
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
    doc.text('Thank you for your business! Computer-generated invoice.', 105, 140, { align: 'center' });
    doc.save(`${inv.invoiceNo}.pdf`);
  }

  // ── Export CSV ────────────────────────────────────────────────────────────────
  exportTableCSV(table: string) {
    const list = this.getProcessedList(this.invoicesList, table, true);
    const headers = ['Invoice No', 'Date', 'Party', 'Description', 'Total', 'Paid', 'Remaining', 'Status'];
    const rows = list.map(inv => [
      inv.invoiceNo,
      inv.createdDate,
      inv.sale?.party?.partyName,
      `${inv.sale?.crateType} (${inv.sale?.quantity})`,
      inv.sale?.totalAmount,
      inv.sale?.paid,
      inv.sale?.remaining,
      inv.sale?.remaining === 0 ? 'Paid' : inv.sale?.remaining >= inv.sale?.totalAmount ? 'Unpaid' : 'Partial'
    ]);
    const csv = [headers, ...rows].map(r => r.map((v: any) => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'invoices.csv'; a.click();
    URL.revokeObjectURL(url);
    this.logAudit('Exported Invoices CSV');
  }

  // ── Column management ─────────────────────────────────────────────────────────
  toggleColDropdown(table: string) {
    this.showColDropdown[table] = !this.showColDropdown[table];
  }

  getTableColumns(table: string): string[] { return this.defaultColumns; }

  isColumnVisible(table: string, col: string): boolean {
    return this.columnsVisibility[table] ? (this.columnsVisibility[table][col] !== false) : true;
  }

  toggleColumn(table: string, col: string) {
    if (this.columnsVisibility[table]) {
      this.columnsVisibility[table][col] = !this.columnsVisibility[table][col];
    }
  }

  setSort(field: string) {
    this.sortField === field ? (this.sortAsc = !this.sortAsc) : (this.sortField = field, this.sortAsc = true);
  }

  getProcessedList(list: any[], table: string, allRecords = false): any[] {
    if (!list) return [];
    let result = [...list];

    // Filtering
    if (this.filterSearchQuery) {
      const q = this.filterSearchQuery.toLowerCase();
      result = result.filter(inv =>
        inv.invoiceNo?.toLowerCase().includes(q) ||
        inv.sale?.party?.partyName?.toLowerCase().includes(q) ||
        inv.sale?.crateType?.toLowerCase().includes(q)
      );
    }
    if (this.filterDate) {
      result = result.filter(inv => inv.createdDate?.startsWith(this.filterDate));
    }
    if (this.filterMinAmount != null) {
      result = result.filter(inv => (inv.sale?.totalAmount || 0) >= this.filterMinAmount!);
    }
    if (this.filterMaxAmount != null) {
      result = result.filter(inv => (inv.sale?.totalAmount || 0) <= this.filterMaxAmount!);
    }
    if (this.filterPartyId) {
      result = result.filter(inv => String(inv.sale?.party?.id) === String(this.filterPartyId));
    }

    // Sort
    result.sort((a, b) => {
      const vA = this.resolvePath(a, this.sortField);
      const vB = this.resolvePath(b, this.sortField);
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
