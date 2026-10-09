# MASTER ARCHITECTURAL DIRECTIVE & IMPLEMENTATION SPEC
## Alignment of Billing Hub & Document Center to Canonical 3-Structure ERP Layout

> **Directive ID**: `ERP-BILLING-HUB-CANONICAL-ALIGNMENT-2026-V1`  
> **Status**: Enforced across **Futane Agro ERP**  
> **Target Module**: `BillingHubComponent` (`frontend/src/app/components/features/billing-hub/`)  
> **Reference Canonical Models**: `ProductionComponent`, `InventoryComponent`, `InvoicesComponent`  

---

## 1. Problem Audit: Why Billing Hub Looked Empty & Broken

A visual and DOM audit of the Billing Hub tab (`billing-hub.component.html` and `billing-hub.component.css`) revealed 4 primary layout defects:

### 1. Massive Dead Blank Space (>50% Screen Waste)
- The printable document paper (`.document-sheet`) had a hardcoded width of `210mm` (~794px) and was centered inside `.document-sheet-wrapper`.
- On standard 1440px displays, this left **over 300px of completely dead blank white space on the left and right sides**, squandering more than half of the user's screen estate.

### 2. Missing Structure 2 Telemetry (Zero KPI Cards)
- Every canonical ERP tab in Futane Agro ERP features a 4-card telemetry grid below the header.
- Billing Hub jumped abruptly from the header to loose filter inputs, leaving an informational void and giving no business visibility into gross billed value, record queue depth, or tax accruals.

### 3. Cramped Single-Row Filter Bar & Isolated Dropdown
- Filters (`Year`, `Month`, `Search`, `From`, `To`, `Reset`) were jammed into a single loose horizontal row.
- The record selector was an isolated full-width dropdown sitting alone on a row, forcing cumbersome dropdown scrolling rather than providing a modern, browsable document ledger.

### 4. Table Column Clipping & Summary Misalignment
- The line items table inside the document paper lacked `table-layout: fixed` and responsive box containment, causing right-side columns (`Amount (₹)`) to clip against paper edges at certain screen scales.

---

## 2. Canonical 3-Structure Architecture for Billing Hub

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ STRUCTURE 1: COMPACT ENTERPRISE HEADER                                                                 │
│ ├── Unified Breadcrumbs: Futane Agro ERP / Financial Management / Billing Hub & Document Center        │
│ ├── LEFT: 46×46px Blue Hero Icon Pod + Title + Total Count Pill + Subtitle                             │
│ └── RIGHT: [Sync / Refresh] + [🖨️ Print Document] + [⬇️ Export PDF] Primary CTA                        │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ STRUCTURE 2: 4-CARD TELEMETRY KPI GRID                                                                 │
│ ├── 1. Gross Invoiced Value (Blue) — Total ₹ Commercial Volume of active queue                         │
│ ├── 2. Document Registry Queue (Green) — Total Active Records Matching Filter                          │
│ ├── 3. Estimated GST Accrual (Amber) — 18% Statutory GST Breakdown                                     │
│ └── 4. Active Document Format (Purple) — Standardized Category & Document Prefix                       │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ STRUCTURE 3: 2-COLUMN EXECUTIVE DOCUMENT WORKBENCH                                                     │
│ ┌──────────────────────────────────────────────┐ ┌───────────────────────────────────────────────────┐ │
│ │ LEFT: DOCUMENT QUEUE & RECORDS LEDGER (380px)│ │ RIGHT: LIVE PRINTABLE DOCUMENT CANVAS (1fr)       │ │
│ │ ├── 7-Type Document Pill Switcher            │ │ ├── Canvas Toolbar: Doc Type Title + Zoom Pill    │ │
│ │ ├── Quick Search & Date / Month Filters      │ │ │   (85% / 100% / 115%) + Quick Print / PDF       │ │
│ │ ├── Scrollable Document Queue Cards:         │ │ ├── Canvas Viewport (#f8fafc subtle canvas bg):   │ │
│ │ │   - Party / Payee Name (Bold)              │ │ │   - High-fidelity A4 Printable Sheet            │ │
│ │ │   - Document Reference & Date              │ │ │   - Complete 8-column goods table (no clipping) │ │
│ │ │   - Formatted Amount Badge (₹)             │ │ │   - Tax summary & Amount in words               │ │
│ │ │   - Active Selected Glow & Theme Border    │ │ │   - QR Code, Remittance & Signatory             │ │
│ └──────────────────────────────────────────────┘ └───────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Implementation Plan & Commitments
1. **TypeScript (`billing-hub.component.ts`)**:
   - Add telemetry getters: `totalQueueValue`, `totalQueueTax`, `totalQueueCount`, `activeDocTypeTitle`.
   - Add canvas zoom control state (`zoomLevel: number = 1.0`).
   - Add `selectRecordItem(record: any)` for instant interactive selection from queue cards.
2. **Template (`billing-hub.component.html`)**:
   - Implement Structure 1 header with canonical ERP icon pod.
   - Implement Structure 2 4-card telemetry grid.
   - Implement Structure 3 2-column workbench layout with Left Queue Ledger & Right Document Canvas.
3. **Styles (`billing-hub.component.css`)**:
   - Enforce canonical ERP design system tokens, 14px card border radius, glass card styling, and zero dead space.
   - Fix table layout containment so columns never clip or overflow.
   - Retain `@media print` rules for clean physical and PDF document printing.
4. **Verification**:
   - Build production bundle with `--max-old-space-size=1536` (0 errors).
   - Capture Playwright verification screenshots at 1440px and verify complete elimination of blank space.
