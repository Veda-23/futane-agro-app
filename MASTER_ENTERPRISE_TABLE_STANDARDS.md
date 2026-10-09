# MASTER ENTERPRISE TABLE SYSTEM PROMPT & ARCHITECTURAL DIRECTIVE
**Futane Agro ERP — Universal Table, Semantic Data Hierarchy & Modal Architecture**
*Standard Version: 8.0 | Target Environment: Industrial Manufacturing ERP (Windows 11, 8GB RAM Baseline)*

---

## 1. Executive Directive & Identity

> **MANDATORY INSTRUCTION FOR ALL AI AGENTS & FULL-STACK ENGINEERS:**
> You are the **Lead Enterprise Architect & Senior Frontend Systems Engineer** for **Futane Agro ERP**.
> Every screen containing tabular records across the entire application (**Production**, **Raw Materials**, **Inventory**, **Vendors**, **Sales**, **Invoices**, **Dispatches**, **Transport**, **Employees**, and **Machines**) MUST strictly follow the exact architectural, functional, and visual gold standard established in the **Parties Directory** and **Daily Production/Payment Registry** modules.
> 
> Under no circumstances may any table have mismatched headers, unaligned monospace columns, missing density controls, unscrollable cramped layouts, or inline forms that shove tables downward.

---

## 2. The Universal Screen Layout Structure

Every enterprise feature module with a table follows this strict 6-tier vertical stack:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🏠 Futane Agro ERP  /  [Parent Category]  /  [MODULE TITLE IN UPPERCASE BOLD]                   │  ← 1. Breadcrumb Trail
└──────────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Icon Pod]  Module Main Title  [ Count Pill ]                              [↻ Refresh] [+ Add ..]│  ← 2. Executive Page Header
│             Sub-headline explaining enterprise purpose and business workflow                     │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [ ● Subtab 1 (Count) ]  [ Subtab 2 (Count) ]  [ Subtab 3 (Count) ]                               │  ← 3. Sub-Navigation Tabs
└──────────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [ KPI Card 1: Total ]   [ KPI Card 2: Success ]   [ KPI Card 3: Quality/Alert ]  [ KPI 4: Yield ]│  ← 4. 4/5-Card Telemetry Ribbon
└──────────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🔍 Search...  [▼ Filters (N)]  [↺ Reset]           [☷|↕|⤢ Density] [⊞ Columns (N)] [CSV] [Excel] │  ← 5. Unified Enterprise Toolbar
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ☑  [N] records selected  |  [⬇ Bulk Export]  [🗑 Bulk Delete]                    [✕ Clear]       │  ← Floating Bulk Action Bar (on select)
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ☐ | ENTITY / NAME | CATEGORY / TYPE | IDENTIFIER / CODE | METRIC A | METRIC B | STATUS | ACTIONS  │  ← 6. Semantic Data Table
│ ──┼───────────────┼─────────────────┼───────────────────┼──────────┼──────────┼────────┼────────┤
│ ☐ | 📦 Apple Crate | 🕒 Morning Shift | 📅 22/08/2026     |   200    |  180     | ● 98%  | 👁 ✏ 🗑 │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Showing 1 to 10 of 80 records                               Rows: [10 ▾]  < Prev  Page 1  Next > │  ← 7. Standard Pagination Footer
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Semantic Data Ordering & Column Hierarchy

Tables must organize data from left to right following a strict cognitive hierarchy:

| Column Order | Column Category | Content Description | Alignment | Typography & Styling |
|---|---|---|---|---|
| **Col 1** | **Selection Checkbox** | Master select-all in header; row checkbox in body. | Center | `width: 44px; accent-color: #10b981;` |
| **Col 2** | **Primary Entity / Name** | Entity name (Crate Type, Party Name, Item Name, Employee) + avatar pill / icon. | Left | `Inter`, 700 bold, `#0f172a`, icon pill with category tint. |
| **Col 3** | **Categorical Classification** | Shift badge, Business Type, Material Grade, Warehouse Section. | Left | Stylized uppercase pill badge (`background: rgba(..); border: 1px solid;`). |
| **Col 4** | **Temporal / Reference Code** | Date (`DD/MM/YYYY`), Batch #, Invoice #, Voucher #. | Left / Center | `JetBrains Mono`, tabular lining figures, clock/calendar prefix icon. |
| **Col 5 to N-2** | **Quantitative Metrics** | Production count, weight (kg), bill amounts (₹), quantities. | **Right** (`text-end`) | `JetBrains Mono`, 700 bold, formatted with Indian commas (`₹1,623` / `180`). |
| **Col N-1** | **Performance / Health KPI** | Batch yield %, GST compliance, B2B readiness, Stock status. | Center | Indicator pill with colored lead dot (`● 98%`, `● Ready`, `● Low Stock`). |
| **Col N** | **Micro-Action Suite** | Row action buttons: View Dossier (`bi-eye`), Edit (`bi-pencil-square`), Delete (`bi-trash3`). | Center / Right | Compact 30px icon buttons with hover elevations & state-aware tints. |

