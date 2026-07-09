import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';

@Component({
  selector: 'app-transports',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './transports.component.html',
  styleUrls: ['./transports.component.css']
})
export class TransportsComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'transports';
  @Input() loggedInUser: any = null;

  transportsList: any[] = [];
  drivers: any[] = [];
  transportsForm = { date: '', truckNumber: '', id: '', rent: 0, advance: 0, truckPhotoPath: '', driverLicensePath: '' };
  Math = Math;

  // Pagination & Sort state
  currentPage = 1;
  pageSize = 10;
  sortField = 'date';
  sortAsc = false;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  defaultColumns = ['Date', 'Truck', 'Driver', 'Rent', 'Advance', 'Remaining', 'Actions'];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
    this.columnsVisibility['transports'] = {};
    this.defaultColumns.forEach(col => {
      this.columnsVisibility['transports'][col] = true;
    });
  }

  loadData() {
    this.apiService.getDrivers().subscribe((res: any[]) => this.drivers = res);
    this.apiService.getTransports().subscribe((res: any[]) => {
      this.transportsList = res;
      this.tableFilteredCounts['transports'] = this.transportsList.length;
    });
  }

  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  saveTransport() {
    if (!this.transportsForm.date || !this.transportsForm.truckNumber || !this.transportsForm.id || this.transportsForm.rent === null || this.transportsForm.advance === null) {
      alert("Please fill required fields");
      return;
    }
    const driver = this.drivers.find(d => d.id === parseInt(this.transportsForm.id));
    if (!driver) return;

    const payload = {
      date: this.transportsForm.date,
      truckNumber: this.transportsForm.truckNumber,
      driver: driver,
      rent: this.transportsForm.rent,
      advance: this.transportsForm.advance,
      truckPhotoPath: this.transportsForm.truckPhotoPath || '',
      driverLicensePath: this.transportsForm.driverLicensePath || ''
    };

    this.apiService.createTransport(payload).subscribe(() => {
      this.loadData();
      this.logAudit("Logged transport rental for truck: " + this.transportsForm.truckNumber);
      this.transportsForm = { date: '', truckNumber: '', id: '', rent: 0, advance: 0, truckPhotoPath: '', driverLicensePath: '' };
    });
  }

  deleteTransport(id: string) {
    if (!this.canDelete()) {
      alert("Permission denied");
      return;
    }
    this.apiService.deleteTransport(id).subscribe(() => {
      this.loadData();
      this.logAudit("Deleted transport record ID: " + id);
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

