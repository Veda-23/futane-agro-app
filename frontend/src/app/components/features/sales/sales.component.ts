import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';
import { DataTableComponent } from '../../data-table/data-table.component';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, DataTableComponent],
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css']
})
export class SalesComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'sales';
  @Input() loggedInUser: any = null;

  salesList: any[] = [];
  parties: any[] = [];
  salesForm = { date: '', partyId: '', crateType: 'Apple Crate', crateMaterial: 'Plastic', quantity: 0, rate: 0, totalAmount: 0, paid: 0, remaining: 0 };

  // Pagination & Sort state for local logic if needed
  currentPage = 1;
  pageSize = 10;
  sortField = 'date';
  sortAsc = false;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  defaultColumns = ['Date', 'Party', 'Crate Type', 'Quantity', 'Rate', 'Total', 'Paid', 'Remaining', 'Actions'];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
    
    // Initialize columns visibility
    this.columnsVisibility['sales'] = {};
    this.defaultColumns.forEach(col => {
      this.columnsVisibility['sales'][col] = true;
    });
  }

  loadData() {
    this.apiService.getParties().subscribe((res: any[]) => this.parties = res);
    this.apiService.getSales().subscribe((res: any[]) => {
      this.salesList = res;
      this.tableFilteredCounts['sales'] = this.salesList.length;
    });
  }

  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  calculateSalesTotal() {
    this.salesForm.totalAmount = this.salesForm.quantity * this.salesForm.rate;
    this.salesForm.remaining = this.salesForm.totalAmount - this.salesForm.paid;
  }

  saveSales() {
    if (!this.salesForm.date || !this.salesForm.partyId || this.salesForm.quantity <= 0) {
      alert("Please fill required valid fields");
      return;
    }
    this.apiService.createSale(this.salesForm).subscribe({
      next: () => {
        this.loadData();
        this.logAudit("Added new sale record");
        this.salesForm = { date: '', partyId: '', crateType: 'Apple Crate', crateMaterial: 'Plastic', quantity: 0, rate: 0, totalAmount: 0, paid: 0, remaining: 0 };
      },
      error: (err) => {
        if (err.status === 409) {
          alert(err.error?.message || "A sale with this unique info already exists.");
        } else {
          alert("Failed to save sale: " + (err.error?.message || err.message));
        }
      }
    });
  }

  deleteSale(id: number) {
    if (!this.canDelete()) {
      alert("Permission denied");
      return;
    }
    this.apiService.deleteSale(id).subscribe(() => {
      this.loadData();
      this.logAudit("Deleted sale record ID: " + id);
    });
  }

  logAudit(action: string) {
    if (this.loggedInUser) {
      this.apiService.createAuditLog({ username: this.loggedInUser.username, action }).subscribe();
    }
  }

  // Table handling methods (mirrored from app.component for standalone table logic without app-data-table)
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
