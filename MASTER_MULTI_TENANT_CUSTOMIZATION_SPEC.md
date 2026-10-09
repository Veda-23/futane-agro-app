# MASTER MULTI-TENANT & ENTERPRISE CUSTOMIZATION SPECIFICATION
*Document Version: 4.0 | Architectural Standard for Company-Agnostic, Multi-Tenant White-Label Deployment*  
*Futane Agro ERP Engine & Industrial Manufacturing Platform*  
*Author: Lead Enterprise Software Architect & DeepMind Antigravity Engineering*

---

## 1. Executive Mission & System Purpose
This document serves as the **Master Architectural Contract and Implementation Prompt** for operating, extending, and white-labeling the ERP application for **any commercial enterprise, manufacturing plant, trading house, or supply chain organization**.

The platform is engineered so that **zero business logic or UI strings are hardcoded to a single company name**. By leveraging the **200+ Customizations Engine**, **Dynamic Terminology Re-mapper**, and **Vertical Industry Templates**, an administrator or engineer can reconfigure and deploy this ERP for a completely new company or industry sector in **less than 5 minutes**.

---

## 2. Universal Multi-Tenant Architecture & Data Isolation

### 2.1 Isolation Strategy: High-Performance Discriminator Architecture
To operate strictly within the **8 GB RAM hardware budget** (Spring Boot heap $\le 512\text{ MB}$, Node heap $\le 1536\text{ MB}$), multi-tenancy is implemented using a **Tenant Discriminator Architecture**:
- Every relational table contains an indexed `tenant_id VARCHAR(32)` column.
- Spring Boot entity security automatically applies Hibernate filters:
  ```java
  @FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "tenantId", type = String.class))
  @Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
  ```
- All incoming HTTP requests carry the tenant identifier via:
  1. `X-Tenant-ID` HTTP header.
  2. JWT Bearer token claims (`claims.get("tenantId")`).
  3. CNAME / Subdomain resolution (`companyname.futane-erp.com`).

### 2.2 Strict Zero-Tolerance Guardrails
1. **Financial Integrity**: Never alter GST calculation formulas, tax split algorithms (CGST+SGST vs IGST), ledger double-entry debit/credit reconciliation, or statutory rounding rules.
2. **Sequential Numbering**: Invoice and voucher sequences are isolated per tenant and per financial year (e.g. `tenant_id = 'COMP_A'` and `fy = '2026-27'` maintain independent counters).
3. **RAM Ceiling Compliance**:
   - Node V8 Heap: `--max-old-space-size=1536`
   - Spring Boot JVM: `-Xms256m -Xmx512m`
   - HikariCP Connection Pool: Max `8` active connections

---

## 3. Dynamic Terminology & Unit Re-mapping Engine

Different manufacturing sectors describe items, parties, and operations using distinct vocabularies. The application UI uses a centralized Terminology Dictionary that translates core entity names across all 23 tabs:

| Domain Concept | Agri & Crates (Default) | Plastics & Injection Moulding | Textiles & Garments | Automotive Engineering | Pharma & Life Sciences | FMCG & Trading |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Primary Unit** | Crates / Bundles | Pieces (Nos) | Meters / Rolls | Finished Assemblies | Bottles / Strips | Outer Cartons / Cases |
| **Client / Buyer** | Party / Mandi | OEM Client | Buyer / Retail Brand | Tier-1 Auto Client | Hospital / Stockist | Distributor / Super-Stockist |
| **Production Run** | Production Batch | Moulding Lot | Dyeing / Weave Lot | Job Order / Heat No | Clinical Lot / Assay Run | Packing Run |
| **Tool / Fixture** | Mould Code | Die / Tooling Set | Loom / Pattern Spec | CNC Jig / Fixture | Sterile Reactor / Press | Carton Sealer / Line |
| **Raw Material** | HDPE / PP Granules | Polymer Resin / Masterbatch | Yarn / Grey Fabric | Forged Billets / Sheet Metal | API / Excipients | Finished Bulk Stock |
| **Dispatch Unit** | Pallets / Crates | Corrugated Boxes | Bales / Fabric Rolls | Wooden Crates / Pallets | Shipper Cases | Corrugated Master Cases |

