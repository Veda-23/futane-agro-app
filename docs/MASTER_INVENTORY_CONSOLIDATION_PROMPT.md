# MASTER PROMPT & ARCHITECTURAL DIRECTIVE
## Inventory Single-Card Consolidation, Header Action Integration & Contextual Alerts

> **Directive Reference**: `ERP-INV-CONSOLIDATION-2026-V1`  
> **Target Component**: `InventoryComponent` (`frontend/src/app/components/features/inventory/`)  
> **Status**: Verified & Enforced across Futane Agro Manufacturing ERP  

---

## 1. Problem Statement & User Intent
In the previous layout, the **Inventory** view suffered from card fragmentation:
1. An **Upper Header Card** (`.header-section-wrapper`) duplicated the module title, contained scattered action buttons (`Refresh`, `Export`, `Quick Adjust`, `+ Log Crate Entry`, and the formula badge), and held subtab filter pills.
2. An isolated **KPI Telemetry Grid** sat in the middle.
3. Isolated **AI Polymer Burn Alert Banners** ("red line things") were rendered as detached cards between sections, pushing the main data table below the screen fold.
4. A **Second Lower Card** (`.inv-main-panel`) duplicated the title ("Finished Goods Crate Ledger") and held its own search toolbar and table.

### User Request
- **Remove Upper Card**: Eliminate the redundant `.header-section-wrapper` container.
- **Move All Buttons to Below Card**: Relocate `[Refresh]`, `[Export ▾]`, `[Quick Adjust]`, and `[+ Log Crate Entry]` (plus live formula pill) into `.erp-panel-header` on the right side of `.inv-main-panel`.
- **Integrate Filter Ribbon**: Embed the classification subtabs (`All Crates`, `In Stock`, `Low (<200)`, `Vegetable Crates`, `Universal & Storage`, `Out of Stock`) directly inside `.inv-main-panel` above the search toolbar.
- **Relocate Red-Line Burn Alerts**: Embed the critical `AI Polymer Burn Alert` banners seamlessly inside `.inv-main-panel` as contextual ledger notifications.

---

## 2. Target Component Hierarchy

```
[Breadcrumbs Trail: Futane Agro ERP / Warehouse & Logistics / Finished Goods Crates Warehouse Stock]

[KPI Telemetry Grid: 5 Compact Stat Cards (Finished SKUs, Available Crates, Valuation, Stock Alerts, Capacity %)]

┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ MAIN INVENTORY GLASS PANEL (.inv-main-panel)                                                          │
│                                                                                                        │
│ 1. PANEL HEADER (.erp-panel-header)                                                                    │
│    ├── LEFT: Hero Icon (.erp-panel-icon) + Title + Count Pill + Subtitle                              │
│    └── RIGHT: Formula Badge + [↺ Refresh] + [⇣ Export ▾] + [⚙ Quick Adjust] + [✚ Log Crate Entry]      │
│                                                                                                        │
│ 2. CLASSIFICATION SUBTAB FILTER RIBBON (.subtabs-classification-bar)                                   │
│    └── [All Crates (10)] [In Stock (8)] [Low (<200) (0)] [Vegetable (1)] [Universal (1)] [Out (2)]    │
│                                                                                                        │
│ 3. CONTEXTUAL AI POLYMER BURN ALERTS (.inv-alert-banner inside card)                                  │
│    └── AI Polymer Burn Alert: [Material Name] | Est. Burn: X kg/day | Critical Risk -> Raw Materials │
│                                                                                                        │
│ 4. TWO-ZONE TABLE TOOLBAR (.inv-toolbar)                                                               │
│    ├── LEFT: [🔍 Search box...] + [🎯 Filters (N)] + [↺ Clear Filters]                                │
│    └── RIGHT: [=|=| Density Switcher] + [▦ Columns (12)]                                               │
│                                                                                                        │
│ 5. FINISHED GOODS CRATE LEDGER TABLE (Data Rows + Action Buttons: View, Adjust, Edit, Delete)          │
│                                                                                                        │
│ 6. TABLE SUMMARY TOTALS (tfoot: Total SKUs, Total Available Crates, Total Inventory Asset Value)       │
│                                                                                                        │
│ 7. STANDARD PAGINATION FOOTER (.erp-table-footer: Record count, Rows selector, Prev / Page / Next)     │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Pixel-Precision Specifications

1. **Header Action Alignment (`.erp-panel-actions`)**:
   - Height: `36px` uniform height across buttons.
   - Border radius: `8px`.
   - Primary button: Gradient emerald/blue or cobalt `#0B47D4` with white text and `bi-plus-circle-fill`.
   - Secondary buttons: Border `1px solid #cbd5e1`, slate-700 text `#334155`, hover `#f8fafc`.
   - Formula badge: Subtle slate tint with calculator icon and monospace formula text.

2. **Classification Ribbon Inside Card (`.subtabs-classification-bar`)**:
   - Border-bottom: `1px solid #e2e8f0`.
   - Background: `rgba(248, 250, 252, 0.7)`.
   - Pill buttons: Smooth transitions, active indicator badges.

3. **Embedded AI Burn Alerts (`.inv-alert-banner`)**:
   - Margin: `12px 18px 0 18px`.
   - Border-left: `4px solid #ef4444` (Critical) / `#f59e0b` (Warning).
   - Clean flex alignment with instant "Raw Materials" navigation shortcut.

4. **Zero Layout Thrashing & RAM Ceiling**:
   - Strictly uphold `--max-old-space-size=1536` for Angular builds.
   - Maintain trackBy identifiers and immutable state flows.