---

## 4. Typography, Monospace & Numeric Standards

1. **Header & General Text**:
   - `font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;`
   - Headers: `11px`, `font-weight: 700`, `text-transform: uppercase`, `letter-spacing: 0.04em`.
2. **Numbers, Codes, Currencies & Dates**:
   - MUST use `JetBrains Mono, monospace, sans-serif` with `font-variant-numeric: tabular-nums`.
   - Never use variable-width default sans-serif for numbers; monospace prevents column jitter during updates.
3. **Currency & Unit Formatting**:
   - Always prefix Indian Rupee symbol `₹` without a space: `₹14,400.00`.
   - Quantities formatted with Indian number grouping: `1,644` crates.

---

## 5. Enterprise Table Toolbar Specification

Every table container MUST include a unified `.table-unified-toolbar`:

1. **Search Input**:
   - `width: 280px; max-width: 100%; height: 38px; border-radius: 6px;`
   - Search icon on left (`bi-search`), instant clear button on right (`bi-x-lg` when `searchQuery` has value).
   - Debounced search (300ms) that automatically resets `currentPage = 1`.
2. **Filters Popover / Dropdowns**:
   - Clean, bordered trigger button with funnel icon (`bi-funnel`) and active badge count when filters > 0.
   - Popover panel with select dropdowns, date pickers, and a prominent "Reset All" action.
3. **Density Switcher (3-State)**:
   - Three connected toggle buttons: **Compact** (`bi-view-list`), **Comfortable** (`bi-distribute-vertical`), **Spacious** (`bi-arrows-expand`).
   - Active state: `#0B47D4` (Cobalt) or `#059669` (Emerald) background with crisp white icon.
4. **Column Manager Dropdown**:
   - Button displaying `Columns (N)` with `bi-layout-three-columns`.
   - Popover allowing users to check/uncheck columns and reset to default configuration.
5. **Export Buttons**:
   - Dedicated side-by-side buttons: **CSV** (`bi-download` / `bi-filetype-csv`) and **Excel** (`bi-file-earmark-excel`).
   - Exports the currently active filtered and sorted dataset.

---

## 6. Zero Horizontal Squishing & Smooth Scroll Architecture

To prevent column collisions (like `LOCATION` overlapping `EMAIL`), enforce the following CSS contract:

```css
/* Table Container Card */
.table-panel-card {
  width: 100% !important;
  max-width: 100% !important;
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 10px;
  overflow: hidden !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

/* Scrollable Viewport Wrapper */
.table-wrapper-custom {
  width: 100% !important;
  max-width: 100% !important;
  overflow-x: auto !important;
  position: relative;
  scrollbar-width: thin !important;
  scrollbar-color: #cbd5e1 transparent !important;
  -webkit-overflow-scrolling: touch;
}

.table-wrapper-custom::-webkit-scrollbar {
  height: 6px !important;
}

.table-wrapper-custom::-webkit-scrollbar-thumb {
  background: #cbd5e1 !important;
  border-radius: 4px !important;
}

.table-wrapper-custom::-webkit-scrollbar-thumb:hover {
  background: #94a3b8 !important;
}

/* Master Data Table */
.enterprise-data-table {
  width: 100% !important;
  min-width: 1080px !important; /* Prevents column collision on narrow viewports */
  table-layout: fixed !important;
  border-collapse: collapse !important;
  font-size: 12px;
  line-height: 1.35;
  margin: 0 !important;
}

.enterprise-data-table thead th {
  background: var(--bg-canvas, #f8fafc) !important;
  color: var(--text-secondary, #475569) !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.04em !important;
  padding: 10px 8px !important;
  border-bottom: 1px solid var(--border-color, #e2e8f0) !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  vertical-align: middle !important;
  box-sizing: border-box !important;
}

.enterprise-data-table tbody td {
  padding: 8px 8px !important;
  border-bottom: 1px solid var(--border-color, rgba(226, 232, 240, 0.7)) !important;
  color: var(--text-primary, #0f172a) !important;
  vertical-align: middle !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

/* Density Modifiers */
.table-compact .enterprise-data-table thead th { padding: 6px 6px !important; font-size: 10px !important; }
.table-compact .enterprise-data-table tbody td { padding: 5px 6px !important; font-size: 11px !important; }
.table-spacious .enterprise-data-table thead th { padding: 12px 10px !important; font-size: 11.5px !important; }
.table-spacious .enterprise-data-table tbody td { padding: 12px 10px !important; font-size: 13px !important; }
```

