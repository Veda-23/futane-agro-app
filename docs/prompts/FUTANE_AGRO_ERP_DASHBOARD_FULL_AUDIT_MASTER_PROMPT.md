# Futane Agro ERP: Comprehensive Dashboard Tab & Button Mutation Master Prompt

> **Version:** 2.5.0  
> **Target Module:** Executive KPI Command Center (`/dashboard`)  
> **Scope:** Full End-to-End Audit across all 12 Functional Sections, Live Telemetry HUD, Charts Matrix, Buttons, FAB Quick-Menu & State Mutations  
> **Environment:** Production / UAT Enterprise Angular 17 + Spring Boot Runtime  
> **Audience:** Lead Systems Architects, Automated QA Agents, Executive Audit Teams  

---

## 🎯 Master Prompt Context & Execution Directive

```markdown
You are the Principal Systems Quality Architect and Enterprise Test Automation Specialist for Futane Agro ERP (Precision Plastic Injection Molding & Agro-Industrial Material Handling Platform).

Your objective is to conduct an exhaustive, empirical validation of the entire Executive KPI Command Center (`/dashboard`).
You must test EVERY telemetry HUD gauge, EVERY interactive button, alert card, financial velocity metric, chart canvas, floating action menu, and data importer widget. Crucially, you must empirically verify whether state mutations and data refreshes actually occur (i.e. does the "Sync Data" trigger backend queries and spin, does the live toast notification fire, do quick-action buttons route to their target tabs, does the floating FAB expand/collapse, and do Chart.js instances re-render without memory leaks?).

Take high-resolution screenshots before, during, and after mutations. Log exact JSON telemetry payloads and verify error-free console logs.
```

---

## 📋 Complete 12-Section Dashboard Audit & Mutation Test Matrix

### 1. Section 01: Executive Command Center Header Strip & Live Plant Telemetry HUD
- [ ] **Header Title & Status Badging:**
  - Verify `PLANT ACTIVE • SHIFT LIVE` badge with green pulsating live radar dot.
  - Verify header title: `Executive Overview` and subtitle: `Today's manufacturing, inventory, sales and financial performance`.
- [ ] **Live Telemetry HUD Gauges:**
  - Gauge 1: Current Shift indicator (`Shift 1 (Day): 08:00 - 16:00`) with visual progress bar (`[style.width.%]="plantTelemetry.shiftProgress"`) and numerical readout (e.g., `68%`).
  - Gauge 2: Fleet OEE (`94.8%`) with `Optimal` online badge.
  - Gauge 3: Injection Molding Lines active count (`26 / 26`) with `100% Online` status chip.
- [ ] **Interactive Buttons & Selectors:**
  - Reporting Period Pill: Verifies dynamic month/year MTD label (`Oct 2026 MTD`).
  - `Sync Data` Button: Test button click:
    - Button text immediately mutates from `Sync Data` to `Syncing...`.
    - Refresh icon adds class `.spin-refresh` and animates 360-degree rotation.
    - Triggers backend `getStats(true)` and `getCharts(true)` API calls.
    - Displays green top-right toast: `Executive telemetry refreshed - Latest records pulled from server just now.`.
    - Button reverts cleanly to `Sync Data` state after completion.

---

### 2. Section 02: Quick Actions Operations Bar
- [ ] **Strict Visual Hierarchy & Button Alignment:**
  - Verify 36-38px uniform height, icon prefixes, and zero vertical clipping.
- [ ] **Interactive Navigation Buttons:**
  - **New Sale (Primary Button)**: Test click -> emits `onNavigateTab('sales')` -> loads Sales Orders module.
  - **Production (Secondary Button)**: Test click -> emits `onNavigateTab('production')` -> loads Daily Production module.
  - **Payment (Secondary Button)**: Test click -> emits `onNavigateTab('payments')` -> loads Customer Payments module.
  - **Tax Invoice (Secondary Button)**: Test click -> emits `onNavigateTab('invoices')` -> loads GST Billing Hub.
  - **Dispatch (Secondary Button)**: Test click -> emits `onNavigateTab('dispatch')` -> loads Outward Dispatches module.
  - **Stock Check (Secondary Button)**: Test click -> emits `onNavigateTab('inventory')` -> loads Finished Goods Warehouse.

---

### 3. Section 03: Operational Attention & Exception Alert Pills
- [ ] **Receivables Notice Pill (`.alert-warning-pill`):**
  - Displays pending receivables (`₹403,060 pending recovery`) with warning icon.
  - Visual recovery gauge with percentage bar (`68%` collected, `₹877,500` settled).
  - Test click action: routes directly to `/payments` tab for recovery.
- [ ] **Polymer Buffer Pill (`.alert-info-pill`):**
  - Displays HDPE granule stock on hand (`23,600 kg`) with droplet icon.
  - Capacity gauge bar (`94% Buffer`, ~16,300 crates reserve).
  - Test click action: routes directly to `/raw-materials` tab for inward procurement.
