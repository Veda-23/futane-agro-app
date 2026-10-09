# MASTER ENTERPRISE DIRECTIVE: UNIFIED 5-LAYER TAB DESIGN SYSTEM
**Futane Agro ERP — Comprehensive UI Parity Specification for All Remaining Feature Tabs**

> **STATUS**: CANONICAL PRODUCTION BENCHMARK  
> **SCOPE**: All Feature Tabs (Operations, Supply Chain, Finance, Management, Admin) — Excluding Settings  
> **REFERENCE BENCHMARK**: Sales Orders & Material Outward Canonical Layout (`sales.component.html`)

---

## 1. Executive Summary & Required Transformations

An audit of the repository reveals slight visual divergences across feature tabs:
1. **Header Layout Variation**: Some tabs placed action buttons in a separate row or top right, whereas the canonical pattern features the Title, Icon Pod, Subtitle, and an immediate bottom action row (`Refresh`, `CSV`, `Excel`, `+ Primary CTA`).
2. **Missing or Inconsistent Subtab Ribbons**: Several tabs either had no subtabs ribbon or used plain square bootstrap tabs rather than the rounded, filled pill badges with live counter chips.
3. **Telemetry KPI Cards**: In some tabs, KPI cards were nested inside the table card or had mismatched height/typography. They must be standardized to a standalone 4-column horizontal grid (`grid-template-columns: repeat(4, 1fr)`) with dedicated icon pods and progress bars.
4. **Toolbar Filter Sprawl**: Multi-input filter forms spanning across table headers must be consolidated into a single debounced search input + a single `[ Filters (N) ]` popover trigger button.
5. **Table Row Actions**: Collapsing or text-heavy action buttons must be converted to 28×28px `.btn-icon-action` micro-buttons (`.btn-view`, `.btn-edit`, `.btn-delete`, `.btn-print`, `.btn-pdf`) with zero text overlap.

---

## 2. Canonical 5-Layer Layout Anatomy

Every remaining tab in Futane Agro ERP MUST implement the following five structural layers in exact vertical order:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 1: BREADCRUMB TRAIL                                                             │
│ ⌂ Futane Agro ERP  /  Category Path  /  ACTIVE MODULE NAME                             │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ LAYER 2: MASTER PAGE HEADER CARD                                                       │
│ ┌──────┐  Module Main Title  [ N Records ]                                             │
│ │ ICON │  Descriptive subtitle explaining business domain, statutory context           │
│ └──────┘  [⟳ Refresh]   [↓ CSV]   [⊞ Excel]   [+ Primary Domain CTA]                  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ LAYER 3: PILL SUBTABS NAVIGATION BAR                                                   │
│ [🛒 All (N)]   [🕒 Status A (N)]   [✓ Status B (N)]   [🚚 Status C (N)]   [...]        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ LAYER 4: STANDALONE 4-CARD KPI TELEMETRY GRID                                          │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│ │ Blue Icon    │  │ Green Icon   │  │ Red Icon     │  │ Amber Icon   │                 │
│ │ KPI 1: TOTAL │  │ KPI 2: GOOD  │  │ KPI 3: ALERT │  │ KPI 4: RATIO │                 │
│ │ ₹ Value / Qty│  │ ₹ Value / Qty│  │ ₹ Value / Qty│  │ % or Avg     │                 │
│ │ Meta caption │  │ Meta caption │  │ Meta caption │  │ Progress Bar │                 │
│ └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘                 │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ LAYER 5: TWO-ZONE TABLE TOOLBAR & DATA LEDGER PANEL                                    │
│ ┌───────────────────────────────────────────────┐  ┌─────────────────────────────────┐ │
│ │ [🔍 Search placeholder...]   [⏳ Filters (N)] │  │ [≡ Compact/Comfortable] [▦ Cols]│ │
│ └───────────────────────────────────────────────┘  └─────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ DATA TABLE: Balanced % Columns | Tabular Monospace | 28x28px Micro Action Buttons  │ │
│ ├────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ <tfoot> COLUMN-ALIGNED TOTALS ROW: Bold Totals across all monetary/quantity columns │ │
│ ├────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ PAGINATION FOOTER: Showing X to Y of Z records | Rows Selector | Prev | Next       │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Architectural Specifications by Layer

### Layer 1: Breadcrumb Trail
- **Selector**: `.breadcrumb-trail` or `.[module]-breadcrumb-trail`
- **Icon**: `bi bi-house` at the start.
- **Coloring**: Muted slate (`#64748b`), separator `/` (`#94a3b8`), active module highlighted in primary bold (`#0B47D4`).
- **Margin**: 6px above the header card.

