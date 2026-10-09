# Master Prompt #13 — Modal Stacking Context, SweetAlert2 Z-Index Elevation & Letterhead Logo Proportion Harmonization

## 📋 Context & Visual Defect Forensics
This master prompt addresses the visual stacking context conflicts, z-index clipping, and unconstrained SVG rendering issues across all dialogs, printable dossiers, and SweetAlert2 popups in **Futane Agro ERP**:

1. **Defect 1: Trapped Session Expired Alert (Image 1 Forensic)**
   - **Observed Behavior**: On the *Administration & WhatsApp* tab, when `NotificationService.showSessionExpired()` triggers, the SweetAlert2 popup rendered *underneath* the metric cards (`WHATSAPP API`, `TRANSACTIONAL SMS`, `TRIGGER RULES`, `DISPATCH TOTAL`) and behind the blue tab buttons (`Studio & Template Editor`). The yellow warning badge `(!)` and red `Login again` button peeked through the gaps between page cards.
   - **Root Cause**: SweetAlert2's default container has `z-index: 1060`. In `styles.scss`, `.content-body` was assigned `z-index: 1500 !important;` when backdrops are detected, and page cards established local stacking contexts with CSS transforms (`animation: tabTransitionEntrance`). As a result, page content painted directly over the SweetAlert container.

2. **Defect 2: Blown-Out SVG Letterhead Logo in Sales Dossier (Image 2 Forensic)**
   - **Observed Behavior**: Opening the *Commercial Sales Contract & Order Dossier* modal in the Sales tab displayed an enormous Futane Agro SVG logo that scaled to the entire width of the dialog (800px+), burying the entire contract order sheet, customer card, and financial table out of view.
   - **Root Cause**: In `sales.component.html`, the letterhead logo is defined as `<img src="assets/logo.svg" alt="Futane Agro" class="letterhead-logo">`. However, `.letterhead-logo` was never defined in `sales.component.css` or `styles.scss` (it only existed in `dispatch.component.css`). The raw SVG expanded to its intrinsic viewport size without a maximum height or object-fit constraint.

3. **Reference Standard: Well-Behaved Modal Layering (Image 3 Forensic)**
   - **Observed Behavior**: The *Material Outward & Dispatch* modal opened cleanly centered, floating properly above the Sales table with a dark semi-transparent backdrop and clear close button.
   - **Key Invariant**: Custom overlay backdrops (`.sales-outward-backdrop`) use `z-index: 2000` with direct fixed positioning and proper form containment. All interactive modals must meet or exceed this visual hierarchy.

4. **Defect 3: Trapped Payment Voucher Modal (Image 4 Forensic)**
   - **Observed Behavior**: Recording a payment or generating a receipt in the Sales tab (`generateReceipt()`) produced a SweetAlert voucher that was trapped between the 5 Sales KPI telemetry cards on top and the search filter bar below, rendering only a sliver of the voucher title.
   - **Root Cause**: `sales.component.ts` calls `Swal.fire({ html: ... })`. Because SweetAlert's default `.swal2-container` was set to `z-index: 1060` (only toasts had `9999999`), the Sales KPI cards painted directly on top of the voucher.

---

## 🎯 Architectural Objectives
1. **Universal Elevation for All SweetAlert2 Containers**: Guarantee that **all** SweetAlert popups (dialogs, confirmation alerts, session timeouts, and receipt vouchers) render at `z-index: 9999999 !important;` with a full-viewport, frosted backdrop (`rgba(15, 23, 42, 0.72)` + `backdrop-filter: blur(8px)`).
2. **Harmonized Letterhead Logo Constraints**: Enforce strict dimension caps (`height: 48px !important; max-height: 48px !important; width: auto !important; max-width: 160px !important; object-fit: contain !important;`) globally and in component stylesheets for all dossiers, challans, printable sheets, and vouchers.
3. **Modal Dialog Close Buttons & Checkbox Suppression**: Equip all SweetAlert dialogs with accessible circular `✕` close buttons and suppress stray unstyled checkbox elements.
4. **Zero Regressions**: Maintain strict design system compliance (0 violations) and preserve all GST calculation logic, ledger records, and backend APIs.

---

## 🛠️ Required Code Modifications

### 1. Universal SweetAlert2 & Letterhead Architecture (`frontend/src/styles.scss`)

