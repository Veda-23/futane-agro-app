# MASTER ARCHITECTURAL DIRECTIVE & DESIGN PROMPT
## Universal A4 Document & Invoice Preview Engine Standard

> **Directive Reference**: `ERP-INVOICE-PREVIEW-BLUEPRINT-2026-V1`  
> **Status**: Enforced across **Futane Agro Manufacturing ERP**  
> **Reference Components**:  
> - `BillingHubComponent` (`frontend/src/app/components/features/billing-hub/`)  
> - `SettingsComponent` Invoice Customizer (`frontend/src/app/components/features/settings/`)  
> **Target Alignment**: All A4 Printable Views, PDF Export Engines, Proforma Invoices, Delivery Challans, and Payment Receipts.

---

## 1. Problem Statement & Root Cause Analysis

Previous iterations suffered from three critical systemic failures:

1. **Horizontal Viewport Clipping & Data-Loss on Standard Laptop Displays (1366×768 / 1440×900)**:
   - Fixed 210mm (794px) A4 paper sheets placed within flex containers using `justify-content: center` caused negative overflow. In CSS, modern browsers cannot scroll into negative overflow (`scrollLeft < 0`), permanently hiding the leftmost columns (`#`, `Item Description`, Company Logo, and Seller GSTIN).
   - In addition, using `transform: scale(0.85)` scaled only the visual painting box while leaving the layout bounding box at 794px width, generating artificial horizontal scrollbars and clipping right-hand total columns.
   - Unconstrained table cells without `table-layout: fixed` allowed long product descriptions to push numeric currency columns (`Rate`, `CGST`, `SGST`, `Amount`) off the right edge of the page.

2. **Template Configuration Desynchronization (Ghost Settings)**:
   - The Invoice Customizer in `Settings & Admin` maintained controls for:
     - *Terms & Conditions (One per line)*
     - *Footer Greeting / Note*
     - *Bank Details Visibility Toggle*
     - *UPI QR Code Visibility Toggle*
     - *Company Logo Visibility Toggle*
     - *HSN Summary Breakup Visibility Toggle*
   - However, the `BillingHubComponent` preview sheet was completely decoupled, displaying hardcoded terms and static tables that ignored user customizer settings.

3. **Statutory Tax Accrual Mathematical Inaccuracy**:
   - Tax columns in some preview sheets computed CGST and SGST directly on the gross invoice amount (`Total * 0.09` yielding `₹7,359.66`), rather than computing 9% on the statutory taxable base (`Taxable * 0.09` yielding `₹6,237.00`). This violated legal GST compliance guidelines and created discrepancies with financial ledger totals.

---

## 2. Canonical 6-Tier Invoice Anatomy

