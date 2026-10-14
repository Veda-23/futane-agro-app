# Futane Agro ERP: Injection Molding Machines & OEE Metrics Master Prompt

> **Version:** 2.5.0  
> **Target Module:** Injection Molding Machines & OEE Metrics Registry (`/machines`)  
> **Scope:** Full End-to-End Empirical Audit across 26 Industrial Injection Molding Units, Fleet Throughput Capacity, Maintenance & Breakdown Ledger, Downtime Tracking, and Responsive Viewports  
> **Environment:** Production / UAT Enterprise Angular 17 + Spring Boot Runtime  
> **Audience:** Lead Systems Architects, Plant Automation Engineers, Maintenance Supervisors & Quality Audit Specialists  

---

## 🎯 Master Prompt Context & Execution Directive

```markdown
You are the Chief Industrial Automation Architect, Plant Engineering Auditor, and ERP Quality Assurance Specialist for Futane Agro ERP (Precision Plastic Injection Molding & Agro-Industrial Material Handling Platform).

Your objective is to conduct an exhaustive, empirical validation of the Injection Molding Machines & OEE Metrics module (`/machines`).
You must test EVERY heavy injection moulding unit record (Engel, KraussMaffei, Haitian, Windsor, Toshiba), hourly clamp throughput capacity, breakdown maintenance ledger entry, downtime hours tracking, operational status filters, and responsive viewports. Crucially, you must verify engineering and operational invariants:
  - Rated Fleet Throughput Invariant: Active Running Units × Rated Unit Crates/Hr = Total Factory Floor Throughput (15,600 Crates/Hr across 26 units)
  - Fleet Utilization Rate: (Running Machines ÷ Total Registered Machines) × 100 = 100% Plant Floor in Service
  - Live Daily Rated Output Invariant: Hourly Capacity × 24 Hours = Total Daily Rated Output (e.g. 450 crates/hr = 10,800 crates/day)
  - Live Breakdown Disruption Calculation: Downtime Hours × 450 crates/hr = Lost Fleet Production Crates
  - Preventive Maintenance Heuristic: Any machinery unit with last service/breakdown log > 30 days triggers an "Attention Due (Xd)" badge and activates the global Maintenance Due banner.

Capture high-resolution screenshots of normal states, active machine registration drawers, breakdown logging modals, and responsive viewports.
```

---

## 📋 Complete Machinery Fleet & OEE Audit & Mutation Test Matrix

### 1. Section 01: Module Header, Status Badges & Quick Action Controls
- [ ] **Breadcrumb & Title Telemetry:**
  - Verify breadcrumb hierarchy: `Futane Agro ERP / Factory Operations / Equipment & OEE Registry`.
  - Verify primary module title: `Injection Molding Machines & OEE Metrics` with reactive badge showing total units (`26 Machines`).
  - Verify subtitle: `Heavy injection moulding units, hourly throughput capacity, and breakdown maintenance ledger`.
  - Verify telemetry pills: `FLEET: 15,600 CRATES/HR • 100% UTIL` and engineering formula badge `Active Units × Hourly Crates/Hr = Total Fleet Throughput`.
- [ ] **Header Action Buttons (Uniform 36px Height):**
  - `Refresh` Button: Test manual sync trigger (`isLoading = true`) -> triggers `loadData()` -> synchronizes machines and breakdown logs.
  - `CSV` Export Button: Test export of equipment list to `.csv` format.
  - `Excel` Export Button: Test XLSX workbook generation with machine codes and tonnage capacity.
  - `+ Add Machine` / `+ Log Breakdown` Contextual Button: Toggles based on active subtab to open either the Machine Registration Drawer or the Breakdown Logging Drawer.

---

### 2. Section 02: Dual Sub-Tab Switcher & Preventative Maintenance Banner
- [ ] **Machinery Fleet Tab (`.subnav-tab-btn:nth-child(1)`):**
  - Displays registered machine count badge `26`.
  - Activates Machinery Fleet inventory grid with asset codes, capacities, and service health.
- [ ] **Breakdown Ledger Tab (`.subnav-tab-btn:nth-child(2)`):**
  - Displays incident log counter badge `17`.
  - Switches view dynamically to maintenance downtime ledger with fault causes and restoration dates.
- [ ] **Preventive Maintenance Due Banner (`.mach-alert-banner`):**
  - Displays when `machineDueCount > 0` (e.g. `17 Machinery Unit(s) Require Maintenance Attention`).
  - Warning chip `MAINTENANCE DUE` and quick action button `View Units` that filters to maintenance-due machines.

---

### 3. Section 03: Executive KPI Telemetry Cards (5 Metrics Strip)
- [ ] **KPI 1: Total Fleet Units (`.machine-kpi-card:nth-child(1)`):**
  - Value: `26 Units` registered across KraussMaffei 650T, Windsor, and Haitian IMM lines.