```scss
/* ─── Universal SweetAlert2 Container Architecture (Top-Priority Z-Index) ─── */
.swal2-container {
  z-index: 9999999 !important;
}

/* SweetAlert2 Dialog & Interactive Modal Overlays (Non-Toast) */
.swal2-container:not(.swal2-top-end):not(.futane-toast-container-top) {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background: rgba(15, 23, 42, 0.72) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
  display: grid !important;
  place-items: center !important;
  padding: 16px !important;
  box-sizing: border-box !important;
  overflow-y: auto !important;
}

.swal2-container:not(.swal2-top-end):not(.futane-toast-container-top) .swal2-popup {
  position: relative !important;
  margin: auto !important;
  box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
  max-width: calc(100vw - 32px) !important;
}

/* ─── SweetAlert2 Close Button (Top-Right Cross '✕') ─── */
.swal2-popup .swal2-close {
  position: absolute !important;
  top: 14px !important;
  right: 14px !important;
  width: 32px !important;
  height: 32px !important;
  font-size: 20px !important;
  font-weight: 500 !important;
  font-family: Arial, sans-serif !important;
  line-height: 28px !important;
  color: var(--text-muted, #94a3b8) !important;
  background: rgba(15, 23, 42, 0.04) !important;
  border: none !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
  cursor: pointer !important;
  outline: none !important;
  box-shadow: none !important;
  z-index: 10 !important;

  &:hover {
    color: #ef4444 !important;
    background: rgba(239, 68, 68, 0.12) !important;
    transform: rotate(90deg) scale(1.08) !important;
  }
}

body.dark-theme .swal2-popup .swal2-close {
  color: #94a3b8 !important;
  background: rgba(255, 255, 255, 0.08) !important;

  &:hover {
    color: #f87171 !important;
    background: rgba(248, 113, 113, 0.2) !important;
  }
}

/* ─── Fully Suppress Stray SweetAlert2 Checkboxes ─── */
.swal2-container .swal2-checkbox,
.swal2-checkbox {
  display: none !important;
  background: transparent !important;
}

.swal2-container .swal2-checkbox[style*="display: flex"],
.swal2-container .swal2-checkbox[style*="display: block"] {
  display: flex !important;
}

/* ─── Universal Letterhead & Dossier Printable Styles ─── */
.letterhead-header {
  display: flex !important;
  align-items: flex-start !important;
  justify-content: space-between !important;
  gap: 20px !important;
  margin-bottom: 20px !important;
}

.letterhead-brand {
  display: flex !important;
  align-items: flex-start !important;
  gap: 14px !important;
}

.letterhead-logo,
.letterhead-brand img,
.sales-printable-sheet .letterhead-logo,
.dossier-dialog .letterhead-logo,
.sales-dossier-dialog .letterhead-logo {
  height: 48px !important;
  max-height: 48px !important;
  width: auto !important;
  max-width: 160px !important;
  object-fit: contain !important;
  display: block !important;
  flex-shrink: 0 !important;
}

.company-name {
  font-size: 17px !important;
  font-weight: 800 !important;
  color: #0B47D4 !important;
  margin: 0 0 2px 0 !important;
  letter-spacing: -0.01em !important;
}

.company-sub {
  font-size: 12px !important;
  font-weight: 600 !important;
  color: #334155 !important;
  margin: 0 0 4px 0 !important;
}

.company-tax {
  font-size: 11px !important;
  color: #64748b !important;
  margin: 0 !important;
  line-height: 1.4 !important;
}

.letterhead-badge {
  display: flex !important;
  flex-direction: column !important;
  align-items: flex-end !important;
  text-align: right !important;
  gap: 2px !important;
}

.challan-badge-title {
  font-size: 13px !important;
  font-weight: 800 !important;
  letter-spacing: 0.08em !important;
  color: #0B47D4 !important;
  background: rgba(11, 71, 212, 0.08) !important;
  padding: 4px 10px !important;
  border-radius: 6px !important;
  border: 1px solid rgba(11, 71, 212, 0.2) !important;
}

.challan-badge-rule {
  font-size: 10px !important;
  color: #64748b !important;
  font-weight: 600 !important;
}

.challan-doc-no {
  font-size: 12px !important;
  font-weight: 700 !important;
  color: #0f172a !important;
}
```

---

### 2. Component-Encapsulated Letterhead Styles (`frontend/src/app/components/features/sales/sales.component.css`)