### Layer 2: Master Page Header Card
- **Selector**: `.page-header-card`
- **Container**: White surface (`#ffffff`), `border: 1px solid rgba(99, 102, 241, 0.12)`, `border-radius: 14px`, soft elevation `box-shadow: 0 4px 20px -2px rgba(11, 71, 212, 0.06)`.
- **Icon Pod**: Exactly 46×46px, border radius 12–14px, 135° gradient, glass reflection pseudo-element (`::after`), white icon (22px).
- **Title Block**:
  - `h1`: 20px, font-weight 800, tracking -0.02em.
  - Count Pill: `border-radius: 999px`, background `rgba(11, 71, 212, 0.08)`, text `#0B47D4`, border `1px solid rgba(11, 71, 212, 0.2)`.
  - Subtitle: 12.5px, text `#64748b`, font-weight 450.
- **Action Buttons**:
  - Secondary: `Refresh` (reload icon), `CSV` (download icon), `Excel` (spreadsheet icon) — height 36px, border `#cbd5e1`, background `#f8fafc`.
  - Primary CTA: Height 38px, gradient `#0B47D4` to `#0066FF` (or emerald green for Production/Dispatch), bold text, plus icon, subtle drop shadow.

### Layer 3: Pill Subtabs Navigation Bar
- **Selector**: `.subnav-tabs-group`
- **Structure**: Horizontal scrolling ribbon with `gap: 8px`.
- **Button Styling**:
  - Inactive: Pill shape (`border-radius: 9999px`), background `rgba(241, 245, 249, 0.85)`, border `1px solid rgba(203, 213, 225, 0.7)`, text `#475569`.
  - Counter Badge: Muted badge with pill border.
  - Active: Solid gradient background (`linear-gradient(135deg, #0B47D4 0%, #0066FF 100%)`), text `#ffffff`, active elevation shadow (`0 4px 14px rgba(11, 71, 212, 0.32)`), white counter pill.

### Layer 4: Standalone 4-Card KPI Telemetry Grid
- **Selector**: `.telemetry-kpi-grid`
- **Layout**: CSS Grid with `repeat(4, 1fr)` on desktop, 2 columns on tablet, 1 column on mobile.
- **Card Anatomy**:
  - Icon Pod (44×44px):
    - **Card 1 (Blue)**: Primary volume or gross amount (`linear-gradient(135deg, #0B47D4, #0066FF)`).
    - **Card 2 (Green)**: Positive realization, cleared items, or good stock (`linear-gradient(135deg, #10B981, #059669)`).
    - **Card 3 (Red)**: Outstanding balance, overdue receivables, scrap, or critical shortage (`linear-gradient(135deg, #EF4444, #DC2626)`).
    - **Card 4 (Amber/Purple)**: Efficiency ratio, percentage, average cycle time (`linear-gradient(135deg, #F59E0B, #D97706)`).
  - Label: 10.5px, bold, uppercase, letter-spacing 0.05em, text `#64748b`.
  - Value: 20px, font-weight 800, `font-variant-numeric: tabular-nums`.
  - Subtitle / Meta: 11px, muted text with icon indicator.
  - Card 4 Metric Bar: Progress bar (`height: 4px; background: #e2e8f0`) with dynamic colored fill (`width.%`).

### Layer 5: Two-Zone Table Toolbar & Panel
- **Toolbar Left**:
  - Wide search box (min-width 240px) with magnifying glass icon and clear button.
  - Consolidated `[ Filters ]` toggle button with counter badge (`*ngIf="activeFiltersCount > 0"`). Clicking opens a dedicated popover panel; dismisses on click outside.
- **Toolbar Right**:
  - Density Switcher: Segmented buttons for Compact (30px rows), Comfortable (42px rows), and Spacious (54px rows).
  - Columns Selector: Dropdown checklist to show/hide specific columns dynamically.
- **Table Data Grid**:
  - Table layout: `table-layout: fixed !important`, width `100%`.
  - Monospace formatting: All IDs, Codes, GSTINs, and currency amounts use `'JetBrains Mono', Consolas, monospace`.
  - Row Actions: Dedicated `.row-actions-group` housing 28×28px `.btn-icon-action` buttons (`.btn-view`, `.btn-edit`, `.btn-delete`, `.btn-print`, `.btn-pdf`).
  - Column-aligned `<tfoot>`: Summary totals row mirroring the column widths.
  - Pagination Footer: Record range (`Showing 1 to 10 of 17`), Rows Per Page selector, `Prev`, `Page 1 of N`, `Next`.

---

## 4. Master Domain Blueprint for All Remaining Tabs

