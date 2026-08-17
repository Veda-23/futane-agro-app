import { Component, OnInit, Input } from '@angular/core';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { NotificationService } from '../../../services/notification.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';

import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-production',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, AutoSelectDirective, FormStateDirective],
  templateUrl: './production.component.html',
  styleUrls: ['./production.component.css']
})
export class ProductionComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'production';
  @Input() loggedInUser: any = null;

  isLoading = true;
  hasError = false;

  Math = Math;

  // State
  ppdList: any[] = [];
  ppmList: any[] = [];
  
  // Forms
  ppdForm = { date: '', crateType: 'Apple Crate', totalProduction: 0, successful: 0, rejected: 0, shift: 'Morning Shift' };
  ppmForm = { month: 'May', year: 2026, cratesProduced: 0, electricityUnits: 0, electricityBill: 0 };

  // Filter & Pagination
  currentPage = 1;
  pageSize = 10;
  sortField = '';
  sortAsc = true;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  constructor(private apiService: ApiService, private notificationService: NotificationService) {}

  ngOnInit() {
    this.loadData();
  }

  recalculateTotal() {
    const s = Number(this.ppdForm.successful) || 0;
    const r = Number(this.ppdForm.rejected) || 0;
    this.ppdForm.totalProduction = s + r;
  }

  loadData() {
    this.isLoading = true;
    this.hasError = false;
    forkJoin({
      ppd: this.apiService.getPpd(),
      ppm: this.apiService.getPpm()
    }).subscribe({
      next: ({ ppd, ppm }) => {
        this.ppdList = ppd || [];
        this.ppmList = ppm || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.hasError = true;
        this.notificationService.error('Load Failed', 'Could not load production data.');
      }
    });
  }

  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  onProductionFieldChange() {
    const s = Number(this.ppdForm.successful) || 0;
    const r = Number(this.ppdForm.rejected) || 0;
    this.ppdForm.totalProduction = s + r;
  }

  // --- PPD Methods ---
  savePpd() {
    this.apiService.createPpd(this.ppdForm).subscribe({
      next: (newItem) => {
        if (newItem) this.ppdList.unshift(newItem);
        this.loadData();
        this.notificationService.success('Data Added', 'Daily production entry added successfully');
        this.ppdForm = { date: '', crateType: 'Apple Crate', totalProduction: 0, successful: 0, rejected: 0, shift: 'Morning Shift' };
      },
      error: (err) => this.notificationService.error('Error', err.error?.message || err.message)
    });
  }

  deletePpd(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to delete.");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this production entry?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deletePpd(id).subscribe({
          next: () => {
            this.ppdList = this.ppdList.filter(x => (x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Production entry deleted successfully');
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  // --- PPM Methods ---
  savePpm() {
    this.apiService.createPpm(this.ppmForm).subscribe({
      next: (newItem) => {
        if (newItem) this.ppmList.unshift(newItem);
        this.loadData();
        this.notificationService.success('Data Added', 'Monthly production summary added successfully');
        this.ppmForm = { month: 'May', year: 2026, cratesProduced: 0, electricityUnits: 0, electricityBill: 0 };
      },
      error: (err) => this.notificationService.error('Error', err.error?.message || err.message)
    });
  }

  deletePpm(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to delete.");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this monthly production entry?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deletePpm(id).subscribe({
          next: () => {
            this.ppmList = this.ppmList.filter(x => (x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Monthly production entry deleted successfully');
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
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

  @Input() filterSearchQuery: string = '';
  @Input() filterDate: string = '';
  @Input() filterMonth: string = '';

  getProcessedList(list: any[], tableKey: string): any[] {
    if (!list) return [];
    let result = [...list];

    if (this.filterSearchQuery && this.filterSearchQuery.trim()) {
      const query = this.filterSearchQuery.toLowerCase().trim();
      result = result.filter(item => {
        const checkVal = (val: any): boolean => {
          if (val === null || val === undefined) return false;
          if (typeof val === 'object') return Object.values(val).some(v => checkVal(v));
          return String(val).toLowerCase().includes(query);
        };
        return Object.values(item).some(val => checkVal(val));
      });
    }

    if (this.filterDate) {
      result = result.filter(item => (item.date || item.createdDate) === this.filterDate);
    }

    if (this.filterMonth) {
      result = result.filter(item => {
        if (item.month) return String(item.month).toLowerCase() === this.filterMonth.toLowerCase();
        const itemDate = item.date || item.createdDate;
        if (itemDate) {
          const m = new Date(itemDate).toLocaleString('default', { month: 'long' });
          return m.toLowerCase() === this.filterMonth.toLowerCase();
        }
        return false;
      });
    }

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

    this.tableFilteredCounts[tableKey] = result.length;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return result.slice(startIndex, startIndex + this.pageSize);
  }
}
