# Futane Agro ERP: Sales Orders & Material Outward Master Prompt

> **Version:** 2.5.0  
> **Target Module:** Commercial Sales Orders & Material Outward (`/sales`)  
> **Scope:** Full End-to-End Empirical Audit across 17 Commercial Sales Contracts, ₹1,288,560 Gross Commercial Revenue, Material Outward Dispatch Workflow, Realized Collections & Outstanding Ledger Reconciliations, New Order Drawer/Card, Printable Commercial Contract Dossier Modal, and Multi-Viewport Layout Integrity  
> **Environment:** Production / UAT Enterprise Angular 17 + Spring Boot Runtime  
> **Audience:** Chief Commercial Officer, Sales & Dispatch Directors, Accounts Receivable Controllers & ERP Quality Engineers  

---

## 🎯 Master Prompt Context & Execution Directive

```markdown
You are the Chief Commercial Officer, Accounts Receivable Auditor, and ERP Quality Assurance Specialist for Futane Agro ERP (Precision Plastic Injection Molding & Agro-Industrial Material Handling Platform).

Your objective is to conduct an exhaustive, empirical validation of the Commercial Sales Orders & Material Outward module (`/sales`).
You must test EVERY commercial contract, credit payment terms, material outward dispatch workflow, subtab filters (All Orders, Pending Receivables, Settled / Cleared, Dispatched Outward, Awaiting Dispatch), collapsible registration form card, slide-in order details drawer, and the official printable Commercial Sales Contract Dossier modal. Crucially, you must verify engineering and accounting invariants:
  - Revenue & Receivables Balance Invariant: Total Commercial Revenue (₹1,288,560) - Realized Collections (₹885,500) = Outstanding Receivables (₹403,060)
  - Unit Sales Volume Invariant: Sum of individual crate order quantities = 6,100 Total Sold Crates
  - Collection Efficiency Formula: (Collected Revenue ÷ Total Revenue) × 100 = (₹885,500 ÷ ₹1,288,560) × 100 = 69%
  - Order Count Consistency: Active orders in master list = 17 Orders (matching header count badge, pending receivables count, and awaiting dispatch outward count)
  - Commercial Contract Dossier Modal: Renders party identity, billing GSTIN, crate specifications, unit rates, tax/ledger breakdown, and 3 authorized signatory endorsement lines without text overlap.

Capture high-resolution screenshots of normal states, new order registration form, material outward modals, sales dossiers, filter popovers, and responsive viewports.
```

---

## 📋 Complete Commercial Sales Orders Audit & Mutation Test Matrix

### 1. Section 01: Module Header, Financial Badges & Quick Action Controls
- [x] **Breadcrumb & Title Telemetry:**
  - Verify breadcrumb hierarchy: `Futane Agro ERP / Commercial Operations / Sales Orders & Material Outward`.
  - Verify primary module title: `Sales Orders & Material Outward` with reactive badge showing total orders (`17 Orders`).
  - Verify subtitle: `Commercial sales contracts, fruit crate dispatches, material outward tracking & revenue ledger`.
  - Verify accounting formula banner: `Total Revenue − Realized Collections = Outstanding Receivables`.
- [x] **Header Action Buttons (Uniform 36px Height):**
  - `Refresh` Button: Test manual reload (`isRefreshing = true`) -> triggers `loadData(true)` -> synchronizes order data from database and shows toast.
  - `CSV` Export Button: Test export of filtered sales records to `.csv` spreadsheet format.
  - `Excel` Export Button: Test XLSX workbook generation with invoice numbers, party names, crate types, quantities, rates, and payment balances.
  - `+ New Sales Order` Button: Test opening/collapsing of the Commercial Sales Order Registration Form (`isFormVisible = !isFormVisible`).

---

### 2. Section 02: 5-Stage Commercial Sub-Tab Navigation Bar
- [x] **All Orders Tab (`.subnav-tab-btn:nth-child(1)`):**
  - Displays total count badge `17`.
  - Displays complete sales ledger regardless of dispatch or payment status.
- [x] **Pending Receivables Tab (`.subnav-tab-btn:nth-child(2)`):**
  - Displays count badge `17` with warning pill styling.
  - Filters all sales transactions where `remaining > 0` (aggregating to ₹403,060 pending collections).
