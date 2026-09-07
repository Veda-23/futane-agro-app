import { Component, Input, Output, EventEmitter, OnChanges, OnInit, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import * as XLSX from 'xlsx';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'currency' | 'badge' | 'timeago';
}

export interface ActionConfig {
  label: string;
  icon?: string;
  class?: string;
  action: string;
}

import { ResizableTableDirective } from '../../directives/resizable-table.directive';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ResizableTableDirective],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css']
})
export class DataTableComponent implements OnInit, OnChanges, OnDestroy {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() actions: ActionConfig[] = [];
  @Input() searchPlaceholder: string = 'Search...';
  @Input() enableMultiSelect: boolean = true;
  @Input() tableId: string = 'data_table';
  @Input() hideToolbarSearch: boolean = false;
  
  @Output() actionClicked = new EventEmitter<{action: string, item: any}>();
  @Output() batchDelete = new EventEmitter<string[]>();

  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentPage: number = 1;
  pageSize: number = 10;
  
  processedData: any[] = [];
  selectedRows: Set<string> = new Set();
  allSelected = false;

  ngOnInit() {
    this.searchSub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm = term;
      this.currentPage = 1;
      this.processData();
    });
  }

  ngOnDestroy() {
    this.searchSub?.unsubscribe();
  }

  onSearchInput(value: string) {
    this.searchSubject.next(value);
  }

  trackById(index: number, item: any): any {
    return item.id ?? item.paymentId ?? item.rawMaterialId ?? index;
  }

  getRowId(item: any): string {
    if (!item) return '';
    const id = item.id ?? item.partyId ?? item.paymentId ?? item.rawMaterialId ?? item.employeeId ?? item.machineId ?? item.invoiceId ?? item.vendorId ?? item.driverId;
    return id != null ? String(id) : '';
  }

  toggleSelectAll() {
    this.allSelected = !this.allSelected;
    if (this.allSelected) {
      this.processedData.forEach((row: any) => {
        const id = this.getRowId(row);
        if (id) this.selectedRows.add(id);
      });
    } else {
      this.selectedRows.clear();
    }
  }

  toggleSelectRow(id: any) {
    const key = String(id);
    if (!key) return;
    if (this.selectedRows.has(key)) {
      this.selectedRows.delete(key);
    } else {
      this.selectedRows.add(key);
    }
    this.allSelected = this.processedData.length > 0 && this.selectedRows.size === this.processedData.length;
  }

  get hasSelection(): boolean {
    return this.selectedRows.size > 0;
  }

  emitEditSelected() {
    if (this.selectedRows.size !== 1) return;
    const selectedId = Array.from(this.selectedRows)[0];
    const item = this.data.find(d => {
      const id = d.id ?? d.partyId ?? d.paymentId ?? d.rawMaterialId ?? d.employeeId ?? d.machineId ?? d.invoiceId ?? d.vendorId ?? d.driverId;
      return String(id) === String(selectedId);
    });
    if (item) {
      this.actionClicked.emit({ action: 'edit', item });
    }
  }

  emitBatchDelete() {
    this.batchDelete.emit(Array.from(this.selectedRows));
    this.selectedRows.clear();
    this.allSelected = false;
  }

  getTimeAgo(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    if (isNaN(diff)) return String(dateStr);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN');
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.processData();
    }
  }
  
  setSort(col: string) {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
    this.processData();
  }
  
  onSearch() {
    this.currentPage = 1;
    this.processData();
  }
  
  processData() {
    if (!this.data) return;
    let result = [...this.data];
    
    // Deep search helper — traverses nested objects
    const deepSearch = (item: any, term: string): boolean => {
      if (item === null || item === undefined) return false;
      if (typeof item === 'object') {
        return Object.values(item).some(val => deepSearch(val, term));
      }
      return String(item).toLowerCase().includes(term);
    };

    // Search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(item => deepSearch(item, term));
    }
    
    // Sort
    if (this.sortColumn) {
      result.sort((a, b) => {
        let valA = a[this.sortColumn];
        let valB = b[this.sortColumn];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    // Pagination
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.processedData = result.slice(startIndex, startIndex + this.pageSize);
  }
  
  getTotalPages() {
    let result = this.data || [];
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      const deepSearch = (item: any): boolean => {
        if (item === null || item === undefined) return false;
        if (typeof item === 'object') return Object.values(item).some(v => deepSearch(v));
        return String(item).toLowerCase().includes(term);
      };
      result = result.filter(item => deepSearch(item));
    }
    return Math.ceil(result.length / this.pageSize) || 1;
  }
  
  changePage(page: number) {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.processData();
    }
  }

  onActionClick(action: string, item: any) {
    this.actionClicked.emit({ action, item });
  }
  
  exportCSV() {
      if (!this.data || this.data.length === 0) return;
      const headers = this.columns.map(c => c.label).join(',');
      const rows = this.data.map(item => this.columns.map(c => {
          let val = item[c.key] || '';
          return '"' + val.toString().replace(/"/g, '""') + '"';
      }).join(','));
      
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', 'export.csv');
      a.click();
  }

  exportExcel() {
    if (!this.data || this.data.length === 0) return;
    const flat = this.data.map(item => {
      const row: any = {};
      this.columns.forEach(col => {
        row[col.label] = item[col.key];
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(flat);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    const cols = Object.keys(flat[0] || {}).map(k => ({ wch: Math.max(k.length, 14) }));
    ws['!cols'] = cols;
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Export_${dateStr}.xlsx`);
  }
}
