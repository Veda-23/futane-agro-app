import { Component, OnInit, Input, ElementRef } from '@angular/core';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { FormValidationService } from '../../../services/form-validation.service';
import { NotificationService } from '../../../services/notification.service';

import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, TranslatePipe, AutoSelectDirective, FormStateDirective],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.css']
})
export class AuditLogsComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'audit-logs';

  auditLogsList: any[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.apiService.getAuditLogs().subscribe((res: any[]) => {
      this.auditLogsList = res.sort((a, b) => b.id - a.id).slice(0, 50);
    });
  }

  getProcessedList(list: any[], table: string): any[] {
    return list;
  }
}