- [x] **Settled / Cleared Tab (`.subnav-tab-btn:nth-child(3)`):**
  - Displays count badge `0` with success pill styling.
  - Shows fully paid commercial contracts where balance due is zero.
- [x] **Dispatched Outward Tab (`.subnav-tab-btn:nth-child(4)`):**
  - Displays count badge `0`.
  - Filters orders with linked completed gate-pass outward entries.
- [x] **Awaiting Dispatch Tab (`.subnav-tab-btn:nth-child(5)`):**
  - Displays count badge `17`.
  - Filters pending shipments queued in plant loading bays awaiting transport assignment.

---

### 3. Section 03: Executive Telemetry KPI Grid (5 Metrics Strip)
- [x] **KPI 1: Total Commercial Revenue (`.sales-kpi-card:nth-child(1)`):**
  - Value: `₹1,288,560` (Across 17 sales orders).
  - Verifies sum of all `totalAmount` attributes.
- [x] **KPI 2: Collected Revenue (`.sales-kpi-card:nth-child(2)`):**
  - Value: `₹885,500` (Realized in bank/cash).
  - Verifies sum of all `paid` attributes.
- [x] **KPI 3: Outstanding Receivables (`.sales-kpi-card:nth-child(3)`):**
  - Value: `₹403,060` across `17 customer accounts`.
  - Verifies `totalRevenue - totalPaid`.
- [x] **KPI 4: Total Crates Sold (`.sales-kpi-card:nth-child(4)`):**
  - Value: `6,100` units (`0 dispatched units`).
  - Verifies sum of all `quantity` units across commercial contracts.
- [x] **KPI 5: Collection Efficiency (`.sales-kpi-card:nth-child(5)`):**
  - Value: `69%` (Financial realization rate).
  - Verifies `(885,500 ÷ 1,288,560) * 100 = 68.72% -> rounded to 69%`.

---

