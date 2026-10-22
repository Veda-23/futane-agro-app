import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { ResizableTableDirective } from '../../../directives/resizable-table.directive';

export interface InventoryItem {
  id?: string | number;
  inventoryId?: number;
  crateType: string;
  materialType: string;
  openingStock: number;
  producedStock: number;
  soldStock: number;
  currentStock: number;
  unitPrice?: number;
  lastUpdated?: string | Date;
  warehouseZone?: string;
  category?: string;
}

/**
 * Finished Goods Inventory & Warehouse Stock Controller.
 *
 * Capabilities:
 * - Real-time finished goods stock tracking based on statutory ERP invariant:
 *     `currentStock = (openingStock + producedStock) - soldStock`
 * - Crate categorization: Fruit Crates, Vegetable Crates, Dairy Crates, Storage Crates.
 * - Stock health assessment: Healthy (>50 crates), Low Stock (1-50 crates), Stockout (0 crates).
 * - Real-time warehouse utilization and inventory valuation calculations.
 * - Dynamic column visibility, resizable column grids, and pagination management.
 */
@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, AutoSelectDirective, ResizableTableDirective],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'inventory';
  @Input() loggedInUser: any = null;
  @Output() onNavigateTab = new EventEmitter<string>();

  // ---- Data ----
  inventoryList: InventoryItem[] = [];
  rawMaterialsList: any[] = [];
  ppdList: any[] = [];
  Math = Math;

  // ---- Loading / Error state ----
  isLoading = false;
  hasError = false;

  // ---- Constants & Config ----
  readonly CRATE_RATE = 85; // Rs. per crate (standard default)
  readonly WAREHOUSE_CAPACITY = 50000; // Total warehouse crate capacity

  // ---- Subtabs ----
  selectedSubtab: 'all' | 'in-stock' | 'low' | 'vegetable' | 'dairy' | 'stockout' = 'all';

  // ---- Search & Filter ----
  searchQuery = '';
  filterMaterial = '';
  filterStockHealth = '';
  filterWarehouseZone = '';
  showFilterPopover = false;

  // ---- Table UI & Density ----
  tableDensity: 'compact' | 'comfortable' | 'spacious' = 'comfortable';
  showColDropdown: boolean = false;
  showExportDropdown: boolean = false;
  tableFilteredCounts: { [key: string]: number } = {};

  // ---- Column visibility ----
  defaultColumns = [
    'ID',
    'Crate Type',
    'Material',
    'Opening',
    'Produced',
    'Sold',
    'Available',
    'Valuation',
    'Health',
    'Warehouse Zone',
    'Last Updated',
    'Actions'
  ];
  columnVisibility: { [col: string]: boolean } = {};

  // ---- Pagination & Sort ----
  currentPage = 1;
  pageSize = 15;
  pageSizeOptions = [10, 15, 25, 50];
  sortField = 'id';
  sortAsc = true;

  // ---- Drawer: Add / Edit Entry ----
  isFormOpen = false;
  isEditing = false;
  isSaving = false;
  formErrors: { [key: string]: string } = {};
  formData: {
    id?: string | number;
    crateType: string;
    materialType: string;
    openingStock: number;
    producedStock: number;
    soldStock: number;
    unitPrice: number;
    warehouseZone: string;
  } = this.getEmptyForm();

  // ---- Modal: Stock Adjustment ----
  isAdjustmentOpen = false;
  isAdjusting = false;
  adjustItem: InventoryItem | null = null;
  adjustMode: 'add' | 'deduct' | 'reconcile' = 'add';
  adjustQuantity: number = 0;
  adjustReason: string = 'Physical stock audit';
  adjustNotes: string = '';

  // ---- Drawer: View Details ----
  isDetailsOpen = false;
  selectedItem: InventoryItem | null = null;
  detailsActiveTab: 'overview' | 'ledger' | 'burn' | 'valuation' = 'overview';

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.initColumns();
    this.loadData();
  }

  // Close dropdowns on outside click
  @HostListener('document:click', ['$event'])
  onDocumentClick() {
    this.showExportDropdown = false;
    this.showColDropdown = false;
    this.showFilterPopover = false;
  }

  initColumns() {
    this.defaultColumns.forEach(col => {
      this.columnVisibility[col] = true;
    });
  }

  // ======================================================
  // DATA LOADING
  // ======================================================

  loadData(silent = false) {
    if (!silent && this.inventoryList.length === 0) this.isLoading = true;
    this.hasError = false;

    this.apiService.getInventory().subscribe({
      next: (res: any[]) => {
        this.inventoryList = (res || []).map(item => this.normalizeItem(item));
        this.tableFilteredCounts['inventory'] = this.filteredList.length;
        this.isLoading = false;
        if (silent) {
          this.notificationService.success('Inventory Synced', 'Finished goods warehouse records updated from server.');
        }
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
        this.notificationService.error('Connection Error', 'Could not load finished goods warehouse inventory.');
      }
    });

    this.apiService.getRawMaterials().subscribe({
      next: (res: any[]) => { 
        this.rawMaterialsList = res || []; 
        this.computeShortfallPrediction();
      },
      error: () => { 
        this.rawMaterialsList = []; 
        this.computeShortfallPrediction();
      }
    });

    this.apiService.getPpd().subscribe({
      next: (res: any[]) => { 
        this.ppdList = res || []; 
        this.computeShortfallPrediction();
      },
      error: () => { 
        this.ppdList = []; 
        this.computeShortfallPrediction();
      }
    });
  }

  private normalizeItem(item: any): InventoryItem {
    const opening = Number(item.openingStock) || 0;
    const produced = Number(item.producedStock) || 0;
    const sold = Number(item.soldStock) || 0;
    // Calculated stock formula
    const current = opening + produced - sold;

    return {
      ...item,
      openingStock: opening,
      producedStock: produced,
      soldStock: sold,
      currentStock: item.currentStock !== undefined ? Number(item.currentStock) : current,
      unitPrice: Number(item.unitPrice) || this.CRATE_RATE,
      warehouseZone: item.warehouseZone || this.deriveWarehouseZone(item.crateType)
    };
  }

  private deriveWarehouseZone(crateType: string = ''): string {
    const lower = crateType.toLowerCase();
    if (lower.includes('veg') || lower.includes('tomato')) return 'Zone A - Vegetable Crate Staging';
    if (lower.includes('dairy') || lower.includes('milk')) return 'Zone B - Dairy Perforated Bay';
    if (lower.includes('heavy') || lower.includes('storage')) return 'Zone C - Heavy Duty Warehouse';
    return 'Zone D - Finished Goods Yard';
  }

  // ======================================================
  // PERMISSIONS
  // ======================================================

  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  // ======================================================
  // COMPUTED KPIs
  // ======================================================

  get totalAvailableStock(): number {
    return this.inventoryList.reduce((sum, i) => sum + (i.currentStock || 0), 0);
  }

  get totalInventoryValuation(): number {
    return this.inventoryList.reduce((sum, i) => {
      const stock = i.currentStock || 0;
      const rate = i.unitPrice || this.CRATE_RATE;
      return sum + stock * rate;
    }, 0);
  }

  get lowStockCount(): number {
    return this.inventoryList.filter(i => (i.currentStock || 0) < 200).length;
  }

  get outOfStockCount(): number {
    return this.inventoryList.filter(i => (i.currentStock || 0) === 0).length;
  }

  get warehouseCapacityPct(): number {
    const total = this.totalAvailableStock;
    return Math.min(100, Math.round((total / this.WAREHOUSE_CAPACITY) * 100));
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.filterMaterial) count++;
    if (this.filterStockHealth) count++;
    if (this.filterWarehouseZone) count++;
    if (this.selectedSubtab && this.selectedSubtab !== 'all') count++;
    return count;
  }

  // ======================================================
  // AI SHORTFALL PREDICTION
  // ======================================================

  materialShortfallPredictionList: any[] = [];

  computeShortfallPrediction() {
    const avgKgPerCrate = 1.85;
    const avgDailyProduction = this.calculateAvgDailyProduction();
    const dailyBurnKg = avgDailyProduction * avgKgPerCrate;

    this.materialShortfallPredictionList = (this.rawMaterialsList || []).map(rm => {
      const currentStock = rm.weight || rm.quantity || 0;
      const daysRemaining = dailyBurnKg > 0
        ? Math.floor(currentStock / dailyBurnKg)
        : 999;
      return {
        material: rm.materialName || rm.materialType || 'HDPE Granules',
        currentStock,
        burnoutRatePerDay: dailyBurnKg.toFixed(1),
        daysRemaining,
        riskLevel: daysRemaining <= 3 ? 'CRITICAL' : daysRemaining <= 7 ? 'WARNING' : 'HEALTHY'
      };
    });
  }

  get materialShortfallPrediction(): any[] {
    return this.materialShortfallPredictionList;
  }

  calculateAvgDailyProduction(): number {
    if (!this.ppdList || this.ppdList.length === 0) return 150;
    const slice = this.ppdList.slice(0, 14);
    const total = slice.reduce((sum, p) => sum + (p.totalProduction || p.successful || 0), 0);
    return Math.max(50, Math.round(total / Math.min(slice.length, 14)));
  }

  navigateToRawMaterials() {
    this.onNavigateTab.emit('raw-materials');
  }

  // ======================================================
  // SUBTABS
  // ======================================================

  setSubtab(tab: typeof this.selectedSubtab) {
    this.selectedSubtab = tab;
    this.currentPage = 1;
    this.tableFilteredCounts['inventory'] = this.filteredList.length;
  }

  getSubtabCount(tab: string): number {
    return this.applySubtabFilter(this.inventoryList, tab).length;
  }

  private applySubtabFilter(list: InventoryItem[], tab: string): InventoryItem[] {
    switch (tab) {
      case 'in-stock':   return list.filter(i => (i.currentStock || 0) > 0);
      case 'low':        return list.filter(i => (i.currentStock || 0) > 0 && (i.currentStock || 0) < 200);
      case 'vegetable':  return list.filter(i => (i.crateType || '').toLowerCase().includes('vegetable') || (i.crateType || '').toLowerCase().includes('veg'));
      case 'dairy':      return list.filter(i => (i.crateType || '').toLowerCase().includes('universal') || (i.crateType || '').toLowerCase().includes('storage') || (i.crateType || '').toLowerCase().includes('dairy') || (i.crateType || '').toLowerCase().includes('milk'));
      case 'stockout':   return list.filter(i => (i.currentStock || 0) === 0);
      default:           return list;
    }
  }

  // ======================================================
  // FILTERED & PAGINATED LIST
  // ======================================================

  // --- Filtering & Sorting (Memoized for 10,000+ Records) ---
  private _cachedInvFilterKey: string = '';
  private _cachedInvFilteredList: InventoryItem[] = [];
  private _cachedInvPageKey: string = '';
  private _cachedInvPaginatedList: InventoryItem[] = [];
  private _cachedInvTotalAvailable: number = 0;
  private _cachedInvTotalValuation: number = 0;

  get filteredList(): InventoryItem[] {
    const key = `${this.inventoryList.length}_${this.selectedSubtab}_${this.searchQuery}_${this.filterMaterial}_${this.filterStockHealth}_${this.filterWarehouseZone}_${this.sortField}_${this.sortAsc}`;
    if (key === this._cachedInvFilterKey && this._cachedInvFilteredList) {
      return this._cachedInvFilteredList;
    }

    let list = this.applySubtabFilter(this.inventoryList, this.selectedSubtab);

    if (this.searchQuery?.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      list = list.filter(i =>
        (i.id?.toString() || '').includes(q) ||
        (i.inventoryId?.toString() || '').includes(q) ||
        (i.crateType || '').toLowerCase().includes(q) ||
        (i.materialType || '').toLowerCase().includes(q) ||
        (i.warehouseZone || '').toLowerCase().includes(q)
      );
    }

    if (this.filterMaterial) {
      list = list.filter(i =>
        (i.materialType || '').toLowerCase().includes(this.filterMaterial.toLowerCase())
      );
    }

    if (this.filterStockHealth) {
      list = list.filter(i => this.getStockHealth(i).key === this.filterStockHealth);
    }

    if (this.filterWarehouseZone) {
      list = list.filter(i =>
        (i.warehouseZone || '').toLowerCase().includes(this.filterWarehouseZone.toLowerCase())
      );
    }

    const sorted = this.sortList(list);

    let sumStock = 0;
    let sumVal = 0;
    for (let i = 0; i < sorted.length; i++) {
      const itm = sorted[i];
      const stock = itm.currentStock || 0;
      sumStock += stock;
      sumVal += stock * (itm.unitPrice || this.CRATE_RATE);
    }
    this._cachedInvTotalAvailable = sumStock;
    this._cachedInvTotalValuation = sumVal;

    this._cachedInvFilterKey = key;
    this._cachedInvFilteredList = sorted;
    return this._cachedInvFilteredList;
  }

  get paginatedList(): InventoryItem[] {
    const list = this.filteredList;
    const pageKey = `${this._cachedInvFilterKey}_${this.currentPage}_${this.pageSize}`;
    if (pageKey === this._cachedInvPageKey && this._cachedInvPaginatedList) {
      return this._cachedInvPaginatedList;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    this._cachedInvPageKey = pageKey;
    this._cachedInvPaginatedList = list.slice(start, start + this.pageSize);
    return this._cachedInvPaginatedList;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredList.length / this.pageSize));
  }

  get filteredTotalAvailable(): number {
    this.filteredList;
    return this._cachedInvTotalAvailable;
  }

  get filteredTotalValuation(): number {
    this.filteredList;
    return this._cachedInvTotalValuation;
  }

  private sortList(list: InventoryItem[]): InventoryItem[] {
    return [...list].sort((a, b) => {
      const valA = this.resolvePath(a, this.sortField);
      const valB = this.resolvePath(b, this.sortField);
      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });
  }

  private resolvePath(obj: any, path: string): any {
    if (!path) return '';
    return path.split('.').reduce((o, p) => o && o[p] != null ? o[p] : '', obj);
  }

  // ======================================================
  // STOCK HEALTH
  // ======================================================

  getStockHealth(inv: InventoryItem): { key: string; label: string; badgeClass: string; icon: string } {
    const stock = inv.currentStock || 0;
    if (stock === 0)    return { key: 'stockout', label: 'Out of Stock', badgeClass: 'health-stockout', icon: 'bi-x-circle-fill' };
    if (stock < 200)    return { key: 'critical', label: 'Critical Low',  badgeClass: 'health-critical', icon: 'bi-exclamation-triangle-fill' };
    if (stock < 600)    return { key: 'low',      label: 'Low Stock',     badgeClass: 'health-low',      icon: 'bi-exclamation-circle-fill' };
    if (stock < 2500)   return { key: 'optimal',  label: 'Optimal',       badgeClass: 'health-optimal',  icon: 'bi-check-circle-fill' };
    return              { key: 'surplus',  label: 'Surplus',       badgeClass: 'health-surplus',  icon: 'bi-box-seam-fill' };
  }

  // ======================================================
  // SORT & DENSITY
  // ======================================================

  setSort(field: string) {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = true;
    }
    this.currentPage = 1;
  }

  setDensity(d: typeof this.tableDensity) {
    this.tableDensity = d;
  }

  // ======================================================
  // COLUMN MANAGER
  // ======================================================

  toggleColDropdown(table?: string) {
    this.showColDropdown = !this.showColDropdown;
    this.showExportDropdown = false;
    this.showFilterPopover = false;
  }

  isColumnVisible(colOrTable: string, col?: string): boolean {
    const key = col ? col : colOrTable;
    return this.columnVisibility[key] !== false;
  }

  toggleColumn(colOrTable: string, col?: string) {
    const key = col ? col : colOrTable;
    this.columnVisibility[key] = !this.columnVisibility[key];
  }

  getProcessedList(list: any[], table?: string): any[] {
    const res = this.filteredList;
    if (table) {
      this.tableFilteredCounts[table] = res.length;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    return res.slice(start, start + this.pageSize);
  }

  resetColumns() {
    this.defaultColumns.forEach(col => {
      this.columnVisibility[col] = true;
    });
  }

  get visibleColumnCount(): number {
    return this.defaultColumns.filter(col => this.columnVisibility[col]).length;
  }

  // ======================================================
  // FILTERS
  // ======================================================

  toggleFilterPopover(event: Event) {
    event.stopPropagation();
    this.showFilterPopover = !this.showFilterPopover;
    this.showColDropdown = false;
    this.showExportDropdown = false;
  }

  applyFilters() {
    this.currentPage = 1;
    this.showFilterPopover = false;
  }

  resetFilters() {
    this.filterMaterial = '';
    this.filterStockHealth = '';
    this.filterWarehouseZone = '';
    this.searchQuery = '';
    this.currentPage = 1;
    this.showFilterPopover = false;
  }

  private recountFilters() {
    // Computed dynamically via activeFilterCount getter
  }

  // ======================================================
  // ADD / EDIT DRAWER
  // ======================================================

  getEmptyForm() {
    return {
      crateType: '',
      materialType: 'HDPE Plastic',
      openingStock: 0,
      producedStock: 0,
      soldStock: 0,
      unitPrice: this.CRATE_RATE,
      warehouseZone: 'Zone A - Vegetable Crate Staging'
    };
  }

  get calculatedAvailable(): number {
    const op = Number(this.formData.openingStock) || 0;
    const pr = Number(this.formData.producedStock) || 0;
    const so = Number(this.formData.soldStock) || 0;
    return Math.max(0, op + pr - so);
  }

  openAddForm() {
    if (this.isViewer()) return;
    this.isEditing = false;
    this.formData = this.getEmptyForm();
    this.formErrors = {};
    this.isFormOpen = true;
  }

  openEditForm(item: InventoryItem) {
    if (this.isViewer()) return;
    this.isEditing = true;
    this.formData = {
      id: item.id,
      crateType: item.crateType || '',
      materialType: item.materialType || 'HDPE Plastic',
      openingStock: item.openingStock || 0,
      producedStock: item.producedStock || 0,
      soldStock: item.soldStock || 0,
      unitPrice: item.unitPrice || this.CRATE_RATE,
      warehouseZone: item.warehouseZone || this.deriveWarehouseZone(item.crateType)
    };
    this.formErrors = {};
    this.isFormOpen = true;
  }

  closeForm() {
    this.isFormOpen = false;
    this.isEditing = false;
    this.isSaving = false;
    this.formErrors = {};
  }

  validateForm(): boolean {
    this.formErrors = {};
    if (!this.formData.crateType || !this.formData.crateType.trim()) {
      this.formErrors['crateType'] = 'Crate type / SKU name is required.';
    }
    if (!this.formData.materialType || !this.formData.materialType.trim()) {
      this.formErrors['materialType'] = 'Material composition is required.';
    }
    if (this.formData.openingStock < 0) {
      this.formErrors['openingStock'] = 'Opening stock cannot be negative.';
    }
    if (this.formData.producedStock < 0) {
      this.formErrors['producedStock'] = 'Produced stock cannot be negative.';
    }
    if (this.formData.soldStock < 0) {
      this.formErrors['soldStock'] = 'Sold stock cannot be negative.';
    }
    return Object.keys(this.formErrors).length === 0;
  }

  saveStockEntry() {
    if (this.isViewer()) return;
    if (!this.validateForm()) {
      this.notificationService.warning('Validation Check', 'Please fill in all required fields accurately.');
      return;
    }

    this.isSaving = true;
    const payload = {
      crateType: this.formData.crateType.trim(),
      materialType: this.formData.materialType.trim(),
      openingStock: Number(this.formData.openingStock) || 0,
      producedStock: Number(this.formData.producedStock) || 0,
      soldStock: Number(this.formData.soldStock) || 0,
      unitPrice: Number(this.formData.unitPrice) || this.CRATE_RATE,
      warehouseZone: this.formData.warehouseZone
    };

    if (this.isEditing && this.formData.id) {
      this.apiService.updateInventory(String(this.formData.id), payload).subscribe({
        next: (saved) => {
          this.isSaving = false;
          this.closeForm();
          this.loadData(true);
          this.notificationService.success('Crate Stock Updated', `Finished goods record for "${saved.crateType}" saved.`);
        },
        error: () => {
          this.isSaving = false;
          this.notificationService.error('Save Failed', 'Could not update inventory record.');
        }
      });
    } else {
      this.apiService.createInventory(payload).subscribe({
        next: (created) => {
          this.isSaving = false;
          this.closeForm();
          this.loadData(true);
          this.notificationService.success('Stock Entry Created', `New finished goods crate SKU "${created.crateType}" added.`);
        },
        error: () => {
          this.isSaving = false;
          this.notificationService.error('Creation Failed', 'Could not create inventory record.');
        }
      });
    }
  }

  // ======================================================
  // STOCK ADJUSTMENT MODAL
  // ======================================================

  openAdjustmentModal(item?: InventoryItem) {
    if (this.isViewer()) return;
    this.adjustItem = item || (this.filteredList.length > 0 ? this.filteredList[0] : null);
    if (!this.adjustItem) {
      this.notificationService.warning('No Item Selected', 'Please select a crate SKU to adjust stock.');
      return;
    }
    this.adjustMode = 'add';
    this.adjustQuantity = 0;
    this.adjustReason = 'Physical stock audit';
    this.adjustNotes = '';
    this.isAdjustmentOpen = true;
  }

  closeAdjustmentModal() {
    this.isAdjustmentOpen = false;
    this.isAdjusting = false;
    this.adjustItem = null;
  }


  get calculatedAdjustedStock(): number {
    if (!this.adjustItem) return 0;
    const current = this.adjustItem.currentStock || 0;
    const qty = Math.max(0, Number(this.adjustQuantity) || 0);

    if (this.adjustMode === 'add') return current + qty;
    if (this.adjustMode === 'deduct') return Math.max(0, current - qty);
    if (this.adjustMode === 'reconcile') return qty;
    return current;
  }

  confirmStockAdjustment() {
    if (this.isViewer() || !this.adjustItem || !this.adjustItem.id) return;
    if (this.adjustQuantity <= 0 && this.adjustMode !== 'reconcile') {
      this.notificationService.warning('Invalid Quantity', 'Please enter a valid adjustment quantity greater than 0.');
      return;
    }

    this.isAdjusting = true;
    const targetStock = this.calculatedAdjustedStock;
    const opening = this.adjustItem.openingStock || 0;
    const sold = this.adjustItem.soldStock || 0;

    // Formula consistency: opening + produced - sold = targetStock
    const newProducedStock = Math.max(0, targetStock + sold - opening);

    const updatedPayload = {
      ...this.adjustItem,
      producedStock: newProducedStock,
      lastUpdated: new Date().toISOString()
    };

    this.apiService.updateInventory(String(this.adjustItem.id), updatedPayload).subscribe({
      next: () => {
        this.isAdjusting = false;
        const msg = `${this.adjustItem?.crateType} stock adjusted to ${targetStock} units (${this.adjustReason}).`;
        this.closeAdjustmentModal();
        this.loadData(true);
        this.notificationService.success('Stock Adjustment Recorded', msg);
      },
      error: () => {
        this.isAdjusting = false;
        this.notificationService.error('Adjustment Failed', 'Could not record stock adjustment on server.');
      }
    });
  }

  // ======================================================
  // DELETE STOCK RECORD
  // ======================================================

  async deleteStockEntry(item: InventoryItem) {
    if (!this.canDelete() || !item.id) return;

    const confirmed = await this.notificationService.confirmAction(
      `Delete Crate SKU "${item.crateType}"?`,
      `This will permanently remove the finished goods crate ledger record for SKU #${item.id}. This action cannot be reversed.`,
      'Yes, Delete Record'
    );

    if (confirmed) {
      this.apiService.deleteInventory(String(item.id)).subscribe({
        next: () => {
          this.loadData(true);
          this.notificationService.success('Record Deleted', `Crate SKU "${item.crateType}" removed from inventory.`);
        },
        error: () => {
          this.notificationService.error('Deletion Failed', 'Could not delete crate inventory record.');
        }
      });
    }
  }

  // ======================================================
  // VIEW DETAILS DRAWER
  // ======================================================

  openDetails(item: InventoryItem) {
    this.selectedItem = item;
    this.detailsActiveTab = 'overview';
    this.isDetailsOpen = true;
  }

  closeDetails() {
    this.isDetailsOpen = false;
    this.selectedItem = null;
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.isDetailsOpen) {
      this.closeDetails();
    } else if (this.isFormOpen) {
      this.closeForm();
    } else if (this.isAdjustmentOpen) {
      this.closeAdjustmentModal();
    }
  }

  formatSkuBadge(item: any): string {
    if (!item) return '';
    const rawId = String(item.id ?? item.inventoryId ?? '');
    if (!rawId) return 'SKU-CR-001';
    if (rawId.toUpperCase().startsWith('CR-') || rawId.toUpperCase().startsWith('SKU-')) {
      return rawId.toUpperCase();
    }
    if (rawId.includes('-') || rawId.length > 8) {
      const clean = rawId.replace(/[^a-zA-Z0-9]/g, '');
      const prefix = clean.substring(0, 6).toUpperCase();
      return `SKU-CR-${prefix}`;
    }
    return `SKU-CR-${rawId.padStart(3, '0')}`;
  }

  formatShortId(id: any): string {
    if (!id && id !== 0) return '';
    const str = String(id);
    if (str.toUpperCase().startsWith('CR-') || str.toUpperCase().startsWith('SKU-')) {
      return str.toUpperCase();
    }
    if (str.includes('-') || str.length > 8) {
      const clean = str.replace(/[^a-zA-Z0-9]/g, '');
      return clean.substring(0, 6).toUpperCase();
    }
    return str;
  }

  // ======================================================
  // EXPORT
  // ======================================================

  toggleExportDropdown(event?: Event) {
    if (event) event.stopPropagation();
    this.showExportDropdown = !this.showExportDropdown;
    this.showColDropdown = false;
    this.showFilterPopover = false;
  }

  exportToCSV() {
    const headers = this.defaultColumns.filter(col => col !== 'Actions' && this.isColumnVisible(col));
    const rows = this.filteredList.map(inv => {
      return headers.map(col => {
        switch (col) {
          case 'ID': return inv.id ?? inv.inventoryId ?? '';
          case 'Crate Type': return inv.crateType ?? '';
          case 'Material': return inv.materialType ?? '';
          case 'Opening': return inv.openingStock ?? 0;
          case 'Produced': return inv.producedStock ?? 0;
          case 'Sold': return inv.soldStock ?? 0;
          case 'Available': return inv.currentStock ?? 0;
          case 'Valuation': return ((inv.currentStock || 0) * (inv.unitPrice || this.CRATE_RATE)).toFixed(0);
          case 'Health': return this.getStockHealth(inv).label;
          case 'Warehouse Zone': return inv.warehouseZone ?? '';
          case 'Last Updated': return inv.lastUpdated ?? '';
          default: return '';
        }
      });
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finished_goods_inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.showExportDropdown = false;
    this.notificationService.success('CSV Downloaded', 'Finished goods stock records exported.');
  }

  async exportToExcel() {
    const data = this.filteredList.map(inv => ({
      'Crate ID': inv.id ?? inv.inventoryId,
      'Crate Type / Description': inv.crateType,
      'Polymer Material': inv.materialType,
      'Opening Stock (Crates)': inv.openingStock,
      'Total Produced (Receipts)': inv.producedStock,
      'Total Sold (Dispatches)': inv.soldStock,
      'Available Warehouse Stock': inv.currentStock,
      'Unit Price (INR)': inv.unitPrice || this.CRATE_RATE,
      'Total Valuation (INR)': (inv.currentStock || 0) * (inv.unitPrice || this.CRATE_RATE),
      'Stock Health Status': this.getStockHealth(inv).label,
      'Warehouse Bay / Zone': inv.warehouseZone,
      'Last Audit / Update': inv.lastUpdated || 'N/A'
    }));

    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Warehouse Stock');
    XLSX.writeFile(wb, `finished_goods_crates_stock_${new Date().toISOString().slice(0, 10)}.xlsx`);

    this.showExportDropdown = false;
    this.notificationService.success('Excel Generated', 'Finished goods inventory workbook exported.');
  }

  // ======================================================
  // MISC
  // ======================================================

  trackById(index: number, item: any): any {
    return item?.id ?? item?.inventoryId ?? index;
  }
}
