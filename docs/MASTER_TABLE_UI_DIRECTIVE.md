# MASTER ARCHITECTURAL DIRECTIVE & UI SPECIFICATION
## Enterprise Table Standards, Consolidated Filter Popovers & Action Protocols

> **Directive Reference**: `ERP-TABLE-STD-2026-V1`  
> **Status**: Enforced across all modules and sub-tabs in **Futane Agro ERP**  
> **Target Audience**: AI Agents, Frontend Engineers, and System Architects  

---

## 1. Executive Summary & Core Invariants
All data ledger tables across the Futane Agro ERP platform (**Production, Raw Materials, Inventory, Vendors, Transports, Drivers, Machines, Sales, Invoices, Payments, Salaries, Employees**) must strictly conform to a single, unified visual layout, interaction model, and typography hierarchy.

### 🚫 Anti-Patterns (Strictly Forbidden)
1. **Never place multiple loose `<select>` dropdowns directly on the toolbar row** (e.g. `[All Months]`, `[All Years]`, `[All Categories]`). This clutters the interface and destroys horizontal responsiveness.
2. **Never render raw bullet lists or unstyled checkboxes** in column customization menus.
3. **Never allow arbitrary action button sizes or inconsistent icon colors** (e.g. green edit buttons in one tab, black in another, oversized delete buttons).
4. **Never truncate header titles with ellipses or parentheses cutoff** (`NET WEIGHT (`, `TOTAL SPEND (₹`).
5. **Never permit multi-line wrap or split numbers** in summary footers (`tfoot`).

---

## 2. Standardized Table Toolbar Architecture

Every table toolbar must feature a **two-zone layout**:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [🔍 Search records...     (x)] [🎯 Filters (N)] [↺ Reset]         [=|=|=] [▦ Columns (N)] [⇣ Export ▾] │
│ └────────────────────────────┘ └──────────────┘ └───────┘         └─────┘ └─────────────┘ └──────────┘ │
│          LEFT: Search + Consolidated Popover Trigger                     RIGHT: Control Center         │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### A. Left Zone (Search & Filter Popover)
1. **Search Box**:
   - Class: `.toolbar-search-box` or `.inv-search-box`
   - Fixed or flex-grow input with prefix magnifying glass (`bi bi-search`) and conditional clear button (`bi bi-x-circle-fill`).
2. **Single Consolidated Filter Button (`[Filters]`)**:
   - Class: `.filter-trigger-btn`
   - Icon: `bi bi-funnel`
   - Dynamic counter badge: `.filter-badge` displaying `activeFilterCount` (e.g. `Filters 3`).
   - Active state styling: Cobalt blue tint `rgba(11, 71, 212, 0.05)`, blue border `#0B47D4`, blue text.
3. **Filter Popover Panel**:
   - Container: `.filter-popover-panel` (Card with `box-shadow: 0 12px 32px rgba(15, 23, 42, 0.15)`).
   - **Header**: Title with `bi bi-sliders` (e.g. `Refine Haulage Trips`) + `Reset All` action link.
   - **Body**: Stacked filter field groups (`.filter-field-group`) with uppercase 11px slate labels (`#64748b`) and 34px rounded inputs/selects.
   - **Footer**: `[Close]` button (secondary) and `[Apply Filters]` button (primary `#0B47D4`).
4. **Quick Reset Trigger**:
   - Visible only when `hasActiveFilters()` or `searchQuery` is truthy.

### B. Right Zone (Control Center)
1. **Density Switcher**:
   - Segmented 3-button icon group: Compact (`bi-view-list`), Comfortable (`bi-distribute-vertical`), Spacious (`bi-arrows-expand`).
2. **Column Manager Dropdown**:
   - Trigger: `.col-manager-dropdown-wrapper button` labeled `Columns (N)`.
   - Popover: `.col-manager-popover` containing a header with `Reset` and a body with styled checkboxes (`accent-color: #0b47d4`).
