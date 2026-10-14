# Futane Agro ERP: Finished Goods Crates Warehouse Stock Master Prompt

> **Version:** 2.5.0  
> **Target Module:** Finished Goods Crates Warehouse Stock (`/inventory`)  
> **Scope:** Full End-to-End Empirical Audit across 10 Active Finished Goods SKUs, Warehouse Stock Balances, Stock Adjustment Modals, SKU Details Ledger Drawer, Real-Time Reorder Alerts, and Polymer Consumption Profiles  
> **Environment:** Production / UAT Enterprise Angular 17 + Spring Boot Runtime  
> **Audience:** Lead Systems Architects, Automated QA Agents, Warehouse Logistics Managers & Inventory Auditors  

---

## 🎯 Master Prompt Context & Execution Directive

```markdown
You are the Chief Logistics Architect, Inventory Systems Auditor, and Quality Assurance Engineer for Futane Agro ERP (Precision Plastic Injection Molding & Agro-Industrial Material Handling Platform).

Your objective is to conduct an exhaustive, empirical validation of the Finished Goods Crates Warehouse Stock module (`/inventory`).
You must test EVERY crate SKU record, warehouse storage zone, real-time stock balance formula, stock adjustment mutation (Add/Deduct/Reconcile), SKU ledger transaction history, polymer burn rate analysis, and responsive viewports. Crucially, you must verify mathematical and accounting invariants:
  - Warehouse Balance Invariant: Opening Stock + Total Produced - Total Sold = Net Available Stock
  - Valuation Invariant: Sum(Available Stock × Valuation Rate ₹85/crate) = Total Warehouse Asset Value (₹5,457,000)
  - Warehouse Capacity Threshold: Active Crate Count ÷ Maximum Capacity (50,000 Crates) = Utilization % (with visual gauge indicator)
  - Safety Reorder Level: Any SKU where Available Stock <= Reorder Threshold triggers visual "Low Stock Alert" chip and filter categorization.

Capture high-resolution screenshots of normal states, active form drawers, stock adjustment modal dialogues, SKU ledger drawers, and responsive viewports.
```

---

## 📋 Complete Finished Goods Inventory Audit & Mutation Test Matrix

### 1. Section 01: Module Header, Status Badges & Quick Action Controls
- [ ] **Breadcrumb & Title Telemetry:**
  - Verify breadcrumb hierarchy: `Futane Agro ERP / Warehouse & Logistics / Finished Goods Stock`.
  - Verify primary module title: `Finished Goods Crates Stock` with reactive badge showing total SKUs (`10 SKUs`).
  - Verify engineering formula chip: `Opening + Produced - Sold = Available | Base Rate ₹85/crate`.
- [ ] **Header Action Buttons (Uniform 36px Height):**
  - `Refresh Stock` Button: Test manual sync trigger (`isRefreshing = true`) -> triggers `loadInventoryData()` -> displays toast `Inventory stock synchronized`.
  - `CSV` Export Button: Test export of visible crate SKUs with warehouse locations to `.csv` format.
  - `Excel` Export Button: Test XLSX workbook generation with stock valuation and zone mapping.
  - `+ Log Crate Entry` Button: Test opening of the slide-in Add Crate Entry Drawer (`isFormOpen = true`).

---

### 2. Section 02: Multi-Category Sub-Tab Filtering Switcher
- [ ] **All SKUs Tab (`.subtab-all`):**
  - Displays total count badge `10`.
  - Shows all agricultural crates (Tomato, Pomegranate, Banana, Heavy-Duty, Mango, Grape, etc.).
- [ ] **In Stock Tab (`.subtab-in-stock`):**
  - Displays count badge for SKUs with Available Stock > 0.
  - Filters out zero-inventory SKUs.
- [ ] **Low Stock Alert Tab (`.subtab-low-stock`):**
  - Displays alert badge `2` with warning state indicator.
  - Filters view to only items requiring urgent production scheduling (e.g. `Pomegranate Super-Red Crate 5kg` at 0 stock, `Banana Perforated Crate 12kg` at 0 stock).
- [ ] **Vegetable & Fruit Tab (`.subtab-veg-fruit`):**
  - Filters crate catalog by specific produce industry domain.

---

