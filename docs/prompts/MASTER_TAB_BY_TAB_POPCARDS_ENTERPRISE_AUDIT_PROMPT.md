# MASTER TAB-BY-TAB POP CARDS & MODALS ENTERPRISE AUDIT DIRECTIVE
**Repository:** Futane Agro ERP (`futane-agro-app`)  
**Environment Specification:** Windows 11 Laptop | 8 GB Total Physical RAM | Angular 17.3 + Vite | Node `--max-old-space-size=1536` | Spring Boot 3  
**Audit Standard Parity:** SAP S/4HANA Manufacturing, Oracle NetSuite ERP, Odoo Enterprise  
**Verified Pop Cards Covered:** 31 Modals, Drawers, Vouchers & Dossiers across 17 Modules (100% Empirically Validated)  

---

## 1. Executive Summary & Audit Methodology
Every module in Futane Agro ERP has been audited tab-by-tab using deterministic browser automation (Playwright test runner `frontend/scripts/verify_popcards_and_capture.mjs`). Each pop card, slide-over drawer, printable voucher, and dossier modal has been systematically triggered, verified for empirical geometry, clamped within viewport bounds, tested for 100% solid white backgrounds (`#ffffff !important`, zero opacity or bleed-through regression), and captured in high-resolution PNG format in `scratch/targeted_tabs_audit/`.

### Mandatory Performance & UI Invariants
1. **Solid White Surfaces (`#ffffff !important`):** All dialog containers and interior sheets (`.dossier-body-content`, `.dispatch-printable-sheet`, `.waybill-slip-content`, `.voucher-printable-sheet`, `.audit-modal-content`, `.dept-modal-content`) enforce solid `#ffffff` backgrounds.
2. **Deterministic Animation Settle:** Captures enforce a mandatory settle period (≥ 450ms) after modal activation to guarantee CSS keyframe animations (`@keyframes scaleUp`, `@keyframes modalCenterScaleIn`, `fadeIn`) have completed to 100% opacity.
3. **Clamped Dimensions:** All dialogs enforce `width: clamp(320px, 92vw, 840px) !important` and `max-height: min(calc(100dvh - 80px), 820px) !important`.
4. **Docked Footer Standard:** Every voucher, dossier, and drawer modal includes a docked action toolbar containing both a secondary **Cancel** / **Close** button and a primary **Print** or **Submit** button for effortless keyboard and mouse workflow.
5. **Zero Accounting Bleed:** No GST calculation algorithms, invoice numbering logic, or database transactions have been modified.

---

## 2. Complete Empirical Verification Matrix (31 Pop Cards Across 17 Tabs)

