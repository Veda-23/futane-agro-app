# MASTER PROMPT: UNIVERSAL POP CARD CENTERING & EXECUTIVE UI SPECIFICATION
**Repository:** Futane Agro ERP (`futane-agro-app`)  
**Scope:** Universal Modal, Slide-In Pop Card, & Drawer Design System Audit  
**Author:** Antigravity AI Engineering Pair  
**Status:** Canonical Reference & Execution Contract  

---

## 1. Executive Summary & Core Invariants

In high-density industrial manufacturing ERP applications, modal dialogs, slide-in pop cards, dossiers, and inspection slips are the core decision-making surfaces for operators, plant floor supervisors, quality assurance inspectors, and executive administrators.

Every pop card, modal overlay, and drawer across all tabs must strictly enforce the **7 Universal Invariants**:

1. **Mathematical Workspace Centering:**
   On desktop viewports ($\ge 1025\text{px}$) with a persistent sidebar ($240\text{px}$), modals and pop cards must NEVER center across the full viewport ($0\text{--}100\text{vw}$). They must center strictly within the remaining $1200\text{px}$ active workspace at $x = 840\text{px}$:
   ```css
   position: fixed !important;
   top: 50% !important;
   left: calc(50% + (var(--sidebar-width, 240px) / 2)) !important;
   transform: translate(-50%, -50%) !important;
   z-index: 100000 !important;
   ```

2. **Universal Luxury Backdrop Blur:**
   All modal overlays and backdrops must apply a high-end glassmorphic blur with high color saturation:
   ```css
   position: fixed !important;
   inset: 0 !important;
   background: rgba(15, 23, 42, 0.65) !important;
   backdrop-filter: blur(8px) saturate(140%) !important;
   -webkit-backdrop-filter: blur(8px) saturate(140%) !important;
   z-index: 99990 !important;
   ```

3. **Zero Off-Screen Bugs:**
   NEVER combine `position: relative` with `left: calc(50% + 120px)` on flex-centered dialogs. Always ensure modal dialogs inside overlays use `position: fixed` coordinates with `transform: translate(-50%, -50%)`.

4. **Executive Header Anatomy:**
   Every pop card header MUST feature:
   - A **40×40px rounded squircle icon container** with a 10px radius and theme color gradient.
   - Clean title with a **monospace ID pill badge** (`#ORDER-XX`, `#TRP-XXXX`, `#DRV-XXXX`, `#CLI-XXXX`, `#PAY-XXXX`, `#BNK-XXXX`).
   - Descriptive subtitle in `var(--text-muted)`.
   - A **34×34px squircle/circular close button** with hover effect and <kbd>Esc</kbd> tooltip hint.

5. **Data & Model Fields (Contextual Symbols & 2-Column Responsive Layout):**
   - All input controls MUST include visible contextual icons (e.g., `bi-person`, `bi-telephone`, `bi-card-text`, `bi-geo-alt`, `bi-wallet2`, `bi-calendar3`, `bi-bank`).
   - Input and select controls with icons must enforce `padding-left: 38px !important;` to prevent text from overlapping leading icons.
   - Form fields MUST be structured in a balanced 2-column responsive grid (`grid-template-columns: repeat(2, 1fr); gap: 14px 16px`).
   - Full-width fields (Address, Notes, Telemetry Gauges) span both columns (`grid-column: span 2;`).
   - Mobile viewports ($\le 640\text{px}$) gracefully collapse to a single column (`1fr`).

6. **Technical UUID Sanitization:**
   - NEVER expose raw 36-character UUIDs (e.g., `08441086-0f4f-41cf-ab93-cf4e92a997a0`) directly in headings, labels, or toasts.
   - Sanitize via formatting helpers: display 8-character uppercase hex prefixes (e.g., `CLI-27B32046`, `TRP-24033BB1`, `DRV-FC2EEC3A`, `PAY-08441086`, `BNK-09498C4C`).
   - ALWAYS preserve the full raw UUID inside the `[title]` attribute for 100% database audit traceability.

7. **Keyboard Accessibility & Esc Dismissal:**
   - Bind `@HostListener('document:keydown.escape')` in every feature component to seamlessly dismiss any active drawer, modal dialog, voucher, or dossier upon pressing <kbd>Esc</kbd>.

---

## 2. Audit Matrix Across All Modules

### Batch 1 Pop Cards (Sales & Dispatch)
| Card / Modal | Module | Fixed Center | Backdrop Blur | Header Squircle & ID Badge | Status |
|:---|:---|:---:|:---:|:---:|:---:|
| **Commercial Sales Dossier** | `Sales` | $840\text{px}$ | 8px blur | `#ORDER-97` | ✅ Certified |
| **Material Outward & Dispatch** | `Sales` | $840\text{px}$ | 8px blur | Weighbridge telemetry box | ✅ Certified |
| **Delivery Challan Dossier** | `Dispatch` | $840\text{px}$ | 8px blur | `#DSP-F5A75E` | ✅ Certified |
| **Edit Dispatch Manifest** | `Dispatch` | $840\text{px}$ | 8px blur | Fixed off-screen bug | ✅ Certified |

