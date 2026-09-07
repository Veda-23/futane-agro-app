import { Component, Input, Output, EventEmitter, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';

@Component({
  selector: 'app-global-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoSelectDirective],
  templateUrl: './global-filter.component.html',
  styleUrls: ['./global-filter.component.css']
})
export class GlobalFilterComponent implements OnInit {
  @Input() activeTab: string = 'production';
  @Input() filters: any = {
    query: '',
    dateFrom: '',
    dateTo: '',
    date: '',
    month: '',
    year: '',
    status: '',
    crateType: '',
    shift: '',
    minSuccessful: null,
    minEfficiency: 0,
    partyId: '',
    paymentStatus: '',
    paymentMode: '',
    stockStatus: '',
    partyType: '',
    machineStatus: '',
    department: '',
    maxBill: null
  };

  @Input() crateTypes: string[] = ['Apple Crate', 'Tomato Crate', 'Mango Crate', 'Banana Crate', 'Vegetable Crate', 'Universal Storage Crate'];
  @Input() shifts: string[] = ['Morning Shift', 'Afternoon Shift', 'Night Shift'];
  @Input() partiesList: any[] = [];
  @Input() totalRecordCount: number = 0;
  @Input() filteredRecordCount: number = 0;

  @Output() filtersChange = new EventEmitter<any>();
  @Output() reset = new EventEmitter<void>();
  @Output() export = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  years: number[] = [];
  
  // Advanced filters drawer / popover state
  showAdvancedDrawer = false;
  showStatusDropdown = false;
  selectedStatuses: string[] = [];

  ngOnInit() {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 2022; y--) this.years.push(y);
    this.loadFromSession();
  }

  // --- Dynamic Tab Capabilities ---
  get showSearch(): boolean {
    return this.activeTab !== 'dashboard';
  }

  get showDateRange(): boolean {
    return ['production', 'sales', 'payments', 'raw-materials', 'transports', 'expenses', 'bank', 'invoices', 'audit-logs', 'parties', 'vendors', 'machines', 'drivers', 'employees', 'dispatch'].includes(this.activeTab);
  }

  get showMonthYear(): boolean {
    return ['monthly-production', 'salaries'].includes(this.activeTab);
  }

  get showStatusFilter(): boolean {
    // Hidden on tabs with dedicated quick-chips, but available in advanced drawer
    return false;
  }

  get hasAdvancedFilters(): boolean {
    return [
      'production', 'monthly-production', 'sales', 'invoices', 'payments',
      'raw-materials', 'inventory', 'transports', 'dispatch', 'machines',
      'drivers', 'parties', 'vendors', 'employees', 'salaries', 'expenses',
      'bank', 'audit-logs'
    ].includes(this.activeTab);
  }

  get statusOptions(): string[] {
    switch (this.activeTab) {
      case 'sales':
      case 'invoices':
        return ['PAID', 'PENDING', 'PARTIAL', 'OVERDUE', 'CANCELLED'];
      case 'payments':
        return ['PAID', 'PENDING', 'PARTIAL', 'FAILED', 'REFUNDED', 'CANCELLED'];
      case 'inventory':
        return ['IN STOCK', 'LOW STOCK', 'OUT OF STOCK'];
      case 'parties':
        return ['ACTIVE', 'INACTIVE'];
      case 'machines':
        return ['RUNNING', 'IDLE', 'MAINTENANCE', 'OFFLINE'];
      case 'employees':
        return ['ACTIVE', 'ON LEAVE', 'RESIGNED', 'TERMINATED'];
      default:
        return ['COMPLETED', 'PENDING', 'ACTIVE', 'INACTIVE'];
    }
  }

  // Count active filters
  get activeFilterCount(): number {
    let count = 0;
    if (this.filters.query?.trim()) count++;
    if (this.filters.dateFrom) count++;
    if (this.filters.dateTo) count++;
    if (this.filters.month) count++;
    if (this.filters.year) count++;
    if (this.selectedStatuses.length > 0 || this.filters.status) count++;
    if (this.filters.crateType) count++;
    if (this.filters.shift) count++;
    if (this.filters.minSuccessful && this.filters.minSuccessful > 0) count++;
    if (this.filters.minEfficiency && this.filters.minEfficiency > 0) count++;
    if (this.filters.partyId) count++;
    if (this.filters.paymentStatus) count++;
    if (this.filters.paymentMode) count++;
    if (this.filters.stockStatus) count++;
    if (this.filters.partyType) count++;
    if (this.filters.machineStatus) count++;
    if (this.filters.department) count++;
    return count;
  }

  // Active filter chips list for display
  get activeChips(): { key: string; label: string; value: string }[] {
    const chips: { key: string; label: string; value: string }[] = [];
    if (this.filters.query?.trim()) {
      chips.push({ key: 'query', label: 'Search', value: `"${this.filters.query}"` });
    }
    if (this.filters.dateFrom || this.filters.dateTo) {
      chips.push({ key: 'dateRange', label: 'Date', value: `${this.filters.dateFrom || 'Start'} → ${this.filters.dateTo || 'End'}` });
    }
    if (this.filters.month) {
      chips.push({ key: 'month', label: 'Month', value: this.filters.month });
    }
    if (this.filters.year) {
      chips.push({ key: 'year', label: 'Year', value: String(this.filters.year) });
    }
    if (this.selectedStatuses.length > 0) {
      chips.push({ key: 'status', label: 'Status', value: this.selectedStatuses.join(', ') });
    } else if (this.filters.status) {
      chips.push({ key: 'status', label: 'Status', value: this.filters.status });
    }
    if (this.filters.crateType) {
      chips.push({ key: 'crateType', label: 'Crate', value: this.filters.crateType });
    }
    if (this.filters.shift) {
      chips.push({ key: 'shift', label: 'Shift', value: this.filters.shift });
    }
    if (this.filters.minSuccessful && this.filters.minSuccessful > 0) {
      chips.push({ key: 'minSuccessful', label: 'Min Success', value: `≥ ${this.filters.minSuccessful}` });
    }
    if (this.filters.minEfficiency && this.filters.minEfficiency > 0) {
      chips.push({ key: 'minEfficiency', label: 'Min Efficiency', value: `≥ ${this.filters.minEfficiency}%` });
    }
    if (this.filters.partyId) {
      const p = this.partiesList.find(x => String(x.id) === String(this.filters.partyId));
      chips.push({ key: 'partyId', label: 'Party', value: p ? p.partyName : this.filters.partyId });
    }
    if (this.filters.paymentStatus) {
      chips.push({ key: 'paymentStatus', label: 'Payment', value: this.filters.paymentStatus });
    }
    if (this.filters.paymentMode) {
      chips.push({ key: 'paymentMode', label: 'Mode', value: this.filters.paymentMode });
    }
    if (this.filters.stockStatus) {
      chips.push({ key: 'stockStatus', label: 'Stock', value: this.filters.stockStatus });
    }
    if (this.filters.partyType) {
      chips.push({ key: 'partyType', label: 'Type', value: this.filters.partyType });
    }
    if (this.filters.machineStatus) {
      chips.push({ key: 'machineStatus', label: 'Machine', value: this.filters.machineStatus });
    }
    if (this.filters.department) {
      chips.push({ key: 'department', label: 'Dept', value: this.filters.department });
    }
    return chips;
  }

  onFilterChange() {
    if (this.selectedStatuses.length > 0) {
      this.filters.status = this.selectedStatuses.join(',');
    }
    this.saveToSession();
    this.filtersChange.emit({ ...this.filters });
  }

  // Quick Chips selector (e.g. for Parties, Inventory, Machines)
  setQuickChip(key: string, value: any) {
    if (this.filters[key] === value) {
      this.filters[key] = '';
    } else {
      this.filters[key] = value;
    }
    this.onFilterChange();
  }

  isQuickChipActive(key: string, value: any): boolean {
    return this.filters[key] === value || (!this.filters[key] && value === '');
  }

  removeChip(key: string) {
    switch (key) {
      case 'query': this.filters.query = ''; break;
      case 'dateRange': this.filters.dateFrom = ''; this.filters.dateTo = ''; break;
      case 'month': this.filters.month = ''; break;
      case 'year': this.filters.year = ''; break;
      case 'status': this.selectedStatuses = []; this.filters.status = ''; break;
      case 'crateType': this.filters.crateType = ''; break;
      case 'shift': this.filters.shift = ''; break;
      case 'minSuccessful': this.filters.minSuccessful = null; break;
      case 'minEfficiency': this.filters.minEfficiency = 0; break;
      case 'partyId': this.filters.partyId = ''; break;
      case 'paymentStatus': this.filters.paymentStatus = ''; break;
      case 'paymentMode': this.filters.paymentMode = ''; break;
      case 'stockStatus': this.filters.stockStatus = ''; break;
      case 'partyType': this.filters.partyType = ''; break;
      case 'machineStatus': this.filters.machineStatus = ''; break;
      case 'department': this.filters.department = ''; break;
    }
    this.onFilterChange();
  }

  toggleStatus(s: string) {
    const idx = this.selectedStatuses.indexOf(s);
    if (idx >= 0) this.selectedStatuses.splice(idx, 1);
    else this.selectedStatuses.push(s);
    this.onFilterChange();
  }

  isStatusSelected(s: string): boolean {
    return this.selectedStatuses.includes(s) || this.filters.status === s;
  }

  clearStatuses() {
    this.selectedStatuses = [];
    this.filters.status = '';
    this.onFilterChange();
  }

  onReset() {
    this.filters = {
      query: '',
      dateFrom: '',
      dateTo: '',
      date: '',
      month: '',
      year: '',
      status: '',
      crateType: '',
      shift: '',
      minSuccessful: null,
      minEfficiency: 0,
      partyId: '',
      paymentStatus: '',
      paymentMode: '',
      stockStatus: '',
      partyType: '',
      machineStatus: '',
      department: ''
    };
    this.selectedStatuses = [];
    sessionStorage.removeItem(`erp_filter_${this.activeTab}`);
    this.filtersChange.emit({ ...this.filters });
    this.reset.emit();
  }

  saveToSession() {
    try {
      sessionStorage.setItem(`erp_filter_${this.activeTab}`, JSON.stringify({
        filters: this.filters,
        selectedStatuses: this.selectedStatuses
      }));
    } catch {}
  }

  loadFromSession() {
    try {
      const raw = sessionStorage.getItem(`erp_filter_${this.activeTab}`);
      if (raw) {
        const { filters, selectedStatuses } = JSON.parse(raw);
        if (filters) this.filters = { ...this.filters, ...filters };
        if (selectedStatuses) this.selectedStatuses = selectedStatuses;
        this.onFilterChange();
      }
    } catch {}
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      const el = document.getElementById('global-search-input');
      if (el) {
        e.preventDefault();
        (el as HTMLElement).focus();
      }
    }
    if (e.key === 'Escape') {
      this.showStatusDropdown = false;
      this.showAdvancedDrawer = false;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const t = e.target as HTMLElement;
    if (!t.closest('.status-dropdown-wrapper')) this.showStatusDropdown = false;
    if (!t.closest('.advanced-filter-popover') && !t.closest('.btn-filter-toggle')) {
      this.showAdvancedDrawer = false;
    }
  }
}
