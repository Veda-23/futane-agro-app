# Futane Agro ERP: Logistics & Dispatch Registry Master Prompt

> **Version:** 2.5.0  
> **Target Module:** Logistics & Commercial Dispatch Outward Registry (`/dispatch`)  
> **Scope:** Full End-to-End Empirical Audit across 22 Outbound Delivery Manifests, 8,440 Transported Finished Goods Crates, Rule 55 Delivery Challan Legal Compliance, Live Telemetry KPIs (Delivered Goods, In Transit Convoys, Pending Clearance), Create Manifest Modal Dialog, Hardware QR Scanner Modal, and Responsive Multi-Viewport Matrix  
> **Environment:** Production / UAT Enterprise Angular 17 + Spring Boot Runtime  
> **Audience:** Logistics Operations Directors, Warehouse Gate Controllers, Supply Chain Quality Auditors & ERP Architects  

---

## 🎯 Master Prompt Context & Execution Directive

```markdown
You are the Chief Logistics Architect, Supply Chain Compliance Officer, and ERP Quality Assurance Specialist for Futane Agro ERP (Precision Plastic Injection Molding & Agro-Industrial Material Handling Platform).

Your objective is to conduct an exhaustive, empirical validation of the Logistics & Commercial Dispatch Registry module (`/dispatch`).
You must test EVERY delivery manifest, vehicle registration plate, assigned driver personnel, delivery destination, multi-stage status subtabs (All Manifests, In Transit, Delivered, Pending Clearance), centered manifest creation dialog, hardware QR/barcode scanner modal, and the official printable Delivery Challan dossier modal issued under Rule 55 of CGST Rules 2017. Crucially, you must verify engineering and supply chain invariants:
  - Manifest Reconciliation Invariant: Delivered Goods (5) + In Transit Convoys (15) + Pending Clearance (2) = 22 Total Logged Manifests
  - Outbound Volume Integrity: Cumulative transported volume across manifests = 8,440 Finished Crates
  - Fulfillment Efficiency Formula: (Delivered Goods ÷ Total Manifests) × 100 = (5 ÷ 22) × 100 = 23%
  - Stock Reconciliation Banner Formula: Dispatched − In Transit = Delivered Goods Reconciled
  - Rule 55 CGST Delivery Challan Legal Compliance: Manifest ID formatted (e.g. DSP-F5A75E27), corporate header with GSTIN (27AAACF2920A1ZX), HSN code 3923 for plastic fruit packaging containers, Unit of Measure (NOS), and 3 factory signoff boxes including the official circular Futane Agro Gate Pass Auth Verified seal.

Capture high-resolution screenshots of normal views, active manifest modals, delivery challan dialogues, QR scanner viewports, and responsive viewports.
```

---

## 📋 Complete Logistics & Dispatch Registry Audit & Mutation Test Matrix

### 1. Section 01: Module Header, Financial Badges & Quick Action Controls
- [ ] **Breadcrumb & Title Telemetry:**
  - Verify breadcrumb hierarchy: `Futane Agro ERP / Supply Chain & Logistics / Logistics & Dispatch Registry`.
  - Verify primary module title: `Logistics & Dispatch Registry` with reactive count badge showing total manifests (`22 Manifests`).
  - Verify subtitle: `Outbound finished goods consignments, delivery tracking, vehicle manifests, and gate verification`.
  - Verify reconciliation banner: `Dispatched − In Transit = Delivered`.
- [ ] **Header Action Buttons (Uniform 36px Height):**
  - `Scan QR` Button: Test opening of the hardware camera QR/barcode scanner dialog (`showScannerModal = true`).
  - `Refresh` Button: Test manual sync trigger (`isLoading = true`) -> triggers `loadData()` -> synchronizes manifests from backend and shows success state.
  - `CSV` Export Button: Test export of dispatch registry to `.csv` format.
  - `Excel` Export Button: Test XLSX workbook generation with vehicle registration numbers, driver assignments, consignee names, and delivery status.
  - `+ Create Manifest` Button: Test opening/closing of the centered modal dialog (`isFormOpen = true`).

---

### 2. Section 02: 4-Stage Subnav Filter Tabs
- [ ] **All Manifests Tab (`.subnav-tab-btn:nth-child(1)`):**
  - Displays count badge `22`.
  - Displays all registered outbound consignments regardless of journey status.
