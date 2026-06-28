import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';
import { DataTableComponent } from '../../data-table/data-table.component';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, DataTableComponent],
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css']
})
export class PaymentsComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'payments';
  @Input() loggedInUser: any = null;

  paymentsList: any[] = [];
  parties: any[] = [];
  invoicesList: any[] = [];
  
  paymentsForm = { partyId: '', invoiceNo: '', amountReceived: 0, paymentMode: 'UPI', paymentDate: '' };
  today: string = new Date().toISOString().split('T')[0];

  // Pagination & Sort state
  currentPage = 1;
  pageSize = 10;
  sortField = 'paymentDate';
  sortAsc = false;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  defaultColumns = ['Date', 'Party', 'Invoice Ref', 'Amount', 'Mode', 'Actions'];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
    
    // Initialize columns visibility
    this.columnsVisibility['payments'] = {};
    this.defaultColumns.forEach(col => {
      this.columnsVisibility['payments'][col] = true;
    });
  }

  loadData() {
    this.apiService.getParties().subscribe((res: any[]) => this.parties = res);
    this.apiService.getInvoices().subscribe((res: any[]) => this.invoicesList = res);
    this.apiService.getPayments().subscribe((res: any[]) => {
      this.paymentsList = res;
      this.tableFilteredCounts['payments'] = this.paymentsList.length;
    });
  }

  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  savePayment() {
    if (!this.paymentsForm.paymentDate || !this.paymentsForm.partyId || this.paymentsForm.amountReceived <= 0) {
      alert("Please fill required valid fields");
      return;
    }
    this.apiService.createPayment(this.paymentsForm).subscribe(() => {
      this.loadData();
      this.logAudit("Added new payment collection");
      this.paymentsForm = { partyId: '', invoiceNo: '', amountReceived: 0, paymentMode: 'UPI', paymentDate: '' };
    });
  }

  deletePayment(id: number) {
    if (!this.canDelete()) {
      alert("Permission denied");
      return;
    }
    this.apiService.deletePayment(id).subscribe(() => {
      this.loadData();
      this.logAudit("Deleted payment record ID: " + id);
    });
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
    
    // Sort
    let sorted = [...list].sort((a, b) => {
      let valA = this.resolvePath(a, this.sortField);
      let valB = this.resolvePath(b, this.sortField);
      
      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });

    this.tableFilteredCounts[table] = sorted.length;

    // Paginate
    const start = (this.currentPage - 1) * this.pageSize;
    return sorted.slice(start, start + this.pageSize);
  }

  private resolvePath(obj: any, path: string): any {
    if (!path) return '';
    return path.split('.').reduce((o, p) => o && o[p] != null ? o[p] : '', obj);
  }
}
