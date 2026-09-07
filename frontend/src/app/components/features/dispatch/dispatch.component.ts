import { Component, OnInit, Input } from '@angular/core';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { NotificationService } from '../../../services/notification.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';

import { QrScannerModalComponent } from '../../shared/qr-scanner-modal/qr-scanner-modal.component';

import { forkJoin } from 'rxjs';

import { ResizableTableDirective } from '../../../directives/resizable-table.directive';
import { IndianDatePipe } from '../../../pipes/indian-date.pipe';

@Component({
  selector: 'app-dispatch',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, AutoSelectDirective, FormStateDirective, QrScannerModalComponent, ResizableTableDirective, IndianDatePipe],
  templateUrl: './dispatch.component.html',
  styleUrls: ['./dispatch.component.css']
})
export class DispatchComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'dispatch';
  @Input() loggedInUser: any = null;

  isLoading = true;
  hasError = false;
  showScannerModal = false;

  salesList: any[] = [];
  dispatchesList: any[] = [];
  dispatchForm = { id: '', dispatchDate: '', vehicleNumber: '', driverName: '', deliveryAddress: '', dispatchStatus: 'Pending' };

  Math = Math;

  // Pagination & Sort state
  currentPage = 1;
  pageSize = 10;
  sortField = 'id';
  sortAsc = false;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  defaultCols = ['Sale', 'Date', 'Vehicle', 'Driver', 'Status', 'Actions'];

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadData();
    this.columnsVisibility['dispatch'] = {};
    this.defaultCols.forEach(col => this.columnsVisibility['dispatch'][col] = true);
  }

  loadData() {
    this.isLoading = true;
    this.hasError = false;
    forkJoin({
      sales: this.apiService.getSales(),
      dispatches: this.apiService.getDispatches()
    }).subscribe({
      next: ({ sales, dispatches }) => {
        this.salesList = sales || [];
        this.dispatchesList = dispatches || [];
        this.tableFilteredCounts['dispatch'] = this.dispatchesList.length;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.hasError = true;
        this.notificationService.showValidationError('Could not load dispatch data.');
      }
    });
  }

  isViewer() {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete() {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  get availableSalesForDispatch(): any[] {
    const dispatchedSaleIds = new Set(this.dispatchesList.map(d => d.sale?.id || d.saleId));
    return this.salesList.filter(s => !dispatchedSaleIds.has(s.id));
  }

  openScanner() {
    this.showScannerModal = true;
  }

  closeScanner() {
    this.showScannerModal = false;
  }

  onQrScanned(code: string) {
    this.showScannerModal = false;
    if (!code) return;

    // Parse scanned QR code: either an ID number, JSON object, or batch text
    const cleanCode = code.trim();
    const matchedSale = this.availableSalesForDispatch.find(s => 
      String(s.id) === cleanCode || 
      (s.invoiceNo && s.invoiceNo.toLowerCase().includes(cleanCode.toLowerCase()))
    );

    if (matchedSale) {
      this.dispatchForm.id = String(matchedSale.id);
      if (!this.dispatchForm.deliveryAddress && matchedSale.party?.address) {
        this.dispatchForm.deliveryAddress = matchedSale.party.address;
      }
      this.notificationService.success('QR Scanned', `Matched Sale Order #${matchedSale.id} (${matchedSale.crateType})`);
    } else {
      // Try setting vehicle number or delivery note
      this.notificationService.info('QR Decoded', `Scanned Value: ${cleanCode}`);
    }
  }

  validateForm(): boolean {
    const f = this.dispatchForm;
    if (!f.id || !f.dispatchDate || !f.vehicleNumber || !f.driverName || !f.deliveryAddress) {
      this.notificationService.showValidationError('Please fill out all required dispatch fields.');
      return false;
    }
    return true;
  }

  saveDispatch() {
    if (!this.validateForm()) return;
    const sale = this.salesList.find((s: any) => s.id === parseInt(this.dispatchForm.id) || String(s.id) === String(this.dispatchForm.id));
    if (!sale) return;
    const payload = { ...this.dispatchForm, sale };

    const editId = (this.dispatchForm as any)._editId;
    if (editId) {
      this.apiService.updateDispatch(editId, payload).subscribe({
        next: () => {
          this.loadData();
          this.notificationService.showSaveSuccess('Dispatch record updated successfully.');
          this.logAudit('Updated dispatch ID: ' + editId);
          this.dispatchForm = { id: '', dispatchDate: '', vehicleNumber: '', driverName: '', deliveryAddress: '', dispatchStatus: 'Pending' };
        },
        error: (err) => this.notificationService.showValidationError('Failed to update dispatch: ' + (err.error?.message || err.message))
      });
    } else {
      this.apiService.createDispatch(payload).subscribe({
        next: () => {
          this.loadData();
          this.notificationService.showSaveSuccess('Dispatch record created successfully.');
          this.logAudit('Created dispatch for vehicle: ' + this.dispatchForm.vehicleNumber);
          this.dispatchForm = { id: '', dispatchDate: '', vehicleNumber: '', driverName: '', deliveryAddress: '', dispatchStatus: 'Pending' };
        },
        error: (err) => this.notificationService.showValidationError('Failed to create dispatch: ' + (err.error?.message || err.message))
      });
    }
  }

  async editDispatch(d: any) {
    this.dispatchForm = {
      id: d.sale?.id ? String(d.sale.id) : (d.saleId ? String(d.saleId) : ''),
      dispatchDate: d.date || d.dispatchDate || '',
      vehicleNumber: d.vehicleNumber || '',
      driverName: d.driverName || '',
      deliveryAddress: d.deliveryAddress || d.sale?.party?.partyAddress || '',
      dispatchStatus: d.status || d.dispatchStatus || 'Pending'
    };
    (this.dispatchForm as any)._editId = d.id;
    this.notificationService.info('Edit Mode', `Loaded dispatch record for vehicle ${d.vehicleNumber} for editing.`);
    const formEl = document.querySelector('.form-card');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
  }

  async deleteDispatch(id: string) {
    const confirmed = await this.notificationService.showDeleteConfirm('Delete Dispatch?', 'Are you sure you want to delete this dispatch record?');
    if (confirmed) {
      this.apiService.deleteDispatch(id).subscribe(() => {
        this.loadData();
        this.notificationService.showDeleteSuccess('Dispatch record deleted successfully.');
      });
    }
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

  trackById(index: number, item: any): any {
    return item?.id ?? item?.dispatchId ?? item?.dispatchNumber ?? index;
  }
}
