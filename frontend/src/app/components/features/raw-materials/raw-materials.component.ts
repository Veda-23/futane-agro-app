import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { ResizableTableDirective } from '../../../directives/resizable-table.directive';
import { IndianDatePipe } from '../../../pipes/indian-date.pipe';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as XLSX from 'xlsx';

export interface RawMaterialItem {
  id?: string;
  rawMaterialId?: number;
  date: string;
  materialName: string;
  vendor?: {
    id?: string;
    vendorId?: number;
    vendorName?: string;
    address?: string;
    gstNumber?: string;
    mobile?: string;
  };
  weight: number;
  rate: number;
  amount: number;
  purchaseBillPath?: string | null;
  weightSlipPath?: string | null;
  createdAt?: string;
}

@Component({
  selector: 'app-raw-materials',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    ResizableTableDirective,
    IndianDatePipe
  ],
  templateUrl: './raw-materials.component.html',
  styleUrls: ['./raw-materials.component.css']
})
export class RawMaterialsComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'raw-materials';
  @Input() loggedInUser: any = null;
  @Output() onNavigateTab = new EventEmitter<string>();

  // State
  isLoading: boolean = true;
  hasError: boolean = false;
  rawMaterialsList: RawMaterialItem[] = [];
  vendors: any[] = [];

  // Subtabs
  selectedSubtab: string = 'all';

  // Search & Filter
  searchQuery: string = '';
  filterVendorId: string = '';
  filterCategory: string = '';
  filterWeightRange: string = '';
  filterDateFrom: string = '';
  filterDateTo: string = '';
  showFilterPopover: boolean = false;
  activeFilterCount: number = 0;

  // Density & Columns
  tableDensity: 'compact' | 'comfortable' | 'spacious' = 'comfortable';
  showColDropdown: boolean = false;
  showExportDropdown: boolean = false;

  columnsVisibility: { [col: string]: boolean } = {
    'Select': true,
    'Date': true,
    'BatchID': true,
    'Material': true,
    'Category': true,
    'Supplier': true,
    'Weight': true,
    'Rate': true,
    'Amount': true,
    'References': true,
    'Actions': true
  };

  defaultColumns = ['Date', 'BatchID', 'Material', 'Category', 'Supplier', 'Weight', 'Rate', 'Amount', 'References', 'Actions'];

  // Selection
  selectedRows: Set<string> = new Set();

  // Pagination & Sorting
  currentPage: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [10, 25, 50];
  sortField: string = 'date';
  sortAsc: boolean = false;

  // Form (Collapsible Panel)
  isAddFormOpen: boolean = false;
  editingRawMaterialId: string | null = null;
  rawMaterialsForm = {
    date: new Date().toISOString().split('T')[0],
    materialName: 'Virgin HDPE Granules Grade 100',
    id: '', // Vendor ID
    weight: 1000,
    rate: 95,
    purchaseBillPath: '',
    weightSlipPath: ''
  };

  // Quick Preset Materials
  commonMaterials: string[] = [
    'Virgin HDPE Granules Grade 100',
    'Food-Grade PP Granules (Impact Copolymer)',
    'HDPE Natural Granules',
    'Recycled Polyethylene Compound',
    'Blue/Red Colour Masterbatch Pigment',
    'UV Stabilizer Masterbatch (Agro Grade)',
    'Corrugated 5-Ply Outer Carton Sheets',
    'Calcium Carbonate Filler Masterbatch'
  ];

  // Inspection / GRN Modal
  showInspectionModal: boolean = false;
  selectedMaterialForInspection: RawMaterialItem | null = null;

  Math = Math;

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  // Click outside to close dropdowns
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-popover-wrapper')) {
      this.showFilterPopover = false;
    }
    if (!target.closest('.col-manager-dropdown-wrapper')) {
      this.showColDropdown = false;
    }
    if (!target.closest('.export-dropdown-wrapper')) {
      this.showExportDropdown = false;
    }
  }

  loadData(notify: boolean = false): void {
    this.isLoading = true;
    this.hasError = false;

    forkJoin({
      vendors: this.apiService.getVendors().pipe(catchError(() => of([]))),
      rawMaterials: this.apiService.getRawMaterials().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ vendors, rawMaterials }) => {
        this.vendors = vendors || [];
        this.rawMaterialsList = (rawMaterials || []).map((rm: any) => ({
          ...rm,
          id: rm.id || String(rm.rawMaterialId),
          weight: Number(rm.weight) || 0,
          rate: Number(rm.rate) || 0,
          amount: Number(rm.amount) || ((Number(rm.weight) || 0) * (Number(rm.rate) || 0))
        }));

        this.isLoading = false;
        this.updateActiveFilterCount();

        if (notify) {
          this.notificationService.success('Refreshed', `Loaded ${this.rawMaterialsList.length} procurement batches`);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.hasError = true;
        this.notificationService.error('Load Failed', 'Could not load polymer raw materials data.');
      }
    });
  }

  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  // --- Telemetry KPI Calculations ---
  get totalBatchesCount(): number {
    return this.rawMaterialsList.length;
  }

  get totalPolymerWeightKg(): number {
    return this.rawMaterialsList.reduce((sum, rm) => sum + (rm.weight || 0), 0);
  }

  get totalInventoryValuation(): number {
    return this.rawMaterialsList.reduce((sum, rm) => sum + (rm.amount || 0), 0);
  }

  get weightedAverageRate(): number {
    const totalWeight = this.totalPolymerWeightKg;
    if (!totalWeight) return 0;
    return Math.round((this.totalInventoryValuation / totalWeight) * 100) / 100;
  }

  get activeVendorsCount(): number {
    const vendorIds = new Set(this.rawMaterialsList.map(rm => rm.vendor?.id || rm.vendor?.vendorId).filter(Boolean));
    return vendorIds.size || this.vendors.length;
  }

  // --- Category Classification ---
  getMaterialCategory(materialName: string): { key: string; label: string; badgeClass: string; icon: string } {
    const name = (materialName || '').toLowerCase();
    if (name.includes('virgin') || name.includes('hdpe grade') || name.includes('impact copolymer')) {
      return { key: 'virgin', label: 'Virgin Polymer', badgeClass: 'cat-badge-virgin', icon: 'bi-shield-check' };
    }
    if (name.includes('recycled') || name.includes('compound') || name.includes('regrind')) {
      return { key: 'recycled', label: 'Recycled Comp', badgeClass: 'cat-badge-recycled', icon: 'bi-recycle' };
    }
    if (name.includes('masterbatch') || name.includes('pigment') || name.includes('colour') || name.includes('uv') || name.includes('filler')) {
      return { key: 'masterbatch', label: 'Masterbatch', badgeClass: 'cat-badge-additive', icon: 'bi-palette-fill' };
    }
    if (name.includes('carton') || name.includes('sheet') || name.includes('box') || name.includes('packaging')) {
      return { key: 'packaging', label: 'Packaging', badgeClass: 'cat-badge-packaging', icon: 'bi-box-seam' };
    }
    return { key: 'general', label: 'Polymer Resin', badgeClass: 'cat-badge-default', icon: 'bi-boxes' };
  }

  // --- Subtabs Filter ---
  setSubtab(tabKey: string): void {
    this.selectedSubtab = tabKey;
    this.currentPage = 1;
  }

  getSubtabCount(tabKey: string): number {
    if (tabKey === 'all') return this.rawMaterialsList.length;
    if (tabKey === 'high-volume') {
      return this.rawMaterialsList.filter(rm => (rm.weight || 0) >= 1000).length;
    }
    return this.rawMaterialsList.filter(rm => this.getMaterialCategory(rm.materialName).key === tabKey).length;
  }

  // --- Filtering & Sorting ---
  get filteredList(): RawMaterialItem[] {
    let result = [...this.rawMaterialsList];

    // Subtab filter
    if (this.selectedSubtab !== 'all') {
      if (this.selectedSubtab === 'high-volume') {
        result = result.filter(rm => (rm.weight || 0) >= 1000);
      } else {
        result = result.filter(rm => this.getMaterialCategory(rm.materialName).key === this.selectedSubtab);
      }
    }

    // Text search
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      result = result.filter(rm => {
        const mat = (rm.materialName || '').toLowerCase();
        const vendor = (rm.vendor?.vendorName || '').toLowerCase();
        const id = String(rm.rawMaterialId || rm.id || '').toLowerCase();
        const date = String(rm.date || '').toLowerCase();
        const bill = (rm.purchaseBillPath || '').toLowerCase();
        return mat.includes(q) || vendor.includes(q) || id.includes(q) || date.includes(q) || bill.includes(q);
      });
    }

    // Advanced Popover Filters
    if (this.filterVendorId) {
      result = result.filter(rm => String(rm.vendor?.id) === this.filterVendorId || String(rm.vendor?.vendorId) === this.filterVendorId);
    }

    if (this.filterCategory) {
      result = result.filter(rm => this.getMaterialCategory(rm.materialName).key === this.filterCategory);
    }

    if (this.filterWeightRange) {
      if (this.filterWeightRange === 'low') {
        result = result.filter(rm => (rm.weight || 0) < 500);
      } else if (this.filterWeightRange === 'mid') {
        result = result.filter(rm => (rm.weight || 0) >= 500 && (rm.weight || 0) <= 1500);
      } else if (this.filterWeightRange === 'high') {
        result = result.filter(rm => (rm.weight || 0) > 1500);
      }
    }

    if (this.filterDateFrom) {
      result = result.filter(rm => rm.date && rm.date >= this.filterDateFrom);
    }

    if (this.filterDateTo) {
      result = result.filter(rm => rm.date && rm.date <= this.filterDateTo);
    }

    // Sorting
    result.sort((a: any, b: any) => {
      let valA = this.resolvePath(a, this.sortField);
      let valB = this.resolvePath(b, this.sortField);

      if (typeof valA === 'number' && typeof valB === 'number') {
        return this.sortAsc ? valA - valB : valB - valA;
      }
      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();
      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }

  get paginatedList(): RawMaterialItem[] {
    const list = this.filteredList;
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredList.length / this.pageSize) || 1;
  }

  // Summary row computed on currently filtered subset
  get filteredTotalWeight(): number {
    return this.filteredList.reduce((sum, rm) => sum + (rm.weight || 0), 0);
  }

  get filteredTotalValue(): number {
    return this.filteredList.reduce((sum, rm) => sum + (rm.amount || 0), 0);
  }

  get filteredAverageRate(): number {
    const wt = this.filteredTotalWeight;
    return wt ? Math.round((this.filteredTotalValue / wt) * 100) / 100 : 0;
  }

  setSort(field: string): void {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = true;
    }
  }

  updateActiveFilterCount(): void {
    let count = 0;
    if (this.filterVendorId) count++;
    if (this.filterCategory) count++;
    if (this.filterWeightRange) count++;
    if (this.filterDateFrom || this.filterDateTo) count++;
    this.activeFilterCount = count;
  }

  applyFilters(): void {
    this.updateActiveFilterCount();
    this.currentPage = 1;
    this.showFilterPopover = false;
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.filterVendorId = '';
    this.filterCategory = '';
    this.filterWeightRange = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.activeFilterCount = 0;
    this.currentPage = 1;
    this.showFilterPopover = false;
  }

  // --- Table Density & Column Manager ---
  setDensity(density: 'compact' | 'comfortable' | 'spacious'): void {
    this.tableDensity = density;
  }

  toggleColDropdown(): void {
    this.showColDropdown = !this.showColDropdown;
  }

  isColumnVisible(col: string): boolean {
    return this.columnsVisibility[col] !== false;
  }

  toggleColumn(col: string): void {
    this.columnsVisibility[col] = !this.columnsVisibility[col];
  }

  resetColumns(): void {
    this.defaultColumns.forEach(col => {
      this.columnsVisibility[col] = true;
    });
  }

  get visibleColumnsCount(): number {
    return Object.keys(this.columnsVisibility).filter(k => this.columnsVisibility[k]).length;
  }

  // --- Row Checkboxes & Bulk Actions ---
  toggleSelectAll(): void {
    const pageItems = this.paginatedList;
    const allSelected = pageItems.every(rm => this.selectedRows.has(rm.id || String(rm.rawMaterialId)));
    if (allSelected) {
      pageItems.forEach(rm => this.selectedRows.delete(rm.id || String(rm.rawMaterialId)));
    } else {
      pageItems.forEach(rm => this.selectedRows.add(rm.id || String(rm.rawMaterialId)));
    }
  }

  isAllSelected(): boolean {
    const pageItems = this.paginatedList;
    if (pageItems.length === 0) return false;
    return pageItems.every(rm => this.selectedRows.has(rm.id || String(rm.rawMaterialId)));
  }

  toggleSelectRow(id: string): void {
    if (this.selectedRows.has(id)) {
      this.selectedRows.delete(id);
    } else {
      this.selectedRows.add(id);
    }
  }

  isRowSelected(id: string): boolean {
    return this.selectedRows.has(id);
  }

  clearSelection(): void {
    this.selectedRows.clear();
  }

  bulkExportSelected(): void {
    const selected = this.rawMaterialsList.filter(rm => this.selectedRows.has(rm.id || String(rm.rawMaterialId)));
    if (selected.length === 0) return;
    this.exportDataToCSV(selected, `selected_raw_materials_${new Date().toISOString().slice(0, 10)}.csv`);
    this.notificationService.success('Exported', `Exported ${selected.length} selected records.`);
  }

  // --- Live Batch Cost Calculator in Form ---
  get calculatedBatchAmount(): number {
    const w = Number(this.rawMaterialsForm.weight) || 0;
    const r = Number(this.rawMaterialsForm.rate) || 0;
    return Math.round(w * r * 100) / 100;
  }

  // --- Form Add/Edit/Delete Actions ---
  toggleAddForm(): void {
    this.isAddFormOpen = !this.isAddFormOpen;
    if (this.isAddFormOpen && !this.editingRawMaterialId) {
      this.resetForm();
    }
  }

  selectPresetMaterial(matName: string): void {
    this.rawMaterialsForm.materialName = matName;
  }

  editRawMaterial(rm: RawMaterialItem): void {
    this.editingRawMaterialId = rm.id || String(rm.rawMaterialId);
    this.rawMaterialsForm = {
      date: rm.date || new Date().toISOString().split('T')[0],
      materialName: rm.materialName || '',
      id: rm.vendor?.id ? String(rm.vendor.id) : (rm.vendor?.vendorId ? String(rm.vendor.vendorId) : ''),
      weight: rm.weight || 0,
      rate: rm.rate || 0,
      purchaseBillPath: rm.purchaseBillPath || '',
      weightSlipPath: rm.weightSlipPath || ''
    };
    this.isAddFormOpen = true;
    this.notificationService.info('Editing Batch', `Loaded batch #${rm.rawMaterialId || rm.id} for modification.`);
    setTimeout(() => {
      const el = document.getElementById('raw-material-form-container');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  cancelEdit(): void {
    this.isAddFormOpen = false;
    this.editingRawMaterialId = null;
    this.resetForm();
  }

  resetForm(): void {
    this.rawMaterialsForm = {
      date: new Date().toISOString().split('T')[0],
      materialName: 'Virgin HDPE Granules Grade 100',
      id: this.vendors.length > 0 ? String(this.vendors[0].id) : '',
      weight: 1000,
      rate: 95,
      purchaseBillPath: '',
      weightSlipPath: ''
    };
    this.editingRawMaterialId = null;
  }

  saveRawMaterial(): void {
    if (!this.rawMaterialsForm.date || !this.rawMaterialsForm.materialName || !this.rawMaterialsForm.id) {
      this.notificationService.warning('Validation Error', 'Please specify Date, Material Grade, and Vendor.');
      return;
    }
    if ((Number(this.rawMaterialsForm.weight) || 0) <= 0) {
      this.notificationService.warning('Invalid Weight', 'Net batch weight must be greater than zero.');
      return;
    }
    if ((Number(this.rawMaterialsForm.rate) || 0) <= 0) {
      this.notificationService.warning('Invalid Rate', 'Purchase rate per kg must be greater than zero.');
      return;
    }

    const vendor = this.vendors.find(v => String(v.id) === String(this.rawMaterialsForm.id) || String(v.vendorId) === String(this.rawMaterialsForm.id));
    if (!vendor) {
      this.notificationService.warning('Vendor Missing', 'Please select a valid supplier from the directory.');
      return;
    }

    const payload = {
      date: this.rawMaterialsForm.date,
      materialName: this.rawMaterialsForm.materialName,
      vendor: vendor,
      weight: Number(this.rawMaterialsForm.weight),
      rate: Number(this.rawMaterialsForm.rate),
      amount: this.calculatedBatchAmount,
      purchaseBillPath: this.rawMaterialsForm.purchaseBillPath || '',
      weightSlipPath: this.rawMaterialsForm.weightSlipPath || ''
    };

    if (this.editingRawMaterialId) {
      this.apiService.updateRawMaterial(this.editingRawMaterialId, payload).subscribe({
        next: () => {
          this.loadData();
          this.notificationService.success('Record Updated', `Batch updated successfully: ${this.rawMaterialsForm.materialName}`);
          this.logAudit(`Updated raw material procurement: ${this.rawMaterialsForm.materialName} (${this.rawMaterialsForm.weight} kg)`);
          this.cancelEdit();
        },
        error: (err) => {
          this.notificationService.error('Update Failed', err.error?.message || err.message);
        }
      });
    } else {
      this.apiService.createRawMaterial(payload).subscribe({
        next: (res) => {
          this.loadData();
          this.notificationService.success('Batch Logged', `New procurement batch logged: ${this.rawMaterialsForm.materialName}`);
          this.logAudit(`Added raw material procurement: ${this.rawMaterialsForm.materialName} from ${vendor.vendorName}`);
          this.cancelEdit();
        },
        error: (err) => {
          this.notificationService.error('Save Failed', err.error?.message || err.message);
        }
      });
    }
  }

  deleteRawMaterial(id: any): void {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', 'Only administrators can delete procurement records.');
      return;
    }

    this.notificationService.confirmAction(
      'Confirm Material Removal',
      'Are you sure you want to delete this raw material procurement record? This action will adjust stock calculations.',
      'Yes, Delete'
    ).then(confirmed => {
      if (confirmed) {
        this.apiService.deleteRawMaterial(String(id)).subscribe({
          next: () => {
            this.rawMaterialsList = this.rawMaterialsList.filter(x => (x.rawMaterialId ? String(x.rawMaterialId) : String(x.id)) !== String(id));
            this.notificationService.success('Batch Deleted', 'Procurement record deleted successfully.');
            this.logAudit(`Deleted raw material batch ID: ${id}`);
          },
          error: (err) => {
            this.notificationService.error('Delete Failed', err.error?.message || err.message);
          }
        });
      }
    });
  }

  // --- Inspection / GRN Modal ---
  openInspectionModal(rm: RawMaterialItem): void {
    this.selectedMaterialForInspection = rm;
    this.showInspectionModal = true;
  }

  closeInspectionModal(): void {
    this.showInspectionModal = false;
    this.selectedMaterialForInspection = null;
  }

  printInspectionNote(): void {
    window.print();
  }

  // --- Export Functionality ---
  toggleExportDropdown(): void {
    this.showExportDropdown = !this.showExportDropdown;
  }

  exportTableToCSV(): void {
    this.exportDataToCSV(this.filteredList, `futane_polymer_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    this.showExportDropdown = false;
  }

  exportTableToExcel(): void {
    const data = this.filteredList.map((rm, idx) => ({
      'Sr No': idx + 1,
      'Batch ID': rm.rawMaterialId || rm.id,
      'Purchase Date': rm.date,
      'Material Name': rm.materialName,
      'Category': this.getMaterialCategory(rm.materialName).label,
      'Supplier / Vendor': rm.vendor?.vendorName || 'N/A',
      'Supplier GSTIN': rm.vendor?.gstNumber || 'N/A',
      'Net Weight (kg)': rm.weight,
      'Unit Rate (₹/kg)': rm.rate,
      'Batch Value (₹)': rm.amount,
      'Purchase Bill Ref': rm.purchaseBillPath || 'N/A',
      'Weight Slip Ref': rm.weightSlipPath || 'N/A'
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Polymer Raw Materials');
    XLSX.writeFile(wb, `futane_raw_materials_ledger_${new Date().toISOString().slice(0, 10)}.xlsx`);
    this.showExportDropdown = false;
    this.notificationService.success('Export Complete', 'Downloaded polymer procurement excel sheet.');
  }

  private exportDataToCSV(dataList: RawMaterialItem[], filename: string): void {
    if (!dataList || dataList.length === 0) return;
    const headers = ['Batch ID', 'Date', 'Material Name', 'Category', 'Vendor', 'Weight (kg)', 'Rate (INR)', 'Amount (INR)', 'Bill Ref', 'Weight Slip'];
    const rows = dataList.map(rm => [
      `"${rm.rawMaterialId || rm.id || ''}"`,
      `"${rm.date || ''}"`,
      `"${(rm.materialName || '').replace(/"/g, '""')}"`,
      `"${this.getMaterialCategory(rm.materialName).label}"`,
      `"${(rm.vendor?.vendorName || '').replace(/"/g, '""')}"`,
      rm.weight || 0,
      rm.rate || 0,
      rm.amount || 0,
      `"${(rm.purchaseBillPath || '').replace(/"/g, '""')}"`,
      `"${(rm.weightSlipPath || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- Audit Logging ---
  logAudit(action: string): void {
    if (this.loggedInUser) {
      this.apiService.createAuditLog({
        username: this.loggedInUser.username || this.loggedInUser.sub || 'admin',
        action
      }).subscribe({ error: () => {} });
    }
  }

  // Helper
  private resolvePath(obj: any, path: string): any {
    if (!path) return '';
    return path.split('.').reduce((o, p) => o && o[p] != null ? o[p] : '', obj);
  }

  trackById(index: number, item: any): any {
    return item?.id ?? item?.rawMaterialId ?? index;
  }
}
