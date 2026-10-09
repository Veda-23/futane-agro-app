export interface CustomizationOption {
  id: string;
  key: string;
  category: 'Branding & White-Label' | 'Multi-Company & Entity' | 'Invoicing, Tax & Currency' | 'Manufacturing & Shop Floor' | 'Inventory & Raw Materials' | 'Logistics & Dispatch' | 'Workforce & Payroll' | 'Security & Governance';
  title: string;
  description: string;
  type: 'boolean' | 'string' | 'number' | 'select' | 'color';
  value: any;
  defaultValue: any;
  options?: string[];
  unit?: string;
  impactedTabs: string[];
}

export interface IndustryTemplate {
  id: string;
  name: string;
  icon: string;
  badgeColor: string;
  description: string;
  terminology: {
    primaryUnit: string;
    clientLabel: string;
    batchLabel: string;
    toolLabel: string;
    rawMaterialLabel: string;
  };
  overrides: { [key: string]: any };
}

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    id: 'agri_plastics',
    name: 'Agri & Plastic Crates',
    icon: 'bi-flower1',
    badgeColor: '#059669',
    description: 'Optimized for crate molding, farm collection centers, wholesale mandis, fruit trays, and tare weight calibration.',
    terminology: {
      primaryUnit: 'Crates',
      clientLabel: 'Party / Mandi',
      batchLabel: 'Production Batch',
      toolLabel: 'Mould Code',
      rawMaterialLabel: 'HDPE / PP Granules'
    },
    overrides: {
      'brand.app_title': 'AgroPlas Manufacturing ERP',
      'brand.primary_color': '#059669',
      'inv.prefix': 'AGP/26-27/',
      'mfg.batch_prefix': 'PPD-AGR-',
      'mfg.scrap_allowance_pct': 3.5,
      'logistics.unit_label': 'Crates / Bundles'
    }
  },
  {
    id: 'plastics_moulding',
    name: 'Plastics & Injection Moulding',
    icon: 'bi-boxes',
    badgeColor: '#2563eb',
    description: 'Precision injection & blow moulding, cycle time tracking, shot counters, regrind granules, and cavity QA.',
    terminology: {
      primaryUnit: 'Pieces (Nos)',
      clientLabel: 'OEM Customer',
      batchLabel: 'Moulding Lot',
      toolLabel: 'Die / Tooling Set',
      rawMaterialLabel: 'Polymer Resin / Masterbatch'
    },
    overrides: {
      'brand.app_title': 'PolyMould Industrial ERP',
      'brand.primary_color': '#2563eb',
      'inv.prefix': 'PMI/26-27/',
      'mfg.batch_prefix': 'LOT-INJ-',
      'mfg.scrap_allowance_pct': 2.0,
      'logistics.unit_label': 'Corrugated Cartons'
    }
  },
  {
    id: 'textiles_garments',
    name: 'Textiles & Apparel',
    icon: 'bi-scissors',
    badgeColor: '#7c3aed',
    description: 'Fabric spinning, dye lots, loom meterage, roll inspection, piece-rate cutting, and garment export packs.',
    terminology: {
      primaryUnit: 'Meters / Rolls',
      clientLabel: 'Buyer / Retail Brand',
      batchLabel: 'Dyeing / Weave Lot',
      toolLabel: 'Loom / Pattern Spec',
      rawMaterialLabel: 'Yarn / Grey Fabric'
    },
    overrides: {
      'brand.app_title': 'TexCraft Global ERP',
      'brand.primary_color': '#7c3aed',
      'inv.prefix': 'TEX/26-27/',
      'mfg.batch_prefix': 'DYE-LOT-',
      'mfg.scrap_allowance_pct': 5.0,
      'logistics.unit_label': 'Bales / Rolls'
    }
  },
  {
    id: 'auto_engineering',
    name: 'Automotive & Precision Engineering',
    icon: 'bi-gear-wide-connected',
    badgeColor: '#dc2626',
    description: 'CNC milling, casting heats, tolerance validation (microns), Kanban job cards, and PPAP quality auditing.',
    terminology: {
      primaryUnit: 'Finished Assemblies',
      clientLabel: 'Tier-1 Auto Client',
      batchLabel: 'Job Order / Heat No',
      toolLabel: 'CNC Jig / Fixture',
      rawMaterialLabel: 'Forged Billets / Sheet Metal'
    },
    overrides: {
      'brand.app_title': 'ApexPrecision Automotive ERP',
      'brand.primary_color': '#dc2626',
      'inv.prefix': 'APX/26-27/',
      'mfg.batch_prefix': 'JO-CNC-',
      'mfg.scrap_allowance_pct': 1.2,
      'logistics.unit_label': 'Wooden Pallets / Crates'
    }
  },
  {
    id: 'pharma_lifesciences',
    name: 'Pharma & Life Sciences',
    icon: 'bi-capsule',
    badgeColor: '#0891b2',
    description: 'GMP compliance, cleanroom batches, active pharma ingredients (API), expiry shelf-life, and 21 CFR Part 11 electronic records.',
    terminology: {
      primaryUnit: 'Bottles / Strips',
      clientLabel: 'Hospital / Stockist',
      batchLabel: 'Clinical Lot / Assay Run',
      toolLabel: 'Sterile Reactor / Press',
      rawMaterialLabel: 'API / Excipients'
    },
    overrides: {
      'brand.app_title': 'PharmaTrust GMP ERP',
      'brand.primary_color': '#0891b2',
      'inv.prefix': 'PHR/26-27/',
      'mfg.batch_prefix': 'PH-LOT-',
      'mfg.scrap_allowance_pct': 0.5,
      'logistics.unit_label': 'Shipper Cartons'
    }
  },
  {
    id: 'fmcg_trading',
    name: 'FMCG & Commercial Distribution',
    icon: 'bi-cart-check',
    badgeColor: '#d97706',
    description: 'Fast-moving consumer goods, secondary sales, multi-warehouse stock replenishment, retailer van routes, and volume trade schemes.',
    terminology: {
      primaryUnit: 'Outer Cases (Cartons)',
      clientLabel: 'Distributor / Super-Stockist',
      batchLabel: 'Packing Run',
      toolLabel: 'Carton Sealer / Line',
      rawMaterialLabel: 'Finished Bulk Packs'
    },
    overrides: {
      'brand.app_title': 'NexusFMCG Distribution ERP',
      'brand.primary_color': '#d97706',
      'inv.prefix': 'NXF/26-27/',
      'mfg.batch_prefix': 'RUN-FMCG-',
      'mfg.scrap_allowance_pct': 0.8,
      'logistics.unit_label': 'Corrugated Master Cases'
    }
  }
];

