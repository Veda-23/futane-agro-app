# ==============================================================================
# MASTER DIRECTIVE: UNIVERSAL POP CARD & MODAL DYNAMIC SIZING, WORKSPACE 
# CENTERING, ANTI-COLLISION & MULTI-VIEWPORT RESPONSIVENESS (FUTANE AGRO ERP)
# ==============================================================================

> **Document Version:** 3.0.0  
> **Target Application:** Futane Agro ERP (Precision Manufacturing, Supply Chain & Accounting)  
> **Scope:** ALL 19 Modules, 11 Settings Domains, Modals, Pop Cards, Drawers, Vouchers & Confirmation Dialogs  
> **Environment:** Angular 17 Enterprise Frontend + Spring Boot Java Backend Runtime  
> **Hardware Constraint:** Windows 11 Laptop with 8 GB Total System RAM Contract  

---

## 1. MISSION STATEMENT & OBJECTIVE
Standardize and enforce a unified, mathematically robust, fluidly responsive **Dynamic Pop Card Engine** across EVERY popup dialog, modal card, drawer, and voucher in the Futane Agro ERP platform.

Eliminate all visual regression defects:
- ❌ **Zero Right-Edge Sticking:** Pop cards must never be pushed to the right edge of the screen or collide with window borders.
- ❌ **Zero Large Void Asymmetry:** Pop cards must never leave a huge empty gap on the left while crowding the right.
- ❌ **Zero Action Button Fold Clipping:** Form action buttons (`Save`, `Update`, `Submit`, `Confirm`, `Cancel`) must NEVER be clipped below the bottom fold.
- ❌ **Zero Hardcoded Width Breakage:** Dialogs must fluidly adapt to standard desktop (1440×900), laptops (1366×768), low-height displays (1280×664), high-DPI scaling (125% / 150%), and mobile/tablet rail views.

---

## 2. POP CARD ARCHETYPES & MODULE COVERAGE (ALL 19 MODULES)
Every dialog in the ERP is governed by this standard across all modules:

1. **Sales & Commercial Orders:** Create Outward Form, View Dossier Modal, Dispatch Manifest Dialog.
2. **Logistics & Dispatch:** Generate Waybill Dialog, Vehicle Assignment Modal, Proof of Delivery Card.
3. **Transport Fleet & Rentals:** Add Transporter Modal, Vehicle Rate Matrix Pop Card, Driver Allocation.
4. **Driver Management:** Onboard Driver Modal, License Verification Card, Duty Assignment.
5. **Party & Customer Registry:** Register Party Modal, Edit Customer Pop Card, Ledger Balance Adjustment, KYC Dossier.
6. **Payment Registry & Collections:** Record Receipt Voucher, Payment Voucher Modal, Settlement Allocation Dialog.
7. **Tax Invoices & Credit Notes:** Generate Tax Invoice Modal, E-Way Bill Drawer, Payment Link Pop Card.
8. **Billing Hub & Print Center:** Batch Staging Modal, Thermal Challan Dialog, Universal Importer Modal.
9. **Bank & Cash Ledgers:** Add Bank Account Modal, Reconcile Transaction Pop Card, UPI QR Gateway Modal.
10. **Operating Expense Registry:** Record Voucher Modal, Expense Category Manager Pop Card.
11. **Daily Production Log:** Add Batch Run Modal, Shift Production Card, Output Rejection Dialog.
12. **Monthly Production Aggregate:** Monthly Summary Modal, Machine Target Allocation Pop Card.
13. **Raw Material Stock:** GRN Receipt Voucher Dialog, Raw Material Intake Card, Stock Adjustment Modal.
14. **Finished Goods Inventory:** Stock Adjustment Modal, Batch Transfer Card, Lot History Inspector.
15. **Employee Management:** Onboard Staff Modal, Department Mapping Card, Shift Schedule Dialog.
16. **Salary & Payroll Ledgers:** Generate Salary Slip Modal, Advance Voucher Card, Deduction Dialog.
17. **Reports & Export Engine:** Custom SQL Modal, Export Schedule Pop Card, PDF Preview Dialog.
18. **Security Audit Logs:** Inspect IP Trail Drawer, Event Detail Card, Forensic Filter Dialog.
19. **Settings & Admin Control Center (All 11 Domains):**
    - Subtab 01: 200+ Customizations Hub (Import/Export Config Modals)
    - Subtab 02: Branding & Themes (Logo Upload & Palette Pickers)
    - Subtab 03: Business Rules & Invoicing (Add Legal Entity Modal, Add Bank Account Modal)
    - Subtab 04: Teams & Depts (Add/Edit Department Modal)
    - Subtab 05: Extensible Custom Fields (Add/Edit Dynamic Schema Field Modal)
    - Subtab 06: WhatsApp & Alerts (Notification Template Editor Modal)
    - Subtab 07: Users Directory & RBAC (Invite User, Edit User, 19-Module Access Matrix Dialog)
    - Subtab 08: Feature Flags (Flag Detail Inspector, Configuration Overrides Modal)
    - Subtab 09: Developer Hub (Generate API Key Modal, Register Webhook Modal, Secret Reveal Dialog)
    - Subtab 10: System Telemetry & Governance (Database Restore Confirmation Dialog)
    - Subtab 11: Security & Master Password (Master Password Strength & Challenge Modal)

---

## 3. MATHEMATICAL SPECIFICATION: DYNAMIC SIZING & CENTERING ENGINE