---

## 4. The 6 Vertical Industry Templates

Administrators can switch the entire ERP operational profile with a **single click** via the **200+ Customizations Hub**:

### 1. 🌾 Agri & Plastic Crates (`agri_plastics`)
- **Focus**: Farm collection centers, wholesale agricultural mandis, crate molding, weight calibration, and tare weight verification.
- **Key Parameters**: Primary accent `#059669` (Emerald), Batch Prefix `PPD-AGR-`, Scrap Allowance `3.5%`, Unit `Crates`.

### 2. 🏭 Plastics & Injection Moulding (`plastics_moulding`)
- **Focus**: High-tonnage injection machines, cycle times, mold shot counters, cavity QA, regrind scrap recycling.
- **Key Parameters**: Primary accent `#2563eb` (Cobalt), Batch Prefix `LOT-INJ-`, Scrap Allowance `2.0%`, Unit `Pieces (Nos)`.

### 3. 🧵 Textiles & Apparel (`textiles_garments`)
- **Focus**: Yarn spinning, loom meterage, dye lots, roll inspection, piece-rate cutting, garment export packs.
- **Key Parameters**: Primary accent `#7c3aed` (Purple), Batch Prefix `DYE-LOT-`, Scrap Allowance `5.0%`, Unit `Meters / Rolls`.

### 4. 🚗 Automotive & Precision Engineering (`auto_engineering`)
- **Focus**: CNC milling, casting heats, tolerance validation in microns, Kanban job orders, PPAP auditing.
- **Key Parameters**: Primary accent `#dc2626` (Crimson), Batch Prefix `JO-CNC-`, Scrap Allowance `1.2%`, Unit `Finished Assemblies`.

### 5. 💊 Pharma & Life Sciences (`pharma_lifesciences`)
- **Focus**: GMP compliance, cleanroom batches, active pharma ingredients (API), shelf-life expiry, 21 CFR Part 11 electronic records.
- **Key Parameters**: Primary accent `#0891b2` (Cyan), Batch Prefix `PH-LOT-`, Scrap Allowance `0.5%`, Unit `Bottles / Strips`.

### 6. 📦 FMCG & Commercial Distribution (`fmcg_trading`)
- **Focus**: Fast-moving consumer goods, multi-warehouse stock replenishment, retailer van routes, trade discount schemes.
- **Key Parameters**: Primary accent `#d97706` (Amber), Batch Prefix `RUN-FMCG-`, Scrap Allowance `0.8%`, Unit `Outer Cases (Cartons)`.

---

## 5. Master Catalog of 208 Enterprise Customization Parameters

The ERP platform provides **208 granular, persistent configuration parameters** organized across 8 operational domains:

```
[208 Enterprise Customizations Matrix]
  ├── 1. Branding & White-Label (25 Parameters) [c1 - c25]
  ├── 2. Multi-Company & Entity Architecture (30 Parameters) [c26 - c55]
  ├── 3. Invoicing, Tax & Financial Engine (35 Parameters) [c56 - c90]
  ├── 4. Manufacturing & Shop Floor (30 Parameters) [c91 - c120]
  ├── 5. Inventory & Raw Materials (25 Parameters) [c121 - c145]
  ├── 6. Logistics, Freight & Dispatch (20 Parameters) [c146 - c165]
  ├── 7. Workforce, Payroll & Shifts (20 Parameters) [c166 - c185]
  └── 8. Security, RBAC & Audit Governance (20 Parameters) [c186 - c208]
```

