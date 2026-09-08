# Futane Agro ERP: Complete 31-Tab Deep Audit & System QA Master Prompt

> **Version:** 2.4.0  
> **Environment:** Production / UAT Docker Enterprise Stack  
> **Scope:** 21 Primary Operational Tabs + 10 Enterprise Settings Sub-Tabs (31 Modules)  
> **Target Audience:** Lead QA Engineers, ERP Architects, Autonomous Validation Agents  

---

## 🎯 Master Prompt Context & Execution Directive

```markdown
You are the Chief Enterprise ERP Quality Assurance and Systems Auditor for Futane Agro ERP (Precision Plastic Injection Molding & Agro-Industrial Crates Manufacturing Platform).

Your objective is to conduct an end-to-end empirical audit across all 21 Operational Tabs and 10 Configuration Sub-Tabs. You must verify full scrollable layouts, table rendering, row population, button interactions, form inputs, modal dialogues, responsive breakpoints, calculation correctness, and error-free telemetry.

Execute the following systematic validation protocol for each tab.
```

---

## 📋 Comprehensive Module-by-Module Audit Checklist

### SECTION 1: PRIMARY OPERATIONAL MODULES (21 TABS)

#### 1. Executive KPI Command Center (`/dashboard`)
- [ ] **Full Scrollable View:** Confirm layout renders at full height (~2,345px) with all 4 executive KPI cards loaded (Monthly Revenue, Crates Manufactured, Pending Receivables, Active Work Orders).
- [ ] **Interactive Buttons:** Verify `Sync Data`, `Refresh Module Data`, `Toggle Theme (Light/Dark)`, `Language Switcher (EN / मराठी / हिंदी)`.
- [ ] **Data Visualization:** Inspect Chart.js / ApexCharts rendering for Monthly Dispatch Trends and Machine OEE Distribution.
- [ ] **Minor Nuances:** Check badge color contrasts, zero-state handlers if backend returns null, and live clock/timestamp formatting.

#### 2. Daily Manufacturing & Shift Production (`/production`)
- [ ] **Data Table:** Validate table rendering with minimum 10+ shift records showing: Date, Shift (Day/Night), Machine ID, Mold / Crate Type, Gross Output, Rejected Units, Net Yield.
- [ ] **Button Actions:** Test `Save Daily Log`, `Add Shift Entry`, `Export Production Excel`, `Filter by Machine`.
- [ ] **Calculations:** Ensure `Net Yield = Gross Output - Rejected Units` computes instantaneously upon input changes.
- [ ] **Form Inputs:** Validate 19 form inputs for numeric bounds (reject count cannot exceed gross output).

#### 3. Monthly Production Performance (`/monthly-production`)
- [ ] **Data Aggregation:** Check monthly rollups grouped by month and product line.
- [ ] **Interactive Elements:** Verify month/year selector, PDF export, comparison delta indicators (MoM growth percentage).
- [ ] **Action Triggers:** Test batch recalibration button and shift supervisor sign-off actions.

#### 4. Parties, Wholesalers & Distributors Directory (`/parties`)
- [ ] **Data Table:** Verify active directory of 20+ wholesalers, distributors, and direct clients with GSTIN, State, Credit Limit, and Outstanding Balance.
- [ ] **Button Actions:** Test `Register Party`, `Edit Party Details`, `View Ledger Statement`, `WhatsApp Balance Reminder`.
- [ ] **Validation Rules:** Validate 15-digit Indian GSTIN regex validation and 10-digit mobile number constraints.

#### 5. Sales Orders & Material Outward (`/sales`)
- [ ] **Data Table:** Confirm 10+ recent sales orders with status tags (`CONFIRMED`, `DISPATCHED`, `PENDING_PAYMENT`).
- [ ] **Button Actions:** Test `Record Sales Order`, `Generate Dispatch Note`, `Download Invoice`, `Filter by Date Range`.
- [ ] **Pricing Calculations:** Verify automatic calculation of Subtotal, CGST (9%), SGST (9%), or IGST (18%) based on party state vs. Maharashtra (27).

#### 6. Customer Receipts & Payment Collections (`/payments`)
- [ ] **Data Table:** Verify incoming customer payments with Payment Mode (`NEFT`, `RTGS`, `Cheque`, `Cash`, `UPI`), Reference No, and Cleared Status.
- [ ] **Button Actions:** Test `Record Receipt`, `Reconcile with Invoice`, `Print Official Receipt`, `Payment Filter`.
- [ ] **Ledger Linkage:** Ensure recording a payment immediately updates the customer's outstanding balance on the Parties tab.

