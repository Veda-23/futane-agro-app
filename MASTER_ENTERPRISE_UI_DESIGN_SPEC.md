# MASTER ENTERPRISE UI DESIGN SPECIFICATION & SYSTEM PROMPT
**Futane Agro ERP — Unified Table, Typography, and Performance Architecture**
*Version: 7.0 — Gold Standard Reference: Monthly Production Summary Table*

---

## 1. System Prompt Directive for All AI Agents & Developers

> **ROLE & DIRECTIVE:**
> You are the Lead Frontend Enterprise Architect for **Futane Agro ERP**. 
> Whenever you create, redesign, or polish ANY tab or feature page in this repository, you MUST strictly adhere to this Master Specification.
> 
> The visual gold standard is the **Monthly Production Summary** architecture (`src/app/components/features/production/production.component.html:800-1080`):
> - **Unified Card Container**: Rounded borders, subtle slate divider lines, soft glass elevation.
> - **Single-Row Toolbar**: Search input with lead icon, filter dropdowns, 3-state density switcher, column customizer, CSV/Excel export buttons.
> - **Systematic Fixed Table**: `table-layout: fixed !important; width: 100% !important;` with a mathematical 100% column budget (Zero horizontal overflow).
> - **Data Hierarchy**: Tabular monospace numbers (`JetBrains Mono`), uppercase dates with calendar icons, color-coded status/cost pills, and compact micro-action buttons.
> - **Aggregated Footer**: `tfoot` summary total row with bold KPI values.
> - **Zero Scrollbar Policy**: Both horizontal and vertical scrollbars must be completely invisible while maintaining 100% smooth mousewheel/touch scrolling.
> - **Instant Button Response**: Buttons must respond instantaneously with zero latency and snappy active press feedback.

---

## 2. Visual Anatomy & Component Breakdown

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 🏠 Futane Agro ERP  /  Operations  /  PRODUCTION SUMMARY                               │  ← Breadcrumb Trail (outside card)
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [Icon]  Monthly Production Summary  [ 25 Records ]                       [+ New Entry] │  ← Page Header
│         Aggregated energy consumption, crate production runs, and cost reconciliation  │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 🔍 Search summaries...   [All Months ▾] [All Years ▾]     [☷|↕|⤢] [Columns(8)] [CSV] [Excel]│  ← Unified Toolbar
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ☐  MONTH/YEAR ⇅    TOTAL PROD ⇅   ELECTRICITY (KWH) ⇅  BILL (₹) ⇅  UNITS/CRATE COST/CRATE ACT│  ← Fixed Table Header
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ☐  📅 AUGUST 2026      5,000            1,200.00         ₹14,400.00    0.24   [₹2.88] ✏️ 🗑️│
│ ☐  📅 JULY 2026      182,000           35,000.00        ₹288,750.00    0.19   [₹1.59] ✏️ 🗑️│
│ ...                                                                                    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│    SUMMARY (10 MO)   297,000           59,600.00        ₹523,950.00    0.20   ₹1.76    │  ← Table Summary (tfoot)
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Showing 1 to 10 of 25 monthly summaries                 Rows: [10 ▾]  < Prev  Page 1  Next >   │  ← Pagination Bar
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. The 6 Foundational Commandments

### Rule 1: Breadcrumb Placement Outside Container
Never nest breadcrumbs inside the header card or toolbar. Place them above the main page header in a `.breadcrumb-trail` container:
```html
<div class="breadcrumb-trail no-print">
  <i class="bi bi-house me-1"></i>
  <span>Futane Agro ERP</span>
  <span class="sep">/</span>
  <span>Operations</span>
  <span class="sep">/</span>
  <span class="active">Monthly Production Summary</span>
</div>
```

### Rule 2: Unified Table Toolbar (`.table-unified-toolbar`)
Every table must be preceded by a single unified toolbar inside the table panel card containing:
1. **Search Box**: `<div class="toolbar-search-box">` with `bi-search` lead icon and instant `bi-x-lg` clear button.
2. **Filter Selects**: Clean bordered selects with 6px radius and 32px height.
3. **Density Switcher**: 3 toggle buttons (`compact`, `comfortable`, `spacious`) with icons `bi-view-list`, `bi-distribute-vertical`, `bi-arrows-expand`. Active state must have Cobalt Blue background (`#0B47D4`) with white icon.
4. **Column Manager**: Button opening dropdown with toggles and column reordering.
5. **Exports Group**: Side-by-side CSV and Excel export action buttons.

