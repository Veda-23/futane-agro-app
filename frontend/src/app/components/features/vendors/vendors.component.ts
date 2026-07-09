import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';
import { DataTableComponent } from '../../data-table/data-table.component';

@Component({
  selector: 'app-vendors',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, DataTableComponent],
  templateUrl: './vendors.component.html',
  styleUrls: ['./vendors.component.css']
})
export class VendorsComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'vendors';
  @Input() loggedInUser: any = null;

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
    { label: 'Delete', action: 'delete', class: 'btn btn-sm btn-danger' }
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.apiService.getVendors().subscribe((res: any[]) => this.vendors = res);
  }

  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  saveVendor() {
    if (!this.vendorForm.vendorName || !this.vendorForm.mobile) {
      alert("Please fill required fields");
      return;
    }
    this.apiService.createVendor(this.vendorForm).subscribe(() => {
      this.loadData();
      this.logAudit("Created vendor: " + this.vendorForm.vendorName);
      this.vendorForm = { vendorName: '', mobile: '', address: '', gstNumber: '' };
    });
  }

  deleteVendor(id: string) {
    if (!this.canDelete()) {
      alert("Permission denied");
      return;
    }
    this.apiService.deleteVendor(id).subscribe(() => {
      this.loadData();
      this.logAudit("Deleted vendor ID: " + id);
    });
  }

  handleVendorAction(event: any) {
    if (event.action === 'delete') this.deleteVendor(event.item.id);
  }

  logAudit(action: string) {
    if (this.loggedInUser) {
      this.apiService.createAuditLog({ username: this.loggedInUser.username, action }).subscribe();
    }
  }
}