| Tab Route | Module Title | Primary CTA | 5 Subtab Pills | Card 1 (Blue) | Card 2 (Green) | Card 3 (Red) | Card 4 (Amber) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`production`** | **Daily Manufacturing & Output** | `+ New Production Batch` | All Batches, Operating, Completed, Rejected, Maintenance | Total Crates Produced | First Quality Yield | Scrap / Rejected Crates | Machine OEE Efficiency (%) |
| **`monthly-production`** | **Monthly Production Summary** | `Export Monthly Audit` | All Months, FY 2025-26, Q1, Q2, Target Achieved | Cumulative Annual Output | Average Daily Target | Material Wastage Rate | Monthly Target Achievement (%) |
| **`inventory`** | **Finished Goods Crates Warehouse** | `+ Stock Adjustment` | All SKUs, In Stock, Low Stock, Critical Deficit, Reorder | Total Crates In Stock | Available For Sale | Committed / Reserved | Warehouse Capacity Utilization (%) |
| **`machines`** | **Injection Molding Machinery** | `+ Register Machine` | All Machines, Running, Idle, Under Maintenance, Breakdown | Total Machines Registered | Active Production Units | Units In Breakdown / Idle | Fleet Availability Rate (%) |
| **`raw-materials`** | **Raw Granules & Pigments** | `+ Add Material Stock` | All Materials, PP Granules, HDPE, Color Masterbatch, Low Stock | Total Granule Stock (kg) | Safe Reserve Level | Critical Shortage Items | Monthly Inward Consumption (kg) |
| **`vendors`** | **Suppliers & Material Vendors** | `+ New Vendor Account` | All Vendors, Active, Polymer Suppliers, Logistics, Inactive | Total Registered Vendors | Active Suppliers | Outstanding Payables (₹) | On-Time Delivery Rating (%) |
| **`sales`** *(Ref)* | **Sales Orders & Material Outward** | `+ New Sales Order` | All Orders, Pending Receivables, Settled/Cleared, Dispatched, Awaiting | Total Commercial Revenue (₹) | Collected Revenue (₹) | Outstanding Receivables (₹) | Collection Efficiency (%) |
| **`dispatch`** | **Gate Pass & Material Dispatch** | `+ New Gate Pass` | All Gate Passes, Dispatched, In Transit, Delivered, Awaiting Truck | Total Gate Passes Issued | Successfully Delivered | Dispatches In Transit | On-Time Dispatch Rate (%) |
| **`transports`** | **Commercial Freight Transporters** | `+ Add Transporter` | All Transporters, Active Fleets, Pending Freight, Settled, Inactive | Total Partner Transporters | Active Vehicles En Route | Freight Payables Due (₹) | Fleet Compliance Score (%) |
| **`drivers`** | **Commercial Drivers Directory** | `+ Register Driver` | All Drivers, On Duty, Available, In Transit, Leave | Registered Fleet Drivers | Drivers Currently En Route | Expiring License Alerts | Safety & Trip Rating (★) |
| **`parties`** | **Customer Accounts & Parties** | `+ New Customer Account` | All Parties, High Volume, Regular, Overdue Balance, Inactive | Total Customer Accounts | Verified GST Accounts | Accounts with Pending Balances | Active Trade Retention (%) |
| **`payments`** | **Commercial Payment Registry** | `+ Record Payment` | All Receipts, Bank Transferred, Cash Received, Cheques In Clearing, Bounced | Total Realized Inward (₹) | Bank RTGS / NEFT (₹) | Cash Ledger Amount (₹) | Cheques In Clearing (₹) |
| **`invoices`** | **GST Billing Hub & Tax Invoices** | `+ Create Invoice` | All Invoices, Fully Paid, Partial / Pending, Overdue, High Value (≥₹50k) | Total Invoices Billed | Collected Revenue (₹) | Receivables Balance (₹) | Statutory GST Tax Billed (₹) |
| **`billinghub`** | **Commercial Proforma & Estimates** | `+ New Proforma Bill` | All Quotations, Approved, Converted to Tax Invoice, Drafts, Expired | Total Quotation Pipeline (₹) | Converted to Tax Invoices | Pending Approvals (₹) | Quotation Conversion Rate (%) |
| **`bank`** | **Bank Accounts & Treasury** | `+ New Bank Entry` | All Accounts, Current Account, Cash Credit (CC), Cash Chest, Reconciled | Total Liquid Funds (₹) | Main Current Account (₹) | Available CC Limit (₹) | Uncleared Reconciliation (₹) |
| **`expenses`** | **Factory Operational Expenses** | `+ Log Expense` | All Expenses, Power & Fuel, Maintenance, Logistics, Administration | Total Monthly Expense (₹) | Paid Cash / Bank (₹) | Pending Expense Invoices | Budget Variance (%) |
| **`salaries`** | **Factory Payroll & Worker Wages** | `+ Process Payroll` | All Staff, Factory Operators, Logistics Crew, Paid This Month, Pending | Total Monthly Wage Bill (₹) | Cleared Wages Disbursed | Pending Salary Disbursals | Overtime Hours Logged |
| **`employees`** | **Workforce & Staff Directory** | `+ Onboard Employee` | All Workforce, Active, Plant Operators, Security & Maintenance, Inactive | Total Employed Staff | Active On Floor Today | Contract / Casual Labor | Workforce Attendance Rate (%) |
| **`reports`** | **Financial & Statutory Reports** | `Generate Report` | All Reports, GST R1/R3B, Sales Summary, Inventory Valuation, Ledger | Reports Compiled | Downloaded Statements | Audit Flagged Inconsistencies | Statutory Compliance Score (%) |
| **`analytics`** | **Executive Intelligence & AI Trends** | `Refresh Telemetry` | All Trends, Revenue Forecast, Machine Output, Margin Analysis, Alerts | Projected 30-Day Revenue (₹) | Production Run Rate (pcs/hr) | Gross Profit Margin (%) | Machine Downtime Anomaly Index |
| **`audit-logs`** | **System Security & Audit Trails** | `Export Audit Trail` | All Logs, Financial Events, Auth & Logins, Data Mutations, Critical Alerts | Total Audit Events Logged | Master Record Updates | Security Access Events | High Priority Critical Alerts |

