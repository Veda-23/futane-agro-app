# Futane Agro ERP: Comprehensive Production & Shift Manufacturing Master Prompt

> **Version:** 2.5.0  
> **Target Modules:** Daily Production (`/production`) & Monthly Production Summary (`/monthly-production`)  
> **Scope:** Full End-to-End Audit across Shift Manufacturing Runs, PPD & PPM Sub-Tabs, QC Batch Dossier Modal, Energy Trajectory Charts & State Mutations  
> **Environment:** Production / UAT Enterprise Angular 17 + Spring Boot Runtime  
> **Audience:** Lead Systems Architects, Automated QA Agents, Quality Control & Plant Engineering Teams  

---

## 🎯 Master Prompt Context & Execution Directive

```markdown
You are the Chief Industrial Automation Architect, Systems Quality Engineer, and ERP Auditor for Futane Agro ERP (Precision Plastic Injection Molding & Agro-Industrial Material Handling Platform).

Your objective is to conduct an exhaustive, empirical validation of both the Daily Production & Shift Manufacturing module (`/production`) and the Monthly Production & Energy Summary module (`/monthly-production`).
You must test EVERY shift log entry, batch yield calculation, scrap rejection telemetry card, multi-column manager, QC inspection sheet modal dialogue, and monthly energy cost analysis chart. Crucially, you must verify mathematical invariants:
  - Good Crates + Scrap Rejections = Total Run Production
  - Batch Yield % = (Good Crates ÷ Total Production) × 100
  - Electricity Cost per Crate = Total Power Bill ÷ Total Crates Manufactured
  - Batch Inspection Dossier letterhead renders with correct GSTIN, PAN, and factory watermark without clipping.

Capture high-resolution screenshots of normal states, active form drawers, QC dossier dialogues, and responsive viewports.
```

---

## 📋 Complete Production Module Audit & Mutation Test Matrix

### 1. Section 01: Module Header, Status Badges & Quick Action Controls
- [ ] **Breadcrumb & Title Telemetry:**
  - Verify breadcrumb hierarchy: `Futane Agro ERP / Manufacturing / Daily Production & Shift Operations`.
  - Verify primary module title: `Production` with reactive badge showing total batches (e.g. `80 Batches`).
  - Verify subtitle: `Daily manufacturing, shift-wise output, rejection rates & quality telemetry`.
  - Verify engineering formula chip: `Total Produced - Rejections = Net Stock Ready`.
- [ ] **Header Action Buttons (Uniform 36px Height):**
  - `Refresh` Button: Test manual sync trigger (`isRefreshing = true`) -> triggers `getPpd()` & `getPpm()` -> displays toast `Production data synchronized`.
  - `CSV` Export Button: Test export of visible PPD records to `.csv` format.
  - `Excel` Export Button: Test XLSX workbook generation with shift calculations.
  - `+ Add Production` Button: Test opening of the slide-in Daily Production Drawer / Entry Form (`isFormVisible = true`).

---

### 2. Section 02: Dual Sub-Tab Mode Switcher
- [ ] **Daily Production (PPD) Tab (`.subtab-ppd`):**
  - Displays batch counter pill `80`.
  - Activates Daily Production table with shift records and defect analysis.
- [ ] **Monthly Summary (PPM) Tab (`.subtab-ppm`):**
  - Displays monthly counter pill `25`.
  - Switches view dynamically to Monthly Production summary, energy consumption (kWh), and cost per crate trajectory.

---

### 3. Section 03: Daily Production Executive KPI Cards (5 Metrics)
- [ ] **KPI 1: Total Produced (`.kpi-total`):**
  - Value: Total crates manufactured across all shifts (`98,212 crates`).
  - Sub-label: `Across 80 logged batches`.
- [ ] **KPI 2: Successful Crates (`.kpi-success`):**
  - Value: Good crates meeting quality specifications (`96,486 crates`).
  - Sub-label: `Passed quality gate`.
- [ ] **KPI 3: Rejections & Scrap Scraping (`.kpi-rejected`):**
  - Value: Defective crates routed for regrind / re-granulation (`1,726 crates`).
  - Sub-label: Dynamic scrap rate percentage (`1.8% scrap rate`).
- [ ] **KPI 4: Logged Batches (`.kpi-batches`):**
  - Value: Total shift run cycles logged (`80`).
  - Sub-label: `Manufacturing shift cycles`.
- [ ] **KPI 5: Overall Batch Yield (`.kpi-yield`):**
  - Value: Overall plant molding efficiency index (`98.2%`).
  - Visual gauge: Circular plant efficiency index badge.