---

## 7. Modal & Print Architecture (Zero Inline Shoving)

1. **Add / Edit Mutation Forms**:
   - **Strict Invariant**: NEVER render inline forms between the KPI ribbon and the table that shove the table down the page.
   - Forms MUST be **True Fixed Centered Modals** (`.modal-overlay` with backdrop blur `backdrop-filter: blur(6px)` + `.modal-dialog` with `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1050; max-height: 88vh;`).
   - Sticky header with title, subtitle, close `[×]` trigger, scrollable body (`overflow-y: auto`), and pinned footer with Cancel and Save buttons.

2. **Client / Record Inspection Dossiers**:
   - Read-only official modal with **Futane Agro Industries Pvt. Ltd.** corporate letterhead.
   - Vector logo SVG (`assets/logo.svg`) with `(error)` fallback to vector icon.
   - Corporate tax chips (`GSTIN`, `PAN`, `State`).
   - Circular corporate stamp seal (`FUTANE AGRO ERP OFFICIAL COMMERCIAL AUDIT SEAL`).
   - Pinned Print button triggering isolated single-page A4 print stylesheet (`@media print` isolating `#printableDossierSheet` while hiding body, sidebars, headers, and buttons).

---

## 8. Implementation Checklist for All Tabs

When implementing or updating ANY tab with a table, execute this checklist:

- [ ] **Tab 1: Daily Production (PPD)**: Verify crate type avatar, shift badges, total/successful/rejected numbers in monospace, yield pill, and centered add modal.
- [ ] **Tab 2: Monthly Summary (PPM)**: Month/Year badge, electricity kWh, cost per crate, aggregated summary `tfoot`.
- [ ] **Tab 3: Raw Materials**: Material grade badges, vendor reference, batch #, current stock kg, unit rate ₹.
- [ ] **Tab 4: Inventory**: Finished crate SKUs, warehouse location, pallet allocation, reorder point status pill.
- [ ] **Tab 5: Vendors / Suppliers**: Vendor category, 15-digit GSTIN chip, mobile contact, bank linkage.
- [ ] **Tab 6: Sales Orders**: Party name, order reference #, crates ordered, total gross amount ₹, delivery status badge.
- [ ] **Tab 7: Invoices**: Tax invoice #, GST breakdown (CGST + SGST), linked party, payment receipt status, PDF download button.
- [ ] **Tab 8: Transport & Logistics**: Vehicle #, driver name, route destination, fuel/freight cost ₹, trip status pill.
- [ ] **Tab 9: Employees & Shifts**: Staff badge, role pill, shift assignment, attendance status, contact phone.
- [ ] **Tab 10: Machines**: Equipment ID, runtime hours, operational status (Running/Maintenance/Idle), next service date.

---

## 9. Performance & Hardware Ceiling (8 GB RAM Invariant)

- Enforce `trackBy` function on all `*ngFor` row loops (e.g. `trackBy: trackById`).
- Enforce debounced input (`300ms`) on search queries to prevent heavy change detection cascades.
- Precompile UAT bundles via `npm run build:uat` (`--max-old-space-size=1536`) and serve statically via `scratch/serve-uat.js`.
- Always verify free RAM before running long compilation tasks and use `ram-watchdog.ps1` to prevent Windows laptop hangs.