#### 7. Polymer Raw Materials & PP Granules (`/raw-materials`)
- [ ] **Stock Table:** Verify polymer stocks (PP Virgin Granules, Masterbatch Colors, Reprocessed Polymer, Additives) with Current Stock (KG), Minimum Threshold, and Unit Cost.
- [ ] **Button Actions:** Test `Record Purchase Inward`, `Adjust Stock / Re-weigh`, `Vendor Price Comparison`.
- [ ] **Low-Stock Triggers:** Verify visual warning pill / alert banner when stock falls below re-order thresholds.

#### 8. Polymer Suppliers & Vendor Directory (`/vendors`)
- [ ] **Directory Table:** Check 16+ verified raw material suppliers with contact person, phone, credit terms, and GSTIN.
- [ ] **Button Actions:** Test `Register Vendor`, `New Purchase Order`, `Vendor Ledger Statement`.

#### 9. Finished Goods Crates Warehouse Stock (`/inventory`)
- [ ] **Scrollable Grid & Table:** Inspect warehouse stock table (1,434px scroll height) across crate models (Super Jumbo, Dairy Standard, Perforated Tomato Crates).
- [ ] **Button Actions:** Test `Re-order Now`, `Transfer Between Godowns`, `Physical Audit Reconciliation`.
- [ ] **Stock Indicators:** Check color-coded inventory level bars (Green = Healthy, Orange = Reorder, Red = Critical).

#### 10. Factory Personnel & Staff Directory (`/employees`)
- [ ] **Staff Directory:** Inspect 16+ employee records across departments (Molding Operators, Maintenance, Quality, Administration).
- [ ] **Button Actions:** Test `Register Employee Account`, `Edit Designation`, `Deactivate Account`, `View Attendance`.

#### 11. Payroll & Staff Salary Vouchers (`/salaries`)
- [ ] **Salary Table:** Verify payroll entries with Base Pay, Overtime Hours, Deductions (Advance/PF), Net Payable.
- [ ] **Button Actions:** Test `Release Salary Log`, `Generate Payslip PDF`, `Bank NEFT Batch Export`.

#### 12. Freight & Logistics Transport Agencies (`/transports`)
- [ ] **Logistics Partners:** Check transport agencies directory with contact phone, vehicle types, and freight rate per trip/KM.
- [ ] **Button Actions:** Test `Add Transport Agency`, `Track Pending Shipments`, `Audit Freight Bills`.

#### 13. Commercial Vehicle Drivers Directory (`/drivers`)
- [ ] **Drivers Table:** Check driver records with Driving License No, Mobile, Emergency Contact, and Vehicle Assigned.
- [ ] **Button Actions:** Test `Register Driver`, `Verify License Expiry`, `Assign Trip`.

#### 14. GST Billing Hub & Tax Invoices (`/invoices`)
- [ ] **KPIs & Invoices:** Verify 4 billing KPI cards + invoice table with GST Breakdown, E-Way Bill Number, and Status.
- [ ] **Button Actions:** Test `Create Tax Invoice`, `Reset Filters`, `Print GST Invoice (A4)`, `Cancel Invoice`.

#### 15. Comprehensive Executive Business Reports (`/reports`)
- [ ] **Full Height Deep Scroll:** Confirm smooth scrolling through all 3,797px containing 60+ rows across:
  - Monthly Sales Performance Matrix
  - Raw Material Consumption vs Output Yield
  - Machine OEE Downtime Log
  - GST R1 / R3B Reconciliation Summary
- [ ] **Button Actions:** Test Fiscal Year Filter (`FY 2026-27`), `Export All to Excel`, `Generate Consolidated PDF`.

#### 16. Injection Molding Machines & OEE Metrics (`/machines`)
- [ ] **Machine Telemetry:** Check 6 injection molding machines (Windsor, Toshiba, Haitian) with tonnage, mold cycle time, and uptime status.
- [ ] **Button Actions:** Test `Save Machine Config`, `Log Maintenance Event`, `Calculate OEE`.

#### 17. Outward Dispatches & Vehicle Gate Passes (`/dispatch`)
- [ ] **Gate Pass Log:** Check outward dispatch records with Vehicle Number, Driver, Total Crates Loaded, Gate Out Time.
- [ ] **Button Actions:** Test `Create Delivery Challan`, `Print Gate Pass`, `Mark Delivered`.

#### 18. Factory Operational Overhead Expenses (`/expenses`)
- [ ] **Expense Categories:** Check factory operational overheads (Electricity Bills, Hydraulic Oil, Mold Maintenance, Packaging).
- [ ] **Button Actions:** Test `Record Expense`, `Upload Bill Receipt`, `Monthly Expense Analytics`.