Every printable document sheet in the ERP MUST adhere to this exact 6-tier architecture:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TIER 1: STATUTORY LETTERHEAD & DUAL-BRAND HEADER                                                       │
│ ├── LEFT: Dynamic Logo (toggleable) + Legal Entity Name + Address + GSTIN + State Code                 │
│ └── RIGHT: Document Classification Badge (TAX INVOICE) + Document No + Issue Date + Due Date           │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ TIER 2: BIPARTITE COMMERCIAL CONTEXT & LOGISTICS GRID                                                 │
│ ├── CONSIGNOR / SELLER COORDINATES        │ CONSIGNEE / BUYER BILLING & SHIPPING DETAILS               │
│ └── VEHICLE & LOGISTICS DISPATCH RIBBON   (Transporter, Vehicle No, E-Way Bill No, Dispatch Date)     │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ TIER 3: UNIVERSAL 8-COLUMN LINE-ITEM LEDGER (Strict 100% Width Fixed Table)                           │
│ ├── [#] (5%)   [Item Description] (33%)   [HSN] (10%)   [Qty] (9%)                                    │
│ └── [Rate ₹] (10%)   [Taxable ₹] (13%)   [GST %] (7%)   [Total ₹] (13%)                               │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ TIER 4: STATUTORY HSN / SAC TAX BREAKUP SUMMARY (Toggleable via Customizer)                           │
│ └── HSN/SAC Code │ Taxable Value │ CGST (Rate & Amt) │ SGST (Rate & Amt) │ Total Accrued Tax          │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ TIER 5: ELECTRONIC REMITTANCE COORDINATES & DYNAMIC UPI QR CODE                                       │
│ ├── LEFT: Bank Name, Beneficiary Name, Account Number, IFSC Code, Branch (Toggleable)                 │
│ ├── CENTER: Live Dynamic UPI QR Code (Payee VPA + Amount + Bill Ref) (Toggleable)                     │
│ └── RIGHT: Tax Accrual Stack (Taxable Subtotal, CGST, SGST, Round-Off, Net Payable) + Signatory Stamp  │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ TIER 6: STATUTORY DECLARATIONS, LEGAL TERMS & FOOTER GREETING                                         │
│ ├── Terms & Conditions List (Parsed line-by-line from Customizer)                                     │
│ └── Customer Greeting / Footer Note (e.g., "Thank you for partnering with Futane Agro")                │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Strict Responsive Canvas & Zoom Engine Invariants

### A. The Safe-Centering Rule (No Negative Overflow)
Flex containers wrapping the A4 paper canvas must NEVER use unadorned `justify-content: center`.
```css
/* CORRECT: Safe center prevents negative left-overflow on small viewports */
.document-canvas-viewport {
  display: flex;
  justify-content: safe center;
  align-items: flex-start;
  overflow-x: auto;
  overflow-y: auto;
  padding: 1.5rem 1rem;
}

.document-sheet {
  margin: 0 auto;
  width: 210mm;
  min-height: 297mm;
  box-sizing: border-box;
}
```

### B. Zoom Rendering Engine (`zoom` vs `transform: scale`)
- **Do NOT** use CSS `transform: scale(...)` for responsive document fitting; it preserves the original layout dimensions and causes ghost overflow.
- **DO USE** CSS `[style.zoom]="zoomLevel"` or layout-recalculating zoom.
- Standard Zoom Presets:
  - **Fit to Laptop**: `0.78` (Fits 1366×768 / 1440×900 screens without horizontal scrolling)
  - **85%**: `0.85`
  - **100%**: `1.00` (Actual 1:1 Print Preview)
  - **115%**: `1.15` (High-density inspection)

### C. Fixed Table Algorithm (Zero Column Blowout)
All tables on the document sheet must enforce:
```css
.document-sheet .doc-table {
  width: 100% !important;
  max-width: 100% !important;
  table-layout: fixed !important;
  border-collapse: collapse !important;
}

.document-sheet .doc-table th,
.document-sheet .doc-table td {
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}
```
**Mandatory Column Width Allocation (Sum = 100%)**:
- `#`: `5%`
- `Item Description`: `33%`
- `HSN`: `10%`
- `Qty`: `9%`
- `Rate (₹)`: `10%`
- `Taxable (₹)`: `13%`
- `GST`: `7%`
- `Total (₹)`: `13%`

---

## 4. Two-Way Template Customization Protocol

The `invoiceTemplate` configuration is the single source of truth for all invoice generation:

### Configuration Schema
```typescript
export interface InvoiceTemplateConfig {
  headerNote?: string;
  termsAndConditions?: string[];
  footerGreeting?: string;
  showBankDetails: boolean;
  showUpiQrCode: boolean;
  showCompanyLogo: boolean;
  showHsnSummary: boolean;
  primaryColor?: string;
  accentColor?: string;
}
```

### Dynamic Binding Rules
1. **Terms & Conditions**: Read from `invoiceTemplate.termsAndConditions`. If absent, fallback to statutory fallback lines.
2. **Footer Greeting**: Read from `invoiceTemplate.footerGreeting` (e.g. `"Thank you for partnering with Futane Agro. Quality Crates for Modern Logistics."`).
3. **Visibility Toggles**:
   - `showBankDetails`: Conditionally render Remittance Coordinates (`*ngIf="invoiceTemplate?.showBankDetails !== false"`).
   - `showUpiQrCode`: Conditionally render UPI QR box (`*ngIf="invoiceTemplate?.showUpiQrCode !== false"`).
   - `showCompanyLogo`: Conditionally render logo header (`*ngIf="invoiceTemplate?.showCompanyLogo !== false"`).
   - `showHsnSummary`: Conditionally render the Statutory HSN/SAC Tax Breakdown table (`*ngIf="invoiceTemplate?.showHsnSummary !== false"`).

---

## 5. Statutory Tax Calculation Compliance

All tax accruals must strictly follow Indian GST legislation:
1. **Taxable Amount**: `Qty × Rate`
2. **CGST (9%)**: `Taxable Amount × 0.09`
3. **SGST (9%)**: `Taxable Amount × 0.09`
4. **Total Line Item**: `Taxable Amount + CGST + SGST` (or `Taxable Amount × 1.18`)
5. **Invoice Total**: Sum of all line item totals, with symmetric CGST and SGST accruals.
6. **NEVER** calculate tax by multiplying the gross invoice total by the tax percentage.

---

## 6. Master Prompt for AI Agents and Developers

Copy and paste the following prompt whenever building, refactoring, or reviewing document preview pages or invoice print templates:

```text
================================================================================
MASTER PROMPT: A4 DOCUMENT & INVOICE PREVIEW ENGINE
================================================================================

You are implementing or refactoring an A4 printable document preview (Tax Invoice, Proforma, Challan, or Receipt) in Futane Agro ERP.

Follow these strict non-negotiable architectural standards:

1. LAYOUT & SCALING (NO HORIZONTAL CUTOFF):
   - The paper canvas must be standard A4 (210mm wide).
   - The viewport container MUST use "display: flex; justify-content: safe center; align-items: flex-start; overflow-x: auto;".
   - NEVER use bare "justify-content: center" without "safe" on scrollable containers because it causes negative overflow that clips leftmost columns on standard laptop screens (1366px).
   - Implement zoom controls using CSS [style.zoom]="zoomLevel" with presets: Fit (0.78), 85% (0.85), 100% (1.00), and 115% (1.15). Do NOT use transform: scale() which leaves phantom layout overflow.
   - All tables must specify "table-layout: fixed !important; width: 100% !important;". Column width percentages must sum exactly to 100%:
     # (5%), Description (33%), HSN (10%), Qty (9%), Rate (10%), Taxable (13%), GST (7%), Total (13%).

2. TEMPLATE CUSTOMIZER SYNCHRONIZATION:
   - Synchronize the document sheet with the Invoice Template configuration (from ApiService or LocalStorage).
   - Honor all customizer switches:
     * showCompanyLogo: Show/hide company logo in the header.
     * showBankDetails: Show/hide Electronic Remittance Coordinates.
     * showUpiQrCode: Show/hide dynamic UPI QR code generator.
     * showHsnSummary: Show/hide the HSN/SAC Tax Breakup Summary table.
     * termsAndConditions: Render lines dynamically from the customizer array.
     * footerGreeting: Render the custom footer greeting note.

3. STATUTORY GST FINANCIAL MATHEMATICS:
   - Taxable Amount = Qty * Rate.
   - CGST (9%) = Taxable Amount * 0.09.
   - SGST (9%) = Taxable Amount * 0.09.
   - Total Line Item = Taxable Amount + CGST + SGST.
   - NEVER calculate CGST/SGST on gross amount (Total * 0.09 is WRONG).
   - Display symmetric CGST (9%) and SGST (9%) in both the line-item table and the HSN/SAC breakup table.

4. 6-TIER CANONICAL ANATOMY:
   - Tier 1: Letterhead & Dual-Brand Header (Company info, GSTIN, Doc Title, Doc No, Dates).
   - Tier 2: Party Grid (Seller/Consignor, Buyer/Consignee, Vehicle & E-Way Bill info).
   - Tier 3: Universal 8-Column Itemized Goods Table.
   - Tier 4: HSN/SAC Tax Breakup Summary Table.
   - Tier 5: Remittance Details, Live UPI QR Code, Subtotal Tax Accruals, and Signatory Box.
   - Tier 6: Dynamic Terms & Conditions and Footer Greeting.

Verify the implementation compiles cleanly without Angular template errors and renders flawlessly on both desktop (1920px) and laptop (1366px) screens.
================================================================================
```
