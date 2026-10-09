# Futane Agro ERP — Production Design System & Governance Guide

> **Single Source of Truth**: [`frontend/src/styles/_tokens.scss`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/frontend/src/styles/_tokens.scss)  
> **Root Stylesheet**: [`frontend/src/styles.scss`](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/frontend/src/styles.scss)

---

## 1. Zero-Tolerance Design Rules
1. **Single Brand Primary**: All primary action buttons, active navigation tabs, active toggle switches, and focus outlines MUST use `--brand-primary` (`#0B47D4` Cobalt Blue). No module or subtab is permitted to use an ad-hoc primary color.
2. **Strict Semantic Roles**: Every badge, status pill, and notification in the application must map exclusively to one of these 7 semantic roles:
   - `primary`: `#0B47D4` (main actions, brand emphasis)
   - `secondary`: `#475569` (neutral actions, outlines, helper text)
   - `success`: `#10B981` (strictly for `ACTIVE` states, verified badges, approved records)
   - `warning`: `#F59E0B` (strictly for `PENDING` states, cautions, alerts)
   - `danger`: `#EF4444` (strictly for `INACTIVE`, `REVOKED`, destructive actions, errors)
   - `info`: `#0284C7` (system notices, documentation, guides)
   - `neutral`: `#64748B` (unassigned tags, optional chips)
3. **Typography Scale**: Strictly restricted to:
   - `11px` (`--font-size-xs`): Micro badges, uppercase column headers, timestamps.
   - `12px` (`--font-size-sm`): Form labels, secondary captions.
   - `13px` (`--font-size-base`): Standard body text, subtitles, table cell data.
   - `14px` (`--font-size-md`): Standard button text, feature row titles.
   - `16px` (`--font-size-lg`): Card headers, section headers, dialog titles.
   - `18px` (`--font-size-xl`): Modal headers, prominent section banners.
   - `20px` (`--font-size-2xl`): Screen titles, primary KPI numbers.
   - `24px` (`--font-size-3xl`): Executive hero totals.
4. **Spacing Scale**: Strictly `4px`, `8px`, `12px`, `16px`, `24px`, `32px` (`--spacing-1` through `--spacing-8`).
5. **No Hardcoded Hex/Pixel Drift**: Never write hardcoded colors or ad-hoc font sizes in component stylesheets. Always bind to CSS variables or tokens.

---

## 2. Canonical Component Classes

### 2.1 Buttons
- **Primary CTA**: `<button class="btn btn-primary btn-sm">` (Exactly one per panel)
- **Secondary Action**: `<button class="btn btn-secondary btn-sm">`
- **Destructive Action**: `<button class="btn btn-danger btn-sm">` or `<button class="btn-sec-danger">`
- **Ghost/Text**: `<button class="btn btn-ghost btn-sm">`

### 2.2 Status & Role Pills
- **Status Pill**:
  ```html
  <span class="pill-badge pill-success">
    <span class="dot-indicator dot-success"></span> ACTIVE
  </span>
  ```
- **Role Badge**:
  ```html
  <span class="pill-badge" [ngClass]="getRoleBadgeClass(user.role)">{{ user.role }}</span>
  ```
  *(Roles SUPER_ADMIN, ADMIN, MANAGER, ACCOUNTANT, OPERATOR always render as colored pills, never plain text).*

### 2.3 Tables
- **Header Structure**: `<table class="table enterprise-table">` with `<th class="col-header">` (rendered at 11px uppercase, weight 600, letter-spacing 0.4px).
- **Sticky Columns**: Apply `.sticky-col-left` or `.sticky-col-right` for fixed identity/action columns.
- **Density Controls**: Standard density button group using `.density-group` and `.density-btn`.

### 2.4 Empty States
- Always use the shared `.empty-state-box`:
  ```html
  <div class="empty-state-box">
    <div class="empty-icon"><i class="bi bi-inbox text-muted"></i></div>
    <h4>No Records Found</h4>
    <p>Optional descriptive explanation.</p>
    <button class="btn btn-primary btn-sm">Create New Record</button>
  </div>
  ```

---

## 3. Automated CI Regression Gates
The repository includes automated governance tools to prevent design drift before code reaches production:
- **Design System Linter**:
  ```bash
  npm run lint:design-system
  ```
  *Scans all `.html`, `.scss`, and `.ts` files to detect hardcoded inline colors, raw unclassed controls, and semantic color bugs.*
- **Playwright Visual Regression Suite**:
  ```bash
  npm run test:visual
  ```
  *Navigates through all application routes and subtabs to verify active tab indicators, green ACTIVE pills, uniform role badges, and uppercase table typography.*