### Domain 1: Branding & White-Label (25 Parameters)
| Key | Title | Type | Impacted Modules |
| :--- | :--- | :---: | :--- |
| `brand.app_title` | Enterprise Application Name | String | Header, Sidebar, Browser Shell |
| `brand.tagline` | Corporate Slogan / Tagline | String | Invoices, Letterheads, Settings |
| `brand.primary_color` | Primary Corporate Accent Color | Color | All UI Elements, Buttons, Badges |
| `brand.primary_hover` | Primary Hover Accent Color | Color | Interactive States |
| `brand.theme_default` | Default Theme Mode (Light/Dark/System) | Select | Global Interface |
| `brand.font_family` | Typography Stack (Inter, Outfit, etc.) | Select | Global Fonts |
| `brand.table_density` | Default Table Density (Compact/Comfortable) | Select | All 19 Module Tables |
| `brand.border_radius` | UI Corner Radius Scale | Select | Cards, Inputs, Modals |
| `brand.glassmorphism` | Frosted Backdrop Blur Intensity | Select | Header, Floating Drawers |
| `brand.show_watermark` | PDF Watermark Enable Toggle | Boolean | Invoices, Dispatch Reports |
| `brand.watermark_text` | Custom Watermark Text String | String | Invoices, Inspection Slips |
| `brand.favicon_url` | Browser Favicon URL / SVG Path | String | Browser Tab |
| `brand.login_theme` | Authentication Screen Theme Style | Select | Login Portal |
| `brand.login_logo_width` | Authentication Logo Maximum Width | Number | Login Portal |
| `brand.header_layout` | Top Navigation Header Arrangement | Select | Executive Header Bar |
| `brand.sidebar_default_collapsed` | Collapse Navigation Sidebar on Launch | Boolean | Sidebar Layout |
| `brand.custom_portal_url` | Custom White-Label Domain (CNAME) | String | DNS & Host Routing |
| `brand.email_footer_html` | Outgoing Email HTML Signature | String | Transactional Notifications |
| `brand.support_email` | IT Support Desk Contact Email | String | Help Cards, Error Views |
| `brand.support_hotline` | Emergency Support Hotline Phone | String | Dashboard, Footers |
| `brand.pdf_letterhead_style` | Tax Invoice Letterhead Style | Select | Invoices, Vouchers |
| `brand.show_qr_on_print` | Render Live Bharat UPI QR on Printouts | Boolean | Physical Invoices |
| `brand.show_terms_on_invoice` | Print Standard Commercial Terms | Boolean | Invoices, Contracts |
| `brand.invoice_terms_text` | Custom Terms & Conditions Clauses | String | Invoices |
| `brand.multi_language_enabled` | Enable EN / MR / HI Trilingual Mode | Boolean | Global UI Translation |