- [ ] **In Transit Tab (`.subnav-tab-btn:nth-child(2)`):**
  - Displays count badge `15` with info/blue pill styling.
  - Filters active highway convoys currently on delivery routes.
- [ ] **Delivered Tab (`.subnav-tab-btn:nth-child(3)`):**
  - Displays count badge `5` with success/green pill styling.
  - Filters gate-verified completed delivery receipts.
- [ ] **Pending Clearance Tab (`.subnav-tab-btn:nth-child(4)`):**
  - Displays count badge `2` with warning/amber pill styling.
  - Filters staged consignments requiring dock loading or gate security sign-off.

---

### 3. Section 03: Executive Telemetry KPI Grid (5 Metrics Strip)
- [ ] **KPI 1: Total Manifests (`.dispatch-kpi-card:nth-child(1)`):**
  - Value: `22` (All Logged Consignments).
- [ ] **KPI 2: Delivered Goods (`.dispatch-kpi-card:nth-child(2)`):**
  - Value: `5` (Gate Verified Receipts).
- [ ] **KPI 3: In Transit (`.dispatch-kpi-card:nth-child(3)`):**
  - Value: `15` (Active Highway Convoys).
- [ ] **KPI 4: Pending Clearance (`.dispatch-kpi-card:nth-child(4)`):**
  - Value: `2` (Dock loading required).
  - Highlights with alert state when pending count > 0.
- [ ] **KPI 5: Fulfillment Rate & Volume (`.dispatch-kpi-card:nth-child(5)`):**
  - Value: `23%` fulfillment rate with dynamic progress bar.
  - Subtitle: `8,440 crates transported`.

---

### 4. Section 04: Search & Multi-Filter Toolbar
- [ ] **Search & Table Controls:**
  - Real-time search query input filtering by vehicle number (e.g. MH-27-TR-4567), driver name (e.g. Ganesh Patil), consignee/customer name, or manifest ID.
  - Density Switcher: `compact`, `comfortable`, `spacious`.
  - Column Manager Dropdown: Toggles visibility for Manifest ID, Consignee & Order, Date, Vehicle, Driver, Destination, Status, Actions.
  - Consolidated Export Menu: Dedicated dropdown providing CSV and Excel export actions.

---

### 5. Section 05: Create Dispatch Manifest Centered Modal Dialog (`isFormOpen = true`)
- [ ] **Manifest Form Fields & Mechanics:**
  - Centered modal dialog with backdrop overlay.
  - Customer Sales Order searchable dropdown with live QR scanner trigger button.
  - Dispatch Date picker (defaults to current date).
  - Vehicle Registration Number input (e.g. `MH-12-RN-4819`).
  - Assigned Driver input with full personnel name.
  - Delivery Destination Address text area.
  - Consignment Status selector: `Pending (Staged for Loading)`, `In Transit`, `Delivered`.
  - Actions: `Create Dispatch Manifest` and `Close Form` (via top-right action icon or backdrop).

---

### 6. Section 06: Official Rule 55 Delivery Challan & Dispatch Dossier Modal (`showDispatchDossierModal = true`)
- [ ] **Challan Sheet Layout & Legal Compliance:**
  - Header: `Consignment Outward & Delivery Challan`, reactive subtitle with formatted Manifest ID (`DSP-F5A75E27 • Gate Pass Verified`), and `Print Challan` action button.
  - Formal Corporate Letterhead: Futane Agro Industries Pvt. Ltd., Industrial Packaging & Agricultural Crates Manufacturing Division, Gate No 144 Hadapsar Industrial Area, Pune - 411028, GSTIN: `27AAACF2920A1ZX`, State: 27 (Maharashtra).
  - Legal Badge: `DELIVERY CHALLAN • Rule 55 - CGST Rules 2017`.
  - Telemetry Meta Grid: Dispatch Date (`22/08/2026`), Vehicle Number (`MH-27-TR-4567`), Assigned Driver (`Ganesh Patil`), Consignment Status (`Dispatched`).
  - Consignee & Order Reference: Consignee name (`Ramesh Kumar`), destination address, and linked Sales Order Reference (`Order #0598e4d0-955c-41a8-8b80-862fa06dfade`).
  - Itemized Consignment Table: Item 01, Crate Description (`Pomegranate Super-Red Crate (5kg)`), HSN Code `3923`, Unit of Measure `NOS (Pieces)`, Dispatched Qty (`420`).
  - Signatures & Corporate Seal:
    1. `Dispatched By (Logistics In-Charge)` signature line
    2. `Driver's Acknowledgement` signature line
    3. `Authorized Security Signatory` with official circular `FUTANE AGRO GATE PASS AUTH VERIFIED` graphic seal.
  - Legal Footnote: Statement confirming issuance under Rule 55 of CGST Rules 2017 without tax invoice.