---

### 4. Section 04: Table Toolbar & Interactive Grid Controls
- [ ] **Search & Contextual Filtering:**
  - Real-time search input: Filters across Crate SKU, Shift name, and Date.
  - `Filters` Popover Button:
    - Toggles shift filter (`Morning Shift`, `Afternoon Shift`, `Night Shift`).
    - Toggles crate type filter (`Apple Crate`, `Tomato Tray`, `Mango Box`, `Grape Box`).
    - Minimum efficiency threshold slider / input.
    - Active filter counter pill dynamically updates badge.
- [ ] **Table View Density Controls:**
  - Test 3 density presets: `Compact`, `Comfortable`, `Spacious`.
  - Verify row height adjusts cleanly and preferences persist in `localStorage`.
- [ ] **Column Manager Popover (`showColManager['ppd']`):**
  - Toggle visibility for all 9 columns: `Select`, `Date`, `Crate Type`, `Shift`, `Total Production`, `Successful`, `Rejected`, `Batch Yield`, `Actions`.
  - Pinned column verification: `Select` column remains sticky during horizontal scroll.

---

### 5. Section 05: Daily Production Data Grid & Invariant Verification
- [ ] **Mathematical Invariant Audit per Row:**
  - Column 1: Multi-select checkbox with bulk-action selection count.
  - Column 2: Manufacturing Date (`DD/MM/YYYY`) with sort toggle.
  - Column 3: Crate SKU (`Apple Crate`, `Export Grade A Grapes Crate`, `Pomegranate Super-Red Crate (5kg)`).
  - Column 4: Shift Badge (`Morning Shift`, `Afternoon Shift`, `Night Shift`).
  - Column 5: Total Production count.
  - Column 6: Successful count with soft green badge.
  - Column 7: Rejected count with soft red badge.
  - Column 8: Batch Yield % with green pill badge (`98%`, `99%`).
  - Row Invariant Formula: `Total Production = Successful + Rejected`.
- [ ] **Row Action Buttons:**
  - **Inspection Eye Icon (`openPpdDossier(ppd)`)**: Opens official Batch QC Inspection Sheet Dossier.
  - **Edit Pencil Icon (`editPpd(ppd)`)**: Pre-fills drawer form with record values.
  - **Delete Trash Icon (`deletePpd(ppd.id)`)**: Prompts confirmation and removes record from database.

---

### 6. Section 06: Official Batch QC Inspection Sheet Dossier Modal
- [ ] **Modal Stacking & Centering (`showPpdDossierModal`):**
  - Perfectly centered backdrop with zero horizontal/vertical collision.
  - Header: `Official Quality Inspection Slip • Batch #<uuid>` with `Print Batch Slip` and `✕` close triggers.
- [ ] **Official Enterprise Letterhead:**
  - Header text: `FUTANE AGRO INDUSTRIES PVT. LTD.`
  - Sub-text: `Industrial Manufacturing, Agricultural Packaging & Supply Chain Logistics`.
  - Tax compliance chips: `GSTIN: 27AAACF2920A1ZX`, `PAN: AAACF2920A`, `Plant: MIDC Baramati, Pune (MH)`.
  - Certificate status: `BATCH QC CERTIFICATE`, `Quality Gate Passed`.
- [ ] **Section 1: Manufacturing Run Telemetry:**
  - Crate Product SKU, Shift Classification, Production Date, Manufacturing Gate (`Line #1 — Injection Molding`).
- [ ] **Section 2: Shift Volume & Defect Audit:**
  - Table showing Gross Production Output, Successful / Passed QC, Rejections / Defective Scrap.
  - Defect disposition: `Regrind / Recycling Reprocessing`.
- [ ] **Validation Seal & Actions:**
  - Plant verification watermark: `FUTANE AGRO MANUFACTURING INSPECTION SEAL`.
  - Bottom controls: `Production Batch Validated` status, `Close` button, and `Print Batch Slip` (triggers `window.print()`).

---

### 7. Section 07: Add / Edit Daily Production Drawer Form (`isFormVisible`)
- [ ] **Form Fields & Validation:**
  - Production Date selector (defaults to current date).
  - Crate Product Type dropdown (`Apple Crate`, `Tomato Tray`, `Mango Box`, `Grape Box`).
  - Shift selector (`Morning Shift`, `Afternoon Shift`, `Night Shift`).
  - Total Production number input.
  - Good Crates count vs Rejected scrap count.
- [ ] **Automated Yield Calculation:**
  - Typing in Total & Good automatically calculates Rejected and Batch Yield percentage in real time.