### A. Dynamic Fluid Width Rule
Dialogs must NEVER enforce a rigid, static pixel width that overflows the viewport or collides with the sidebar. Dialogs must use CSS `clamp()` and `min()` with an explicit safety margin:

$$\text{Max Allowed Width} = \min(\text{Target Width}, \text{Viewport Width} - \text{Sidebar Width} - 32\text{px})$$

```scss
/* Archetype 1: Standard Configuration & Form Modals */
.modal-content,
.dept-modal-content,
.cf-modal-dialog,
.notif-modal-dialog,
.sec-confirm-modal,
.restore-modal-content,
.modal-dialog-custom {
  width: clamp(320px, 92vw, 640px) !important;
  max-width: calc(100vw - var(--sidebar-effective-width, 240px) - 32px) !important;
}

/* Archetype 2: Wide Modals, Vouchers & Dossiers */
.modal-large,
.modal-content.modal-large,
.party-modal-dialog,
.payments-modal-dialog,
.production-modal-dialog,
.voucher-modal-dialog,
.grn-voucher-dialog,
.outward-modal-dialog {
  width: clamp(320px, 94vw, 840px) !important;
  max-width: calc(100vw - var(--sidebar-effective-width, 240px) - 32px) !important;
}

/* Archetype 3: Compact Confirmation & Security Alerts */
.modal-small,
.sec-confirm-modal,
.restore-modal-content {
  width: clamp(280px, 88vw, 440px) !important;
  max-width: calc(100vw - var(--sidebar-effective-width, 240px) - 32px) !important;
}
```

### B. Vertical Anti-Clipping & Scrollable Body Clamping Rule
To guarantee that action buttons (`Save`, `Update`, `Submit`, `Cancel`) are **ALWAYS visible above the fold**:

```scss
/* Clamped Maximum Height */
max-height: min(calc(100dvh - 80px), 820px) !important;

/* Pinned Header & Footer */
.modal-header,
.cf-modal-header,
.notif-modal-header,
.sec-modal-header,
.dept-modal-header,
.form-header-banner {
  flex-shrink: 0 !important;
}

.modal-footer,
.cf-modal-footer,
.notif-modal-footer,
.sec-modal-footer,
.dept-modal-footer,
.form-action-footer {
  flex-shrink: 0 !important;
}

/* Scrollable Form Body */
.modal-body,
.cf-modal-body,
.notif-modal-body,
.sec-modal-body,
.dept-modal-body,
.party-modal-scroll-body,
.production-modal-scroll-body {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  max-height: calc(100dvh - 220px) !important;
  overflow-y: auto !important;
  overscroll-behavior: contain !important;
}
```

### C. Workspace Centering & Edge Clearance Formula
To guarantee exact mathematical centering in the workspace between the sidebar rail and the right viewport boundary:

$$\text{Workspace Center X} = \text{Sidebar Width} + \frac{\text{Viewport Width} - \text{Sidebar Width}}{2} = \frac{\text{Viewport Width} + \text{Sidebar Width}}{2}$$

$$\text{Left Margin} = \text{Right Margin} = \frac{\text{Viewport Width} - \text{Sidebar Width} - \text{Dialog Width}}{2}$$

- **Sidebar Open (240px):**
  Backdrop padding: `padding-left: calc(var(--sidebar-width, 240px) + clamp(12px, 2vw, 24px)) !important; padding-right: clamp(12px, 2vw, 24px) !important;`
- **Sidebar Collapsed (68px):**
  Backdrop padding: `padding-left: calc(var(--sidebar-collapsed-width, 68px) + clamp(12px, 2vw, 24px)) !important; padding-right: clamp(12px, 2vw, 24px) !important;`
- **Sidebar Closed / Mobile (0px):**
  Backdrop padding: `padding-left: clamp(12px, 2vw, 24px) !important; padding-right: clamp(12px, 2vw, 24px) !important;`
- **Anti-Edge Collision Guarantee:**
  If the viewport width is constrained (e.g. 1280px laptop with 125% zoom), the dialog automatically contracts via `max-width: calc(100vw - var(--sidebar-effective-width, 240px) - 32px)`, ensuring at least a **16px minimum safety gap** on both sides with **zero right-edge clipping**.

---

## 4. INPUT TYPOGRAPHY & ICON HYGIENE
1. Input Icons (Search, Key, Building, Calendar, Currency):
   Must enforce `padding-left: 38px !important;` on all input elements with leading icons.
2. Icon Glyph Integrity:
   All icons must map to valid Bootstrap icons (`bi-*`) with zero broken unicode boxes.
3. WCAG AA Contrast:
   Dark theme (`body.dark-theme`) backgrounds must use `#0f172a` / `#1e293b` with high-contrast text (`#f8fafc`) meeting WCAG AA ratio $\ge 4.5:1$.

---

## 5. HARDWARE PERFORMANCE CONTRACT (WINDOWS 11, 8 GB RAM)
- Host Environment: Windows 11 with 8 GB total system RAM.
- Node V8 Heap Limit: Bound at `--max-old-space-size=1536`.
- Spring Boot Heap Limit: Bound at `-Xms256m -Xmx512m` on port 8081.
- No Orphaned Headless Processes: All Playwright Chromium workers must be immediately destroyed after testing.
- Core Financial Invariant: NEVER modify GST calculation rules, tax invoice numbering, or financial ledger tables.
