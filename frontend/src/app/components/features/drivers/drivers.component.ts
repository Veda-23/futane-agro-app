import { Component, OnInit, Input } from '@angular/core';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { NotificationService } from '../../../services/notification.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';

@Component({
  selector: 'app-drivers',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, AutoSelectDirective, FormStateDirective],
  templateUrl: './drivers.component.html',
  styleUrls: ['./drivers.component.css']
})
export class DriversComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'drivers';
  @Input() loggedInUser: any = null;
  @Input() transportsList: any[] = [];

  drivers: any[] = [];
  driverForm = { driverName: '', mobile: '', licenseNumber: '', address: '' };
  Math = Math;

  currentPage = 1;
  pageSize = 10;
  sortField = 'id';
  sortAsc = false;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  defaultColumns = ['ID', 'Name', 'Mobile', 'License', 'Address', 'Trips', 'Earnings', 'Actions'];

  constructor(private apiService: ApiService, private notificationService: NotificationService) {}

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
    this.apiService.getTransports().subscribe((res: any[]) => {
      this.transportsList = res || [];
    });
  }

  getDriverStats(driverId: string | number): { trips: number; earnings: number } {
    const trips = (this.transportsList || []).filter(t => (t.driver?.id === driverId || t.driverId === driverId));
    return {
      trips: trips.length,
      earnings: trips.reduce((s, t) => s + (t.rent || 0), 0)
    };
  }

  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  validateForm(): boolean {
    if (!this.driverForm.driverName || !this.driverForm.mobile || !this.driverForm.licenseNumber || !this.driverForm.address) {
      this.notificationService.warning('Invalid Input', "Please fill all required fields");
      return false;
    }
    return true;
  }

  saveDriver() {
    if (!this.validateForm()) return;
    this.apiService.createDriver(this.driverForm).subscribe({
      next: (res) => {
        if (res) this.drivers.unshift(res);
        this.loadData();
        this.notificationService.success('Data Added', 'Driver created successfully');
        this.logAudit("Created driver: " + this.driverForm.driverName);
        this.driverForm = { driverName: '', mobile: '', licenseNumber: '', address: '' };
      },
      error: (err) => this.notificationService.error('Error', "Failed to create driver: " + (err.error?.message || err.message))
    });
  }

  deleteDriver(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "Permission denied");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this driver?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteDriver(id).subscribe({
          next: () => {
            this.drivers = this.drivers.filter(x => (x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Driver deleted successfully');
            this.logAudit("Deleted driver ID: " + id);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  logAudit(action: string) {
    if (this.loggedInUser) {
      this.apiService.createAuditLog({ username: this.loggedInUser.username, action }).subscribe();
    }
  }

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