---

## 5. Micro-Interaction & Action Button Standardization

### 28×28px Micro-Action Buttons (`.btn-icon-action`)
Row action cells MUST NOT render plain text or wide buttons that break column budgets. They must always use:
```html
<div class="row-actions-group">
  <button type="button" class="btn-icon-action btn-view" (click)="viewEntity(item)" title="View Details">
    <i class="bi bi-eye"></i>
  </button>
  <button type="button" class="btn-icon-action btn-edit" (click)="editEntity(item)" title="Edit Record">
    <i class="bi bi-pencil"></i>
  </button>
  <button type="button" class="btn-icon-action btn-print" (click)="printEntity(item)" title="Print Documentation">
    <i class="bi bi-printer"></i>
  </button>
  <button type="button" class="btn-icon-action btn-delete" (click)="deleteEntity(item)" title="Delete / Deactivate">
    <i class="bi bi-trash"></i>
  </button>
</div>
```

**Style Contract**:
- Width: `28px !important`
- Height: `28px !important`
- Border-radius: `6px`
- Border: `1px solid #cbd5e1`
- Hover States:
  - `.btn-view`: Border `#0B47D4`, Color `#0B47D4`, Background `rgba(11, 71, 212, 0.08)`.
  - `.btn-edit`: Border `#059669`, Color `#059669`, Background `rgba(5, 150, 105, 0.08)`.
  - `.btn-print`: Border `#6366f1`, Color `#6366f1`, Background `rgba(99, 102, 241, 0.08)`.
  - `.btn-delete`: Border `#ef4444`, Color `#ef4444`, Background `rgba(239, 68, 68, 0.08)`.

---

## 6. Implementation Checklist for Each Tab

When updating any remaining tab, verify against this checklist:
1. [ ] **Layer 1**: Breadcrumb trail is present with `bi-house` icon and active module name in blue.
2. [ ] **Layer 2**: Master page header card has 46×46px icon box, title, count pill, subtitle, and bottom row with `Refresh`, `CSV`, `Excel`, and primary `+ CTA`.
3. [ ] **Layer 3**: Subtabs ribbon contains 4–5 pill-shaped buttons with count badges; active pill has solid blue gradient background.
4. [ ] **Layer 4**: Telemetry grid has exactly 4 KPI cards (Blue, Green, Red, Amber) with uppercase labels, formatted tabular values, and sub-labels (card 4 has progress bar).
5. [ ] **Layer 5**: Table toolbar has search input, single `[ Filters (N) ]` popover trigger button, density switcher (3 icons), and `[ Columns (N) ]` manager.
6. [ ] **Table Ledger**: Proportional column budget (sum = 100%), monospace IDs and amounts, `.btn-icon-action` micro-buttons, column-aligned totals in `<tfoot>`.
7. [ ] **Footer**: Enterprise pagination footer with range display, rows selector, and page navigation buttons.
8. [ ] **Build Validation**: Validated via `ng build --configuration production` with zero TypeScript or template compilation errors.