| Index | Tab Name | Pop Card / Modal Title | Dimensions | Alignment | Inputs | Buttons | Verified Screenshot |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **01** | Tab 06: Raw Materials | Log Procurement Batch Drawer | `840x640px` | Centered (0px) | 6 | 7 | [`01_raw_materials_procurement_drawer.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/01_raw_materials_procurement_drawer.png) |
| **02** | Tab 06: Raw Materials | GRN Inspection Voucher Modal | `840x640px` | Clamped / Safe | 0 | 3 | [`02_raw_materials_grn_voucher_modal.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/02_raw_materials_grn_voucher_modal.png) |
| **03** | Tab 04: FG Inventory | Warehouse Stock Adjustment Modal | `640x635px` | Clamped / Safe | 4 | 6 | [`03_inventory_stock_adjustment_modal.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/03_inventory_stock_adjustment_modal.png) |
| **04** | Tab 04: FG Inventory | SKU View Details Drawer | `840x640px` | Centered (0px) | 0 | 8 | [`04_inventory_sku_details_drawer.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/04_inventory_sku_details_drawer.png) |
| **05** | Tab 08: Sales Orders | Material Outward & Dispatch Modal | `840x634px` | Clamped / Safe | 7 | 3 | [`05_sales_material_outward_modal.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/05_sales_material_outward_modal.png) |
| **06** | Tab 08: Sales Orders | Commercial Sales Order Dossier Modal | `840x640px` | Clamped / Safe | 0 | 2 | [`06_sales_order_dossier_modal.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/06_sales_order_dossier_modal.png) |
| **07** | Tab 14: Tax Invoices | GST Tax Invoice Preview Modal | `840x640px` | Clamped / Safe | 0 | 4 | [`07_invoices_tax_invoice_preview_modal.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/07_invoices_tax_invoice_preview_modal.png) |
| **08** | Tab 14: Tax Invoices | Create Tax Invoice Drawer | `640x640px` | Centered (0px) | 6 | 2 | [`08_invoices_create_tax_invoice_drawer.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/08_invoices_create_tax_invoice_drawer.png) |
| **09** | Tab 02: Daily Production | Batch QC Inspection Dossier Modal | `840x640px` | Clamped / Safe | 0 | 4 | [`09_production_qc_dossier_modal.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/09_production_qc_dossier_modal.png) |
| **10** | Tab 02: Daily Production | Add/Edit Production Batch Modal | `780x392px` | Clamped / Safe | 6 | 4 | [`10_production_batch_entry_modal.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/10_production_batch_entry_modal.png) |
| **11** | Tab 05: Machines | Register Machine Unit Drawer | `840x640px` | Centered (0px) | 6 | 3 | [`11_machines_register_drawer.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/11_machines_register_drawer.png) |
| **12** | Tab 05: Machines | Log Breakdown Incident Drawer | `840x640px` | Centered (0px) | 6 | 3 | [`12_machines_breakdown_drawer.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/12_machines_breakdown_drawer.png) |
| **13** | Tab 07: Vendors | Register Supplier Profile Drawer | `520x640px` | Clamped / Safe | 6 | 3 | [`13_vendors_register_drawer.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/13_vendors_register_drawer.png) |
| **14** | Tab 07: Vendors | Supplier Commercial Dossier Modal | `840x550px` | Clamped / Safe | 0 | 4 | [`14_vendors_commercial_dossier_modal.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/14_vendors_commercial_dossier_modal.png) |
| **15** | Tab 09: Dispatch Hub | Create Dispatch Manifest Modal | `840x631px` | Clamped / Safe | 5 | 3 | [`15_dispatch_create_manifest_modal.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/15_dispatch_create_manifest_modal.png) |
| **16** | Tab 09: Dispatch Hub | Gate Pass Clearance & Delivery Challan | `840x640px` | Clamped / Safe | 0 | 4 | [`16_dispatch_gatepass_dossier_modal.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/16_dispatch_gatepass_dossier_modal.png) |
| **17** | Tab 10: Transports | Register Freight Trip Drawer | `640x640px` | Centered (0px) | 6 | 3 | [`17_transports_register_drawer.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/17_transports_register_drawer.png) |
| **18** | Tab 10: Transports | Consignment Waybill & Freight Slip Modal | `840x640px` | Clamped / Safe | 0 | 4 | [`18_transports_waybill_modal.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/18_transports_waybill_modal.png) |
| **19** | Tab 11: Drivers | Enroll Commercial Driver Drawer | `640x626px` | Centered (0px) | 4 | 3 | [`19_drivers_enroll_drawer.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/19_drivers_enroll_drawer.png) |
| **20** | Tab 12: Parties | Register Client Profile Drawer | `840x640px` | Centered (0px) | 7 | 3 | [`20_parties_register_drawer.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/20_parties_register_drawer.png) |
| **21** | Tab 12: Parties | Client Commercial Dossier Modal | `780x662px` | Clamped / Safe | 0 | 4 | [`21_parties_dossier_modal.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/21_parties_dossier_modal.png) |
| **22** | Tab 13: Payments | Official Payment Receipt Voucher Modal | `720x677px` | Clamped / Safe | 0 | 4 | [`22_payments_receipt_voucher_modal.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/22_payments_receipt_voucher_modal.png) |
| **23** | Tab 15: Expenses | Log Expense Voucher Drawer | `840x640px` | Centered (0px) | 6 | 3 | [`23_expenses_register_drawer.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/23_expenses_register_drawer.png) |
| **24** | Tab 15: Expenses | Expense Voucher & Disbursement Slip Modal | `840x640px` | Clamped / Safe | 0 | 4 | [`24_expenses_voucher_modal.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/24_expenses_voucher_modal.png) |
| **25** | Tab 16: Salaries | Create / Edit Salary Voucher Drawer | `640x640px` | Centered (0px) | 4 | 5 | [`25_salaries_disburse_drawer.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/25_salaries_disburse_drawer.png) |
| **26** | Tab 16: Salaries | Staff Salary Payment Voucher Slip Modal | `640x640px` | Clamped / Safe | 0 | 4 | [`26_salaries_voucher_modal.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/26_salaries_voucher_modal.png) |
| **27** | Tab 10b: Employees | Enroll Staff Member Drawer | `640x640px` | Centered (0px) | 8 | 3 | [`27_employees_enroll_drawer.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/27_employees_enroll_drawer.png) |
| **28** | Tab 10b: Employees | View Staff Details Drawer | `840x611px` | Centered (0px) | 0 | 7 | [`28_employees_details_drawer.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/28_employees_details_drawer.png) |
| **29** | Tab 18: Audit Logs | Forensic Event Inspector Modal | `840x521px` | Clamped / Safe | 0 | 4 | [`29_audit_forensic_modal.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/29_audit_forensic_modal.png) |
| **30** | Tab 19: Settings | Department & Operational Unit Modal | `620x626px` | Clamped / Safe | 7 | 10 | [`30_settings_team_modal.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/30_settings_team_modal.png) |
| **31** | Tab 19: Settings | Webhook Delivery & Payload Inspector Modal | `640x626px` | Clamped / Safe | 0 | 6 | [`31_settings_webhook_modal.png`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/scratch/targeted_tabs_audit/31_settings_webhook_modal.png) |

