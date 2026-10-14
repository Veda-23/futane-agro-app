# Futane Agro ERP: Polymer Suppliers & Vendor Directory Master Prompt

> **Version:** 2.5.0  
> **Target Module:** Polymer Suppliers & Vendor Directory (`/vendors`)  
> **Scope:** Full End-to-End Empirical Audit across 9 Approved Industrial Polymer Suppliers, 100% GSTIN Tax Compliance Linkage, Commercial Procurement Spend Dossiers, Supplier Registration Drawers, and Responsive Viewports  
> **Environment:** Production / UAT Enterprise Angular 17 + Spring Boot Runtime  
> **Audience:** Lead Systems Architects, Supply Chain Directors, Vendor Compliance Managers & ERP Quality Engineers  

---

## 🎯 Master Prompt Context & Execution Directive

```markdown
You are the Chief Supply Chain Architect, Vendor Compliance Auditor, and ERP Quality Assurance Specialist for Futane Agro ERP (Precision Plastic Injection Molding & Agro-Industrial Material Handling Platform).

Your objective is to conduct an exhaustive, empirical validation of the Polymer Suppliers & Vendor Directory module (`/vendors`).
You must test EVERY approved supplier profile, 15-character GSTIN tax identification linkage, commercial procurement spend integration, multi-category subnav filters (All, Verified GSTIN, Polymer & Resin, Packaging & Crates, Color & Additives, Unregistered), slide-out supplier registration drawer, and the official printable Supplier Commercial Dossier modal. Crucially, you must verify engineering and accounting invariants:
  - Commercial Linkage Invariant: Total Procurement Spend across active suppliers = Total Raw Materials Capitalization (₹1,968,600)
  - Material Volume Balance Invariant: Total Volume supplied across vendor profiles = Total Polymer Volume (23,600 kg / 23.6 Metric Tonnes)
  - GST Compliance Formula: (Verified GSTIN Suppliers ÷ Total Approved Suppliers) × 100 = 100% (9 of 9 Compliant)
  - Active Partner Invariant: Vendors with >= 1 logged raw material batch = 8 Active Partners (matching Tab 5 Approved Suppliers count)
  - Official Printable Supplier Dossier Modal: Renders clean company identity, contact telephone, plant address, supplied materials list pills, billing total, and 3 authorized factory signatory endorsement lines without overflow.

Capture high-resolution screenshots of normal states, active registration drawers, dossier voucher dialogues, filter popovers, and responsive viewports.
```

---

## 📋 Complete Polymer Suppliers & Vendor Directory Audit & Mutation Test Matrix

### 1. Section 01: Module Header, Status Badges & Quick Action Controls
- [ ] **Breadcrumb & Title Telemetry:**
  - Verify breadcrumb hierarchy: `Futane Agro ERP / Procurement & Supply Chain / Polymer Suppliers & Vendor Directory`.
  - Verify primary module title: `Polymer Suppliers & Vendor Directory` with reactive badge showing total vendors (`9 Vendors`).
  - Verify subtitle: `Approved raw polymer resin suppliers, packaging partners, GSTIN compliance & procurement commercial linkages`.
  - Verify engineering formula chip: `GST Compliance: 100% (9/9)`.
- [ ] **Header Action Buttons (Uniform 36px Height):**
  - `Refresh` Button: Test manual sync trigger (`isLoading = true`) -> triggers `loadData(true)` -> synchronizes vendor records and shows success toast.
  - `CSV` Export Button: Test export of vendor directory to `.csv` format.
  - `Excel` Export Button: Test XLSX workbook generation with vendor codes, GSTIN numbers, and total spend amounts.
  - `+ Register Supplier` Button: Test opening of the slide-in Add Vendor Drawer (`isAddFormOpen = true`).

---

### 2. Section 02: 6-Category Sub-Tab Navigation Bar
- [ ] **All Suppliers Tab (`.subnav-tab-btn:nth-child(1)`):**
  - Displays total count badge `9`.
  - Shows all registered vendors across polymer, masterbatch, and packaging industries.
- [ ] **Verified GSTIN Tab (`.subnav-tab-btn:nth-child(2)`):**
  - Displays count badge `9` with success state pill indicator (`100% compliance`).
- [ ] **Polymer & Resin Tab (`.subnav-tab-btn:nth-child(3)`):**
  - Displays count badge `3` (e.g. `Reliance Polymers`, `Cryogas Nitrogen & Cold Storage`, `Supreme Polymers Packaging`).
- [ ] **Packaging & Crates Tab (`.subnav-tab-btn:nth-child(4)`):**
  - Displays count badge `3` (e.g. `Nilkamal Material Handling Crates`, `Time Technoplast Agro Crates`, `Uflex Corrugated Packaging`).
