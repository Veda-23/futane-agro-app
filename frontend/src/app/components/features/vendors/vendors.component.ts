import { Component, OnInit, Input } from '@angular/core';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { NotificationService } from '../../../services/notification.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';
import { DataTableComponent } from '../../data-table/data-table.component';

@Component({
  selector: 'app-vendors',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, DataTableComponent, AutoSelectDirective, FormStateDirective],
  templateUrl: './vendors.component.html',
  styleUrls: ['./vendors.component.css']
})
export class VendorsComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'vendors';
  @Input() loggedInUser: any = null;

  @Input() rawMaterialsList: any[] = [];
  vendors: any[] = [];
  vendorForm = { vendorName: '', mobile: '', address: '', gstNumber: '' };

  vendorTableColumns = [
    { key: 'vendorName', label: 'Name' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'gstNumber', label: 'GST' },
    { key: 'address', label: 'Address' },
    { key: 'createdDate', label: 'Date', type: 'date' }
  ];
  
  vendorTableActions = [
    { label: 'Edit', action: 'edit', class: 'btn btn-sm btn-outline' },
    { label: 'Delete', action: 'delete', class: 'btn btn-sm btn-danger' }
  ];

  constructor(private apiService: ApiService, private notificationService: NotificationService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.apiService.getVendors().subscribe((res: any[]) => this.vendors = res);
    this.apiService.getRawMaterials().subscribe((res: any[]) => this.rawMaterialsList = res || []);
  }

  getVendorOutstanding(vendorId: string | number): number {
    return (this.rawMaterialsList || [])
      .filter(rm => (rm.vendor?.id === vendorId || rm.vendorId === vendorId))
      .reduce((s, rm) => s + (rm.amount || (rm.weight * rm.rate) || 0), 0);
  }

  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  editVendor(vendor: any) {
    this.vendorForm = { ...vendor };
    const formEl = document.querySelector('.form-card');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
    this.notificationService.info('Editing', `Editing vendor: ${vendor.vendorName}`);
  }

  saveVendor() {
    if (!this.vendorForm.vendorName || !this.vendorForm.mobile) {
      this.notificationService.warning('Invalid Input', "Please fill required fields");
      return;
    }
    const editId = (this.vendorForm as any).id;
    if (editId) {
      this.apiService.updateVendor(editId, this.vendorForm).subscribe({
        next: () => {
          this.loadData();
          this.notificationService.success('Updated', 'Vendor updated successfully');
          this.logAudit('Updated vendor: ' + this.vendorForm.vendorName);
          this.vendorForm = { vendorName: '', mobile: '', address: '', gstNumber: '' };
        },
        error: (err) => this.notificationService.error('Error', 'Failed to update vendor: ' + (err.error?.message || err.message))
      });
    } else {
      this.apiService.createVendor(this.vendorForm).subscribe({
        next: (res) => {
          if (res) this.vendors.unshift(res);
          this.loadData();
          this.notificationService.success('Data Saved', 'Vendor saved successfully');
          this.logAudit("Saved vendor: " + this.vendorForm.vendorName);
          this.vendorForm = { vendorName: '', mobile: '', address: '', gstNumber: '' };
        },
        error: (err) => this.notificationService.error('Error', "Failed to save vendor: " + (err.error?.message || err.message))
      });
    }
  }

  deleteVendor(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "Permission denied");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this vendor?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteVendor(id).subscribe({
          next: () => {
            this.vendors = this.vendors.filter(x => (x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Vendor deleted successfully');
            this.logAudit("Deleted vendor ID: " + id);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  batchDeleteVendors(ids: string[]) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "Permission denied");
      return;
    }
    this.notificationService.confirmAction('Confirm Bulk Delete', `Delete ${ids.length} selected vendor(s)?`, 'Yes, Delete All').then(confirmed => {
      if (confirmed) {
        ids.forEach(id => {
          this.apiService.deleteVendor(id).subscribe({
            next: () => {
              this.vendors = this.vendors.filter(x => (x.id ? x.id.toString() : '') !== id.toString());
            }
          });
        });
        this.notificationService.success('Batch Delete', `Deleted ${ids.length} vendor(s)`);
      }
    });
  }

  handleVendorAction(event: any) {
    if (event.action === 'edit') this.editVendor(event.item);
    if (event.action === 'delete') this.deleteVendor(event.item.id);
  }

  logAudit(action: string) {
    if (this.loggedInUser) {
      this.apiService.createAuditLog({ username: this.loggedInUser.username, action }).subscribe();
    }
  }
}
