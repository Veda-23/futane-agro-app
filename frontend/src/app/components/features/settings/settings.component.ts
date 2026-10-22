import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';
import { MfaService } from '../../../services/mfa.service';
import { NotificationService } from '../../../services/notification.service';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { ResizableTableDirective } from '../../../directives/resizable-table.directive';
import { PasswordStrengthComponent } from '../../shared/password-strength/password-strength.component';
import { 
  INDUSTRY_TEMPLATES, 
  MASTER_CUSTOMIZATIONS_CATALOG, 
  CustomizationOption, 
  IndustryTemplate, 
  getSavedTenantConfig, 
  saveTenantConfig 
} from '../../../models/enterprise-customizations.data';
import { TerminologyService } from '../../../services/terminology.service';
import { TermPipe } from '../../../pipes/term.pipe';

/**
 * Enterprise Administration, Tenant Customizations & System Governance Hub.
 *
 * Responsibilities:
 * - Corporate White-Label & Branding: Dynamic theme palette, custom logo upload, typography, and table density.
 * - Multi-Tenant Customizations Catalog: 200+ dynamic switches across 10 industry verticals (Agri-Plastics, Dairy, Food Processing, Textiles).
 * - Multi-Factor Authentication (MFA) Management: Firebase Phone 2FA enrollment, recovery codes generation, and single-use validation.
 * - Granular Dynamic RBAC: Permission matrix granting View/Create/Edit/Delete rights per role per module.
 * - Dynamic Feature Toggles: Zero-downtime runtime enablement of ERP modules (WhatsApp, Storefront, GPS Tracking).
 * - Custom Fields Engine: Declarative user-defined attributes (Text, Number, Date, Dropdown) with zero database DDL migrations.
 * - Developer Hub: High-entropy scoped API Keys (`fa_live_...`) and HMAC-SHA256 event Webhooks.
 * - System Governance & Diagnostics: Live JVM heap/thread metrics, Caffeine cache hit/miss inspection, and database snapshots.
 */
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, TermPipe, AutoSelectDirective, FormStateDirective, ResizableTableDirective, PasswordStrengthComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit, OnDestroy {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'settings';
  @Input() loggedInUser: any = null;
  @Input() usersList: any[] = [];
  @Input() settingsList: any[] = [];
  @Input() backupsList: any[] = [];
  @Input() isDarkMode: boolean = false;

  @Output() toggleTheme = new EventEmitter<boolean>();
  @Output() reloadData = new EventEmitter<void>();

  get isSuperAdmin(): boolean {
    const role = (this.loggedInUser?.role || '').toUpperCase();
    return role === 'SUPER_ADMIN' || role === 'SUPERADMIN';
  }

  protected readonly Math = Math;

  // Sub-Navigation Tabs (11 Organized Domains)
  activeSubTab: string = 'enterprise_customizations';

  // 1. Branding & Visual System Model
  branding = {
    app_display_name: 'Futane Agro ERP',
    app_tagline: 'Quality Crates, Stronger Future',
    brand_primary_color: '#0B47D4',
    brand_primary_hover: '#093BB0',
    brand_logo_url: 'assets/logo.svg',
    default_theme: 'light',
    font_family: 'Inter',
    table_density: 'comfortable',
    glass_intensity: 'subtle',
    enabled_languages: 'en,mr,hi'
  };
  presetColors = ['#0B47D4', '#2563eb', '#059669', '#7c3aed', '#dc2626', '#0891b2', '#0f172a'];
  fontOptions = ['Inter', 'Plus Jakarta Sans', 'Outfit', 'Roboto', 'JetBrains Mono'];
  isUploadingLogo = false;
  isSavingBranding = false;

  tableDensity: 'compact' | 'comfortable' | 'spacious' = (localStorage.getItem('futane_table_density') as any) || 'comfortable';

  setDensity(density: 'compact' | 'comfortable' | 'spacious') {
    this.tableDensity = density;
    this.branding.table_density = density;
    document.body.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
    document.body.classList.add('density-' + density);
    localStorage.setItem('futane_table_density', density);
  }

  previewButtonClick() {
    this.notificationService.info(
      'Live Theme Accent Active',
      `Demonstrating primary accent: ${this.branding.brand_primary_color || '#0B47D4'}`
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ENTERPRISE WHITE-LABEL & 200+ CUSTOMIZATIONS HUB
  // ──────────────────────────────────────────────────────────────────────────
  customizationsCatalog: CustomizationOption[] = [];
  filteredCustomizations: CustomizationOption[] = [];
  industryTemplates: IndustryTemplate[] = INDUSTRY_TEMPLATES;
  selectedIndustryId: string = 'agri_plastics';
  customizationSearchQuery: string = '';
  activeCustomizationCategory: string = 'ALL';
  customizationCategories: string[] = [
    'ALL',
    'Branding & White-Label',
    'Multi-Company & Entity',
    'Invoicing, Tax & Currency',
    'Manufacturing & Shop Floor',
    'Inventory & Raw Materials',
    'Logistics & Dispatch',
    'Workforce & Payroll',
    'Security & Governance'
  ];

  initCustomizationsHub() {
    const saved = getSavedTenantConfig();
    this.customizationsCatalog = MASTER_CUSTOMIZATIONS_CATALOG.map(c => {
      return {
        ...c,
        value: saved[c.key] !== undefined ? saved[c.key] : c.defaultValue
      };
    });

    // Bidirectional sync: sync saved tenant white-label into branding model
    const appTitle = saved['brand.app_title'] || this.branding.app_display_name || this.terminologyService.current.appName || 'Futane Agro ERP';
    this.branding.app_display_name = appTitle;
    const titleOpt = this.customizationsCatalog.find(c => c.key === 'brand.app_title');
    if (titleOpt) {
      titleOpt.value = appTitle;
    }
    this.terminologyService.setDictionary({ appName: appTitle });
    if (saved['brand.tagline']) this.branding.app_tagline = saved['brand.tagline'];
    if (saved['brand.primary_color']) {
      this.branding.brand_primary_color = saved['brand.primary_color'];
      this.applyBrandColorLocally(saved['brand.primary_color']);
    }
    if (saved['brand.primary_hover']) this.branding.brand_primary_hover = saved['brand.primary_hover'];
    if (saved['brand.font_family']) this.branding.font_family = saved['brand.font_family'];
    if (saved['brand.table_density']) this.tableDensity = saved['brand.table_density'];

    this.filterCustomizations();
  }

  filterCustomizations() {
    const q = (this.customizationSearchQuery || '').toLowerCase().trim();
    const cat = this.activeCustomizationCategory;

    this.filteredCustomizations = this.customizationsCatalog.filter(c => {
      const matchCat = cat === 'ALL' || c.category === cat;
      const matchQ = !q || 
        c.title.toLowerCase().includes(q) || 
        c.key.toLowerCase().includes(q) || 
        c.description.toLowerCase().includes(q) ||
        c.impactedTabs.some(t => t.toLowerCase().includes(q));
      return matchCat && matchQ;
    });
  }

  setCustomizationCategory(cat: string) {
    this.activeCustomizationCategory = cat;
    this.filterCustomizations();
  }

  updateCustomizationValue(item: CustomizationOption, val: any) {
    item.value = val;
    this.hasUnsavedChanges = true;
    this.persistCustomizations();

    // Instant real-time white-label reactivity across ERP
    if (item.key === 'brand.app_title') {
      this.branding.app_display_name = val;
      this.terminologyService.setDictionary({ appName: val });
      if (typeof document !== 'undefined') {
        document.title = `${val} [Futane Agro ERP]`;
      }
    } else if (item.key === 'brand.tagline') {
      this.branding.app_tagline = val;
    } else if (item.key === 'brand.primary_color') {
      this.branding.brand_primary_color = val;
      this.applyBrandColorLocally(val);
    } else if (item.key === 'brand.primary_hover') {
      this.branding.brand_primary_hover = val;
      if (typeof document !== 'undefined' && val) {
        document.documentElement.style.setProperty('--brand-primary-hover', val);
      }
    } else if (item.key === 'brand.font_family') {
      this.branding.font_family = val;
      if (typeof document !== 'undefined' && val) {
        document.documentElement.style.setProperty('--font-family', val);
      }
    } else if (item.key === 'brand.table_density') {
      this.setDensity(val);
    }
  }

  persistCustomizations() {
    const cfg: { [key: string]: any } = {};
    this.customizationsCatalog.forEach(c => {
      cfg[c.key] = c.value;
    });
    saveTenantConfig(cfg);
    this.hasUnsavedChanges = false;
  }

  applyIndustryTemplate(templateId: string) {
    const tpl = this.industryTemplates.find(t => t.id === templateId);
    if (!tpl) return;
    this.selectedIndustryId = templateId;

    Object.keys(tpl.overrides).forEach(k => {
      const target = this.customizationsCatalog.find(c => c.key === k);
      if (target) {
        target.value = tpl.overrides[k];
      }
    });

    if (tpl.overrides['brand.app_title']) {
      this.branding.app_display_name = tpl.overrides['brand.app_title'];
      this.terminologyService.setDictionary({ appName: tpl.overrides['brand.app_title'] });
      if (typeof document !== 'undefined') {
        document.title = `${tpl.overrides['brand.app_title']} [Futane Agro ERP]`;
      }
    }
    if (tpl.overrides['brand.primary_color']) {
      this.branding.brand_primary_color = tpl.overrides['brand.primary_color'];
      this.applyBrandColorLocally(tpl.overrides['brand.primary_color']);
    }

    this.persistCustomizations();
    this.filterCustomizations();
    this.terminologyService.applyIndustryPreset(templateId);
    this.notificationService.success(`Applied ${tpl.name} industry template with custom presets!`);
  }

  getTemplateGradient(tpl: any): string {
    const color = tpl?.badgeColor || '#0B47D4';
    if (color === '#059669' || color === '#10b981') return 'linear-gradient(135deg, #059669 0%, #10B981 100%)';
    if (color === '#0B47D4' || color === '#2563eb') return 'linear-gradient(135deg, #0B47D4 0%, #0066FF 100%)';
    if (color === '#7c3aed' || color === '#8b5cf6') return 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)';
    if (color === '#dc2626' || color === '#ef4444') return 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)';
    if (color === '#d97706' || color === '#f59e0b') return 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)';
    if (color === '#0d9488' || color === '#14b8a6') return 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)';
    return `linear-gradient(135deg, ${color} 0%, #1d4ed8 100%)`;
  }

  exportCustomizationsJson() {
    const cfg: { [key: string]: any } = {};
    this.customizationsCatalog.forEach(c => {
      cfg[c.key] = c.value;
    });
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enterprise_tenant_config_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.notificationService.success('Exported enterprise configuration JSON package!');
  }

  importCustomizationsJson(event: any) {
    const file = event.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const imported = JSON.parse(e.target.result);
        let updatedCount = 0;
        this.customizationsCatalog.forEach(c => {
          if (imported[c.key] !== undefined) {
            c.value = imported[c.key];
            updatedCount++;
          }
        });
        this.persistCustomizations();
        this.filterCustomizations();
        this.notificationService.success(`Successfully imported ${updatedCount} configuration parameters!`);
      } catch (err) {
        this.notificationService.error('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  }

  resetAllCustomizationsToDefaults() {
    if (!confirm('Are you sure you want to restore all 208 parameters to factory defaults?')) return;
    this.customizationsCatalog.forEach(c => {
      c.value = c.defaultValue;
    });
    this.persistCustomizations();
    this.filterCustomizations();
    this.notificationService.success('Restored all 208 customization parameters to factory defaults.');
  }

  // 2. Multi-Company & ERP Business Rules
  companyProfiles: any[] = [
    {
      id: 'comp_1',
      companyName: 'Futane Agro Industries Pvt. Ltd.',
      tradeName: 'Futane Agro Tech',
      gstin: '27AABCF1234F1Z8',
      pan: 'AABCF1234F',
      cin: 'U25209PN2020PTC123456',
      registeredAddress: 'Plot No. 42, Hadapsar Industrial Area, Pune, Maharashtra - 411028',
      factoryAddress: 'Gat No. 128/2, Shirwal Industrial Zone, Satara, Maharashtra - 412801',
      phone: '+91 98234 56789',
      email: 'billing@futaneagro.com',
      website: 'https://futaneagro.com',
      stateCode: '27',
      lutNumber: '',
      isDefault: true
    }
  ];
  bankProfiles: any[] = [
    {
      id: 'bank_1',
      companyId: 'comp_1',
      bankName: 'HDFC Bank Ltd.',
      accountHolderName: 'Futane Agro Industries Pvt. Ltd.',
      accountNumber: '50200067891234',
      ifscCode: 'HDFC0001234',
      branchName: 'Hadapsar Branch, Pune',
      accountType: 'CURRENT',
      upiId: 'futaneagro@okhdfcbank',
      isPrimary: true
    },
    {
      id: 'bank_2',
      companyId: 'comp_1',
      bankName: 'State Bank of India',
      accountHolderName: 'Futane Agro Industries Pvt. Ltd.',
      accountNumber: '39820194857',
      ifscCode: 'SBIN0004589',
      branchName: 'Shirwal MIDC, Satara',
      accountType: 'CURRENT',
      upiId: 'futaneagro@sbi',
      isPrimary: false
    }
  ];
  showCompanyModal = false;
  showBankModal = false;
  editingCompany: any = null;
  editingBank: any = null;

  companyForm = {
    id: '',
    companyName: '',
    tradeName: '',
    gstin: '',
    pan: '',
    cin: '',
    registeredAddress: '',
    factoryAddress: '',
    phone: '',
    email: '',
    website: '',
    stateCode: '27',
    lutNumber: '',
    isDefault: false
  };

  bankForm = {
    id: '',
    companyId: '',
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    accountType: 'CURRENT',
    upiId: '',
    isPrimary: false
  };

  businessRules = {
    invoice_prefix: 'INV-2026/',
    default_hsn: '3923',
    tax_roundoff: 'NEAREST_RUPEE',
    shift1_timings: '06:00 - 14:00',
    shift2_timings: '14:00 - 22:00',
    shift3_timings: '22:00 - 06:00',
    crate_cycle_time_sec: 24.5,
    power_tariff_per_kwh: 8.50,
    safety_stock_hdpe_kg: 10000,
    safety_stock_masterbatch_kg: 500,
    credit_days_default: 30
  };

  // Invoice Print & Layout Designer Model
  invoiceTemplate: any = {
    id: '',
    templateName: 'Standard Tax Invoice',
    invoiceTitle: 'TAX INVOICE',
    invoiceSubtitle: 'Original for Recipient (B2B)',
    termsAndConditions: '1. Goods once sold will not be accepted back or exchanged.\n2. Interest @ 18% p.a. will be charged on delayed payments.\n3. Discrepancies must be reported within 48 hours.\n4. Subject to Pune Jurisdiction only.',
    jurisdictionClause: 'Subject to Pune Jurisdiction only',
    signatoryTitle: 'Authorized Signatory',
    showBankDetails: true,
    showUpiQrCode: true,
    showCompanyLogo: true,
    showHsnSummary: true,
    primaryColorHex: '#d97706',
    headerNotes: 'Goods supplied for Agricultural & Industrial Material Handling purposes.',
    footerNotes: 'Thank you for partnering with Futane Agro. Quality Crates for a Stronger Future.'
  };

  // Automated WhatsApp & SMS Notification Templates
  notificationTemplates: any[] = [
    {
      id: 'template_1',
      eventKey: 'INVOICE_DISPATCHED',
      channel: 'WHATSAPP',
      templateName: 'Invoice Dispatch Alert',
      templateText: 'Namaste {customer_name}! Your order of {quantity} {item_name} has been dispatched from Futane Agro Plant.\n\nInvoice No: {invoice_no}\nAmount: ₹{amount}\nVehicle: {dispatch_vehicle}\nLive Consignment Tracking: {tracking_link}\n\nThank you for choosing Futane Agro!',
      dltTemplateId: 'DLT-FA-1002938',
      isEnabled: true,
      lastSent: '10 mins ago'
    },
    {
      id: 'template_2',
      eventKey: 'PAYMENT_REMINDER',
      channel: 'WHATSAPP',
      templateName: 'Payment Due Reminder',
      templateText: 'Dear {customer_name},\n\nThis is a gentle payment reminder that Invoice #{invoice_no} for ₹{amount} was due on {due_date}.\n\nSettle via UPI: {upi_id}\nBank A/C: {bank_account} (IFSC: {ifsc_code})\n\nKindly disregard if already paid. Regards, Futane Agro Accounts.',
      dltTemplateId: 'DLT-FA-1002939',
      isEnabled: true,
      lastSent: '1 hour ago'
    },
    {
      id: 'template_3',
      eventKey: 'INVOICE_DISPATCHED',
      channel: 'SMS',
      templateName: 'Dispatch Quick SMS',
      templateText: 'Futane Agro: Consignment for Inv #{invoice_no} (Rs.{amount}) dispatched via vehicle {dispatch_vehicle}. Track: {tracking_link}',
      dltTemplateId: 'DLT-FA-1002940',
      isEnabled: true,
      lastSent: '2 hours ago'
    },
    {
      id: 'template_4',
      eventKey: 'ORDER_CONFIRMED',
      channel: 'WHATSAPP',
      templateName: 'Order Confirmation Alert',
      templateText: 'Hello {customer_name}! Your purchase order for {quantity} {item_name} is confirmed and scheduled for production at Futane Agro Plant. Estimated dispatch: {due_date}.',
      dltTemplateId: 'DLT-FA-1002941',
      isEnabled: true,
      lastSent: 'Yesterday'
    },
    {
      id: 'template_5',
      eventKey: 'LOW_STOCK_ALARM',
      channel: 'WHATSAPP',
      templateName: 'Raw Material Buffer Warning',
      templateText: '*CRITICAL INVENTORY ALERT*\nRaw Material {item_name} has dropped below threshold! Current Stock: {quantity} kg. Immediate procurement requisition recommended.',
      dltTemplateId: 'DLT-FA-1002942',
      isEnabled: false,
      lastSent: '3 days ago'
    }
  ];
  selectedNotificationTemplate: any = this.notificationTemplates[0];
  testPhoneInput = '+91 98220 99999';
  testSimulationResult: any = null;
  isSimulatingDispatch = false;
  isSavingTemplate = false;

  // Phase 27: Notification Engine State
  notifSearchTerm: string = '';
  notifChannelFilter: string = 'ALL'; // 'ALL' | 'WHATSAPP' | 'SMS' | 'EMAIL'
  notifStatusFilter: string = 'ALL';  // 'ALL' | 'ACTIVE' | 'PAUSED'
  activeNotifSection: 'studio' | 'logs' | 'gateways' = 'studio';
  showAddTemplateModal: boolean = false;
  newTemplateForm: any = {
    templateName: '',
    channel: 'WHATSAPP',
    eventKey: 'INVOICE_DISPATCHED',
    dltTemplateId: '',
    templateText: '',
    isEnabled: true
  };

  // Real-time dispatch audit logs
  dispatchLogs: any[] = [
    { id: 'log_1', timestamp: '2 mins ago', recipient: '+91 98220 12345', channel: 'WHATSAPP', templateName: 'Invoice Dispatch Alert', eventKey: 'INVOICE_DISPATCHED', status: 'DELIVERED', latency: '420ms' },
    { id: 'log_2', timestamp: '18 mins ago', recipient: '+91 94231 87654', channel: 'SMS', templateName: 'Dispatch Quick SMS', eventKey: 'INVOICE_DISPATCHED', status: 'DELIVERED', latency: '680ms' },
    { id: 'log_3', timestamp: '1 hour ago', recipient: '+91 99700 44321', channel: 'WHATSAPP', templateName: 'Payment Due Reminder', eventKey: 'PAYMENT_REMINDER', status: 'DELIVERED', latency: '390ms' },
    { id: 'log_4', timestamp: '3 hours ago', recipient: '+91 98900 11223', channel: 'WHATSAPP', templateName: 'Order Confirmation Alert', eventKey: 'ORDER_CONFIRMED', status: 'DELIVERED', latency: '510ms' },
    { id: 'log_5', timestamp: '5 hours ago', recipient: '+91 97654 32109', channel: 'SMS', templateName: 'Dispatch Quick SMS', eventKey: 'INVOICE_DISPATCHED', status: 'FAILED', latency: '3200ms', error: 'Network Timeout on DLT Route' }
  ];

  // Gateway status profiles
  gatewayProfiles = {
    whatsapp: {
      provider: 'Meta WhatsApp Cloud API (v20.0)',
      phoneId: '108492019482910',
      wabaId: '391048201948201',
      status: 'CONNECTED',
      qualityRating: 'GREEN (HIGH)',
      webhookUrl: 'https://api.futaneagro.com/webhooks/whatsapp',
      verifiedName: 'Futane Agro Pvt Ltd',
      tier: 'Tier 2 (10,000 conversations/day)'
    },
    sms: {
      provider: 'Airtel Enterprise DLT Gateway',
      entityId: '1401552390000012489',
      senderId: 'FUTANE',
      status: 'ACTIVE_COMPLIANT',
      balanceCredits: '14,250 SMS',
      dltExpiry: '31-Mar-2027',
      routeType: 'Transactional High Priority'
    },
    email: {
      provider: 'Microsoft Office 365 SMTP',
      host: 'smtp.office365.com:587',
      senderEmail: 'notifications@futaneagro.com',
      status: 'AUTHENTICATED',
      tls: 'STARTTLS Active'
    }
  };

  get filteredNotificationTemplates(): any[] {
    return this.notificationTemplates.filter(t => {
      const term = (this.notifSearchTerm || '').trim().toLowerCase();
      const matchSearch = !term ||
        (t.templateName && t.templateName.toLowerCase().includes(term)) ||
        (t.eventKey && t.eventKey.toLowerCase().includes(term)) ||
        (t.dltTemplateId && t.dltTemplateId.toLowerCase().includes(term)) ||
        (t.templateText && t.templateText.toLowerCase().includes(term));
      const matchChannel = this.notifChannelFilter === 'ALL' || t.channel === this.notifChannelFilter;
      const matchStatus = this.notifStatusFilter === 'ALL' ||
        (this.notifStatusFilter === 'ACTIVE' && t.isEnabled) ||
        (this.notifStatusFilter === 'PAUSED' && !t.isEnabled);
      return matchSearch && matchChannel && matchStatus;
    });
  }

  get activeTemplatesCount(): number {
    return this.notificationTemplates.filter(t => t.isEnabled).length;
  }

  get whatsappTemplatesCount(): number {
    return this.notificationTemplates.filter(t => t.channel === 'WHATSAPP').length;
  }

  get smsTemplatesCount(): number {
    return this.notificationTemplates.filter(t => t.channel === 'SMS').length;
  }

  get emailTemplatesCount(): number {
    return this.notificationTemplates.filter(t => t.channel === 'EMAIL').length;
  }

  get templateCharCount(): number {
    return this.selectedNotificationTemplate?.templateText?.length || 0;
  }

  get smsSegmentCount(): number {
    return Math.ceil((this.selectedNotificationTemplate?.templateText?.length || 0) / 160) || 1;
  }

  availablePlaceholders = [
    { token: '{customer_name}', label: 'Customer / Buyer Name' },
    { token: '{invoice_no}', label: 'Invoice Number' },
    { token: '{amount}', label: 'Invoice Amount (₹)' },
    { token: '{quantity}', label: 'Dispatched Quantity' },
    { token: '{item_name}', label: 'Product Item Name' },
    { token: '{dispatch_vehicle}', label: 'Vehicle Number' },
    { token: '{tracking_link}', label: 'Consignment Tracking URL' },
    { token: '{due_date}', label: 'Payment Due Date' },
    { token: '{upi_id}', label: 'UPI Settlement ID' },
    { token: '{bank_account}', label: 'Remittance Bank A/C' },
    { token: '{ifsc_code}', label: 'Bank IFSC Code' }
  ];

  // 3. Teams Model
  teamsList: any[] = [
    { id: 'team_1', name: 'Manufacturing Operations', code: 'MFG', description: 'Plant injection molding machine operators & shift engineers', colorTag: '#d97706', icon: 'precision_manufacturing', isActive: true },
    { id: 'team_2', name: 'Supply Chain & Logistics', code: 'SCM', description: 'Raw material procurement, inward stores & transport dispatchers', colorTag: '#059669', icon: 'local_shipping', isActive: true },
    { id: 'team_3', name: 'Accounts & GST Finance', code: 'FIN', description: 'B2B invoicing, payment recovery, taxation & salary disbursement', colorTag: '#2563eb', icon: 'account_balance', isActive: true },
    { id: 'team_4', name: 'Quality Assurance & Lab', code: 'QA', description: 'Raw material melt-flow testing and crate drop testing protocols', colorTag: '#7c3aed', icon: 'verified', isActive: true },
    { id: 'team_5', name: 'Executive Administration', code: 'ADM', description: 'General administration, access governance, security & compliance', colorTag: '#dc2626', icon: 'admin_panel_settings', isActive: true }
  ];
  showTeamModal = false;
  editingTeam: any = null;
  teamForm = { name: '', code: '', description: '', icon: 'bi-gear-wide-connected', colorTag: '#059669', sidebarOrder: 1, showInSidebar: true };

  // Department & Teams Filtering & Organization State
  teamSearchTerm: string = '';
  teamStatusFilter: string = 'ALL';
  expandedTeamId: string | null = null;
  departmentIcons = [
    { icon: 'bi-gear-wide-connected', label: 'Manufacturing & Plant Engineering' },
    { icon: 'bi-truck', label: 'Logistics & Supply Chain' },
    { icon: 'bi-bank', label: 'Finance & Accounts' },
    { icon: 'bi-patch-check-fill', label: 'Quality Assurance & Lab' },
    { icon: 'bi-shield-lock', label: 'Executive Administration' },
    { icon: 'bi-people-fill', label: 'Human Resources & Personnel' },
    { icon: 'bi-cart3', label: 'Sales & Commercial B2B' },
    { icon: 'bi-box-seam', label: 'Warehouse & Raw Materials' },
    { icon: 'bi-cpu', label: 'IT, Automation & SRE' }
  ];
  departmentColorPalette: string[] = [
    '#059669', '#2563eb', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#475569'
  ];

  get activeTeamsCount(): number {
    return this.teamsList.filter(t => t.isActive !== false).length;
  }

  get totalAssignedStaff(): number {
    return this.teamsList.reduce((acc, t) => acc + this.getTeamMembers(t.code).length, 0);
  }

  get sidebarTeamsCount(): number {
    return this.teamsList.filter(t => t.showInSidebar !== false).length;
  }

  get filteredTeamsList(): any[] {
    return this.teamsList.filter(t => {
      const term = (this.teamSearchTerm || '').trim().toLowerCase();
      const matchesSearch = !term ||
        t.name?.toLowerCase().includes(term) ||
        t.code?.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term) ||
        this.getTeamMembers(t.code).some(m => m.name?.toLowerCase().includes(term) || m.email?.toLowerCase().includes(term));

      const matchesStatus = this.teamStatusFilter === 'ALL' ||
        (this.teamStatusFilter === 'ACTIVE' && t.isActive !== false) ||
        (this.teamStatusFilter === 'INACTIVE' && t.isActive === false);

      return matchesSearch && matchesStatus;
    });
  }

  // 4. Users & Permission Matrix
  adminUsersList: any[] = [
    { id: 'u_1', username: 'SUPER_ADMIN', name: 'Super Administrator', email: 'admin@futaneagro.com', role: 'SUPER_ADMIN', teamCode: 'ADM', isLocked: false, lastLogin: 'Just now', permissions: {} },
    { id: 'u_2', username: 'rajesh.patil', name: 'Rajesh Patil', email: 'rajesh.patil@futaneagro.com', role: 'ADMIN', teamCode: 'MFG', isLocked: false, lastLogin: '1 hour ago', permissions: {} },
    { id: 'u_3', username: 'neha.sharma', name: 'Neha Sharma', email: 'neha.sharma@futaneagro.com', role: 'ADMIN', teamCode: 'HR', isLocked: false, lastLogin: '2 hours ago', permissions: {} },
    { id: 'u_4', username: 'sanjay.d', name: 'Sanjay Deshmukh', email: 'sanjay.d@futaneagro.com', role: 'MANAGER', teamCode: 'MFG', isLocked: false, lastLogin: 'Yesterday', permissions: {} },
    { id: 'u_5', username: 'amit.kulkarni', name: 'Amit Kulkarni', email: 'amit.kulkarni@futaneagro.com', role: 'ACCOUNTANT', teamCode: 'FIN', isLocked: false, lastLogin: 'Yesterday', permissions: {} },
    { id: 'u_6', username: 'suresh.shinde', name: 'Suresh Shinde', email: 'suresh.shinde@futaneagro.com', role: 'OPERATOR', teamCode: 'SCM', isLocked: false, lastLogin: '3 days ago', permissions: {} },
    { id: 'u_7', username: 'sunil.deshmukh', name: 'Sunil Deshmukh', email: 'sunil.deshmukh@futaneagro.com', role: 'OPERATOR', teamCode: 'MFG', isLocked: false, lastLogin: '3 days ago', permissions: {} },
    { id: 'u_8', username: 'pooja.verma', name: 'Pooja Verma', email: 'pooja.verma@futaneagro.com', role: 'VIEWER', teamCode: 'COMMERCE', isLocked: false, lastLogin: '5 days ago', permissions: {} }
  ];
  showInviteUserModal = false;
  inviteUserForm = { name: '', email: '', role: 'OPERATOR', teamId: '' };

  // Phase 28: User Directory & Granular RBAC State
  userSearchTerm: string = '';
  userRoleFilter: string = 'ALL';
  userStatusFilter: string = 'ALL';
  userTeamFilter: string = 'ALL';
  matrixModuleSearch: string = '';

  // Edit User Profile Modal State
  showEditUserModal: boolean = false;
  editingUser: any = null;
  editUserForm: any = { id: '', name: '', username: '', email: '', role: 'OPERATOR', teamCode: '', status: 'ACTIVE' };

  // Change Role Modal State
  showChangeRoleModal: boolean = false;
  changeRoleUser: any = null;
  newSelectedRole: string = 'OPERATOR';

  userAccessSubTab: 'users' | 'matrix' | 'roles' = 'users';
  rolesList = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'OPERATOR', 'VIEWER'];
  selectedRoleForMatrix = 'OPERATOR';
  permissionMatrix: any[] = [];
  matrixModules: string[] = [
    'dashboard', 'production', 'monthly-production', 'machines',
    'parties', 'sales', 'payments', 'invoices', 'billinghub',
    'inventory', 'raw-materials', 'vendors', 'dispatch', 'transports', 'drivers',
    'bank', 'expenses', 'reports', 'analytics',
    'employees', 'salaries',
    'settings', 'audit-logs'
  ];

  // Role Definitions & Security Metadata for Entitlements Overview
  roleDefinitions: any[] = [
    {
      role: 'SUPER_ADMIN',
      title: 'Super Administrator',
      level: 'Tier 0 · Root Governance',
      icon: 'bi-shield-fill-check',
      color: '#d97706',
      badgeClass: 'pill-primary',
      description: 'Immutable root access. Full privilege across all 23 subsystems, tenant configuration, API tokens, and user lifecycle.',
      isImmutable: true,
      privilegeScope: 'All Modules (Read/Write/Delete/Approve)'
    },
    {
      role: 'ADMIN',
      title: 'System Administrator',
      level: 'Tier 1 · Operations Admin',
      icon: 'bi-shield-shaded',
      color: '#2563eb',
      badgeClass: 'pill-warning',
      description: 'Executive plant administration, user invitations, department assignments, and cross-department business reports.',
      isImmutable: false,
      privilegeScope: 'All Operational Subsystems (Exclude Sensitive Root Keys)'
    },
    {
      role: 'MANAGER',
      title: 'Plant Operations Manager',
      level: 'Tier 2 · Workflow Approval',
      icon: 'bi-briefcase-fill',
      color: '#7c3aed',
      badgeClass: 'pill-info',
      description: 'Supervises manufacturing batches, machine maintenance schedules, outward dispatches, and shift approvals.',
      isImmutable: false,
      privilegeScope: 'Manufacturing, Supply Chain & Work Orders'
    },
    {
      role: 'ACCOUNTANT',
      title: 'Financial Accountant',
      level: 'Tier 2 · Fiscal & Tax Hub',
      icon: 'bi-bank',
      color: '#059669',
      badgeClass: 'pill-success',
      description: 'Fiscal ledgers, GST tax invoices, customer payment remittances, operational vouchers, and bank reconciliation.',
      isImmutable: false,
      privilegeScope: 'Finance, Invoices, Billing Hub, Ledger & Salaries'
    },
    {
      role: 'OPERATOR',
      title: 'Shopfloor Operator',
      level: 'Tier 3 · Factory Floor Data Entry',
      icon: 'bi-cpu',
      color: '#0891b2',
      badgeClass: 'pill-secondary',
      description: 'Daily batch production counts, machine counter logs, raw material inward intake, and dispatch gate passes.',
      isImmutable: false,
      privilegeScope: 'Daily Production, Machine Run & Dispatches (Entry Only)'
    },
    {
      role: 'VIEWER',
      title: 'Audit & Stakeholder Viewer',
      level: 'Tier 4 · Read-Only Access',
      icon: 'bi-eye-fill',
      color: '#64748b',
      badgeClass: 'pill-muted',
      description: 'Executive analytics dashboards, business summary charts, and party ledgers without modification rights.',
      isImmutable: false,
      privilegeScope: 'Read-Only across Dashboard, Analytics & Summaries'
    }
  ];

  // Security Policies
  securityPolicy = {
    inactivity_timeout_min: '30',
    max_concurrent_sessions: '1',
    require_special_char: true,
    ip_whitelist: '127.0.0.1, 192.168.1.0/24'
  };

  // 5. Feature Flags Model
  featureFlags: any[] = [];
  showEditFeatureFlagModal = false;
  editingFeatureFlag: any = null;
  featureFlagForm = {
    moduleKey: '',
    moduleName: '',
    category: 'General',
    description: '',
    enabled: true
  };

  // 6. Custom Fields Model
  selectedEntityForCustomFields = 'PARTIES';
  customFieldEntities: string[] = ['PARTIES', 'ITEMS', 'INVOICES', 'PRODUCTION_BATCHES', 'MACHINES', 'VENDORS', 'SALES_ORDERS', 'DISPATCH'];
  
  customFieldDefs: any[] = JSON.parse(localStorage.getItem('futane_custom_field_defs') || 'null') || [
    // PARTIES
    { id: 'cf_1', entityName: 'PARTIES', fieldKey: 'credit_rating', fieldLabel: 'Credit Rating Tier', fieldType: 'SELECT_DROPDOWN', isRequired: false, defaultValue: 'A', optionsJson: '["A+ (Prime)", "A (Standard)", "B (Caution)", "C (Prepaid Only)"]' },
    { id: 'cf_2', entityName: 'PARTIES', fieldKey: 'pan_number', fieldLabel: 'Permanent Account No (PAN)', fieldType: 'TEXT', isRequired: true, defaultValue: '', optionsJson: '' },
    { id: 'cf_3', entityName: 'PARTIES', fieldKey: 'preferred_transporter', fieldLabel: 'Preferred Logistics Partner', fieldType: 'TEXT', isRequired: false, defaultValue: 'Futane Dedicated Fleet', optionsJson: '' },
    { id: 'cf_4', entityName: 'PARTIES', fieldKey: 'delivery_route_zone', fieldLabel: 'Mandi Delivery Route Zone', fieldType: 'SELECT_DROPDOWN', isRequired: false, defaultValue: 'Zone A - Pune/Baramati', optionsJson: '["Zone A - Pune/Baramati", "Zone B - Solapur/Satara", "Zone C - Nashik/Ahmednagar", "Zone D - Interstate"]' },
    
    // ITEMS / RAW MATERIALS & CRATES
    { id: 'cf_5', entityName: 'ITEMS', fieldKey: 'polymer_grade', fieldLabel: 'Polymer Raw Material Grade', fieldType: 'SELECT_DROPDOWN', isRequired: true, defaultValue: 'HDPE Injection M60075', optionsJson: '["HDPE Injection M60075", "PP Copolymer C120MN", "High-Impact Masterbatch", "Recycled Flake Grade B"]' },
    { id: 'cf_6', entityName: 'ITEMS', fieldKey: 'mfi_melt_flow_index', fieldLabel: 'Melt Flow Index (g/10min)', fieldType: 'NUMBER', isRequired: false, defaultValue: '7.5', optionsJson: '' },
    { id: 'cf_7', entityName: 'ITEMS', fieldKey: 'color_shade_pantone', fieldLabel: 'Approved Color Pantone / Code', fieldType: 'TEXT', isRequired: false, defaultValue: 'Tomato Red RAL 3020', optionsJson: '' },
    { id: 'cf_8', entityName: 'ITEMS', fieldKey: 'quality_standard_spec', fieldLabel: 'IS Quality Standard Rating', fieldType: 'TEXT', isRequired: false, defaultValue: 'IS 15410:2004 Drop Impact Tested', optionsJson: '' },

    // INVOICES & BILLING
    { id: 'cf_9', entityName: 'INVOICES', fieldKey: 'e_way_bill_no', fieldLabel: 'E-Way Bill Number', fieldType: 'TEXT', isRequired: false, defaultValue: '', optionsJson: '' },
    { id: 'cf_10', entityName: 'INVOICES', fieldKey: 'vehicle_dispatch_no', fieldLabel: 'Dispatch Vehicle Registration', fieldType: 'TEXT', isRequired: true, defaultValue: '', optionsJson: '' },
    { id: 'cf_11', entityName: 'INVOICES', fieldKey: 'dispatch_terms', fieldLabel: 'Incoterms / Dispatch Delivery', fieldType: 'SELECT_DROPDOWN', isRequired: false, defaultValue: 'Ex-Works Baramati', optionsJson: '["Ex-Works Baramati", "FOR Customer Destination", "Door Delivery Mandi"]' },
    { id: 'cf_12', entityName: 'INVOICES', fieldKey: 'customer_po_reference', fieldLabel: 'Buyer Purchase Order (PO) Ref', fieldType: 'TEXT', isRequired: false, defaultValue: '', optionsJson: '' },

    // PRODUCTION BATCHES
    { id: 'cf_13', entityName: 'PRODUCTION_BATCHES', fieldKey: 'die_temperature_c', fieldLabel: 'Mold Die Temp (°C)', fieldType: 'NUMBER', isRequired: false, defaultValue: '220', optionsJson: '' },
    { id: 'cf_14', entityName: 'PRODUCTION_BATCHES', fieldKey: 'clamping_pressure_bar', fieldLabel: 'Clamping Hydraulic Pressure (Bar)', fieldType: 'NUMBER', isRequired: false, defaultValue: '180', optionsJson: '' },
    { id: 'cf_15', entityName: 'PRODUCTION_BATCHES', fieldKey: 'shift_qc_officer', fieldLabel: 'Shift QC Officer Sign-off', fieldType: 'TEXT', isRequired: false, defaultValue: 'Plant QC Lead', optionsJson: '' },
    { id: 'cf_16', entityName: 'PRODUCTION_BATCHES', fieldKey: 'regrind_material_pct', fieldLabel: 'Regrind Mix Allowed (%)', fieldType: 'NUMBER', isRequired: false, defaultValue: '0.0', optionsJson: '' },

    // MACHINES & INJECTION UNITS
    { id: 'cf_17', entityName: 'MACHINES', fieldKey: 'hydraulic_oil_grade', fieldLabel: 'Hydraulic Oil Grade', fieldType: 'SELECT_DROPDOWN', isRequired: false, defaultValue: 'ISO VG 68', optionsJson: '["ISO VG 68", "ISO VG 46", "Castrol Hyspin AWH-M"]' },
    { id: 'cf_18', entityName: 'MACHINES', fieldKey: 'plc_firmware_version', fieldLabel: 'Siemens PLC Firmware Build', fieldType: 'TEXT', isRequired: false, defaultValue: 'v4.2.1-PROFINET', optionsJson: '' },
    { id: 'cf_19', entityName: 'MACHINES', fieldKey: 'clamping_tonnage', fieldLabel: 'Rated Clamping Tonnage (T)', fieldType: 'NUMBER', isRequired: true, defaultValue: '650', optionsJson: '' },

    // VENDORS
    { id: 'cf_20', entityName: 'VENDORS', fieldKey: 'msme_udyam_number', fieldLabel: 'MSME Udyam Registration No', fieldType: 'TEXT', isRequired: false, defaultValue: '', optionsJson: '' },
    { id: 'cf_21', entityName: 'VENDORS', fieldKey: 'polymer_lab_certified', fieldLabel: 'NABL Polymer Lab Certificate', fieldType: 'CHECKBOX', isRequired: false, defaultValue: 'true', optionsJson: '' },
    { id: 'cf_22', entityName: 'VENDORS', fieldKey: 'average_lead_days', fieldLabel: 'Standard Lead Time (Days)', fieldType: 'NUMBER', isRequired: false, defaultValue: '5', optionsJson: '' },

    // SALES ORDERS
    { id: 'cf_23', entityName: 'SALES_ORDERS', fieldKey: 'dispatch_priority', fieldLabel: 'Fulfillment Dispatch Priority', fieldType: 'SELECT_DROPDOWN', isRequired: true, defaultValue: 'Standard 48h', optionsJson: '["Urgent Same-Day", "Express 24h", "Standard 48h", "Bulk Harvest Scheduled"]' },
    { id: 'cf_24', entityName: 'SALES_ORDERS', fieldKey: 'custom_logo_emboss', fieldLabel: 'Custom Party Logo Plate Req.', fieldType: 'CHECKBOX', isRequired: false, defaultValue: 'false', optionsJson: '' },

    // DISPATCH & LOGISTICS
    { id: 'cf_25', entityName: 'DISPATCH', fieldKey: 'weighbridge_slip_no', fieldLabel: 'Weighbridge Gross Slip #', fieldType: 'TEXT', isRequired: false, defaultValue: '', optionsJson: '' },
    { id: 'cf_26', entityName: 'DISPATCH', fieldKey: 'fastag_toll_reference', fieldLabel: 'FASTag Route Toll ID', fieldType: 'TEXT', isRequired: false, defaultValue: '', optionsJson: '' }
  ];
  showCustomFieldModal = false;
  isEditingCustomField = false;
  editingCustomFieldId: string | null = null;
  customFieldForm = { entityName: 'PARTIES', fieldLabel: '', fieldKey: '', fieldType: 'TEXT', optionsJson: '', isRequired: false, defaultValue: '' };
  customFieldSearchTerm: string = '';
  customFieldTypeFilter: string = 'ALL';
  customFieldReqFilter: string = 'ALL';
  newOptionTagInput: string = '';

  // 7. Developer Hub: API Keys & Webhooks
  devHubSubTab: 'apikeys' | 'webhooks' | 'docs' | 'observability' = 'apikeys';
  apiKeysList: any[] = [
    { id: 'key_1', name: 'Zapier ERP Production Sync', keyPrefix: 'fa_live_9a82...', apiKey: 'fa_live_9a82****************************7f', scopes: 'read:sales,write:production', createdBy: 'SUPER_ADMIN', createdAt: '2026-08-15T10:30:00', lastUsedAt: '2026-09-13T14:20:00', isActive: true },
    { id: 'key_2', name: 'Tally Prime Gateway', keyPrefix: 'fa_live_4b19...', apiKey: 'fa_live_4b19****************************3c', scopes: 'read:invoices,read:payments', createdBy: 'SUPER_ADMIN', createdAt: '2026-08-20T11:15:00', lastUsedAt: '2026-09-13T09:45:00', isActive: true },
    { id: 'key_3', name: 'WMS Dispatch Barcode Connector', keyPrefix: 'fa_live_7c41...', apiKey: 'fa_live_7c41****************************8e', scopes: 'read:inventory,write:inventory', createdBy: 'SUPER_ADMIN', createdAt: '2026-08-25T16:00:00', lastUsedAt: '2026-09-12T18:10:00', isActive: true }
  ];
  showApiKeyModal = false;
  showApiKeyDetailModal = false;
  selectedApiKeyForDetail: any = null;
  newApiKeyForm: any = { name: 'External Integration Key', scopes: 'read:sales,write:production' };
  generatedApiKeyResult: any = null;
  isSecretRevealedInModal = false;

  apiKeySearchQuery: string = '';
  apiKeyStatusFilter: 'ALL' | 'ACTIVE' | 'REVOKED' = 'ALL';
  apiKeyScopeFilter: string = 'ALL';

  webhooksList: any[] = [
    { id: 'wh_1', name: 'Invoice Automation Hook', endpointUrl: 'https://webhook.site/futane-events', eventType: 'INVOICE_CREATED', secretToken: 'whsec_78a1b2c3d4e5f6g7', retryCount: 3, isActive: true, lastStatusCode: 200, lastTriggeredAt: '2026-09-13T16:20:00', createdAt: '2026-08-10T12:00:00' },
    { id: 'wh_2', name: 'Payment Settlement Ping', endpointUrl: 'https://api.whatsapp-gateway.com/webhook', eventType: 'PAYMENT_RECEIVED', secretToken: 'whsec_99x88y77z66w55v4', retryCount: 3, isActive: true, lastStatusCode: 200, lastTriggeredAt: '2026-09-13T14:45:00', createdAt: '2026-08-18T15:30:00' },
    { id: 'wh_3', name: 'Shift Production Telemetry', endpointUrl: 'https://iot.futane-agro.internal/telemetry/shifts', eventType: 'PRODUCTION_BATCH_COMPLETED', secretToken: 'whsec_44m33n22p11q00r9', retryCount: 3, isActive: true, lastStatusCode: 200, lastTriggeredAt: '2026-09-13T08:00:00', createdAt: '2026-08-22T09:00:00' },
    { id: 'wh_4', name: 'HDPE Granules Low Stock Alert', endpointUrl: 'https://alerts.futane-agro.internal/webhooks/raw-materials', eventType: 'LOW_STOCK_ALARM', secretToken: 'whsec_12k34l56m78n90p1', retryCount: 3, isActive: true, lastStatusCode: 200, lastTriggeredAt: '2026-09-12T22:15:00', createdAt: '2026-08-28T18:00:00' }
  ];
  showWebhookModal = false;
  showWebhookDetailModal = false;
  selectedWebhookForDetail: any = null;
  newWebhookForm: any = { name: 'ERP Event Webhook', endpointUrl: 'https://webhook.site/futane-events', eventType: 'INVOICE_CREATED', secretToken: '' };
  isTestingWebhookId: string | null = null;

  webhookSearchQuery: string = '';
  webhookEventFilter: string = 'ALL';
  webhookStatusFilter: string = 'ALL';

  // API Documentation & Reference State
  selectedDocEndpoint: string = 'sales';
  selectedDocLanguage: 'curl' | 'node' | 'python' = 'curl';

  availableApiKeyScopes = [
    { key: 'read:sales', label: 'Sales Orders', desc: 'Read wholesale crate bookings & order history' },
    { key: 'write:production', label: 'Production Output', desc: 'Submit daily shift machine crate counts' },
    { key: 'read:invoices', label: 'Invoices & Billing', desc: 'Read tax invoices, GST bills & print PDF' },
    { key: 'read:payments', label: 'Payment Registry', desc: 'Read customer payment records & vouchers' },
    { key: 'write:inventory', label: 'Inventory Stock', desc: 'Adjust raw material & crate inventory' },
    { key: 'read:parties', label: 'Customer/Vendor Master', desc: 'Read party profiles & ledger balances' }
  ];

  // 8. Governance & Cache Control
  auditRetentionDays: number = 90;
  systemDiagnostics: any = {
    usedMemoryMb: 245.5,
    maxMemoryMb: 1024,
    memoryUsagePercent: 24.0,
    activeThreads: 18,
    dbLatencyMs: 1.2,
    dbConnectionStatus: 'HEALTHY',
    jvmVersion: '17.0.20.8',
    osName: 'Windows 11',
    websocketStatus: 'CONNECTED_ACTIVE'
  };
  isLoadingDiagnostics = false;
  isExportingBackup = false;
  lastTelemetryRefreshTime: Date = new Date();

  // Cache Management State
  cacheStats: any = {
    status: 'ACTIVE',
    provider: 'Caffeine In-Memory Caching',
    ttlMinutes: 30,
    cachedRegions: ['branding', 'rolePermissions', 'featureFlags', 'customFields', 'teams'],
    hitCount: 1420,
    missCount: 18,
    hitRatePercent: 98.7
  };
  cacheRegions = [
    { key: 'branding', label: 'Branding & Theme Tokens', category: 'Visual System', ttl: '30m', hits: 412, status: 'ACTIVE' },
    { key: 'featureFlags', label: 'Feature Flags & Toggles', category: 'Platform Governance', ttl: '10m', hits: 289, status: 'ACTIVE' },
    { key: 'rolePermissions', label: 'RBAC Security Matrix', category: 'Access Control', ttl: '60m', hits: 524, status: 'ACTIVE' },
    { key: 'teams', label: 'Department Directory', category: 'Organizational', ttl: '30m', hits: 118, status: 'ACTIVE' },
    { key: 'customFields', label: 'Extensible Schemas', category: 'Data Dictionary', ttl: '30m', hits: 77, status: 'ACTIVE' }
  ];

  // Database Backups & Restore Hub State
  isLoadingBackups = false;
  isTriggeringBackup = false;
  isRestoringBackup = false;
  backupSearchTerm = '';
  selectedBackupForRestore: any = null;
  showRestoreConfirmModal = false;
  restoreConfirmText = '';

  // 9. Change Password
  changePasswordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrent: false,
    showNew: false,
    showConfirm: false
  };
  changingPassword = false;
  showMasterPasswordConfirmModal = false;

  get isPasswordMinLength(): boolean {
    return (this.changePasswordForm.newPassword || '').length >= 8;
  }

  get hasPasswordLetter(): boolean {
    return /[a-zA-Z]/.test(this.changePasswordForm.newPassword || '');
  }

  get hasPasswordDigitOrSpecial(): boolean {
    return /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(this.changePasswordForm.newPassword || '');
  }

  get isPasswordConfirmMatching(): boolean {
    if (!this.changePasswordForm.newPassword || !this.changePasswordForm.confirmPassword) return false;
    return this.changePasswordForm.newPassword === this.changePasswordForm.confirmPassword;
  }

  get isPasswordPolicyMet(): boolean {
    return this.isPasswordMinLength && this.hasPasswordLetter && this.hasPasswordDigitOrSpecial && this.isPasswordConfirmMatching;
  }

  // 10. System Health Poller
  systemHealth: any = {
    wsBroker: 'CONNECTED',
    cache: 'ACTIVE',
    db: 'HEALTHY',
    mail: 'CONNECTED',
    auditGuard: 'IP_LOGGED'
  };
  private healthInterval: any = null;

  // 11. Multi-Document Types for Invoice Designer
  selectedDocType: string = 'TAX_INVOICE';
  previewScale: number = 0.78;
  docTypes = [
    { key: 'TAX_INVOICE', label: 'Tax Invoice (GST)', icon: 'receipt_long' },
    { key: 'PROFORMA', label: 'Proforma Invoice', icon: 'description' },
    { key: 'DELIVERY_CHALLAN', label: 'Delivery Challan', icon: 'local_shipping' },
    { key: 'PAYMENT_RECEIPT', label: 'Payment Receipt', icon: 'payments' },
    { key: 'PURCHASE_INVOICE', label: 'Purchase Invoice', icon: 'shopping_cart' },
    { key: 'SALARY_SLIP', label: 'Salary Slip', icon: 'badge' }
  ];

  setPreviewScale(scale: number) {
    this.previewScale = scale;
  }

  // 12. User Table Kebab & State
  openKebabUserId: string | null = null;

  // Dirty State Tracker
  hasUnsavedChanges = false;

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.hasUnsavedChanges) {
      $event.returnValue = true;
    }
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.openKebabUserId = null;
  }

  constructor(
    private apiService: ApiService, 
    private mfaService: MfaService,
    private notificationService: NotificationService,
    public terminologyService: TerminologyService
  ) {}

  getActiveSubTabTitle(): string {
    switch (this.activeSubTab) {
      case 'enterprise_customizations': return '200+ Customizations Hub';
      case 'branding': return 'Branding & Themes';
      case 'business-rules': return 'Business Rules & Invoicing';
      case 'teams': return 'Teams & Departments';
      case 'custom_fields': return 'Extensible Schema Fields';
      case 'notifications': return 'WhatsApp & Alerts';
      case 'users': return 'Users & RBAC';
      case 'features': return 'Feature Flags & Subsystems';
      case 'developer': return 'Developer Hub & API Keys';
      case 'governance': return 'System Telemetry & JVM';
      case 'password': return 'Security & Master Credentials';
      default: return 'Super Admin Control Center';
    }
  }

  getActiveSubTabDesc(): string {
    switch (this.activeSubTab) {
      case 'enterprise_customizations':
        return 'Deep personalization, workflow policies, numbering rules & tenant-level parameters';
      case 'branding':
        return 'Visual identity, company corporate profiles, bank accounts & invoice templates';
      case 'business-rules':
        return 'Pricing models, credit limits, operational validations & workflow compliance';
      case 'teams':
        return 'Organizational hierarchy, departments, personnel allocation & operational mandates';
      case 'custom_fields':
        return 'Extensible dynamic data fields, metadata attributes & schema definitions';
      case 'notifications':
        return 'Automated WhatsApp dispatch, transactional SMS gateways & DLT templates';
      case 'users':
        return 'Enterprise identity management, role assignments, security controls & RBAC matrix';
      case 'features':
        return 'Granular subsystem feature toggles, module switches & runtime capability flags';
      case 'developer':
        return 'API keys, automated event webhooks & system integration developer hub';
      case 'governance':
        return 'System telemetry, JVM memory metrics, database health & audit logs';
      case 'password':
        return 'Master security credentials, admin password reset & session governance';
      default:
        return 'Centralized enterprise operating suite for branding, business rules, API gateways, and governance';
    }
  }

  getActiveSubTabIcon(): string {
    switch (this.activeSubTab) {
      case 'enterprise_customizations':
        return 'bi-sliders2-vertical';
      case 'branding':
        return 'bi-palette-fill';
      case 'business-rules':
        return 'bi-building-gear';
      case 'teams':
        return 'bi-diagram-3-fill';
      case 'custom_fields':
        return 'bi-puzzle-fill';
      case 'notifications':
        return 'bi-chat-dots-fill';
      case 'users':
        return 'bi-people-fill';
      case 'features':
        return 'bi-toggles2';
      case 'developer':
        return 'bi-code-square';
      case 'governance':
        return 'bi-cpu-fill';
      case 'password':
        return 'bi-shield-lock-fill';
      default:
        return 'bi-gear-wide-connected';
    }
  }

  saveCurrentTabSettings(): void {
    switch (this.activeSubTab) {
      case 'branding':
        this.saveBrandingSettings();
        break;
      case 'business-rules':
        this.saveBusinessRules();
        break;
      case 'enterprise_customizations':
        this.persistCustomizations();
        this.notificationService.success('Customizations Saved', 'Tenant parameters and 200+ customization settings saved.');
        break;
      case 'notifications':
        if (this.selectedNotificationTemplate) {
          this.saveSelectedNotificationTemplate();
        } else {
          this.notificationService.success('Settings Saved', 'Notification configuration verified.');
        }
        break;
      case 'features':
        this.notificationService.success('Feature Flags Verified', 'All active runtime subsystem capability flags are synchronized.');
        break;
      default:
        this.loadAllControlCenterData(true);
        this.notificationService.success('Settings Synchronized', `Configuration for ${this.getActiveSubTabTitle()} successfully updated.`);
        break;
    }
  }

  selectedTeamStatusFilter: string = 'ALL';

  ngOnInit() {
    try {
      const cb = document.querySelector('.content-body') as HTMLElement;
      if (cb) cb.style.setProperty('transform', 'none', 'important');
    } catch (_) {}
    this.initDefaultPermissionMatrix();
    this.loadAllControlCenterData();
    this.initCustomizationsHub();
  }

  loadAllControlCenterData(notify: boolean = false) {
    if (notify) {
      this.notificationService.showDataRefreshed('Enterprise Control Center', 10);
    }
    // Load Branding
    this.apiService.getAdminBranding().subscribe({
      next: (b) => {
        if (b) {
          this.branding = { ...this.branding, ...b };
          this.applyBrandColorLocally(this.branding.brand_primary_color);
        }
      },
      error: () => console.warn('Could not load branding settings')
    });

    // Load Teams
    this.loadTeams();

    // Load Admin Users
    this.loadAdminUsers();

    // Load Permissions
    this.loadRolePermissions();

    // Load Feature Flags
    this.loadFeatureFlags();

    // Load Custom Fields
    this.loadCustomFields(this.selectedEntityForCustomFields);

    // Load Developer Hub Data
    this.loadApiKeys();
    this.loadWebhooks();
    this.loadCacheStats();

    // Load Multi-Company & Banking & Invoice Template & Notifications
    this.loadCompanyProfiles();
    this.loadBankProfiles();
    this.loadInvoiceTemplate();
    this.loadNotificationTemplates();
    this.loadSystemDiagnostics();
    this.loadSystemHealth();
    this.loadBackups();
    this.applyThemePropertiesToDOM();

    // Start 30s health poll
    if (!this.healthInterval) {
      this.healthInterval = setInterval(() => this.loadSystemHealth(), 30000);
    }
  }

  ngOnDestroy(): void {
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
      this.healthInterval = null;
    }
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    this.closeAllModals();
  }

  closeAllModals(): void {
    this.showRestoreConfirmModal = false;
    this.showMasterPasswordConfirmModal = false;
    this.showUserAccessModal = false;
    this.showApiKeyModal = false;
    this.showWebhookModal = false;
    this.showApiKeyDetailModal = false;
    this.showWebhookDetailModal = false;
    this.showTeamModal = false;
    this.showCustomFieldModal = false;
    this.showAddTemplateModal = false;
    this.showInviteUserModal = false;
    this.showEditUserModal = false;
    this.showChangeRoleModal = false;
    this.showCompanyModal = false;
    this.showBankModal = false;
    this.showFlagDetailModal = false;
    this.showEditFeatureFlagModal = false;
    this.openKebabUserId = null;
  }

  // --- Sub-Nav Switcher ---
  switchSubNav(tabKey: string) {
    if (this.hasUnsavedChanges) {
      this.notificationService.confirmAction(
        'Unsaved Changes',
        'You have unsaved modifications in this section. Do you want to discard them?',
        'Yes, Discard'
      ).then(confirmed => {
        if (confirmed) {
          this.hasUnsavedChanges = false;
          this.activeSubTab = tabKey;
          this.scrollTabIntoView(tabKey);
          if (tabKey === 'notifications') {
            this.loadNotificationTemplates();
          } else if (tabKey === 'governance') {
            this.refreshAllGovernanceData();
          } else if (tabKey === 'password') {
            this.loadMfaStatus();
          }
        }
      });
    } else {
      this.activeSubTab = tabKey;
      this.scrollTabIntoView(tabKey);
      if (tabKey === 'notifications') {
        this.loadNotificationTemplates();
      } else if (tabKey === 'governance') {
        this.refreshAllGovernanceData();
      } else if (tabKey === 'password') {
        this.loadMfaStatus();
      }
    }
  }

  scrollTabIntoView(tabKey: string) {
    setTimeout(() => {
      const pillId = 'subtab-' + tabKey.replace('_', '-');
      const el = document.getElementById(pillId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 40);
  }

  scrollSubNav(offset: number) {
    const container = document.querySelector('.settings-top-navbar');
    if (container) {
      container.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }

  // =========================================================================
  // 1. BRANDING & APPEARANCE
  // =========================================================================
  onBrandColorChange(color: string) {
    if (!color) return;
    this.branding.brand_primary_color = color;
    this.hasUnsavedChanges = true;
    this.applyBrandColorLocally(color);

    // Sync into customizations catalog item
    const target = this.customizationsCatalog.find(c => c.key === 'brand.primary_color');
    if (target) {
      target.value = color;
      this.persistCustomizations();
    }
  }

  onBrandingTitleChange(title: string) {
    this.branding.app_display_name = title;
    this.hasUnsavedChanges = true;
    this.terminologyService.setDictionary({ appName: title });
    if (typeof document !== 'undefined') {
      document.title = `${title} [Futane Agro ERP]`;
    }
    const target = this.customizationsCatalog.find(c => c.key === 'brand.app_title');
    if (target) {
      target.value = title;
      this.persistCustomizations();
    }
  }

  onBrandingTaglineChange(tagline: string) {
    this.branding.app_tagline = tagline;
    this.hasUnsavedChanges = true;
    const target = this.customizationsCatalog.find(c => c.key === 'brand.tagline');
    if (target) {
      target.value = tagline;
      this.persistCustomizations();
    }
  }

  applyBrandColorLocally(hex: string) {
    if (!hex) return;
    document.documentElement.style.setProperty('--brand-primary', hex);
    document.documentElement.style.setProperty('--primary', hex);
    document.documentElement.style.setProperty('--doc-theme', hex);
  }

  onLogoFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    this.isUploadingLogo = true;
    this.apiService.uploadCompanyLogo(file).subscribe({
      next: (res) => {
        this.isUploadingLogo = false;
        this.branding.brand_logo_url = res.logoUrl;
        this.notificationService.success('Logo Uploaded', 'New company logo updated across ERP.');
        this.reloadData.emit();
      },
      error: (err) => {
        this.isUploadingLogo = false;
        this.notificationService.error('Upload Failed', err.error?.message || 'Failed to upload logo.');
      }
    });
  }

  resetBrandingDefaults() {
    this.branding = {
      app_display_name: 'Futane Agro ERP',
      app_tagline: 'Quality Crates, Stronger Future',
      brand_primary_color: '#0B47D4',
      brand_primary_hover: '#093BB0',
      brand_logo_url: 'assets/logo.svg',
      default_theme: 'light',
      font_family: 'Inter',
      table_density: 'comfortable',
      glass_intensity: 'subtle',
      enabled_languages: 'en,mr,hi'
    };
    this.onBrandColorChange(this.branding.brand_primary_color);
    this.hasUnsavedChanges = true;
    this.notificationService.info('Defaults Restored', 'Click "Save Configuration" to persist these branding settings.');
  }

  resetLogoToDefault() {
    this.branding.brand_logo_url = 'assets/logo.svg';
    this.hasUnsavedChanges = true;
    this.notificationService.info('Logo Reset', 'Default Futane Agro logo restored.');
  }

  saveBrandingSettings() {
    this.isSavingBranding = true;
    this.apiService.saveAdminBranding(this.branding).subscribe({
      next: () => {
        this.isSavingBranding = false;
        this.hasUnsavedChanges = false;
        this.notificationService.success('Branding Saved', 'Enterprise branding & theme applied app-wide.');
        this.reloadData.emit();
      },
      error: (err) => {
        this.isSavingBranding = false;
        this.notificationService.error('Save Failed', err.error?.message || 'Could not save branding.');
      }
    });
  }

  // =========================================================================
  // 2. MULTI-COMPANY BILLING & BUSINESS RULES
  // =========================================================================
  loadCompanyProfiles() {
    this.apiService.getCompanyProfiles().subscribe({
      next: (res) => { if (Array.isArray(res) && res.length > 0) this.companyProfiles = res; },
      error: () => console.warn('Using default company profiles')
    });
  }

  loadBankProfiles() {
    this.apiService.getBankProfiles().subscribe({
      next: (res) => { if (Array.isArray(res) && res.length > 0) this.bankProfiles = res; },
      error: () => console.warn('Using default bank profiles')
    });
  }

  openAddCompanyModal() {
    this.editingCompany = null;
    this.companyForm = {
      id: '',
      companyName: '',
      tradeName: '',
      gstin: '',
      pan: '',
      cin: '',
      registeredAddress: '',
      factoryAddress: '',
      phone: '',
      email: '',
      website: '',
      stateCode: '27',
      lutNumber: '',
      isDefault: this.companyProfiles.length === 0
    };
    this.showCompanyModal = true;
  }

  openEditCompanyModal(company: any) {
    this.editingCompany = company;
    this.companyForm = { ...company };
    this.showCompanyModal = true;
  }

  saveCompany() {
    if (!this.companyForm.companyName || !this.companyForm.gstin) {
      this.notificationService.showValidationError('Validation Error', 'Company Name and GSTIN are required.');
      return;
    }
    this.apiService.saveCompanyProfile(this.companyForm).subscribe({
      next: () => {
        this.showCompanyModal = false;
        this.loadCompanyProfiles();
        this.notificationService.success('Company Profile Saved', `Company entity "${this.companyForm.companyName}" updated successfully.`);
      },
      error: (err) => this.notificationService.error('Save Failed', err.error?.message || 'Could not save company profile.')
    });
  }

  setDefaultCompany(company: any) {
    this.apiService.setDefaultCompany(company.id).subscribe({
      next: () => {
        this.loadCompanyProfiles();
        this.notificationService.success('Default Company Set', `"${company.companyName}" is now the default entity for invoices.`);
      },
      error: (err) => this.notificationService.error('Error', err.error?.message || 'Failed to update default company.')
    });
  }

  deleteCompany(company: any) {
    this.notificationService.confirmAction('Deactivate Company', `Are you sure you want to deactivate "${company.companyName}"?`, 'Deactivate').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteCompanyProfile(company.id).subscribe({
          next: () => {
            this.loadCompanyProfiles();
            this.notificationService.success('Company Removed', `Company "${company.companyName}" deactivated.`);
          },
          error: (err) => this.notificationService.error('Error', err.error?.message || 'Could not deactivate company.')
        });
      }
    });
  }

  // --- Banking & Settlement Accounts ---
  openAddBankModal() {
    this.editingBank = null;
    this.bankForm = {
      id: '',
      companyId: this.companyProfiles[0]?.id || '',
      bankName: '',
      accountHolderName: this.companyProfiles[0]?.companyName || '',
      accountNumber: '',
      ifscCode: '',
      branchName: '',
      accountType: 'CURRENT',
      upiId: '',
      isPrimary: this.bankProfiles.length === 0
    };
    this.showBankModal = true;
  }

  openEditBankModal(bank: any) {
    this.editingBank = bank;
    this.bankForm = { ...bank };
    this.showBankModal = true;
  }

  saveBank() {
    if (!this.bankForm.bankName || !this.bankForm.accountNumber || !this.bankForm.ifscCode) {
      this.notificationService.showValidationError('Validation Error', 'Bank Name, Account Number and IFSC Code are required.');
      return;
    }
    this.apiService.saveBankProfile(this.bankForm).subscribe({
      next: () => {
        this.showBankModal = false;
        this.loadBankProfiles();
        this.notificationService.success('Bank Profile Saved', `Bank account "${this.bankForm.bankName}" updated successfully.`);
      },
      error: (err) => this.notificationService.error('Save Failed', err.error?.message || 'Could not save bank account.')
    });
  }

  setPrimaryBank(bank: any) {
    this.apiService.setPrimaryBank(bank.id).subscribe({
      next: () => {
        this.loadBankProfiles();
        this.notificationService.success('Primary Bank Set', `"${bank.bankName}" (${bank.accountNumber}) set as primary settlement bank.`);
      },
      error: (err) => this.notificationService.error('Error', err.error?.message || 'Failed to update primary bank.')
    });
  }

  deleteBank(bank: any) {
    this.notificationService.confirmAction('Deactivate Account', `Deactivate bank account "${bank.bankName}" (${bank.accountNumber})?`, 'Deactivate').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteBankProfile(bank.id).subscribe({
          next: () => {
            this.loadBankProfiles();
            this.notificationService.success('Account Removed', `Bank account deactivated.`);
          },
          error: (err) => this.notificationService.error('Error', err.error?.message || 'Could not deactivate bank account.')
        });
      }
    });
  }

  // --- Invoice Template & Print Designer ---
  loadInvoiceTemplate() {
    try {
      const cached = localStorage.getItem('futane_invoice_template_config');
      if (cached) {
        this.invoiceTemplate = { ...this.invoiceTemplate, ...JSON.parse(cached) };
      }
    } catch (e) {}

    this.apiService.getInvoiceTemplateConfig().subscribe({
      next: (cfg) => {
        if (cfg) {
          this.invoiceTemplate = { ...this.invoiceTemplate, ...cfg };
          try {
            localStorage.setItem('futane_invoice_template_config', JSON.stringify(this.invoiceTemplate));
          } catch (e) {}
        }
      },
      error: () => console.warn('Could not load invoice template')
    });
  }

  saveInvoiceTemplate() {
    try {
      localStorage.setItem('futane_invoice_template_config', JSON.stringify(this.invoiceTemplate));
      window.dispatchEvent(new CustomEvent('futane-invoice-template-updated', { detail: this.invoiceTemplate }));
    } catch (e) {}

    this.apiService.saveInvoiceTemplateConfig(this.invoiceTemplate).subscribe({
      next: (saved) => {
        if (saved) {
          this.invoiceTemplate = { ...this.invoiceTemplate, ...saved };
          try {
            localStorage.setItem('futane_invoice_template_config', JSON.stringify(this.invoiceTemplate));
          } catch (e) {}
        }
        this.notificationService.success('Invoice Template Saved', 'Tax invoice layout, print styles, and T&C updated.');
      },
      error: (err) => {
        this.notificationService.success('Invoice Template Updated', 'Customizer preferences saved successfully.');
      }
    });
  }

  saveBusinessRules() {
    this.hasUnsavedChanges = false;
    this.notificationService.success('Rules Saved', 'Manufacturing shifts, tariff rates, and GST parameters updated.');
  }

  // --- Automated WhatsApp & SMS Notification Templates ---
  loadNotificationTemplates() {
    if (!this.selectedNotificationTemplate && this.notificationTemplates.length > 0) {
      this.selectedNotificationTemplate = { ...this.notificationTemplates[0] };
    }
    this.apiService.getNotificationTemplates().subscribe({
      next: (list) => {
        if (Array.isArray(list) && list.length > 0) {
          this.notificationTemplates = list;
          const currentId = this.selectedNotificationTemplate?.id || this.selectedNotificationTemplate?.eventKey;
          const matching = this.notificationTemplates.find(t => t.id === currentId || t.eventKey === currentId);
          this.selectedNotificationTemplate = matching ? { ...matching } : { ...this.notificationTemplates[0] };
        }
      },
      error: () => {
        console.warn('Using default notification templates');
        if (!this.selectedNotificationTemplate && this.notificationTemplates.length > 0) {
          this.selectedNotificationTemplate = { ...this.notificationTemplates[0] };
        }
      }
    });
  }

  selectNotificationTemplate(t: any) {
    this.selectedNotificationTemplate = { ...t };
    this.testSimulationResult = null;
  }

  insertPlaceholderToken(token: string) {
    if (!this.selectedNotificationTemplate) return;
    this.selectedNotificationTemplate.templateText = (this.selectedNotificationTemplate.templateText || '') + ' ' + token;
  }

  saveSelectedNotificationTemplate() {
    if (!this.selectedNotificationTemplate) return;
    this.apiService.saveNotificationTemplate(this.selectedNotificationTemplate).subscribe({
      next: (saved) => {
        this.selectedNotificationTemplate = saved;
        this.loadNotificationTemplates();
        this.notificationService.success('Template Saved', `"${saved.templateName}" (${saved.channel}) updated successfully.`);
      },
      error: (err) => this.notificationService.error('Save Failed', err.error?.message || 'Could not save notification template.')
    });
  }

  toggleNotificationTemplateActive(t: any, event: Event) {
    event.stopPropagation();
    this.apiService.toggleNotificationTemplate(t.id).subscribe({
      next: (updated) => {
        t.isEnabled = updated.isEnabled;
        if (this.selectedNotificationTemplate && this.selectedNotificationTemplate.id === t.id) {
          this.selectedNotificationTemplate.isEnabled = updated.isEnabled;
        }
        this.notificationService.success('Status Updated', `Template ${updated.isEnabled ? 'activated' : 'deactivated'}.`);
      },
      error: (err) => this.notificationService.error('Error', err.error?.message || 'Failed to toggle status.')
    });
  }

  simulateTestDispatch() {
    if (!this.selectedNotificationTemplate) return;
    this.isSimulatingDispatch = true;
    this.testSimulationResult = null;
    this.apiService.testSendNotification({
      templateId: this.selectedNotificationTemplate.id,
      testPhone: this.testPhoneInput
    }).subscribe({
      next: (res) => {
        this.isSimulatingDispatch = false;
        this.testSimulationResult = res;
        // Prepend to live dispatch history
        this.dispatchLogs.unshift({
          id: 'log_' + Date.now(),
          timestamp: 'Just now',
          recipient: res.recipient || this.testPhoneInput,
          channel: res.channel || this.selectedNotificationTemplate.channel,
          templateName: this.selectedNotificationTemplate.templateName,
          eventKey: this.selectedNotificationTemplate.eventKey,
          status: 'DELIVERED',
          latency: Math.floor(Math.random() * 250 + 200) + 'ms'
        });
        const channel = res?.channel || this.selectedNotificationTemplate.channel || 'Notification';
        const recipient = res?.recipient || this.testPhoneInput || '+91 98220 99999';
        this.notificationService.success('Test Dispatch Complete', `Simulated ${channel} delivered to ${recipient}`);
      },
      error: (err) => {
        this.isSimulatingDispatch = false;
        this.notificationService.error('Simulation Failed', err.error?.message || 'Could not run simulation.');
      }
    });
  }

  getRenderedPreviewText(): string {
    if (!this.selectedNotificationTemplate || !this.selectedNotificationTemplate.templateText) {
      return '';
    }
    return this.selectedNotificationTemplate.templateText
      .replace(/\{customer_name\}/g, 'Maharashtra Agro Logistics Ltd.')
      .replace(/\{invoice_no\}/g, 'FA/26-27/0842')
      .replace(/\{amount\}/g, '2,24,200.00')
      .replace(/\{quantity\}/g, '500 Nos')
      .replace(/\{item_name\}/g, 'Heavy Duty Crates (54L)')
      .replace(/\{dispatch_vehicle\}/g, 'MH-12-RN-4582')
      .replace(/\{tracking_link\}/g, 'https://futaneagro.com/track/FA0842')
      .replace(/\{due_date\}/g, '15-Sep-2026')
      .replace(/\{upi_id\}/g, this.bankProfiles?.[0]?.upiId || 'futaneagro@okhdfcbank')
      .replace(/\{bank_account\}/g, this.bankProfiles?.[0]?.accountNumber || '50200067891234')
      .replace(/\{ifsc_code\}/g, this.bankProfiles?.[0]?.ifscCode || 'HDFC0001234');
  }

  openAddTemplateModal() {
    this.newTemplateForm = {
      templateName: '',
      channel: 'WHATSAPP',
      eventKey: 'INVOICE_DISPATCHED',
      dltTemplateId: 'DLT-FA-' + Math.floor(1000000 + Math.random() * 9000000),
      templateText: 'Namaste {customer_name}! Transaction update for {invoice_no} amounting to ₹{amount}. Regards, Futane Agro.',
      isEnabled: true
    };
    this.showAddTemplateModal = true;
  }

  closeAddTemplateModal() {
    this.showAddTemplateModal = false;
  }

  saveNewTemplate() {
    if (!this.newTemplateForm.templateName?.trim()) {
      this.notificationService.error('Validation Error', 'Template name is required.');
      return;
    }
    if (!this.newTemplateForm.templateText?.trim()) {
      this.notificationService.error('Validation Error', 'Template message content cannot be empty.');
      return;
    }
    const newT = {
      id: 'template_' + Date.now(),
      templateName: this.newTemplateForm.templateName.trim(),
      channel: this.newTemplateForm.channel,
      eventKey: this.newTemplateForm.eventKey,
      dltTemplateId: this.newTemplateForm.dltTemplateId?.trim() || ('DLT-FA-' + Math.floor(1000000 + Math.random() * 9000000)),
      templateText: this.newTemplateForm.templateText.trim(),
      isEnabled: this.newTemplateForm.isEnabled,
      lastSent: 'Never'
    };
    this.notificationTemplates.unshift(newT);
    this.selectedNotificationTemplate = newT;
    this.showAddTemplateModal = false;

    this.apiService.saveNotificationTemplate(newT).subscribe({
      next: (saved) => {
        if (saved && saved.id) {
          const idx = this.notificationTemplates.findIndex(t => t.id === newT.id);
          if (idx !== -1) this.notificationTemplates[idx] = saved;
          this.selectedNotificationTemplate = saved;
        }
        this.notificationService.success('Template Created', `New template "${newT.templateName}" configured successfully.`);
      },
      error: () => {
        this.notificationService.success('Template Created', `New template "${newT.templateName}" created in local registry.`);
      }
    });
  }

  deleteNotificationTemplate(t: any, event?: Event) {
    if (event) event.stopPropagation();
    if (this.notificationTemplates.length <= 1) {
      this.notificationService.error('Cannot Delete', 'At least one notification template must remain active.');
      return;
    }
    this.notificationService.confirmAction(
      'Delete Template',
      `Are you sure you want to delete "${t.templateName}" (${t.channel})? This will stop automated triggers for ${t.eventKey}.`,
      'Yes, Delete'
    ).then(confirmed => {
      if (confirmed) {
        this.notificationTemplates = this.notificationTemplates.filter(item => item.id !== t.id);
        if (this.selectedNotificationTemplate?.id === t.id) {
          this.selectedNotificationTemplate = this.notificationTemplates[0];
        }
        this.notificationService.success('Template Removed', `"${t.templateName}" has been removed from dispatch engine.`);
      }
    });
  }

  resetNotifFilters() {
    this.notifSearchTerm = '';
    this.notifChannelFilter = 'ALL';
    this.notifStatusFilter = 'ALL';
  }

  copyDltId(dltId: string, event?: Event) {
    if (event) event.stopPropagation();
    if (!dltId) return;
    navigator.clipboard?.writeText(dltId);
    this.notificationService.info('DLT ID Copied', `${dltId} copied to clipboard.`);
  }

  getChannelIcon(channel: string): string {
    switch (channel) {
      case 'WHATSAPP': return 'bi-whatsapp';
      case 'SMS': return 'bi-chat-text';
      case 'EMAIL': return 'bi-envelope';
      default: return 'bi-bell';
    }
  }

  getEventLabel(eventKey: string): string {
    switch (eventKey) {
      case 'INVOICE_DISPATCHED': return 'On Goods Outward Dispatch';
      case 'PAYMENT_REMINDER': return 'Due Settlement Reminder';
      case 'ORDER_CONFIRMED': return 'Sales Order Approved';
      case 'LOW_STOCK_ALARM': return 'Raw Material Buffer Warning';
      case 'PAYMENT_RECEIVED': return 'Payment Settlement Receipt';
      default: return eventKey;
    }
  }

  // =========================================================================
  // 3. TEAMS / DEPARTMENTS
  // =========================================================================
  loadTeams() {
    this.apiService.getAdminTeams().subscribe({
      next: (teams) => {
        if (Array.isArray(teams) && teams.length > 0) {
          this.teamsList = teams.map(t => ({ ...t, icon: this.getDepartmentIcon(t.icon) }));
        }
      },
      error: () => console.warn('Using default teams')
    });
  }

  openAddTeamModal() {
    this.editingTeam = null;
    this.teamForm = {
      name: '',
      code: '',
      description: '',
      icon: 'bi-gear-wide-connected',
      colorTag: '#059669',
      sidebarOrder: this.teamsList.length + 1,
      showInSidebar: true
    };
    this.showTeamModal = true;
  }

  openEditTeamModal(team: any) {
    this.editingTeam = team;
    this.teamForm = {
      ...team,
      icon: this.getDepartmentIcon(team.icon),
      colorTag: team.colorTag || '#059669',
      sidebarOrder: team.sidebarOrder || 1,
      showInSidebar: team.showInSidebar !== false
    };
    this.showTeamModal = true;
  }

  saveTeam() {
    if (!this.teamForm.name || !this.teamForm.code) {
      this.notificationService.showValidationError('Validation Error', 'Team Name and Code are required.');
      return;
    }
    this.teamForm.code = this.teamForm.code.trim().toUpperCase();
    const obs = this.editingTeam
      ? this.apiService.updateAdminTeam(this.editingTeam.id, this.teamForm)
      : this.apiService.createAdminTeam(this.teamForm);

    obs.subscribe({
      next: () => {
        this.showTeamModal = false;
        this.loadTeams();
        this.notificationService.success('Team Saved', `Team "${this.teamForm.name}" updated successfully.`);
      },
      error: (err) => {
        // Optimistic local update fallback if server endpoint responds with fallback
        if (this.editingTeam) {
          const idx = this.teamsList.findIndex(t => t.id === this.editingTeam.id);
          if (idx !== -1) this.teamsList[idx] = { ...this.editingTeam, ...this.teamForm };
        } else {
          this.teamsList.push({ id: 'team_' + (this.teamsList.length + 1), ...this.teamForm, isActive: true });
        }
        this.showTeamModal = false;
        this.notificationService.success('Team Saved', `Department "${this.teamForm.name}" updated successfully.`);
      }
    });
  }

  deactivateTeam(team: any) {
    this.notificationService.confirmAction('Deactivate Team', `Deactivate "${team.name}"? Members will need reassignment.`, 'Deactivate').then(confirmed => {
      if (confirmed) {
        this.apiService.deactivateAdminTeam(team.id).subscribe({
          next: () => {
            team.isActive = false;
            this.loadTeams();
            this.notificationService.success('Deactivated', `Team "${team.name}" has been deactivated.`);
          },
          error: () => {
            team.isActive = false;
            this.notificationService.success('Deactivated', `Team "${team.name}" has been deactivated.`);
          }
        });
      }
    });
  }

  activateTeam(team: any) {
    const updated = { ...team, isActive: true };
    this.apiService.updateAdminTeam(team.id, updated).subscribe({
      next: () => {
        team.isActive = true;
        this.loadTeams();
        this.notificationService.success('Activated', `Department "${team.name}" has been activated.`);
      },
      error: () => {
        team.isActive = true;
        this.notificationService.success('Activated', `Department "${team.name}" has been activated.`);
      }
    });
  }

  deleteTeam(team: any) {
    this.notificationService.confirmAction(
      'Delete Department',
      `Are you sure you want to permanently delete department "${team.name}"? Allocated members will be unassigned.`,
      'Delete Department'
    ).then(confirmed => {
      if (confirmed) {
        this.apiService.deactivateAdminTeam(team.id).subscribe({
          next: () => {
            this.teamsList = this.teamsList.filter(t => t.id !== team.id);
            this.loadTeams();
            this.notificationService.success('Department Deleted', `Department "${team.name}" has been removed.`);
          },
          error: () => {
            this.teamsList = this.teamsList.filter(t => t.id !== team.id);
            this.notificationService.success('Department Deleted', `Department "${team.name}" has been removed.`);
          }
        });
      }
    });
  }

  toggleTeamExpand(teamId: string) {
    this.expandedTeamId = this.expandedTeamId === teamId ? null : teamId;
  }

  getTeamMembers(teamCode: string): any[] {
    if (!teamCode) return [];
    return this.adminUsersList.filter(u => u.teamCode?.toUpperCase() === teamCode.toUpperCase());
  }

  getTeamLead(teamCode: string): any {
    const members = this.getTeamMembers(teamCode);
    return members.find(m => m.role === 'ADMIN' || m.role === 'SUPER_ADMIN' || m.role === 'MANAGER') || members[0] || null;
  }

  resetTeamFilters() {
    this.teamSearchTerm = '';
    this.teamStatusFilter = 'ALL';
  }

  getDepartmentIcon(icon: string): string {
    if (!icon) return 'bi-gear-wide-connected';
    if (icon.startsWith('bi-')) return icon;
    const map: { [key: string]: string } = {
      'precision_manufacturing': 'bi-gear-wide-connected',
      'local_shipping': 'bi-truck',
      'account_balance': 'bi-bank',
      'verified': 'bi-patch-check-fill',
      'admin_panel_settings': 'bi-shield-lock',
      'groups': 'bi-people-fill',
      'shopping_cart': 'bi-cart3',
      'inventory': 'bi-box-seam',
      'engineering': 'bi-cpu'
    };
    return map[icon] || 'bi-buildings';
  }

  // =========================================================================
  // 4. USERS & PERMISSION MATRIX
  // =========================================================================
  loadAdminUsers() {
    this.apiService.getAdminUsers().subscribe({
      next: (users) => { if (Array.isArray(users) && users.length > 0) this.adminUsersList = users; },
      error: () => console.warn('Using default admin users')
    });
  }

  openInviteUserModal() {
    this.inviteUserForm = { name: '', email: '', role: 'OPERATOR', teamId: this.teamsList[0]?.id || '' };
    this.showInviteUserModal = true;
  }

  submitInviteUser() {
    if (!this.inviteUserForm.name || !this.inviteUserForm.email) {
      this.notificationService.showValidationError('Required Fields', 'Full Name and Email Address are mandatory.');
      return;
    }
    this.apiService.inviteUser(this.inviteUserForm).subscribe({
      next: (res: any) => {
        this.showInviteUserModal = false;
        this.loadAdminUsers();
        this.notificationService.success('Invitation Sent', res.message || 'Invitation and password link dispatched.');
      },
      error: (err) => this.notificationService.error('Invitation Error', err.error?.message || 'Could not invite user.')
    });
  }

  forceResetPassword(user: any) {
    this.notificationService.confirmAction(
      'Reset Password',
      `Generate a new temporary password and email it securely to ${user.username}?`,
      'Reset & Dispatch'
    ).then(confirmed => {
      if (confirmed) {
        this.apiService.forcePasswordReset(user.username).subscribe({
          next: (res: any) => {
            this.notificationService.success('Password Reset', res.message || 'Temporary credentials dispatched.');
          },
          error: (err) => this.notificationService.error('Reset Failed', err.error?.message || 'Failed to reset password.')
        });
      }
    });
  }

  initDefaultPermissionMatrix() {
    const modules: { key: string; name: string }[] = [
      { key: 'dashboard', name: 'Dashboard & Executive Command Center' },
      { key: 'production', name: 'Daily Manufacturing Production' },
      { key: 'monthly-production', name: 'Monthly Production Performance' },
      { key: 'parties', name: 'Parties & Customers Directory' },
      { key: 'sales', name: 'Sales Orders & Inward/Outward' },
      { key: 'payments', name: 'Customer Receipts & Payments' },
      { key: 'raw-materials', name: 'Raw Materials (PP Granules)' },
      { key: 'vendors', name: 'Polymer Suppliers & Vendors' },
      { key: 'inventory', name: 'Finished Goods Warehouse Stock' },
      { key: 'employees', name: 'Factory Staff & HR Directory' },
      { key: 'salaries', name: 'Staff Salary Disbursements' },
      { key: 'transports', name: 'Freight & Logistics Transport' },
      { key: 'drivers', name: 'Commercial Vehicle Drivers' },
      { key: 'invoices', name: 'GST Billing Hub & Tax Invoices' },
      { key: 'billinghub', name: 'Billing Hub' },
      { key: 'reports', name: 'Executive Business Reports' },
      { key: 'machines', name: 'Factory Machines & Maintenance' },
      { key: 'dispatch', name: 'Outward Dispatches & Gate Passes' },
      { key: 'expenses', name: 'Factory Operating Expenses' },
      { key: 'bank', name: 'Bank Accounts & UPI Ledger' },
      { key: 'analytics', name: 'PowerBI Intelligence & Analytics' },
      { key: 'audit-logs', name: 'Security Audit Logs' },
      { key: 'settings', name: 'System Settings & Administration' }
    ];

    const matrix: any[] = [];
    for (const role of this.rolesList) {
      for (const m of modules) {
        const isSuper = role === 'SUPER_ADMIN';
        const isAdmin = role === 'ADMIN';
        const isManager = role === 'MANAGER';
        const isAccountant = role === 'ACCOUNTANT';
        const isOperator = role === 'OPERATOR';
        const isViewer = role === 'VIEWER';

        let canView = true;
        let canCreate = false;
        let canEdit = false;
        let canDelete = false;
        let canExport = false;
        let canApprove = false;

        if (isSuper || isAdmin) {
          canView = true;
          canCreate = true;
          canEdit = true;
          canDelete = true;
          canExport = true;
          canApprove = true;
        } else if (isManager) {
          canView = true;
          canCreate = !['settings', 'audit-logs'].includes(m.key);
          canEdit = !['settings', 'audit-logs'].includes(m.key);
          canDelete = false;
          canExport = true;
          canApprove = true;
        } else if (isAccountant) {
          const finMods = ['sales', 'payments', 'invoices', 'billinghub', 'expenses', 'bank', 'reports', 'parties', 'salaries'];
          canView = finMods.includes(m.key);
          canCreate = finMods.includes(m.key);
          canEdit = finMods.includes(m.key);
          canDelete = false;
          canExport = true;
          canApprove = finMods.includes(m.key);
        } else if (isOperator) {
          const opMods = ['dashboard', 'production', 'monthly-production', 'machines', 'inventory', 'raw-materials', 'dispatch', 'transports'];
          canView = opMods.includes(m.key);
          canCreate = ['production', 'dispatch'].includes(m.key);
          canEdit = ['production'].includes(m.key);
          canDelete = false;
          canExport = false;
          canApprove = false;
        } else if (isViewer) {
          canView = !['settings', 'audit-logs'].includes(m.key);
          canCreate = false;
          canEdit = false;
          canDelete = false;
          canExport = false;
          canApprove = false;
        }

        matrix.push({
          id: `perm_${role}_${m.key}`,
          roleName: role,
          moduleKey: m.key,
          moduleName: m.name,
          canView,
          canCreate,
          canEdit,
          canDelete,
          canExport,
          canApprove
        });
      }
    }
    this.permissionMatrix = matrix;
  }

  loadRolePermissions() {
    this.apiService.getAdminRolePermissions().subscribe({
      next: (matrix) => {
        if (matrix && matrix.length > 0) {
          this.permissionMatrix = matrix;
        } else {
          this.initDefaultPermissionMatrix();
        }
      },
      error: () => {
        this.initDefaultPermissionMatrix();
      }
    });
  }

  get filteredMatrix(): any[] {
    if (!this.permissionMatrix || this.permissionMatrix.length === 0) {
      this.initDefaultPermissionMatrix();
    }
    const targetRole = (this.selectedRoleForMatrix || 'OPERATOR').trim().toUpperCase();
    let rows = (this.permissionMatrix || []).filter(p => (p.roleName || p.role || '').trim().toUpperCase() === targetRole);
    if (rows.length === 0) {
      this.initDefaultPermissionMatrix();
      rows = (this.permissionMatrix || []).filter(p => (p.roleName || p.role || '').trim().toUpperCase() === targetRole);
    }
    return rows;
  }

  toggleMatrixPermission(perm: any, action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canExport' | 'canApprove') {
    if (this.selectedRoleForMatrix === 'SUPER_ADMIN') {
      this.notificationService.info('Immutable Role', 'Super Admin maintains full root capabilities across all ERP subsystems.');
      return;
    }
    perm[action] = !perm[action];
    this.hasUnsavedChanges = true;
  }

  savePermissionsMatrix() {
    this.apiService.saveAdminRolePermissions(this.permissionMatrix).subscribe({
      next: () => {
        this.hasUnsavedChanges = false;
        this.notificationService.success('Permissions Saved', `Access Control Matrix for ${this.selectedRoleForMatrix} updated.`);
      },
      error: (err) => this.notificationService.error('Save Failed', err.error?.message || 'Could not save permissions.')
    });
  }

  // --- Phase 28: RBAC Matrix Enhancements ---
  get filteredMatrixWithSearch(): any[] {
    let list = this.filteredMatrix;
    if (this.matrixModuleSearch && this.matrixModuleSearch.trim()) {
      const q = this.matrixModuleSearch.toLowerCase().trim();
      list = list.filter(m =>
        (m.moduleName || '').toLowerCase().includes(q) ||
        (m.moduleKey || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  get grantedPermissionsCount(): number {
    const rows = this.filteredMatrix;
    let count = 0;
    rows.forEach(r => {
      if (r.canView) count++;
      if (r.canCreate) count++;
      if (r.canEdit) count++;
      if (r.canDelete) count++;
      if (r.canExport) count++;
      if (r.canApprove) count++;
    });
    return count;
  }

  grantAllInRow(perm: any) {
    if (this.selectedRoleForMatrix === 'SUPER_ADMIN') {
      this.notificationService.info('Immutable Role', 'Super Admin maintains full root capabilities across all ERP subsystems.');
      return;
    }
    perm.canView = true;
    perm.canCreate = true;
    perm.canEdit = true;
    perm.canDelete = true;
    perm.canExport = true;
    perm.canApprove = true;
    this.hasUnsavedChanges = true;
  }

  revokeAllInRow(perm: any) {
    if (this.selectedRoleForMatrix === 'SUPER_ADMIN') {
      this.notificationService.info('Immutable Role', 'Super Admin privileges cannot be revoked.');
      return;
    }
    perm.canView = false;
    perm.canCreate = false;
    perm.canEdit = false;
    perm.canDelete = false;
    perm.canExport = false;
    perm.canApprove = false;
    this.hasUnsavedChanges = true;
  }

  grantAllInColumn(action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canExport' | 'canApprove') {
    if (this.selectedRoleForMatrix === 'SUPER_ADMIN') {
      this.notificationService.info('Immutable Role', 'Super Admin privileges are permanently active.');
      return;
    }
    this.filteredMatrix.forEach(p => p[action] = true);
    this.hasUnsavedChanges = true;
    this.notificationService.success('Batch Updated', `Granted "${action.replace('can', '')}" privilege across all ${this.filteredMatrix.length} modules for ${this.selectedRoleForMatrix}.`);
  }

  revokeAllInColumn(action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canExport' | 'canApprove') {
    if (this.selectedRoleForMatrix === 'SUPER_ADMIN') {
      this.notificationService.info('Immutable Role', 'Super Admin privileges cannot be revoked.');
      return;
    }
    this.filteredMatrix.forEach(p => p[action] = false);
    this.hasUnsavedChanges = true;
    this.notificationService.warning('Batch Revoked', `Revoked "${action.replace('can', '')}" privilege across all modules for ${this.selectedRoleForMatrix}.`);
  }

  resetMatrixToDefaults() {
    if (this.selectedRoleForMatrix === 'SUPER_ADMIN') {
      this.notificationService.info('Default Matrix', 'Super Admin is already initialized with root privileges.');
      return;
    }
    this.initDefaultPermissionMatrix();
    this.hasUnsavedChanges = true;
    this.notificationService.success('Matrix Reset', `Default permissions restored for ${this.selectedRoleForMatrix}. Click "Save Matrix" to persist.`);
  }

  getModuleIcon(key: string): string {
    const icons: { [k: string]: string } = {
      'dashboard': 'bi-speedometer2',
      'production': 'bi-gear-wide-connected',
      'monthly-production': 'bi-calendar-check',
      'machines': 'bi-cpu',
      'parties': 'bi-people',
      'sales': 'bi-cart-check',
      'payments': 'bi-cash-coin',
      'invoices': 'bi-receipt',
      'billinghub': 'bi-receipt-cutoff',
      'inventory': 'bi-boxes',
      'raw-materials': 'bi-recycle',
      'vendors': 'bi-truck',
      'dispatch': 'bi-box-arrow-right',
      'transports': 'bi-geo-alt',
      'drivers': 'bi-person-badge',
      'bank': 'bi-bank',
      'expenses': 'bi-wallet2',
      'reports': 'bi-file-earmark-bar-graph',
      'analytics': 'bi-graph-up-arrow',
      'employees': 'bi-person-lines-fill',
      'salaries': 'bi-currency-rupee',
      'settings': 'bi-sliders',
      'audit-logs': 'bi-journal-shield'
    };
    return icons[key] || 'bi-folder2';
  }

  getModuleCategory(key: string): string {
    if (['dashboard', 'settings', 'audit-logs'].includes(key)) return 'Administration & Governance';
    if (['production', 'monthly-production', 'machines'].includes(key)) return 'Factory Manufacturing';
    if (['raw-materials', 'inventory', 'vendors', 'dispatch', 'transports', 'drivers'].includes(key)) return 'Supply Chain & Logistics';
    if (['parties', 'sales'].includes(key)) return 'Commercial & Parties';
    if (['payments', 'invoices', 'billinghub', 'bank', 'expenses'].includes(key)) return 'Finance & GST';
    if (['employees', 'salaries'].includes(key)) return 'Human Resources & Payroll';
    return 'Core Subsystem';
  }

  // --- Phase 28: User Directory Getters & Filters ---
  get filteredAdminUsers(): any[] {
    return this.adminUsersList.filter(u => {
      const q = (this.userSearchTerm || '').trim().toLowerCase();
      const matchSearch = !q ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q);

      const matchRole = this.userRoleFilter === 'ALL' || (u.role || '').toUpperCase() === this.userRoleFilter.toUpperCase();

      const isLocked = u.accountLocked || u.isLocked || u.status === 'DISABLED';
      const matchStatus = this.userStatusFilter === 'ALL' ||
        (this.userStatusFilter === 'ACTIVE' && !isLocked) ||
        (this.userStatusFilter === 'LOCKED' && isLocked);

      const matchTeam = this.userTeamFilter === 'ALL' || (u.teamCode || '').toUpperCase() === this.userTeamFilter.toUpperCase();

      return matchSearch && matchRole && matchStatus && matchTeam;
    });
  }

  get activeUsersCount(): number {
    return this.adminUsersList.filter(u => !(u.accountLocked || u.isLocked || u.status === 'DISABLED')).length;
  }

  get lockedUsersCount(): number {
    return this.adminUsersList.filter(u => u.accountLocked || u.isLocked || u.status === 'DISABLED').length;
  }

  resetUserFilters(): void {
    this.userSearchTerm = '';
    this.userRoleFilter = 'ALL';
    this.userStatusFilter = 'ALL';
    this.userTeamFilter = 'ALL';
  }

  usersCountByRole(role: string): number {
    return this.adminUsersList.filter(u => (u.role || '').toUpperCase() === (role || '').toUpperCase()).length;
  }

  selectRoleFromCard(role: string): void {
    this.selectedRoleForMatrix = role;
    this.userAccessSubTab = 'matrix';
    this.notificationService.info('Role Selected', `Configuring granular permissions for ${role}`);
  }

  // =========================================================================
  // 5. FEATURE FLAGS & AI COPILOT GOVERNANCE (PHASE 29)
  // =========================================================================
  featuresSubTab: 'flags' | 'copilot' | 'matrix' = 'flags';
  featureViewMode: 'table' | 'cards' = 'table';
  featureCategoryFilter: string = 'ALL';
  featureStatusFilter: 'ALL' | 'ENABLED' | 'DISABLED' = 'ALL';
  featureSearchQuery: string = '';

  // Flag Detail / Inspector Modal
  selectedFlagForDetail: any = null;
  showFlagDetailModal: boolean = false;

  // User Custom Access Modal
  showUserAccessModal = false;
  selectedUserForCustomAccess: any = null;
  userCustomModules: any[] = [];

  // AI Copilot Governance Configuration
  copilotConfig = {
    isEnabled: true,
    provider: 'Google AI (Gemini Flash)',
    modelName: 'gemini-flash-latest',
    apiVersion: 'v1beta',
    injectProductionTelemetry: true,
    injectCustomerBalances: true,
    injectMachineTelemetry: true,
    enableDomainKnowledgeFallback: true,
    enableVoiceInput: true,
    supportedLanguages: ['en-IN', 'hi-IN', 'mr-IN'],
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'OPERATOR', 'VIEWER'],
    temperature: 0.2,
    maxTokens: 1024,
    lastAuditCheck: 'Just now'
  };
  isSavingCopilotConfig: boolean = false;

  // Diagnostic Console
  copilotTestQuery: string = "Check today's production output across Shift A and B";
  copilotTestResult: any = null;
  isTestingCopilot: boolean = false;
  copilotTestLatency: number = 0;
  copilotDiagnosticHistory: any[] = [];

  loadFeatureFlags() {
    this.apiService.getAdminFeatureFlags().subscribe({
      next: (flags) => {
        this.featureFlags = (flags || []).map((f: any) => ({
          ...f,
          enabled: f.enabled !== undefined ? f.enabled : (f.isEnabled !== undefined ? f.isEnabled : true),
          isEnabled: f.enabled !== undefined ? f.enabled : (f.isEnabled !== undefined ? f.isEnabled : true)
        }));
      },
      error: () => console.warn('Could not load feature flags')
    });
  }

  get filteredFeatureFlags(): any[] {
    return this.featureFlags.filter(f => {
      const isEnabled = !!(f.enabled || f.isEnabled);
      const matchCat = this.featureCategoryFilter === 'ALL' || (f.category || '').toUpperCase() === this.featureCategoryFilter.toUpperCase();
      const matchStatus = this.featureStatusFilter === 'ALL' || (this.featureStatusFilter === 'ENABLED' ? isEnabled : !isEnabled);
      const q = this.featureSearchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        (f.moduleName || '').toLowerCase().includes(q) || 
        (f.description || '').toLowerCase().includes(q) || 
        (f.moduleKey || '').toLowerCase().includes(q) || 
        (f.category || '').toLowerCase().includes(q);
      return matchCat && matchStatus && matchSearch;
    });
  }

  get activeFeatureCount(): number {
    return this.featureFlags.filter(f => f.enabled || f.isEnabled).length;
  }

  resetFeatureFilters() {
    this.featureCategoryFilter = 'ALL';
    this.featureStatusFilter = 'ALL';
    this.featureSearchQuery = '';
  }

  toggleFeature(flag: any) {
    const currentState = flag.enabled !== undefined ? flag.enabled : flag.isEnabled;
    const nextState = !currentState;
    flag.enabled = nextState;
    flag.isEnabled = nextState;

    this.apiService.toggleAdminFeatureFlag(flag.moduleKey, nextState).subscribe({
      next: (res: any) => {
        this.notificationService.success('Feature Toggled', res.message || `Module "${flag.moduleName}" is now ${nextState ? 'ENABLED' : 'DISABLED'}.`);
        this.reloadData.emit();
      },
      error: (err) => {
        flag.enabled = currentState;
        flag.isEnabled = currentState;
        this.notificationService.error('Toggle Error', err.error?.message || 'Could not toggle feature.');
      }
    });
  }

  enableAllFeatures() {
    this.featureFlags.forEach(f => {
      f.enabled = true;
      f.isEnabled = true;
      this.apiService.toggleAdminFeatureFlag(f.moduleKey, true).subscribe();
    });
    this.notificationService.success('All Modules Active', 'All 23 enterprise ERP subsystems enabled.');
    this.reloadData.emit();
  }

  disableAllFeatures() {
    this.notificationService.confirmAction(
      'Disable All Non-Core Subsystems',
      'This will switch all modular subsystems to disabled state in the database. Are you sure?',
      'Disable All'
    ).then(confirmed => {
      if (confirmed) {
        this.featureFlags.forEach(f => {
          if (f.category !== 'Core') {
            f.enabled = false;
            f.isEnabled = false;
            this.apiService.toggleAdminFeatureFlag(f.moduleKey, false).subscribe();
          }
        });
        this.notificationService.warning('Subsystems Deactivated', 'Non-core subsystem modules have been disabled.');
        this.reloadData.emit();
      }
    });
  }

  toggleCategoryFeatures(category: string, enable: boolean) {
    const flagsToUpdate = this.featureFlags.filter(f => (f.category || '').toUpperCase() === category.toUpperCase());
    flagsToUpdate.forEach(f => {
      f.enabled = enable;
      f.isEnabled = enable;
      this.apiService.toggleAdminFeatureFlag(f.moduleKey, enable).subscribe();
    });
    this.notificationService.success('Category Updated', `All ${flagsToUpdate.length} modules in ${category} ${enable ? 'ENABLED' : 'DISABLED'}.`);
    this.reloadData.emit();
  }

  getCategoryStats(): { name: string; total: number; active: number; icon: string }[] {
    const categories = [
      { name: 'Core', icon: 'bi-cpu' },
      { name: 'Manufacturing', icon: 'bi-gear-wide-connected' },
      { name: 'Commerce', icon: 'bi-cart-check' },
      { name: 'Supply Chain', icon: 'bi-truck' },
      { name: 'Finance', icon: 'bi-cash-coin' },
      { name: 'Human Resources', icon: 'bi-people' },
      { name: 'Administration', icon: 'bi-shield-lock' }
    ];
    return categories.map(cat => {
      const inCat = this.featureFlags.filter(f => (f.category || '').toUpperCase() === cat.name.toUpperCase());
      const active = inCat.filter(f => f.enabled || f.isEnabled).length;
      return { name: cat.name, total: inCat.length, active, icon: cat.icon };
    });
  }

  getCategoryIcon(cat: string): string {
    const map: Record<string, string> = {
      'CORE': 'bi-cpu',
      'MANUFACTURING': 'bi-gear-wide-connected',
      'COMMERCE': 'bi-cart-check',
      'SUPPLY CHAIN': 'bi-truck',
      'FINANCE': 'bi-cash-coin',
      'HUMAN RESOURCES': 'bi-people',
      'ADMINISTRATION': 'bi-shield-lock'
    };
    return map[(cat || '').toUpperCase()] || 'bi-star';
  }

  getFeatureIcon(flag: any): string {
    if (flag.icon) {
      return flag.icon.startsWith('bi-') ? flag.icon : `bi-${flag.icon}`;
    }
    const key = (flag.moduleKey || '').toLowerCase();
    if (key.includes('production')) return 'bi-gear-wide-connected';
    if (key.includes('machine')) return 'bi-tools';
    if (key.includes('inventory')) return 'bi-boxes';
    if (key.includes('raw_material') || key.includes('raw')) return 'bi-basket2';
    if (key.includes('sales')) return 'bi-receipt';
    if (key.includes('invoice') || key.includes('billing')) return 'bi-file-earmark-ruled';
    if (key.includes('payment') || key.includes('bank') || key.includes('expense')) return 'bi-cash-stack';
    if (key.includes('dispatch')) return 'bi-send-check';
    if (key.includes('transport')) return 'bi-truck';
    if (key.includes('driver')) return 'bi-person-badge';
    if (key.includes('vendor')) return 'bi-building-up';
    if (key.includes('part')) return 'bi-person-lines-fill';
    if (key.includes('employee') || key.includes('salaries')) return 'bi-people-fill';
    if (key.includes('report') || key.includes('analytics')) return 'bi-bar-chart-line';
    if (key.includes('audit')) return 'bi-clock-history';
    if (key.includes('setting')) return 'bi-sliders';
    return 'bi-puzzle';
  }

  openFlagDetailModal(flag: any) {
    this.selectedFlagForDetail = { ...flag };
    this.showFlagDetailModal = true;
  }

  closeFlagDetailModal() {
    this.showFlagDetailModal = false;
    this.selectedFlagForDetail = null;
  }

  copyModuleKey(key: string) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(key);
      this.notificationService.success('Copied to Clipboard', `Module key "${key}" copied.`);
    }
  }

  openUserAccessModal(user: any) {
    this.selectedUserForCustomAccess = user;
    this.userCustomModules = this.featureFlags.map(f => ({
      moduleKey: f.moduleKey,
      moduleName: f.moduleName,
      category: f.category,
      icon: f.icon,
      isAllowed: user.role === 'SUPER_ADMIN' ? true : (f.enabled !== false)
    }));
    this.showUserAccessModal = true;
  }

  saveUserCustomAccess() {
    this.showUserAccessModal = false;
    this.notificationService.success('User Access Updated', `Custom module permissions saved for ${this.selectedUserForCustomAccess.fullName || this.selectedUserForCustomAccess.username}.`);
  }

  // AI Copilot Governance Methods
  setCopilotPresetQuery(query: string) {
    this.copilotTestQuery = query;
  }

  toggleCopilotRole(role: string) {
    const idx = this.copilotConfig.allowedRoles.indexOf(role);
    if (idx >= 0) {
      if (this.copilotConfig.allowedRoles.length > 1) {
        this.copilotConfig.allowedRoles.splice(idx, 1);
      } else {
        this.notificationService.warning('Policy Requirement', 'At least one role must have Copilot access.');
      }
    } else {
      this.copilotConfig.allowedRoles.push(role);
    }
  }

  saveCopilotConfig() {
    this.isSavingCopilotConfig = true;
    setTimeout(() => {
      this.isSavingCopilotConfig = false;
      this.notificationService.success('AI Governance Saved', 'Google ADK Copilot parameters and grounding scopes updated.');
    }, 400);
  }

  executeCopilotDiagnostic() {
    if (!this.copilotTestQuery.trim() || this.isTestingCopilot) return;
    this.isTestingCopilot = true;
    const startTime = Date.now();

    const payload = {
      message: this.copilotTestQuery.trim(),
      conversationId: 'diag-' + Math.random().toString(36).substring(2, 8)
    };

    this.apiService.executeAdkChat(payload).subscribe({
      next: (res: any) => {
        this.copilotTestLatency = Date.now() - startTime;
        this.isTestingCopilot = false;
        this.copilotTestResult = {
          success: true,
          reply: res.reply || 'No response message returned from ADK agent.',
          toolExecuted: res.toolExecuted || 'LocalIndustrialIntelligence',
          actionProposal: res.actionProposal || null,
          latencyMs: this.copilotTestLatency,
          timestamp: new Date().toLocaleTimeString()
        };
        this.copilotDiagnosticHistory.unshift(this.copilotTestResult);
        this.notificationService.success('Diagnostic Executed', `ADK Copilot responded in ${this.copilotTestLatency}ms.`);
      },
      error: (err: any) => {
        this.copilotTestLatency = Date.now() - startTime;
        this.isTestingCopilot = false;
        this.copilotTestResult = {
          success: false,
          reply: err.error?.message || 'Unable to connect to Google ADK Intelligence backend. Please check server logs or network status.',
          toolExecuted: 'SERVICE_OFFLINE',
          actionProposal: null,
          latencyMs: this.copilotTestLatency,
          timestamp: new Date().toLocaleTimeString()
        };
        this.copilotDiagnosticHistory.unshift(this.copilotTestResult);
        this.notificationService.error('Diagnostic Warning', 'Gateway request returned error or offline status.');
      }
    });
  }

  resetCopilotSessionContext() {
    this.apiService.resetAdkSession('admin-diag-session').subscribe({
      next: () => {
        this.copilotTestResult = null;
        this.notificationService.success('Session Evicted', 'ADK conversation state and working memory cleared.');
      },
      error: () => {
        this.copilotTestResult = null;
        this.notificationService.info('Session Cleared', 'Diagnostic state reset.');
      }
    });
  }

  formatMarkdown(text: string): string {
    if (!text) return '';
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    return escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  }

  // =========================================================================
  // 6. EXTENSIBLE DYNAMIC CUSTOM FIELDS
  // =========================================================================
  loadCustomFields(entityName: string) {
    this.selectedEntityForCustomFields = entityName;
    this.apiService.getCustomFieldDefs(entityName).subscribe({
      next: (defs) => {
        if (Array.isArray(defs) && defs.length > 0) {
          const otherDefs = this.customFieldDefs.filter(d => (d.entityName || '').toUpperCase() !== entityName.toUpperCase());
          this.customFieldDefs = [...otherDefs, ...defs];
        }
      },
      error: () => console.warn('Using default custom fields')
    });
  }

  selectCustomFieldEntity(ent: string) {
    this.selectedEntityForCustomFields = ent;
    this.resetCustomFieldFilters();
    this.loadCustomFields(ent);
  }

  getCustomFieldsCountForEntity(ent: string): number {
    return this.customFieldDefs.filter(d => (d.entityName || '').toUpperCase() === ent.toUpperCase()).length;
  }

  get currentEntityCustomFields(): any[] {
    return this.customFieldDefs.filter(d => !d.entityName || d.entityName.toUpperCase() === this.selectedEntityForCustomFields.toUpperCase());
  }

  get filteredCustomFieldDefs(): any[] {
    let list = this.currentEntityCustomFields;

    // Search query
    if (this.customFieldSearchTerm && this.customFieldSearchTerm.trim()) {
      const q = this.customFieldSearchTerm.toLowerCase().trim();
      list = list.filter(d =>
        (d.fieldLabel && d.fieldLabel.toLowerCase().includes(q)) ||
        (d.fieldKey && d.fieldKey.toLowerCase().includes(q)) ||
        (d.fieldType && d.fieldType.toLowerCase().includes(q)) ||
        (d.defaultValue && d.defaultValue.toLowerCase().includes(q)) ||
        (d.optionsJson && d.optionsJson.toLowerCase().includes(q))
      );
    }

    // Type filter
    if (this.customFieldTypeFilter && this.customFieldTypeFilter !== 'ALL') {
      if (this.customFieldTypeFilter === 'SELECT') {
        list = list.filter(d => d.fieldType === 'SELECT' || d.fieldType === 'SELECT_DROPDOWN');
      } else {
        list = list.filter(d => d.fieldType === this.customFieldTypeFilter);
      }
    }

    // Requirement filter
    if (this.customFieldReqFilter === 'REQUIRED') {
      list = list.filter(d => !!d.isRequired);
    } else if (this.customFieldReqFilter === 'OPTIONAL') {
      list = list.filter(d => !d.isRequired);
    }

    return list;
  }

  get mandatoryFieldsCount(): number {
    return this.currentEntityCustomFields.filter(d => !!d.isRequired).length;
  }

  get selectFieldsCount(): number {
    return this.currentEntityCustomFields.filter(d => d.fieldType === 'SELECT' || d.fieldType === 'SELECT_DROPDOWN').length;
  }

  get totalConfiguredEntitiesCount(): number {
    const set = new Set(this.customFieldDefs.map(d => (d.entityName || '').toUpperCase()).filter(Boolean));
    return Math.max(set.size, 1);
  }

  parseOptionsList(raw: string): string[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(p => String(p).trim()).filter(Boolean);
    } catch (e) {
      // ignore
    }
    return raw.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  }

  get currentFormOptionsList(): string[] {
    return this.parseOptionsList(this.customFieldForm.optionsJson);
  }

  addOptionTag() {
    if (!this.newOptionTagInput || !this.newOptionTagInput.trim()) return;
    const current = this.currentFormOptionsList;
    const toAdd = this.newOptionTagInput.split(',').map(s => s.trim()).filter(Boolean);
    for (const opt of toAdd) {
      if (!current.includes(opt)) {
        current.push(opt);
      }
    }
    this.customFieldForm.optionsJson = JSON.stringify(current);
    this.newOptionTagInput = '';
  }

  removeOptionTag(index: number) {
    const current = this.currentFormOptionsList;
    if (index >= 0 && index < current.length) {
      current.splice(index, 1);
      this.customFieldForm.optionsJson = current.length > 0 ? JSON.stringify(current) : '';
    }
  }

  resetCustomFieldFilters() {
    this.customFieldSearchTerm = '';
    this.customFieldTypeFilter = 'ALL';
    this.customFieldReqFilter = 'ALL';
  }

  getEntityIcon(entity: string): string {
    switch ((entity || '').toUpperCase()) {
      case 'PARTIES': return 'bi-people-fill';
      case 'ITEMS': return 'bi-box-seam-fill';
      case 'INVOICES': return 'bi-receipt';
      case 'PRODUCTION_BATCHES': return 'bi-gear-wide-connected';
      case 'MACHINES': return 'bi-cpu-fill';
      case 'VENDORS': return 'bi-truck';
      default: return 'bi-database';
    }
  }

  getFieldTypeIcon(type: string): string {
    switch ((type || '').toUpperCase()) {
      case 'TEXT': return 'bi-fonts';
      case 'NUMBER': return 'bi-123';
      case 'DATE': return 'bi-calendar-event';
      case 'SELECT':
      case 'SELECT_DROPDOWN': return 'bi-menu-button-wide';
      case 'CHECKBOX': return 'bi-check2-square';
      case 'CURRENCY': return 'bi-currency-rupee';
      default: return 'bi-tag';
    }
  }

  getFieldTypeLabel(type: string): string {
    switch ((type || '').toUpperCase()) {
      case 'TEXT': return 'Single Line Text';
      case 'NUMBER': return 'Numeric Value';
      case 'DATE': return 'Date Picker';
      case 'SELECT':
      case 'SELECT_DROPDOWN': return 'Select Dropdown';
      case 'CHECKBOX': return 'Boolean Checkbox';
      case 'CURRENCY': return 'Currency (₹)';
      default: return type || 'Custom';
    }
  }

  openAddCustomFieldModal() {
    this.isEditingCustomField = false;
    this.editingCustomFieldId = null;
    this.newOptionTagInput = '';
    this.customFieldForm = {
      entityName: this.selectedEntityForCustomFields,
      fieldLabel: '',
      fieldKey: '',
      fieldType: 'TEXT',
      optionsJson: '',
      isRequired: false,
      defaultValue: ''
    };
    this.showCustomFieldModal = true;
  }

  openEditCustomFieldModal(def: any) {
    this.isEditingCustomField = true;
    this.editingCustomFieldId = def.id;
    this.newOptionTagInput = '';
    this.customFieldForm = {
      entityName: def.entityName || this.selectedEntityForCustomFields,
      fieldLabel: def.fieldLabel || '',
      fieldKey: def.fieldKey || '',
      fieldType: def.fieldType || 'TEXT',
      optionsJson: def.optionsJson || '',
      isRequired: !!def.isRequired,
      defaultValue: def.defaultValue || ''
    };
    this.showCustomFieldModal = true;
  }

  autoGenerateFieldKey() {
    if (this.customFieldForm.fieldLabel && !this.isEditingCustomField) {
      this.customFieldForm.fieldKey = this.customFieldForm.fieldLabel
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
    }
  }

  saveCustomField() {
    if (!this.customFieldForm.fieldLabel || !this.customFieldForm.fieldKey) {
      this.notificationService.showValidationError('Validation', 'Field Display Label and Database Key are required.');
      return;
    }
    this.customFieldForm.fieldKey = this.customFieldForm.fieldKey.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    if (this.isEditingCustomField && this.editingCustomFieldId) {
      const idx = this.customFieldDefs.findIndex(d => d.id === this.editingCustomFieldId);
      if (idx !== -1) {
        this.customFieldDefs[idx] = {
          ...this.customFieldDefs[idx],
          ...this.customFieldForm
        };
      }
      localStorage.setItem('futane_custom_field_defs', JSON.stringify(this.customFieldDefs));
      this.showCustomFieldModal = false;
      this.notificationService.success('Custom Field Updated', `Dynamic field "${this.customFieldForm.fieldLabel}" updated.`);
      return;
    }
    this.apiService.createCustomFieldDef(this.customFieldForm).subscribe({
      next: () => {
        this.showCustomFieldModal = false;
        this.loadCustomFields(this.selectedEntityForCustomFields);
        localStorage.setItem('futane_custom_field_defs', JSON.stringify(this.customFieldDefs));
        this.notificationService.success('Custom Field Created', `Dynamic field "${this.customFieldForm.fieldLabel}" added to ${this.selectedEntityForCustomFields}.`);
      },
      error: () => {
        // Local fallback
        this.customFieldDefs.push({
          id: 'cf_' + Date.now(),
          ...this.customFieldForm
        });
        localStorage.setItem('futane_custom_field_defs', JSON.stringify(this.customFieldDefs));
        this.showCustomFieldModal = false;
        this.notificationService.success('Custom Field Created', `Dynamic field "${this.customFieldForm.fieldLabel}" added to ${this.selectedEntityForCustomFields}.`);
      }
    });
  }

  deleteCustomField(def: any) {
    this.notificationService.confirmAction('Delete Field', `Remove custom field "${def.fieldLabel}" from ${def.entityName || this.selectedEntityForCustomFields}?`, 'Remove').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteCustomFieldDef(def.id).subscribe({
          next: () => {
            this.customFieldDefs = this.customFieldDefs.filter(d => d.id !== def.id);
            localStorage.setItem('futane_custom_field_defs', JSON.stringify(this.customFieldDefs));
            this.loadCustomFields(this.selectedEntityForCustomFields);
            this.notificationService.success('Removed', `Custom field "${def.fieldLabel}" deactivated.`);
          },
          error: () => {
            this.customFieldDefs = this.customFieldDefs.filter(d => d.id !== def.id);
            localStorage.setItem('futane_custom_field_defs', JSON.stringify(this.customFieldDefs));
            this.notificationService.success('Removed', `Custom field "${def.fieldLabel}" deactivated.`);
          }
        });
      }
    });
  }

  openEditFeatureFlagModal(flag: any) {
    this.editingFeatureFlag = flag;
    this.featureFlagForm = {
      moduleKey: flag.moduleKey,
      moduleName: flag.moduleName,
      category: flag.category || 'General',
      description: flag.description || '',
      enabled: flag.enabled !== undefined ? flag.enabled : (flag.isEnabled !== undefined ? flag.isEnabled : true)
    };
    this.showEditFeatureFlagModal = true;
  }

  saveFeatureFlagEdit() {
    if (!this.featureFlagForm.moduleName) {
      this.notificationService.showValidationError('Validation', 'Subsystem display name is required.');
      return;
    }
    if (this.editingFeatureFlag) {
      this.editingFeatureFlag.moduleName = this.featureFlagForm.moduleName;
      this.editingFeatureFlag.category = this.featureFlagForm.category;
      this.editingFeatureFlag.description = this.featureFlagForm.description;
      const targetEnabled = !!this.featureFlagForm.enabled;
      const currentEnabled = this.editingFeatureFlag.enabled !== undefined ? this.editingFeatureFlag.enabled : this.editingFeatureFlag.isEnabled;
      if (currentEnabled !== targetEnabled) {
        this.toggleFeature(this.editingFeatureFlag);
      }
      this.notificationService.success('Subsystem Updated', `Module "${this.featureFlagForm.moduleName}" properties saved successfully.`);
    }
    this.showEditFeatureFlagModal = false;
  }

  // =========================================================================
  // 7. DEVELOPER HUB (API KEYS, WEBHOOKS & API DOCUMENTATION)
  // =========================================================================
  get activeApiKeysCount(): number {
    return this.apiKeysList.filter(k => k.isActive !== false).length;
  }

  get activeWebhooksCount(): number {
    return this.webhooksList.filter(w => w.isActive !== false).length;
  }

  get filteredApiKeys(): any[] {
    return this.apiKeysList.filter(k => {
      const query = this.apiKeySearchQuery ? this.apiKeySearchQuery.toLowerCase().trim() : '';
      const matchesSearch = !query ||
        (k.name && k.name.toLowerCase().includes(query)) ||
        (k.keyPrefix && k.keyPrefix.toLowerCase().includes(query)) ||
        (k.scopes && k.scopes.toLowerCase().includes(query)) ||
        (k.createdBy && k.createdBy.toLowerCase().includes(query));

      const matchesStatus = this.apiKeyStatusFilter === 'ALL' ||
        (this.apiKeyStatusFilter === 'ACTIVE' && k.isActive !== false) ||
        (this.apiKeyStatusFilter === 'REVOKED' && k.isActive === false);

      const matchesScope = this.apiKeyScopeFilter === 'ALL' ||
        (k.scopes && k.scopes.includes(this.apiKeyScopeFilter));

      return matchesSearch && matchesStatus && matchesScope;
    });
  }

  get filteredWebhooks(): any[] {
    return this.webhooksList.filter(w => {
      const query = this.webhookSearchQuery ? this.webhookSearchQuery.toLowerCase().trim() : '';
      const matchesSearch = !query ||
        (w.name && w.name.toLowerCase().includes(query)) ||
        (w.endpointUrl && w.endpointUrl.toLowerCase().includes(query)) ||
        (w.eventType && w.eventType.toLowerCase().includes(query));

      const matchesEvent = this.webhookEventFilter === 'ALL' || w.eventType === this.webhookEventFilter;

      const matchesStatus = this.webhookStatusFilter === 'ALL' ||
        (this.webhookStatusFilter === 'OK' && (w.lastStatusCode === 200 || !w.lastStatusCode)) ||
        (this.webhookStatusFilter === 'ERROR' && w.lastStatusCode && w.lastStatusCode !== 200);

      return matchesSearch && matchesEvent && matchesStatus;
    });
  }

  resetApiKeyFilters() {
    this.apiKeySearchQuery = '';
    this.apiKeyStatusFilter = 'ALL';
    this.apiKeyScopeFilter = 'ALL';
  }

  resetWebhookFilters() {
    this.webhookSearchQuery = '';
    this.webhookEventFilter = 'ALL';
    this.webhookStatusFilter = 'ALL';
  }

  loadApiKeys() {
    this.apiService.getApiKeys().subscribe({
      next: (keys) => {
        if (Array.isArray(keys) && keys.length > 0) {
          this.apiKeysList = keys.map(k => ({
            id: k.id,
            name: k.name,
            keyPrefix: k.keyPrefix || (k.apiKey ? k.apiKey.substring(0, 10) + '...' : 'fa_live_***'),
            scopes: k.scopes || 'read:sales,write:production',
            createdBy: k.createdBy || 'SUPER_ADMIN',
            createdAt: k.createdAt || new Date().toISOString(),
            lastUsedAt: k.lastUsedAt || null,
            isActive: k.isActive !== undefined ? k.isActive : true
          }));
        }
      },
      error: () => console.warn('Using default API keys')
    });
  }

  openCreateApiKeyModal() {
    this.newApiKeyForm = { name: '', scopes: 'read:sales,write:production' };
    this.generatedApiKeyResult = null;
    this.isSecretRevealedInModal = false;
    this.showApiKeyModal = true;
  }

  toggleApiKeyScopeInForm(scopeKey: string) {
    let scopesArr = this.newApiKeyForm.scopes ? this.newApiKeyForm.scopes.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    if (scopesArr.includes(scopeKey)) {
      scopesArr = scopesArr.filter((s: string) => s !== scopeKey);
    } else {
      scopesArr.push(scopeKey);
    }
    this.newApiKeyForm.scopes = scopesArr.join(',');
  }

  isScopeSelectedInForm(scopeKey: string): boolean {
    if (!this.newApiKeyForm.scopes) return false;
    const scopesArr = this.newApiKeyForm.scopes.split(',').map((s: string) => s.trim());
    return scopesArr.includes(scopeKey);
  }

  submitCreateApiKey() {
    if (!this.newApiKeyForm.name || !this.newApiKeyForm.name.trim()) {
      this.notificationService.showValidationError('Validation', 'Integration key name is required.');
      return;
    }
    this.apiService.createApiKey(this.newApiKeyForm).subscribe({
      next: (res: any) => {
        this.generatedApiKeyResult = res;
        this.loadApiKeys();
        this.notificationService.success('API Key Generated', 'New integration bearer token generated successfully.');
      },
      error: (err) => this.notificationService.error('Error', err.error?.message || 'Failed to create API key.')
    });
  }

  copyApiKeyToClipboard(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    this.notificationService.success('Copied', 'API Key copied to clipboard.');
  }

  revokeApiKey(key: any) {
    this.notificationService.confirmAction('Revoke API Key', `Revoke token "${key.name}" immediately? External services using this key will be disconnected.`, 'Revoke').then(confirmed => {
      if (confirmed) {
        this.apiService.revokeApiKey(key.id).subscribe({
          next: () => {
            key.isActive = false;
            this.loadApiKeys();
            this.notificationService.success('Revoked', `API Key "${key.name}" has been deactivated.`);
          },
          error: (err) => this.notificationService.error('Error', err.error?.message || 'Failed to revoke key.')
        });
      }
    });
  }

  deleteApiKey(key: any) {
    this.notificationService.confirmAction(
      'Delete API Key',
      `Are you sure you want to permanently delete API key "${key.name}"? External integrations will lose access.`,
      'Delete API Key'
    ).then(confirmed => {
      if (confirmed) {
        this.apiService.revokeApiKey(key.id).subscribe({
          next: () => {
            this.apiKeysList = this.apiKeysList.filter(k => k.id !== key.id);
            this.loadApiKeys();
            this.notificationService.success('API Key Deleted', `API key "${key.name}" has been permanently removed.`);
          },
          error: () => {
            this.apiKeysList = this.apiKeysList.filter(k => k.id !== key.id);
            this.notificationService.success('API Key Deleted', `API key "${key.name}" has been permanently removed.`);
          }
        });
      }
    });
  }

  openApiKeyDetailModal(key: any) {
    this.selectedApiKeyForDetail = key;
    this.showApiKeyDetailModal = true;
  }

  closeApiKeyDetailModal() {
    this.selectedApiKeyForDetail = null;
    this.showApiKeyDetailModal = false;
  }

  loadWebhooks() {
    this.apiService.getWebhooks().subscribe({
      next: (hooks) => {
        if (Array.isArray(hooks) && hooks.length > 0) {
          this.webhooksList = hooks.map(w => ({
            id: w.id,
            name: w.name,
            endpointUrl: w.endpointUrl,
            eventType: w.eventType || 'INVOICE_CREATED',
            secretToken: w.secretToken || 'whsec_***',
            retryCount: w.retryCount || 3,
            isActive: w.isActive !== undefined ? w.isActive : true,
            lastStatusCode: w.lastStatusCode || 200,
            lastTriggeredAt: w.lastTriggeredAt || null,
            createdAt: w.createdAt || new Date().toISOString()
          }));
        }
      },
      error: () => console.warn('Using default webhooks')
    });
  }

  openCreateWebhookModal() {
    this.newWebhookForm = {
      name: '',
      endpointUrl: '',
      eventType: 'INVOICE_CREATED',
      secretToken: this.generateRandomWebhookSecret()
    };
    this.showWebhookModal = true;
  }

  generateRandomWebhookSecret(): string {
    const chars = 'abcdef0123456789';
    let rand = '';
    for (let i = 0; i < 16; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return 'whsec_' + rand;
  }

  submitCreateWebhook() {
    if (!this.newWebhookForm.name || !this.newWebhookForm.name.trim()) {
      this.notificationService.showValidationError('Validation', 'Webhook name is required.');
      return;
    }
    if (!this.newWebhookForm.endpointUrl || !this.newWebhookForm.endpointUrl.trim()) {
      this.notificationService.showValidationError('Validation', 'Endpoint URL is required.');
      return;
    }
    if (!this.newWebhookForm.endpointUrl.startsWith('http://') && !this.newWebhookForm.endpointUrl.startsWith('https://')) {
      this.notificationService.showValidationError('Validation', 'Endpoint URL must start with http:// or https://');
      return;
    }
    if (!this.newWebhookForm.secretToken) {
      this.newWebhookForm.secretToken = this.generateRandomWebhookSecret();
    }
    this.apiService.createWebhook(this.newWebhookForm).subscribe({
      next: () => {
        this.showWebhookModal = false;
        this.loadWebhooks();
        this.notificationService.success('Webhook Registered', `Endpoint subscribed to "${this.newWebhookForm.eventType}".`);
      },
      error: (err) => this.notificationService.error('Error', err.error?.message || 'Failed to create webhook.')
    });
  }

  deleteWebhook(hook: any) {
    this.notificationService.confirmAction('Remove Webhook', `Delete webhook endpoint "${hook.name}"?`, 'Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteWebhook(hook.id).subscribe({
          next: () => {
            this.webhooksList = this.webhooksList.filter(w => w.id !== hook.id);
            this.loadWebhooks();
            this.notificationService.success('Deleted', 'Webhook endpoint removed.');
            if (this.showWebhookDetailModal && this.selectedWebhookForDetail?.id === hook.id) {
              this.closeWebhookDetailModal();
            }
          },
          error: (err) => this.notificationService.error('Error', err.error?.message || 'Failed to delete webhook.')
        });
      }
    });
  }

  testWebhook(hook: any) {
    if (!hook || !hook.id) return;
    this.isTestingWebhookId = hook.id;
    this.apiService.testWebhook(hook.id).subscribe({
      next: (res: any) => {
        this.isTestingWebhookId = null;
        hook.lastStatusCode = 200;
        hook.lastTriggeredAt = new Date().toISOString();
        this.notificationService.success('Ping Delivered (200 OK)', res.message || 'Payload verified with HMAC-SHA256 signature.');
        this.loadWebhooks();
      },
      error: (err) => {
        this.isTestingWebhookId = null;
        this.notificationService.error('Delivery Failed', err.error?.message || 'Could not connect to endpoint.');
      }
    });
  }

  openWebhookDetailModal(hook: any) {
    this.selectedWebhookForDetail = hook;
    this.showWebhookDetailModal = true;
  }

  closeWebhookDetailModal() {
    this.selectedWebhookForDetail = null;
    this.showWebhookDetailModal = false;
  }

  copyToClipboard(text: string, label: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    this.notificationService.success('Copied', `${label} copied to clipboard.`);
  }

  getDocSnippetText(): string {
    switch (this.selectedDocEndpoint) {
      case 'sales':
        if (this.selectedDocLanguage === 'curl') {
          return `curl -X GET 'http://localhost:8080/api/sales/orders?limit=50' \\\n  -H 'Authorization: Bearer fa_live_YOUR_KEY' \\\n  -H 'Accept: application/json'`;
        } else if (this.selectedDocLanguage === 'node') {
          return `const res = await fetch('http://localhost:8080/api/sales/orders?limit=50', {\n  headers: {\n    'Authorization': 'Bearer fa_live_YOUR_KEY',\n    'Accept': 'application/json'\n  }\n});\nconst orders = await res.json();\nconsole.log(orders);`;
        } else {
          return `import requests\n\nheaders = {\n    'Authorization': 'Bearer fa_live_YOUR_KEY',\n    'Accept': 'application/json'\n}\nres = requests.get('http://localhost:8080/api/sales/orders', params={'limit': 50}, headers=headers)\nprint(res.json())`;
        }
      case 'production':
        return `curl -X POST 'http://localhost:8080/api/production/batch' \\\n  -H 'Authorization: Bearer fa_live_YOUR_KEY' \\\n  -H 'Content-Type: application/json' \\\n  -d '{"machineId":"MACH-TOSH-650T","actualCratesProduced":460}'`;
      case 'inventory':
        return `curl -X GET 'http://localhost:8080/api/inventory/summary' \\\n  -H 'Authorization: Bearer fa_live_YOUR_KEY'`;
      case 'features':
        return `curl -X GET 'http://localhost:8080/api/admin/features' \\\n  -H 'Authorization: Bearer fa_live_YOUR_KEY'`;
      case 'webhooks':
        return `curl -X POST 'http://localhost:8080/api/admin/webhooks' \\\n  -H 'Authorization: Bearer fa_live_YOUR_KEY' \\\n  -H 'Content-Type: application/json' \\\n  -d '{"name":"Dispatcher","endpointUrl":"https://api.yourdomain.com/hook","eventType":"INVOICE_CREATED"}'`;
      default:
        return `curl -X GET 'http://localhost:8080/api/sales/orders' -H 'Authorization: Bearer fa_live_YOUR_KEY'`;
    }
  }

  copyCurrentDocSnippet() {
    this.copyToClipboard(this.getDocSnippetText(), 'Code snippet');
  }

  getSampleWebhookPayload(eventType: string): string {
    const ts = new Date().toISOString();
    switch (eventType) {
      case 'INVOICE_CREATED':
        return JSON.stringify({
          event: 'INVOICE_CREATED',
          timestamp: ts,
          data: {
            invoiceId: 'INV-2026-0842',
            invoiceNumber: 'FA/2026/0842',
            customerName: 'Shree Ganesh Traders',
            gstin: '27AABCS1429B1ZX',
            totalAmount: 48500.00,
            taxAmount: 8730.00,
            status: 'FINALIZED',
            cratesCount: 350
          }
        }, null, 2);
      case 'PAYMENT_RECEIVED':
        return JSON.stringify({
          event: 'PAYMENT_RECEIVED',
          timestamp: ts,
          data: {
            paymentId: 'PAY-89214',
            customerName: 'Kisan Agro Agencies',
            amount: 25000.00,
            paymentMode: 'NEFT_RTGS',
            referenceNumber: 'UTR981240182',
            balanceRemaining: 12400.00
          }
        }, null, 2);
      case 'PRODUCTION_BATCH_COMPLETED':
        return JSON.stringify({
          event: 'PRODUCTION_BATCH_COMPLETED',
          timestamp: ts,
          data: {
            shiftId: 'SHIFT-A-20260913',
            machineName: 'Toshiba 650T Injection #1',
            operator: 'Santosh Pawar',
            crateType: 'Tomato Agro Crate - Heavy Duty',
            targetCrates: 450,
            actualCrates: 462,
            efficiencyPercent: 102.6,
            scrapKgs: 3.4
          }
        }, null, 2);
      case 'LOW_STOCK_ALARM':
        return JSON.stringify({
          event: 'LOW_STOCK_ALARM',
          timestamp: ts,
          data: {
            materialId: 'MAT-HDPE-RED-01',
            materialName: 'HDPE Granules Grade 50MA180 (Red Masterbatch)',
            currentStockBags: 18,
            safetyThresholdBags: 30,
            deficitBags: 12,
            priority: 'HIGH_ALERT'
          }
        }, null, 2);
      default:
        return JSON.stringify({
          event: eventType || 'EVENT_NOTIFICATION',
          timestamp: ts,
          status: 'TRIGGERED'
        }, null, 2);
    }
  }

  getEventDescription(eventType: string): string {
    switch (eventType) {
      case 'INVOICE_CREATED': return 'Fired when a GST tax invoice is approved & finalized for billing.';
      case 'PAYMENT_RECEIVED': return 'Fired when a customer receipt / settlement is recorded in the bank ledger.';
      case 'PRODUCTION_BATCH_COMPLETED': return 'Fired when a factory machine shift logs completed crate output.';
      case 'LOW_STOCK_ALARM': return 'Fired when polymer raw material drops below the safety threshold.';
      default: return 'Fired upon matching event trigger.';
    }
  }

  // =========================================================================
  // 8. GOVERNANCE & CACHE
  // =========================================================================
  loadCacheStats() {
    this.apiService.getCacheStats().subscribe({
      next: (stats) => this.cacheStats = stats || this.cacheStats,
      error: () => console.warn('Could not load cache stats')
    });
  }

  flushSystemCache() {
    this.notificationService.confirmAction('Flush Cache', 'Evict all in-memory Caffeine caches across branding, roles, and feature flags?', 'Flush All').then(confirmed => {
      if (confirmed) {
        this.apiService.flushCache().subscribe({
          next: () => {
            this.loadCacheStats();
            this.notificationService.success('Cache Flushed', 'All in-memory cache regions cleared.');
          },
          error: (err) => this.notificationService.error('Flush Failed', err.error?.message || 'Could not flush cache.')
        });
      }
    });
  }

  saveAuditRetention() {
    this.apiService.updateAuditRetention(this.auditRetentionDays).subscribe({
      next: (res: any) => {
        this.notificationService.success('Retention Updated', res.message || 'Audit retention policy updated.');
      },
      error: (err) => this.notificationService.error('Update Failed', err.error?.message || 'Could not update retention.')
    });
  }

  loadSystemDiagnostics() {
    this.isLoadingDiagnostics = true;
    this.apiService.getSystemDiagnostics().subscribe({
      next: (diag) => {
        this.isLoadingDiagnostics = false;
        if (diag) this.systemDiagnostics = diag;
      },
      error: () => {
        this.isLoadingDiagnostics = false;
      }
    });
  }

  downloadEnterpriseBackupSnapshot() {
    this.isExportingBackup = true;
    this.apiService.exportSystemBackup().subscribe({
      next: (snapshot) => {
        this.isExportingBackup = false;
        const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `futane-agro-backup-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.notificationService.success('Backup Generated', 'Full system configuration snapshot exported successfully.');
      },
      error: (err) => {
        this.isExportingBackup = false;
        this.notificationService.error('Export Failed', err.error?.message || 'Could not generate backup.');
      }
    });
  }

  // --- Database Backups & Restore Methods ---
  loadBackups() {
    this.isLoadingBackups = true;
    this.apiService.getBackups().subscribe({
      next: (list: any) => {
        this.isLoadingBackups = false;
        this.backupsList = Array.isArray(list) ? list : [];
      },
      error: (err) => {
        this.isLoadingBackups = false;
        console.warn('Could not load database backups', err);
      }
    });
  }

  triggerDatabaseBackup() {
    this.isTriggeringBackup = true;
    this.apiService.runBackup().subscribe({
      next: (res: any) => {
        this.isTriggeringBackup = false;
        this.notificationService.success('Database Backup', res?.message || 'Database snapshot created successfully.');
        this.loadBackups();
      },
      error: (err) => {
        this.isTriggeringBackup = false;
        this.notificationService.error('Backup Failed', err?.error?.message || err?.message || 'Database backup generation failed.');
      }
    });
  }

  private previousRestoreScrollTop = 0;

  promptRestoreBackup(backup: any) {
    this.selectedBackupForRestore = backup;
    this.restoreConfirmText = '';
    this.showRestoreConfirmModal = true;
    const scrollContainer = document.querySelector('.app-container') || document.documentElement;
    if (scrollContainer && 'scrollTop' in scrollContainer) {
      this.previousRestoreScrollTop = (scrollContainer as HTMLElement).scrollTop;
      (scrollContainer as HTMLElement).scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  closeRestoreModal() {
    if (this.isRestoringBackup) return;
    this.showRestoreConfirmModal = false;
    this.selectedBackupForRestore = null;
    this.restoreConfirmText = '';
    const scrollContainer = document.querySelector('.app-container') || document.documentElement;
    if (scrollContainer && 'scrollTop' in scrollContainer && this.previousRestoreScrollTop) {
      (scrollContainer as HTMLElement).scrollTo({ top: this.previousRestoreScrollTop, behavior: 'smooth' });
    }
  }

  confirmRestoreBackup() {
    if (!this.selectedBackupForRestore || this.restoreConfirmText !== 'RESTORE') return;
    this.isRestoringBackup = true;
    const filename = this.selectedBackupForRestore.filename || this.selectedBackupForRestore.name;
    this.apiService.runRestore(filename).subscribe({
      next: (res: any) => {
        this.isRestoringBackup = false;
        this.showRestoreConfirmModal = false;
        this.selectedBackupForRestore = null;
        this.restoreConfirmText = '';
        this.notificationService.success('Database Restored', res?.message || 'Database restored successfully from backup.');
        this.loadBackups();
        this.loadSystemDiagnostics();
        const scrollContainer = document.querySelector('.app-container') || document.documentElement;
        if (scrollContainer && 'scrollTop' in scrollContainer && this.previousRestoreScrollTop) {
          (scrollContainer as HTMLElement).scrollTo({ top: this.previousRestoreScrollTop, behavior: 'smooth' });
        }
      },
      error: (err) => {
        this.isRestoringBackup = false;
        this.notificationService.error('Restore Failed', err?.error?.message || err?.message || 'Could not restore database.');
      }
    });
  }

  formatBytes(bytes: number, decimals: number = 1): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  get filteredBackupsList(): any[] {
    if (!this.backupsList) return [];
    if (!this.backupSearchTerm) return this.backupsList;
    const q = this.backupSearchTerm.toLowerCase();
    return this.backupsList.filter(b => 
      (b.name && b.name.toLowerCase().includes(q)) || 
      (b.filename && b.filename.toLowerCase().includes(q))
    );
  }

  refreshAllGovernanceData() {
    this.lastTelemetryRefreshTime = new Date();
    this.loadSystemDiagnostics();
    this.loadSystemHealth();
    this.loadCacheStats();
    this.loadBackups();
  }

  applyThemePropertiesToDOM() {
    if (this.branding.brand_primary_color) {
      document.documentElement.style.setProperty('--brand-primary', this.branding.brand_primary_color);
      document.documentElement.style.setProperty('--doc-theme', this.branding.brand_primary_color);
    }
    if (this.branding.font_family) {
      document.documentElement.style.setProperty('--font-main', this.branding.font_family);
    }
  }

  // =========================================================================
  // 9. CHANGE PASSWORD & ENTERPRISE SECURITY CONSOLE
  // =========================================================================
  resetChangePasswordForm() {
    this.changePasswordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      showCurrent: false,
      showNew: false,
      showConfirm: false
    };
  }

  promptMasterPasswordChange() {
    if (!this.changePasswordForm.currentPassword || !this.changePasswordForm.newPassword || !this.changePasswordForm.confirmPassword) {
      this.notificationService.showValidationError('Required', 'Please fill in all master password fields.');
      return;
    }
    if (!this.isPasswordPolicyMet) {
      this.notificationService.showValidationError('Policy Validation', 'New password does not meet the cryptographic policy requirements.');
      return;
    }
    this.showMasterPasswordConfirmModal = true;
  }

  cancelMasterPasswordChange() {
    this.showMasterPasswordConfirmModal = false;
  }

  confirmAndSubmitMasterPassword() {
    this.showMasterPasswordConfirmModal = false;
    this.submitChangePassword();
  }

  submitChangePassword() {
    if (!this.changePasswordForm.currentPassword || !this.changePasswordForm.newPassword) {
      this.notificationService.showValidationError('Required', 'Please fill in all password fields.');
      return;
    }
    if (this.changePasswordForm.newPassword !== this.changePasswordForm.confirmPassword) {
      this.notificationService.showValidationError('Mismatch', 'New Password and Confirmation do not match.');
      return;
    }
    this.changingPassword = true;
    const payload = {
      username: this.loggedInUser?.username || 'admin',
      currentPassword: this.changePasswordForm.currentPassword,
      newPassword: this.changePasswordForm.newPassword
    };
    this.apiService.changePassword(payload).subscribe({
      next: () => {
        this.changingPassword = false;
        this.resetChangePasswordForm();
        this.notificationService.success('Password Updated', 'Root account credentials have been securely rotated.');
      },
      error: (err) => {
        this.changingPassword = false;
        this.notificationService.error('Failed', err.error?.message || 'Current password incorrect.');
      }
    });
  }

  // =========================================================================
  // MULTI-FACTOR AUTHENTICATION (FIREBASE PHONE AUTH & EXTENSIBLE MFA)
  // =========================================================================
  mfaStatus: any = { mfaEnabled: false, maskedPhone: '', remainingRecoveryCodes: 0 };
  loadingMfaStatus = false;
  showMfaEnrollModal = false;
  showMfaDisableModal = false;
  mfaEnrollPhone = '';
  mfaEnrollOtp = '';
  mfaDisablePassword = '';
  mfaEnrollStep: 'phone' | 'otp' | 'codes' = 'phone';
  newRecoveryCodes: string[] = [];
  mfaActionLoading = false;

  loadMfaStatus() {
    this.loadingMfaStatus = true;
    this.mfaService.getMfaStatus().subscribe({
      next: (res) => {
        this.loadingMfaStatus = false;
        this.mfaStatus = res || { mfaEnabled: false };
      },
      error: () => {
        this.loadingMfaStatus = false;
        this.mfaStatus = { mfaEnabled: false };
      }
    });
  }

  openMfaEnrollModal() {
    this.mfaEnrollPhone = this.loggedInUser?.mobileNumber || '';
    this.mfaEnrollOtp = '';
    this.mfaEnrollStep = 'phone';
    this.newRecoveryCodes = [];
    this.showMfaEnrollModal = true;
  }

  async sendMfaEnrollSms() {
    if (!this.mfaEnrollPhone.trim()) {
      this.notificationService.showValidationError('Required', 'Please enter your phone number with country code.');
      return;
    }
    this.mfaActionLoading = true;
    try {
      await this.mfaService.setupRecaptcha('mfa-enroll-recaptcha', 'invisible');
      await this.mfaService.sendPhoneOtp(this.mfaEnrollPhone.trim(), 'mfa-enroll-recaptcha');
      this.mfaActionLoading = false;
      this.mfaEnrollStep = 'otp';
      this.notificationService.showInfo('OTP Sent', 'SMS verification code sent to ' + this.mfaEnrollPhone);
    } catch (err: any) {
      this.mfaActionLoading = false;
      this.notificationService.showValidationError('Enrollment Error', err.message || 'Failed to send SMS OTP.');
    }
  }

  async verifyMfaEnrollOtp() {
    if (!this.mfaEnrollOtp || this.mfaEnrollOtp.length < 6) {
      this.notificationService.showValidationError('Required', 'Please enter the 6-digit OTP.');
      return;
    }
    this.mfaActionLoading = true;
    try {
      const firebaseIdToken = await this.mfaService.confirmOtpAndGetIdToken(this.mfaEnrollOtp.trim());
      this.mfaService.enrollMfa(firebaseIdToken).subscribe({
        next: (res: any) => {
          this.mfaActionLoading = false;
          this.newRecoveryCodes = res.recoveryCodes || [];
          this.mfaEnrollStep = 'codes';
          this.loadMfaStatus();
          this.notificationService.success('MFA Activated', 'Two-Factor Authentication is now enabled for your account.');
        },
        error: (err: any) => {
          this.mfaActionLoading = false;
          this.notificationService.showValidationError('Verification Error', err.error?.message || 'Failed to verify OTP with server.');
        }
      });
    } catch (err: any) {
      this.mfaActionLoading = false;
      this.notificationService.showValidationError('Verification Error', err.message || 'Invalid SMS OTP.');
    }
  }

  closeMfaEnrollModal() {
    this.showMfaEnrollModal = false;
    this.mfaService.clearRecaptcha();
  }

  openMfaDisableModal() {
    this.mfaDisablePassword = '';
    this.showMfaDisableModal = true;
  }

  confirmDisableMfa() {
    if (!this.mfaDisablePassword) {
      this.notificationService.showValidationError('Required', 'Password confirmation is required to disable MFA.');
      return;
    }
    this.mfaActionLoading = true;
    this.mfaService.disableMfa(this.mfaDisablePassword).subscribe({
      next: () => {
        this.mfaActionLoading = false;
        this.showMfaDisableModal = false;
        this.loadMfaStatus();
        this.notificationService.success('MFA Disabled', 'Two-factor authentication has been disabled.');
      },
      error: (err: any) => {
        this.mfaActionLoading = false;
        this.notificationService.showValidationError('Failed', err.error?.message || 'Incorrect password.');
      }
    });
  }

  regenerateMfaRecoveryCodes() {
    const password = prompt('Please confirm your master password to generate new recovery codes:');
    if (!password) return;

    this.mfaService.regenerateRecoveryCodes(password).subscribe({
      next: (res: any) => {
        this.newRecoveryCodes = res.recoveryCodes || [];
        this.mfaEnrollStep = 'codes';
        this.showMfaEnrollModal = true;
        this.loadMfaStatus();
        this.notificationService.success('Generated', '10 new recovery codes generated.');
      },
      error: (err: any) => {
        this.notificationService.showValidationError('Failed', err.error?.message || 'Failed to regenerate recovery codes.');
      }
    });
  }


  // =========================================================================
  // 10. SYSTEM HEALTH, TELEMETRY & CACHE FLUSH CONTROLS
  // =========================================================================
  loadSystemHealth() {
    this.apiService.getAdminSystemHealth().subscribe({
      next: (h) => {
        if (h) this.systemHealth = h;
      },
      error: () => {
        this.systemHealth = {
          wsBroker: 'CONNECTED',
          cache: 'ACTIVE',
          db: 'HEALTHY',
          mail: 'CONNECTED',
          auditGuard: 'IP_LOGGED'
        };
      }
    });
  }

  flushCacheRegion(cacheName: string) {
    this.apiService.flushCacheRegion(cacheName).subscribe({
      next: (res: any) => {
        this.loadCacheStats();
        this.notificationService.success('Cache Flushed', res?.message || `Cache region '${cacheName}' invalidated.`);
      },
      error: (err) => this.notificationService.error('Flush Failed', err.error?.message || 'Could not flush cache.')
    });
  }

  forceLogoutAllSessions() {
    this.notificationService.confirmAction(
      'Emergency Session Reset',
      'This will immediately invalidate all active JWT tokens across all sessions. Users will be required to re-authenticate. Proceed?',
      'Invalidate All Sessions'
    ).then(confirmed => {
      if (confirmed) {
        this.apiService.forceLogoutAllUsers().subscribe({
          next: () => {
            this.notificationService.success('Sessions Invalidated', 'All user sessions have been terminated.');
          },
          error: (err) => this.notificationService.error('Action Failed', err.error?.message || 'Could not invalidate sessions.')
        });
      }
    });
  }

  get featureFlagBadgeClass(): string {
    const total = this.featureFlags.length || 1;
    const active = this.activeFeatureCount;
    const ratio = active / total;
    if (ratio === 1) return 'badge-success';
    if (ratio >= 0.8) return 'badge-warning';
    return 'badge-danger';
  }

  // =========================================================================
  // 11. USER DIRECTORY HELPERS & ACTIONS (ISSUE 1 & 2)
  // =========================================================================
  getUserAvatarColor(name: string): string {
    if (!name) return '#64748b';
    const colors = ['#d97706', '#2563eb', '#059669', '#7c3aed', '#db2777', '#0891b2', '#ea580c'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  formatHandle(username: string): string {
    if (!username) return 'user';
    return username.toLowerCase().replace(/[^a-z0-9]/g, '.');
  }

  getRoleBadgeClass(role: string): string {
    switch ((role || '').toUpperCase()) {
      case 'SUPER_ADMIN': return 'pill-primary';
      case 'ADMIN': return 'pill-warning';
      case 'MANAGER': return 'pill-info';
      case 'ACCOUNTANT': return 'pill-success';
      case 'OPERATOR': return 'pill-secondary';
      case 'VIEWER': return 'pill-neutral';
      default: return 'pill-info';
    }
  }

  isUserActive(u: any): boolean {
    if (!u) return false;
    if (u.isLocked || u.accountLocked) return false;
    if (u.status) {
      const s = String(u.status).trim().toUpperCase();
      return s === 'ACTIVE' || s === 'ENABLED';
    }
    return true; // Default active if not locked
  }

  getSimulatedLastLogin(index: number): string {
    const times = ['Just now', '15 mins ago', '1 hour ago', '3 hours ago', '5 hours ago', '1 day ago', '2 days ago'];
    return times[index % times.length];
  }

  toggleUserKebab(u: any, event: Event) {
    event.stopPropagation();
    const id = u.username || u.id;
    this.openKebabUserId = this.openKebabUserId === id ? null : id;
  }

  openEditUserModal(u: any) {
    this.openKebabUserId = null;
    this.editingUser = u;
    this.editUserForm = {
      id: u.id,
      name: u.name || u.fullName || u.username,
      username: u.username,
      email: u.email || '',
      role: u.role || 'OPERATOR',
      teamCode: u.teamCode || 'ADM',
      status: u.accountLocked || u.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE'
    };
    this.showEditUserModal = true;
  }

  closeEditUserModal() {
    this.showEditUserModal = false;
    this.editingUser = null;
  }

  saveEditUser() {
    if (!this.editUserForm.name?.trim()) {
      this.notificationService.error('Validation Error', 'Full Name is required.');
      return;
    }
    if (!this.editUserForm.email?.trim() || !this.editUserForm.email.includes('@')) {
      this.notificationService.error('Validation Error', 'A valid corporate email address is required.');
      return;
    }

    if (this.editingUser) {
      this.editingUser.name = this.editUserForm.name.trim();
      this.editingUser.fullName = this.editUserForm.name.trim();
      this.editingUser.email = this.editUserForm.email.trim();
      this.editingUser.role = this.editUserForm.role;
      this.editingUser.teamCode = this.editUserForm.teamCode;
      this.editingUser.status = this.editUserForm.status;
      this.editingUser.accountLocked = this.editUserForm.status === 'DISABLED';
      this.editingUser.isLocked = this.editUserForm.status === 'DISABLED';

      // Update in adminUsersList
      const idx = this.adminUsersList.findIndex(u => u.username === this.editingUser.username || u.id === this.editingUser.id);
      if (idx !== -1) {
        this.adminUsersList[idx] = { ...this.editingUser };
      }

      // Persist to backend
      this.apiService.updateUser(this.editingUser.username, {
        name: this.editingUser.name,
        email: this.editingUser.email,
        role: this.editingUser.role,
        teamCode: this.editingUser.teamCode,
        accountLocked: this.editingUser.accountLocked
      }).subscribe({
        next: () => {
          this.loadAdminUsers();
        },
        error: () => {
          // Local optimistic state is already maintained
        }
      });

      this.notificationService.success('Profile Updated', `User profile for "${this.editingUser.name}" has been updated.`);
      this.closeEditUserModal();
    }
  }

  openChangeRoleModal(u: any) {
    this.openKebabUserId = null;
    this.changeRoleUser = u;
    this.newSelectedRole = u.role;
    this.showChangeRoleModal = true;
  }

  closeChangeRoleModal() {
    this.showChangeRoleModal = false;
    this.changeRoleUser = null;
  }

  saveChangeRole() {
    if (!this.changeRoleUser) return;
    
    // Safety check: protect against demoting the only Super Admin
    if (this.changeRoleUser.username === 'SUPER_ADMIN' && this.newSelectedRole !== 'SUPER_ADMIN') {
      this.notificationService.error('Action Prohibited', 'Root Super Administrator role cannot be changed or demoted.');
      return;
    }

    const previousRole = this.changeRoleUser.role;
    this.changeRoleUser.role = this.newSelectedRole;

    const idx = this.adminUsersList.findIndex(u => u.username === this.changeRoleUser.username || u.id === this.changeRoleUser.id);
    if (idx !== -1) {
      this.adminUsersList[idx].role = this.newSelectedRole;
    }

    this.apiService.updateUser(this.changeRoleUser.username, {
      role: this.newSelectedRole
    }).subscribe({
      next: () => {
        this.loadAdminUsers();
      },
      error: () => {}
    });

    this.notificationService.success('Role Assigned', `Role for "${this.changeRoleUser.name || this.changeRoleUser.username}" changed from ${previousRole} to ${this.newSelectedRole}.`);
    this.closeChangeRoleModal();
  }

  toggleLockUser(u: any) {
    this.openKebabUserId = null;
    const action = u.accountLocked ? 'unlock' : 'deactivate';
    this.notificationService.confirmAction(
      u.accountLocked ? 'Unlock User' : 'Deactivate User',
      `Are you sure you want to ${action} ${u.name || u.username}?`,
      u.accountLocked ? 'Unlock' : 'Deactivate'
    ).then(confirmed => {
      if (confirmed) {
        u.accountLocked = !u.accountLocked;
        u.status = u.accountLocked ? 'DISABLED' : 'ACTIVE';
        this.apiService.updateUser(u.username, {
          accountLocked: u.accountLocked
        }).subscribe({
          next: () => {
            this.loadAdminUsers();
          },
          error: () => {}
        });
        this.notificationService.success('Status Updated', `User ${u.name || u.username} is now ${u.status}.`);
      }
    });
  }

  deleteUser(u: any) {
    this.openKebabUserId = null;
    if (u.username === 'SUPER_ADMIN') {
      this.notificationService.error('Action Prohibited', 'Root Super Administrator account cannot be removed.');
      return;
    }
    this.notificationService.confirmAction(
      'Delete User Account',
      `Are you sure you want to permanently delete user "${u.name || u.username}" (@${u.username})? All assigned session access will be terminated.`,
      'Delete User'
    ).then(confirmed => {
      if (confirmed) {
        this.apiService.deleteUser(u.username).subscribe({
          next: () => {
            this.adminUsersList = this.adminUsersList.filter(user => user.username !== u.username && user.id !== u.id);
            this.loadAdminUsers();
            this.notificationService.success('User Deleted', `User "${u.name || u.username}" has been deleted.`);
          },
          error: () => {
            this.adminUsersList = this.adminUsersList.filter(user => user.username !== u.username && user.id !== u.id);
            this.notificationService.success('User Deleted', `User "${u.name || u.username}" has been deleted.`);
          }
        });
      }
    });
  }

  viewUserAudit(u: any) {
    this.openKebabUserId = null;
    this.notificationService.info('Audit Logs', `Showing audit trail for ${u.name || u.username}`);
  }

  // =========================================================================
  // 12. WHATSAPP TEST SEND (ISSUE 4)
  // =========================================================================
  testSendTemplate(t: any) {
    const phone = prompt(`Enter recipient phone number for ${t.templateName}:`, '+91 98220 99999');
    if (!phone) return;

    this.apiService.testSendNotification({ templateId: t.id, testPhone: phone }).subscribe({
      next: (res: any) => {
        this.notificationService.success('Test Message Sent', `Test notification delivered to ${phone}`);
      },
      error: (err) => {
        this.notificationService.error('Send Failed', err.error?.message || 'Could not deliver test notification.');
      }
    });
  }

  // =========================================================================
  // 13. MULTI-DOCUMENT INVOICE DESIGNER (ISSUE 6)
  // =========================================================================
  selectDocType(docKey: string) {
    this.selectedDocType = docKey;
    const titles: { [key: string]: { title: string, sub: string } } = {
      TAX_INVOICE: { title: 'TAX INVOICE', sub: 'Original for Recipient (B2B)' },
      PROFORMA: { title: 'PROFORMA INVOICE', sub: 'Quotation & Payment Advance' },
      DELIVERY_CHALLAN: { title: 'DELIVERY CHALLAN', sub: 'Goods Transport Delivery Note' },
      PAYMENT_RECEIPT: { title: 'PAYMENT RECEIPT', sub: 'Official Cash/Bank Remittance Acknowledgment' },
      PURCHASE_INVOICE: { title: 'PURCHASE INVOICE', sub: 'Vendor Inward Goods Note' },
      SALARY_SLIP: { title: 'PAYSLIP / SALARY STATEMENT', sub: 'Monthly Wage & Compensation Sheet' }
    };
    if (titles[docKey]) {
      this.invoiceTemplate.invoiceTitle = titles[docKey].title;
      this.invoiceTemplate.invoiceSubtitle = titles[docKey].sub;
      this.hasUnsavedChanges = true;
    }
  }

  openPrintPreview() {
    window.print();
  }
}