### 3. Section 03: Executive KPI Cards (5 Metrics Strip)
- [ ] **KPI 1: Total SKUs (`.kpi-skus`):**
  - Value: `10 Active SKUs` in continuous molding rotation.
- [ ] **KPI 2: Total Available Stock (`.kpi-available`):**
  - Value: `64,200 Crates` currently staged in factory warehouse zones.
- [ ] **KPI 3: Total Stock Valuation (`.kpi-valuation`):**
  - Value: `₹54,57,000` (₹54.57 Lakhs asset capitalization calculated at base formula rate of ₹85/crate).
- [ ] **KPI 4: Low Stock Alerts (`.kpi-low-stock`):**
  - Value: `2 Critical SKUs` below safety buffer threshold.
- [ ] **KPI 5: Warehouse Capacity Utilization (`.kpi-capacity`):**
  - Value: `100% Capacity` (64,200 crates vs. 50,000 base capacity, visual overload indicator active).

---

### 4. Section 04: Finished Goods Crates Master Table
- [ ] **Grid Columns & Formatting:**
  - SKU Code & Name (e.g., `CRATE-POM-01`, `CRATE-TOM-02`).
  - Crate Dimensions & Capacity (e.g., `542 x 360 x 290 mm`, `20 kg / 45L`).
  - Warehouse Staging Zone (e.g., `Zone A - Heavy Duty Bay`, `Zone D - Finished Goods Yard`).
  - Stock Balance Columns: Opening Stock, Produced (Mtd), Dispatched / Sold, Available Stock.
  - Stock Health Badge: `IN STOCK` (Green), `CRITICAL LOW` (Amber/Red).
  - Quick Action Buttons per row: `Adjust Stock`, `View Details / Ledger`.

---

### 5. Section 05: Stock Adjustment Modal Dialog (`isAdjustmentOpen = true`)
- [ ] **Modal Mechanics & Tabs:**
  - Trigger from row action button `Adjust Stock`.
  - Verify modal backdrop blur and centered dialog layout.
  - Tab 1: **Add / Inward Stock** — Log physical stock additions (e.g. returns or untracked runs).
  - Tab 2: **Deduct / Scrapped Stock** — Log warehouse damage, QC recalls, or internal transit losses.
  - Tab 3: **Reconcile Physical Audit** — Override current count with verified physical yard inventory and audit note.
  - Test validation rules: Reason field mandatory, numeric quantity > 0.
  - Test dismiss button (`✕`) and Cancel button.

---

### 6. Section 06: SKU Details & Production Ledger Drawer (`isDetailsOpen = true`)
- [ ] **Drawer Mechanics & Tab Navigation:**
  - Trigger from row action button `View Details`.
  - Slide-in side drawer from right margin with backdrop scrim.
  - **Tab 1: Stock Formula Ledger** — Displays Opening + Inward - Outward = Current Balance with timestamped ledger table.
  - **Tab 2: Polymer Consumption Profile** — Shows HDPE virgin resin / polypropylene mix, color masterbatch specs, and net weight per unit (e.g. 1.85 kg).
  - **Tab 3: Mold & Machine Association** — Maps crate to specific injection mold die and machine tonnage (e.g., Haitian 450T).
  - Test Escape key and close button behavior.

---

### 7. Section 07: Viewport Scaling & Mobile Responsive Testing
- [ ] **Desktop Standard Viewport (1440 × 900):**
  - Full wide table with all KPI cards and side navigation.
- [ ] **Laptop Standard Viewport (1280 × 720):**
  - Compact table margins, zero horizontal overflow of layout container.
- [ ] **Netbook / Tablet Viewport (1100 × 680):**
  - Sticky table headers, responsive grid collapse for KPI cards.
- [ ] **Collapsed Sidebar Mode (68px Nav Rail):**
  - Expanded content width, fluid adjustment of master stock grid.

---

## 🏆 Sign-off & Audit Certification Checklist
1. [x] Zero financial ledger discrepancy against base valuation formula (₹85/crate).
2. [x] Real-time reactive updates across sub-tab filtering pills.
3. [x] Modal dialogues conform to enterprise accessibility standards (focus trap, ARIA labels, backdrop click dismiss).
4. [x] Zero console warnings or memory leaks on drawer lifecycle transitions.