### Rule 3: Fixed Proportional Table Layout (Mathematical 100% Budget)
Tables MUST NOT use `table-layout: auto` or unstructured pixel widths that cause horizontal scrolling.
- `table-layout: fixed !important; width: 100% !important;`
- Every visible column has an explicit percentage class, and the sum of all columns MUST equal **100.0%**.
- Checkbox: 4% (or 40-44px).
- Numeric columns: Right-aligned (`text-end font-mono`), bold numbers.
- Actions: Fixed width (8% - 10%), right-aligned, zero ellipsis cutoff.

### Rule 4: Data Formatting & Monospace Typography
- **Monospace Font**: Use `JetBrains Mono, monospace` with `font-variant-numeric: tabular-nums;` for all numeric values, quantities, bills, unit costs, and dates.
- **Currency**: Prefix with `₹` symbol directly before the figure, formatted with 2 decimal places: `₹14,400.00`.
- **Dates**: Uppercase month + 4-digit year with leading calendar icon: `<i class="bi bi-calendar3 me-1 text-muted"></i>AUGUST 2026`.
- **Status & Efficiency Pills**:
  - High efficiency / Healthy: `background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0;` (e.g. `₹1.59`)
  - Warning / High cost: `background: #FFFBEB; color: #92400E; border: 1px solid #FDE68A;` (e.g. `₹2.88`)
  - Critical / Loss: `background: #FEF2F2; color: #991B1B; border: 1px solid #FECACA;`

### Rule 5: Micro-Action Buttons (26px - 28px)
- Action buttons must be compact and fast:
  - Edit: White background, subtle border `#cbd5e1`, slate text `#334155`, pencil icon `bi-pencil-square`, label `Edit`.
  - Delete: White background, subtle border `#fecaca`, red icon `bi-trash3` `#dc2626`.
- Avoid bloated button padding. Use `height: 26px; padding: 0 8px; font-size: 11.5px; border-radius: 6px;`.

### Rule 6: Aggregated Summary Row (`tfoot`)
Tables containing financial, quantity, or metric data must provide a `tfoot.table-summary-tfoot` with:
- Summary label column: `SUMMARY (X ROWS)` in bold.
- Column-aligned totals: Summed values matching the column data format (e.g. total crates, total units, total bills with bold text and warning/primary color highlights).

---

## 4. Universal Zero-Scrollbar Architecture

### The Rule:
Scrollbars look cluttered and distracting on modern enterprise touchpads and high-res screens. 
All containers, viewports, tables, and dialogs must have their visible scrollbar chrome hidden completely while retaining 100% smooth mousewheel, touchpad, and touch scrollability.

### CSS Implementation (Global & Component-Level):
```scss
/* Global scrollbar suppression across all browsers and elements */
*, *::before, *::after,
html, body, div, table, tbody, thead, tr, td, th,
.table-container, .table-responsive, .table-responsive-viewport,
.table-responsive-wrapper, .table-wrapper-custom, .erp-table-scroll,
.data-table-wrapper, .erp-drawer, .erp-drawer-body, .modal, .modal-body {
  scrollbar-width: none !important; /* Firefox */
  -ms-overflow-style: none !important; /* IE & Edge */
}

::-webkit-scrollbar,
*::-webkit-scrollbar,
*::-webkit-scrollbar-thumb,
*::-webkit-scrollbar-track,
*::-webkit-scrollbar-corner {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  background: transparent !important;
  opacity: 0 !important;
  visibility: hidden !important;
}
```

---

## 5. High-Speed Button Responsiveness Standard

### The Rule:
Enterprise users click hundreds of buttons a day. Buttons must feel tactile, responsive, and instantaneous.
- Eliminate slow 0.25s/0.3s transitions.
- Add instant `:active` state press feedback (`transform: scale(0.96);`).
- Add `touch-action: manipulation;` to eliminate mobile/touchpad 300ms tap delays.