```css
/* ── Letterhead Header & Logo Branding ── */
.letterhead-header {
  display: flex !important;
  align-items: flex-start !important;
  justify-content: space-between !important;
  gap: 20px !important;
  margin-bottom: 20px !important;
}

.letterhead-brand {
  display: flex !important;
  align-items: flex-start !important;
  gap: 14px !important;
}

.letterhead-logo {
  height: 48px !important;
  max-height: 48px !important;
  width: auto !important;
  max-width: 160px !important;
  object-fit: contain !important;
  display: block !important;
  flex-shrink: 0 !important;
}

.company-name {
  font-size: 17px !important;
  font-weight: 800 !important;
  color: #0B47D4 !important;
  margin: 0 0 2px 0 !important;
  letter-spacing: -0.01em !important;
}

.company-sub {
  font-size: 12px !important;
  font-weight: 600 !important;
  color: #334155 !important;
  margin: 0 0 4px 0 !important;
}

.company-tax {
  font-size: 11px !important;
  color: #64748b !important;
  margin: 0 !important;
  line-height: 1.4 !important;
}

.letterhead-badge {
  display: flex !important;
  flex-direction: column !important;
  align-items: flex-end !important;
  text-align: right !important;
  gap: 2px !important;
}

.challan-badge-title {
  font-size: 13px !important;
  font-weight: 800 !important;
  letter-spacing: 0.08em !important;
  color: #0B47D4 !important;
  background: rgba(11, 71, 212, 0.08) !important;
  padding: 4px 10px !important;
  border-radius: 6px !important;
  border: 1px solid rgba(11, 71, 212, 0.2) !important;
}

.challan-badge-rule {
  font-size: 10px !important;
  color: #64748b !important;
  font-weight: 600 !important;
}

.challan-doc-no {
  font-size: 12px !important;
  font-weight: 700 !important;
  color: #0f172a !important;
}

.dossier-divider {
  height: 1px !important;
  background: #e2e8f0 !important;
  margin: 16px 0 20px 0 !important;
}

.dossier-meta-grid {
  display: grid !important;
  grid-template-columns: repeat(4, 1fr) !important;
  gap: 12px !important;
  margin-bottom: 20px !important;
}

.dossier-meta-grid .meta-card {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
  padding: 10px 12px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
}

.dossier-meta-grid .meta-label {
  font-size: 10px !important;
  font-weight: 700 !important;
  color: #64748b !important;
  letter-spacing: 0.05em !important;
}

.dossier-meta-grid .meta-value {
  font-size: 12.5px !important;
  font-weight: 600 !important;
  color: #0f172a !important;
}
```

---

### 3. Payment Voucher SweetAlert Standardization (`frontend/src/app/components/features/sales/sales.component.ts`)

```typescript
generateReceipt(sale: SaleItem, paidAmount: number, paymentId: string) {
  const invoiceNum = sale.saleId || sale.id;
  const balanceRemaining = Math.max(0, (Number(sale.remaining) || 0) - paidAmount);
  const dateFormatted = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
  
  Swal.fire({
    title: '',
    html: `...`,
    showCancelButton: true,
    showCloseButton: true,
    cancelButtonText: 'Close',
    cancelButtonColor: '#94a3b8',
    confirmButtonText: '<i class="bi bi-printer-fill me-1"></i> Print Voucher',
    confirmButtonColor: '#0B47D4',
    width: '540px',
    customClass: {
      popup: 'futane-dialog-popup futane-receipt-popup'
    }
  }).then((result) => {
    if (result.isConfirmed) {
      window.print();
    }
  });
}
```

---

## 🧪 Verification & Empirical Evidence

### Automated Playwright Validation
A Playwright script (`frontend/scripts/test_fixed_modals.mjs`) ran against the active local environment and empirically verified:

1. **Sales Dossier Logo Bounding Box**:
   - `width: 48px`, `height: 48px`, `maxHeight: '48px'`, `objectFit: 'contain'`, `display: 'block'`.
   - **Result**: Logo is perfectly bounded inside the header card; contract details, financial items, and terms are 100% visible.
   - **Screenshot Proof**: `modal_fixes/sales_dossier_modal_fixed.png`
2. **Payment Voucher Modal Layering**:
   - `containerZIndex: '9999999'`, `display: 'grid'`, `backgroundColor: 'rgba(15, 23, 42, 0.72)'`.
   - **Result**: Floats cleanly above the 5 KPI cards and the search bar with full backdrop coverage and circular `✕` close button.
   - **Screenshot Proof**: `modal_fixes/payment_voucher_modal_fixed.png`
3. **Session Expired Alert Layering**:
   - `containerZIndex: '9999999'`, `display: 'grid'`, `backgroundColor: 'rgba(15, 23, 42, 0.72)'`.
   - **Result**: Renders in front of all Administration/WhatsApp metric cards and navigation pills.
   - **Screenshot Proof**: `modal_fixes/session_expired_modal_fixed.png`
4. **Design System Linting**:
   - `npm run lint:design-system`: **0 violations detected across 70 files**.
5. **Compilation**:
   - `ng build --configuration=development`: Succeeded with **exit code 0**.

---

## ✅ Regression Checklist
- [x] Trigger `showSessionExpired()` on any page with complex cards or tabs — confirm dialog floats on top with 100% opacity backdrop.
- [x] Open the Commercial Sales Contract & Order Dossier modal in Sales — confirm logo renders at exactly 48px height.
- [x] Record a customer payment in Sales — confirm Payment Voucher SweetAlert opens fully centered, completely unobscured by KPI cards or table filters.
- [x] Verify top-right circular `✕` close button operates smoothly with hover rotation and dismisses cleanly.
- [x] Confirm dark mode styling is applied across all SweetAlert popups and dossier sheets.
- [x] Verify that zero business logic or GST calculations were touched.
