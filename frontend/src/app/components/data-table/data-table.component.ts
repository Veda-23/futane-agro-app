import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'currency' | 'badge';
}

export interface ActionConfig {
  label: string;
  icon?: string;
  class?: string;
  action: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css']
})
export class DataTableComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() actions: ActionConfig[] = [];
  @Input() searchPlaceholder: string = 'Search...';
  
  @Output() actionClicked = new EventEmitter<{action: string, item: any}>();

  searchTerm: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentPage: number = 1;
  pageSize: number = 10;
  
  processedData: any[] = [];
  
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
    
    // Search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(item => {
        return Object.values(item).some(val => 
          val && val.toString().toLowerCase().includes(term)
        );
      });
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
      result = result.filter(item => {
        return Object.values(item).some(val => 
          val && val.toString().toLowerCase().includes(term)
        );
      });
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
}