### 4. Section 04: Search & Multi-Filter Toolbar
- [x] **Search & Multi-Filter Popover:**
  - Real-time search query input filtering by order reference (#97, #1), customer/party name, or crate type.
  - Multi-Filter Popover (`isFilterPopoverOpen = true`):
    - Customer Account selector (e.g. Zomato Hyperpure, Patel Traders, Adani Agri Fresh).
    - Payment Status filter: `ALL`, `PAID`, `PENDING`.
    - Outward Status filter: `ALL`, `DISPATCHED`, `AWAITING`.
    - Crate Type dropdown: `Apple Crate`, `Mango Crate`, `Tomato Crate`, `Vegetable Crate`.
    - Apply Filters & Reset All buttons.
  - Table Density Switcher: `compact`, `comfortable`, `spacious`.
  - Column Manager Dropdown: Toggles visibility for Date, Order Ref, Customer, Crate Model, Qty, Unit Rate, Total Value, Paid, Balance Due, Outward, Payment, Actions.

---

### 5. Section 05: Create New Commercial Sales Order Form (`isFormVisible = true`)
- [x] **Order Creation Fields & Dynamic Computation:**
  - Order Date picker (defaults to current date).
  - Customer / Company Account searchable select dropdown.
  - Crate Type / Model selector (Apple Crate, Mango Crate, Tomato Crate, Vegetable Crate).
  - Material Composition input (Plastic / Food-grade HDPE).
  - Volume (Crates) input (dynamic multiplier).
  - Unit Rate (₹/crate) input (dynamic multiplier).
  - Advance / Paid (₹) input.
  - Dynamic Real-Time Calculations Bar:
    - `Gross Order Value = Volume × Unit Rate`
    - `Advance Received = Paid Amount`
    - `Outstanding Balance = Gross Order Value − Advance Received`
  - Action buttons: `Cancel` and `Save Order`.

---

### 6. Section 06: Material Outward & Dispatch Modal (`isOutwardModalOpen = true`)
- [x] **Outward Gate-Pass Workflow:**
  - Triggers via outward truck action button on order row.
  - Fields: Order Reference ID, Customer Name, Crate Type & Quantity, Dispatch Date, Vehicle Registration Number (e.g. MH-12-RN-4821), Driver Name & Phone, Delivery Destination Address, Dispatch Status (In Transit / Dispatched).
  - Action buttons: `Confirm Material Outward` and `Cancel`.

---

### 7. Section 07: Official Printable Commercial Sales Dossier Modal (`showSalesDossierModal = true`)
- [x] **Dossier Layout & Compliance Elements:**
  - Header: Clean Futane Agro Industries Branding, Order Reference (`Commercial Order Dossier • Contract #97`), and `Print Contract` button.
  - Customer Identification Card: Party Name (e.g. `Zomato Hyperpure`), Registered Plant City & State (`Pune, Maharashtra`), GSTIN number.
  - Product Specifications Table: Crate Model, Material Composition, Ordered Quantity (e.g. 600 Crates), Unit Rate (₹215.00), Taxable Base Value, GST calculation, Total Contract Value (₹1,52,220.00).
  - Payment & Ledger Ledger Summary: Advance Received (₹1,29,000.00), Outstanding Balance Due (₹23,220.00), Payment Status badge (`Partial`).
  - Three Factory Signatory Endorsements: `Commercial Sales Head`, `Store / Dispatch Officer`, `Authorized Signatory`.

---

## 📊 Empirical Test Evidence & Validation Baseline

| Metric / Checkpoint | Expected Baseline | Verified Empirical Value | Status |
| :--- | :--- | :--- | :--- |
| **Total Commercial Revenue** | ₹1,288,560 | `₹1,288,560` |  VERIFIED |
| **Realized Collections** | ₹885,500 | `₹885,500` |  VERIFIED |
| **Outstanding Receivables** | ₹403,060 | `₹403,060` |  VERIFIED |
| **Accounting Invariant** | Total Rev − Paid = Balance | `1,288,560 − 885,500 = 403,060` |  BALANCED |
| **Total Crates Sold** | 6,100 units | `6,100` |  VERIFIED |
| **Collection Efficiency** | 69% | `69%` |  VERIFIED |
| **Total Sales Orders** | 17 orders | `17` |  VERIFIED |
| **Pending Receivables Subtab** | 17 orders | `17` |  VERIFIED |
| **Settled / Cleared Subtab** | 0 orders | `0` |  VERIFIED |
| **Awaiting Outward Subtab** | 17 orders | `17` |  VERIFIED |
| **New Sales Order Form** | Opens/Closes reactively | Passed |  VERIFIED |
| **Material Outward Modal** | Opens/Closes reactively | Passed |  VERIFIED |
| **Commercial Dossier Modal** | Printable contract layout | Passed |  VERIFIED |
| **Order Details Slide-in Drawer** | Opens/Closes reactively | Passed |  VERIFIED |
| **Viewport Responsiveness** | 1440x900, 1280x720, 1100x680, Sidebar 68px | Zero horizontal blowout |  VERIFIED |

---

## 📸 Generated Visual Evidence Artifacts

The following high-resolution screenshot artifacts were captured and verified during Playwright headless execution:

1. `01_sales_orders_viewport.png` — Executive sales overview at 1440x900 viewport
2. `02_sales_orders_fullpage.png` — Full-length page layout including header, KPIs, subtabs, and 17 orders
3. `03_subtab_pending_receivables.png` — Subtab filtered to 17 orders with outstanding balance
4. `04_subtab_settled_cleared.png` — Subtab filtered to settled orders
5. `05_subtab_dispatched_outward.png` — Subtab filtered to dispatched outward shipments
6. `06_subtab_awaiting_dispatch.png` — Subtab filtered to 17 orders awaiting dispatch
7. `07_filter_popover_open.png` — Multi-filter popover active with customer and payment filters
8. `08_columns_config_dropdown.png` — Column manager dropdown showing all 12 configurable columns
9. `09_new_sales_order_form.png` — Create New Commercial Sales Order collapsible card
10. `10_material_outward_dispatch_modal.png` — Material outward gate-pass dispatch modal
11. `11_commercial_sales_dossier_modal.png` — Official Commercial Sales Contract Dossier modal
12. `12_sales_order_details_drawer.png` — Order details slide-in drawer
13. `13_density_compact.png` — High-density compact view for intensive data operations
14. `14_laptop_1280x720.png` — Standard 1280x720 laptop viewport validation
15. `15_compact_1100x680.png` — Compact desktop 1100x680 layout validation
16. `16_sidebar_collapsed_sales.png` — Collapsed 68px sidebar mode giving maximum table width