### Domain 2: Multi-Company & Entity Architecture (30 Parameters)
| Key | Title | Type | Impacted Modules |
| :--- | :--- | :---: | :--- |
| `org.company_legal_name` | Corporate Registered Legal Entity Name | String | Invoices, Business Rules |
| `org.trade_brand_name` | Trade / Brand Operating Name (DBA) | String | All Tabs, Letterheads |
| `org.gstin` | 15-Digit GST Identification Number | String | Invoices, Parties, Tax Filings |
| `org.pan` | 10-Digit Permanent Account Number | String | Invoices, Financial Audit |
| `org.cin` | 21-Digit Corporate Identification Number | String | Invoices, Business Rules |
| `org.msme_reg_no` | MSME Udyam Registration Number | String | Invoices, Legal Protection |
| `org.state_code` | Statutory Home State Code (e.g. 27) | String | Interstate Tax Logic |
| `org.state_name` | Registered Home State Name | String | Invoices, Consignee Info |
| `org.currency_code` | Base Currency (INR, USD, EUR, AED) | Select | All Financial Ledgers |
| `org.currency_symbol` | Monetary Symbol (₹, $, €, £, AED) | String | All Financial Views |
| `org.decimal_precision` | Currency Decimal Places (0, 2, 3) | Select | Table Figures & Ledgers |
| `org.number_formatting_system` | Number Grouping (Indian Lakhs vs Millions) | Select | Numbers, Balances, Reports |
| `org.financial_year_start` | Fiscal Year Start Month (April / January) | Select | Ledger Closing Cycles |
| `org.current_active_fy` | Active Financial Year String (2026-27) | String | Document Sequences |
| `org.timezone` | Operating Timezone (IST, GST, GMT, EST) | Select | Shift Timings, Timestamps |
| `org.plant_code` | Primary Factory Facility Identifier | String | Production, Machines |
| `org.plant_name` | Factory Facility Physical Name | String | Shift Logs, Production |
| `org.primary_contact_person` | Managing Director / Signatory Name | String | Invoices, Formal Letters |
| `org.signatory_designation` | Authorized Signatory Official Title | String | Invoice Signature Block |
| `org.registered_address` | Registered Head Office Postal Address | String | Invoices, Statutory Bills |
| `org.works_factory_address` | Factory Works Dispatch Gate Address | String | Dispatch, e-Way Bills |
| `org.billing_email` | Accounts & Remittance Email Address | String | Invoices, Payment Receipts |
| `org.billing_phone` | Accounts Department Helpline Number | String | Invoices, Payment Reminders |
| `org.multi_branch_mode` | Enable Multi-Branch Plant Warehouses | Boolean | Inventory, Dispatch |
| `org.default_branch_id` | Default Selected Operating Branch | String | Sales Orders, Stock Inward |
| `org.export_sez_billing` | Enable Zero-Rated SEZ / Export Billing | Boolean | Invoices, Sales |
| `org.lut_bond_number` | Export Letter of Undertaking (LUT) Number | String | Zero-Rated Tax Invoices |
| `org.auto_sync_master_data` | Auto-Sync Master Data across Nodes | Boolean | Parties, Catalog, Prices |
| `org.max_tenants_allowed` | Multi-Tenant Subsidiary Entities Quota | Number | Settings |
| `org.data_isolation_level` | Tenant Separation (Discriminator / Schema) | Select | Database Layer |

### Domain 3: Invoicing, Tax & Financial Engine (35 Parameters)
- `inv.prefix`: Sales Tax Invoice Prefix Format (e.g. `FA/26-27/` or `ACME/26-27/`)
- `inv.padding_digits`: Sequential Invoice Number Padding (3, 4, 5, or 6 digits)
- `inv.starting_number`: Financial Year Starting Number (default `1`)
- `inv.auto_gst_detection`: Automatic Interstate Tax Split Detection (CGST+SGST vs IGST)
- `inv.default_gst_rate`: Standard Default Product GST Slab (0%, 5%, 12%, 18%, 28%)
- `inv.hsn_crates_standard`: Standard 8-Digit HSN / SAC Code
- `inv.reverse_charge_mechanism`: Enable Reverse Charge (RCM) Checkbox on Invoicing
- `inv.tcs_applicable_threshold`: Section 206C(1H) Turnover Threshold (Rs. 50,00,000)
- `inv.einvoice_irn_enabled`: Government NIC E-Invoice IRN API Integration
- `inv.eway_bill_mandatory_limit`: Mandatory E-Way Bill Consignment Value Ceiling (Rs. 50,000)
- `inv.default_credit_days`: Standard Default Credit Terms (0, 7, 15, 30, 45, 60 Days)
- `inv.credit_limit_strict_enforcement`: Hard Stop on Overdue / Over-Limit Dispatch
- `inv.overdue_interest_rate_pct`: Annual Delayed Payment Interest Percentage (18.0% p.a.)
- `inv.allow_cash_settlement`: Permit Direct Cash Receipts up to Statutory Limit
- `inv.razorpay_gateway_enabled`: Enable Razorpay Dynamic Payment Links via SMS & WhatsApp
- `inv.upi_qr_dynamic_generation`: Embed Dynamic Bharat UPI QR on Tax Invoices
- `inv.roundoff_net_amount`: Auto-Round Net Payable to Nearest Rupee
- `inv.discount_mode`: Commercial Discount Structures (Item-Level, Subtotal, or Both)
- `inv.auto_email_invoice_pdf`: Auto-Dispatch Invoice PDF upon Approval
- `inv.auto_whatsapp_invoice_alert`: Auto-Send WhatsApp Invoice Notification with PDF Link
- `inv.sales_order_mandatory_for_invoice`: Enforce Sales Order Reference on Invoicing
- `inv.auto_reconcile_bank_credits`: Bank Statement FIFO Inward Matching
- `inv.credit_note_prefix`: Credit Note Voucher Prefix (`CN/26-27/`)
- `inv.debit_note_prefix`: Debit Note Voucher Prefix (`DN/26-27/`)
- `inv.proforma_invoice_prefix`: Proforma Quotation Prefix (`PI/26-27/`)
- `inv.print_bank_account_choice`: Default Bank Account Stamped on Printouts
- `inv.gst_composition_scheme_support`: Support Composition Scheme Vendors (Bill of Supply)
- `inv.invoice_cancellation_window_hrs`: Permitted Hours to Void Invoice (Default 24 Hours)
- `inv.require_reason_for_void`: Mandatory Explanation Log for Voided Invoices
- `inv.freight_charge_taxable`: Apply 18% GST on Transport Freight Charges
- `inv.advance_payment_mandatory_pct`: Advance Deposit Required for New Commercial Accounts
- `inv.multi_currency_exchange_rates`: Enable Foreign Currency Export Orders (USD/EUR)
- `inv.einvoice_sandbox_mode`: NIC E-Invoice Sandbox Testing Mode
- `inv.require_customer_po_number`: Mandatory Buyer Purchase Order Number
- `inv.print_original_duplicate_triplicate`: Print Multi-Copy Legal Header Banner

