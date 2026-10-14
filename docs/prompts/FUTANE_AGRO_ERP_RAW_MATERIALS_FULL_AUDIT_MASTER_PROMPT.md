# Futane Agro ERP: Polymer Raw Materials & PP Granules Inventory Master Prompt

> **Version:** 2.5.0  
> **Target Module:** Polymer Raw Materials & PP Granules Procurement Ledger (`/raw-materials`)  
> **Scope:** Full End-to-End Empirical Audit across Virgin Polymers (HDPE / PP), Recycled Compounds, Color Masterbatch Pigments, Supplier GSTIN Verification, Inward Goods Receipt Notes (GRN), and Live Batch Cost Calculations  
> **Environment:** Production / UAT Enterprise Angular 17 + Spring Boot Runtime  
> **Audience:** Lead Systems Architects, Procurement Directors, QC Chemical Engineers & Inventory Auditors  

---

## 🎯 Master Prompt Context & Execution Directive

```markdown
You are the Chief Procurement Architect, Materials Quality Control Auditor, and ERP Systems Engineer for Futane Agro ERP (Precision Plastic Injection Molding & Agro-Industrial Material Handling Platform).

Your objective is to conduct an exhaustive, empirical validation of the Polymer Raw Materials & PP Granules Inventory module (`/raw-materials`).
You must test EVERY polymer procurement batch record, supplier GSTIN linkage, melt-flow index classification, live batch cost calculation (`Weight × Rate = Total Batch Cost`), multi-category subnav filters (Virgin, Recycled, Masterbatch, Packaging, High Volume), Goods Receipt Note (GRN) inspection sheet voucher modal, and responsive viewports. Crucially, you must verify engineering and financial invariants:
  - Material Mass Balance Invariant: Sum of individual procurement batches = Total Polymer Volume (23,600 kg / 23.6 Metric Tonnes)
  - Inventory Asset Valuation: Sum(Batch Weight × Unit Rate) = Total Inventory Capitalization (₹19,68,600)
  - Weighted Average Procurement Rate: Total Valuation ÷ Total Net Weight = Weighted Average Cost per kg (₹83.42 / kg)
  - Material Inward & Inspection Note (GRN) Invariant: Displays verified tare/gross scale traceability, supplier GSTIN, quality QC status "Passed & Accepted", and 3 authorized signatory endorsement lines without overflow.

Capture high-resolution screenshots of normal states, active procurement drawers, GRN voucher modals, filter popovers, and responsive viewports.
```

---

## 📋 Complete Polymer Raw Materials Audit & Mutation Test Matrix

### 1. Section 01: Module Header, Status Badges & Quick Action Controls
- [ ] **Breadcrumb & Title Telemetry:**
  - Verify breadcrumb hierarchy: `Futane Agro ERP / Inventory & Supply / Polymer Raw Materials & PP Granules`.
  - Verify primary module title: `Polymer Raw Materials & PP Granules Inventory` with reactive badge showing total batches (`8 Batches`).
  - Verify subtitle: `Raw plastic resin procurements, polymer inventory ledger, unit rates & batch quality verification`.
  - Verify engineering formula chip: `Opening + Procured − Consumed = Available`.
- [ ] **Header Action Buttons (Uniform 36px Height):**
  - `Refresh` Button: Test manual sync trigger (`isLoading = true`) -> triggers `loadData(true)` -> synchronizes raw material records and shows success toast.
  - `CSV` Export Button: Test export of polymer procurement records to `.csv` format.
  - `Excel` Export Button: Test XLSX workbook generation with vendor details, GSTIN, and unit rates.
  - `+ Log Procurement Batch` Button: Test opening of the slide-in Add Procurement Drawer (`isAddFormOpen = true`).

---

### 2. Section 02: 6-Category Sub-Tab Navigation Bar
- [ ] **All Materials Tab (`.subnav-tab-btn:nth-child(1)`):**
  - Displays total count badge `8`.
  - Shows all procurement lots across all material families.
- [ ] **Virgin Polymer (HDPE / PP) Tab (`.subnav-tab-btn:nth-child(2)`):**
  - Displays count badge `2` (e.g. `Food-Grade PP Granules`, `Virgin HDPE Granules Grade 100`).
- [ ] **Recycled & Compounds Tab (`.subnav-tab-btn:nth-child(3)`):**
  - Displays count badge `1` (e.g. `Recycled Polyethylene Compound`).
- [ ] **Masterbatch & Additives Tab (`.subnav-tab-btn:nth-child(4)`):**
  - Displays count badge `2` (e.g. `Blue/Red Colour Masterbatch Pigment`, `UV Stabilizer Masterbatch`).
- [ ] **Packaging & Cartons Tab (`.subnav-tab-btn:nth-child(5)`):**
  - Displays count badge `1` (e.g. `Corrugated 5-Ply Outer Carton Sheets`).