---

## 3. Detailed Component Deep-Dive (Batch 4: Tabs 15, 16, 10b, 18, 19)

### Tab 15: Expenses & Cost Center (`/expenses`)
- **Log Expense Voucher Drawer (`23_expenses_register_drawer.png`):**
  - Triggered via `openDrawer()` or `editExpense(e)`.
  - Fields verified: Voucher Date (`expDate`), Cost Category Select (`expCat`), Amount in ₹ (`expAmt`), Description / Justification Textarea (`expDesc`), Paid By / Beneficiary (`expPaidBy`), and Payment Mode Select (`expMode`).
  - Action footer: Full-width Cancel and Save / Update Voucher buttons.
- **Expense Voucher & Disbursement Slip Modal (`24_expenses_voucher_modal.png`):**
  - Triggered via `openVoucherModal(expense)`.
  - Corporate Header: FUTANE AGRO INDUSTRIES PVT. LTD. logo and address, GSTIN `27AAACF2920A1ZX`, and `#EXP-101` Voucher Ref badge.
  - Data Grid: Voucher Date, Accounting Category, Payment Mode, Paid By.
  - Ledger Table: Numbered line items with accounting particulars, Account Head, and Disbursed Amount in ₹.
  - Verification Seals: Cashier / Clerk signature line, Receiver signature, and Authorized Treasury Manager stamp.
  - Docked Footer: Close and Print Voucher buttons.

### Tab 16: Salaries & Payroll Vouchers (`/salaries`)
- **Create / Edit Salary Voucher Drawer (`25_salaries_disburse_drawer.png`):**
  - Triggered via `openAddDrawer()`.
  - Section 1: Staff Member searchable select, Wage Month (October), Wage Year (2026).
  - Section 2: Salary / Disbursal Amount in ₹ (₹32,000), Payment Status toggle (Paid vs Pending), and Disbursement Date.
  - Action footer: Cancel button and primary "Disburse & Record" button.
- **Staff Salary Payment Voucher Slip Modal (`26_salaries_voucher_modal.png`):**
  - Triggered via `openViewModal(salary)`.
  - Header: Futane Agro Products Pvt. Ltd. letterhead with GSTIN `27AABCF1234F1Z8` and `#VCH-801` voucher reference.
  - Personnel Grid: Staff Member name, Employee ID `#105`, Designation ("Senior IMM Machine Operator"), Wage Cycle, Disbursement Date, and Paid Status badge.
  - Financial Table: Base Wages / Disbursal breakdown and Total Net Disbursed amount (`₹32,000.00`).
  - Signatories: HR & Payroll, Accounts / Finance, and Staff Signature / Receiver.
  - Docked Footer: Close button and Print Slip button.