export const MASTER_CUSTOMIZATIONS_CATALOG: CustomizationOption[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // 1. BRANDING & WHITE-LABEL (25 OPTIONS)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'c1',
    key: 'brand.app_title',
    category: 'Branding & White-Label',
    title: 'Enterprise Application Name',
    description: 'Application branding title displayed in browser title bar, navigation bar, and official reports.',
    type: 'string',
    value: 'Futane Agro ERP',
    defaultValue: 'Futane Agro ERP',
    impactedTabs: ['Header', 'Sidebar', 'Invoices', 'Settings']
  },
  {
    id: 'c2',
    key: 'brand.tagline',
    category: 'Branding & White-Label',
    title: 'Corporate Slogan / Tagline',
    description: 'Corporate motto printed on customer invoices, delivery challans, and customer receipts.',
    type: 'string',
    value: 'Quality Crates, Stronger Future',
    defaultValue: 'Quality Crates, Stronger Future',
    impactedTabs: ['Invoices', 'Settings']
  },
  {
    id: 'c3',
    key: 'brand.primary_color',
    category: 'Branding & White-Label',
    title: 'Primary Corporate Brand Accent Color',
    description: 'Main color accent for active tabs, primary action buttons, key metrics, and charts.',
    type: 'color',
    value: '#2563eb',
    defaultValue: '#2563eb',
    impactedTabs: ['All Modules']
  },
  {
    id: 'c4',
    key: 'brand.primary_hover',
    category: 'Branding & White-Label',
    title: 'Primary Hover Accent Color',
    description: 'Darker accent shade triggered when hovering buttons and interactive elements.',
    type: 'color',
    value: '#1d4ed8',
    defaultValue: '#1d4ed8',
    impactedTabs: ['All Modules']
  },
  {
    id: 'c5',
    key: 'brand.theme_default',
    category: 'Branding & White-Label',
    title: 'Default Interface Theme Mode',
    description: 'Initial color mode applied for newly registered users and visitors.',
    type: 'select',
    value: 'light',
    defaultValue: 'light',
    options: ['light', 'dark', 'system'],
    impactedTabs: ['All Modules']
  },
  {
    id: 'c6',
    key: 'brand.font_family',
    category: 'Branding & White-Label',
    title: 'Corporate Typography Font Stack',
    description: 'Base font family rendered throughout the entire enterprise UI.',
    type: 'select',
    value: 'Inter',
    defaultValue: 'Inter',
    options: ['Inter', 'Plus Jakarta Sans', 'Outfit', 'Roboto', 'JetBrains Mono'],
    impactedTabs: ['All Modules']
  },
  {
    id: 'c7',
    key: 'brand.table_density',
    category: 'Branding & White-Label',
    title: 'Default Table Density Layout',
    description: 'Row vertical padding scale for high-speed data entry or executive readability.',
    type: 'select',
    value: 'comfortable',
    defaultValue: 'comfortable',
    options: ['compact', 'comfortable', 'spacious'],
    impactedTabs: ['All Tables']
  },
  {
    id: 'c8',
    key: 'brand.border_radius',
    category: 'Branding & White-Label',
    title: 'UI Element Corner Radius',
    description: 'Geometric border radius applied to cards, modals, buttons, and inputs.',
    type: 'select',
    value: '8px',
    defaultValue: '8px',
    options: ['4px (Sharp)', '8px (Modern Corporate)', '12px (Smooth Rounded)', '16px (Pill Soft)'],
    impactedTabs: ['All Modules']
  },
  {
    id: 'c9',
    key: 'brand.glassmorphism',
    category: 'Branding & White-Label',
    title: 'Glassmorphism Backdrop Blur Level',
    description: 'Translucency and blur effect on header, modal backdrops, and floating menus.',
    type: 'select',
    value: 'medium',
    defaultValue: 'medium',
    options: ['none', 'subtle', 'medium', 'heavy'],
    impactedTabs: ['Header', 'Modals', 'Menus']
  },
  {
    id: 'c10',
    key: 'brand.show_watermark',
    category: 'Branding & White-Label',
    title: 'PDF Document Watermark Toggle',
    description: 'Prints faint transparent company logo or DRAFT watermark on outgoing PDFs.',
    type: 'boolean',
    value: false,
    defaultValue: false,
    impactedTabs: ['Invoices', 'Reports']
  },
  {
    id: 'c11',
    key: 'brand.watermark_text',
    category: 'Branding & White-Label',
    title: 'Custom Watermark Text',
    description: 'Text string rendered diagonally across preview documents.',
    type: 'string',
    value: 'FUTANE AGRO CONFIDENTIAL',
    defaultValue: 'CONFIDENTIAL',
    impactedTabs: ['Invoices', 'Reports']
  },
  {
    id: 'c12',
    key: 'brand.favicon_url',
    category: 'Branding & White-Label',
    title: 'Browser Favicon URL',
    description: 'Custom 32x32 SVG or PNG icon displayed on the browser tab.',
    type: 'string',
    value: 'assets/logo.svg',
    defaultValue: 'assets/logo.svg',
    impactedTabs: ['Browser Shell']
  },
  {
    id: 'c13',
    key: 'brand.login_theme',
    category: 'Branding & White-Label',
    title: 'Login Screen Background Style',
    description: 'Visual backdrop rendered on the employee login portal.',
    type: 'select',
    value: 'cyber_mesh',
    defaultValue: 'cyber_mesh',
    options: ['cyber_mesh', 'corporate_minimal', 'factory_blueprint', 'dark_glass'],
    impactedTabs: ['Login Screen']
  },
  {
    id: 'c14',
    key: 'brand.login_logo_width',
    category: 'Branding & White-Label',
    title: 'Login Screen Logo Size',
    description: 'Maximum width of corporate emblem on authentication modal.',
    type: 'number',
    value: 180,
    defaultValue: 180,
    unit: 'px',
    impactedTabs: ['Login Screen']
  },
  {
    id: 'c15',
    key: 'brand.header_layout',
    category: 'Branding & White-Label',
    title: 'Top Navigation Header Structure',
    description: 'Arrangement of logo, global search, and telemetry pills in executive bar.',
    type: 'select',
    value: 'wide_search',
    defaultValue: 'wide_search',
    options: ['wide_search', 'compact_metrics', 'executive_split'],
    impactedTabs: ['Header']
  },
  {
    id: 'c16',
    key: 'brand.sidebar_default_collapsed',
    category: 'Branding & White-Label',
    title: 'Sidebar Collapsed by Default',
    description: 'Auto-collapses the 23-module sidebar to icon-only mode to maximize laptop table width.',
    type: 'boolean',
    value: false,
    defaultValue: false,
    impactedTabs: ['Sidebar', 'Layout']
  },
  {
    id: 'c17',
    key: 'brand.custom_portal_url',
    category: 'Branding & White-Label',
    title: 'Custom White-Label Portal Domain',
    description: 'Custom CNAME or subdomain (e.g. erp.yourcompany.com) for client portal access.',
    type: 'string',
    value: 'erp.futaneagro.com',
    defaultValue: 'erp.company.com',
    impactedTabs: ['Domain Settings']
  },
  {
    id: 'c18',
    key: 'brand.email_footer_html',
    category: 'Branding & White-Label',
    title: 'Transactional Email Footer Signature',
    description: 'HTML block appended to outgoing dispatch notifications and customer payment receipts.',
    type: 'string',
    value: '<p>© 2026 Futane Agro ERP. All rights reserved. Precision Manufacturing Solutions.</p>',
    defaultValue: '<p>© Corporate ERP. All rights reserved.</p>',
    impactedTabs: ['Notifications']
  },
  {
    id: 'c19',
    key: 'brand.support_email',
    category: 'Branding & White-Label',
    title: 'Help Desk / Support Contact Email',
    description: 'Contact address displayed on login help cards and error pages.',
    type: 'string',
    value: 'support@futaneagro.com',
    defaultValue: 'support@company.com',
    impactedTabs: ['Support', 'Login']
  },
  {
    id: 'c20',
    key: 'brand.support_hotline',
    category: 'Branding & White-Label',
    title: 'Emergency IT Support Hotline',
    description: 'Toll-free or plant manager phone number displayed on operational dashboards.',
    type: 'string',
    value: '+91 98220 12345',
    defaultValue: '+91 00000 00000',
    impactedTabs: ['Dashboard']
  },
  {
    id: 'c21',
    key: 'brand.pdf_letterhead_style',
    category: 'Branding & White-Label',
    title: 'PDF Letterhead Layout Scheme',
    description: 'Arrangement of company name, registered premises, and GSTIN on tax invoices.',
    type: 'select',
    value: 'modern_clean',
    defaultValue: 'modern_clean',
    options: ['modern_clean', 'classic_bordered', 'executive_banner', 'minimal_flat'],
    impactedTabs: ['Invoices', 'Dispatch']
  },
  {
    id: 'c22',
    key: 'brand.show_qr_on_print',
    category: 'Branding & White-Label',
    title: 'Render Live UPI / Validation QR on Printouts',
    description: 'Generates a dynamic scannable QR code on physical paper invoices for instant payments.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Invoices']
  },
  {
    id: 'c23',
    key: 'brand.show_terms_on_invoice',
    category: 'Branding & White-Label',
    title: 'Print Standard Terms & Conditions Footer',
    description: 'Renders formal legal clauses at bottom of sales contracts and tax invoices.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Invoices']
  },
  {
    id: 'c24',
    key: 'brand.invoice_terms_text',
    category: 'Branding & White-Label',
    title: 'Invoice Standard Terms Clauses',
    description: 'Default contractual text printed on outgoing tax invoices.',
    type: 'string',
    value: '1. Goods once sold will not be taken back. 2. Subject to Pune jurisdiction. 3. Interest @18% p.a. will be charged after 30 days.',
    defaultValue: '1. Subject to local jurisdiction. 2. Payment due within agreed terms.',
    impactedTabs: ['Invoices']
  },
  {
    id: 'c25',
    key: 'brand.multi_language_enabled',
    category: 'Branding & White-Label',
    title: 'Enable Multi-Language UI (English / Marathi / Hindi)',
    description: 'Allows shop floor workers and accountants to switch between EN, MR, and HI.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['All Modules']
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. MULTI-COMPANY & ORGANIZATION (30 OPTIONS)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'c26',
    key: 'org.company_legal_name',
    category: 'Multi-Company & Entity',
    title: 'Corporate Registered Legal Entity Name',
    description: 'Official registered entity name as per Ministry of Corporate Affairs (MCA).',
    type: 'string',
    value: 'Futane Agro Industries Pvt. Ltd.',
    defaultValue: 'Acme Enterprises Pvt. Ltd.',
    impactedTabs: ['Business Rules', 'Invoices', 'Settings']
  },
  {
    id: 'c27',
    key: 'org.trade_brand_name',
    category: 'Multi-Company & Entity',
    title: 'Trade / Brand Name (DBA)',
    description: 'Commercial operating brand name used in marketing and dispatch markings.',
    type: 'string',
    value: 'Futane Agro Tech',
    defaultValue: 'Acme Tech',
    impactedTabs: ['All Modules']
  },
  {
    id: 'c28',
    key: 'org.gstin',
    category: 'Multi-Company & Entity',
    title: 'GSTIN / State Tax Identification Number',
    description: '15-character GST alphanumeric registry identifier.',
    type: 'string',
    value: '27AABCF1234F1Z8',
    defaultValue: '27AAAAA0000A1Z5',
    impactedTabs: ['Invoices', 'Parties', 'Vendors']
  },
  {
    id: 'c29',
    key: 'org.pan',
    category: 'Multi-Company & Entity',
    title: 'Permanent Account Number (PAN)',
    description: '10-character corporate income tax PAN identifier.',
    type: 'string',
    value: 'AABCF1234F',
    defaultValue: 'AAAAA0000A',
    impactedTabs: ['Invoices', 'Business Rules']
  },
  {
    id: 'c30',
    key: 'org.cin',
    category: 'Multi-Company & Entity',
    title: 'Corporate Identification Number (CIN)',
    description: '21-digit corporate registry number issued by Registrar of Companies (ROC).',
    type: 'string',
    value: 'U25209PN2020PTC123456',
    defaultValue: 'U00000MH2020PTC000000',
    impactedTabs: ['Invoices', 'Business Rules']
  },
  {
    id: 'c31',
    key: 'org.msme_reg_no',
    category: 'Multi-Company & Entity',
    title: 'MSME Udyam Registration Number',
    description: 'Statutory Udyam MSME certificate identifier for delayed payment protection.',
    type: 'string',
    value: 'UDYAM-MH-26-0012345',
    defaultValue: 'UDYAM-MH-00-0000000',
    impactedTabs: ['Invoices', 'Business Rules']
  },
  {
    id: 'c32',
    key: 'org.state_code',
    category: 'Multi-Company & Entity',
    title: 'Statutory Home State Code (GST)',
    description: '2-digit numeric GST state code (e.g. 27 for Maharashtra, 24 for Gujarat).',
    type: 'string',
    value: '27',
    defaultValue: '27',
    impactedTabs: ['Invoices', 'Taxes']
  },
  {
    id: 'c33',
    key: 'org.state_name',
    category: 'Multi-Company & Entity',
    title: 'Home State Name',
    description: 'State jurisdiction where the manufacturing plant is situated.',
    type: 'string',
    value: 'Maharashtra',
    defaultValue: 'Maharashtra',
    impactedTabs: ['Invoices', 'Parties']
  },
  {
    id: 'c34',
    key: 'org.currency_code',
    category: 'Multi-Company & Entity',
    title: 'Base Currency Code',
    description: 'ISO-4217 financial currency designation.',
    type: 'select',
    value: 'INR',
    defaultValue: 'INR',
    options: ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'],
    impactedTabs: ['All Financials']
  },
  {
    id: 'c35',
    key: 'org.currency_symbol',
    category: 'Multi-Company & Entity',
    title: 'Currency Symbol',
    description: 'Monetary symbol rendered in front of ledger values and invoice totals.',
    type: 'string',
    value: '₹',
    defaultValue: '₹',
    impactedTabs: ['All Financials']
  },
  {
    id: 'c36',
    key: 'org.decimal_precision',
    category: 'Multi-Company & Entity',
    title: 'Monetary Decimal Places',
    description: 'Number of decimal places displayed for currency balances (2 or 3 decimals).',
    type: 'select',
    value: '2',
    defaultValue: '2',
    options: ['0 (Whole Numbers)', '2 (Standard .00)', '3 (Precise .000)'],
    impactedTabs: ['All Financials']
  },
  {
    id: 'c37',
    key: 'org.number_formatting_system',
    category: 'Multi-Company & Entity',
    title: 'Number Grouping Standard',
    description: 'Grouping convention for thousands, lakhs, millions.',
    type: 'select',
    value: 'indian',
    defaultValue: 'indian',
    options: ['indian (1,00,000 Lakhs)', 'international (100,000 Millions)'],
    impactedTabs: ['All Financials']
  },
  {
    id: 'c38',
    key: 'org.financial_year_start',
    category: 'Multi-Company & Entity',
    title: 'Fiscal Year Starting Month',
    description: 'Commencement month for annual audit cycles and ledger balancing.',
    type: 'select',
    value: 'April',
    defaultValue: 'April',
    options: ['January (Calendar Year)', 'April (Indian FY)', 'July', 'October'],
    impactedTabs: ['Ledger', 'Reports']
  },
  {
    id: 'c39',
    key: 'org.current_active_fy',
    category: 'Multi-Company & Entity',
    title: 'Active Operating Fiscal Year',
    description: 'Designation embedded into voucher sequences (e.g. 2026-27).',
    type: 'string',
    value: '2026-27',
    defaultValue: '2026-27',
    impactedTabs: ['Invoices', 'Sales', 'Reports']
  },
  {
    id: 'c40',
    key: 'org.timezone',
    category: 'Multi-Company & Entity',
    title: 'Operational Timezone',
    description: 'Standard timezone for shift logs and automated batch timestamps.',
    type: 'select',
    value: 'Asia/Kolkata',
    defaultValue: 'Asia/Kolkata',
    options: ['Asia/Kolkata (IST +5:30)', 'Asia/Dubai (GST +4:00)', 'Europe/London (GMT)', 'America/New_York (EST)'],
    impactedTabs: ['All Modules']
  },
  {
    id: 'c41',
    key: 'org.plant_code',
    category: 'Multi-Company & Entity',
    title: 'Primary Manufacturing Plant Code',
    description: 'Facility code embedded into batch identifiers (e.g. PL-PUNE-01).',
    type: 'string',
    value: 'PL-SHIRWAL-01',
    defaultValue: 'PLANT-01',
    impactedTabs: ['Production', 'Machines']
  },
  {
    id: 'c42',
    key: 'org.plant_name',
    category: 'Multi-Company & Entity',
    title: 'Plant Location Name',
    description: 'Physical works unit location name.',
    type: 'string',
    value: 'Shirwal Mega Industrial Plant',
    defaultValue: 'Central Factory Unit',
    impactedTabs: ['Production', 'Machines']
  },
  {
    id: 'c43',
    key: 'org.primary_contact_person',
    category: 'Multi-Company & Entity',
    title: 'General Manager / Authorized Signatory',
    description: 'Executive name appearing under official signature stamps.',
    type: 'string',
    value: 'Mr. Rajesh Futane',
    defaultValue: 'Authorized Signatory',
    impactedTabs: ['Invoices', 'Business Rules']
  },
  {
    id: 'c44',
    key: 'org.signatory_designation',
    category: 'Multi-Company & Entity',
    title: 'Signatory Designation',
    description: 'Corporate title printed beneath authorized signature.',
    type: 'string',
    value: 'Managing Director',
    defaultValue: 'Partner / Director',
    impactedTabs: ['Invoices']
  },
  {
    id: 'c45',
    key: 'org.registered_address',
    category: 'Multi-Company & Entity',
    title: 'Registered Head Office Address',
    description: 'Official corporate statutory postal address.',
    type: 'string',
    value: 'Plot No. 42, Hadapsar Industrial Area, Pune, Maharashtra - 411028',
    defaultValue: 'Industrial Estate, Pune',
    impactedTabs: ['Invoices', 'Business Rules']
  },
  {
    id: 'c46',
    key: 'org.works_factory_address',
    category: 'Multi-Company & Entity',
    title: 'Factory Works & Dispatch Address',
    description: 'Physical dispatch gate address for e-Way bills.',
    type: 'string',
    value: 'Gat No. 128/2, Shirwal Industrial Zone, Satara, Maharashtra - 412801',
    defaultValue: 'Works Location, MIDC',
    impactedTabs: ['Dispatch', 'Invoices']
  },
  {
    id: 'c47',
    key: 'org.billing_email',
    category: 'Multi-Company & Entity',
    title: 'Official Accounts & Billing Email',
    description: 'Email displayed on invoice letterheads for remittance proofs.',
    type: 'string',
    value: 'billing@futaneagro.com',
    defaultValue: 'accounts@company.com',
    impactedTabs: ['Invoices']
  },
  {
    id: 'c48',
    key: 'org.billing_phone',
    category: 'Multi-Company & Entity',
    title: 'Accounts Desk Contact Number',
    description: 'Telephone number for payment confirmation calls.',
    type: 'string',
    value: '+91 98234 56789',
    defaultValue: '+91 98000 00000',
    impactedTabs: ['Invoices']
  },
  {
    id: 'c49',
    key: 'org.multi_branch_mode',
    category: 'Multi-Company & Entity',
    title: 'Enable Multi-Branch Warehousing & Plants',
    description: 'Activates branch-level filtering and inter-branch material transfers.',
    type: 'boolean',
    value: false,
    defaultValue: false,
    impactedTabs: ['Inventory', 'Dispatch']
  },
  {
    id: 'c50',
    key: 'org.default_branch_id',
    category: 'Multi-Company & Entity',
    title: 'Default Operating Branch',
    description: 'Primary warehouse selected during order entry.',
    type: 'string',
    value: 'BRANCH_MAIN',
    defaultValue: 'BRANCH_MAIN',
    impactedTabs: ['Inventory', 'Sales']
  },
  {
    id: 'c51',
    key: 'org.export_sez_billing',
    category: 'Multi-Company & Entity',
    title: 'Enable SEZ / Zero-Rated Export Invoicing',
    description: 'Permits generating invoices with LUT bonds without IGST payment.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Invoices', 'Sales']
  },
  {
    id: 'c52',
    key: 'org.lut_bond_number',
    category: 'Multi-Company & Entity',
    title: 'Export LUT Bond Registration Number',
    description: 'Letter of Undertaking reference number for zero-rated duty exports.',
    type: 'string',
    value: 'LUT/PUN/2026-27/00482',
    defaultValue: '',
    impactedTabs: ['Invoices']
  },
  {
    id: 'c53',
    key: 'org.auto_sync_master_data',
    category: 'Multi-Company & Entity',
    title: 'Auto-Sync Master Ledger Data Across Nodes',
    description: 'Synchronizes party directories and price catalogs with branch warehouses.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['All Modules']
  },
  {
    id: 'c54',
    key: 'org.max_tenants_allowed',
    category: 'Multi-Company & Entity',
    title: 'Maximum Subsidiary Companies Allowed',
    description: 'Quota of company legal profiles that can be created in this ERP instance.',
    type: 'number',
    value: 5,
    defaultValue: 5,
    impactedTabs: ['Settings']
  },
  {
    id: 'c55',
    key: 'org.data_isolation_level',
    category: 'Multi-Company & Entity',
    title: 'Multi-Tenant Data Isolation Strategy',
    description: 'Architecture strategy used for separating client company records.',
    type: 'select',
    value: 'discriminator_column',
    defaultValue: 'discriminator_column',
    options: ['discriminator_column (High Performance)', 'schema_per_tenant', 'database_per_tenant'],
    impactedTabs: ['Database', 'Architecture']
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. INVOICING, TAX & FINANCIAL ENGINE (35 OPTIONS)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'c56',
    key: 'inv.prefix',
    category: 'Invoicing, Tax & Currency',
    title: 'Sales Tax Invoice Prefix Format',
    description: 'Alphanumeric prefix prepended before sequential invoice numbers.',
    type: 'string',
    value: 'FA/26-27/',
    defaultValue: 'INV/26-27/',
    impactedTabs: ['Invoices', 'Billing Hub']
  },
  {
    id: 'c57',
    key: 'inv.padding_digits',
    category: 'Invoicing, Tax & Currency',
    title: 'Sequential Invoice Number Padding',
    description: 'Number of leading zeroes in invoice sequence (e.g. 4 gives 0042, 6 gives 000042).',
    type: 'select',
    value: '4',
    defaultValue: '4',
    options: ['3 digits (001)', '4 digits (0001)', '5 digits (00001)', '6 digits (000001)'],
    impactedTabs: ['Invoices']
  },
  {
    id: 'c58',
    key: 'inv.starting_number',
    category: 'Invoicing, Tax & Currency',
    title: 'Financial Year Starting Sequence',
    description: 'Initial invoice sequence number starting on April 1st.',
    type: 'number',
    value: 1,
    defaultValue: 1,
    impactedTabs: ['Invoices']
  },
  {
    id: 'c59',
    key: 'inv.auto_gst_detection',
    category: 'Invoicing, Tax & Currency',
    title: 'Automatic Interstate (IGST vs CGST+SGST) Detection',
    description: 'Compares buyer GST state code against company state code to automatically pick tax split.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Invoices', 'Sales']
  },
  {
    id: 'c60',
    key: 'inv.default_gst_rate',
    category: 'Invoicing, Tax & Currency',
    title: 'Standard Default Product GST Slab',
    description: 'Standard GST tax rate percentage applied when not overridden on item master.',
    type: 'select',
    value: '18',
    defaultValue: '18',
    options: ['0% (Exempt)', '5%', '12%', '18% (Standard Industrial)', '28%'],
    unit: '%',
    impactedTabs: ['Invoices', 'Sales']
  },
  {
    id: 'c61',
    key: 'inv.hsn_crates_standard',
    category: 'Invoicing, Tax & Currency',
    title: 'Standard Product HSN / SAC Code',
    description: 'Harmonized System of Nomenclature code printed on commercial invoices.',
    type: 'string',
    value: '39231090',
    defaultValue: '39231090',
    impactedTabs: ['Invoices', 'Inventory']
  },
  {
    id: 'c62',
    key: 'inv.reverse_charge_mechanism',
    category: 'Invoicing, Tax & Currency',
    title: 'Enable Reverse Charge (RCM) Field',
    description: 'Allows flagging invoices under Section 9(3) / 9(4) of CGST Act.',
    type: 'boolean',
    value: false,
    defaultValue: false,
    impactedTabs: ['Invoices']
  },
  {
    id: 'c63',
    key: 'inv.tcs_applicable_threshold',
    category: 'Invoicing, Tax & Currency',
    title: 'TCS u/s 206C(1H) Annual Turnover Threshold',
    description: 'Threshold in INR after which 0.1% Tax Collected at Source is levied.',
    type: 'number',
    value: 50000000,
    defaultValue: 50000000,
    unit: 'INR',
    impactedTabs: ['Invoices']
  },
  {
    id: 'c64',
    key: 'inv.einvoice_irn_enabled',
    category: 'Invoicing, Tax & Currency',
    title: 'Enable Government E-Invoice IRN Integration',
    description: 'Generates 64-character Invoice Reference Number (IRN) and signed QR code.',
    type: 'boolean',
    value: false,
    defaultValue: false,
    impactedTabs: ['Invoices', 'Developer']
  },
  {
    id: 'c65',
    key: 'inv.eway_bill_mandatory_limit',
    category: 'Invoicing, Tax & Currency',
    title: 'Mandatory E-Way Bill Consignment Value Ceiling',
    description: 'Consignment invoice value in INR requiring mandatory e-Way bill issuance.',
    type: 'number',
    value: 50000,
    defaultValue: 50000,
    unit: 'INR',
    impactedTabs: ['Dispatch', 'Invoices']
  },
  {
    id: 'c66',
    key: 'inv.default_credit_days',
    category: 'Invoicing, Tax & Currency',
    title: 'Standard Default Payment Terms',
    description: 'Default credit maturity duration allowed for new commercial accounts.',
    type: 'select',
    value: '30',
    defaultValue: '30',
    options: ['0 (Immediate Cash/Advance)', '7 Days', '15 Days', '30 Days (Standard)', '45 Days', '60 Days'],
    unit: 'Days',
    impactedTabs: ['Parties', 'Sales', 'Invoices']
  },
  {
    id: 'c67',
    key: 'inv.credit_limit_strict_enforcement',
    category: 'Invoicing, Tax & Currency',
    title: 'Hard Stop on Over-Credit Limit Parties',
    description: 'Strictly blocks new sales order dispatch if outstanding dues exceed party credit limit.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Sales', 'Dispatch']
  },
  {
    id: 'c68',
    key: 'inv.overdue_interest_rate_pct',
    category: 'Invoicing, Tax & Currency',
    title: 'Annual Delayed Payment Interest Rate',
    description: 'Penal interest percentage computed on overdue balances past maturity date.',
    type: 'number',
    value: 18.0,
    defaultValue: 18.0,
    unit: '% p.a.',
    impactedTabs: ['Payments', 'Reports']
  },
  {
    id: 'c69',
    key: 'inv.allow_cash_settlement',
    category: 'Invoicing, Tax & Currency',
    title: 'Allow Direct Cash Receipts',
    description: 'Permits cash mode in payment registry up to statutory Section 269ST limit (Rs. 2 Lakh).',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Payments']
  },
  {
    id: 'c70',
    key: 'inv.razorpay_gateway_enabled',
    category: 'Invoicing, Tax & Currency',
    title: 'Enable Razorpay PG Payment Links',
    description: 'Sends instant payment collection links via SMS & WhatsApp.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Payments', 'Notifications']
  },
  {
    id: 'c71',
    key: 'inv.upi_qr_dynamic_generation',
    category: 'Invoicing, Tax & Currency',
    title: 'Embed Dynamic Bharat UPI QR Code on Invoices',
    description: 'Binds invoice number and exact net payable amount into printed UPI QR.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Invoices']
  },
  {
    id: 'c72',
    key: 'inv.roundoff_net_amount',
    category: 'Invoicing, Tax & Currency',
    title: 'Auto-Round Net Payable to Nearest Rupee',
    description: 'Eliminates fractional paise on invoice grand totals with Round-Off adjustment line.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Invoices', 'Sales']
  },
  {
    id: 'c73',
    key: 'inv.discount_mode',
    category: 'Invoicing, Tax & Currency',
    title: 'Permitted Commercial Discount Structures',
    description: 'Determines whether discounts are calculated per item or on invoice subtotal.',
    type: 'select',
    value: 'both',
    defaultValue: 'both',
    options: ['item_level_only', 'invoice_subtotal_only', 'both'],
    impactedTabs: ['Sales', 'Invoices']
  },
  {
    id: 'c74',
    key: 'inv.auto_email_invoice_pdf',
    category: 'Invoicing, Tax & Currency',
    title: 'Auto-Dispatch Invoice PDF upon Approval',
    description: 'Automatically emails signed tax invoice PDF to party billing email.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Invoices', 'Notifications']
  },
  {
    id: 'c75',
    key: 'inv.auto_whatsapp_invoice_alert',
    category: 'Invoicing, Tax & Currency',
    title: 'Auto-Send WhatsApp Invoice Notification',
    description: 'Dispatches WhatsApp Business API template with PDF download link.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Invoices', 'Notifications']
  },
  {
    id: 'c76',
    key: 'inv.sales_order_mandatory_for_invoice',
    category: 'Invoicing, Tax & Currency',
    title: 'Require Sales Order Reference for Invoicing',
    description: 'Enforces that every tax invoice originates from an approved sales order.',
    type: 'boolean',
    value: false,
    defaultValue: false,
    impactedTabs: ['Invoices', 'Sales']
  },
  {
    id: 'c77',
    key: 'inv.auto_reconcile_bank_credits',
    category: 'Invoicing, Tax & Currency',
    title: 'Bank Statement Auto-Matching (FIFO)',
    description: 'Automatically matches bank inward deposits against oldest outstanding customer invoices.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Payments', 'Bank']
  },
  {
    id: 'c78',
    key: 'inv.credit_note_prefix',
    category: 'Invoicing, Tax & Currency',
    title: 'Credit Note Prefix Format',
    description: 'Sequential identifier prefix for sales returns and rate adjustments.',
    type: 'string',
    value: 'CN/26-27/',
    defaultValue: 'CN/26-27/',
    impactedTabs: ['Invoices']
  },
  {
    id: 'c79',
    key: 'inv.debit_note_prefix',
    category: 'Invoicing, Tax & Currency',
    title: 'Debit Note Prefix Format',
    description: 'Sequential identifier prefix for vendor rate difference vouchers.',
    type: 'string',
    value: 'DN/26-27/',
    defaultValue: 'DN/26-27/',
    impactedTabs: ['Vendors']
  },
  {
    id: 'c80',
    key: 'inv.proforma_invoice_prefix',
    category: 'Invoicing, Tax & Currency',
    title: 'Proforma Quotation Prefix',
    description: 'Sequence prefix for non-binding proforma commercial estimates.',
    type: 'string',
    value: 'PI/26-27/',
    defaultValue: 'PI/26-27/',
    impactedTabs: ['Sales']
  },
  {
    id: 'c81',
    key: 'inv.print_bank_account_choice',
    category: 'Invoicing, Tax & Currency',
    title: 'Default Bank Account on Printouts',
    description: 'Designates which bank profile coordinates are stamped on printed bills.',
    type: 'select',
    value: 'primary_bank',
    defaultValue: 'primary_bank',
    options: ['primary_bank', 'secondary_bank', 'all_active_banks'],
    impactedTabs: ['Invoices']
  },
  {
    id: 'c82',
    key: 'inv.gst_composition_scheme_support',
    category: 'Invoicing, Tax & Currency',
    title: 'Support Composition Scheme Vendors',
    description: 'Permits processing Bill of Supply vouchers without input tax credit (ITC).',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Vendors', 'Invoices']
  },
  {
    id: 'c83',
    key: 'inv.invoice_cancellation_window_hrs',
    category: 'Invoicing, Tax & Currency',
    title: 'Invoice Void / Cancellation Permitted Window',
    description: 'Hours after invoice generation during which accountant can void the invoice.',
    type: 'number',
    value: 24,
    defaultValue: 24,
    unit: 'Hours',
    impactedTabs: ['Invoices']
  },
  {
    id: 'c84',
    key: 'inv.require_reason_for_void',
    category: 'Invoicing, Tax & Currency',
    title: 'Mandatory Reason Log for Voided Invoices',
    description: 'Requires entering explanation and audit reason prior to cancelling any invoice.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Invoices', 'Audit Logs']
  },
  {
    id: 'c85',
    key: 'inv.freight_charge_taxable',
    category: 'Invoicing, Tax & Currency',
    title: 'Apply GST on Freight / Transport Charges',
    description: 'Levies standard 18% GST on delivery freight added to commercial invoices.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Invoices', 'Dispatch']
  },
  {
    id: 'c86',
    key: 'inv.advance_payment_mandatory_pct',
    category: 'Invoicing, Tax & Currency',
    title: 'Advance Deposit Required for New Clients',
    description: 'Percentage of order value required in bank before scheduling production.',
    type: 'number',
    value: 25,
    defaultValue: 0,
    unit: '%',
    impactedTabs: ['Sales', 'Payments']
  },
  {
    id: 'c87',
    key: 'inv.multi_currency_exchange_rates',
    category: 'Invoicing, Tax & Currency',
    title: 'Enable Multi-Currency Export Orders',
    description: 'Permits billing in USD/EUR with RBI reference exchange conversion rates.',
    type: 'boolean',
    value: false,
    defaultValue: false,
    impactedTabs: ['Sales', 'Invoices']
  },
  {
    id: 'c88',
    key: 'inv.einvoice_sandbox_mode',
    category: 'Invoicing, Tax & Currency',
    title: 'NIC E-Invoice Test Sandbox Mode',
    description: 'Directs e-Invoice API payloads to NIC testing endpoints rather than production.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Developer']
  },
  {
    id: 'c89',
    key: 'inv.require_customer_po_number',
    category: 'Invoicing, Tax & Currency',
    title: 'Mandatory Customer Purchase Order (PO) Number',
    description: 'Requires entering buyer PO number prior to generating commercial invoice.',
    type: 'boolean',
    value: false,
    defaultValue: false,
    impactedTabs: ['Sales', 'Invoices']
  },
  {
    id: 'c90',
    key: 'inv.print_original_duplicate_triplicate',
    category: 'Invoicing, Tax & Currency',
    title: 'Print Multi-Copy Banner (Original / Duplicate / Triplicate)',
    description: 'Prints "Original for Recipient", "Duplicate for Transporter", "Triplicate for Supplier".',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Invoices']
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. MANUFACTURING & SHOP FLOOR (30 OPTIONS)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'c91',
    key: 'mfg.batch_prefix',
    category: 'Manufacturing & Shop Floor',
    title: 'Production Batch Code Prefix',
    description: 'Prefix used for daily production batch runs (e.g. PPD-20261005-M01).',
    type: 'string',
    value: 'PPD-',
    defaultValue: 'BATCH-',
    impactedTabs: ['Production', 'Machines']
  },
  {
    id: 'c92',
    key: 'mfg.scrap_allowance_pct',
    category: 'Manufacturing & Shop Floor',
    title: 'Standard Scrap & Purging Allowance',
    description: 'Allowable percentage of raw material loss during machine start-up and purging.',
    type: 'number',
    value: 3.0,
    defaultValue: 3.0,
    unit: '%',
    impactedTabs: ['Production', 'Raw Materials']
  },
  {
    id: 'c93',
    key: 'mfg.shift_count',
    category: 'Manufacturing & Shop Floor',
    title: 'Plant Operating Shifts per Day',
    description: 'Number of discrete 8-hour or 12-hour shifts scheduled on the production floor.',
    type: 'select',
    value: '2',
    defaultValue: '2',
    options: ['1 Shift (General)', '2 Shifts (Day / Night)', '3 Shifts (24x7 Round the Clock)'],
    impactedTabs: ['Production', 'Salaries']
  },
  {
    id: 'c94',
    key: 'mfg.shift1_start',
    category: 'Manufacturing & Shop Floor',
    title: 'Shift 1 (Day Shift) Commencement Time',
    description: 'Morning shift start timestamp.',
    type: 'string',
    value: '08:00 AM',
    defaultValue: '08:00 AM',
    impactedTabs: ['Production']
  },
  {
    id: 'c95',
    key: 'mfg.shift2_start',
    category: 'Manufacturing & Shop Floor',
    title: 'Shift 2 (Night Shift) Commencement Time',
    description: 'Evening shift start timestamp.',
    type: 'string',
    value: '08:00 PM',
    defaultValue: '08:00 PM',
    impactedTabs: ['Production']
  },
  {
    id: 'c96',
    key: 'mfg.machine_oee_target_pct',
    category: 'Manufacturing & Shop Floor',
    title: 'Target Overall Equipment Effectiveness (OEE)',
    description: 'Benchmark percentage target for machine availability, performance, and quality.',
    type: 'number',
    value: 85.0,
    defaultValue: 85.0,
    unit: '%',
    impactedTabs: ['Production', 'Machines']
  },
  {
    id: 'c97',
    key: 'mfg.cycle_time_alert_threshold_sec',
    category: 'Manufacturing & Shop Floor',
    title: 'Cycle Time Deviation Alert Threshold',
    description: 'Seconds of cycle delay beyond which shop floor alarm triggers.',
    type: 'number',
    value: 5,
    defaultValue: 5,
    unit: 'Seconds',
    impactedTabs: ['Machines']
  },
  {
    id: 'c98',
    key: 'mfg.tare_weight_validation_enabled',
    category: 'Manufacturing & Shop Floor',
    title: 'Strict Crate Tare Weight Tolerance Checking',
    description: 'Verifies produced unit weight against nominal target within +/- 15 grams.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Production']
  },
  {
    id: 'c99',
    key: 'mfg.weight_tolerance_grams',
    category: 'Manufacturing & Shop Floor',
    title: 'Allowable Weight Tolerance Window',
    description: 'Grams deviation allowed from standard crate design weight (e.g. 1850g +/- 20g).',
    type: 'number',
    value: 20,
    defaultValue: 20,
    unit: 'Grams',
    impactedTabs: ['Production']
  },
  {
    id: 'c100',
    key: 'mfg.regrind_usage_limit_pct',
    category: 'Manufacturing & Shop Floor',
    title: 'Maximum Regrind / Recycled Polymer Ratio',
    description: 'Upper threshold percentage of crushed scrap allowed in virgin polymer mix.',
    type: 'number',
    value: 20.0,
    defaultValue: 20.0,
    unit: '%',
    impactedTabs: ['Production', 'Raw Materials']
  },
  {
    id: 'c101',
    key: 'mfg.auto_deduct_raw_materials',
    category: 'Manufacturing & Shop Floor',
    title: 'Auto-Deduct Raw Material Inventory on Production Entry',
    description: 'Automatically consumes polymer granules from stock based on batch crate count and unit weight.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Production', 'Inventory', 'Raw Materials']
  },
  {
    id: 'c102',
    key: 'mfg.mandatory_qc_inspection',
    category: 'Manufacturing & Shop Floor',
    title: 'Mandatory QC Clearance before Stock Inward',
    description: 'Batches remain in "QC Pending" status until Quality Inspector signs inspection ticket.',
    type: 'boolean',
    value: false,
    defaultValue: false,
    impactedTabs: ['Production', 'Inventory']
  },
  {
    id: 'c103',
    key: 'mfg.mould_shot_counter_warning_limit',
    category: 'Manufacturing & Shop Floor',
    title: 'Mould Maintenance Preventive Shot Warning Interval',
    description: 'Total injection shots after which tool room maintenance preventive check is mandated.',
    type: 'number',
    value: 100000,
    defaultValue: 100000,
    unit: 'Shots',
    impactedTabs: ['Machines']
  },
  {
    id: 'c104',
    key: 'mfg.power_meter_integration',
    category: 'Manufacturing & Shop Floor',
    title: 'Enable IoT Energy Meter Power Consumption Tracking',
    description: 'Captures kWh consumed per production batch to calculate accurate per-crate energy cost.',
    type: 'boolean',
    value: false,
    defaultValue: false,
    impactedTabs: ['Machines', 'Expenses']
  },
  {
    id: 'c105',
    key: 'mfg.electricity_unit_rate_inr',
    category: 'Manufacturing & Shop Floor',
    title: 'Industrial Electricity Tariff Rate per kWh',
    description: 'MSEDCL tariff rate per unit for utility cost accounting.',
    type: 'number',
    value: 8.75,
    defaultValue: 8.50,
    unit: '₹ / kWh',
    impactedTabs: ['Expenses', 'Production']
  },
  {
    id: 'c106',
    key: 'mfg.breakdown_sms_alerts',
    category: 'Manufacturing & Shop Floor',
    title: 'Send Instant SMS to Maintenance Team on Machine Breakdown',
    description: 'Dispatches emergency alert when machine status switches to BREAKDOWN.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Machines', 'Notifications']
  },
  {
    id: 'c107',
    key: 'mfg.piece_rate_operator_wages',
    category: 'Manufacturing & Shop Floor',
    title: 'Enable Piece-Rate Production Wages Calculation',
    description: 'Computes operator shift earnings based on verified crates produced.',
    type: 'boolean',
    value: false,
    defaultValue: false,
    impactedTabs: ['Salaries', 'Production']
  },
  {
    id: 'c108',
    key: 'mfg.piece_rate_amount_per_unit',
    category: 'Manufacturing & Shop Floor',
    title: 'Default Piece Rate Incentive per Unit',
    description: 'Rupees credited to operator balance per acceptable crate completed.',
    type: 'number',
    value: 1.50,
    defaultValue: 1.50,
    unit: '₹ / Unit',
    impactedTabs: ['Salaries']
  },
  {
    id: 'c109',
    key: 'mfg.masterbatch_ratio_pct',
    category: 'Manufacturing & Shop Floor',
    title: 'Standard Color Masterbatch Dosing Percentage',
    description: 'Percentage of color pigment added per batch.',
    type: 'number',
    value: 1.5,
    defaultValue: 1.5,
    unit: '%',
    impactedTabs: ['Raw Materials', 'Production']
  },
  {
    id: 'c110',
    key: 'mfg.barcode_label_on_batch_completion',
    category: 'Manufacturing & Shop Floor',
    title: 'Auto-Print Barcode Label on Batch Entry',
    description: 'Directs Zebra/TSC thermal printer to spit pallet barcode labels upon batch save.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Production', 'Inventory']
  },
  {
    id: 'c111',
    key: 'mfg.thermal_printer_ip',
    category: 'Manufacturing & Shop Floor',
    title: 'Shop Floor Thermal Barcode Printer IP',
    description: 'Network IP address of TSC/Zebra pallet barcode label printer.',
    type: 'string',
    value: '192.168.1.185',
    defaultValue: '192.168.1.100',
    impactedTabs: ['Production']
  },
  {
    id: 'c112',
    key: 'mfg.allow_negative_raw_material_stock',
    category: 'Manufacturing & Shop Floor',
    title: 'Block Production when Granules Stock is Depleted',
    description: 'Prevents entering production if raw material theoretical stock is zero.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Production', 'Raw Materials']
  },
  {
    id: 'c113',
    key: 'mfg.chiller_temp_operating_range',
    category: 'Manufacturing & Shop Floor',
    title: 'Mold Chiller Water Temperature Setpoint',
    description: 'Target chilled water supply temperature for rapid mold cooling.',
    type: 'number',
    value: 12,
    defaultValue: 12,
    unit: '°C',
    impactedTabs: ['Machines']
  },
  {
    id: 'c114',
    key: 'mfg.injection_pressure_max_bar',
    category: 'Manufacturing & Shop Floor',
    title: 'Hydraulic System Safety Pressure Limit',
    description: 'Maximum bar pressure allowed before safety relief valve trip.',
    type: 'number',
    value: 175,
    defaultValue: 175,
    unit: 'Bar',
    impactedTabs: ['Machines']
  },
  {
    id: 'c115',
    key: 'mfg.auto_generate_batch_serial',
    category: 'Manufacturing & Shop Floor',
    title: 'Auto-Generate Sequential Pallet Serial Numbers',
    description: 'Generates unique serialized numbers for every pallet of 50 crates.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Production', 'Inventory']
  },
  {
    id: 'c116',
    key: 'mfg.pallet_standard_crate_capacity',
    category: 'Manufacturing & Shop Floor',
    title: 'Standard Pallet Unit Stacking Capacity',
    description: 'Number of nested crates stacked onto one standard wooden/plastic pallet.',
    type: 'number',
    value: 50,
    defaultValue: 50,
    unit: 'Crates / Pallet',
    impactedTabs: ['Inventory', 'Dispatch']
  },
  {
    id: 'c117',
    key: 'mfg.record_machine_downtime_reasons',
    category: 'Manufacturing & Shop Floor',
    title: 'Enforce Reason Categorization for Machine Stoppages',
    description: 'Requires selecting category (No Power, Mold Jam, Heater Fault, No Material).',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Machines']
  },
  {
    id: 'c118',
    key: 'mfg.default_injection_machine_id',
    category: 'Manufacturing & Shop Floor',
    title: 'Default Selected Machine on Batch Form',
    description: 'Pre-selects high-volume workhorse machine during quick entry.',
    type: 'string',
    value: 'M01',
    defaultValue: 'M01',
    impactedTabs: ['Production']
  },
  {
    id: 'c119',
    key: 'mfg.allow_manual_timestamp_override',
    category: 'Manufacturing & Shop Floor',
    title: 'Allow Operator to Backdate Production Batches',
    description: 'Permits recording delayed shift data from previous calendar days.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Production']
  },
  {
    id: 'c120',
    key: 'mfg.daily_production_target_crates',
    category: 'Manufacturing & Shop Floor',
    title: 'Daily Plant Target Production Volume',
    description: 'Target crates per day used to calculate progress gauge on manager dashboard.',
    type: 'number',
    value: 2500,
    defaultValue: 2000,
    unit: 'Crates / Day',
    impactedTabs: ['Dashboard', 'Production']
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5. INVENTORY & RAW MATERIALS (25 OPTIONS)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'c121',
    key: 'inv.valuation_method',
    category: 'Inventory & Raw Materials',
    title: 'Inventory Valuation Costing Method',
    description: 'Accounting algorithm used for valuing warehouse inventory assets.',
    type: 'select',
    value: 'FIFO',
    defaultValue: 'FIFO',
    options: ['FIFO (First-In, First-Out)', 'Weighted Average Cost', 'LIFO', 'Standard Fixed Cost'],
    impactedTabs: ['Inventory', 'Reports']
  },
  {
    id: 'c122',
    key: 'inv.reorder_alert_threshold',
    category: 'Inventory & Raw Materials',
    title: 'Global Reorder Safety Stock Minimum Limit',
    description: 'Quantity below which amber low-stock alert triggers on inventory table.',
    type: 'number',
    value: 200,
    defaultValue: 200,
    unit: 'Units',
    impactedTabs: ['Inventory']
  },
  {
    id: 'c123',
    key: 'inv.auto_grn_generation',
    category: 'Inventory & Raw Materials',
    title: 'Auto-Generate Goods Receipt Note (GRN) on Delivery Inward',
    description: 'Creates verified GRN voucher upon recording vendor material inward.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Raw Materials', 'Vendors']
  },
  {
    id: 'c124',
    key: 'inv.grn_prefix',
    category: 'Inventory & Raw Materials',
    title: 'Goods Receipt Note (GRN) Sequence Prefix',
    description: 'Alphanumeric prefix for raw material gate inward vouchers.',
    type: 'string',
    value: 'GRN/26-27/',
    defaultValue: 'GRN/26-27/',
    impactedTabs: ['Raw Materials']
  },
  {
    id: 'c125',
    key: 'inv.raw_material_bag_weight_kg',
    category: 'Inventory & Raw Materials',
    title: 'Standard Polymer Bag Net Weight',
    description: 'Standard packaged weight of virgin granule sacks (typically 25 kg).',
    type: 'number',
    value: 25.0,
    defaultValue: 25.0,
    unit: 'Kg / Bag',
    impactedTabs: ['Raw Materials']
  },
  {
    id: 'c126',
    key: 'inv.moisture_test_required',
    category: 'Inventory & Raw Materials',
    title: 'Require Polymer Moisture Lab Verification',
    description: 'Blocks loading granule lot into machine hopper if moisture exceeds 0.02%.',
    type: 'boolean',
    value: false,
    defaultValue: false,
    impactedTabs: ['Raw Materials']
  },
  {
    id: 'c127',
    key: 'inv.batch_expiry_tracking',
    category: 'Inventory & Raw Materials',
    title: 'Track Granule & Chemical Shelf-Life Expiry',
    description: 'Enforces expiry date entry on inward masterbatch and additive lots.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Raw Materials', 'Inventory']
  },
  {
    id: 'c128',
    key: 'inv.batch_expiry_warning_days',
    category: 'Inventory & Raw Materials',
    title: 'Pre-Expiry Warning Window',
    description: 'Lead days prior to shelf-life expiration when alert appears on inventory cards.',
    type: 'number',
    value: 30,
    defaultValue: 30,
    unit: 'Days',
    impactedTabs: ['Inventory']
  },
  {
    id: 'c129',
    key: 'inv.barcode_standard',
    category: 'Inventory & Raw Materials',
    title: 'Warehouse Barcode Symbology Format',
    description: 'Standard barcode symbology for crate labels and bin rack tags.',
    type: 'select',
    value: 'CODE128',
    defaultValue: 'CODE128',
    options: ['CODE128 (Industrial Standard)', 'QR Code (2D High Density)', 'EAN-13 (Retail Standard)', 'DataMatrix (Compact)'],
    impactedTabs: ['Inventory', 'Production']
  },
  {
    id: 'c130',
    key: 'inv.allow_direct_stock_adjustment',
    category: 'Inventory & Raw Materials',
    title: 'Allow Manual Physical Stock Audit Adjustments',
    description: 'Permits warehouse manager to record physical audit reconciliations with reasons.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Inventory']
  },
  {
    id: 'c131',
    key: 'inv.crate_color_variants',
    category: 'Inventory & Raw Materials',
    title: 'Active Product Color Catalog',
    description: 'Selectable commercial colors for manufactured crates.',
    type: 'string',
    value: 'Red, Blue, Green, Yellow, Black (Recycled), Milky White',
    defaultValue: 'Red, Blue, Green, Black',
    impactedTabs: ['Inventory', 'Sales']
  },
  {
    id: 'c132',
    key: 'inv.dead_stock_days_threshold',
    category: 'Inventory & Raw Materials',
    title: 'Slow-Moving / Dead Stock Idle Threshold',
    description: 'Days with zero inward/outward movement before item is tagged as Slow Moving.',
    type: 'number',
    value: 90,
    defaultValue: 90,
    unit: 'Days',
    impactedTabs: ['Inventory', 'Reports']
  },
  {
    id: 'c133',
    key: 'inv.warehouse_bay_rack_bin_system',
    category: 'Inventory & Raw Materials',
    title: 'Enable Multi-Tier Bin / Bay / Rack Address Tracking',
    description: 'Tracks precise warehouse coordinates (e.g. A-02-B) for every crate pallet.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Inventory']
  },
  {
    id: 'c134',
    key: 'inv.vendor_rating_algorithm',
    category: 'Inventory & Raw Materials',
    title: 'Auto-Compute Vendor Performance Scorecards',
    description: 'Calculates supplier ratings based on delivery punctuality, tare weight, and rejected sacks.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Vendors']
  },
  {
    id: 'c135',
    key: 'inv.vendor_credit_days_default',
    category: 'Inventory & Raw Materials',
    title: 'Standard Vendor Payment Credit Period',
    description: 'Default settlement days negotiated with raw material petrochemical suppliers.',
    type: 'number',
    value: 45,
    defaultValue: 30,
    unit: 'Days',
    impactedTabs: ['Vendors', 'Payments']
  },
  {
    id: 'c136',
    key: 'inv.petrochemical_price_index_sync',
    category: 'Inventory & Raw Materials',
    title: 'Track Reliance / IOCL Polymer Index Benchmarks',
    description: 'Logs international PP/HDPE polymer pricing trends against purchase costs.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Raw Materials', 'Analytics']
  },
  {
    id: 'c137',
    key: 'inv.stock_quarantine_zone',
    category: 'Inventory & Raw Materials',
    title: 'Enable Quarantine Storage Zone for Suspect Lots',
    description: 'Holds defective production crates in locked quarantine buffer pending re-grinding.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Inventory']
  },
  {
    id: 'c138',
    key: 'inv.min_buffer_stock_tons',
    category: 'Inventory & Raw Materials',
    title: 'Minimum Polymer Safety Buffer Stock',
    description: 'Target minimum metric tons of HDPE/PP granules kept in silo storage.',
    type: 'number',
    value: 15.0,
    defaultValue: 10.0,
    unit: 'Metric Tons',
    impactedTabs: ['Raw Materials']
  },
  {
    id: 'c139',
    key: 'inv.track_crate_tare_weight_in_inventory',
    category: 'Inventory & Raw Materials',
    title: 'Display Individual Crate Weight on Inventory Cards',
    description: 'Shows tare weight (e.g. 1.82 kg) alongside piece counts.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Inventory']
  },
  {
    id: 'c140',
    key: 'inv.enable_asset_depreciation_tracker',
    category: 'Inventory & Raw Materials',
    title: 'Mould & Machine Capital Asset Depreciation',
    description: 'Calculates straight-line monthly depreciation for injection machines and molds.',
    type: 'boolean',
    value: false,
    defaultValue: false,
    impactedTabs: ['Machines', 'Reports']
  },
  {
    id: 'c141',
    key: 'inv.low_stock_whatsapp_alerts',
    category: 'Inventory & Raw Materials',
    title: 'WhatsApp Alert to Purchase Officer on Low Stock',
    description: 'Sends automated WhatsApp notification when polymer stock breaches reorder level.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Raw Materials', 'Notifications']
  },
  {
    id: 'c142',
    key: 'inv.regrind_cost_factor_pct',
    category: 'Inventory & Raw Materials',
    title: 'Internal Regrind Scrap Costing Factor',
    description: 'Valuation percentage applied to re-crushed scrap relative to virgin granules (e.g. 60%).',
    type: 'number',
    value: 65,
    defaultValue: 60,
    unit: '%',
    impactedTabs: ['Raw Materials', 'Production']
  },
  {
    id: 'c143',
    key: 'inv.max_warehouse_capacity_crates',
    category: 'Inventory & Raw Materials',
    title: 'Finished Goods Warehouse Stacking Capacity',
    description: 'Total crate storage capacity limit for finished goods yard.',
    type: 'number',
    value: 50000,
    defaultValue: 40000,
    unit: 'Crates',
    impactedTabs: ['Inventory', 'Dashboard']
  },
  {
    id: 'c144',
    key: 'inv.auto_suggest_dispatch_lots',
    category: 'Inventory & Raw Materials',
    title: 'FIFO Auto-Pick Recommendation during Dispatch',
    description: 'Suggests oldest manufactured pallet serial numbers during loading.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Dispatch']
  },
  {
    id: 'c145',
    key: 'inv.stock_count_cycle_audit_frequency',
    category: 'Inventory & Raw Materials',
    title: 'Cycle Count Physical Audit Frequency',
    description: 'Target cadence for warehouse physical verification audits.',
    type: 'select',
    value: 'monthly',
    defaultValue: 'monthly',
    options: ['weekly', 'monthly', 'quarterly', 'annual'],
    impactedTabs: ['Inventory']
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 6. LOGISTICS, FREIGHT & DISPATCH (20 OPTIONS)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'c146',
    key: 'dispatch.challan_prefix',
    category: 'Logistics & Dispatch',
    title: 'Delivery Challan (DC) Sequence Prefix',
    description: 'Sequential prefix for official outward transport delivery challans.',
    type: 'string',
    value: 'DC/26-27/',
    defaultValue: 'DC/26-27/',
    impactedTabs: ['Dispatch']
  },
  {
    id: 'c147',
    key: 'dispatch.mandatory_driver_phone',
    category: 'Logistics & Dispatch',
    title: 'Mandatory Driver Phone & License Validation',
    description: 'Requires valid 10-digit mobile number and driving license before gate pass generation.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Dispatch', 'Drivers']
  },
  {
    id: 'c148',
    key: 'dispatch.vehicle_types_catalog',
    category: 'Logistics & Dispatch',
    title: 'Approved Commercial Vehicle Types',
    description: 'Standard transport vehicles for dispatching crate consignments.',
    type: 'string',
    value: 'Tata Ace (400 Crates), 14ft Truck (1,200 Crates), 19ft Truck (2,000 Crates), 32ft Container (4,000 Crates)',
    defaultValue: 'Small Truck, Medium Truck, Large Container',
    impactedTabs: ['Transports', 'Dispatch']
  },
  {
    id: 'c149',
    key: 'dispatch.freight_calculation_mode',
    category: 'Logistics & Dispatch',
    title: 'Default Freight Rate Calculation Formula',
    description: 'Methodology used to calculate transport freight.',
    type: 'select',
    value: 'per_crate',
    defaultValue: 'per_crate',
    options: ['per_crate (e.g. ₹5 / Crate)', 'per_km (e.g. ₹35 / Km)', 'flat_trip_rate', 'to_pay_customer'],
    impactedTabs: ['Dispatch', 'Transports']
  },
  {
    id: 'c150',
    key: 'dispatch.default_freight_per_crate_inr',
    category: 'Logistics & Dispatch',
    title: 'Standard Local Freight Rate per Crate',
    description: 'Baseline freight charged to buyer for delivery within 100 km.',
    type: 'number',
    value: 6.50,
    defaultValue: 5.00,
    unit: '₹ / Crate',
    impactedTabs: ['Dispatch']
  },
  {
    id: 'c151',
    key: 'dispatch.auto_sms_tracking_link',
    category: 'Logistics & Dispatch',
    title: 'Auto-Send Driver Details & Dispatch SMS to Party',
    description: 'Sends vehicle registration number, driver contact, and dispatch time via SMS.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Dispatch', 'Notifications']
  },
  {
    id: 'c152',
    key: 'dispatch.auto_whatsapp_tracking',
    category: 'Logistics & Dispatch',
    title: 'Auto-Send WhatsApp Delivery Challan to Consignee',
    description: 'Dispatches signed PDF copy of delivery challan to buyer WhatsApp.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Dispatch', 'Notifications']
  },
  {
    id: 'c153',
    key: 'dispatch.print_gate_pass_voucher',
    category: 'Logistics & Dispatch',
    title: 'Auto-Generate Security Gate Pass Slip',
    description: 'Prints outward security gate pass with vehicle tare weight and crate count.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Dispatch']
  },
  {
    id: 'c154',
    key: 'dispatch.security_guard_app_pin',
    category: 'Logistics & Dispatch',
    title: 'Security Gate Checkpoint PIN',
    description: '4-digit gatekeeper security PIN for timestamping physical vehicle departure.',
    type: 'string',
    value: '7821',
    defaultValue: '1234',
    impactedTabs: ['Dispatch', 'Security']
  },
  {
    id: 'c155',
    key: 'dispatch.gps_tracking_webhook_enabled',
    category: 'Logistics & Dispatch',
    title: 'Enable Fleet GPS Live Location Webhook',
    description: 'Connects to Wheelseye / LocoNav / GPS tracker telemetry endpoints.',
    type: 'boolean',
    value: false,
    defaultValue: false,
    impactedTabs: ['Transports', 'Developer']
  },
  {
    id: 'c156',
    key: 'dispatch.require_loading_supervisor_sign',
    category: 'Logistics & Dispatch',
    title: 'Require Loading Supervisor Sign-Off',
    description: 'Enforces that dispatch supervisor signs tally count before generating challan.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Dispatch']
  },
  {
    id: 'c157',
    key: 'dispatch.overloading_tolerance_pct',
    category: 'Logistics & Dispatch',
    title: 'Vehicle Capacity Overload Tolerance',
    description: 'Upper percentage threshold allowable above rated truck crate volume.',
    type: 'number',
    value: 5.0,
    defaultValue: 5.0,
    unit: '%',
    impactedTabs: ['Dispatch', 'Transports']
  },
  {
    id: 'c158',
    key: 'dispatch.default_transporter_id',
    category: 'Logistics & Dispatch',
    title: 'Primary Default Logistics Partner',
    description: 'Pre-selects regular fleet contractor during dispatch entry.',
    type: 'string',
    value: 'Kalyan Logistics Pune',
    defaultValue: 'Self Owned Fleet',
    impactedTabs: ['Dispatch', 'Transports']
  },
  {
    id: 'c159',
    key: 'dispatch.driver_license_expiry_block',
    category: 'Logistics & Dispatch',
    title: 'Block Dispatch if Driver License is Expired',
    description: 'Prevents assigning driver if driving license validity date has lapsed.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Drivers', 'Dispatch']
  },
  {
    id: 'c160',
    key: 'dispatch.pod_upload_mandatory',
    category: 'Logistics & Dispatch',
    title: 'Require Proof of Delivery (POD) Image for Invoice Settlement',
    description: 'Requires uploading customer stamped physical challan photo.',
    type: 'boolean',
    value: false,
    defaultValue: false,
    impactedTabs: ['Dispatch', 'Invoices']
  },
  {
    id: 'c161',
    key: 'dispatch.loading_damage_threshold_pct',
    category: 'Logistics & Dispatch',
    title: 'Loading Damage Scrap Threshold',
    description: 'Allowable damage percentage during truck crate strapping and tying.',
    type: 'number',
    value: 0.2,
    defaultValue: 0.2,
    unit: '%',
    impactedTabs: ['Dispatch']
  },
  {
    id: 'c162',
    key: 'dispatch.allow_part_delivery_shipments',
    category: 'Logistics & Dispatch',
    title: 'Allow Partial Shipments against Single Sales Order',
    description: 'Permits dispatching 500 crates today and 500 crates next week against 1,000 order.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Sales', 'Dispatch']
  },
  {
    id: 'c163',
    key: 'dispatch.transporter_tds_applicable',
    category: 'Logistics & Dispatch',
    title: 'Apply Section 194C TDS on Transporter Payments',
    description: 'Deducts 1% or 2% TDS on freight vouchers exceeding statutory thresholds.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Transports', 'Payments']
  },
  {
    id: 'c164',
    key: 'dispatch.interstate_transit_insurance_policy',
    category: 'Logistics & Dispatch',
    title: 'Marine / Road Transit Insurance Policy Number',
    description: 'Transit risk insurance policy number printed on interstate transport challans.',
    type: 'string',
    value: 'OG-26-1901-7001-00004921',
    defaultValue: '',
    impactedTabs: ['Dispatch']
  },
  {
    id: 'c165',
    key: 'dispatch.max_daily_dispatches_allowed',
    category: 'Logistics & Dispatch',
    title: 'Maximum Scheduled Outward Trucks per Day',
    description: 'Loading bay throughput ceiling to avoid plant bottlenecking.',
    type: 'number',
    value: 12,
    defaultValue: 10,
    unit: 'Trucks / Day',
    impactedTabs: ['Dispatch']
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 7. WORKFORCE, PAYROLL & SHIFTS (20 OPTIONS)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'c166',
    key: 'hr.monthly_working_days_divisor',
    category: 'Workforce & Payroll',
    title: 'Monthly Salary Calculation Divisor',
    description: 'Base days divisor used to calculate daily wage rate from monthly CTC.',
    type: 'select',
    value: '26',
    defaultValue: '26',
    options: ['26 Days (Excluding Sundays)', '30 Days (Calendar Standard)', 'Actual Days in Current Month'],
    impactedTabs: ['Salaries']
  },
  {
    id: 'c167',
    key: 'hr.overtime_rate_multiplier',
    category: 'Workforce & Payroll',
    title: 'Statutory Overtime Wage Multiplier',
    description: 'Hourly wage multiplier for shift overtime (Factories Act Section 59 standard is 2.0x).',
    type: 'select',
    value: '2.0',
    defaultValue: '2.0',
    options: ['1.0x (Normal Single Rate)', '1.5x (Time and Half)', '2.0x (Double Rate - Factories Act)'],
    impactedTabs: ['Salaries']
  },
  {
    id: 'c168',
    key: 'hr.provident_fund_pct',
    category: 'Workforce & Payroll',
    title: 'Employee Provident Fund (EPF) Deduction Rate',
    description: 'Mandatory EPF employee deduction percentage on basic wage.',
    type: 'number',
    value: 12.0,
    defaultValue: 12.0,
    unit: '%',
    impactedTabs: ['Salaries']
  },
  {
    id: 'c169',
    key: 'hr.esi_deduction_pct',
    category: 'Workforce & Payroll',
    title: 'Employee State Insurance (ESIC) Deduction Rate',
    description: 'Statutory employee ESI contribution percentage.',
    type: 'number',
    value: 0.75,
    defaultValue: 0.75,
    unit: '%',
    impactedTabs: ['Salaries']
  },
  {
    id: 'c170',
    key: 'hr.professional_tax_state',
    category: 'Workforce & Payroll',
    title: 'Professional Tax (PT) Statutory Slab',
    description: 'State PT deduction slab (e.g. ₹200/month, ₹300 in February for Maharashtra).',
    type: 'select',
    value: 'maharashtra',
    defaultValue: 'maharashtra',
    options: ['maharashtra (Rs. 200/mo)', 'gujarat', 'karnataka', 'none'],
    impactedTabs: ['Salaries']
  },
  {
    id: 'c171',
    key: 'hr.salary_disbursement_day_of_month',
    category: 'Workforce & Payroll',
    title: 'Standard Monthly Salary Disbursement Date',
    description: 'Day of following month when payroll vouchers are generated (Payment of Wages Act).',
    type: 'number',
    value: 7,
    defaultValue: 7,
    unit: 'Day of Month',
    impactedTabs: ['Salaries']
  },
  {
    id: 'c172',
    key: 'hr.biometric_punch_integration',
    category: 'Workforce & Payroll',
    title: 'Enable Biometric Fingerprint / Facial Attendance Sync',
    description: 'Directs eSSL / ZKTeco biometric time-clock devices to push punch logs.',
    type: 'boolean',
    value: false,
    defaultValue: false,
    impactedTabs: ['Employees', 'Developer']
  },
  {
    id: 'c173',
    key: 'hr.advance_salary_max_limit_pct',
    category: 'Workforce & Payroll',
    title: 'Maximum Permitted Salary Advance Limit',
    description: 'Upper percentage of monthly net salary worker can draw as advance loan.',
    type: 'number',
    value: 50.0,
    defaultValue: 50.0,
    unit: '% of Monthly Wage',
    impactedTabs: ['Salaries']
  },
  {
    id: 'c174',
    key: 'hr.advance_recovery_monthly_installments',
    category: 'Workforce & Payroll',
    title: 'Default Salary Advance Recovery Tenure',
    description: 'Standard number of monthly installments to recover employee advances.',
    type: 'number',
    value: 3,
    defaultValue: 2,
    unit: 'Months',
    impactedTabs: ['Salaries']
  },
  {
    id: 'c175',
    key: 'hr.bonus_ex_gratia_annual_pct',
    category: 'Workforce & Payroll',
    title: 'Annual Diwali Statutory Bonus Rate',
    description: 'Payment of Bonus Act percentage computed on annual qualifying wages.',
    type: 'number',
    value: 8.33,
    defaultValue: 8.33,
    unit: '%',
    impactedTabs: ['Salaries']
  },
  {
    id: 'c176',
    key: 'hr.paid_leaves_per_annum',
    category: 'Workforce & Payroll',
    title: 'Annual Earned Leave (EL) Allowance',
    description: 'Privilege leaves credited to full-time confirmed staff members.',
    type: 'number',
    value: 18,
    defaultValue: 18,
    unit: 'Days / Year',
    impactedTabs: ['Employees']
  },
  {
    id: 'c177',
    key: 'hr.casual_leaves_per_annum',
    category: 'Workforce & Payroll',
    title: 'Annual Casual / Sick Leave Allowance',
    description: 'Casual and sick leave quota available for emergency absence.',
    type: 'number',
    value: 12,
    defaultValue: 12,
    unit: 'Days / Year',
    impactedTabs: ['Employees']
  },
  {
    id: 'c178',
    key: 'hr.allow_cash_salary_disbursement',
    category: 'Workforce & Payroll',
    title: 'Permit Cash Wage Disbursement for Helpers',
    description: 'Allows recording cash voucher disbursements for unbanked contract laborers.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Salaries']
  },
  {
    id: 'c179',
    key: 'hr.mandatory_aadhaar_pan_validation',
    category: 'Workforce & Payroll',
    title: 'Enforce Aadhaar & PAN Verification on Hire',
    description: 'Validates 12-digit Aadhaar and 10-digit PAN before activating employee code.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Employees']
  },
  {
    id: 'c180',
    key: 'hr.uniform_safety_shoes_allowance',
    category: 'Workforce & Payroll',
    title: 'Annual Factory PPE & Safety Kit Allowance',
    description: 'Annual allowance credited for steel-toe safety shoes and shop floor helmets.',
    type: 'number',
    value: 2500,
    defaultValue: 2000,
    unit: '₹ / Year',
    impactedTabs: ['Salaries']
  },
  {
    id: 'c181',
    key: 'hr.shift_differential_allowance_inr',
    category: 'Workforce & Payroll',
    title: 'Night Shift Differential Bonus per Shift',
    description: 'Fixed rupee bonus credited for working Graveyard / Night Shift.',
    type: 'number',
    value: 150,
    defaultValue: 100,
    unit: '₹ / Shift',
    impactedTabs: ['Salaries']
  },
  {
    id: 'c182',
    key: 'hr.probation_period_months',
    category: 'Workforce & Payroll',
    title: 'Standard New Hire Probation Period',
    description: 'Evaluation duration before contract staff is confirmed as permanent.',
    type: 'number',
    value: 6,
    defaultValue: 6,
    unit: 'Months',
    impactedTabs: ['Employees']
  },
  {
    id: 'c183',
    key: 'hr.allow_operator_self_service_portal',
    category: 'Workforce & Payroll',
    title: 'Enable Mobile ESS (Employee Self-Service) Portal',
    description: 'Permits shop floor operators to inspect monthly payslips and leave balance on phone.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Employees', 'Salaries']
  },
  {
    id: 'c184',
    key: 'hr.payslip_pdf_password_protected',
    category: 'Workforce & Payroll',
    title: 'Password-Protect Outgoing PDF Payslips',
    description: 'Locks payslip PDF with DOB or first 4 letters of name + year of birth.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Salaries']
  },
  {
    id: 'c185',
    key: 'hr.notice_period_days',
    category: 'Workforce & Payroll',
    title: 'Standard Employee Separation Notice Period',
    description: 'Mandatory notice days required upon resignation.',
    type: 'number',
    value: 30,
    defaultValue: 30,
    unit: 'Days',
    impactedTabs: ['Employees']
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 8. SECURITY, RBAC & AUDIT GOVERNANCE (20 OPTIONS)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'c186',
    key: 'sec.two_factor_auth_enforced',
    category: 'Security & Governance',
    title: 'Enforce Two-Factor (2FA / OTP) Authentication',
    description: 'Mandates SMS or Authenticator TOTP verification on staff login.',
    type: 'boolean',
    value: false,
    defaultValue: false,
    impactedTabs: ['Login', 'Security']
  },
  {
    id: 'c187',
    key: 'sec.session_timeout_minutes',
    category: 'Security & Governance',
    title: 'Idle Session Automatic Logout Timeout',
    description: 'Minutes of operator keyboard inactivity before user session is locked.',
    type: 'number',
    value: 30,
    defaultValue: 30,
    unit: 'Minutes',
    impactedTabs: ['Security', 'All Modules']
  },
  {
    id: 'c188',
    key: 'sec.max_failed_logins_before_lock',
    category: 'Security & Governance',
    title: 'Account Lockout Failed Login Threshold',
    description: 'Consecutive incorrect password attempts before username is suspended.',
    type: 'number',
    value: 5,
    defaultValue: 5,
    unit: 'Attempts',
    impactedTabs: ['Security', 'Login']
  },
  {
    id: 'c189',
    key: 'sec.ip_whitelist_enforcement',
    category: 'Security & Governance',
    title: 'Restrict Access to Plant IP Subnet Whitelist',
    description: 'Strictly blocks access from external public internet unless authorized.',
    type: 'boolean',
    value: false,
    defaultValue: false,
    impactedTabs: ['Security']
  },
  {
    id: 'c190',
    key: 'sec.ip_whitelist_range',
    category: 'Security & Governance',
    title: 'Allowed Factory Static IP Range',
    description: 'Comma-separated CIDR subnets allowed to access root administrative console.',
    type: 'string',
    value: '192.168.1.0/24, 10.0.0.0/16, 127.0.0.1',
    defaultValue: '127.0.0.1',
    impactedTabs: ['Security']
  },
  {
    id: 'c191',
    key: 'sec.audit_log_retention_days',
    category: 'Security & Governance',
    title: 'Immutable Audit Trail Retention Period',
    description: 'Days before historical user click, edit, and deletion records are archived.',
    type: 'select',
    value: '365',
    defaultValue: '365',
    options: ['90 Days', '180 Days', '365 Days (1 Year)', '2555 Days (7 Years - Statutory Statutory Requirement)'],
    impactedTabs: ['Audit Logs']
  },
  {
    id: 'c192',
    key: 'sec.password_minimum_length',
    category: 'Security & Governance',
    title: 'Minimum Password Character Length',
    description: 'Enforces strong password length for newly registered staff accounts.',
    type: 'number',
    value: 8,
    defaultValue: 8,
    unit: 'Characters',
    impactedTabs: ['Security', 'Users']
  },
  {
    id: 'c193',
    key: 'sec.password_require_special_character',
    category: 'Security & Governance',
    title: 'Require Special Symbol (!@#$%) in Password',
    description: 'Mandates inclusion of at least one special punctuation mark.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Security', 'Users']
  },
  {
    id: 'c194',
    key: 'sec.password_expiry_interval_days',
    category: 'Security & Governance',
    title: 'Mandatory Password Rotation Interval',
    description: 'Days after which user is prompted to change credentials (0 disables).',
    type: 'number',
    value: 90,
    defaultValue: 90,
    unit: 'Days',
    impactedTabs: ['Security', 'Users']
  },
  {
    id: 'c195',
    key: 'sec.mask_bank_account_numbers',
    category: 'Security & Governance',
    title: 'Mask Sensitive Bank Accounts for Non-Accountant Roles',
    description: 'Displays bank account numbers as XXXXXXXXXX1234 to prevent unauthorized leaks.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Bank', 'Parties', 'Vendors']
  },
  {
    id: 'c196',
    key: 'sec.mask_employee_salary_for_operators',
    category: 'Security & Governance',
    title: 'Conceal Wage & Salary Totals from Shop Floor Viewers',
    description: 'Hides financial earnings columns when logged in under OPERATOR or VIEWER roles.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Salaries', 'Employees']
  },
  {
    id: 'c197',
    key: 'sec.allow_excel_export_all_roles',
    category: 'Security & Governance',
    title: 'Permit Bulk CSV / Excel Export for Non-Admins',
    description: 'Toggles visibility of "Export CSV" and "Excel" buttons across module tables.',
    type: 'boolean',
    value: false,
    defaultValue: false,
    impactedTabs: ['All Tables']
  },
  {
    id: 'c198',
    key: 'sec.log_all_data_exports',
    category: 'Security & Governance',
    title: 'Audit-Log Every Excel / PDF Export with User Identity & IP',
    description: 'Creates forensic audit trail record whenever table data is downloaded.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Audit Logs']
  },
  {
    id: 'c199',
    key: 'sec.emergency_kill_switch_active',
    category: 'Security & Governance',
    title: 'Global Read-Only Emergency Lockdown Mode',
    description: 'Immediately freezes all financial mutations and data modifications across entire plant.',
    type: 'boolean',
    value: false,
    defaultValue: false,
    impactedTabs: ['All Modules', 'Security']
  },
  {
    id: 'c200',
    key: 'sec.auto_database_backup_cron',
    category: 'Security & Governance',
    title: 'Daily Automated Database mysqldump Backup',
    description: 'Executes automated encrypted SQL backup every night at 02:00 AM.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Governance']
  },
  {
    id: 'c201',
    key: 'sec.backup_retention_days',
    category: 'Security & Governance',
    title: 'Database Backup Archive Retention Window',
    description: 'Number of daily backup archives kept before automatic purging.',
    type: 'number',
    value: 30,
    defaultValue: 30,
    unit: 'Days',
    impactedTabs: ['Governance']
  },
  {
    id: 'c202',
    key: 'sec.ssl_tls_enforced',
    category: 'Security & Governance',
    title: 'Force HTTPS / TLS 1.3 Transport Encryption',
    description: 'Redirects all unencrypted HTTP traffic to secure TLS port.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Gateway', 'Security']
  },
  {
    id: 'c203',
    key: 'sec.rate_limiting_max_req_per_min',
    category: 'Security & Governance',
    title: 'API Rate Limiting Ceiling per IP',
    description: 'Maximum permitted HTTP requests per minute before HTTP 429 Too Many Requests.',
    type: 'number',
    value: 120,
    defaultValue: 120,
    unit: 'Req / Min',
    impactedTabs: ['Gateway', 'Developer']
  },
  {
    id: 'c204',
    key: 'sec.content_security_policy_enforced',
    category: 'Security & Governance',
    title: 'Enforce Strict Content Security Policy (CSP)',
    description: 'Mitigates cross-site scripting (XSS) and unauthorized iframe embedding.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Gateway', 'Security']
  },
  {
    id: 'c205',
    key: 'sec.developer_tools_console_disabled',
    category: 'Security & Governance',
    title: 'Disable Browser F12 Developer Console on Production',
    description: 'Discourages inspecting frontend memory state on public shop floor terminals.',
    type: 'boolean',
    value: false,
    defaultValue: false,
    impactedTabs: ['Security']
  },
  {
    id: 'c206',
    key: 'sec.webhook_hmac_secret_active',
    category: 'Security & Governance',
    title: 'Enforce HMAC-SHA256 Payload Signature on Webhooks',
    description: 'Signs outgoing webhook notifications with cryptographic shared secret.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Developer']
  },
  {
    id: 'c207',
    key: 'sec.sentry_error_reporting_active',
    category: 'Security & Governance',
    title: 'Enable Sentry Application Telemetry Reporting',
    description: 'Transmits unhandled JavaScript exceptions to SRE monitoring dashboard.',
    type: 'boolean',
    value: false,
    defaultValue: false,
    impactedTabs: ['Governance', 'Developer']
  },
  {
    id: 'c208',
    key: 'sec.tenant_branding_switch_unlocked',
    category: 'Security & Governance',
    title: 'Allow Instant Multi-Company Profile Switching',
    description: 'Enables quick-switching between enterprise tenant profiles directly from the executive header.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    impactedTabs: ['Header', 'Settings']
  }
];

// Helper functions for reading and persisting
export function getSavedTenantConfig(): { [key: string]: any } {
  try {
    const raw = localStorage.getItem('futane_tenant_config');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveTenantConfig(config: { [key: string]: any }) {
  try {
    localStorage.setItem('futane_tenant_config', JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save tenant config', e);
  }
}
