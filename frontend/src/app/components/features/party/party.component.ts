import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { ResizableTableDirective } from '../../../directives/resizable-table.directive';
import { NotificationService } from '../../../services/notification.service';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';
import { UniversalImporterComponent } from '../../shared/universal-importer/universal-importer.component';

export interface PartyRecord {
  id?: string | number;
  partyId?: number;
  partyName: string;
  partyAddress?: string;
  partyContact: string;
  gstNumber?: string;
  email?: string;
  city?: string;
  state?: string;
  isActive?: boolean;
  createdDate?: string;
  gstCertPath?: string;
  panCardPath?: string;
  agreementPath?: string;
}

@Component({
  selector: 'app-party',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    AutoSelectDirective,
    FormStateDirective,
    ResizableTableDirective,
    UniversalImporterComponent
  ],
  templateUrl: './party.component.html',
  styleUrls: ['./party.component.css']
})
export class PartyComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'parties';
  @Input() loggedInUser: any = null;
  @Output() onNavigateTab = new EventEmitter<string>();

  parties: PartyRecord[] = [];
  isRefreshing: boolean = false;
  isFormVisible: boolean = false;
  isDrawerOpen: boolean = false;
  selectedPartyForDrawer: PartyRecord | null = null;

  // Dedicated Read-Only Client Dossier Inspection Modal
  showDossierModal: boolean = false;
  selectedPartyForDossier: PartyRecord | null = null;

  // Active Subtab filter
  subTab: 'all' | 'wholesalers' | 'gst' | 'mh' | 'interstate' = 'all';

  // Toolbar & Search Filters
  searchQuery: string = '';
  filterPartyType: string = '';
  filterState: string = '';
  filterGstStatus: string = '';
  isFilterPopoverOpen: boolean = false;

  // Density & Pagination
  tableDensity: 'compact' | 'comfortable' | 'spacious' = 'comfortable';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  itemsPerPageOptions: number[] = [10, 25, 50, 100];

  // Selection
  selectedPartyIds: { [id: string]: boolean } = {};
  selectAllChecked: boolean = false;

  // Column Manager
  showColDropdown: boolean = false;
  columnsConfig = [
    { key: 'partyName', label: 'Company / Party Name', visible: true, locked: true },
    { key: 'partyType', label: 'Party / Business Type', visible: true },
    { key: 'partyContact', label: 'Contact Details', visible: true },
    { key: 'gstNumber', label: 'GSTIN / Tax ID', visible: true },
    { key: 'location', label: 'Location & State', visible: true },
    { key: 'email', label: 'Business Email', visible: true },
    { key: 'status', label: 'B2B Readiness', visible: true },
    { key: 'createdDate', label: 'Registered On', visible: false }
  ];

  // Add / Edit Form State
  editingPartyId: string | null = null;
  partyForm: PartyRecord = {
    partyName: '',
    partyAddress: '',
    partyContact: '',
    gstNumber: '',
    email: '',
    city: '',
    state: '',
    gstCertPath: '',
    panCardPath: '',
    agreementPath: ''
  };

  drawerPartyForm: PartyRecord = { ...this.partyForm };

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData(notify: boolean = false) {
    this.isRefreshing = true;
    this.apiService.getParties(true).subscribe({
      next: (res: any[]) => {
        this.parties = res || [];
        this.isRefreshing = false;
        this.selectedPartyIds = {};
        this.selectAllChecked = false;
        if (notify) {
          this.notificationService.success('Directory Refreshed', `Loaded ${this.parties.length} customer & party accounts.`);
        }
      },
      error: (err) => {
        this.isRefreshing = false;
        this.notificationService.error('Fetch Failed', 'Unable to retrieve party records: ' + (err.error?.message || err.message));
      }
    });
  }

  // --- Permissions ---
  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  // --- Subtab Navigation ---
  setSubTab(tab: 'all' | 'wholesalers' | 'gst' | 'mh' | 'interstate') {
    this.subTab = tab;
    this.currentPage = 1;
    this.selectedPartyIds = {};
    this.selectAllChecked = false;
  }

  // --- Party Type Classification ---
  getPartyType(party: PartyRecord): 'Wholesaler' | 'Distributor' | 'Retailer' | 'Commercial' {
    if (!party || !party.partyName) return 'Commercial';
    const name = party.partyName.toLowerCase();
    if (name.includes('distribut') || name.includes('logistics') || name.includes('supply') || name.includes('cold chain') || name.includes('depot') || name.includes('agency')) {
      return 'Distributor';
    }
    if (name.includes('agro') || name.includes('trade') || name.includes('wholesale') || name.includes('mandi') || name.includes('krishi') || name.includes('bulk')) {
      return 'Wholesaler';
    }
    if (name.includes('retail') || name.includes('foods') || name.includes('mart') || name.includes('fresh') || name.includes('hyper') || name.includes('store') || name.includes('super')) {
      return 'Retailer';
    }
    return 'Commercial';
  }

  getWholesalerDistributorCount(): number {
    return (this.parties || []).filter(p => {
      const t = this.getPartyType(p);
      return t === 'Wholesaler' || t === 'Distributor';
    }).length;
  }

  getActiveFilterCount(): number {
    let count = 0;
    if (this.filterPartyType) count++;
    if (this.filterState) count++;
    if (this.filterGstStatus) count++;
    return count;
  }

  toggleFilterPopover() {
    this.isFilterPopoverOpen = !this.isFilterPopoverOpen;
  }

  closeFilterPopover() {
    this.isFilterPopoverOpen = false;
  }

  // --- KPI Telemetry Computations ---
  getTotalPartiesCount(): number {
    return this.parties ? this.parties.length : 0;
  }

  getGstRegisteredCount(): number {
    return (this.parties || []).filter(p => this.isGstCompliant(p.gstNumber)).length;
  }

  getGstRegisteredPercent(): number {
    if (!this.parties || this.parties.length === 0) return 0;
    return Math.round((this.getGstRegisteredCount() / this.parties.length) * 100);
  }

  getMhPartiesCount(): number {
    return (this.parties || []).filter(p => this.isMaharashtra(p)).length;
  }

  getInterstatePartiesCount(): number {
    return (this.parties || []).filter(p => !this.isMaharashtra(p)).length;
  }

  getProfileReadinessPercent(): number {
    if (!this.parties || this.parties.length === 0) return 0;
    const readyCount = this.parties.filter(p => p.partyName && p.partyContact && p.partyAddress && p.email).length;
    return Math.round((readyCount / this.parties.length) * 100);
  }

  getUniqueStates(): string[] {
    const states = new Set<string>();
    (this.parties || []).forEach(p => {
      if (p.state && p.state.trim()) {
        states.add(p.state.trim());
      }
    });
    return Array.from(states).sort();
  }

  isMaharashtra(party: PartyRecord): boolean {
    if (!party) return false;
    const s = (party.state || '').toLowerCase();
    const gst = (party.gstNumber || '').toUpperCase();
    return s.includes('maha') || s === 'mh' || gst.startsWith('27');
  }

  isGstCompliant(gst?: string): boolean {
    if (!gst) return false;
    const trimmed = gst.trim().toUpperCase();
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(trimmed);
  }

  getInitials(name: string): string {
    if (!name) return 'CP';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  // --- Filtering & Pagination ---
  getFilteredParties(): PartyRecord[] {
    let list = this.parties || [];

    // 1. Subtab filter
    if (this.subTab === 'wholesalers') {
      list = list.filter(p => {
        const t = this.getPartyType(p);
        return t === 'Wholesaler' || t === 'Distributor';
      });
    } else if (this.subTab === 'gst') {
      list = list.filter(p => this.isGstCompliant(p.gstNumber));
    } else if (this.subTab === 'mh') {
      list = list.filter(p => this.isMaharashtra(p));
    } else if (this.subTab === 'interstate') {
      list = list.filter(p => !this.isMaharashtra(p));
    }

    // 2. Search query filter
    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      list = list.filter(p =>
        (p.partyName && p.partyName.toLowerCase().includes(q)) ||
        (p.partyContact && p.partyContact.includes(q)) ||
        (p.gstNumber && p.gstNumber.toLowerCase().includes(q)) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.state && p.state.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        this.getPartyType(p).toLowerCase().includes(q)
      );
    }

    // 3. Party Type filter
    if (this.filterPartyType) {
      list = list.filter(p => this.getPartyType(p) === this.filterPartyType);
    }

    // 4. State filter
    if (this.filterState) {
      list = list.filter(p => p.state && p.state.trim().toLowerCase() === this.filterState.toLowerCase());
    }

    // 5. GST status filter
    if (this.filterGstStatus === 'gst_yes') {
      list = list.filter(p => this.isGstCompliant(p.gstNumber));
    } else if (this.filterGstStatus === 'gst_no') {
      list = list.filter(p => !this.isGstCompliant(p.gstNumber));
    }

    return list;
  }

  getPaginatedParties(): PartyRecord[] {
    const filtered = this.getFilteredParties();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }

  getTotalPages(): number {
    const totalItems = this.getFilteredParties().length;
    return Math.ceil(totalItems / this.itemsPerPage) || 1;
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  resetFilters() {
    this.searchQuery = '';
    this.filterPartyType = '';
    this.filterState = '';
    this.filterGstStatus = '';
    this.subTab = 'all';
    this.currentPage = 1;
    this.selectedPartyIds = {};
    this.selectAllChecked = false;
    this.isFilterPopoverOpen = false;
  }

  // --- Multi-Selection ---
  toggleSelectAll() {
    this.selectAllChecked = !this.selectAllChecked;
    const visibleParties = this.getPaginatedParties();
    visibleParties.forEach(p => {
      const id = String(p.id);
      this.selectedPartyIds[id] = this.selectAllChecked;
    });
  }

  toggleRowSelection(id: any) {
    const key = String(id);
    this.selectedPartyIds[key] = !this.selectedPartyIds[key];
    const visibleParties = this.getPaginatedParties();
    this.selectAllChecked = visibleParties.length > 0 && visibleParties.every(p => this.selectedPartyIds[String(p.id)]);
  }

  getSelectedCount(): number {
    return Object.values(this.selectedPartyIds).filter(Boolean).length;
  }

  // --- Density & Columns ---
  setDensity(density: 'compact' | 'comfortable' | 'spacious') {
    this.tableDensity = density;
  }

  toggleColumn(key: string) {
    const col = this.columnsConfig.find(c => c.key === key);
    if (col && !col.locked) {
      col.visible = !col.visible;
    }
  }

  isColumnVisible(key: string): boolean {
    const col = this.columnsConfig.find(c => c.key === key);
    return col ? col.visible : true;
  }

  getVisibleColCount(): number {
    return this.columnsConfig.filter(c => c.visible).length;
  }

  resetColumns() {
    this.columnsConfig.forEach(c => c.visible = true);
  }

  // --- Collapsible Add Form Toggle ---
  toggleFormVisibility() {
    this.isFormVisible = !this.isFormVisible;
    if (this.isFormVisible) {
      this.cancelEditParty();
      this.isFormVisible = true;
      setTimeout(() => {
        const el = document.querySelector('.party-modal-dialog') as HTMLElement;
        if (el) {
          const firstInput = el.querySelector('input:not([disabled])') as HTMLElement;
          if (firstInput) firstInput.focus();
        }
      }, 60);
    }
  }

  openForm() {
    this.cancelEditParty();
    this.isFormVisible = true;
    setTimeout(() => {
      const el = document.querySelector('.party-modal-dialog') as HTMLElement;
      if (el) {
        const firstInput = el.querySelector('input:not([disabled])') as HTMLElement;
        if (firstInput) firstInput.focus();
      }
    }, 60);
  }

  // --- Slide-in Edit Drawer ---
  openEditDrawer(party: PartyRecord) {
    this.selectedPartyForDrawer = party;
    this.drawerPartyForm = {
      id: party.id,
      partyId: party.partyId,
      partyName: party.partyName || '',
      partyAddress: party.partyAddress || '',
      partyContact: party.partyContact || '',
      gstNumber: party.gstNumber || '',
      email: party.email || '',
      city: party.city || '',
      state: party.state || '',
      isActive: party.isActive !== false,
      gstCertPath: party.gstCertPath || '',
      panCardPath: party.panCardPath || '',
      agreementPath: party.agreementPath || ''
    };
    this.isDrawerOpen = true;
  }

  closeEditDrawer() {
    this.isDrawerOpen = false;
    this.selectedPartyForDrawer = null;
  }

  // --- Official Client Dossier (Read-Only Inspection Mode) ---
  openPartyDossier(party: PartyRecord): void {
    this.selectedPartyForDossier = party;
    this.showDossierModal = true;
    this.logAudit('Viewed party dossier: ' + party.partyName);
  }

  closePartyDossier(): void {
    this.showDossierModal = false;
    this.selectedPartyForDossier = null;
  }

  printPartyDossier(): void {
    window.print();
  }

  saveDrawerParty() {
    if (!this.drawerPartyForm.partyName || !this.drawerPartyForm.partyContact) {
      this.notificationService.warning('Validation Error', 'Party Name and Contact Number are required.');
      return;
    }

    const id = String(this.drawerPartyForm.id);
    this.apiService.updateParty(id, this.drawerPartyForm).subscribe({
      next: (res) => {
        this.loadData();
        this.closeEditDrawer();
        this.notificationService.success('Profile Updated', `Successfully updated "${res.partyName}".`);
        this.logAudit('Updated party profile: ' + res.partyName);
      },
      error: (err) => {
        this.notificationService.error('Update Failed', err.error?.message || err.message);
      }
    });
  }

  // --- Form CRUD Operations ---
  editParty(party: PartyRecord) {
    this.editingPartyId = String(party.id);
    this.partyForm = {
      id: party.id,
      partyId: party.partyId,
      partyName: party.partyName || '',
      partyAddress: party.partyAddress || '',
      partyContact: party.partyContact || '',
      gstNumber: party.gstNumber || '',
      email: party.email || '',
      city: party.city || '',
      state: party.state || '',
      isActive: party.isActive !== false,
      gstCertPath: party.gstCertPath || '',
      panCardPath: party.panCardPath || '',
      agreementPath: party.agreementPath || ''
    };
    this.isFormVisible = true;
    this.notificationService.info('Editing Party', `Loaded "${party.partyName}" into editor.`);
    setTimeout(() => {
      const el = document.querySelector('.party-modal-dialog') as HTMLElement;
      if (el) {
        const firstInput = el.querySelector('input:not([disabled])') as HTMLElement;
        if (firstInput) firstInput.focus();
      }
    }, 60);
  }

  cancelEditParty() {
    this.editingPartyId = null;
    this.isFormVisible = false;
    this.partyForm = {
      partyName: '',
      partyAddress: '',
      partyContact: '',
      gstNumber: '',
      email: '',
      city: '',
      state: '',
      gstCertPath: '',
      panCardPath: '',
      agreementPath: ''
    };
  }

  isDuplicateParty(): boolean {
    const name = (this.partyForm.partyName || '').trim().toLowerCase();
    const phone = (this.partyForm.partyContact || '').trim();
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
    if (!this.partyForm.partyName || !this.partyForm.partyContact) {
      this.notificationService.warning('Validation Error', 'Party Name and Contact are required.');
      return;
    }

    if (this.editingPartyId) {
      // UPDATE
      this.apiService.updateParty(this.editingPartyId, this.partyForm).subscribe({
        next: (res) => {
          this.loadData();
          this.cancelEditParty();
          this.notificationService.success('Success', `Party "${res.partyName}" updated successfully!`);
          this.logAudit('Updated party: ' + res.partyName);
        },
        error: (err) => this.notificationService.error('Error', 'Failed to update party: ' + (err.error?.message || err.message))
      });
    } else {
      // CREATE
      if (this.isDuplicateParty()) return;
      this.apiService.createParty(this.partyForm).subscribe({
        next: (res) => {
          this.loadData();
          this.cancelEditParty();
          this.notificationService.success('Success', `Registered new party "${res.partyName}"!`);
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

  deleteParty(id: any) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to delete parties.");
      return;
    }

    const party = this.parties.find(p => String(p.id) === String(id));
    const name = party ? party.partyName : 'this party';

    this.notificationService.confirmAction('Confirm Deletion', `Are you sure you want to delete ${name}?`, 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteParty(String(id)).subscribe({
          next: () => {
            this.parties = this.parties.filter(x => String(x.id) !== String(id));
            delete this.selectedPartyIds[String(id)];
            this.notificationService.success('Deleted', `Party deleted successfully.`);
            this.logAudit("Deleted party ID: " + id);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  batchDeleteSelected() {
    const ids = Object.keys(this.selectedPartyIds).filter(id => this.selectedPartyIds[id]);
    if (ids.length === 0) return;

    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to perform bulk deletions.");
      return;
    }

    this.notificationService.confirmAction(
      'Confirm Bulk Delete',
      `Permanently delete ${ids.length} selected customer accounts?`,
      'Delete All Selected'
    ).then(confirmed => {
      if (confirmed) {
        let deletedCount = 0;
        ids.forEach(id => {
          this.apiService.deleteParty(id).subscribe({
            next: () => {
              this.parties = this.parties.filter(x => String(x.id) !== id);
              delete this.selectedPartyIds[id];
              deletedCount++;
              if (deletedCount === ids.length) {
                this.notificationService.success('Batch Complete', `${deletedCount} parties removed.`);
                this.selectAllChecked = false;
              }
            }
          });
        });
      }
    });
  }

  // --- Export Utilities ---
  exportToCsv() {
    const data = this.getFilteredParties();
    if (!data || data.length === 0) {
      this.notificationService.warning('Export', 'No party records available to export.');
      return;
    }

    const headers = ['Party Name', 'Contact Number', 'GSTIN', 'Email', 'City', 'State', 'Address', 'Registered Date'];
    const rows = data.map(p => [
      `"${(p.partyName || '').replace(/"/g, '""')}"`,
      `"${p.partyContact || ''}"`,
      `"${p.gstNumber || ''}"`,
      `"${p.email || ''}"`,
      `"${p.city || ''}"`,
      `"${p.state || ''}"`,
      `"${(p.partyAddress || '').replace(/"/g, '""')}"`,
      `"${p.createdDate || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Futane_Agro_Parties_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notificationService.success('Export Successful', `Exported ${data.length} records to CSV.`);
  }

  exportToExcel() {
    this.exportToCsv();
  }

  copyToClipboard(text: string, label: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.notificationService.success('Copied', `${label} copied to clipboard!`);
    });
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