3. **Secondary Actions (Optional)**:
   - Module cross-links (e.g. `[Drivers Directory]`), `[Refresh]` with spin animation, and `[Export ▾]` dropdown (CSV, Excel).

---

## 3. Standardized Action Buttons Protocol

Row action micro-buttons rendered inside `<td class="col-actions">` must be identical across all tables in size, alignment, and semantic color coding:

| Action | Icon Class | Base Color | Background Tint | Border Tint | Hover Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **View Details** | `bi bi-eye` | `#0284c7` (Sky Blue) | `rgba(2, 132, 199, 0.08)` | `rgba(2, 132, 199, 0.22)` | Solid `#0284c7` bg, white icon, `-1px` lift, soft shadow |
| **Edit Record** | `bi bi-pencil-square` | `#0B47D4` (Cobalt Royal) | `rgba(11, 71, 212, 0.08)` | `rgba(11, 71, 212, 0.22)` | Solid `#0B47D4` bg, white icon, `-1px` lift, soft shadow |
| **Delete Record** | `bi bi-trash3` | `#ef4444` (Crimson Rose) | `rgba(239, 68, 68, 0.08)` | `rgba(239, 68, 68, 0.22)` | Solid `#ef4444` bg, white icon, `-1px` lift, soft shadow |
| **Adjust / Config** | `bi bi-sliders` | `#d97706` (Amber Orange) | `rgba(245, 158, 11, 0.08)` | `rgba(245, 158, 11, 0.22)` | Solid `#d97706` bg, white icon, `-1px` lift, soft shadow |

### Micro-Button Geometry:
- **Width & Height**: Exact `28px × 28px` (`min-width: 28px !important`).
- **Border Radius**: `6px`.
- **Icon Size**: `13px`.
- **Gap between buttons**: `4px`–`6px`.

---

## 4. Typography Hierarchy & Numerics

All table elements must enforce tabular layout hygiene:
1. **Table Header (`thead th`)**:
   - `font-size: 11px !important;`
   - `font-weight: 700 !important;`
   - `text-transform: uppercase !important;`
   - `letter-spacing: 0.5px !important;`
   - `color: #64748b !important;` (Slate 500)
   - `background: #f8fafc !important;`
   - `white-space: nowrap !important;`
2. **Table Body (`tbody td`)**:
   - `font-size: 12.5px !important;`
   - `font-weight: 500 !important;`
   - `color: #0f172a !important;` (Slate 900)
   - `line-height: 1.4 !important;`
3. **Quantitative / Financial Cells**:
   - Currency, quantities, asset codes, dates, and percentages must utilize:
     `font-family: 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace !important;`
     `font-variant-numeric: tabular-nums !important;`
4. **Summary Footer (`tfoot td`)**:
   - `font-size: 12.5px !important;`
   - `font-weight: 700 !important;`
   - `white-space: nowrap !important;`
   - Never wrap currency totals or labels into two lines.

---

## 5. Master Prompt Template for Future Tasks

When adding or refactoring any ERP tab, feed the following prompt:

```text
Apply the Futane Agro ERP Universal Table Standard (ERP-TABLE-STD-2026-V1) to [MODULE_NAME]:
1. Replace all loose filter dropdowns with a single [Filters (N)] button that triggers a .filter-popover-panel modal containing all criteria (with 'Reset All', 'Close', and 'Apply Filters').
2. Arrange the toolbar: Left = Search + Filter Popover + Reset; Right = Density Switcher [Compact/Comfortable/Spacious] + [Columns (N)] + Export/Directory Actions.
3. Align all row action buttons to the standard 28x28px micro-button palette: View (Sky Blue #0284c7 / bi-eye), Edit (Cobalt Blue #0B47D4 / bi-pencil-square), Delete (Crimson #ef4444 / bi-trash3).
4. Enforce 11px uppercase slate-500 headers, 12.5px slate-900 body cells, tabular-nums for numeric/currency columns, and single-line nowrap tfoot summaries.
5. Ensure 100% proportional column width budgeting without horizontal overflow.
```
