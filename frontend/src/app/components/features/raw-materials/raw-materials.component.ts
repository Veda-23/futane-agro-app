import { Component, OnInit, Input } from '@angular/core';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { NotificationService } from '../../../services/notification.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';

@Component({
  selector: 'app-raw-materials',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, AutoSelectDirective, FormStateDirective],
  templateUrl: './raw-materials.component.html',
  styleUrls: ['./raw-materials.component.css']
})
export class RawMaterialsComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'raw-materials';
  @Input() loggedInUser: any = null;

  rawMaterialsList: any[] = [];
  vendors: any[] = [];
  rawMaterialsForm = { date: '', materialName: 'HDPE Plastic Granules', id: '', weight: 0, rate: 0, purchaseBillPath: '', weightSlipPath: '' };

  Math = Math;

  currentPage = 1;
  pageSize = 10;
  sortField = 'date';
  sortAsc = false;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  defaultColumns = ['Date', 'Material', 'Vendor', 'Weight', 'Rate', 'Amount', 'Actions'];

  constructor(private apiService: ApiService, private notificationService: NotificationService) {}

  ngOnInit() {
    this.loadData();
    this.columnsVisibility['raw'] = {};
    this.defaultColumns.forEach(col => {
      this.columnsVisibility['raw'][col] = true;
    });
  }

  loadData() {
    this.apiService.getVendors().subscribe((res: any[]) => this.vendors = res);
    this.apiService.getRawMaterials().subscribe((res: any[]) => {
      this.rawMaterialsList = res;
      this.tableFilteredCounts['raw'] = this.rawMaterialsList.length;
    });
  }

  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  get calculatedAmount(): number {
    return Math.round((Number(this.rawMaterialsForm.weight) || 0) * (Number(this.rawMaterialsForm.rate) || 0) * 100) / 100;
  }

  saveRawMaterial() {
    if (!this.rawMaterialsForm.date || !this.rawMaterialsForm.materialName || !this.rawMaterialsForm.id) {
      this.notificationService.warning('Invalid Input', "Please fill required fields");
      return;
    }
    const vendor = this.vendors.find(v => v.id === parseInt(this.rawMaterialsForm.id));
    if (!vendor) return;
    
    const payload = {
      date: this.rawMaterialsForm.date,
      materialName: this.rawMaterialsForm.materialName,
      vendor: vendor,
      weight: this.rawMaterialsForm.weight,
      rate: this.rawMaterialsForm.rate,
      amount: this.calculatedAmount,
      purchaseBillPath: this.rawMaterialsForm.purchaseBillPath || '',
      weightSlipPath: this.rawMaterialsForm.weightSlipPath || ''
    };

    this.apiService.createRawMaterial(payload).subscribe({
      next: (res) => {
        if (res) this.rawMaterialsList.unshift(res);
        this.loadData();
        this.notificationService.success('Data Added', 'Raw material purchase record added successfully');
        this.logAudit("Added new raw material purchase: " + this.rawMaterialsForm.materialName);
        this.rawMaterialsForm = { date: '', materialName: 'HDPE Plastic Granules', id: '', weight: 0, rate: 0, purchaseBillPath: '', weightSlipPath: '' };
      },
      error: (err) => this.notificationService.error('Error', "Failed to save raw material: " + (err.error?.message || err.message))
    });
  }

  deleteRawMaterial(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "Permission denied");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this raw material record?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteRawMaterial(id).subscribe({
          next: () => {
            this.rawMaterialsList = this.rawMaterialsList.filter(x => (x.rawMaterialId ? x.rawMaterialId.toString() : x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Raw material record deleted successfully');
            this.logAudit("Deleted raw material record ID: " + id);
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
