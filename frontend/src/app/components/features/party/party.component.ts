import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';
import { DataTableComponent } from '../../data-table/data-table.component';

@Component({
  selector: 'app-party',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, DataTableComponent],
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
    { label: 'Delete', action: 'delete', class: 'btn btn-sm btn-danger' }
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.apiService.getParties().subscribe((list: any[]) => this.parties = list);
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
        alert("Please fill all required fields");
        return false;
      }
    }
    return true;
  }

  saveParty() {
    if (!this.validateForm('party')) return;
    this.apiService.createParty(this.partyForm).subscribe({
      next: () => {
        this.loadData();
        this.logAudit("Registered new party: " + this.partyForm.partyName);
        this.partyForm = { partyName: '', partyAddress: '', partyContact: '', gstNumber: '', email: '', city: '', state: '', gstCertPath: '', panCardPath: '', agreementPath: '' };
      },
      error: (err) => {
        if (err.status === 409) {
          alert(err.error?.message || "A party with this unique info already exists.");
        } else {
          alert("Failed to save party: " + (err.error?.message || err.message));
        }
      }
    });
  }

  deleteParty(id: string) {
    if (!this.canDelete()) {
      alert("You don't have permission to delete.");
      return;
    }
    this.apiService.deleteParty(id).subscribe(() => {
      this.loadData();
      this.logAudit("Deleted party ID: " + id);
    });
  }

  handlePartyAction(event: any) {
    if (event.action === 'delete') this.deleteParty(event.item.id);
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