### CSS Implementation:
```scss
button,
.btn,
.btn-row-action,
.btn-toolbar-action,
.btn-action-compact,
.btn-action-primary,
.density-btn,
.search-clear-btn,
.btn-icon-action {
  transition: transform 0.08s ease, background-color 0.1s ease, border-color 0.1s ease, color 0.1s ease, box-shadow 0.1s ease !important;
  user-select: none !important;
  -webkit-tap-highlight-color: transparent !important;
  touch-action: manipulation !important;
  cursor: pointer !important;

  &:active {
    transform: scale(0.96) !important;
    transition-duration: 0.04s !important;
  }
}
```

---

## 6. HTML Template Blueprint for Any Tab Table

```html
<!-- 1. BREADCRUMB (OUTSIDE CARD) -->
<div class="breadcrumb-trail no-print">
  <i class="bi bi-house me-1"></i>
  <span>Futane Agro ERP</span>
  <span class="sep">/</span>
  <span>Module Category</span>
  <span class="sep">/</span>
  <span class="active">Feature Name</span>
</div>

<!-- 2. TABLE PANEL CARD -->
<div class="glass-panel table-panel-card">
  
  <!-- UNIFIED TOOLBAR -->
  <div class="table-unified-toolbar no-print">
    
    <!-- Left Group: Search & Filter selects -->
    <div class="toolbar-left-group">
      <div class="toolbar-search-box">
        <i class="bi bi-search search-lead-icon"></i>
        <input type="text" [(ngModel)]="searchQuery" (input)="currentPage = 1" placeholder="Search records..." class="toolbar-search-input">
        <button *ngIf="searchQuery" type="button" class="search-clear-btn" (click)="searchQuery = ''; currentPage = 1">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="toolbar-filter-select">
        <select [(ngModel)]="filterOption" (change)="currentPage = 1" class="toolbar-select">
          <option value="">All Categories</option>
          <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
        </select>
      </div>
    </div>

    <!-- Right Group: Density, Columns, Exports -->
    <div class="toolbar-right-group">
      <!-- Density Switcher -->
      <div class="density-group" role="group">
        <button type="button" class="density-btn" [class.active]="tableDensity === 'compact'" (click)="setDensity('compact')">
          <i class="bi bi-view-list"></i>
        </button>
        <button type="button" class="density-btn" [class.active]="tableDensity === 'comfortable'" (click)="setDensity('comfortable')">
          <i class="bi bi-distribute-vertical"></i>
        </button>
        <button type="button" class="density-btn" [class.active]="tableDensity === 'spacious'" (click)="setDensity('spacious')">
          <i class="bi bi-arrows-expand"></i>
        </button>
      </div>

      <!-- Export Buttons -->
      <div class="export-actions-group">
        <button type="button" class="btn btn-secondary btn-sm btn-toolbar-action" (click)="exportCSV()">
          <i class="bi bi-filetype-csv me-1 text-primary"></i> CSV
        </button>
        <button type="button" class="btn btn-secondary btn-sm btn-toolbar-action" (click)="exportExcel()">
          <i class="bi bi-file-earmark-excel me-1 text-success"></i> Excel
        </button>
      </div>
    </div>
  </div>

  <!-- TABLE CONTAINER (ZERO SCROLLBARS, FIXED 100% LAYOUT) -->
  <div class="table-responsive table-wrapper-custom" [ngClass]="'density-' + tableDensity">
    <table class="table enterprise-table">
      <thead class="sticky-thead">
        <tr>
          <th class="th-checkbox" style="width: 4%;">
            <input type="checkbox" class="enterprise-row-checkbox" [checked]="isAllSelected()" (change)="toggleSelectAll()">
          </th>
          <th class="th-entity" style="width: 26%;">ENTITY / NAME</th>
          <th class="th-num text-end" style="width: 18%;">QUANTITY</th>
          <th class="th-num text-end" style="width: 18%;">AMOUNT (₹)</th>
          <th class="th-status text-center" style="width: 16%;">STATUS</th>
          <th class="th-actions text-end" style="width: 18%;">ACTIONS</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let item of paginatedData; trackBy: trackById" class="enterprise-data-row">
          <td class="text-center">
            <input type="checkbox" class="enterprise-row-checkbox" [checked]="isSelected(item.id)" (change)="toggleSelect(item.id)">
          </td>
          <td style="font-weight: 700;">
            <i class="bi bi-box-seam me-1 text-muted"></i>{{ item.name }}
          </td>
          <td class="text-end font-mono" style="font-weight: 700;">
            {{ item.quantity | number }}
          </td>
          <td class="text-end font-mono" style="font-weight: 700; color: #d97706;">
            ₹{{ item.amount | number:'1.2-2' }}
          </td>
          <td class="text-center font-mono">
            <span class="badge-status-pill badge-success">{{ item.status }}</span>
          </td>
          <td class="text-end">
            <div class="row-actions-group">
              <button type="button" class="btn-row-action btn-edit" (click)="openEdit(item)">
                <i class="bi bi-pencil-square me-1"></i> Edit
              </button>
              <button type="button" class="btn-row-action btn-delete" (click)="deleteItem(item.id)">
                <i class="bi bi-trash3"></i>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
      <tfoot class="table-summary-tfoot" *ngIf="paginatedData.length > 0">
        <tr>
          <td></td>
          <td class="tfoot-label"><strong>SUMMARY ({{ paginatedData.length }} RECORDS)</strong></td>
          <td class="text-end font-mono"><strong>{{ totalQuantity | number }}</strong></td>
          <td class="text-end font-mono"><strong class="text-warning">₹{{ totalAmount | number:'1.2-2' }}</strong></td>
          <td></td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- PAGINATION BAR -->
  <div class="erp-table-footer no-print">
    <div class="erp-footer-info">
      Showing <strong>{{ (currentPage - 1) * pageSize + 1 }}</strong> to
      <strong>{{ Math.min(currentPage * pageSize, totalRecords) }}</strong> of
      <strong>{{ totalRecords }}</strong> records
    </div>
    <div class="erp-footer-controls">
      <div class="erp-rows-selector">
        <span>Rows:</span>
        <select [(ngModel)]="pageSize" (change)="currentPage = 1" class="erp-rows-select">
          <option [ngValue]="10">10</option>
          <option [ngValue]="25">25</option>
          <option [ngValue]="50">50</option>
        </select>
      </div>
      <div class="erp-page-nav-btns">
        <button type="button" class="btn-page-step" [disabled]="currentPage === 1" (click)="currentPage = currentPage - 1">
          ‹ Prev
        </button>
        <span class="page-indicator">Page {{ currentPage }} of {{ totalPages }}</span>
        <button type="button" class="btn-page-step" [disabled]="currentPage >= totalPages" (click)="currentPage = currentPage + 1">
          Next ›
        </button>
      </div>
    </div>
  </div>
</div>
```

---

## 7. Migration Checklist for Every Future Tab

When inspecting or refactoring any tab in Futane Agro ERP:
- [ ] Move breadcrumbs outside the header card into `.breadcrumb-trail`.
- [ ] Replace disparate filter rows with the unified `.table-unified-toolbar`.
- [ ] Remove `appResizableTable` or fixed pixel width inline styles causing horizontal scrolling.
- [ ] Apply `table-layout: fixed !important; width: 100% !important;` with 100.0% column budget.
- [ ] Format all figures, quantities, and currencies with monospace tabular numbers (`font-mono`).
- [ ] Implement color-coded status/cost pills instead of plain text.
- [ ] Implement fast micro-actions (`[ ✏️ Edit ]`, `[ 🗑️ ]`) with `transform: scale(0.96)` active states.
- [ ] Add `tfoot.table-summary-tfoot` summary row for total records/amounts.
- [ ] Enforce complete scrollbar hiding (`scrollbar-width: none; ::-webkit-scrollbar { display: none; }`).
- [ ] Test in light mode and dark mode to verify WCAG-AA contrast and layout elegance.