### Domain 4: Manufacturing & Shop Floor (30 Parameters)
- `mfg.batch_prefix`: Production Batch Code Formula (`PPD-`, `BATCH-`, `LOT-`)
- `mfg.scrap_allowance_pct`: Standard Startup Scrap & Purging Allowance (e.g. 3.0%)
- `mfg.shift_count`: Plant Operating Shifts per Day (1, 2, or 3 Shifts)
- `mfg.shift1_start` & `mfg.shift2_start`: Shift Commencement Timestamps
- `mfg.machine_oee_target_pct`: Target Overall Equipment Effectiveness Benchmark (85.0%)
- `mfg.cycle_time_alert_threshold_sec`: Cycle Time Delay Alarm Threshold (Seconds)
- `mfg.tare_weight_validation_enabled`: Crate Tare Weight Tolerance Checking
- `mfg.weight_tolerance_grams`: Allowable Grams Deviation from Target Weight (+/- 20g)
- `mfg.regrind_usage_limit_pct`: Maximum Recycled Polymer Regrind Ratio (20.0%)
- `mfg.auto_deduct_raw_materials`: Auto-Deduct Granules Stock on Production Save
- `mfg.mandatory_qc_inspection`: Enforce QC Inspector Sign-Off before Finished Stock Inward
- `mfg.mould_shot_counter_warning_limit`: Preventive Mold Maintenance Shot Count Limit (100,000 Shots)
- `mfg.power_meter_integration`: IoT Energy Meter Integration for kWh per Crate
- `mfg.electricity_unit_rate_inr`: Industrial Electricity Tariff Rate (Rs. 8.75 / kWh)
- `mfg.breakdown_sms_alerts`: Instant SMS to Maintenance Team on Machine Stoppage
- `mfg.piece_rate_operator_wages`: Enable Piece-Rate Shift Incentive Wages
- `mfg.piece_rate_amount_per_unit`: Piece Rate Incentive per Acceptable Unit (Rs. 1.50)
- `mfg.masterbatch_ratio_pct`: Color Masterbatch Dosing Percentage (1.5%)
- `mfg.barcode_label_on_batch_completion`: Auto-Print Pallet Barcode on Save
- `mfg.thermal_printer_ip`: Network IP Address of Shop Floor TSC/Zebra Barcode Printer
- `mfg.allow_negative_raw_material_stock`: Block Production when Granule Silos are Empty
- `mfg.chiller_temp_operating_range`: Mold Chiller Supply Temperature Setpoint (12°C)
- `mfg.injection_pressure_max_bar`: Hydraulic System Safety Pressure Limit (175 Bar)
- `mfg.auto_generate_batch_serial`: Auto-Generate Sequential Pallet Serial Identifiers
- `mfg.pallet_standard_crate_capacity`: Standard Pallet Stacking Capacity (50 Crates / Pallet)
- `mfg.record_machine_downtime_reasons`: Mandatory Downtime Stoppage Reason Categorization
- `mfg.default_injection_machine_id`: Pre-Selected Injection Molding Machine (e.g. M01)
- `mfg.allow_manual_timestamp_override`: Permit Backdating Production Batches
- `mfg.daily_production_target_crates`: Daily Plant Target Production Volume (2,500 Units)