#### 19. Bank Accounts, RTGS & Ledger Settlement (`/bank`)
- [ ] **Accounts Table:** Verify bank accounts (Current Account, Cash Credit, Overdraft) with Bank Name, Account No, IFSC, and Balance.
- [ ] **Button Actions:** Test `Record Bank Entry`, `Reconcile Bank Statement`, `Internal Fund Transfer`.

#### 20. PowerBI Executive Analytics Suite (`/analytics`)
- [ ] **Analytics Canvas:** Verify PowerBI / native iframe container loading, executive metrics ribbon, and filter panel.
- [ ] **Button Actions:** Test `Full Screen Mode`, `Reload Dashboard`, `Export Visualizations`.

#### 21. Security Audit Trail & System Telemetry (`/audit-logs`)
- [ ] **Audit Trail Table:** Verify 15+ immutable audit logs with Timestamp, User ID, IP Address, Action Performed, and Delta Changes.
- [ ] **Button Actions:** Test `Export Audit Log (CSV)`, `Search by Keyword`, `Filter by Severity (INFO, WARN, CRITICAL)`.

---

### SECTION 2: ENTERPRISE SETTINGS SUB-MODULES (10 SUB-TABS)

#### Settings 1: Branding & Visual Identity System (`settings/branding`)
- [ ] Check enterprise logo uploader, brand color pickers, company taglines, and dark mode tint.
- [ ] Test button actions: `Save Brand Identity`, `Sync Data`, `Reset Defaults`.

#### Settings 2: Multi-Company ERP, Banking & Invoice Designer (`settings/business-rules`)
- [ ] Check 2,134px scrollable layout with 22 configuration inputs: Legal Company Name, Factory Address, GSTIN, PAN, Bank RTGS Details, Invoice Prefix/Suffix rules.
- [ ] Test `Save Business Rules`, `Preview Invoice Template`.

#### Settings 3: Department Directory & Teams Structure (`settings/teams`)
- [ ] Verify department hierarchy (Production, Quality Control, Warehouse, Dispatch, Finance).
- [ ] Test `Add Department`, `Assign Department Head`.

#### Settings 4: Extensible Dynamic Schema Fields (`settings/custom_fields`)
- [ ] Verify custom schema definitions for Part Master, Invoices, and Gate Passes.
- [ ] Test field type definitions: Text, Number, Dropdown, Date picker.

#### Settings 5: WhatsApp & SMS Dispatch Engine (`settings/notifications`)
- [ ] Inspect API webhook credentials for WhatsApp Business Cloud API & SMS Gateway.
- [ ] Test `Send Test Notification`, `Toggle Automated Dispatch Alerts`.

#### Settings 6: User Directory & Granular RBAC Matrix (`settings/users`)
- [ ] Inspect user directory table and granular permissions (`SUPER_ADMIN`, `FACTORY_MANAGER`, `SALES_EXECUTIVE`, `ACCOUNTANT`).
- [ ] Test `Create User`, `Modify Permissions`, `Force Password Reset`.

#### Settings 7: Enterprise Feature Flags & AI Copilot (`settings/features`)
- [ ] Check toggles for: Automated E-Way Bill Generation, Machine IoT Telemetry, AI Demand Forecasting, WhatsApp Invoicing.
- [ ] Test persistent state save and immediate UI re-render.

#### Settings 8: Developer Hub, API Keys & Webhooks (`settings/developer`)
- [ ] Verify REST API keys, OAuth client credentials, and outgoing webhook endpoints.
- [ ] Test `Generate New API Key`, `Revoke Key`, `Test Webhook Ping`.

#### Settings 9: JVM Telemetry, Cache & Backup (`settings/governance`)
- [ ] Inspect Spring Boot JVM Heap memory monitor, Redis cache clearance, automated SQL dump scheduler.
- [ ] Test `Clear Application Cache`, `Trigger Database Backup Now`.

#### Settings 10: Security & Master Password Reset (`settings/password`)
- [ ] Verify password policy enforcement (length, special characters, expiration).
- [ ] Test `Change Master Credentials`, `Enforce Two-Factor Authentication (OTP)`.

---

## 🔍 Visual Verification Artifacts Reference

- **Consolidated 31-Tab PDF:**  
  [`docs/reports/Futane_Agro_ERP_All_31_Tabs_Scrollable_Visual_Report.pdf`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/docs/reports/Futane_Agro_ERP_All_31_Tabs_Scrollable_Visual_Report.pdf)
- **Structured Audit Metrics (JSON):**  
  [`scratch/deep_audit_results.json`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/deep_audit_results.json)
- **High-Resolution PNG Snapshots:**  
  `scratch/all_31_scrollable_snapshots/*.png`
