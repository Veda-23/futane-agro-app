import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { NotificationService } from '../../../services/notification.service';
import { InrPipe } from '../../../pipes/inr-currency.pipe';
import { IndianDatePipe } from '../../../pipes/indian-date.pipe';
import { Chart, registerables } from 'chart.js';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { forkJoin } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, AutoSelectDirective, FormStateDirective, InrPipe, IndianDatePipe],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit, OnDestroy {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'reports';

  @Input() ppdList: any[] = [];
  @Input() salesList: any[] = [];
  @Input() inventoryList: any[] = [];
  @Input() salariesList: any[] = [];
  @Input() transportsList: any[] = [];
  @Input() paymentsList: any[] = [];
  @Input() expensesList: any[] = [];
  @Input() parties: any[] = [];

  isLoading = false;
  hasError = false;

  reportFilter = {
    type: 'production',
    fromDate: '',
    toDate: '',
    partyId: '',
    employeeId: '',
    month: '',
    year: new Date().getFullYear().toString()
  };

  filteredReportData: any[] = [];
  reportTotals = { amount: 0, qty: 0, count: 0 };
  private reportChart: Chart | null = null;

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    if (this.reportChart) {
      this.reportChart.destroy();
    }
  }

  loadData() {
    this.isLoading = true;
    this.hasError = false;
    forkJoin({
      parties: this.apiService.getParties(),
      ppd: this.apiService.getPpd(),
      sales: this.apiService.getSales(),
      inventory: this.apiService.getInventory(),
      salaries: this.apiService.getSalaries(),
      transports: this.apiService.getTransports(),
      payments: this.apiService.getPayments(),
      expenses: this.apiService.getExpenses()
    }).subscribe({
      next: (res: any) => {
        if (res.parties) this.parties = res.parties;
        if (res.ppd) this.ppdList = res.ppd;
        if (res.sales) this.salesList = res.sales;
        if (res.inventory) this.inventoryList = res.inventory;
        if (res.salaries) this.salariesList = res.salaries;
        if (res.transports) this.transportsList = res.transports;
        if (res.payments) this.paymentsList = res.payments;
        if (res.expenses) this.expensesList = res.expenses;

        this.isLoading = false;
        this.runReport();
      },
      error: (err) => {
        this.isLoading = false;
        this.hasError = true;
        this.notificationService.error('Load Failed', 'Could not load reporting datasets.');
      }
    });
  }

  // Date Range Helper (E-01)
  inDateRange(dateStr: string | null | undefined): boolean {
    if (!dateStr) return true;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    const from = this.reportFilter.fromDate ? new Date(this.reportFilter.fromDate) : null;
    const to = this.reportFilter.toDate ? new Date(this.reportFilter.toDate + 'T23:59:59') : null;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  }

  setCurrentFY() {
    const now = new Date();
    const fyStart = now.getMonth() >= 3 // April is month 3 (0-indexed)
      ? new Date(now.getFullYear(), 3, 1)
      : new Date(now.getFullYear() - 1, 3, 1);
    const fyEnd = new Date(fyStart.getFullYear() + 1, 2, 31);
    this.reportFilter.fromDate = fyStart.toISOString().split('T')[0];
    this.reportFilter.toDate = fyEnd.toISOString().split('T')[0];
    this.runReport();
  }

  getCurrentFYLabel(): string {
    const now = new Date();
    const startYr = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return `${startYr}-${String(startYr + 1).slice(-2)}`;
  }

  setCurrentMonth() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.reportFilter.fromDate = firstDay.toISOString().split('T')[0];
    this.reportFilter.toDate = lastDay.toISOString().split('T')[0];
    this.runReport();
  }

  clearReportFilters() {
    this.reportFilter = {
      type: this.reportFilter.type,
      fromDate: '',
      toDate: '',
      partyId: '',
      employeeId: '',
      month: '',
      year: new Date().getFullYear().toString()
    };
    this.runReport();
  }

  runReport() {
    this.filteredReportData = [];
    const filter = this.reportFilter;

    if (filter.type === 'production') {
      this.filteredReportData = (this.ppdList || []).filter(d => this.inDateRange(d.date));
    } else if (filter.type === 'sales') {
      this.filteredReportData = (this.salesList || []).filter(s => {
        const inDate = this.inDateRange(s.date);
        const matchParty = filter.partyId ? (s.party?.id === filter.partyId || s.partyId === filter.partyId) : true;
        return inDate && matchParty;
      });
    } else if (filter.type === 'inventory') {
      this.filteredReportData = [...(this.inventoryList || [])];
    } else if (filter.type === 'salary') {
      this.filteredReportData = (this.salariesList || []).filter(s => {
        if (filter.month) {
          const [yr, mo] = filter.month.split('-');
          return String(s.year) === yr && String(s.month) === mo;
        }
        return true;
      });
    } else if (filter.type === 'transport') {
      this.filteredReportData = (this.transportsList || []).filter(t => this.inDateRange(t.date));
    } else if (filter.type === 'expense') {
      this.filteredReportData = (this.expensesList || []).filter(e => this.inDateRange(e.date || e.expenseDate));
    }

    // Compute Totals (E-02)
    this.reportTotals = {
      count: this.filteredReportData.length,
      amount: this.filteredReportData.reduce((sum, r) => {
        return sum + (r.totalAmount || r.salaryAmount || r.rent || r.amount || 0);
      }, 0),
      qty: this.filteredReportData.reduce((sum, r) => {
        return sum + (r.quantity || r.totalProduction || r.currentStock || 0);
      }, 0)
    };

    setTimeout(() => {
      this.renderReportChart();
    }, 50);
  }

  // Party Ledger (E-03)
  get partyLedgerRows(): any[] {
    if (!this.reportFilter.partyId) return [];
    const partyId = this.reportFilter.partyId;
    const rows: any[] = [];

    // Sales (Debit)
    (this.salesList || [])
      .filter(s => (s.party?.id === partyId || s.partyId === partyId) && this.inDateRange(s.date))
      .forEach(s => {
        rows.push({
          date: s.date,
          type: 'Sale',
          description: `${s.crateType || 'Crates'} × ${s.quantity || 0}`,
          debit: s.totalAmount || 0,
          credit: 0
        });
      });

    // Payments (Credit)
    (this.paymentsList || [])
      .filter(p => (p.party?.id === partyId || p.partyId === partyId) && this.inDateRange(p.paymentDate))
      .forEach(p => {
        rows.push({
          date: p.paymentDate,
          type: 'Payment',
          description: `${p.paymentMode || 'Cash'} Receipt ${p.invoiceNo ? '(Inv: ' + p.invoiceNo + ')' : ''}`,
          debit: 0,
          credit: p.amountReceived || 0
        });
      });

    rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let balance = 0;
    rows.forEach(r => {
      balance += r.debit - r.credit;
      r.balance = balance;
    });

    return rows;
  }

  get selectedPartyName(): string {
    return this.parties.find(p => p.id === this.reportFilter.partyId)?.partyName || '';
  }

  // Monthly Production Summary (E-04)
  get monthlyProductionSummary(): any[] {
    const grouped: { [key: string]: any } = {};
    (this.ppdList || [])
      .filter(p => this.inDateRange(p.date))
      .forEach(p => {
        const d = new Date(p.date);
        if (isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!grouped[key]) {
          grouped[key] = {
            month: key,
            label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
            totalProduction: 0,
            successful: 0,
            rejected: 0,
            days: 0
          };
        }
        grouped[key].totalProduction += p.totalProduction || 0;
        grouped[key].successful += p.successful || 0;
        grouped[key].rejected += p.rejected || 0;
        grouped[key].days++;
      });

    return Object.values(grouped)
      .map(m => ({
        ...m,
        efficiency: m.totalProduction > 0
          ? ((m.successful / m.totalProduction) * 100).toFixed(1) + '%'
          : '0%'
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  // Expense Summary (E-06)
  get expenseSummary(): any[] {
    const groups: { [cat: string]: number } = {};
    const total = this.expenseTotalForPeriod;
    const expenses = (this.expensesList || []).filter(e => this.inDateRange(e.date || e.expenseDate));
    expenses.forEach(e => {
      const cat = e.category || 'Maintenance';
      groups[cat] = (groups[cat] || 0) + (e.amount || 0);
    });

    return Object.entries(groups)
      .map(([category, sum]) => ({
        category,
        total: sum,
        pct: total > 0 ? ((sum / total) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.total - a.total);
  }

  get expenseTotalForPeriod(): number {
    return (this.expensesList || [])
      .filter(e => this.inDateRange(e.date || e.expenseDate))
      .reduce((s, e) => s + (e.amount || 0), 0);
  }

  // Payroll Summary (E-08)
  get payrollSummary(): any {
    const filtered = (this.salariesList || []).filter(s => {
      if (this.reportFilter.month) {
        const [yr, mo] = this.reportFilter.month.split('-');
        return String(s.year) === yr && String(s.month) === mo;
      }
      return true;
    });

    const byDesignation: { [key: string]: { count: number; total: number } } = {};
    filtered.forEach(s => {
      const des = s.employee?.designation || 'Factory Staff';
      if (!byDesignation[des]) byDesignation[des] = { count: 0, total: 0 };
      byDesignation[des].count++;
      byDesignation[des].total += s.salaryAmount || 0;
    });

    return {
      rows: Object.entries(byDesignation).map(([des, d]) => ({ designation: des, ...d })),
      total: filtered.reduce((s, r) => s + (r.salaryAmount || 0), 0),
      headcount: filtered.length,
      paid: filtered.filter(s => s.status === 'Paid').length
    };
  }

  // Transport Outstanding (E-11)
  get transportOutstanding(): any[] {
    return (this.transportsList || [])
      .filter(t => this.inDateRange(t.date))
      .map(t => ({
        ...t,
        remaining: (t.rent || 0) - (t.advance || 0),
        isOverdue: new Date(t.date) < new Date(Date.now() - 30 * 86400000)
      }))
      .filter(t => t.remaining > 0)
      .sort((a, b) => b.remaining - a.remaining);
  }

  isOlderThan30Days(dateStr: string): boolean {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date(Date.now() - 30 * 86400000);
  }

  // Quick Financial KPIs (E-10)
  get totalRevenue(): number {
    return (this.salesList || []).reduce((s, r) => s + (r.totalAmount || 0), 0);
  }

  get totalOutstanding(): number {
    const paid = (this.paymentsList || []).reduce((s, p) => s + (p.amountReceived || 0), 0);
    return Math.max(0, this.totalRevenue - paid);
  }

  get monthlyProductionTotal(): number {
    const now = new Date();
    return (this.ppdList || [])
      .filter(p => {
        const d = new Date(p.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, p) => s + (p.totalProduction || 0), 0);
  }

  get monthlyExpenseTotal(): number {
    const now = new Date();
    return (this.expensesList || [])
      .filter(e => {
        const d = new Date(e.date || e.expenseDate);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, e) => s + (e.amount || 0), 0);
  }

  getSalesTotals() {
    const total = this.filteredReportData.reduce((s, r) => s + (r.totalAmount || 0), 0);
    const paid = this.filteredReportData.reduce((s, r) => s + (r.paid || 0), 0);
    const outstanding = this.filteredReportData.reduce((s, r) => s + (r.remaining || 0), 0);
    return { total, paid, outstanding };
  }

  // Chart Rendering (E-05)
  renderReportChart() {
    const canvas = document.getElementById('reportChartCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.reportChart) {
      this.reportChart.destroy();
      this.reportChart = null;
    }

    const labels: string[] = [];
    const values: number[] = [];

    if (this.reportFilter.type === 'production') {
      this.filteredReportData.slice(-15).forEach(r => {
        labels.push(r.date);
        values.push(r.totalProduction || 0);
      });
    } else if (this.reportFilter.type === 'sales') {
      this.filteredReportData.slice(-15).forEach(r => {
        labels.push(r.date);
        values.push(r.totalAmount || 0);
      });
    } else if (this.reportFilter.type === 'production_monthly') {
      this.monthlyProductionSummary.forEach(m => {
        labels.push(m.label);
        values.push(m.totalProduction);
      });
    }

    if (labels.length === 0) return;

    this.reportChart = new Chart(canvas, {
      type: labels.length <= 12 ? 'bar' : 'line',
      data: {
        labels,
        datasets: [{
          label: this.reportFilter.type === 'sales' ? 'Revenue (₹)' : 'Production (units)',
          data: values,
          backgroundColor: 'rgba(217,119,6,0.25)',
          borderColor: '#d97706',
          borderWidth: 2,
          borderRadius: 6,
          fill: true,
          tension: 0.35
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => this.reportFilter.type === 'sales'
                ? `₹${Number(ctx.raw).toLocaleString('en-IN')}`
                : `${ctx.raw} units`
            }
          }
        },
        scales: {
          x: { ticks: { maxRotation: 45, font: { size: 11 } } },
          y: { beginAtZero: true, ticks: { font: { size: 11 } } }
        }
      }
    });
  }

  // Print (E-07)
  printReport() {
    window.print();
  }

  // PDF Export (E-09)
  async exportReportToPdf() {
    const element = document.getElementById('report-content');
    if (!element) return;

    this.notificationService.info('Generating PDF', 'Please wait...');
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = canvas.height / canvas.width;
      const imgH = (pageW - 20) * ratio;

      pdf.setFontSize(14);
      pdf.setTextColor(40);
      pdf.text('Futane Agro Industries Pvt. Ltd.', pageW / 2, 12, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text(
        `Report: ${this.reportFilter.type.toUpperCase()} | Period: ${this.reportFilter.fromDate || 'All'} to ${this.reportFilter.toDate || 'All'}`,
        pageW / 2, 18, { align: 'center' }
      );

      pdf.addImage(imgData, 'PNG', 10, 22, pageW - 20, Math.min(imgH, pageH - 30));

      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(`Generated: ${new Date().toLocaleString('en-IN')} | Futane ERP`, pageW / 2, pageH - 5, { align: 'center' });

      const filename = `${this.reportFilter.type}_report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      this.notificationService.success('PDF Ready', filename + ' downloaded.');
    } catch (e: any) {
      this.notificationService.error('Export Error', 'Failed to generate PDF: ' + e.message);
    }
  }
}
