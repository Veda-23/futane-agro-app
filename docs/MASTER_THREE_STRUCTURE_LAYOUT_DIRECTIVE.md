# MASTER ARCHITECTURAL DIRECTIVE & DESIGN PROMPT
## Universal 3-Structure Layout Standard (Production Tab Blueprint)

> **Directive Reference**: `ERP-3STRUCTURE-BLUEPRINT-2026-V1`  
> **Status**: Enforced across **Futane Agro Manufacturing ERP**  
> **Reference Component**: `ProductionComponent` (`frontend/src/app/components/features/production/`)  
> **Target Alignment**: `InventoryComponent`, `RawMaterialsComponent`, `VendorsComponent`, `TransportsComponent`, etc.  

---

## 1. Problem Statement & Executive Blueprint

Previous iterations introduced layout fragmentation:
- Redundant header cards duplicated titles and scattered primary action buttons.
- Subtab ribbons floated outside the table or cluttered the top of the table panel.
- Multi-row alert banners pushed the main data ledger below the viewport fold.
- Duplicate panel headers inside the table card created visual noise.

### The Canonical 3-Structure Layout
Like the **Production Tab**, every major operational module MUST follow this exact, clean, 3-tier hierarchy:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ STRUCTURE 1: COMPACT PROFESSIONAL PAGE HEADER                                                          │
│ ├── Breadcrumb Trail (Module / Section / Current Tab)                                                  │
│ ├── LEFT: Hero Icon Box (46×46px gradient pod) + Title + Record Count Pill + Subtitle                  │
│ └── RIGHT: Primary Action Buttons ([Refresh], [Export ▾], [Quick Adjust], [+ Log Entry / Add Button])  │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ STRUCTURE 2: COMPACT KPI TELEMETRY GRID                                                                │
│ └── 4–5 Compact Stat Cards (Metric Value, Label, Accent Icon, Micro-Progress / Trend, Status Meta)     │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ STRUCTURE 3: UNIFIED DATA TABLE PANEL CARD                                                             │
│ ├── NO duplicate internal headers or nested card wrappers                                              │
│ ├── TWO-ZONE TOOLBAR:                                                                                  │
│ │   ├── LEFT: [🔍 Search records... (x)] + Single [🎯 Filters (N)] Popover Button + [↺ Clear Filters]  │
│ │   └── RIGHT: [=|=| Density Switcher] + [▦ Columns (N)] Manager Dropdown                              │
│ ├── CONSOLIDATED FILTER POPOVER:                                                                       │
│ │   ├── Field 1: Classification / Status (All / In Stock / Low / Surplus / Out of Stock)               │
│ │   ├── Field 2: Material / Type Filter                                                                │
│ │   ├── Field 3: Operational Health Filter                                                             │
│ │   └── Field 4: Warehouse Bay / Zone Filter                                                           │
│ ├── DATA LEDGER TABLE (Sticky headers, formula columns, action buttons: View, Edit, Delete)            │
│ ├── SUMMARY TOTALS FOOTER (tfoot)                                                                      │
│ └── STANDARD PAGINATION FOOTER (Showing X to Y, Rows selector, Prev / Next navigation)                  │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Invariants & Implementation Directives

1. **Zero Duplicate Headers**: The table panel card must NEVER repeat the page title. It begins directly with the table toolbar.
2. **All Classification Filters Inside Single Filter Button**: Loose horizontal subtab pills (e.g. `[All Crates]`, `[In Stock]`) are consolidated inside the `[Filters]` popover panel as the first select field (`Classification / Stock State`), keeping the UI clean and spacious.
3. **Streamlined Contextual Alerts**: Large multi-card warning stacks are replaced by high-priority status indicators within the KPI telemetry grid or a single compact notification ribbon.
4. **Action Button Placement**: All page-level and drawer triggers live in Structure 1 (Header Right), while table row actions (View, Edit, Delete) live strictly in the table's `Actions` column.
