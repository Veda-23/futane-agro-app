import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';

@Component({
  selector: 'app-drivers',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './drivers.component.html',
  styleUrls: ['./drivers.component.css']
})
export class DriversComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'drivers';
  @Input() loggedInUser: any = null;

  drivers: any[] = [];
  driverForm = { driverName: '', mobile: '', licenseNumber: '', address: '' };
  Math = Math;

  // Pagination & Sort state
  currentPage = 1;
  pageSize = 10;
  sortField = 'driverId';
  sortAsc = false;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  defaultColumns = ['ID', 'Name', 'Mobile', 'License', 'Address', 'Actions'];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
    this.columnsVisibility['drivers'] = {};
    this.defaultColumns.forEach(col => {
      this.columnsVisibility['drivers'][col] = true;
    });
  }

  loadData() {
    this.apiService.getDrivers().subscribe((res: any[]) => {
      this.drivers = res;
      this.tableFilteredCounts['drivers'] = this.drivers.length;
    });
  }

  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  validateForm(): boolean {
    if (!this.driverForm.driverName || !this.driverForm.mobile || !this.driverForm.licenseNumber || !this.driverForm.address) {
      alert("Please fill all required fields");
      return false;
    }
    return true;
  }

  saveDriver() {
    if (!this.validateForm()) return;
    this.apiService.createDriver(this.driverForm).subscribe(() => {
      this.loadData();
      this.logAudit("Created driver: " + this.driverForm.driverName);
      this.driverForm = { driverName: '', mobile: '', licenseNumber: '', address: '' };
    });
  }

  deleteDriver(id: number) {
    if (!this.canDelete()) {
      alert("Permission denied");
      return;
    }
    this.apiService.deleteDriver(id).subscribe(() => {
      this.loadData();
      this.logAudit("Deleted driver ID: " + id);
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
