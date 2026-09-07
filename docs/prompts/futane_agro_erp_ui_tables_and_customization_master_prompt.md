# Master Prompt #11 — Enterprise Table UX, Responsive Layout & Settings Polish

## Context
When viewing administrative and data-intensive tabs (e.g., **Teams & Department Structure**, **Users & Access Control**, **Custom Fields**, **Payments**, and **Production**), data tables were getting clipped horizontally, action buttons (`Edit`, `Deactivate`, `Reset Pwd`) were pushed outside the viewport, header buttons were wrapping awkwardly, and inline monospace elements rendered with unstyled default colors.

This master prompt establishes the complete UI standardization pass for all data tables, layout grids, badges, sticky action columns, and customization controls across the entire ERP.

---

## 🎯 Master Architecture & Phase Breakdown

### Phase 1: CSS Grid & Container Viewport Containment
1. **Grid Column Containment**:
   - In 2-column administrative views (`.admin-layout-grid`), define columns using `240px minmax(0, 1fr)` instead of `260px 1fr`.
   - On the right content panel (`.admin-content-panel`), explicitly enforce `min-width: 0; max-width: 100%; overflow-x: hidden;` so wide tables never force the entire layout beyond the browser viewport.
2. **Fluid Section Headers**:
   - Ensure all `.section-header` action buttons have `white-space: nowrap; flex-shrink: 0;` so primary CTA buttons (e.g. `+ Add Department`, `+ Invite User`, `+ Add Custom Field`) remain pinned to the top-right header at all screen resolutions.

---

### Phase 2: High-Density Enterprise Table Standardization
1. **Universal Horizontal Scroll Wrapper (`.settings-table-scroll` / `.table-responsive`)**:
   - `width: 100%; max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 10px;`
   - Smooth custom scrollbars in both Light and Dark themes.
2. **Sticky Actions Column (`.col-actions`)**:
   - Table `th.col-actions` and `td.col-actions` stick to the right edge with `position: sticky; right: 0;` and elevation shadows (`box-shadow: -4px 0 8px -2px rgba(15, 23, 42, 0.06);`).
   - Ensures `Edit`, `Deactivate`, `Delete`, and `Restore` action buttons are **always immediately reachable** without requiring the user to scroll horizontally.
3. **Data Density & Row Polish**:
   - Standardize table headers: uppercase, 11px, `font-weight: 700`, `letter-spacing: 0.05em`, subtle bottom border.
   - Row hover highlights with transition effects.

---

### Phase 3: Typography, Badges & Code Token Design System
1. **Code Badges (`.code-badge`)**:
   - Replace raw inline `<code>` tags with standardized `.code-badge` tokens:
     ```css
     .code-badge {
       display: inline-block;
       font-family: var(--font-mono, monospace);
       font-size: 11px;
       font-weight: 600;
       padding: 3px 8px;
       border-radius: 6px;
       background: var(--bg-surface, #f1f5f9);
       color: var(--text-secondary, #475569);
       border: 1px solid var(--border-color, #e2e8f0);
       letter-spacing: 0.02em;
     }
     ```
2. **Pill Badges (`.pill-badge`)**:
   - Replace standard bootstrap badges with modern soft-tinted status pills:
     - `.pill-info`: Light sky-blue background + deep blue text
     - `.pill-success`: Soft emerald background + forest green text + bullet dot (`.badge-dot`)
     - `.pill-warning`: Soft amber background + warm amber text
     - `.pill-danger`: Soft rose background + crimson red text
     - `.pill-secondary`: Soft slate background + charcoal text

---

### Phase 4: Full Responsive & Dark Theme Support
1. **Dark Theme Palette Adaptations**:
   - `.settings-data-table th.col-actions` and `td.col-actions` adopt dark surface backgrounds (`rgba(30, 41, 59, 0.95)` / `#0f172a`) with matching dark shadows.
   - Contrast ratios on all text and status pills meet WCAG AA standards in both modes.
2. **Mobile / Tablet Viewports (<1024px)**:
   - Sub-nav menu stacks cleanly above the content panel.
   - Table scroll handles horizontal gestures smoothly.

---

## 🧪 Verification & Acceptance Criteria
- [x] **Teams & Departments Table**: All 7 columns (`Department / Team`, `Code`, `Description`, `Users`, `Employees`, `Sidebar`, `Actions`) render cleanly.
- [x] **Sticky Action Column**: `Edit` and `Deactivate` buttons stay pinned to the right edge with shadow elevation.
- [x] **Users Table**: User avatar/name, email, role pill, department, active status dot, and `↺ Reset Pwd` button are all clearly visible.
- [x] **Custom Fields & Backups**: Tables use universal `.settings-table-scroll` containers with sticky actions.
- [x] **Zero Layout Shifts**: Navigating between sub-tabs produces no horizontal page stretching or clipping.
