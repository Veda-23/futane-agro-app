import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DataFilterService, FilterCriteria } from '../../../services/data-filter.service';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filter-panel glass-panel" style="padding:14px 16px; margin-bottom:16px; border-radius:14px;">
      <!-- Row 1: Quick Preset Chips & Search -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
        <!-- Preset Date Chips -->
        <div class="preset-chips" style="display:flex; gap:6px; flex-wrap:wrap;">
          <button *ngFor="let p of presets"
                  type="button"
                  class="preset-chip"
                  [class.active]="criteria.preset === p.id"
                  (click)="onPresetClick(p.id)">
            {{ p.label }}
          </button>
        </div>

        <!-- Debounced Full-Text Search Bar -->
        <div style="position:relative; min-width:240px; flex:1; max-width:380px;">
          <input type="text"
                 [(ngModel)]="criteria.searchTerm"
                 (ngModelChange)="onSearchChange($event)"
                 placeholder="Search (Party, Invoice, Truck, ID)..."
                 style="width:100%; padding:7px 12px 7px 32px; border-radius:20px; font-size:12.5px; border:1px solid var(--border-glass); background:rgba(0,0,0,0.12); color:var(--text-primary); outline:none;">
          <i class="bi bi-search" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); font-size:12px; color:var(--text-muted);"></i>
          <button *ngIf="criteria.searchTerm"
                  type="button"
                  (click)="clearSearch()"
                  style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:12px;"
                  title="Clear search"><i class="bi bi-x-lg"></i></button>
        </div>
      </div>

      <!-- Row 2: Granular Filters (Date Range, Party, Shift, Page Size) -->
      <div class="filter-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:10px; align-items:flex-end;">
        <!-- From Date -->
        <div class="form-group" style="margin:0;">
          <label style="font-size:10.5px; font-weight:700; color:var(--text-secondary);"><i class="bi bi-calendar3 me-1"></i> From Date</label>
          <input type="date" [(ngModel)]="criteria.fromDate" (change)="onFilterChange()" style="font-size:12px; padding:5px 8px;">
        </div>

        <!-- To Date -->
        <div class="form-group" style="margin:0;">
          <label style="font-size:10.5px; font-weight:700; color:var(--text-secondary);"><i class="bi bi-calendar3 me-1"></i> To Date</label>
          <input type="date" [(ngModel)]="criteria.toDate" (change)="onFilterChange()" style="font-size:12px; padding:5px 8px;">
        </div>

        <!-- Party / Customer (Optional) -->
        <div class="form-group" *ngIf="showPartyFilter" style="margin:0;">
          <label style="font-size:10.5px; font-weight:700; color:var(--text-secondary);"><i class="bi bi-building me-1"></i> Customer / Party</label>
          <select [(ngModel)]="criteria.partyId" (change)="onFilterChange()" style="font-size:12px; padding:5px 8px;">
            <option value="">All Customers</option>
            <option *ngFor="let p of parties" [value]="p.id">{{ p.partyName }}</option>
          </select>
        </div>

        <!-- Shift Filter (Optional for Production) -->
        <div class="form-group" *ngIf="showShiftFilter" style="margin:0;">
          <label style="font-size:10.5px; font-weight:700; color:var(--text-secondary);"><i class="bi bi-clock me-1"></i> Shift</label>
          <select [(ngModel)]="criteria.shift" (change)="onFilterChange()" style="font-size:12px; padding:5px 8px;">
            <option value="">All Shifts</option>
            <option value="Shift A (Morning)">Shift A (Morning)</option>
            <option value="Shift B (Evening)">Shift B (Evening)</option>
            <option value="Shift C (Night)">Shift C (Night)</option>
          </select>
        </div>

        <!-- Page Size -->
        <div class="form-group" style="margin:0;">
          <label style="font-size:10.5px; font-weight:700; color:var(--text-secondary);">Rows Per Page</label>
          <select [(ngModel)]="criteria.pageSize" (change)="onFilterChange()" style="font-size:12px; padding:5px 8px;">
            <option [ngValue]="10">10 Rows</option>
            <option [ngValue]="25">25 Rows</option>
            <option [ngValue]="50">50 Rows</option>
            <option [ngValue]="100">100 Rows</option>
            <option [ngValue]="-1">Show All</option>
          </select>
        </div>

        <!-- Clear & Export Actions -->
        <div style="display:flex; gap:6px;">
          <button type="button" class="btn btn-secondary btn-sm" (click)="resetFilters()" title="Reset Filters" style="flex:1; height:32px; font-size:11.5px;"><i class="bi bi-arrow-counterclockwise me-1"></i> Reset</button>
          <button type="button" class="btn btn-outline btn-sm" (click)="exportExcel.emit()" title="Export Filtered Data to Excel" style="flex:1; height:32px; font-size:11.5px;"><i class="bi bi-file-earmark-excel me-1"></i> Excel</button>
        </div>
      </div>

      <!-- Active Metrics Summary Badge -->
      <div *ngIf="totals" style="margin-top:10px; padding-top:8px; border-top:1px solid var(--border-glass); display:flex; justify-content:space-between; align-items:center; font-size:11.5px; color:var(--text-secondary);">
        <div>
          Showing <strong>{{ totals.count }}</strong> matching records
        </div>
        <div style="display:flex; gap:14px; font-weight:700;">
          <span *ngIf="totals.totalQuantity">Total Qty: <strong style="color:var(--text-primary);">{{ totals.totalQuantity | number }}</strong></span>
          <span *ngIf="totals.totalAmount">Total Value: <strong style="color:var(--accent-success, #10b981);">₹{{ totals.totalAmount | number:'1.2-2' }}</strong></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .preset-chip {
      background: rgba(255,255,255,0.06);
      border: 1px solid var(--border-glass);
      border-radius: 14px;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .preset-chip:hover { background: rgba(255,255,255,0.12); color: var(--text-primary); }
    .preset-chip.active {
      background: #f59e0b;
      color: #0f172a;
      font-weight: 700;
      border-color: #f59e0b;
      box-shadow: 0 2px 8px rgba(245,158,11,0.3);
    }
  `]
})
export class FilterBarComponent implements OnInit {
  @Input() criteria!: FilterCriteria;
  @Input() parties: any[] = [];
  @Input() showPartyFilter = true;
  @Input() showShiftFilter = false;
  @Input() totals: any = null;

  @Output() criteriaChange = new EventEmitter<FilterCriteria>();
  @Output() exportExcel = new EventEmitter<void>();

  private searchSubject = new Subject<string>();

  presets = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'current_fy', label: 'FY 2026-27' }
  ];

  constructor(private filterService: DataFilterService) {}

  ngOnInit() {
    if (!this.criteria) {
      this.criteria = this.filterService.getDefaultCriteria();
    }
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.criteria.searchTerm = term;
      this.criteria.page = 1;
      this.criteriaChange.emit(this.criteria);
    });
  }

  onPresetClick(presetId: string) {
    this.criteria.preset = presetId;
    const range = this.filterService.applyPreset(presetId);
    this.criteria.fromDate = range.fromDate;
    this.criteria.toDate = range.toDate;
    this.criteria.page = 1;
    this.criteriaChange.emit(this.criteria);
  }

  onSearchChange(term: string) {
    this.searchSubject.next(term);
  }

  clearSearch() {
    this.criteria.searchTerm = '';
    this.searchSubject.next('');
  }

  onFilterChange() {
    this.criteria.preset = 'custom';
    this.criteria.page = 1;
    this.criteriaChange.emit(this.criteria);
  }

  resetFilters() {
    this.criteria = this.filterService.getDefaultCriteria();
    this.criteriaChange.emit(this.criteria);
  }
}
