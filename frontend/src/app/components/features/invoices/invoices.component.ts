import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.css']
})
export class InvoicesComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'invoices';
  @Input() loggedInUser: any = null;

  invoicesList: any[] = [];
  selectedInvoice: any = null;
  Math = Math;

  // Pagination & Sort state
  currentPage = 1;
  pageSize = 10;
  sortField = 'id';
  sortAsc = false;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  defaultColumns = ['ID', 'Invoice No', 'Date', 'Party', 'Description', 'Total Bill', 'Actions'];

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
      this.tableFilteredCounts['invoices'] = this.invoicesList.length;
    });
  }

  viewInvoice(inv: any) {
    this.selectedInvoice = inv;
  }

  closeInvoiceModal() {
    this.selectedInvoice = null;
  }

  downloadPDFInvoice(inv: any) {
    this.logAudit("Downloaded PDF Invoice: " + inv.invoiceNo);
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("FUTANE AGRO INDUSTRIES PVT. LTD.", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Manufacturers of High-Quality Plastic Crates & Containers", 105, 26, { align: "center" });
    doc.text("Factory: Gate No 144, Hadapsar Industrial Area, Pune - 411028", 105, 31, { align: "center" });
    doc.line(15, 36, 195, 36);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE DETAILS", 15, 45);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice No: ${inv.invoiceNo}`, 15, 52);
    doc.text(`Invoice Date: ${inv.createdDate}`, 15, 58);
    
    doc.setFont("helvetica", "bold");
    doc.text("BILLED TO:", 115, 45);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${inv.sale.party.partyName}`, 115, 52);
    doc.text(`Address: ${inv.sale.party.partyAddress}`, 115, 58);
    doc.text(`GSTIN: ${inv.sale.party.gstNumber || 'N/A'}`, 115, 64);

    doc.line(15, 72, 195, 72);

    doc.setFont("helvetica", "bold");
    doc.text("Description", 20, 80);
    doc.text("Material", 75, 80);
    doc.text("Qty", 105, 80);
    doc.text("Rate (INR)", 135, 80);
    doc.text("Total (INR)", 165, 80);
    doc.line(15, 84, 195, 84);

    doc.setFont("helvetica", "normal");
    doc.text(`${inv.sale.crateType}`, 20, 92);
    doc.text(`${inv.sale.crateMaterial}`, 75, 92);
    doc.text(`${inv.sale.quantity}`, 105, 92);
    doc.text(`${inv.sale.rate.toFixed(2)}`, 135, 92);
    doc.text(`${inv.sale.totalAmount.toFixed(2)}`, 165, 92);

    doc.line(15, 98, 195, 98);

    doc.setFont("helvetica", "bold");
    doc.text("Summary:", 115, 110);
    doc.setFont("helvetica", "normal");
    doc.text(`Sub-Total: INR ${inv.sale.totalAmount.toFixed(2)}`, 115, 117);
    doc.text(`Paid Amount: INR ${inv.sale.paid.toFixed(2)}`, 115, 123);
    
    doc.setFont("helvetica", "bold");
    doc.text(`Balance Due: INR ${inv.sale.remaining.toFixed(2)}`, 115, 130);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Thank you for your business!", 105, 150, { align: "center" });
    doc.text("Note: This is a computer-generated invoice and requires no physical signature.", 105, 155, { align: "center" });

    doc.save(`${inv.invoiceNo}.pdf`);
  }

  logAudit(action: string) {
    if (this.loggedInUser) {
      this.apiService.createAuditLog({ username: this.loggedInUser.username, action }).subscribe();
    }
  }

  // Table handling methods
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
}

