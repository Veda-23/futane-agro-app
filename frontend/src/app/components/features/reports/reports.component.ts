import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'reports';

  reportFilter = { type: 'production', date: '', id: '' };
  filteredReportData: any[] = [];

  ppdList: any[] = [];
  salesList: any[] = [];
  inventoryList: any[] = [];
  salariesList: any[] = [];
  transportsList: any[] = [];
  parties: any[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.apiService.getParties().subscribe((res: any[]) => this.parties = res);
    this.apiService.getPpd().subscribe((res: any[]) => { this.ppdList = res; this.runReport(); });
    this.apiService.getSales().subscribe((res: any[]) => { this.salesList = res; this.runReport(); });
    this.apiService.getInventory().subscribe((res: any[]) => { this.inventoryList = res; this.runReport(); });
    this.apiService.getSalaries().subscribe((res: any[]) => { this.salariesList = res; this.runReport(); });
    this.apiService.getTransports().subscribe((res: any[]) => { this.transportsList = res; this.runReport(); });
  }

  runReport() {
    this.filteredReportData = [];
    const filter = this.reportFilter;

    if (filter.type === 'production') {
      this.filteredReportData = [...this.ppdList];
      if (filter.date) {
        this.filteredReportData = this.filteredReportData.filter(d => d.date === filter.date);
      }
    } else if (filter.type === 'sales') {
      this.filteredReportData = [...this.salesList];
      if (filter.date) {
        this.filteredReportData = this.filteredReportData.filter(d => d.date === filter.date);
      }
      if (filter.id) {
        this.filteredReportData = this.filteredReportData.filter(d => d.party.id === parseInt(filter.id));
      }
    } else if (filter.type === 'inventory') {
      this.filteredReportData = [...this.inventoryList];
    } else if (filter.type === 'salary') {
      this.filteredReportData = [...this.salariesList];
    } else if (filter.type === 'transport') {
      this.filteredReportData = [...this.transportsList];
    }
  }
}

