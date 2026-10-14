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

export interface VendorItem {
  id?: string;
  vendorId?: number;
  vendorName: string;
  mobile?: string | null;
  address?: string | null;
  gstNumber?: string | null;
  email?: string | null;
  contactPerson?: string | null;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

export interface VendorProcurementSummary {
  batchesCount: number;
  totalWeightKg: number;
  totalSpendAmount: number;
  materialsList: string[];
}

@Component({
  selector: 'app-vendors',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    ResizableTableDirective,
    IndianDatePipe
  ],
  templateUrl: './vendors.component.html',
  styleUrls: ['./vendors.component.css']
})
export class VendorsComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'vendors';
  @Input() loggedInUser: any = null;
  @Output() onNavigateTab = new EventEmitter<string>();

  // State
  isLoading: boolean = true;
  hasError: boolean = false;
  vendorsList: VendorItem[] = [];
  rawMaterialsList: any[] = [];

  // Subtabs Classification
  selectedSubtab: string = 'all';

  // Search & Filter
  searchQuery: string = '';
  filterGstStatus: string = '';
  filterCategory: string = '';
  filterLocation: string = '';
  filterHasProcurements: string = '';
  showFilterPopover: boolean = false;
  activeFilterCount: number = 0;

  // Density & Columns
  tableDensity: 'compact' | 'comfortable' | 'spacious' = 'comfortable';
  showColDropdown: boolean = false;
  showExportDropdown: boolean = false;

  columnsVisibility: { [col: string]: boolean } = {
    'Select': true,
    'Code': true,
    'Supplier': true,
    'Category': true,
    'Contact': true,
    'Location': true,
    'GSTIN': true,
    'Procurements': true,
    'Spend': true,
    'Actions': true
  };

  defaultColumns = ['Code', 'Supplier', 'Category', 'Contact', 'Location', 'GSTIN', 'Procurements', 'Spend', 'Actions'];

  // Selection
  selectedRows: Set<string> = new Set();

  // Pagination & Sorting
  currentPage: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [10, 25, 50];
  sortField: string = 'vendorName';
  sortAsc: boolean = true;

  // Add / Edit Form (Collapsible Panel)
  isAddFormOpen: boolean = false;
  editingVendorId: string | null = null;
  vendorForm = {
    vendorName: '',
    mobile: '',
    address: '',
    gstNumber: '',
    email: '',
    contactPerson: '',
    category: 'Polymer & Granules'
  };

  // Supplier Categories
  supplierCategories: string[] = [
    'Polymer & Granules',
    'Masterbatch & Additives',
    'Packaging & Crates',
    'Machinery Spares & Consumables',
    'General Industrial Goods'
  ];

  // Supplier Profile Dossier Modal
  showDossierModal: boolean = false;
  selectedVendorForDossier: VendorItem | null = null;

  Math = Math;

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    try {
      localStorage.removeItem('cols_width_vendor_table');
      localStorage.removeItem('cols_width_vendors_table');
    } catch (e) {
      // ignore
    }
    this.loadData();
  }

  // Click outside listener
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

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKeyDown(event: KeyboardEvent): void {
    if (this.showDossierModal) {
      this.closeDossierModal();
    } else if (this.isAddFormOpen) {
      this.cancelEdit();
    }
  }

  formatVendorDisplayCode(id: any): string {
    if (!id) return '';
    const str = String(id);
    if (str.length > 8) {
      return `#VND-${str.substring(0, 6).toUpperCase()}`;
    }
    return `#VND-${str.toUpperCase()}`;
  }

  loadData(notify: boolean = false): void {
    if (this.vendorsList.length === 0) this.isLoading = true;
    this.hasError = false;

    forkJoin({
      vendors: this.apiService.getVendors().pipe(catchError(() => of([]))),
      rawMaterials: this.apiService.getRawMaterials().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ vendors, rawMaterials }) => {
        this.vendorsList = (vendors || []).map((v: any) => ({
          ...v,
          id: v.id || String(v.vendorId)
        }));
        this.rawMaterialsList = rawMaterials || [];
        this.isLoading = false;
        this.updateActiveFilterCount();

        if (notify) {
          this.notificationService.success('Refreshed', `Loaded ${this.vendorsList.length} approved vendors.`);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.hasError = true;
        this.notificationService.error('Load Failed', 'Could not load vendor directory data.');
      }
    });
  }

  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  // Helper to clean display names that might have trailing timestamps
  getCleanVendorName(name: string | null | undefined): string {
    if (!name) return 'Unknown Vendor';
    return name.replace(/\s+\d{6,}\s*$/, '').trim();
  }

  // --- Telemetry Calculations ---
  get totalVendorsCount(): number {
    return this.vendorsList.length;
  }

  get gstRegisteredCount(): number {
    return this.vendorsList.filter(v => v.gstNumber && v.gstNumber.trim().length >= 10).length;
  }

  get gstCompliancePercentage(): number {
    if (!this.totalVendorsCount) return 0;
    return Math.round((this.gstRegisteredCount / this.totalVendorsCount) * 100);
  }

  get activeSuppliersCount(): number {
    const activeIds = new Set(this.rawMaterialsList.map(rm => rm.vendor?.id || rm.vendor?.vendorId).filter(Boolean));
    return activeIds.size;
  }

  get totalProcurementVolumeKg(): number {
    return this.rawMaterialsList.reduce((sum, rm) => sum + (Number(rm.weight) || 0), 0);
  }

  get totalProcurementSpend(): number {
    return this.rawMaterialsList.reduce((sum, rm) => sum + (Number(rm.amount) || ((Number(rm.weight) || 0) * (Number(rm.rate) || 0))), 0);
  }

  // --- Linkage per Vendor ---
  getVendorProcurementSummary(vendorId: string | number | undefined): VendorProcurementSummary {
    if (!vendorId) return { batchesCount: 0, totalWeightKg: 0, totalSpendAmount: 0, materialsList: [] };
    const matches = this.rawMaterialsList.filter(rm => {
      const vId = rm.vendor?.id || rm.vendor?.vendorId;
      return String(vId) === String(vendorId);
    });

    const totalWeight = matches.reduce((sum, rm) => sum + (Number(rm.weight) || 0), 0);
    const totalSpend = matches.reduce((sum, rm) => sum + (Number(rm.amount) || ((Number(rm.weight) || 0) * (Number(rm.rate) || 0))), 0);
    const materials = Array.from(new Set(matches.map(rm => rm.materialName).filter(Boolean)));

    return {
      batchesCount: matches.length,
      totalWeightKg: totalWeight,
      totalSpendAmount: totalSpend,
      materialsList: materials
    };
  }

  // --- Supplier Category Inference ---
  getSupplierCategory(vendor: VendorItem): { key: string; label: string; badgeClass: string; icon: string } {
    const name = (vendor.vendorName || '').toLowerCase();
    const summary = this.getVendorProcurementSummary(vendor.id || vendor.vendorId);
    const materialsStr = summary.materialsList.join(' ').toLowerCase();

    if (name.includes('nilkamal') || name.includes('crate') || name.includes('carton') || materialsStr.includes('carton') || materialsStr.includes('sheet')) {
      return { key: 'packaging', label: 'Packaging & Crates', badgeClass: 'cat-badge-packaging', icon: 'bi-box-seam' };
    }
    if (name.includes('colour') || name.includes('pigment') || name.includes('additive') || materialsStr.includes('masterbatch') || materialsStr.includes('pigment') || materialsStr.includes('stabilizer')) {
      return { key: 'additives', label: 'Color & Additives', badgeClass: 'cat-badge-additive', icon: 'bi-palette-fill' };
    }
    if (name.includes('polymer') || name.includes('poly') || name.includes('resin') || materialsStr.includes('hdpe') || materialsStr.includes('pp')) {
      return { key: 'polymer', label: 'Polymer & Resin', badgeClass: 'cat-badge-polymer', icon: 'bi-boxes' };
    }
    return { key: 'general', label: 'General Industrial', badgeClass: 'cat-badge-default', icon: 'bi-building' };
  }

  // --- Subtabs Filter ---
  setSubtab(tabKey: string): void {
    this.selectedSubtab = tabKey;
    this.currentPage = 1;
  }

  getSubtabCount(tabKey: string): number {
    if (tabKey === 'all') return this.vendorsList.length;
    if (tabKey === 'gst') {
      return this.vendorsList.filter(v => v.gstNumber && v.gstNumber.trim().length >= 10).length;
    }
    if (tabKey === 'unregistered') {
      return this.vendorsList.filter(v => !v.gstNumber || v.gstNumber.trim().length < 10).length;
    }
    return this.vendorsList.filter(v => this.getSupplierCategory(v).key === tabKey).length;
  }

  // --- Filtering & Sorting ---
  get filteredList(): VendorItem[] {
    let result = [...this.vendorsList];

    // Subtab filter
    if (this.selectedSubtab !== 'all') {
      if (this.selectedSubtab === 'gst') {
        result = result.filter(v => v.gstNumber && v.gstNumber.trim().length >= 10);
      } else if (this.selectedSubtab === 'unregistered') {
        result = result.filter(v => !v.gstNumber || v.gstNumber.trim().length < 10);
      } else {
        result = result.filter(v => this.getSupplierCategory(v).key === this.selectedSubtab);
      }
    }

    // Text search
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      result = result.filter(v => {
        const name = (v.vendorName || '').toLowerCase();
        const gst = (v.gstNumber || '').toLowerCase();
        const mob = (v.mobile || '').toLowerCase();
        const addr = (v.address || '').toLowerCase();
        const id = String(v.vendorId || v.id || '').toLowerCase();
        return name.includes(q) || gst.includes(q) || mob.includes(q) || addr.includes(q) || id.includes(q);
      });
    }

    // Popover Filters
    if (this.filterGstStatus === 'registered') {
      result = result.filter(v => v.gstNumber && v.gstNumber.trim().length >= 10);
    } else if (this.filterGstStatus === 'unregistered') {
      result = result.filter(v => !v.gstNumber || v.gstNumber.trim().length < 10);
    }

    if (this.filterCategory) {
      result = result.filter(v => this.getSupplierCategory(v).key === this.filterCategory);
    }

    if (this.filterHasProcurements === 'yes') {
      result = result.filter(v => this.getVendorProcurementSummary(v.id || v.vendorId).batchesCount > 0);
    } else if (this.filterHasProcurements === 'no') {
      result = result.filter(v => this.getVendorProcurementSummary(v.id || v.vendorId).batchesCount === 0);
    }

    if (this.filterLocation.trim()) {
      const loc = this.filterLocation.trim().toLowerCase();
      result = result.filter(v => (v.address || '').toLowerCase().includes(loc));
    }

    // Sorting
    result.sort((a: any, b: any) => {
      let valA: any = a[this.sortField];
      let valB: any = b[this.sortField];

      if (this.sortField === 'procurementAmount') {
        valA = this.getVendorProcurementSummary(a.id || a.vendorId).totalSpendAmount;
        valB = this.getVendorProcurementSummary(b.id || b.vendorId).totalSpendAmount;
      }

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

  get paginatedList(): VendorItem[] {
    const list = this.filteredList;
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredList.length / this.pageSize) || 1;
  }

  // Summary Row Calculations
  get filteredGstCount(): number {
    return this.filteredList.filter(v => v.gstNumber && v.gstNumber.trim().length >= 10).length;
  }

  get filteredTotalSpend(): number {
    return this.filteredList.reduce((sum, v) => sum + this.getVendorProcurementSummary(v.id || v.vendorId).totalSpendAmount, 0);
  }

  get filteredTotalBatches(): number {
    return this.filteredList.reduce((sum, v) => sum + this.getVendorProcurementSummary(v.id || v.vendorId).batchesCount, 0);
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
    if (this.filterGstStatus) count++;
    if (this.filterCategory) count++;
    if (this.filterHasProcurements) count++;
    if (this.filterLocation.trim()) count++;
    this.activeFilterCount = count;
  }

  applyFilters(): void {
    this.updateActiveFilterCount();
    this.currentPage = 1;
    this.showFilterPopover = false;
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.filterGstStatus = '';
    this.filterCategory = '';
    this.filterHasProcurements = '';
    this.filterLocation = '';
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

  // --- Row Selection & Bulk Actions ---
  toggleSelectAll(): void {
    const pageItems = this.paginatedList;
    const allSelected = pageItems.every(v => this.selectedRows.has(v.id || String(v.vendorId)));
    if (allSelected) {
      pageItems.forEach(v => this.selectedRows.delete(v.id || String(v.vendorId)));
    } else {
      pageItems.forEach(v => this.selectedRows.add(v.id || String(v.vendorId)));
    }
  }

  isAllSelected(): boolean {
    const pageItems = this.paginatedList;
    if (pageItems.length === 0) return false;
    return pageItems.every(v => this.selectedRows.has(v.id || String(v.vendorId)));
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
    const selected = this.vendorsList.filter(v => this.selectedRows.has(v.id || String(v.vendorId)));
    if (selected.length === 0) return;
    this.exportDataToCSV(selected, `selected_suppliers_${new Date().toISOString().slice(0, 10)}.csv`);
    this.notificationService.success('Exported', `Exported ${selected.length} selected supplier records.`);
  }

  // --- Add / Edit Form Actions ---
  toggleAddForm(): void {
    this.isAddFormOpen = !this.isAddFormOpen;
    if (this.isAddFormOpen && !this.editingVendorId) {
      this.resetForm();
    }
  }

  openAddForm(): void {
    this.editingVendorId = null;
    this.resetForm();
    this.isAddFormOpen = true;
  }

  editVendor(vendor: VendorItem): void {
    this.editingVendorId = vendor.id || String(vendor.vendorId);
    this.vendorForm = {
      vendorName: vendor.vendorName || '',
      mobile: vendor.mobile || '',
      address: vendor.address || '',
      gstNumber: vendor.gstNumber || '',
      email: vendor.email || '',
      contactPerson: vendor.contactPerson || '',
      category: this.getSupplierCategory(vendor).label
    };
    this.isAddFormOpen = true;
    this.notificationService.info('Editing Supplier', `Loaded vendor: ${this.getCleanVendorName(vendor.vendorName)}`);
    setTimeout(() => {
      const el = document.querySelector('.erp-drawer') as HTMLElement;
      if (el) {
        const firstInput = el.querySelector('input:not([disabled])') as HTMLElement;
        if (firstInput) firstInput.focus();
      }
    }, 60);
  }

  cancelEdit(): void {
    this.isAddFormOpen = false;
    this.editingVendorId = null;
    this.resetForm();
  }

  resetForm(): void {
    this.vendorForm = {
      vendorName: '',
      mobile: '',
      address: '',
      gstNumber: '',
      email: '',
      contactPerson: '',
      category: 'Polymer & Granules'
    };
    this.editingVendorId = null;
  }

  formatGstInput(): void {
    if (this.vendorForm.gstNumber) {
      this.vendorForm.gstNumber = this.vendorForm.gstNumber.toUpperCase().trim();
    }
  }

  saveVendor(): void {
    if (!this.vendorForm.vendorName || !this.vendorForm.vendorName.trim()) {
      this.notificationService.warning('Validation Error', 'Supplier / Company name is required.');
      return;
    }
    if (!this.vendorForm.mobile || !this.vendorForm.mobile.trim()) {
      this.notificationService.warning('Validation Error', 'Supplier primary contact number is required.');
      return;
    }

    const payload = {
      vendorName: this.vendorForm.vendorName.trim(),
      mobile: this.vendorForm.mobile.trim(),
      address: this.vendorForm.address ? this.vendorForm.address.trim() : '',
      gstNumber: this.vendorForm.gstNumber ? this.vendorForm.gstNumber.trim().toUpperCase() : ''
    };

    if (this.editingVendorId) {
      this.apiService.updateVendor(this.editingVendorId, payload).subscribe({
        next: () => {
          this.loadData();
          this.notificationService.success('Profile Updated', `Updated supplier: ${payload.vendorName}`);
          this.logAudit(`Updated vendor profile: ${payload.vendorName}`);
          this.cancelEdit();
        },
        error: (err) => {
          this.notificationService.error('Update Failed', err.error?.message || err.message);
        }
      });
    } else {
      this.apiService.createVendor(payload).subscribe({
        next: () => {
          this.loadData();
          this.notificationService.success('Vendor Registered', `New supplier registered: ${payload.vendorName}`);
          this.logAudit(`Registered new supplier: ${payload.vendorName} (GST: ${payload.gstNumber || 'Unregistered'})`);
          this.cancelEdit();
        },
        error: (err) => {
          this.notificationService.error('Registration Failed', err.error?.message || err.message);
        }
      });
    }
  }

  deleteVendor(id: any): void {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', 'Only administrators can remove registered vendors.');
      return;
    }

    this.notificationService.confirmAction(
      'Confirm Vendor Removal',
      'Are you sure you want to delete this supplier from the directory? Linked raw material procurement references will be preserved.',
      'Yes, Remove'
    ).then(confirmed => {
      if (confirmed) {
        this.apiService.deleteVendor(String(id)).subscribe({
          next: () => {
            this.vendorsList = this.vendorsList.filter(v => (v.vendorId ? String(v.vendorId) : String(v.id)) !== String(id));
            this.notificationService.success('Vendor Removed', 'Supplier deleted from vendor registry.');
            this.logAudit(`Deleted vendor ID: ${id}`);
          },
          error: (err) => {
            this.notificationService.error('Delete Failed', err.error?.message || err.message);
          }
        });
      }
    });
  }

  // --- Supplier Dossier / Profile Modal ---
  openDossierModal(vendor: VendorItem): void {
    this.selectedVendorForDossier = vendor;
    this.showDossierModal = true;
  }

  closeDossierModal(): void {
    this.showDossierModal = false;
    this.selectedVendorForDossier = null;
  }

  printDossier(): void {
    window.print();
  }

  // --- Export Functionality ---
  toggleExportDropdown(): void {
    this.showExportDropdown = !this.showExportDropdown;
  }

  exportTableToCSV(): void {
    this.exportDataToCSV(this.filteredList, `futane_vendor_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    this.showExportDropdown = false;
  }

  exportTableToExcel(): void {
    const data = this.filteredList.map((v, idx) => {
      const summary = this.getVendorProcurementSummary(v.id || v.vendorId);
      return {
        'Sr No': idx + 1,
        'Vendor ID': v.vendorId || v.id,
        'Supplier Name': this.getCleanVendorName(v.vendorName),
        'Category': this.getSupplierCategory(v).label,
        'Contact Mobile': v.mobile || 'N/A',
        'GSTIN Number': v.gstNumber || 'Unregistered',
        'Plant Address': v.address || 'N/A',
        'Procurement Batches': summary.batchesCount,
        'Total Supplied (kg)': summary.totalWeightKg,
        'Total Billing Value (₹)': summary.totalSpendAmount
      };
    });

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Polymer Suppliers');
    XLSX.writeFile(wb, `futane_suppliers_directory_${new Date().toISOString().slice(0, 10)}.xlsx`);
    this.showExportDropdown = false;
    this.notificationService.success('Export Complete', 'Downloaded supplier directory excel sheet.');
  }

  private exportDataToCSV(dataList: VendorItem[], filename: string): void {
    if (!dataList || dataList.length === 0) return;
    const headers = ['Vendor ID', 'Supplier Name', 'Category', 'Mobile', 'GSTIN', 'Address', 'Batches', 'Supplied Weight (kg)', 'Total Spend (INR)'];
    const rows = dataList.map(v => {
      const summary = this.getVendorProcurementSummary(v.id || v.vendorId);
      return [
        `"${v.vendorId || v.id || ''}"`,
        `"${this.getCleanVendorName(v.vendorName).replace(/"/g, '""')}"`,
        `"${this.getSupplierCategory(v).label}"`,
        `"${v.mobile || ''}"`,
        `"${v.gstNumber || ''}"`,
        `"${(v.address || '').replace(/"/g, '""')}"`,
        summary.batchesCount,
        summary.totalWeightKg,
        summary.totalSpendAmount
      ];
    });

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

  trackById(index: number, item: any): any {
    return item?.id ?? item?.vendorId ?? index;
  }
}
