import { Component, OnInit, Input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, DecimalPipe],
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

  constructor(private apiService: ApiService, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.loadPowerBiSettings();
  }

  loadPowerBiSettings() {
    this.apiService.getSettings().subscribe((settings: any[]) => {
      const biSetting = settings.find((s: any) => s.settingKey === 'powerbi_embed_url');
      if (biSetting && biSetting.settingValue) {
        this.powerBiUrlInput = biSetting.settingValue;
        this.powerBiSimulatorActive = false;
        this.powerBiEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(biSetting.settingValue);
      }
    });
  }

  savePowerBiUrl() {
    if (!this.powerBiUrlInput.trim()) return;
    this.apiService.saveSetting('powerbi_embed_url', this.powerBiUrlInput).subscribe(() => {
      this.powerBiEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.powerBiUrlInput);
      this.powerBiSimulatorActive = false;
      alert('Power BI URL saved successfully!');
    });
  }

  clearPowerBiUrl() {
    this.powerBiUrlInput = '';
    this.powerBiEmbedUrl = null;
    this.powerBiSimulatorActive = true;
    this.apiService.saveSetting('powerbi_embed_url', '').subscribe();
  }
}
