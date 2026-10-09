# MASTER ARCHITECTURAL DIRECTIVE & IMPLEMENTATION PROMPT
## Alignment of Invoices Tab to Canonical 3-Structure ERP Layout Standard

> **Directive ID**: `ERP-INVOICES-CANONICAL-ALIGNMENT-2026-V1`  
> **Status**: Enforced across **Futane Agro ERP**  
> **Target Module**: `InvoicesComponent` (`frontend/src/app/components/features/invoices/`)  
> **Reference Canonical Models**: `ProductionComponent` & `InventoryComponent`  

---

## 1. Problem Audit: Why the Invoices Tab Looked Broken & Mismatched

A comprehensive visual and DOM audit of the Invoices Tab revealed 5 primary reasons why its symbols, fonts, and table layout deviated sharply from other ERP tabs:

### 1. Inverted Architecture (No 3-Structure Hierarchy)
- **Nested KPI Cards**: In the Invoices tab, the KPI summary cards were placed **inside** `.invoices-main-panel` rather than being a clean, standalone Structure 2 telemetry grid.
- **External Floating Subtabs**: An extra floating ribbon (`.inv-subtabs-strip`) hovered between the header and table, creating visual noise and fragmenting space.
- **Cluttered 7-Input Filter Bar**: Instead of the canonical single `[ Filters (N) ]` popover button, 7 loose input controls (`Search`, `Date`, `Party Select`, `Status Select`, `Min ₹`, `Max ₹`, `Reset`, `Print`, `CSV`) spanned horizontally across the table, squishing space and pushing the data ledger down.

### 2. Actions Column Text Collision & Missing Button Styles
- The table row actions in the `ACTIONS` column (`View`, `Print`, `PDF`) lacked explicit dimensions, margins, and inline-flex styling, causing them to render right against one another as an unreadable clump (`ViewPrintPDF`).
- In other tabs, row action buttons are compact, pill or square-bordered buttons with SVG/bi icons and distinct color themes (View = Blue, Print = Neutral, PDF = Red).

### 3. Summary Footer (tfoot) Text Overlap
- The table summary row had `Taxable`, `GST`, and `Total Bill` sums collapsing into each other (`₹1,092,000.00 ₹196,560.00 ₹1,288,560.00`) without respecting table column boundaries or numerical right-alignment.

### 4. Font & Typography Inconsistencies
- Monospace font styling (`.font-mono`) was applied inconsistently with mismatched line-heights, raw unformatted currency signs (`₹` missing proper tabular kerning), and oversized table padding.
- Canonical tabs use `Inter, system-ui` with `font-variant-numeric: tabular-nums` for crisp currency rendering.

### 5. Header Button Wrapping
- Header right-side actions wrapped under the page title on standard 1440px displays due to excessive metadata badges (`Verified GST Ledger`, full GSTIN, FY pills) lacking responsive container bounds and flex `nowrap` containment.

---

## 2. The Canonical 3-Structure Layout for Invoices

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ STRUCTURE 1: COMPACT PROFESSIONAL INVOICE HEADER                                                       │
│ ├── Unified Breadcrumbs: Futane Agro ERP / Financial Management / Tax Invoices & Billing Ledger       │
│ ├── LEFT: 46×46px Hero Icon Box (Receipt gradient) + Title + Total Count Pill + Subtitle               │
│ └── RIGHT: Statutory Pill (GSTIN) + [Refresh] + [Export ▾] + [+ Create Invoice] Primary CTA            │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ STRUCTURE 2: COMPACT KPI TELEMETRY GRID (4 Standalone Cards)                                           │
│ ├── Total Invoices (Blue) — Count & Record Volume                                                      │
│ ├── Total Billed (Indigo) — Gross Invoiced Value (Taxable + 18% GST)                                   │
│ ├── Collected Revenue (Green) — Cash & Bank Realized                                                   │
│ └── Receivables Balance (Red) — Outstanding Party Balance                                              │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ STRUCTURE 3: UNIFIED TABLE PANEL CARD (Single Glass Panel)                                             │
│ ├── NO duplicate internal headers or nested KPI wrappers                                              │
│ ├── TWO-ZONE TOOLBAR:                                                                                  │
│ │   ├── LEFT: [🔍 Search party, invoice no, GSTIN...] + Single [🎯 Filters (N)] + [↺ Clear Filters]     │
│ │   └── RIGHT: [=|=| Density Switcher] + [▦ Columns (10)] Manager Dropdown                             │
│ ├── CONSOLIDATED FILTER POPOVER:                                                                       │
│ │   ├── Field 1: Invoice Status (All, Fully Paid, Pending / Partial, Unpaid / Overdue, High Value)     │
│ │   ├── Field 2: Customer / Party Select (AppSearchableSelect)                                         │
│ │   ├── Field 3: Invoice Date (Date Picker)                                                            │
│ │   └── Field 4: Amount Range (Min ₹ to Max ₹)                                                         │
│ ├── DATA LEDGER TABLE:                                                                                 │
│ │   ├── Strict column widths matching table-layout: fixed                                              │
│ │   ├── Tabular-nums numerical alignment (Right-aligned Taxable, GST 18%, Total Bill)                  │
│ │   ├── High-polish status pills (Paid = Green, Partial = Amber, Unpaid = Red)                         │
│ │   └── Polished Actions group (View, Print, PDF as independent micro-buttons)                         │
│ ├── COLUMN-ALIGNED SUMMARY TOTALS FOOTER (tfoot):                                                      │
│ │   └── Each total strictly pinned to its parent th column width                                      │
│ └── STANDARD PAGINATION FOOTER: Rows selector + Page X of Y + Prev / Next                              │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Strict Execution Directives for Engineering Assistants

1. **Zero Financial Mutation**: NEVER alter GST tax calculation formulas (`Taxable = Total / 1.18`, `GST = Total - Taxable`), invoice numbering rules, or backend database relationships.
2. **Move Subtabs into Filters Popover**: Absorb the loose subtabs (`all`, `paid`, `partial`, `unpaid`, `high_value`) into the single `[Filters]` popover button as the top `Invoice Payment Status` selector with live counts.
3. **Stand Alone KPIs**: Move `.inv-kpi-grid` outside `.invoices-main-panel` so it directly forms Structure 2.
4. **Fix Actions Button Layout**: Each action button (`.btn-row-action`) must have independent flex styling, padding, border-radius, and gap to prevent any text overlapping.
5. **Exact Alignment of Totals**: Ensure `<tfoot class="table-summary-tfoot">` mirrors `<th class="...">` widths so numbers never collide.
