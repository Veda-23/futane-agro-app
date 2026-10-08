import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { TranslatePipe } from '../../../translate.service';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { ResizableTableDirective } from '../../../directives/resizable-table.directive';
import { IndianDatePipe } from '../../../pipes/indian-date.pipe';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { QrScannerModalComponent } from '../../shared/qr-scanner-modal/qr-scanner-modal.component';

import { SearchableSelectComponent } from '../../shared/searchable-select/searchable-select.component';

@Component({
  selector: 'app-dispatch',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    AutoSelectDirective,
    ResizableTableDirective,
    IndianDatePipe,
    EmptyStateComponent,
    QrScannerModalComponent,
    SearchableSelectComponent
  ],
  templateUrl: './dispatch.component.html',
  styleUrls: ['./dispatch.component.css']
})
export class DispatchComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'dispatch';
  @Input() loggedInUser: any = null;
  @Input() salesList: any[] = [];
  @Input() dispatchesList: any[] = [];
  @Output() onNavigateTab = new EventEmitter<string>();

  sales: any[] = [];
  dispatches: any[] = [];
  isLoading = false;
  hasError = false;
  showScannerModal = false;

  // Search & Filter
  searchQuery = '';
  statusFilter = 'ALL';

  // Table Configuration & Pagination
  tableDensity: 'compact' | 'comfortable' | 'spacious' = 'comfortable';
  currentPage = 1;
  pageSize = 10;
  sortField = 'id';
  sortAsc = false;
  selectedRowIds = new Set<any>();

  // Column Visibility
  showColDropdown = false;
  columnsVisibility: { [col: string]: boolean } = {};
  defaultCols = ['Manifest ID', 'Consignee & Order', 'Date', 'Vehicle', 'Driver', 'Destination', 'Status', 'Actions'];

  showExportMenu = false;
  Math = Math;

  // Form State
  editingDispatchId: any = null;
  isFormOpen = false;

  // Dossier Modal State
  showDispatchDossierModal = false;
  selectedDispatchForDossier: any = null;

  openDispatchDossier(d: any): void {
    this.selectedDispatchForDossier = d;
    this.showDispatchDossierModal = true;
  }

  closeDispatchDossier(): void {
    this.showDispatchDossierModal = false;
    this.selectedDispatchForDossier = null;
  }

  printDispatchDossier(): void {
    window.print();
  }

  toggleForm(): void {
    this.isFormOpen = !this.isFormOpen;
    if (!this.isFormOpen) {
      this.cancelEditDispatch();
    }
  }
  dispatchForm: {
    saleId: any;
    dispatchDate: string;
    vehicleNumber: string;
    driverName: string;
    deliveryAddress: string;
    dispatchStatus: string;
  } = {
    saleId: '',
    dispatchDate: new Date().toISOString().split('T')[0],
    vehicleNumber: '',
    driverName: '',
    deliveryAddress: '',
    dispatchStatus: 'Pending'
  };

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    try {
      localStorage.removeItem('cols_width_dispatch_registry_table');
    } catch (_) {}
    this.initColumns();
    this.loadData();
  }

  private initColumns(): void {
    this.defaultCols.forEach(col => this.columnsVisibility[col] = true);
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    forkJoin({
      sales: this.apiService.getSales(),
      dispatches: this.apiService.getDispatches()
    }).subscribe({
      next: ({ sales, dispatches }) => {
        this.sales = Array.isArray(sales) ? sales : (this.salesList || []);
        this.dispatches = Array.isArray(dispatches) ? dispatches : (this.dispatchesList || []);
        this.isLoading = false;
        this.selectedRowIds.clear();
      },
      error: (err) => {
        console.error('Failed to load dispatch data:', err);
        // Fallback to inputs if available
        if (this.dispatchesList && this.dispatchesList.length > 0) {
          this.dispatches = this.dispatchesList;
          this.sales = this.salesList || [];
          this.isLoading = false;
        } else {
          this.hasError = true;
          this.isLoading = false;
          this.notificationService.error('Load Error', 'Unable to retrieve dispatch manifests from server.');
        }
      }
    });
  }

  // --- Telemetry & KPI Computations ---
  get totalDispatchesCount(): number {
    return this.dispatches.length;
  }

  get inTransitDispatchesCount(): number {
    return this.dispatches.filter(d => {
      const s = (d.dispatchStatus || d.status || '').toLowerCase();
      return s === 'in transit' || s === 'on route';
    }).length;
  }

  get deliveredDispatchesCount(): number {
    return this.dispatches.filter(d => {
      const s = (d.dispatchStatus || d.status || '').toLowerCase();
      return s === 'delivered' || s === 'completed';
    }).length;
  }

  get pendingDispatchesCount(): number {
    return this.dispatches.filter(d => {
      const s = (d.dispatchStatus || d.status || '').toLowerCase();
      return !s || s === 'pending' || s === 'staged';
    }).length;
  }

  get totalCratesDispatched(): number {
    return this.dispatches.reduce((sum, d) => {
      const qty = Number(d.sale?.quantity || d.sale?.cratesCount || d.quantity || 0);
      return sum + qty;
    }, 0);
  }

  get filteredCratesTotal(): number {
    return this.filteredDispatches.reduce((sum, d) => {
      const qty = Number(d.sale?.quantity || d.sale?.cratesCount || d.quantity || 0);
      return sum + qty;
    }, 0);
  }

  formatManifestId(id: any): string {
    if (!id && id !== 0) return 'DSP-000';
    const str = String(id).trim();
    if (/^\d+$/.test(str)) {
      return `DSP-${str.padStart(4, '0')}`;
    }
    if (str.includes('-')) {
      const parts = str.split('-');
      return `DSP-${parts[0].toUpperCase()}`;
    }
    if (str.length > 8) {
      return `DSP-${str.slice(0, 8).toUpperCase()}`;
    }
    return `DSP-${str.toUpperCase()}`;
  }


  // Sales available to dispatch (not yet dispatched, or currently being edited)
  get availableSales(): any[] {
    const dispatchedSaleIds = new Set(
      this.dispatches
        .filter(d => d.id !== this.editingDispatchId)
        .map(d => String(d.sale?.id || d.saleId || ''))
    );
    return this.sales.filter(s => !dispatchedSaleIds.has(String(s.id)));
  }

  get selectableSales(): any[] {
    return this.availableSales.map(s => ({
      id: s.id,
      label: `${s.party?.partyName || s.partyName || 'Customer #' + s.id} — ${s.crateType || 'Crates'}`,
      subLabel: `${s.date || s.saleDate || ''} • Qty: ${s.quantity || s.cratesCount || 0}`
    }));
  }

  get selectedSaleDetails(): any {
    if (!this.dispatchForm.saleId) return null;
    return this.sales.find(s => String(s.id) === String(this.dispatchForm.saleId));
  }

  onSaleSelected(): void {
    const s = this.selectedSaleDetails;
    if (s && !this.dispatchForm.deliveryAddress) {
      this.dispatchForm.deliveryAddress = s.party?.address || s.party?.partyAddress || '';
    }
  }

  // --- Filtering & Sorting ---
  get filteredDispatches(): any[] {
    let list = [...this.dispatches];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(d =>
        (d.vehicleNumber || '').toLowerCase().includes(q) ||
        (d.driverName || '').toLowerCase().includes(q) ||
        (d.deliveryAddress || '').toLowerCase().includes(q) ||
        (d.sale?.party?.partyName || '').toLowerCase().includes(q) ||
        (d.sale?.crateType || '').toLowerCase().includes(q) ||
        String(d.id || '').includes(q)
      );
    }

    if (this.statusFilter !== 'ALL') {
      list = list.filter(d => {
        const status = (d.dispatchStatus || d.status || 'Pending').toLowerCase();
        return status === this.statusFilter.toLowerCase();
      });
    }

    return list.sort((a, b) => {
      const valA = this.resolveField(a, this.sortField);
      const valB = this.resolveField(b, this.sortField);
      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });
  }

  get paginatedDispatches(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredDispatches.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredDispatches.length / this.pageSize));
  }

  private resolveField(obj: any, path: string): any {
    if (!obj || !path) return '';
    return path.split('.').reduce((o, p) => (o && o[p] != null ? o[p] : ''), obj);
  }

  setSort(field: string): void {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = true;
    }
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  setStatusFilter(status: string): void {
    this.statusFilter = status;
    this.currentPage = 1;
  }

  // --- Permissions ---
  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  // --- CRUD: Dispatches ---
  saveDispatch(): void {
    if (this.isViewer()) {
      this.notificationService.warning('Permission Denied', 'Viewer role cannot register or modify shipments.');
      return;
    }

    if (!this.dispatchForm.saleId) {
      this.notificationService.warning('Validation Error', 'Please select a valid customer sales order.');
      return;
    }

    if (!this.dispatchForm.dispatchDate) {
      this.notificationService.warning('Validation Error', 'Dispatch manifest date is mandatory.');
      return;
    }

    if (!this.dispatchForm.vehicleNumber?.trim()) {
      this.notificationService.warning('Validation Error', 'Vehicle registration number is required.');
      return;
    }

    if (!this.dispatchForm.driverName?.trim()) {
      this.notificationService.warning('Validation Error', 'Assigned driver name is required.');
      return;
    }

    if (!this.dispatchForm.deliveryAddress?.trim()) {
      this.notificationService.warning('Validation Error', 'Delivery destination address is required.');
      return;
    }

    const sale = this.sales.find(s => String(s.id) === String(this.dispatchForm.saleId));
    const payload = {
      sale,
      saleId: this.dispatchForm.saleId,
      dispatchDate: this.dispatchForm.dispatchDate,
      vehicleNumber: this.dispatchForm.vehicleNumber.trim().toUpperCase(),
      driverName: this.dispatchForm.driverName.trim(),
      deliveryAddress: this.dispatchForm.deliveryAddress.trim(),
      dispatchStatus: this.dispatchForm.dispatchStatus || 'Pending'
    };

    if (this.editingDispatchId) {
      this.apiService.updateDispatch(String(this.editingDispatchId), payload).subscribe({
        next: () => {
          this.notificationService.success('Manifest Updated', `Dispatch manifest #${this.editingDispatchId} updated.`);
          this.logAudit(`Updated dispatch manifest ID: ${this.editingDispatchId}`);
          this.cancelEditDispatch();
          this.isFormOpen = false;
          this.loadData();
        },
        error: (err) => {
          console.error(err);
          this.notificationService.error('Update Failed', err.error?.message || 'Unable to update dispatch record.');
        }
      });
    } else {
      this.apiService.createDispatch(payload).subscribe({
        next: (created) => {
          this.notificationService.success('Dispatch Manifest Created', `Consignment for vehicle ${payload.vehicleNumber} registered.`);
          this.logAudit(`Created dispatch for vehicle: ${payload.vehicleNumber}`);
          this.resetForm();
          this.isFormOpen = false;
          this.loadData();
        },
        error: (err) => {
          console.error(err);
          this.notificationService.error('Creation Failed', err.error?.message || 'Unable to create dispatch manifest.');
        }
      });
    }
  }

  editDispatch(d: any): void {
    this.isFormOpen = true;
    this.editingDispatchId = d.id;
    this.dispatchForm = {
      saleId: d.sale?.id ? String(d.sale.id) : (d.saleId ? String(d.saleId) : ''),
      dispatchDate: d.dispatchDate || d.date || '',
      vehicleNumber: d.vehicleNumber || '',
      driverName: d.driverName || '',
      deliveryAddress: d.deliveryAddress || d.sale?.party?.partyAddress || '',
      dispatchStatus: d.dispatchStatus || d.status || 'Pending'
    };
    this.notificationService.info('Editing Manifest', `Loaded manifest for ${d.vehicleNumber} into form.`);
    const formPanel = document.querySelector('.feature-form-panel');
    if (formPanel) formPanel.scrollIntoView({ behavior: 'smooth' });
  }

  cancelEditDispatch(): void {
    this.editingDispatchId = null;
    this.isFormOpen = false;
    this.resetForm();
  }

  resetForm(): void {
    this.dispatchForm = {
      saleId: '',
      dispatchDate: new Date().toISOString().split('T')[0],
      vehicleNumber: '',
      driverName: '',
      deliveryAddress: '',
      dispatchStatus: 'Pending'
    };
  }

  deleteDispatch(id: any): void {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', 'Admin privileges required to remove dispatch manifests.');
      return;
    }

    this.notificationService.confirmAction(
      'Delete Dispatch Manifest',
      'Are you sure you want to permanently delete this logistics manifest?',
      'Yes, Delete'
    ).then((confirmed) => {
      if (confirmed) {
        this.apiService.deleteDispatch(String(id)).subscribe({
          next: () => {
            this.notificationService.success('Manifest Deleted', 'Dispatch manifest record has been removed.');
            this.logAudit(`Deleted dispatch ID: ${id}`);
            if (this.editingDispatchId === id) {
              this.cancelEditDispatch();
            }
            this.loadData();
          },
          error: (err) => {
            this.notificationService.error('Delete Failed', err.error?.message || 'Could not delete dispatch record.');
          }
        });
      }
    });
  }

  // --- QR Scanner Modal Integration ---
  openScanner(): void {
    this.showScannerModal = true;
  }

  closeScanner(): void {
    this.showScannerModal = false;
  }

  onQrScanned(code: string): void {
    this.showScannerModal = false;
    if (!code) return;

    const cleanCode = code.trim();
    const matchedSale = this.availableSales.find(s =>
      String(s.id) === cleanCode ||
      (s.invoiceNo && s.invoiceNo.toLowerCase().includes(cleanCode.toLowerCase()))
    );

    if (matchedSale) {
      this.dispatchForm.saleId = String(matchedSale.id);
      if (!this.dispatchForm.deliveryAddress && (matchedSale.party?.address || matchedSale.party?.partyAddress)) {
        this.dispatchForm.deliveryAddress = matchedSale.party.address || matchedSale.party.partyAddress;
      }
      this.notificationService.success('QR Scanned', `Matched Sale Order #${matchedSale.id} (${matchedSale.crateType})`);
    } else {
      this.notificationService.info('QR Decoded', `Scanned Value: ${cleanCode}`);
    }
  }

  // --- Row Selection & Bulk Actions ---
  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.filteredDispatches.forEach(item => this.selectedRowIds.add(item.id));
    } else {
      this.selectedRowIds.clear();
    }
  }

  toggleSelectRow(id: any, checked: boolean): void {
    if (checked) {
      this.selectedRowIds.add(id);
    } else {
      this.selectedRowIds.delete(id);
    }
  }

  isRowSelected(id: any): boolean {
    return this.selectedRowIds.has(id);
  }

  get isAllSelected(): boolean {
    return this.filteredDispatches.length > 0 && this.filteredDispatches.every(item => this.selectedRowIds.has(item.id));
  }

  clearSelection(): void {
    this.selectedRowIds.clear();
  }

  // --- Export Actions ---
  toggleExportMenu(): void {
    this.showExportMenu = !this.showExportMenu;
  }

  exportData(format: 'csv' | 'excel'): void {
    this.showExportMenu = false;
    const filename = `futane_dispatch_manifests_${new Date().toISOString().slice(0, 10)}.csv`;

    let data: any[] = [];
    if (this.selectedRowIds.size > 0) {
      data = this.dispatches.filter(item => this.selectedRowIds.has(item.id));
    } else {
      data = this.filteredDispatches;
    }

    if (data.length === 0) {
      this.notificationService.warning('Export Empty', 'No records found to export.');
      return;
    }

    let csvContent = 'Manifest ID,Customer Party,Crate Type,Dispatch Date,Vehicle Number,Driver Name,Delivery Address,Status\n';
    data.forEach(d => {
      const pName = d.sale?.party?.partyName || d.sale?.partyName || 'N/A';
      const cType = d.sale?.crateType || 'Standard';
      csvContent += `"${d.id || ''}","${pName}","${cType}","${d.dispatchDate || d.date || ''}","${d.vehicleNumber || ''}","${d.driverName || ''}","${(d.deliveryAddress || '').replace(/"/g, '""')}","${d.dispatchStatus || d.status || 'Pending'}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.notificationService.success('Export Successful', `Exported ${data.length} dispatch manifests.`);
  }

  // --- Column Visibility ---
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
    this.defaultCols.forEach(col => this.columnsVisibility[col] = true);
  }

  setDensity(density: 'compact' | 'comfortable' | 'spacious'): void {
    this.tableDensity = density;
  }

  private logAudit(action: string): void {
    if (this.loggedInUser) {
      this.apiService.createAuditLog({
        username: this.loggedInUser.username,
        action: `[Dispatch] ${action}`
      }).subscribe();
    }
  }

  trackById(index: number, item: any): any {
    return item?.id ?? index;
  }
}