- [ ] **KPI 2: Online & Producing (`.machine-kpi-card:nth-child(2)`):**
  - Value: `26 Active` machines operating at `100% plant floor in service`.
- [ ] **KPI 3: Maintenance / Idle (`.machine-kpi-card:nth-child(3)`):**
  - Value: `0 Units` currently offline (0h cumulative downtime recorded).
- [ ] **KPI 4: Rated Plant Throughput (`.machine-kpi-card:nth-child(4)`):**
  - Value: `15,600 Crates/Hr` aggregate factory output rate.
- [ ] **KPI 5: Fleet Utilization (`.machine-kpi-card:nth-child(5)`):**
  - Value: `100%` plant equipment efficiency.

---

### 4. Section 04: Machinery Fleet Master Inventory Table
- [ ] **Grid Columns & Formatting:**
  - Asset Code (e.g., `IMM-038`, `IMM-036`, `IMM-040`, `IMM-001`).
  - Machine Model & Unit (e.g., `KraussMaffei 650T Imm 20260822153219`).
  - Capacity: Rated throughput formatted with badge (e.g., `600 crates/hr`).
  - Installed Date: Formatted Indian Date string (e.g. `22/08/2026`).
  - Operating Status Badge: `Running` (Green), `Idle` (Slate), `Under Maintenance` (Amber), `Breakdown` (Red).
  - Service Health Badge: `Optimal / No Logs` (Green) or `Attention Due (50d)` (Amber/Red).
  - Action Controls: Edit button (opens edit drawer) and Delete button (triggers soft delete confirmation).
- [ ] **Toolbar Controls:**
  - Search input with instantaneous debounced filter by machine name, asset tag, or ID.
  - Status filter pills: `All (26)`, `Running (26)`, `Maintenance (0)`, `Idle (0)`, `Breakdown (0)`.
  - Table Density Switcher: `compact`, `comfortable`, `spacious`.
  - Column Manager Dropdown: Toggle visibility across 7 columns.

---

### 5. Section 05: Register Machine Asset Drawer (`isMachineFormOpen = true`)
- [ ] **Drawer Mechanics & Real-Time Calculation:**
  - Slide-in side drawer with modal backdrop blur.
  - Form Fields: Machine Name (mandatory), Asset Tag/Code (mandatory, auto-uppercased font-mono), Rated Capacity (crates/hr), Installation Date (date picker), Operating Status (select).
  - **Live Daily Rated Output Badge:** Dynamically computes `capacityPerHour × 24` (e.g., `450 crates/hr` displays `10,800 crates/day`).
  - Actions: Cancel button and Save Machine Unit button (`+ Save Machine Unit` / `Update Equipment Profile`).

---

### 6. Section 06: Maintenance & Breakdown Ledger Subtab (`activeSubTab = 'breakdowns'`)
- [ ] **Breakdown Grid Columns:**
  - Machine Unit name and tag badge.
  - Breakdown Date.
  - Fault / Disruption Details (e.g. hydraulic valve leak, heater band replacement).
  - Downtime Hours.
  - Resolved Date / Status: Displays `Pending Repair` badge if unresolved.
  - Row Action Controls: Edit incident log, Delete log.

---

### 7. Section 07: Log Maintenance Breakdown Drawer (`isBreakdownFormOpen = true`)
- [ ] **Drawer Mechanics & Fleet Disruption Calculation:**
  - Form Fields: Affected Equipment dropdown (populated with 26 registered machines), Incident Date, Downtime Hours, Fault/Cause Description textarea, Resolution Date.
  - **Live Disruption Impact Badge:** Dynamically computes production loss: `Downtime Hours × 450 crates/hr` (e.g., `4 hours` downtime displays `-1,800 crates lost`).
  - Actions: Cancel button and Record Breakdown Log button.

---

### 8. Section 08: Viewport Scaling & Mobile Responsive Testing
- [ ] **Desktop Standard Viewport (1440 × 900):**
  - Full wide table layout with all 5 KPI cards in single line.
- [ ] **Laptop Standard Viewport (1280 × 720):**
  - Fluid padding adjustment, zero horizontal scrollbar on main container.
- [ ] **Netbook / Tablet Viewport (1100 × 680):**
  - Responsive stacking of KPI cards and filter controls.
- [ ] **Collapsed Sidebar Mode (68px Nav Rail):**
  - Expanded content width, fluid expansion of machine data grid.

---

## 🏆 Sign-off & Audit Certification Checklist
1. [x] Zero discrepancies between machine ratings and total fleet throughput formula (`15,600 crates/hr`).
2. [x] Real-time reactive updates across status filter pills and subnav counters.
3. [x] Drawers and modal overlays comply with keyboard dismiss (Escape), backdrop click, and non-blocking lifecycle events.
4. [x] Zero console warnings or memory leaks on sub-tab navigation or row updates.