### Tab 10b: Staff & Workers Directory (`/employees`)
- **Enroll Staff Member Drawer (`27_employees_enroll_drawer.png`):**
  - Triggered via `openAddDrawer()`.
  - Section 1 (Personal & Identity Details): Worker Full Name, Mobile Contact, Residential Address.
  - Section 2 (Employment & Designation): Designation / Operational Role, Date of Joining.
  - Section 3 (Compensation & Monthly Wage): Monthly Base Salary in ₹ (`₹32,000`).
  - Action footer: Secondary Cancel button and primary "Register Staff Member" button.
- **View Staff Details Dossier Drawer (`28_employees_details_drawer.png`):**
  - Triggered via `openDetails(emp)`.
  - Wide drawer header: Avatar monogram circle, `EMP-105` badge, full name, designation, and tenure.
  - Tab Navigation: Profile Overview, Compensation & Terms, Compliance & KYC.
  - Telemetry Metric Cards: Monthly Salary (`₹32,000.00`), Compliance Status (`Verified KYC`), Operational Role, Joining Date.
  - Content Cards: Personnel Contact & Residence detail table.
  - Docked Footer: Close button, Payroll Ledger quick-link button, and "Edit Profile" primary CTA.

### Tab 18: Security Audit & System Telemetry (`/audit-logs`)
- **Forensic Event Inspector Modal (`29_audit_forensic_modal.png`):**
  - Triggered via `openLogDetail(log)`.
  - Header: Event Ref ID, timestamp with precision down to the second.
  - Forensic Metadata Grid: System Actor (`@SUPER_ADMIN` with role badge), Action Classification (`UPDATE`), Target Resource Node (`PRODUCTION_BATCH`), Origin IP Trace (`192.168.1.45`).
  - Raw JSON Codeblock: Syntax-highlighted dark container with quick "Copy Raw" clipboard action.
  - Docked Footer: "Immutable Security Event Node" status indicator, Close Inspector button, and Copy Payload button.

### Tab 19: Organization Settings & Developer Hub (`/settings`)
- **Department & Operational Unit Modal (`30_settings_team_modal.png`):**
  - Triggered via `openAddTeamModal()`.
  - Section 1 (Basic Identification): Department Name and Unique Department Code (`PIM-D1`).
  - Section 2 (Operational Mandate): Scope & Responsibilities multi-line textarea.
  - Section 3 (Visual Identity & Navigation): 7-color hex palette picker with live preview, functional icon select, display order index, and navigation switch toggle card.
  - Action footer: Cancel button and "Save Department" primary CTA.
- **Webhook Delivery & Payload Inspector Modal (`31_settings_webhook_modal.png`):**
  - Triggered via `openWebhookDetailModal(webhook)`.
  - Header: Subscribed stream title, status shield icon.
  - Metadata Grid: Payload Endpoint URL with copy icon, Subscribed Event (`inventory.adjusted`), Delivery Status (`200 OK` in green badge), HMAC Signing Secret with copy icon.
  - HTTP Transmit Box: Outgoing HTTP headers transmitted (`Content-Type`, `X-Futane-Signature`, `User-Agent`).
  - JSON Code Preview: Sample dispatch payload with "Copy JSON" button.
  - Docked Footer: "Send Test Ping (200 OK)" action button and Close Inspector button.

---

## 4. Master Engineering Directives for Turnkey Parity

When implementing or modifying any dialog, modal, drawer, or voucher in Futane Agro ERP, the following mandatory standards apply:

1. **Backdrop & Z-Index Governance:**
   - Overlay backdrop MUST use `rgba(15, 23, 42, 0.72)` with `backdrop-filter: blur(4px)`.
   - Pop card surface MUST have `background: #ffffff !important` with `border: 1px solid var(--border-card, #e2e8f0)`.
   - Z-index hierarchy: Backdrop at `z-index: 2000`, dialog body at `z-index: 2005`.

2. **Responsive Clamping & Overflow:**
   - Dialog width MUST be bounded by `width: clamp(320px, 92vw, 840px) !important`.
   - Max height MUST NOT exceed `min(calc(100dvh - 80px), 820px)`.
   - Inner content body MUST declare `overflow-y: auto; flex: 1;`.

3. **Action Toolbar Pinning:**
   - Footers MUST be pinned (`flex-shrink: 0`, `position: sticky`, `bottom: 0`, `background: #ffffff`).
   - Every dialog MUST provide at least one secondary cancel/close control and one distinct primary action control.