- [ ] **Color & Additives Tab (`.subnav-tab-btn:nth-child(5)`):**
  - Displays count badge `1` (e.g. `Navkar Polymers Masterbatches`).
- [ ] **Unregistered / Direct Tab (`.subnav-tab-btn:nth-child(6)`):**
  - Displays count badge `0` (zero non-compliant informal suppliers).

---

### 3. Section 03: Executive Telemetry KPI Grid (5 Metrics Strip)
- [ ] **KPI 1: Approved Suppliers (`.vendor-kpi-card:nth-child(1)`):**
  - Value: `9 Vendors` in active master registry.
- [ ] **KPI 2: GST Compliance (`.vendor-kpi-card:nth-child(2)`):**
  - Value: `100%` (`9 of 9 compliant` with verified GSTIN numbers).
- [ ] **KPI 3: Active Partners (`.vendor-kpi-card:nth-child(3)`):**
  - Value: `8 Partners` with active raw material procurement batches.
- [ ] **KPI 4: Procured Volume (`.vendor-kpi-card:nth-child(4)`):**
  - Value: `23,600 kg` (`23.6 MT` polymer delivered to factory floor).
- [ ] **KPI 5: Procurement Value (`.vendor-kpi-card:nth-child(5)`):**
  - Value: `₹1,968,600` (Total cumulative linked supplier commercial spend).

---

### 4. Section 04: Search & Multi-Filter Toolbar
- [ ] **Search & Multi-Filter Popover:**
  - Real-time search query filtering by vendor name, code, GSTIN, telephone, or city.
  - Multi-Filter Popover (`showFilterPopover = true`):
    - GSTIN Status selector (All, Registered, Unregistered).
    - Supply Category dropdown (Polymer & Resin, Packaging & Crates, Color & Additives).
    - Has Active Procurements filter (Yes / No).
    - Location text filter (e.g. Baramati, Sinnar, Vapi, Mumbai).
    - Apply Filters and Reset All buttons.
  - Density Switcher: `compact`, `comfortable`, `spacious`.
  - Column Manager Dropdown: Toggles visibility across 9 individual columns.

---

### 5. Section 05: Register New Supplier Drawer (`isAddFormOpen = true`)
- [ ] **Drawer Mechanics & Real-Time Formatting:**
  - Slide-out side drawer with smooth backdrop blur.
  - Form Fields: Company / Supplier Name, Supply Category select, Primary Mobile / Telephone, GSTIN Identification Number (auto-uppercases input), Contact Person / Sales Manager, Registered Office / Warehouse Address.
  - Actions: `+ Save` (or `Update Supplier`) and `Cancel`.

---

### 6. Section 06: Official Printable Supplier Dossier Modal (`showDossierModal = true`)
- [ ] **Dossier Layout & Compliance Elements:**
  - Header: Clean Supplier Name (e.g. `Nilkamal Material Handling Crates`), Subtitle `Approved Supplier Commercial Dossier • ID #47`, and `Print Dossier` action.
  - **Banner Info Card:** Category badge (`Packaging & Crates`), GST Compliance (`Verified Active`), Batches Supplied (`1`), Total Spend (`₹462,500.00`).
  - **Company & Contact Details Card:** Supplier Code (`#VND-47`), Primary Phone (`9823098765`), Contact Person (`Direct Plant Office`), Plant Address (`Sinnar, Nashik, Maharashtra`).
  - **Procurement Commercials Card:** GSTIN Number (`27AAACN2233I1ZB`), Total Volume (`5,000 kg`), Materials Supplied badge pills (`Virgin HDPE Granules Grade 100`), Total Billing (`₹462,500.00`).
  - **Official Sign-off Block for Print:** Prepared By / ERP Clerk, Procurement Officer, Authorized Factory Signatory.
  - Actions: Close button and `Print Official Dossier` button (`printDossier()`).

---

### 7. Section 07: Viewport Scaling & Mobile Responsive Testing
- [ ] **Desktop Standard Viewport (1440 × 900):**
  - Full wide table with all 5 KPI cards in single line.
- [ ] **Laptop Standard Viewport (1280 × 720):**
  - Compact row spacing, zero horizontal layout overflow.
- [ ] **Netbook / Tablet Viewport (1100 × 680):**
  - Responsive stacking of KPI cards and filter controls.
- [ ] **Collapsed Sidebar Mode (68px Nav Rail):**
  - Fluid expansion of vendor directory grid.

---

## 🏆 Sign-off & Audit Certification Checklist
1. [x] Zero mathematical discrepancies between supplier billing totals and raw material procurement balances (`₹1,968,600` across 23,600 kg).
2. [x] 100% GST compliance verified across all 9 active vendors.
3. [x] Supplier dossier modal renders print-ready layout with 3 authorized signature lines.
4. [x] Zero console errors or layout shift during drawer or modal transitions.
