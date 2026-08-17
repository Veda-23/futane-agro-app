import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.css']
})
export class AuditLogsComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'audit-logs';

  auditLogsList: any[] = [];
  auditFilter = {
    fromDate: '',
    toDate: '',
    action: '',
    tableName: '',
    username: ''
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.apiService.getAuditLogs().subscribe((res: any[]) => {
      this.auditLogsList = (res || []).sort((a, b) => {
        const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
        const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
    });
  }

  get uniqueTableNames(): string[] {
    return [...new Set(this.auditLogsList.map(l => l.tableName).filter(Boolean))].sort();
  }

  clearAuditFilters() {
    this.auditFilter = { fromDate: '', toDate: '', action: '', tableName: '', username: '' };
  }

  get filteredAuditLogs(): any[] {
    return (this.auditLogsList || []).filter(log => {
      const createdAt = new Date(log.timestamp || log.createdAt);
      if (this.auditFilter.fromDate && createdAt < new Date(this.auditFilter.fromDate)) return false;
      if (this.auditFilter.toDate && createdAt > new Date(this.auditFilter.toDate + 'T23:59:59')) return false;
      if (this.auditFilter.action && !log.action?.toLowerCase().includes(this.auditFilter.action.toLowerCase())) return false;
      if (this.auditFilter.tableName && log.tableName !== this.auditFilter.tableName) return false;
      if (this.auditFilter.username && !log.username?.toLowerCase().includes(this.auditFilter.username.toLowerCase())) return false;
      return true;
    });
  }
}

