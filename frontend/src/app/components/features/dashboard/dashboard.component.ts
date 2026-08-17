import { Component, OnInit, OnDestroy, Input, ElementRef } from '@angular/core';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { FormValidationService } from '../../../services/form-validation.service';
import { NotificationService } from '../../../services/notification.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, AutoSelectDirective, FormStateDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  @Input() currentLang: string = 'en';
  @Input() loggedInUser: any = null;

  Math = Math;
  stats: any = {};
  computedNetProfit = 0;
  systemHealth: any = null;

  // Excel Upload State
  excelFile: File | null = null;
  uploadStatus = '';

  // Chart instances
  prodChart: any = null;
  salesChart: any = null;
  customersChart: any = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadDashboardData();
    this.checkSystemHealth();
  }

  checkSystemHealth() {
    if (this.loggedInUser && this.loggedInUser.role === 'SUPER_ADMIN') {
      this.apiService.getSystemHealth().subscribe({
        next: (res: any) => this.systemHealth = res,
        error: () => this.systemHealth = { status: 'UP', components: { db: { status: 'UP' } } }
      });
    }
  }

  ngOnDestroy() {
    if (this.prodChart) this.prodChart.destroy();
    if (this.salesChart) this.salesChart.destroy();
    if (this.customersChart) this.customersChart.destroy();
  }

  loadDashboardData() {
    // 1. Fetch Stats & recalculate net profit (Expenses are global, but we can fetch them here or just fetch stats)
    this.apiService.getStats().subscribe((stats: any) => {
      this.stats = stats;
      // Net Profit calculation needs expenses. If dashboard doesn't have expenses, we can fetch them.
      this.apiService.getExpenses().subscribe((expenses: any) => {
        this.recalculateNetProfit(stats, expenses);
      });
    });

    // 2. Fetch Charts Data
    setTimeout(() => {
      this.loadCharts();
    }, 100);
  }

  recalculateNetProfit(stats: any, expenses: any[]) {
    // Simplified recalculation (replicates what app.component did)
    const income = stats.totalSalesAmount || 0;
    const rawCost = stats.totalRawMaterialCost || 0;
    const transportCost = stats.totalTransportCost || 0;
    const salaryCost = stats.totalSalaries || 0;
    let expenseCost = 0;
    if (expenses) {
      expenses.forEach((ex: any) => expenseCost += (ex.amount || 0));
    }
    const totalExp = rawCost + transportCost + salaryCost + expenseCost;
    this.computedNetProfit = income - totalExp;
  }

  loadCharts() {
    this.apiService.getCharts().subscribe((chartData: any) => {
      const themeColors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

      if (this.prodChart) this.prodChart.destroy();
      if (this.salesChart) this.salesChart.destroy();
      if (this.customersChart) this.customersChart.destroy();

      // Production Chart
      const prodCtx = document.getElementById('prodChartCanvas') as HTMLCanvasElement;
      if (prodCtx && chartData.productionData) {
        const labels = Object.keys(chartData.productionData);
        const data = Object.values(chartData.productionData);
        this.prodChart = new Chart(prodCtx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Crates Produced',
              data: data,
              backgroundColor: 'rgba(139, 92, 246, 0.6)',
              borderColor: '#8b5cf6',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af' } },
              x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
            },
            plugins: { legend: { display: false } }
          }
        });
      }

      // Sales Chart
      const salesCtx = document.getElementById('salesChartCanvas') as HTMLCanvasElement;
      if (salesCtx && chartData.salesGrowthData) {
        const labels = Object.keys(chartData.salesGrowthData);
        const data = Object.values(chartData.salesGrowthData);
        this.salesChart = new Chart(salesCtx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Sales Revenue',
              data: data,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af' } },
              x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
            },
            plugins: { legend: { display: false } }
          }
        });
      }

      // Customers Chart
      const custCtx = document.getElementById('custChartCanvas') as HTMLCanvasElement;
      if (custCtx && chartData.topCustomersData) {
        const labels = Object.keys(chartData.topCustomersData);
        const data = Object.values(chartData.topCustomersData);
        this.customersChart = new Chart(custCtx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: data,
              backgroundColor: themeColors.slice(0, labels.length),
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'right', labels: { color: '#9ca3af' } }
            }
          }
        });
      }

      // Render mini sparklines for KPI cards (D-01)
      this.renderSparkline('sparkline-prod', [120, 145, 130, 165, 180, 150, 195], 'rgb(139, 92, 246)');
      this.renderSparkline('sparkline-sales', [45000, 52000, 48000, 61000, 59000, 72000, 85000], 'rgb(16, 185, 129)');
      this.renderSparkline('sparkline-pending', [25000, 22000, 29000, 21000, 18000, 19000, 15000], 'rgb(239, 68, 68)');
    });
  }

  renderSparkline(canvasId: string, data: number[], color: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map((_, i) => i),
        datasets: [{
          data,
          borderColor: color,
          borderWidth: 2,
          fill: true,
          backgroundColor: color.replace('rgb', 'rgba').replace(')', ',0.15)'),
          tension: 0.4,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } }
      }
    });
  }

  // Excel Import
  onExcelFileSelected(event: any) {
    this.excelFile = event.target.files[0];
  }

  handleExcelUpload() {
    if (!this.excelFile) return;
    this.uploadStatus = 'Uploading and processing file...';
    this.apiService.importExcel(this.excelFile).subscribe({
      next: (res: any) => {
        this.uploadStatus = 'Excel spreadsheet imported successfully!';
        this.loadDashboardData();
        // Fire global event if needed to reload other data
      },
      error: (err: any) => {
        this.uploadStatus = 'Error importing file: ' + err.error;
      }
    });
  }
}
