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
  selector: 'app-party',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, DataTableComponent, AutoSelectDirective, FormStateDirective],
  templateUrl: './party.component.html',
  styleUrls: ['./party.component.css']
})
export class PartyComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'parties';
  @Input() loggedInUser: any = null;

  parties: any[] = [];
  partyForm = { partyName: '', partyAddress: '', partyContact: '', gstNumber: '', email: '', city: '', state: '', gstCertPath: '', panCardPath: '', agreementPath: '' };

  partyTableColumns = [
    { key: 'partyName', label: 'Name' },
    { key: 'partyContact', label: 'Contact' },
    { key: 'gstNumber', label: 'GST' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'createdDate', label: 'Date', type: 'date' }
  ];
  
  partyTableActions = [
    { label: '✏️ Edit', action: 'edit', class: 'btn btn-sm btn-secondary' },
    { label: '🗑️ Delete', action: 'delete', class: 'btn btn-sm btn-danger' }
  ];

  constructor(private apiService: ApiService, private notificationService: NotificationService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.apiService.getParties().subscribe((res: any[]) => this.parties = res);
  }

  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  validateForm(type: string): boolean {
    if (type === 'party') {
      if (!this.partyForm.partyName || !this.partyForm.partyContact) {
        this.notificationService.warning('Validation Error', 'Please fill all required fields');
        return false;
      }
    }
    return true;
  }

  isDuplicateParty(): boolean {
    const name = this.partyForm.partyName?.trim().toLowerCase();
    const phone = this.partyForm.partyContact?.trim();
    const dupe = (this.parties || []).find(p =>
      (name && p.partyName?.toLowerCase() === name) ||
      (phone && p.partyContact && p.partyContact === phone)
    );
    if (dupe) {
      this.notificationService.error(
        'Duplicate Party',
        `"${dupe.partyName}" already exists with matching name or contact number.`
      );
      return true;
    }
    return false;
  }

  saveParty() {
    if (!this.validateForm('party')) return;

    const id = (this.partyForm as any).id;

    if (id) {
      // UPDATE existing party
      this.apiService.updateParty(id, this.partyForm).subscribe({
        next: (res) => {
          this.loadData();
          this.partyForm = { partyName: '', partyAddress: '', partyContact: '', gstNumber: '', email: '', city: '', state: '', gstCertPath: '', panCardPath: '', agreementPath: '' };
          this.notificationService.success('Success', 'Party updated successfully!');
          this.logAudit('Updated party: ' + res.partyName);
        },
        error: (err) => this.notificationService.error('Error', 'Failed to update party: ' + (err.error?.message || err.message))
      });
    } else {
      // CREATE new party — check duplicates only on create
      if (this.isDuplicateParty()) return;
      this.apiService.createParty(this.partyForm).subscribe({
        next: (res) => {
          this.loadData();
          this.partyForm = { partyName: '', partyAddress: '', partyContact: '', gstNumber: '', email: '', city: '', state: '', gstCertPath: '', panCardPath: '', agreementPath: '' };
          this.notificationService.success('Success', 'Party saved successfully!');
          this.logAudit('Registered new party: ' + res.partyName);
        },
        error: (err) => {
          if (err.status === 409) {
            this.notificationService.warning('Duplicate Record', err.error?.message || 'A party with this GST or name already exists.');
          } else {
            this.notificationService.error('Error', 'Failed to save party: ' + (err.error?.message || err.message));
          }
        }
      });
    }
  }

  deleteParty(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to delete.");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this party?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteParty(id).subscribe({
          next: () => {
            this.parties = this.parties.filter(x => (x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Party deleted successfully');
            this.logAudit("Deleted party ID: " + id);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  batchDeleteParties(ids: string[]) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to delete.");
      return;
    }
    this.notificationService.confirmAction('Confirm Bulk Delete', `Delete ${ids.length} selected parties?`, 'Yes, Delete All').then(confirmed => {
      if (confirmed) {
        ids.forEach(id => {
          this.apiService.deleteParty(id).subscribe({
            next: () => {
              this.parties = this.parties.filter(x => String(x.id) !== id);
            }
          });
        });
        this.notificationService.success('Batch Complete', `${ids.length} parties deleted`);
      }
    });
  }

  editParty(party: any) {
    this.partyForm = {
      partyName: party.partyName || '',
      partyAddress: party.partyAddress || party.address || '',
      partyContact: party.partyContact || party.contact || party.mobile || '',
      gstNumber: party.gstNumber || '',
      email: party.email || '',
      city: party.city || '',
      state: party.state || '',
      gstCertPath: party.gstCertPath || '',
      panCardPath: party.panCardPath || '',
      agreementPath: party.agreementPath || ''
    };
    if (party.id) {
      (this.partyForm as any).id = party.id;
    }
    this.notificationService.info('Editing Party', `Loaded "${party.partyName}" into form.`);
    const formEl = document.querySelector('.form-card');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
  }

  handlePartyAction(event: any) {
    if (event.action === 'delete') this.deleteParty(event.item.id);
    if (event.action === 'edit') this.editParty(event.item);
  }

  logAudit(action: string) {
    if (this.loggedInUser) {
      this.apiService.createAuditLog({
        username: this.loggedInUser.username,
        action: action
      }).subscribe();
    }
  }
}