- [ ] **Form Submission & State Mutation:**
  - Submitting writes to `ppdList`, triggers notification, recalculates top KPI cards, and updates warehouse stock.

---

### 8. Section 08: Monthly Production Summary & Energy Analysis (`monthly-production`)
- [ ] **Monthly Executive KPI Cards (5 Metrics):**
  - KPI 1: Total Production across all months (`1,132,000 crates`).
  - KPI 2: Total Electricity Consumption (`222,100.0 kWh`, avg `8,884 kWh/mo`).
  - KPI 3: Total Power Utility Bill (`₹1,909,575.00`, avg `₹76,383/mo`).
  - KPI 4: Overhead Energy Cost Per Crate (`₹1.69 / crate`, `0.20 kWh/crate`).
  - KPI 5: Peak Output Month (`AUGUST 2026`).
- [ ] **Energy Cost Trajectory Chart:**
  - Visual comparative timeline of crate output volume vs electricity unit overhead.
  - Mode toggles: `Crates & Cost`, `Energy (kWh)`, and `Hide` chart toggle.
- [ ] **Monthly Data Table (`ppmList`):**
  - Columns: Month/Year, Total Crates Produced, Electricity Units (kWh), Electricity Bill (₹), Units/Crate, Cost/Crate, Row Actions.
  - Verifies math: `Cost/Crate = Electricity Bill ÷ Crates Produced`.

---

### 9. Section 09: Add / Edit Monthly Summary Modal (`isPpmFormVisible`)
- [ ] **Monthly Form Dialog:**
  - Month and Year selectors (`January` - `December`, `2024` - `2027`).
  - Crates Produced input.
  - Electricity Units (kWh) and Total Bill (₹) inputs.
  - Dynamic preview of Energy Overhead per Finished Crate.
  - Test Save & Update mutation persistence.

---

### 10. Section 10: Multi-Viewport Responsive Layout Testing
- [ ] **Responsive Breakpoints:**
  - **Standard Desktop (1440×900)**: Full 5 KPI cards inline, full table with sticky select column.
  - **Laptop (1280×720)**: Clean 5-card wrap, zero text truncation in table cells.
  - **Compact Screen (1100×680)**: Smooth horizontal scroll on table, sticky action column, zero clipping.
  - **Sidebar Collapsed (68px)**: Seamless canvas width expansion, perfect center alignment of modals.

---

## 🔍 Visual Verification Artifacts Reference

- **Daily Production Viewport Snapshot:**  
  [`scratch/production_audit/01_daily_production_viewport.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/production_audit/01_daily_production_viewport.png)
- **Daily Production Full-Page Snapshot:**  
  [`scratch/production_audit/02_daily_production_fullpage.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/production_audit/02_daily_production_fullpage.png)
- **Daily Production Entry Form Drawer:**  
  [`scratch/production_audit/03_daily_production_entry_form.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/production_audit/03_daily_production_entry_form.png)
- **Batch QC Inspection Sheet Dossier Modal:**  
  [`scratch/production_audit/04_batch_qc_dossier_modal.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/production_audit/04_batch_qc_dossier_modal.png)
- **Column Manager Active Popover:**  
  [`scratch/production_audit/05_column_manager_active.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/production_audit/05_column_manager_active.png)
- **Filter Popover Active:**  
  [`scratch/production_audit/06_filter_popover_active.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/production_audit/06_filter_popover_active.png)
- **Monthly Summary Executive Viewport:**  
  [`scratch/production_audit/07_monthly_production_viewport.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/production_audit/07_monthly_production_viewport.png)
- **Monthly Summary Full-Page Snapshot:**  
  [`scratch/production_audit/08_monthly_production_fullpage.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/production_audit/08_monthly_production_fullpage.png)
- **Monthly Production Entry Modal:**  
  [`scratch/production_audit/09_monthly_production_entry_form.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/production_audit/09_monthly_production_entry_form.png)
- **Laptop 1280×720 Viewport:**  
  [`scratch/production_audit/10_laptop_1280x720.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/production_audit/10_laptop_1280x720.png)
- **Compact Screen 1100×680 Viewport:**  
  [`scratch/production_audit/11_compact_1100x680.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/production_audit/11_compact_1100x680.png)
- **Sidebar Collapsed Production Snapshot:**  
  [`scratch/production_audit/12_sidebar_collapsed_production.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/production_audit/12_sidebar_collapsed_production.png)
- **Structured Audit Report (JSON):**  
  [`scratch/production_audit/production_audit_report.json`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/production_audit/production_audit_report.json)