- [ ] **High Volume (1,000+ kg) Tab (`.subnav-tab-btn:nth-child(6)`):**
  - Displays count badge `5` for industrial bulk lots meeting or exceeding 1 metric tonne.

---

### 3. Section 03: Executive Telemetry KPI Ribbon (5 Metrics Strip)
- [ ] **KPI 1: Procurements (`.raw-kpi-card:nth-child(1)`):**
  - Value: `8 Batches` logged in cumulative purchase orders.
- [ ] **KPI 2: Polymer Volume (`.raw-kpi-card:nth-child(2)`):**
  - Value: `23,600 kg` (`23.6 Metric Tonnes` resin staged in silo bins).
- [ ] **KPI 3: Inventory Valuation (`.raw-kpi-card:nth-child(3)`):**
  - Value: `₹1,968,600` (Total raw material asset capitalization).
- [ ] **KPI 4: Weighted Average Cost (`.raw-kpi-card:nth-child(4)`):**
  - Value: `₹83.42 /kg` average procurement rate.
- [ ] **KPI 5: Approved Suppliers (`.raw-kpi-card:nth-child(5)`):**
  - Value: `8 Vendors` in verified supplier directory.

---

### 4. Section 04: Search & Multi-Filter Toolbar
- [ ] **Search & Multi-Filter Popover:**
  - Real-time search query filtering by material name, grade, supplier, batch ID, or invoice ref.
  - Multi-Filter Popover (`showFilterPopover = true`):
    - Supplier / Vendor searchable select.
    - Material Classification dropdown (Virgin, Recycled, Masterbatch, Packaging).
    - Batch Net Weight range selector (< 500kg, 500–1500kg, > 1500kg).
    - Date From and Date To range filters.
    - Apply Filters and Reset All buttons.
  - Density Switcher: `compact`, `comfortable`, `spacious`.
  - Column Manager Dropdown: Toggles visibility for 10 individual columns.

---

### 5. Section 05: Log Procurement Batch Drawer (`isAddFormOpen = true`)
- [ ] **Drawer Mechanics & Real-Time Calculation:**
  - Slide-out side drawer with smooth backdrop blur.
  - Form Fields: Purchase Date, Approved Vendor (searchable select with GSTIN pill), Purchase Bill / Tax Invoice No., Material Grade & Description (with quick preset chips: `Virgin`, `Food-Grade`, `HDPE`, `Recycled`), Weighbridge Slip Ref, Net Weight (kg), Purchase Rate (₹/kg).
  - **Live Batch Cost Tile:** Dynamically calculates `Net Batch Cost: Weight × Rate` in real time (e.g. `1,000 kg × ₹95.00/kg = ₹95,000.00`).
  - Actions: `+ Save Record` (or `Update Record`) and `Cancel`.

---

### 6. Section 06: Goods Receipt Note (GRN) / Inspection Voucher Modal (`showInspectionModal = true`)
- [ ] **Voucher Layout & QC Audit Elements:**
  - Official Header: `Material Inward & Inspection Note (GRN)` by `Futane Agro Industries Pvt. Ltd. — Quality & Weight Verification`.
  - Voucher Meta: Reference ID (`GRN-RM-34`), Inward Date (`05/08/2026`), Classification Badge (`Recycled Comp`), and QC Status (`Passed & Accepted`).
  - **Approved Supplier Profile Card:** Supplier Name, GSTIN / Tax ID, Plant Address, Contact Mobile.
  - **Scale & Invoice Traceability Card:** Tax Invoice Ref, Weighbridge Slip, Electronic Scale Calibration, Quality Grade.
  - **Polymer Specification & Cost Table:** Material Description, Verified Net Weight (e.g. `6,500.0 kg`), Contract Rate (`₹64.00/kg`), Total Batch Payable (`₹416,000.00`).
  - **Verification Signatures Strip:** Store Inward Incharge, Quality Control Inspector, Plant Commercial Manager.
  - Actions: `Close` and `Print Inward Note` (`printInspectionNote()`).

---

### 7. Section 07: Viewport Scaling & Mobile Responsive Testing
- [ ] **Desktop Standard Viewport (1440 × 900):**
  - Full wide table with all 5 KPI cards in single line.
- [ ] **Laptop Standard Viewport (1280 × 720):**
  - Compact row spacing, zero horizontal overflow.
- [ ] **Netbook / Tablet Viewport (1100 × 680):**
  - Responsive stacking of KPI cards and filter controls.
- [ ] **Collapsed Sidebar Mode (68px Nav Rail):**
  - Fluid expansion of procurement data grid.

---

## 🏆 Sign-off & Audit Certification Checklist
1. [x] Zero mathematical discrepancies in weighted average cost formula (`₹83.42/kg`).
2. [x] Real-time reactive updates across all 6 subnav filter counts.
3. [x] GRN voucher modal adheres to quality control documentation standards with 3 signature verification fields.
4. [x] Zero console warnings or memory leaks during drawer or modal transitions.