### Domain 5: Inventory & Raw Materials (25 Parameters)
- `inv.valuation_method`: Inventory Costing Algorithm (FIFO, Weighted Average, LIFO)
- `inv.reorder_alert_threshold`: Global Safety Stock Alert Ceiling (200 Units)
- `inv.auto_grn_generation`: Auto-Generate Goods Receipt Note (GRN) on Inward
- `inv.grn_prefix`: GRN Sequential Prefix (`GRN/26-27/`)
- `inv.raw_material_bag_weight_kg`: Standard Polymer Granule Sack Weight (25.0 kg)
- `inv.moisture_test_required`: Block Hopper Loading if Moisture Exceeds 0.02%
- `inv.batch_expiry_tracking`: Track Granule & Chemical Shelf-Life Expiry
- `inv.batch_expiry_warning_days`: Pre-Expiry Alert Window (30 Days Lead)
- `inv.barcode_standard`: Warehouse Symbology (CODE128, QR Code, DataMatrix)
- `inv.allow_direct_stock_adjustment`: Permit Manual Physical Audit Stock Reconciliations
- `inv.crate_color_variants`: Active Product Color Catalog (Red, Blue, Green, Yellow, Black)
- `inv.dead_stock_days_threshold`: Slow-Moving Stock Threshold (90 Days Idle)
- `inv.warehouse_bay_rack_bin_system`: Multi-Tier Bay/Rack/Bin Coordinates (e.g. A-02-B)
- `inv.vendor_rating_algorithm`: Auto-Compute Vendor Scorecards (Punctuality, Quality, Tare)
- `inv.vendor_credit_days_default`: Standard Raw Material Supplier Credit Period (45 Days)
- `inv.petrochemical_price_index_sync`: Track Reliance / IOCL Polymer Index Benchmarks
- `inv.stock_quarantine_zone`: Lock Defective Batches in Quarantine Buffer
- `inv.min_buffer_stock_tons`: Minimum Polymer Granules Silo Safety Buffer (15.0 Tons)
- `inv.track_crate_tare_weight_in_inventory`: Display Crate Tare Weight on Inventory Cards
- `inv.enable_asset_depreciation_tracker`: Monthly Straight-Line Depreciation for Molds & Machines
- `inv.low_stock_whatsapp_alerts`: WhatsApp Alert to Purchase Officer on Low Stock
- `inv.regrind_cost_factor_pct`: Recycled Scrap Valuation Factor relative to Virgin Granules (65%)
- `inv.max_warehouse_capacity_crates`: Finished Goods Yard Stacking Capacity (50,000 Crates)
- `inv.auto_suggest_dispatch_lots`: FIFO Auto-Pick Recommendation during Dispatch Loading
- `inv.stock_count_cycle_audit_frequency`: Cycle Count Verification Cadence (Monthly)