- [ ] **Plant Pacing Pill (`.alert-success-pill`):**
  - Displays fleet pacing status (`26 injection lines active`) with checkmark icon.
  - 100% uptime gauge bar (`0 Downtime`).
  - Test click action: routes directly to `/production` tab for shift logs.

---

### 4. Section 04: Primary Executive KPI Cards & Mini Sparklines
- [ ] **KPI 1: Today's Production (`.kpi-production`):**
  - Purple themed badge: `+12.4% vs lw`.
  - Crates manufactured value with units (`crates`).
  - Canvas Sparkline: `#sparkline-prod` renders smooth purple mini-trendline.
- [ ] **KPI 2: Monthly Production MTD (`.kpi-monthly`):**
  - Blue themed badge: `98.1% Target`.
  - MTD crates output with units (`crates`).
  - Canvas Sparkline: `#sparkline-monthly` renders smooth blue mini-trendline.
- [ ] **KPI 3: Total Sales Revenue (`.kpi-sales`):**
  - Green themed badge: `+18.2% Velocity`.
  - Indian Rupee formatted value: `₹1,288,560`.
  - Canvas Sparkline: `#sparkline-sales` renders smooth green growth trendline.
- [ ] **KPI 4: Pending Overdues (`.kpi-pending`):**
  - Red themed badge: `23.7% Unbilled`.
  - Indian Rupee formatted value: `₹403,060`.
  - Canvas Sparkline: `#sparkline-pending` renders smooth red overdue curve.

---

### 5. Section 05: Financial P&L Velocity Strip
- [ ] **Total Income Card (`.pl-income`):**
  - Formatted revenue: `₹1,288,560` (Revenue from Sales).
- [ ] **Total Expenses Card (`.pl-expense`):**
  - Aggregate costs: `₹3,033,600` (Raw Materials + Transport + Salaries + Overheads).
- [ ] **Net Profit / Loss Card (`.pl-profit`):**
  - Computes `computedNetProfit = totalSalesAmount - (rawMaterials + transport + salaries + expenses)`.
  - Dynamic indicator:
    - If positive: green caret up, positive operating margin badge (`+XX.X% Margin`).
    - If negative: red caret down, net loss badge (`-157.8% Margin`), and pill `(Net Loss)`.
  - Verified empirical accuracy against general ledger totals.

---

### 6. Section 06: Secondary Operational Telemetry Strip & Capacity Gauges
- [ ] **Finished Goods Crates Inventory (`.telemetry-pill-card`):**
  - Crates stock count: `64,200 crates` with amber `100% Full` badge.
  - Progress bar dynamically bounded by `warehouseMaxCap` (50,000 threshold).
  - Test click: routes to `/inventory`.
- [ ] **Polymer Raw Material Buffer:**
  - Buffer stock: `23,600 kg` HDPE granules with cyan `94% Buffer` badge.
  - Progress bar dynamically bounded by `polymerBufferMax` (25,000 threshold).
  - Test click: routes to `/raw-materials`.
- [ ] **Factory Workforce & Staff:**
  - Active staff count: `25 staff` with green `100% Present` badge.
  - Shift operator coverage: 100% full capacity progress bar.
  - Test click: routes to `/employees`.
- [ ] **Freight Logistics & Transport Expenses:**
  - Cumulative trip cost: `₹252,000` with crimson `14 Trips` badge.
  - Outbound shipment progress bar.
  - Test click: routes to `/transports`.

---

### 7. Section 07: Manufacturing & Sales Chart.js Analytics Matrix
- [ ] **Production Analytics Chart (`#prodChartCanvas`):**
  - Chart type: Bar chart with rounded bar corners (`borderRadius: 6`).
  - Dataset: Daily crates output grouped by date/month.
  - Palette: Royal purple gradient with custom font styling (`Outfit, 11px`).
  - Tooltips: Verified hover interaction displaying exact crates produced.
- [ ] **Sales Revenue Growth & Trends Chart (`#salesChartCanvas`):**
  - Chart type: Spline line chart with smooth tension (`tension: 0.35`) and filled area.
  - Dataset: Revenue progression in INR (`₹`).
  - Y-Axis Formatter: Formats currency in Indian numbering system (`₹1,60,000`, `₹1,40,000`).
  - Tooltips: Verified hover interaction displaying date and formatted revenue.

---

### 8. Section 08: Customer Revenue Concentration Doughnut Chart
- [ ] **Debtor Concentration Canvas (`#custChartCanvas`):**
  - Chart type: Doughnut chart with clean center cutout (`cutout: '62%'`).
  - Dataset: Top 7 customer sales shares + consolidated `Other Customers` slice.
  - Dynamic Palette: 8 distinct luxury enterprise colors (Violet, Blue, Emerald, Amber, Crimson, Rose, Cyan, Slate).
  - Interactive Legend: Right-aligned circular point badges with bold labels (`Zomato Hyperpure Agro`, `Adani Agri Fresh Logistics`, `Heritage Foods Retail Ltd`, `Gujarat Agro Cold Chain Exporters`, `Kalyan Agri Traders`, `Mahindra Agri Solutions Ltd`, `Reliance Fresh Distribution Hub`).
  - Tooltips: Displays exact rupee sales per account on hover.

