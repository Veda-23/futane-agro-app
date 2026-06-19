import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';

@Component({
  selector: 'app-production',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './production.component.html',
  styleUrls: ['./production.component.css']
})
export class ProductionComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'production';
  @Input() loggedInUser: any = null;

  Math = Math;

  // State
  ppdList: any[] = [];
  ppmList: any[] = [];
  
  // Forms
  ppdForm = { date: '', crateType: 'Apple Crate', totalProduction: 0, successful: 0, rejected: 0, shift: 'Morning Shift' };
  ppmForm = { month: 'May', year: 2026, cratesProduced: 0, electricityUnits: 0, electricityBill: 0 };

  // Filter & Pagination (simplified for component)
  currentPage = 1;
  pageSize = 10;
  sortField = '';
  sortAsc = true;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.apiService.getPpd().subscribe((list: any[]) => this.ppdList = list);
    this.apiService.getPpm().subscribe((list: any[]) => this.ppmList = list);
  }

  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  // --- PPD Methods ---
  savePpd() {
    this.apiService.createPpd(this.ppdForm).subscribe(() => {
      this.loadData();
      this.ppdForm = { date: '', crateType: 'Apple Crate', totalProduction: 0, successful: 0, rejected: 0, shift: 'Morning Shift' };
    });
  }

  deletePpd(id: number) {
    this.apiService.deletePpd(id).subscribe(() => {
      this.loadData();
    });
  }

  // --- PPM Methods ---
  savePpm() {
    this.apiService.createPpm(this.ppmForm).subscribe(() => {
      this.loadData();
      this.ppmForm = { month: 'May', year: 2026, cratesProduced: 0, electricityUnits: 0, electricityBill: 0 };
    });
  }

  deletePpm(id: number) {
    this.apiService.deletePpm(id).subscribe(() => {
      this.loadData();
    });
  }

  // --- Table Utilities ---
  getTableColumns(table: string): string[] {
    if (table === 'ppd') return ['Date', 'Crate Type', 'Total Production', 'Successful', 'Rejected', 'Actions'];
    if (table === 'ppm') return ['Month/Year', 'Crates Produced', 'Electricity Units', 'Electricity Bill', 'Units/Crate', 'Cost/Crate', 'Actions'];
    return [];
  }

  isColumnVisible(table: string, col: string): boolean {
    if (!this.columnsVisibility[table]) return true;
    return this.columnsVisibility[table][col] !== false;
  }

  toggleColumn(table: string, col: string) {
    if (!this.columnsVisibility[table]) {
      this.columnsVisibility[table] = {};
    }
    const current = this.isColumnVisible(table, col);
    this.columnsVisibility[table][col] = !current;
  }

  toggleColDropdown(table: string) {
    this.showColDropdown[table] = !this.showColDropdown[table];
  }

  setSort(field: string) {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = true;
    }
  }

  getProcessedList(list: any[], tableKey: string): any[] {
    if (!list) return [];
    let result = [...list];

    // Sorting
    if (this.sortField) {
      result.sort((a, b) => {
        let valA = a[this.sortField];
        let valB = b[this.sortField];

        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        if (typeof valA === 'string') {
          return this.sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
          return this.sortAsc ? (valA - valB) : (valB - valA);
        }
      });
    }

    // Pagination
    this.tableFilteredCounts[tableKey] = result.length;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return result.slice(startIndex, startIndex + this.pageSize);
  }
}
