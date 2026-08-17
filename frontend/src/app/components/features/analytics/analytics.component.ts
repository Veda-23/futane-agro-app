import { Component, OnInit, Input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { TranslatePipe } from '../../../translate.service';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, DecimalPipe, AutoSelectDirective, FormStateDirective],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'analytics';
  @Input() stats: any = {};
  @Input() salesList: any[] = [];
  @Input() ppdList: any[] = [];
  @Input() machinesList: any[] = [];
  @Input() expensesList: any[] = [];
  @Input() computedNetProfit: number = 0;

  powerBiEmbedUrl: SafeResourceUrl | null = null;
  powerBiUrlInput = '';
  powerBiSimulatorActive = true;
  activeAnalyticsReport = 'sales';

  constructor(
    private apiService: ApiService, 
    private sanitizer: DomSanitizer,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadPowerBiSettings();
  }

  loadPowerBiSettings() {
    this.apiService.getSettings().subscribe((settings: any[]) => {
      const biSetting = settings ? settings.find((s: any) => s.settingKey === 'powerbi_embed_url') : null;
      if (biSetting && biSetting.settingValue) {
        this.powerBiUrlInput = biSetting.settingValue;
        this.powerBiSimulatorActive = false;
        this.powerBiEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(biSetting.settingValue);
      } else {
        const defaultGrafanaUrl = (environment as any).grafanaUrl || 'https://80-225-192-171.sslip.io/monitoring/dashboards/f/ffr4fw1rmgr9cb/system-and-infra?orgId=1&kiosk=tv&refresh=10s';
        this.powerBiUrlInput = defaultGrafanaUrl;
        this.powerBiSimulatorActive = false;
        this.powerBiEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(defaultGrafanaUrl);
      }
    });
  }

  savePowerBiUrl() {
    if (!this.powerBiUrlInput.trim()) return;
    this.apiService.saveSetting('powerbi_embed_url', this.powerBiUrlInput).subscribe(() => {
      this.powerBiEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.powerBiUrlInput);
      this.powerBiSimulatorActive = false;
      this.notificationService.showSaveSuccess('Power BI URL saved successfully!');
    });
  }

  clearPowerBiUrl() {
    this.powerBiUrlInput = '';
    this.powerBiEmbedUrl = null;
    this.powerBiSimulatorActive = true;
    this.apiService.saveSetting('powerbi_embed_url', '').subscribe();
  }
}
