import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';

@Component({
  selector: 'app-raw-materials',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
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

  Math = Math; // to use Math.min in HTML

  // Pagination & Sort state
  currentPage = 1;
  pageSize = 10;
  sortField = 'date';
  sortAsc = false;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  defaultColumns = ['Date', 'Material', 'Vendor', 'Weight', 'Rate', 'Amount', 'Actions'];

  constructor(private apiService: ApiService) {}

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

  saveRawMaterial() {
    if (!this.rawMaterialsForm.date || !this.rawMaterialsForm.materialName || !this.rawMaterialsForm.id) {
      alert("Please fill required fields");
      return;
    }
    const vendor = this.vendors.find(v => v.id === parseInt(this.rawMaterialsForm.id));
    
    const payload = {
      date: this.rawMaterialsForm.date,
      materialName: this.rawMaterialsForm.materialName,
      vendor: vendor,
      weight: this.rawMaterialsForm.weight,
      rate: this.rawMaterialsForm.rate,
      purchaseBillPath: this.rawMaterialsForm.purchaseBillPath || '',
      weightSlipPath: this.rawMaterialsForm.weightSlipPath || ''
    };

    this.apiService.createRawMaterial(payload).subscribe(() => {
      this.loadData();
      this.logAudit("Added new raw material purchase: " + this.rawMaterialsForm.materialName);
      this.rawMaterialsForm = { date: '', materialName: 'HDPE Plastic Granules', id: '', weight: 0, rate: 0, purchaseBillPath: '', weightSlipPath: '' };
    });
  }

  deleteRawMaterial(id: string) {
    if (!this.canDelete()) {
      alert("Permission denied");
      return;
    }
    this.apiService.deleteRawMaterial(id).subscribe(() => {
      this.loadData();
      this.logAudit("Deleted raw material record ID: " + id);
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

