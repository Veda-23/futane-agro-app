import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';

@Component({
  selector: 'app-dispatch',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './dispatch.component.html',
  styleUrls: ['./dispatch.component.css']
})
export class DispatchComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'dispatch';
  @Input() loggedInUser: any = null;

  salesList: any[] = [];
  dispatchesList: any[] = [];
  dispatchForm = { saleId: '', dispatchDate: '', vehicleNumber: '', driverName: '', deliveryAddress: '', dispatchStatus: 'Pending' };
  today: string = new Date().toISOString().split('T')[0];

  Math = Math;

  // Pagination & Sort state
  currentPage = 1;
  pageSize = 10;
  sortField = 'dispatchId';
  sortAsc = false;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  defaultCols = ['Sale', 'Date', 'Vehicle', 'Driver', 'Status', 'Actions'];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
    this.columnsVisibility['dispatch'] = {};
    this.defaultCols.forEach(col => this.columnsVisibility['dispatch'][col] = true);
  }

  loadData() {
    this.apiService.getSales().subscribe((res: any[]) => {
      this.salesList = res;
    });
    this.apiService.getDispatches().subscribe((res: any[]) => {
      this.dispatchesList = res;
      this.tableFilteredCounts['dispatch'] = this.dispatchesList.length;
    });
  }

  isViewer() {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete() {
    return this.loggedInUser && this.loggedInUser.role === 'ADMIN';
  }

  validateForm(): boolean {
    const f = this.dispatchForm;
    if (!f.saleId || !f.dispatchDate || !f.vehicleNumber || !f.driverName || !f.deliveryAddress) {
      alert('Please fill out all required dispatch fields.');
      return false;
    }
    return true;
  }

  saveDispatch() {
    if (!this.validateForm()) return;
    const sale = this.salesList.find((s: any) => s.saleId === parseInt(this.dispatchForm.saleId));
    if (!sale) return;
    const payload = { ...this.dispatchForm, sale };
    this.apiService.createDispatch(payload).subscribe(() => {
      this.loadData();
      this.logAudit('Created dispatch record for sale ID: ' + this.dispatchForm.saleId);
      this.dispatchForm = { saleId: '', dispatchDate: '', vehicleNumber: '', driverName: '', deliveryAddress: '', dispatchStatus: 'Pending' };
    });
  }

  deleteDispatch(id: number) {
    this.apiService.deleteDispatch(id).subscribe(() => {
      this.loadData();
      this.logAudit('Deleted dispatch record ID: ' + id);
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
    return this.defaultCols;
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