---

### 7. Section 07: Hardware QR / Barcode Scanner Modal (`showScannerModal = true`)
- [ ] **Camera Viewfinder & Hardware Integration:**
  - Centered glass panel overlay with orange glowing scanner border.
  - Live video preview element (`<video #videoPreview>`) with dashed crate bounding box target.
  - Subtitle: `Point your device camera at the crate QR code to auto-populate dispatch details`.
  - Actions: `Cancel Scanner` button and top-right close icon.

---

## 📊 Empirical Test Evidence & Validation Baseline

| Metric / Checkpoint | Expected Baseline | Empirical Verified Value | Status |
| :--- | :--- | :--- | :--- |
| **Total Logged Manifests** | 22 manifests | **`22 Manifests`** |  **VERIFIED** |
| **Delivered Goods** | 5 manifests | **`5 Manifests`** |  **VERIFIED** |
| **In Transit Convoys** | 15 manifests | **`15 Manifests`** |  **VERIFIED** |
| **Pending Clearance** | 2 manifests | **`2 Manifests`** |  **VERIFIED** |
| **Operational Invariant** | Delivered + In Transit + Pending = Total | **`5 + 15 + 2 = 22`** |  **PERFECT BALANCE** |
| **Transported Volume** | 8,440 crates | **`8,440 Crates`** |  **VERIFIED** |
| **Fulfillment Rate** | (5 ÷ 22) × 100 | **`23%`** |  **VERIFIED** |
| **Backend REST Endpoint** | `GET /api/dispatches` | **HTTP 200 OK (22 records)** |  **VERIFIED** |
| **Create Manifest Modal** | Centered dialog with form controls | **Passed** |  **VERIFIED** |
| **Rule 55 Delivery Challan** | Official printable legal layout with seal | **Passed** |  **VERIFIED** |
| **QR Code Scanner Modal** | Camera viewfinder with target box | **Passed** |  **VERIFIED** |
| **Viewport Responsiveness** | 1440x900, 1280x720, 1100x680, Sidebar 68px | **No horizontal blowout** |  **VERIFIED** |

---

## 📸 Generated Visual Evidence Artifacts

The following 14 high-resolution screenshot artifacts were captured and verified during Playwright headless execution:

1. `01_dispatch_registry_viewport.png` — Executive logistics overview at 1440x900 viewport showing 22 manifests
2. `02_dispatch_registry_fullpage.png` — Full-page scrollable layout including complete 22-manifest data table
3. `03_subtab_in_transit.png` — Subtab filtered to 15 active highway convoys
4. `04_subtab_delivered.png` — Subtab filtered to 5 gate-verified completed deliveries
5. `05_subtab_pending_clearance.png` — Subtab filtered to 2 staged consignments requiring dock clearance
6. `06_columns_config_dropdown.png` — Columns manager dropdown managing all 8 table columns
7. `07_export_menu_dropdown.png` — Consolidated export menu offering CSV and Excel formats
8. `08_create_manifest_modal.png` — Create Dispatch Manifest centered modal dialog with customer selector
9. `09_delivery_challan_dossier_modal.png` — Official Rule 55 Delivery Challan printable dossier with corporate seal
10. `10_qr_scanner_modal.png` — Hardware QR/barcode camera scanner modal with viewfinder target
11. `11_density_compact.png` — High-density data view mode for intensive dispatch operations
12. `12_laptop_1280x720.png` — Standard 1280x720 laptop viewport validation
13. `13_compact_1100x680.png` — Compact desktop 1100x680 layout validation
14. `14_sidebar_collapsed_dispatch.png` — Collapsed 68px sidebar mode giving maximum table workspace