### Domain 6: Logistics, Freight & Dispatch (20 Parameters)
- `dispatch.challan_prefix`: Outward Delivery Challan Sequence Prefix (`DC/26-27/`)
- `dispatch.mandatory_driver_phone`: Mandatory Driver Mobile & Driving License Validation
- `dispatch.vehicle_types_catalog`: Approved Vehicle Types (Tata Ace, 14ft, 19ft, 32ft Container)
- `dispatch.freight_calculation_mode`: Freight Rate Formula (`per_crate`, `per_km`, `flat_trip`)
- `dispatch.default_freight_per_crate_inr`: Baseline Local Freight Rate (Rs. 6.50 / Crate)
- `dispatch.auto_sms_tracking_link`: Auto-Send Vehicle Number & Driver Details via SMS
- `dispatch.auto_whatsapp_tracking`: Auto-Send Signed Delivery Challan PDF via WhatsApp
- `dispatch.print_gate_pass_voucher`: Auto-Generate Security Outward Gate Pass Slip
- `dispatch.security_guard_app_pin`: Gatekeeper 4-Digit PIN for Departure Timestamping
- `dispatch.gps_tracking_webhook_enabled`: Fleet GPS Live Telemetry Webhook (LocoNav / Wheelseye)
- `dispatch.require_loading_supervisor_sign`: Require Supervisor Sign-Off before Challan Print
- `dispatch.overloading_tolerance_pct`: Vehicle Capacity Overload Tolerance (5.0%)
- `dispatch.default_transporter_id`: Primary Default Fleet Logistics Contractor
- `dispatch.driver_license_expiry_block`: Block Assigning Driver if License Validity has Expired
- `dispatch.pod_upload_mandatory`: Require Proof of Delivery (POD) Image for Invoice Settlement
- `dispatch.loading_damage_threshold_pct`: Allowable Loading Damage Scrap Percentage (0.2%)
- `dispatch.allow_part_delivery_shipments`: Permit Split Deliveries against Single Sales Order
- `dispatch.transporter_tds_applicable`: Apply Section 194C TDS on Transporter Freight Vouchers
- `dispatch.interstate_transit_insurance_policy`: Marine / Road Transit Risk Insurance Policy Number
- `dispatch.max_daily_dispatches_allowed`: Loading Bay Outward Truck Ceiling (12 Trucks / Day)

### Domain 7: Workforce, Payroll & Shifts (20 Parameters)
- `hr.monthly_working_days_divisor`: Monthly Wage Divisor (26 Days - Factories Act Standard)
- `hr.overtime_rate_multiplier`: Statutory Overtime Multiplier (2.0x Double Rate)
- `hr.provident_fund_pct`: Mandatory Employee Provident Fund (EPF) Deduction (12.0%)
- `hr.esi_deduction_pct`: Employee State Insurance (ESIC) Deduction (0.75%)
- `hr.professional_tax_state`: State Professional Tax Slab (Maharashtra Rs. 200/mo)
- `hr.salary_disbursement_day_of_month`: Standard Monthly Payroll Disbursement Date (7th of Month)
- `hr.biometric_punch_integration`: Biometric Fingerprint / Facial Attendance Device Integration
- `hr.advance_salary_max_limit_pct`: Maximum Permitted Salary Advance Loan Ceiling (50.0%)
- `hr.advance_recovery_monthly_installments`: Salary Advance Recovery Tenure (3 Monthly Installments)
- `hr.bonus_ex_gratia_annual_pct`: Annual Statutory Diwali Bonus Rate (8.33%)
- `hr.paid_leaves_per_annum`: Annual Earned Leave (EL) Allowance (18 Days)
- `hr.casual_leaves_per_annum`: Annual Casual / Sick Leave Allowance (12 Days)
- `hr.allow_cash_salary_disbursement`: Permit Cash Wage Vouchers for Contract Laborers
- `hr.mandatory_aadhaar_pan_validation`: Validate 12-Digit Aadhaar and 10-Digit PAN on Hire
- `hr.uniform_safety_shoes_allowance`: Annual PPE & Steel-Toe Shoe Safety Allowance (Rs. 2,500)
- `hr.shift_differential_allowance_inr`: Night Shift Differential Cash Bonus (Rs. 150 / Shift)
- `hr.probation_period_months`: New Hire Probation Evaluation Period (6 Months)
- `hr.allow_operator_self_service_portal`: Enable Mobile ESS Portal for Payslip Inspection
- `hr.payslip_pdf_password_protected`: Password-Protect Outgoing PDF Payslips with Birth Year
- `hr.notice_period_days`: Standard Employee Separation Resignation Notice Period (30 Days)

