import { Component, OnInit, AfterViewInit, OnDestroy, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { NotificationService } from '../../../services/notification.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';
import { ResizableTableDirective } from '../../../directives/resizable-table.directive';
import { IndianDatePipe } from '../../../pipes/indian-date.pipe';
import { UniversalImporterComponent } from '../../shared/universal-importer/universal-importer.component';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  pinned?: boolean;
}

@Component({
  selector: 'app-production',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, AutoSelectDirective, FormStateDirective, ResizableTableDirective, IndianDatePipe, UniversalImporterComponent],
  templateUrl: './production.component.html',
  styleUrls: ['./production.component.css']
})
export class ProductionComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'production';
  @Input() loggedInUser: any = null;
  @Output() onNavigateTab = new EventEmitter<string>();

  // Global Filters passed from parent
  @Input() filterSearchQuery: string = '';
  @Input() filterDate: string = '';
  @Input() filterDateFrom: string = '';
  @Input() filterDateTo: string = '';
  @Input() filterMonth: string = '';
  @Input() filterYear: any = '';
  @Input() filterStatus: string = '';

  isLoading = true;
  isRefreshing = false;
  isFormVisible = false;
  isPpmFormVisible = false;
  hasError = false;
  Math = Math;

  // Data lists
  ppdList: any[] = [];
  ppmList: any[] = [];

  // Active form models
  ppdForm = { id: '', date: '', crateType: 'Apple Crate', totalProduction: 0, successful: 0, rejected: 0, shift: 'Morning Shift' };
  ppmForm = { id: '', month: 'May', year: 2026, cratesProduced: 0, electricityUnits: 0, electricityBill: 0 };

  // Contextual Per-Tab Filters
  // PPD Tab Filters
  tabFilterCrateType: string = '';
  tabFilterShift: string = '';
  tabFilterMinSuccessful: number | null = null;
  tabFilterMinEfficiency: number = 0;

  // PPM Tab Filters
  tabFilterPpmMonth: string = '';
  tabFilterPpmYear: any = '';
  tabFilterPpmMinCrates: number | null = null;
  tabFilterMetricView: 'all' | 'electricity' | 'production' | 'cost' = 'all';

  // Multi-Selection State
  selectedPpdIds: Set<string | number> = new Set();
  selectedPpmIds: Set<string | number> = new Set();

  // Column Configurations
  columnsConfig: { [tableKey: string]: ColumnConfig[] } = {
    ppd: [
      { key: 'select', label: 'Select', visible: true, pinned: true },
      { key: 'date', label: 'Date', visible: true },
      { key: 'crateType', label: 'Crate Type', visible: true },
      { key: 'shift', label: 'Shift', visible: true },
      { key: 'totalProduction', label: 'Total Production', visible: true },
      { key: 'successful', label: 'Successful', visible: true },
      { key: 'rejected', label: 'Rejected', visible: true },
      { key: 'efficiency', label: 'Efficiency', visible: true },
      { key: 'actions', label: 'Actions', visible: true }
    ],
    ppm: [
      { key: 'select', label: 'Select', visible: true, pinned: true },
      { key: 'monthYear', label: 'Month/Year', visible: true },
      { key: 'cratesProduced', label: 'Crates Produced', visible: true },
      { key: 'electricityUnits', label: 'Electricity Units', visible: true },
      { key: 'electricityBill', label: 'Electricity Bill', visible: true },
      { key: 'unitsPerCrate', label: 'Units/Crate', visible: true },
      { key: 'costPerCrate', label: 'Cost/Crate', visible: true },
      { key: 'actions', label: 'Actions', visible: true }
    ]
  };

  showColManager: { [tableKey: string]: boolean } = { ppd: false, ppm: false };
  showFilterPopover: { [tableKey: string]: boolean } = { ppd: false, ppm: false };

  getPpdFilterCount(): number {
    let count = 0;
    if (this.filterDate) count++;
    if (this.tabFilterCrateType) count++;
    if (this.tabFilterShift) count++;
    return count;
  }

  getPpmFilterCount(): number {
    let count = 0;
    if (this.tabFilterPpmMonth) count++;
    if (this.tabFilterPpmYear) count++;
    return count;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick() {
    this.showColManager['ppd'] = false;
    this.showColManager['ppm'] = false;
    this.showFilterPopover['ppd'] = false;
    this.showFilterPopover['ppm'] = false;
  }

  // Sorting & Pagination
  sortField = '';
  sortAsc = true;
  currentPage = 1;
  pageSize = 10;
  tableFilteredCounts: { [key: string]: number } = {};

  // Table Density & Preferences
  tableDensity: 'compact' | 'comfortable' | 'spacious' = 'comfortable';

  // Inline Cell Editing State
  editingCell: { tableKey: string; id: any; field: string } | null = null;
  inlineEditValue: any = null;

  // Drawer / Slide-in Modal Edit State
  drawerOpen = false;
  drawerMode: 'ppd' | 'ppm' = 'ppd';
  drawerRecord: any = null;

  // Dedicated Read-Only Batch QC Inspection Sheet / Dossier Modal
  showPpdDossierModal: boolean = false;
  selectedPpdForDossier: any = null;

  openPpdDossier(ppd: any) {
    this.selectedPpdForDossier = ppd;
    this.showPpdDossierModal = true;
  }

  closePpdDossier() {
    this.showPpdDossierModal = false;
    this.selectedPpdForDossier = null;
  }

  formatLotBadge(ppd: any): string {
    if (!ppd) return 'LOT-PPD-001';
    const rawId = String(ppd.id || ppd.batchNumber || '');
    if (!rawId) return 'LOT-PPD-001';
    if (rawId.toUpperCase().startsWith('LOT-')) return rawId.toUpperCase();
    if (rawId.includes('-') || rawId.length > 8) {
      const clean = rawId.replace(/[^a-zA-Z0-9]/g, '');
      return `LOT-PPD-${clean.substring(0, 6).toUpperCase()}`;
    }
    return `LOT-PPD-${rawId.padStart(3, '0')}`;
  }

  formatShortId(id: any): string {
    if (!id && id !== 0) return '001';
    const str = String(id);
    if (str.toUpperCase().startsWith('PPD-')) return str.toUpperCase().replace('PPD-', '');
    if (str.includes('-') || str.length > 8) {
      const clean = str.replace(/[^a-zA-Z0-9]/g, '');
      return clean.substring(0, 6).toUpperCase();
    }
    return str;
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.showPpdDossierModal) {
      this.closePpdDossier();
    } else if (this.drawerOpen) {
      this.closeDrawerEdit();
    }
  }

  printPpdDossier() {
    window.print();
  }

  editPpd(ppd: any) {
    if (!this.canEdit()) return;
    this.ppdForm = { ...ppd };
    this.isFormVisible = true;
  }

  editPpm(ppm: any) {
    if (!this.canEdit()) return;
    this.ppmForm = { ...ppm };
    this.isPpmFormVisible = true;
  }

  // Options
  crateTypes = ['Apple Crate', 'Tomato Tray', 'Mango Box', 'Grape Box'];
  shifts = ['Morning Shift', 'Afternoon Shift', 'Night Shift'];
  months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  getPpdTotal(): number {
    return (this.ppdList || []).reduce((acc, curr) => acc + (Number(curr.totalProduction) || 0), 0);
  }

  getPpdSuccessful(): number {
    return (this.ppdList || []).reduce((acc, curr) => acc + (Number(curr.successful) || 0), 0);
  }

  getPpdRejected(): number {
    return (this.ppdList || []).reduce((acc, curr) => acc + (Number(curr.rejected) || 0), 0);
  }

  getPpdEfficiency(): number {
    const total = this.getPpdTotal();
    const successful = this.getPpdSuccessful();
    return total > 0 ? (successful / total) * 100 : 0;
  }

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadPreferences();
    this.loadData();
  }

  loadPreferences() {
    try {
      const savedDensity = localStorage.getItem('futane_table_density') || localStorage.getItem('erp_table_density');
      if (savedDensity && ['compact', 'comfortable', 'spacious'].includes(savedDensity)) {
        this.tableDensity = savedDensity as any;
        document.body.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
        document.body.classList.add('density-' + savedDensity);
      }

      ['ppd', 'ppm'].forEach(tableKey => {
        const savedCols = localStorage.getItem(`erp_cols_${tableKey}`);
        if (savedCols) {
          const parsed: ColumnConfig[] = JSON.parse(savedCols);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.columnsConfig[tableKey] = parsed;
          }
        }
      });
    } catch {}
  }

  setDensity(density: 'compact' | 'comfortable' | 'spacious') {
    this.tableDensity = density;
    try {
      localStorage.setItem('futane_table_density', density);
      localStorage.setItem('erp_table_density', density);
      document.body.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
      document.body.classList.add('density-' + density);
    } catch {}
  }

  // --- Data Loading ---
  loadData() {
    if (this.ppdList.length === 0 && this.ppmList.length === 0) {
      this.isLoading = true;
    }
    this.isRefreshing = true;
    this.hasError = false;
    forkJoin({
      ppd: this.apiService.getPpd(),
      ppm: this.apiService.getPpm()
    }).subscribe({
      next: ({ ppd, ppm }) => {
        this.ppdList = ppd || [];
        this.ppmList = ppm || [];
        this.isLoading = false;
        setTimeout(() => {
          this.isRefreshing = false;
          if (this.activeTab === 'monthly-production') {
            this.updatePpmChart();
          }
        }, 300);
      },
      error: (err) => {
        this.isLoading = false;
        this.isRefreshing = false;
        this.hasError = true;
        this.notificationService.error('Load Failed', 'Could not load production data.');
      }
    });
  }

  toggleFormVisibility() {
    this.isFormVisible = !this.isFormVisible;
  }

  openForm(type: 'ppd' | 'ppm' = 'ppd') {
    if (type === 'ppd') {
      this.isFormVisible = true;
    } else {
      this.isPpmFormVisible = true;
    }
  }

  togglePpmFormVisibility() {
    this.isPpmFormVisible = !this.isPpmFormVisible;
  }

  switchSubTab(tab: string) {
    this.activeTab = tab;
    this.onNavigateTab.emit(tab);
    if (tab === 'monthly-production') {
      setTimeout(() => this.updatePpmChart(), 200);
    }
  }

  getActiveFilterCount(tableKey: string): number {
    let count = 0;
    if (this.filterSearchQuery && this.filterSearchQuery.trim()) count++;
    if (this.filterDate) count++;
    if (tableKey === 'ppd') {
      if (this.tabFilterCrateType) count++;
      if (this.tabFilterShift) count++;
      if (this.tabFilterMinSuccessful !== null && this.tabFilterMinSuccessful > 0) count++;
      if (this.tabFilterMinEfficiency > 0) count++;
    } else {
      if (this.tabFilterPpmMonth) count++;
      if (this.tabFilterPpmYear) count++;
      if (this.tabFilterPpmMinCrates !== null && this.tabFilterPpmMinCrates > 0) count++;
    }
    return count;
  }

  resetFilters(tableKey: string) {
    this.filterSearchQuery = '';
    this.filterDate = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    if (tableKey === 'ppd') {
      this.tabFilterCrateType = '';
      this.tabFilterShift = '';
      this.tabFilterMinSuccessful = null;
      this.tabFilterMinEfficiency = 0;
    } else {
      this.tabFilterPpmMonth = '';
      this.tabFilterPpmYear = '';
      this.tabFilterPpmMinCrates = null;
    }
    this.currentPage = 1;
    this.notificationService.info('Filters Reset', 'All search and category filters have been cleared.');
  }

  startEditInForm(item: any) {
    this.ppdForm = {
      id: item.id,
      date: item.date,
      crateType: item.crateType,
      totalProduction: item.totalProduction,
      successful: item.successful,
      rejected: item.rejected,
      shift: item.shift || 'Morning Shift'
    };
    this.isFormVisible = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  startPpmEditInForm(item: any) {
    this.ppmForm = {
      id: item.id,
      month: item.month,
      year: item.year,
      cratesProduced: item.cratesProduced,
      electricityUnits: item.electricityUnits,
      electricityBill: item.electricityBill
    };
    this.isPpmFormVisible = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- PPM Chart & Performance Visualization ---
  ppmChart: any = null;
  isChartVisible: boolean = true;
  chartMetricView: 'crates-cost' | 'units' = 'crates-cost';

  getPpmTotalCrates(): number {
    return (this.ppmList || []).reduce((acc, curr) => acc + (Number(curr.cratesProduced) || 0), 0);
  }

  getPpmTotalUnits(): number {
    return (this.ppmList || []).reduce((acc, curr) => acc + (Number(curr.electricityUnits) || 0), 0);
  }

  getPpmTotalBill(): number {
    return (this.ppmList || []).reduce((acc, curr) => acc + (Number(curr.electricityBill) || 0), 0);
  }

  getPpmAvgCostPerCrate(): number {
    const crates = this.getPpmTotalCrates();
    const bill = this.getPpmTotalBill();
    return crates > 0 ? bill / crates : 0;
  }

  getPpmAvgUnitsPerCrate(): number {
    const crates = this.getPpmTotalCrates();
    const units = this.getPpmTotalUnits();
    return crates > 0 ? units / crates : 0;
  }

  getPpmAverageCratesPerMonth(): number {
    const count = (this.ppmList || []).length;
    return count > 0 ? Math.round(this.getPpmTotalCrates() / count) : 0;
  }

  getPpmAverageUnitsPerMonth(): number {
    const count = (this.ppmList || []).length;
    return count > 0 ? this.getPpmTotalUnits() / count : 0;
  }

  getPpmAverageBillPerMonth(): number {
    const count = (this.ppmList || []).length;
    return count > 0 ? this.getPpmTotalBill() / count : 0;
  }

  getPpmPeakMonth(): string {
    if (!this.ppmList || this.ppmList.length === 0) return 'None';
    let peak = this.ppmList[0];
    for (const item of this.ppmList) {
      if ((Number(item.cratesProduced) || 0) > (Number(peak.cratesProduced) || 0)) {
        peak = item;
      }
    }
    return `${peak.month} ${peak.year}`;
  }

  getPpmYears(): number[] {
    const years = new Set<number>();
    (this.ppmList || []).forEach(p => {
      if (p.year) years.add(Number(p.year));
    });
    const curYear = new Date().getFullYear();
    years.add(curYear);
    years.add(curYear - 1);
    years.add(curYear + 1);
    return Array.from(years).sort((a, b) => b - a);
  }

  prevMonth() {
    if (!this.tabFilterPpmMonth) {
      this.tabFilterPpmMonth = 'August';
      this.currentPage = 1;
      this.updatePpmChart();
      return;
    }
    const idx = this.months.findIndex(m => m.toLowerCase() === this.tabFilterPpmMonth.toLowerCase());
    if (idx > 0) {
      this.tabFilterPpmMonth = this.months[idx - 1];
    } else if (idx === 0) {
      this.tabFilterPpmMonth = this.months[11];
      if (this.tabFilterPpmYear) this.tabFilterPpmYear = Number(this.tabFilterPpmYear) - 1;
    }
    this.currentPage = 1;
    this.updatePpmChart();
  }

  nextMonth() {
    if (!this.tabFilterPpmMonth) {
      this.tabFilterPpmMonth = 'March';
      this.currentPage = 1;
      this.updatePpmChart();
      return;
    }
    const idx = this.months.findIndex(m => m.toLowerCase() === this.tabFilterPpmMonth.toLowerCase());
    if (idx < 11 && idx >= 0) {
      this.tabFilterPpmMonth = this.months[idx + 1];
    } else if (idx === 11) {
      this.tabFilterPpmMonth = this.months[0];
      if (this.tabFilterPpmYear) this.tabFilterPpmYear = Number(this.tabFilterPpmYear) + 1;
    }
    this.currentPage = 1;
    this.updatePpmChart();
  }

  setQuickMonth(month: string) {
    this.tabFilterPpmMonth = month;
    this.currentPage = 1;
    this.updatePpmChart();
  }

  setQuickYear(year: any) {
    this.tabFilterPpmYear = year;
    this.currentPage = 1;
    this.updatePpmChart();
  }

  getCostEfficiencyClass(cost: number): string {
    if (cost <= 1.60) return 'badge-eff-optimum';
    if (cost <= 2.00) return 'badge-eff-normal';
    return 'badge-eff-high';
  }

  getFilteredSum(field: string): number {
    const list = this.getProcessedList(this.ppmList, 'ppm');
    return list.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);
  }

  getFilteredPpdSum(field: string): number {
    const list = this.getProcessedList(this.ppdList, 'ppd');
    return list.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);
  }

  getFilteredPpdOverallYield(): number {
    const total = this.getFilteredPpdSum('totalProduction');
    const successful = this.getFilteredPpdSum('successful');
    return total > 0 ? Math.round((successful / total) * 100) : 0;
  }

  getFilteredWeightedCostPerCrate(): number {
    const totalCrates = this.getFilteredSum('cratesProduced');
    const totalBill = this.getFilteredSum('electricityBill');
    return totalCrates > 0 ? totalBill / totalCrates : 0;
  }

  getFilteredWeightedUnitsPerCrate(): number {
    const totalCrates = this.getFilteredSum('cratesProduced');
    const totalUnits = this.getFilteredSum('electricityUnits');
    return totalCrates > 0 ? totalUnits / totalCrates : 0;
  }

  toggleChartVisibility() {
    this.isChartVisible = !this.isChartVisible;
    if (this.isChartVisible) {
      setTimeout(() => this.updatePpmChart(), 100);
    }
  }

  setChartMetricView(view: 'crates-cost' | 'units') {
    this.chartMetricView = view;
    this.updatePpmChart();
  }

  ngAfterViewInit() {
    if (this.activeTab === 'monthly-production') {
      setTimeout(() => this.updatePpmChart(), 300);
    }
  }

  ngOnDestroy() {
    if (this.ppmChart) {
      this.ppmChart.destroy();
      this.ppmChart = null;
    }
  }

  updatePpmChart() {
    if (!this.isChartVisible) return;
    const canvas = document.getElementById('ppmPerformanceChartCanvas') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.ppmChart) {
      this.ppmChart.destroy();
      this.ppmChart = null;
    }

    const monthOrder: { [m: string]: number } = {
      january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4,
      may: 5, june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8,
      september: 9, sep: 9, october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12
    };

    const sorted = [...(this.ppmList || [])].sort((a, b) => {
      const yearA = Number(a.year) || 2026;
      const yearB = Number(b.year) || 2026;
      const mA = monthOrder[String(a.month).toLowerCase()] || 0;
      const mB = monthOrder[String(b.month).toLowerCase()] || 0;
      return (yearA * 100 + mA) - (yearB * 100 + mB);
    });

    if (sorted.length === 0) return;

    const labels = sorted.map(s => `${String(s.month).slice(0, 3).toUpperCase()} ${s.year}`);
    const crates = sorted.map(s => Number(s.cratesProduced) || 0);
    const costs = sorted.map(s => (s.cratesProduced ? (Number(s.electricityBill) / Number(s.cratesProduced)) : 0));
    const units = sorted.map(s => Number(s.electricityUnits) || 0);
    const intensities = sorted.map(s => (s.cratesProduced ? (Number(s.electricityUnits) / Number(s.cratesProduced)) : 0));

    const chartFont: any = { family: "'Outfit', 'Segoe UI', sans-serif", size: 11.5 };

    let datasets: any[] = [];
    let scales: any = {};

    if (this.chartMetricView === 'crates-cost') {
      datasets = [
        {
          type: 'bar',
          label: 'Total Crates Produced',
          data: crates,
          backgroundColor: 'rgba(5, 150, 105, 0.72)',
          borderColor: '#059669',
          borderWidth: 1.5,
          borderRadius: 6,
          yAxisID: 'yCrates',
          order: 2
        },
        {
          type: 'line',
          label: 'Electricity Cost / Crate (₹)',
          data: costs,
          borderColor: '#d97706',
          backgroundColor: 'rgba(217, 119, 6, 0.15)',
          borderWidth: 2.5,
          tension: 0.35,
          pointRadius: 4.5,
          pointBackgroundColor: '#d97706',
          pointHoverRadius: 6.5,
          yAxisID: 'yCost',
          order: 1
        }
      ];

      scales = {
        x: {
          grid: { display: false },
          ticks: { color: '#64748b', font: chartFont }
        },
        yCrates: {
          type: 'linear',
          position: 'left',
          grid: { color: 'rgba(148, 163, 184, 0.12)' },
          ticks: {
            color: '#64748b',
            font: chartFont,
            callback: (val: any) => Number(val).toLocaleString()
          },
          title: { display: true, text: 'Crates Volume', color: '#64748b', font: { size: 10.5, weight: 'bold' } }
        },
        yCost: {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: {
            color: '#d97706',
            font: chartFont,
            callback: (val: any) => '₹' + Number(val).toFixed(2)
          },
          title: { display: true, text: 'Cost / Crate (₹)', color: '#d97706', font: { size: 10.5, weight: 'bold' } }
        }
      };
    } else {
      datasets = [
        {
          type: 'bar',
          label: 'Power Grid Usage (kWh)',
          data: units,
          backgroundColor: 'rgba(14, 165, 233, 0.72)',
          borderColor: '#0284c7',
          borderWidth: 1.5,
          borderRadius: 6,
          yAxisID: 'yUnits',
          order: 2
        },
        {
          type: 'line',
          label: 'Energy Intensity (kWh / Crate)',
          data: intensities,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.15)',
          borderWidth: 2.5,
          tension: 0.35,
          pointRadius: 4.5,
          pointBackgroundColor: '#8b5cf6',
          pointHoverRadius: 6.5,
          yAxisID: 'yIntensity',
          order: 1
        }
      ];

      scales = {
        x: {
          grid: { display: false },
          ticks: { color: '#64748b', font: chartFont }
        },
        yUnits: {
          type: 'linear',
          position: 'left',
          grid: { color: 'rgba(148, 163, 184, 0.12)' },
          ticks: {
            color: '#64748b',
            font: chartFont,
            callback: (val: any) => Number(val).toLocaleString() + ' kWh'
          },
          title: { display: true, text: 'Electricity (kWh)', color: '#64748b', font: { size: 10.5, weight: 'bold' } }
        },
        yIntensity: {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: {
            color: '#8b5cf6',
            font: chartFont,
            callback: (val: any) => Number(val).toFixed(2) + ' kWh'
          },
          title: { display: true, text: 'kWh / Crate', color: '#8b5cf6', font: { size: 10.5, weight: 'bold' } }
        }
      };
    }

    const chartConfig: any = {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 200 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 14,
              font: chartFont,
              usePointStyle: true
            }
          },
          tooltip: {
            padding: 10,
            cornerRadius: 8,
            titleFont: { family: "'Outfit', 'Segoe UI', sans-serif", size: 12, weight: 'bold' },
            bodyFont: { family: "'Outfit', 'Segoe UI', sans-serif", size: 11.5 }
          }
        },
        scales
      }
    };

    this.ppmChart = new Chart(canvas, chartConfig);
  }

  // --- Role Checkers ---
  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canEdit(): boolean {
    if (!this.loggedInUser) return false;
    return ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR'].includes(this.loggedInUser.role);
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  // --- Auto Calculations ---
  recalculateTotal() {
    const s = Number(this.ppdForm.successful) || 0;
    const r = Number(this.ppdForm.rejected) || 0;
    this.ppdForm.totalProduction = s + r;
  }

  onProductionFieldChange() {
    this.recalculateTotal();
  }

  getEfficiencyPct(successful: number, total: number): number {
    if (!total || isNaN(total) || total <= 0) return 0;
    return Math.round(((successful || 0) / total) * 100);
  }

  getEfficiencyColor(successful: number, total: number): string {
    const pct = this.getEfficiencyPct(successful, total);
    if (pct >= 90) return 'var(--accent-success, #10b981)';
    if (pct >= 75) return 'var(--accent-warning, #f59e0b)';
    return 'var(--accent-error, #ef4444)';
  }

  // --- Column Manager Methods ---
  isColVisible(tableKey: string, key: string): boolean {
    const col = this.columnsConfig[tableKey]?.find(c => c.key === key);
    return col ? col.visible : true;
  }

  toggleColVisibility(tableKey: string, key: string) {
    const col = this.columnsConfig[tableKey]?.find(c => c.key === key);
    if (col) {
      // Ensure at least 2 columns stay visible
      const visibleCount = this.columnsConfig[tableKey].filter(c => c.visible).length;
      if (col.visible && visibleCount <= 2) {
        this.notificationService.warning('Column Manager', 'At least one data column must remain visible.');
        return;
      }
      col.visible = !col.visible;
      this.saveColumnLayout(tableKey);
    }
  }

  moveColumn(tableKey: string, index: number, direction: 'up' | 'down') {
    const cols = this.columnsConfig[tableKey];
    if (!cols) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cols.length) return;
    const item = cols.splice(index, 1)[0];
    cols.splice(targetIndex, 0, item);
    this.saveColumnLayout(tableKey);
  }

  getVisibleColCount(tableKey: string): number {
    return this.columnsConfig[tableKey]?.filter(c => c.visible).length || 0;
  }

  saveColumnLayout(tableKey: string) {
    try {
      localStorage.setItem(`erp_cols_${tableKey}`, JSON.stringify(this.columnsConfig[tableKey]));
    } catch {}
  }

  resetColumnLayout(tableKey: string) {
    try {
      localStorage.removeItem(`erp_cols_${tableKey}`);
      if (tableKey === 'ppd') {
        this.columnsConfig['ppd'] = [
          { key: 'select', label: 'Select', visible: true, pinned: true },
          { key: 'date', label: 'Date', visible: true },
          { key: 'crateType', label: 'Crate Type', visible: true },
          { key: 'shift', label: 'Shift', visible: true },
          { key: 'totalProduction', label: 'Total Production', visible: true },
          { key: 'successful', label: 'Successful', visible: true },
          { key: 'rejected', label: 'Rejected', visible: true },
          { key: 'efficiency', label: 'Efficiency', visible: true },
          { key: 'actions', label: 'Actions', visible: true }
        ];
      } else {
        this.columnsConfig['ppm'] = [
          { key: 'select', label: 'Select', visible: true, pinned: true },
          { key: 'monthYear', label: 'Month/Year', visible: true },
          { key: 'cratesProduced', label: 'Crates Produced', visible: true },
          { key: 'electricityUnits', label: 'Electricity Units', visible: true },
          { key: 'electricityBill', label: 'Electricity Bill', visible: true },
          { key: 'unitsPerCrate', label: 'Units/Crate', visible: true },
          { key: 'costPerCrate', label: 'Cost/Crate', visible: true },
          { key: 'actions', label: 'Actions', visible: true }
        ];
      }
      this.notificationService.success('Reset Complete', 'Default column layout restored.');
    } catch {}
  }

  // --- Multi-Row Selection & Bulk Action Bar ---
  isRowSelected(tableKey: string, id: any): boolean {
    const set = tableKey === 'ppd' ? this.selectedPpdIds : this.selectedPpmIds;
    return set.has(id);
  }

  toggleSelectRow(tableKey: string, id: any) {
    const set = tableKey === 'ppd' ? this.selectedPpdIds : this.selectedPpmIds;
    if (set.has(id)) set.delete(id);
    else set.add(id);
  }

  isAllSelected(tableKey: string, visibleRows: any[]): boolean {
    if (!visibleRows || visibleRows.length === 0) return false;
    const set = tableKey === 'ppd' ? this.selectedPpdIds : this.selectedPpmIds;
    return visibleRows.every(r => set.has(r.id));
  }

  toggleSelectAll(tableKey: string, visibleRows: any[]) {
    const set = tableKey === 'ppd' ? this.selectedPpdIds : this.selectedPpmIds;
    if (this.isAllSelected(tableKey, visibleRows)) {
      visibleRows.forEach(r => set.delete(r.id));
    } else {
      visibleRows.forEach(r => set.add(r.id));
    }
  }

  getSelectedCount(tableKey: string): number {
    return tableKey === 'ppd' ? this.selectedPpdIds.size : this.selectedPpmIds.size;
  }

  clearSelection(tableKey: string) {
    if (tableKey === 'ppd') this.selectedPpdIds.clear();
    else this.selectedPpmIds.clear();
  }

  bulkDeleteSelected(tableKey: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', 'You do not have permission to delete.');
      return;
    }
    const set = tableKey === 'ppd' ? this.selectedPpdIds : this.selectedPpmIds;
    if (set.size === 0) return;

    this.notificationService.confirmAction(
      'Bulk Delete',
      `Are you sure you want to delete ${set.size} selected record(s)? This cannot be undone.`,
      'Yes, Delete All'
    ).then(confirmed => {
      if (confirmed) {
        const ids = Array.from(set);
        let completed = 0;
        ids.forEach(id => {
          const call = tableKey === 'ppd' ? this.apiService.deletePpd(String(id)) : this.apiService.deletePpm(String(id));
          call.subscribe({
            next: () => {
              completed++;
              if (completed === ids.length) {
                this.notificationService.success('Bulk Delete Complete', `Successfully deleted ${completed} records.`);
                this.clearSelection(tableKey);
                this.loadData();
              }
            },
            error: () => {
              completed++;
              if (completed === ids.length) {
                this.clearSelection(tableKey);
                this.loadData();
              }
            }
          });
        });
      }
    });
  }

  bulkExportSelected(tableKey: string) {
    const set = tableKey === 'ppd' ? this.selectedPpdIds : this.selectedPpmIds;
    const source = tableKey === 'ppd' ? this.ppdList : this.ppmList;
    const selectedRows = source.filter(r => set.has(r.id));
    if (selectedRows.length === 0) {
      this.notificationService.info('Export', 'Please select at least one row to export.');
      return;
    }
    this.exportRowsToCsv(selectedRows, `Selected_${tableKey === 'ppd' ? 'Daily_Production' : 'Monthly_Production'}`);
  }

  exportCurrentFilteredCsv(tableKey: string, filteredRows: any[]) {
    if (!filteredRows || filteredRows.length === 0) {
      this.notificationService.info('Export', 'No matching records to export.');
      return;
    }
    this.exportRowsToCsv(filteredRows, `${tableKey === 'ppd' ? 'Daily_Production' : 'Monthly_Production'}_Filtered`);
  }

  private exportRowsToCsv(rows: any[], filename: string) {
    if (!rows || rows.length === 0) return;
    const keys = Object.keys(rows[0]).filter(k => !['version', 'isDeleted', 'isActive', 'deletedBy', 'deletedDate'].includes(k));
    const header = keys.join(',');
    const csvLines = rows.map(r => keys.map(k => {
      let val = r[k];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'object') val = JSON.stringify(val);
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...csvLines].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notificationService.success('Export Ready', `Exported ${rows.length} rows to CSV.`);
  }

  // --- Inline Cell Editing ---
  startInlineEdit(tableKey: string, row: any, field: string) {
    if (!this.canEdit()) return;
    if (['totalProduction', 'efficiency', 'actions', 'select', 'costPerCrate', 'unitsPerCrate'].includes(field)) return;
    this.editingCell = { tableKey, id: row.id, field };
    this.inlineEditValue = row[field];
  }

  saveInlineEdit(tableKey: string, row: any) {
    if (!this.editingCell) return;
    const field = this.editingCell.field;
    row[field] = this.inlineEditValue;

    if (tableKey === 'ppd') {
      row.totalProduction = (Number(row.successful) || 0) + (Number(row.rejected) || 0);
      this.apiService.updatePpd(row.id, row).subscribe({
        next: () => {
          this.notificationService.success('Quick Save', `Updated ${field} successfully.`);
          this.editingCell = null;
        },
        error: (err) => this.notificationService.error('Update Failed', err.message)
      });
    } else {
      this.apiService.updatePpm(row.id, row).subscribe({
        next: () => {
          this.notificationService.success('Quick Save', `Updated ${field} successfully.`);
          this.editingCell = null;
        },
        error: (err) => this.notificationService.error('Update Failed', err.message)
      });
    }
  }

  cancelInlineEdit() {
    this.editingCell = null;
    this.inlineEditValue = null;
  }

  // --- Drawer / Slide-in Modal Edit ---
  openDrawerEdit(mode: 'ppd' | 'ppm', item: any) {
    if (!this.canEdit()) return;
    this.drawerMode = mode;
    this.drawerRecord = { ...item };
    this.drawerOpen = true;
  }

  closeDrawerEdit() {
    this.drawerOpen = false;
    this.drawerRecord = null;
  }

  saveDrawerEdit() {
    if (!this.drawerRecord || !this.drawerRecord.id) return;
    if (this.drawerMode === 'ppd') {
      this.drawerRecord.totalProduction = (Number(this.drawerRecord.successful) || 0) + (Number(this.drawerRecord.rejected) || 0);
      this.apiService.updatePpd(this.drawerRecord.id, this.drawerRecord).subscribe({
        next: () => {
          this.notificationService.success('Updated', 'Daily production entry updated.');
          this.closeDrawerEdit();
          this.loadData();
        },
        error: (err) => this.notificationService.error('Update Failed', err.message)
      });
    } else {
      this.apiService.updatePpm(this.drawerRecord.id, this.drawerRecord).subscribe({
        next: () => {
          this.notificationService.success('Updated', 'Monthly production summary updated.');
          this.closeDrawerEdit();
          this.loadData();
        },
        error: (err) => this.notificationService.error('Update Failed', err.message)
      });
    }
  }

  // --- Regular PPD CRUD ---
  savePpd() {
    const editId = (this.ppdForm as any).id;
    if (editId) {
      this.apiService.updatePpd(editId, this.ppdForm).subscribe({
        next: () => {
          this.loadData();
          this.notificationService.success('Updated', 'Daily production entry updated successfully.');
          this.ppdForm = { id: '', date: '', crateType: 'Apple Crate', totalProduction: 0, successful: 0, rejected: 0, shift: 'Morning Shift' };
        },
        error: (err) => this.notificationService.error('Error', err.error?.message || err.message)
      });
    } else {
      this.apiService.createPpd(this.ppdForm).subscribe({
        next: (newItem) => {
          if (newItem) this.ppdList.unshift(newItem);
          this.loadData();
          this.notificationService.success('Data Added', 'Daily production entry added successfully.');
          this.ppdForm = { id: '', date: '', crateType: 'Apple Crate', totalProduction: 0, successful: 0, rejected: 0, shift: 'Morning Shift' };
        },
        error: (err) => this.notificationService.error('Error', err.error?.message || err.message)
      });
    }
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
            this.selectedPpdIds.delete(id);
            this.notificationService.success('Deleted', 'Production entry deleted successfully.');
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  // --- Regular PPM CRUD ---
  savePpm() {
    const editId = (this.ppmForm as any).id;
    if (editId) {
      this.apiService.updatePpm(editId, this.ppmForm).subscribe({
        next: () => {
          this.loadData();
          this.notificationService.success('Updated', 'Monthly production summary updated.');
          this.ppmForm = { id: '', month: 'May', year: 2026, cratesProduced: 0, electricityUnits: 0, electricityBill: 0 };
        },
        error: (err) => this.notificationService.error('Error', err.error?.message || err.message)
      });
    } else {
      const isDup = (this.ppmList || []).some(p => 
        String(p.month).toLowerCase() === String(this.ppmForm.month).toLowerCase() && 
        String(p.year) === String(this.ppmForm.year)
      );
      if (isDup) {
        this.notificationService.warning('Duplicate Summary', `A monthly summary for ${this.ppmForm.month} ${this.ppmForm.year} already exists.`);
        return;
      }

      this.apiService.createPpm(this.ppmForm).subscribe({
        next: (newItem) => {
          if (newItem) this.ppmList.unshift(newItem);
          this.loadData();
          this.notificationService.success('Data Added', 'Monthly production summary added.');
          this.ppmForm = { id: '', month: 'May', year: 2026, cratesProduced: 0, electricityUnits: 0, electricityBill: 0 };
        },
        error: (err) => this.notificationService.error('Error', err.error?.message || err.message)
      });
    }
  }

  exportCurrentFilteredExcel(tableKey: string, data: any[]) {
    if (!data || data.length === 0) {
      this.notificationService.warning('Export Warning', 'No records to export.');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tableKey.toUpperCase());
    XLSX.writeFile(wb, `${tableKey}_production_records.xlsx`);
    this.notificationService.success('Export Successful', `Exported ${data.length} records to Excel.`);
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
            this.selectedPpmIds.delete(id);
            this.notificationService.success('Deleted', 'Monthly production entry deleted successfully.');
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  setSort(field: string) {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = true;
    }
  }

  // --- Comprehensive Filter & Processing Engine ---
  getProcessedList(list: any[], tableKey: string): any[] {
    if (!list) return [];
    let result = [...list];

    // 1. Global Universal Text Search
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

    // 2. Global Date Filter
    if (this.filterDate) {
      result = result.filter(item => (item.date || item.createdDate) === this.filterDate);
    }

    // 3. Global Date Range (From - To)
    if (this.filterDateFrom) {
      result = result.filter(item => {
        const itemDate = item.date || item.createdDate;
        return itemDate ? itemDate >= this.filterDateFrom : true;
      });
    }
    if (this.filterDateTo) {
      result = result.filter(item => {
        const itemDate = item.date || item.createdDate;
        return itemDate ? itemDate <= this.filterDateTo : true;
      });
    }

    // 4. Global Month Filter
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

    // 5. Global Year Filter
    if (this.filterYear) {
      result = result.filter(item => {
        if (item.year) return String(item.year) === String(this.filterYear);
        const itemDate = item.date || item.createdDate;
        if (itemDate) {
          return new Date(itemDate).getFullYear() === Number(this.filterYear);
        }
        return false;
      });
    }

    // 6. Contextual Per-Tab Filters for PPD
    if (tableKey === 'ppd') {
      if (this.tabFilterCrateType) {
        result = result.filter(i => i.crateType === this.tabFilterCrateType);
      }
      if (this.tabFilterShift) {
        result = result.filter(i => i.shift === this.tabFilterShift);
      }
      if (this.tabFilterMinSuccessful !== null && this.tabFilterMinSuccessful > 0) {
        result = result.filter(i => (i.successful || 0) >= this.tabFilterMinSuccessful!);
      }
      if (this.tabFilterMinEfficiency > 0) {
        result = result.filter(i => this.getEfficiencyPct(i.successful, i.totalProduction) >= this.tabFilterMinEfficiency);
      }
    }

    // 7. Contextual Per-Tab Filters for PPM
    if (tableKey === 'ppm') {
      if (this.tabFilterPpmMonth) {
        result = result.filter(i => String(i.month).toLowerCase() === this.tabFilterPpmMonth.toLowerCase());
      }
      if (this.tabFilterPpmYear) {
        result = result.filter(i => String(i.year) === String(this.tabFilterPpmYear));
      }
      if (this.tabFilterPpmMinCrates !== null && this.tabFilterPpmMinCrates > 0) {
        result = result.filter(i => (i.cratesProduced || 0) >= this.tabFilterPpmMinCrates!);
      }
    }

    // 8. Sorting
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

  // Get full filtered list without pagination (for select all and export)
  getFullFilteredList(list: any[], tableKey: string): any[] {
    if (!list) return [];
    let result = [...list];
    if (this.filterSearchQuery && this.filterSearchQuery.trim()) {
      const q = this.filterSearchQuery.toLowerCase().trim();
      result = result.filter(i => Object.values(i).some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(q)));
    }
    if (this.filterDate) result = result.filter(i => (i.date || i.createdDate) === this.filterDate);
    if (this.filterDateFrom) result = result.filter(i => (i.date || i.createdDate) >= this.filterDateFrom);
    if (this.filterDateTo) result = result.filter(i => (i.date || i.createdDate) <= this.filterDateTo);
    if (this.filterMonth) {
      result = result.filter(i => {
        if (i.month) return String(i.month).toLowerCase() === this.filterMonth.toLowerCase();
        const d = i.date || i.createdDate;
        return d ? new Date(d).toLocaleString('default', { month: 'long' }).toLowerCase() === this.filterMonth.toLowerCase() : false;
      });
    }
    if (this.filterYear) {
      result = result.filter(i => {
        if (i.year) return String(i.year) === String(this.filterYear);
        const d = i.date || i.createdDate;
        return d ? new Date(d).getFullYear() === Number(this.filterYear) : false;
      });
    }
    if (tableKey === 'ppd') {
      if (this.tabFilterCrateType) result = result.filter(i => i.crateType === this.tabFilterCrateType);
      if (this.tabFilterShift) result = result.filter(i => i.shift === this.tabFilterShift);
      if (this.tabFilterMinSuccessful) result = result.filter(i => (i.successful || 0) >= this.tabFilterMinSuccessful!);
      if (this.tabFilterMinEfficiency > 0) result = result.filter(i => this.getEfficiencyPct(i.successful, i.totalProduction) >= this.tabFilterMinEfficiency);
    } else {
      if (this.tabFilterPpmMonth) result = result.filter(i => String(i.month).toLowerCase() === this.tabFilterPpmMonth.toLowerCase());
      if (this.tabFilterPpmYear) result = result.filter(i => String(i.year) === String(this.tabFilterPpmYear));
      if (this.tabFilterPpmMinCrates) result = result.filter(i => (i.cratesProduced || 0) >= this.tabFilterPpmMinCrates!);
    }
    return result;
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.showColManager = { ppd: false, ppm: false };
      this.cancelInlineEdit();
      if (this.drawerOpen) this.closeDrawerEdit();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.col-manager-dropdown-wrapper')) {
      this.showColManager = { ppd: false, ppm: false };
    }
  }

  trackById(index: number, item: any): any {
    return item?.id ?? item?.ppdId ?? item?.ppmId ?? index;
  }
}