### Batch 2 Pop Cards (Transport, Drivers, Parties)
| Card / Modal | Module | Fixed Center | Backdrop Blur | Header Squircle & ID Badge | Status |
|:---|:---|:---:|:---:|:---:|:---:|
| **Consignment Waybill & Freight Slip** | `Transport` | $840\text{px}$ | 8px blur | `#TRP-24033BB1` | ✅ Certified |
| **Edit Transport Record Drawer** | `Transport` | $840\text{px}$ | 8px blur | `#TRP-24033BB1` + 2-col inputs | ✅ Certified |
| **Edit Driver Profile Drawer** | `Drivers` | $840\text{px}$ | 8px blur | `#DRV-FC2EEC3A` + 2-col inputs | ✅ Certified |
| **Client Master Dossier** | `Parties` | $840\text{px}$ | 8px blur | `#CLI-27B32046` | ✅ Certified |
| **Edit Party Account Modal** | `Parties` | $840\text{px}$ | 8px blur | `#CLI-27B32046` + 7 input icons | ✅ Certified |

### Batch 3 Pop Cards (Payment Registry, Invoices, Bank Ledger)
| Card / Modal | Module | Fixed Center | Backdrop Blur | Header Squircle & ID Badge | Status |
|:---|:---|:---:|:---:|:---:|:---:|
| **Payment Receipt Voucher** | `Payments` | $840\text{px}$ | 8px blur | Official receipt letterhead | ✅ Certified |
| **Edit Payment Record Modal** | `Payments` | $840\text{px}$ | 8px blur | `#PAY-08441086` + Select overlap fix | ✅ Certified |
| **GST Tax Invoice Preview** | `Invoices` | $840\text{px}$ | 8px blur | Tax invoice + aligned footer actions | ✅ Certified |
| **Transaction Receipt Voucher** | `Bank` | $840\text{px}$ | 8px blur | `#BNK-09498C4C` | ✅ Certified |
| **Edit Bank Entry Drawer** | `Bank` | $840\text{px}$ | 8px blur | `#BNK-09498C4C` + sanitized toasts | ✅ Certified |

---

## 3. Universal Master Prompt for AI Agents & Engineers

```markdown
Role: Senior Enterprise UI/UX Architect & Angular Systems Engineer
Task: Universal Pop Card Centering, Mathematical Workspace Offset, Input Symbols, Backdrop Blur & Executive Styling

Rules:
1. Mathematical Workspace Centering:
   On desktop viewports (>= 1025px) with a persistent sidebar (width: 240px), NEVER center pop cards across the full viewport (0-100vw). Center them strictly within the remaining workspace by applying:
   position: fixed !important;
   top: 50% !important;
   left: calc(50% + (var(--sidebar-width, 240px) / 2)) !important;
   transform: translate(-50%, -50%) !important;
   z-index: 100000 !important;

2. Universal Backdrop Glassmorphism & Blur:
   All modal overlays and backdrops MUST feature luxurious glassmorphic blur with high color saturation:
   position: fixed !important;
   inset: 0 !important;
   background: rgba(15, 23, 42, 0.65) !important;
   backdrop-filter: blur(8px) saturate(140%) !important;
   -webkit-backdrop-filter: blur(8px) saturate(140%) !important;
   z-index: 99990 !important;

3. Zero Off-Screen Bugs:
   NEVER combine position: relative with left: calc(50% + 120px) on flex-centered dialogs. Always ensure modal dialogs inside overlays use position: fixed coordinates with transform: translate(-50%, -50%).

4. Executive Header Anatomy:
   Every pop card header MUST feature:
   - A 40x40px rounded squircle icon container with a 10px radius and theme color gradient.
   - Clean title with a monospace ID pill badge (#ORDER-XX, #TRP-XXXX, #DRV-XXXX, #CLI-XXXX, #PAY-XXXX, #BNK-XXXX).
   - Descriptive subtitle in var(--text-muted).
   - A 34x34px circular/squircle close button with hover effect and (Esc) tooltip hint.

5. Data & Model Fields (Symbols & 2-Column Responsive Layout):
   - All input controls MUST include visible contextual icons (e.g., bi-person, bi-telephone, bi-card-text, bi-geo-alt, bi-wallet2, bi-calendar3, bi-bank).
   - Form inputs and select dropdowns inside .input-with-icon MUST enforce padding-left: 38px !important to prevent text overlapping the leading icon.
   - Form fields MUST be structured in a balanced 2-column responsive grid (grid-template-columns: repeat(2, 1fr); gap: 14px 16px).
   - Full-width fields (Address, Notes, Gauges) span both columns (grid-column: span 2).
   - Mobile viewports (<= 640px) gracefully collapse to a single column (1fr).

6. Technical UUID Sanitization:
   - NEVER expose raw 36-character UUIDs (e.g., 27b32046-75f4-480d-ba20-4eb1f562cb53) directly in headers, cards, or notification toasts.
   - Sanitize via formatting helpers: display 8-character uppercase hex prefixes (e.g., CLI-27B32046, TRP-24033BB1, DRV-FC2EEC3A, PAY-08441086, BNK-09498C4C).
   - ALWAYS preserve the full raw UUID inside the [title] attribute for 100% database audit traceability.

7. Keyboard Accessibility & Dismissal:
   - Bind @HostListener('document:keydown.escape') in every feature component to dismiss active drawers, modals, vouchers, or dossiers upon pressing Esc.
```