---

### 9. Section 09: Recent Activity Stream & Audit Log Viewer
- [ ] **Activity Feed Rendering:**
  - Displays top 8 chronologically sorted audit trail items from `getAuditLogs()`.
  - Details per event: Action description, username badge (`SUPER_ADMIN`, `admin`), formatted Indian timestamp (`DD/MM/YYYY, hh:mm A`).
  - Empty state fallback: Verified clean icon and message when no logs exist.
- [ ] **Interactive Audit Link:**
  - `View All Logs →` Button: Test click -> routes to `/audit-logs` tab.

---

### 10. Section 10: Operations Navigation Shortcuts
- [ ] **Shortcut Grid Cards:**
  - Card 1: `Sales Orders` (Outward billing) -> clicks through to `/sales`.
  - Card 2: `Plant Shifts` (Molding lines) -> clicks through to `/production`.
  - Card 3: `Reports Hub` (Financial P&L) -> clicks through to `/reports`.
  - Card 4: `PowerBI Suite` (Executive BI) -> clicks through to `/analytics`.
- [ ] **Hover & Focus Micro-Interactions:**
  - 3D card elevation, border accentuation on hover, and zero layout shift.

---

### 11. Section 11: Super Admin System Health & Diagnostic Telemetry
- [ ] **Role Guard Verification:**
  - Container rendered only when `loggedInUser?.role === 'SUPER_ADMIN'`.
  - Hidden gracefully for lower-privileged roles (`SALES_EXECUTIVE`, `OPERATOR`).
- [ ] **Diagnostic Telemetry Badges:**
  - `Spring Boot API`: `ONLINE` (green badge).
  - `MySQL InnoDB`: `ONLINE (1.2ms)` latency badge.
  - `Caffeine Cache`: `ACTIVE (98.7% HIT)` efficiency badge.
  - `WebSocket Broker`: `STOMP CONNECTED` telemetry badge.

---

### 12. Section 12: Centralized Universal CSV Importer & Floating Action Button (FAB)
- [ ] **Universal CSV Importer Hub (`app-universal-importer`):**
  - Module Selector Tabs: Verify 8 module pills (`Parties & Customers`, `Raw Materials`, `Daily Production`, `Finished Inventory`, `Vendors`, `Employees & Staff`, `Factory Machines`, `Expense Ledger`).
  - Action Buttons: Verify `Download Sample Template (.csv)` and `Choose CSV File` triggers.
  - Non-intrusive collapsible layout at bottom of dashboard.
- [ ] **Floating Action Button (FAB):**
  - Fixed floating circular button in bottom-right corner (`#10b981` / emerald accent).
  - Test click trigger:
    - Mutates icon from `bi-plus-lg` (`+`) to `bi-x-lg` (`✕`).
    - Opens `.fab-menu-items` with 3 rapid operational shortcuts: `New Sale`, `Production`, `Payment`.
    - Clicking any item routes to module and automatically collapses menu.
    - Clicking `✕` closes menu cleanly.

---

## 🔍 Visual Verification Artifacts Reference

- **Executive Viewport Snapshot:**  
  [`scratch/dashboard_audit/01_dashboard_executive_viewport.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/dashboard_audit/01_dashboard_executive_viewport.png)
- **Full-Page Deep Scroll Snapshot:**  
  [`scratch/dashboard_audit/02_dashboard_fullpage_scrollable.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/dashboard_audit/02_dashboard_fullpage_scrollable.png)
- **Sync Data Active Toast & Mutation:**  
  [`scratch/dashboard_audit/03_sync_data_active_toast.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/dashboard_audit/03_sync_data_active_toast.png)
- **FAB Menu Expanded State:**  
  [`scratch/dashboard_audit/04_fab_menu_opened.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/dashboard_audit/04_fab_menu_opened.png)
- **Laptop 1280x720 Scaled Viewport:**  
  [`scratch/dashboard_audit/05_laptop_1280x720.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/dashboard_audit/05_laptop_1280x720.png)
- **Compact Screen 1100x680 Viewport:**  
  [`scratch/dashboard_audit/06_compact_1100x680.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/dashboard_audit/06_compact_1100x680.png)
- **Sidebar Collapsed 1440x900 Viewport:**  
  [`scratch/dashboard_audit/07_sidebar_collapsed_dashboard.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/dashboard_audit/07_sidebar_collapsed_dashboard.png)
- **Structured Audit Report (JSON):**  
  [`scratch/dashboard_audit/dashboard_audit_report.json`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/dashboard_audit/dashboard_audit_report.json)
