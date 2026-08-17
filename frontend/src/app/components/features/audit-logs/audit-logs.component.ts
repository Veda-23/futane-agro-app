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
  filterAction = '';
  filterUser = '';
  searchQuery = '';

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

  get filteredAuditLogs(): any[] {
    let list = this.auditLogsList || [];
    if (this.filterAction) {
      list = list.filter(l => (l.action || '').toLowerCase().includes(this.filterAction.toLowerCase()));
    }
    if (this.filterUser) {
      list = list.filter(l => (l.username || '').toLowerCase().includes(this.filterUser.toLowerCase()));
    }
    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(l =>
        (l.action || '').toLowerCase().includes(q) ||
        (l.username || '').toLowerCase().includes(q) ||
        (l.tableName || '').toLowerCase().includes(q)
      );
    }
    return list;
  }
}