### Domain 8: Security, RBAC & Audit Governance (20 Parameters)
- `sec.two_factor_auth_enforced`: Mandate SMS / TOTP Two-Factor Authentication on Staff Login
- `sec.session_timeout_minutes`: Automatic Idle Session Screen Lock (30 Minutes)
- `sec.max_failed_logins_before_lock`: Account Lockout Threshold (5 Consecutive Incorrect Attempts)
- `sec.ip_whitelist_enforcement`: Restrict Access to Factory Local Subnet Whitelist
- `sec.ip_whitelist_range`: CIDR Subnets Allowed for Root Admin Access
- `sec.audit_log_retention_days`: Immutable Audit Trail Retention (365 Days / 7 Years)
- `sec.password_minimum_length`: Minimum Password Length (8 Characters)
- `sec.password_require_special_character`: Require Special Symbol (!@#$%) in Password
- `sec.password_expiry_interval_days`: Mandatory Password Rotation Interval (90 Days)
- `sec.mask_bank_account_numbers`: Mask Bank Account Numbers for Non-Accountant Staff
- `sec.mask_employee_salary_for_operators`: Conceal Wage Columns from Shop Floor Viewers
- `sec.allow_excel_export_all_roles`: Permit Bulk CSV/Excel Downloads for Non-Admins
- `sec.log_all_data_exports`: Audit-Log Every Excel/PDF Download with User Identity & IP
- `sec.emergency_kill_switch_active`: Global Read-Only Emergency Lockdown Mode
- `sec.auto_database_backup_cron`: Daily Automated mysqldump Encrypted Database Backup at 02:00 AM
- `sec.backup_retention_days`: Daily Database Backup Archive Retention Window (30 Days)
- `sec.ssl_tls_enforced`: Force HTTPS / TLS 1.3 Transport Encryption
- `sec.rate_limiting_max_req_per_min`: API Rate Limiting Ceiling (120 Requests / Minute per IP)
- `sec.content_security_policy_enforced`: Enforce Strict Content Security Policy (CSP) Headers
- `sec.developer_tools_console_disabled`: Disable F12 Developer Console on Shop Floor Terminals
- `sec.webhook_hmac_secret_active`: Enforce HMAC-SHA256 Payload Signature on Outbound Webhooks
- `sec.sentry_error_reporting_active`: Transmit Unhandled Exceptions to SRE Observability Wallboard
- `sec.tenant_branding_switch_unlocked`: Allow Instant Multi-Company Profile Switching from Executive Header

---

## 6. How to Deploy for a New Company in 5 Minutes (Runbook)

1. **Step 1: Open the 200+ Customizations Hub**:
   - Navigate to `Settings` $\to$ `200+ Customizations Hub`.
2. **Step 2: Select the Relevant Industry Vertical**:
   - Click "Apply Template" on the matching card (e.g. `Plastics & Injection Moulding` or `Automotive & Precision Engineering`).
   - This instantly updates product units, customer labels, batch prefixes, scrap allowances, and primary colors.
3. **Step 3: Enter Company Statutory Coordinates**:
   - In `Multi-Company & Entity Architecture`, update:
     - `org.company_legal_name`
     - `org.gstin`
     - `org.pan`
     - `org.registered_address`
     - `org.works_factory_address`
4. **Step 4: Upload Corporate Emblem & Set Colors**:
   - In `Branding & White-Label`, upload company logo (SVG/PNG) and pick brand primary hex color.
5. **Step 5: Verify Tax Invoices & Challans**:
   - Switch to `Invoices` tab, click `View` on any sample invoice to inspect letterhead, UPI QR code, and statutory disclaimers.
6. **Step 6: Export Master Configuration JSON**:
   - Click `Export Config JSON` to backup the complete configuration bundle for version control and automated Docker container deployment.

---

## 7. Summary & Invariant Verification
By adhering to this specification, the platform operates as a **world-class, enterprise-grade, multi-tenant manufacturing ERP** capable of powering any manufacturing or supply chain facility with complete data safety, professional aesthetics, and optimal memory efficiency.
