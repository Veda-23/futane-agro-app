import { Component, OnInit, Input, ElementRef } from '@angular/core';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { FormValidationService } from '../../../services/form-validation.service';
import { NotificationService } from '../../../services/notification.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, AutoSelectDirective, FormStateDirective],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'inventory';
  @Input() loggedInUser: any = null;

  inventoryList: any[] = [];
  rawMaterialsList: any[] = [];
  ppdList: any[] = [];
  Math = Math;

  // Pagination & Sort state
  currentPage = 1;
  pageSize = 10;
  sortField = 'id';
  sortAsc = true;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  defaultColumns = ['ID', 'Crate Type', 'Material', 'Opening', 'Produced', 'Sold', 'Available', 'Last Updated'];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
    this.columnsVisibility['inventory'] = {};
    this.defaultColumns.forEach(col => {
      this.columnsVisibility['inventory'][col] = true;
    });
  }

  loadData() {
    this.apiService.getInventory().subscribe((res: any[]) => {
      this.inventoryList = res;
      this.tableFilteredCounts['inventory'] = this.inventoryList.length;
    });
    this.apiService.getRawMaterials().subscribe((res: any[]) => {
      this.rawMaterialsList = res || [];
    });
    this.apiService.getPpd().subscribe((res: any[]) => {
      this.ppdList = res || [];
    });
  }

  // Predictive AI & Raw Material Shortfall Algorithm (Y-01)
  get materialShortfallPrediction(): any[] {
    const avgKgPerCrate = 1.85; // Average HDPE granular weight per crate
    const avgDailyCrateProduction = this.calculateAvgDailyProduction();
    const dailyMaterialBurnoutKg = avgDailyCrateProduction * avgKgPerCrate;

    return (this.rawMaterialsList || []).map(rm => {
      const currentStock = rm.weight || rm.quantity || 0;
      const daysRemaining = dailyMaterialBurnoutKg > 0
        ? Math.floor(currentStock / dailyMaterialBurnoutKg)
        : 999;

      return {
        material: rm.materialName || rm.materialType || 'HDPE Granules',
        currentStock,
        burnoutRatePerDay: dailyMaterialBurnoutKg.toFixed(1),
        daysRemaining,
        riskLevel: daysRemaining <= 3 ? 'CRITICAL' : daysRemaining <= 7 ? 'WARNING' : 'HEALTHY'
      };
    });
  }

  calculateAvgDailyProduction(): number {
    if (!this.ppdList || this.ppdList.length === 0) return 150;
    const total = this.ppdList.slice(0, 14).reduce((sum, p) => sum + (p.totalProduction || p.successful || 0), 0);
    return Math.max(50, Math.round(total / Math.min(this.ppdList.length, 14)));
  }

  // Table handling methods
  toggleColDropdown(table: string) {
    this.showColDropdown[table] = !this.showColDropdown[table];
  }

  getTableColumns(table: string): string[] {
    return this.defaultColumns;
  }

  isColumnVisible(table: string, col: string): boolean {
    return this.columnsVisibility[table] ? this.columnsVisibility[table][col] : true;
  }

  toggleColumn(table: string, col: string) {
    if (this.columnsVisibility[table]) {
      this.columnsVisibility[table][col] = !this.columnsVisibility[table][col];
    }
  }

  setSort(field: string) {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = true;
    }
  }

  getProcessedList(list: any[], table: string): any[] {
    if (!list) return [];
    
    // Sort
    let sorted = [...list].sort((a, b) => {
      let valA = this.resolvePath(a, this.sortField);
      let valB = this.resolvePath(b, this.sortField);
      
      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });

    this.tableFilteredCounts[table] = sorted.length;

    // Paginate
    const start = (this.currentPage - 1) * this.pageSize;
    return sorted.slice(start, start + this.pageSize);
  }

  private resolvePath(obj: any, path: string): any {
    if (!path) return '';
    return path.split('.').reduce((o, p) => o && o[p] != null ? o[p] : '', obj);
  }
}

