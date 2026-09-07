# MASTER PROMPT #12 — FUTANE AGRO ERP: CODEBASE HYGIENE & PRODUCTION SPECIFICATION

> **System Authoritative Reference & Execution Spec (September 2026)**
> Use this prompt with any LLM, AI agent, or engineering team to maintain, extend, or audit the **Futane Agro ERP** production codebase. It establishes strict rules against redundant dependencies, maintains visual excellence, and documents the architecture of all modules.

---

## 1. SYSTEM OVERVIEW & ARCHITECTURE

| Property | Value | Description |
|---|---|---|
| **Application** | Futane Agro ERP | Enterprise Resource Planning for Polypropylene Crate Manufacturing |
| **Domain** | Manufacturing & Supply Chain | Injection molding plant, warehouse, logistics & GST accounting |
| **Frontend** | Angular 17+ (Standalone) | Port `4200` (UAT) / `4201` (Prod), Zero external UI frameworks (Vanilla SCSS) |
| **Backend** | Spring Boot 2.7.18 / 3.2 | Port `8081`, Spring Security, JPA/Hibernate, MySQL 8 InnoDB |
| **Database** | MySQL 8.0+ | Liquibase automated database migrations |
| **Caching** | Caffeine In-Memory L1 | 4 regions: `branding` (30m), `featureFlags` (10m), `rolePermissions` (60m), `teams` (30m) |
| **Real-time** | STOMP / SockJS WebSocket | `/api/ws` → `/topic/erp-updates` |
| **Telemetry & Metrics** | Micrometer + Actuator | Port `8081/actuator/prometheus`, JVM memory/threads, DB connection latency |

---

## 2. CODEBASE HYGIENE & ANTI-BLOAT RULES

To keep the repository fast, lightweight, and production-ready, strictly adhere to the following rules:

1. **Zero Redundant / Dead Files**:
   - Never commit `.bak`, `.tmp`, `.old`, or editor backup files.
   - Build outputs belong strictly inside `backend/target` and `frontend/dist`. Never create a `target/` directory at repository root.
   - Heavy transient assets (e.g. temporary PDFs, screenshot caches) must be ignored or cleaned after execution.

2. **Strict Dependency Minimization**:
   - Keep `package.json` lean. If an internal service (e.g. `translate.service.ts`) satisfies the requirements, do not install third-party wrappers like `@ngx-translate/core`.
   - Never keep unconfigured test frameworks (e.g. Cypress) if Playwright or Karma is already standardized.
   - Avoid duplicate `node_modules` inside subfolders like `scratch/` or `e2e-tests/`.

3. **No Redundant Sub-tabs**:
   - Dedicated top-level modules (e.g. **Audit Logs** at `/audit-logs`) must remain primary navigation items. Do not duplicate them as subtabs inside Settings unless explicitly architected as an embedded widget.

4. **Clean Action Button Hierarchy**:
   - Form and table actions must have distinct visual priorities:
     - **Primary Actions**: Solid brand color (e.g. `.btn-primary`, `.btn-custom-access`), reserved for main operations.
     - **Secondary / Safety Actions**: Subtle borders or danger-outline (e.g. `.btn-secondary`, `.btn-danger-outline`, `.btn-reset-pwd`).
     - **Context Menus**: Use standard Kebab `⋮` dropdowns for secondary operations (Edit, Role change, Deactivate, View History).

---

## 3. SUPER ADMIN CONTROL CENTER: COMPLETE MODULE SPECIFICATION

The Super Admin Settings & Control Center (`settings.component.ts` / `settings.component.html`) contains **10 focused, active sub-tabs**:

### Subtab 1: Branding & Visual Identity (`branding`)
- **Logo & Asset System**: Drag-and-drop / click-to-replace corporate logo dropzone with SVG/PNG validation.
- **Theme Palette**: Real-time two-way synchronized color swatch box and hex code input with preset dots. Drives CSS custom property `--brand-primary`.
- **Typography & Font Preview**: Interactive font family selector (Inter, Roboto, Poppins, Outfit, JetBrains Mono) with dynamic live sample line.
- **Table Density**: Compact, Comfortable, Spacious presets.
- **Top Actions**: Single, authoritative **Save Branding** button (No redundant import/export buttons).

### Subtab 2: Multi-Company, Banks & Invoice Designer (`billing`)
- **Corporate Billing Entities**: Multi-company list (e.g. Futane Agro Tech Pvt. Ltd.) with GSTIN, PAN, and Default Billing toggle.
- **Bank Profiles & Dynamic UPI QR**: Settlement bank account configuration (HDFC, SBI, etc.) with IFSC and dynamic UPI QR generation on invoices.
- **Multi-Document Selector Tabs**:
  - `TAX_INVOICE`: Tax Invoice (GST B2B)
  - `PROFORMA`: Proforma Invoice (Quotation)
  - `DELIVERY_CHALLAN`: Goods Outward Delivery Note
  - `PAYMENT_RECEIPT`: Official Remittance Receipt
  - `PURCHASE_INVOICE`: Vendor Goods Inward
  - `SALARY_SLIP`: Monthly Wage Statement
- **A4 Print Styles & T&C**: Resizable vertical Terms & Conditions textarea (`min-height: 150px`) and **🖨️ Print Preview** (`window.print()`).

### Subtab 3: ERP Business Rules & Thresholds (`business_rules`)
- **Manufacturing Shifts**: Morning, Evening, Night shift timing and target output quotas.
- **Tariff & Scrap Rates**: Standard electricity tariff per kWh, regrind scrap deduction percentage.
- **Material Thresholds**: Minimum safety stock limits for Polypropylene Granules (kg) and Masterbatch (kg).

### Subtab 4: Department Directory & Teams (`teams`)
- **Teams Table**: Fixed-layout table with team icon avatars, unique codes (`MFG`, `SCM`, `FIN`, `HR`, `ADM`), member count pills, and hover-tooltip truncated descriptions (`max-width: 320px`).
- **Team Actions**: Inline `[✏️ Edit]` and `[🗑️ Deactivate]` actions.

### Subtab 5: Dynamic Custom Fields (`custom_fields`)
- **Extensible Schema Engine**: Allows runtime addition of custom attributes to core ERP entities (`PARTIES`, `INVOICES`, `PRODUCTION`, `DISPATCH`).
- **Field Types**: TEXT, NUMBER, DATE, SELECT_DROPDOWN, CHECKBOX, CURRENCY.

### Subtab 6: Automated Messaging & WhatsApp Engine (`notifications`)
- **Pre-seeded DLT Templates**:
  - `INVOICE_DISPATCHED`: Real-time order outward notification with tracking link.
  - `PAYMENT_REMINDER`: Friendly payment due reminder with UPI ID & bank remittance details.
  - `SMS Quick Dispatch`: Short SMS variant for instant carrier delivery.
  - `ORDER_CONFIRMED`: Customer sales confirmation alert.
  - `LOW_STOCK_ALARM`: Automated buffer threshold alert.
- **3-Column Responsive Grid**:
  - **Left**: Template selection list with channel pills (`🟢 WhatsApp`, `📱 SMS`, `✉️ Email`) and active toggle switches.
  - **Center**: Template configuration editor with dynamic token chips (`+ {customer_name}`, `+ {invoice_no}`, `+ {amount}`, etc.).
  - **Right**: Smartphone frame with realistic WhatsApp chat mockup, status ticks, and live phone dispatch simulator.

### Subtab 7: Users Directory & Granular RBAC (`users`)
- **Seed Identity Standard**: Real, distinct employee profiles across departments:
  - `Vedant Mehare` (`@vedant.mehare`, `SUPER_ADMIN`, Admin)
  - `Rajesh Patil` (`@rajesh.patil`, `ADMIN`, Manufacturing)
  - `Neha Sharma` (`@neha.sharma`, `ADMIN`, HR)
  - `Sanjay Deshmukh` (`@sanjay.d`, `MANAGER`, Manufacturing)
  - `Amit Kulkarni` (`@amit.kulkarni`, `ACCOUNTANT`, Finance)
  - `Suresh Shinde` (`@suresh.shinde`, `OPERATOR`, Supply Chain)
  - `Sunil Deshmukh` (`@sunil.deshmukh`, `OPERATOR`, Manufacturing)
  - `Pooja Verma` (`@pooja.verma`, `VIEWER`, Commerce)
- **Table Columns**: `#` | `NAME & USERNAME` (initials avatar + `&#64;handle`) | `EMAIL` | `ASSIGNED ROLE` | `TEAM` | `LAST LOGIN` | `STATUS` | `ACTIONS`.
- **Button Hierarchy**:
  - `Custom Access`: Primary button (`.btn-primary.btn-xs`) with `tune` icon.
  - `Reset Pwd`: Secondary danger-outline button (`.btn-danger-outline.btn-xs`) with `lock_reset` icon.
  - `Kebab ⋮ Dropdown`: Edit Profile, Change Role, Deactivate/Unlock User, View Audit History.

### Subtab 8: Dynamic Feature Flags (`features`)
- **23 Subsystem Flags**: Runtime toggles across Core, Manufacturing, Commerce, Supply Chain, Finance, HR, and Administration.
- **Dynamic HUD Pill**: Real-time counter (`23/23 Active`) with dynamic health color class (`badge-success`, `badge-warning`, `badge-danger`).

### Subtab 9: Developer Hub & API Gateways (`developer`)
- **API Token Management**: Scoped secret keys (`READ_ONLY`, `READ_WRITE`, `FULL_ADMIN`) with masked display and copy-to-clipboard.
- **Webhooks Dispatcher**: Outbound event webhook subscriptions with live HMAC-SHA256 test ping trigger (`/api/admin/webhooks/{id}/test-ping`).

### Subtab 10: JVM Telemetry, Cache & Governance (`governance`)
- **Live Gauge Cards**: JVM Heap Memory utilization, Database Ping Latency (ms), Active Async Worker Threads, and WebSocket Gateway status.
- **Caffeine L1 Cache Regions**: Individual `[Flush]` controls for `branding`, `featureFlags`, `rolePermissions`, `teams`, plus `Flush All Caches`.
- **Emergency Action**: `🚨 Emergency Reset / Force Logout All Sessions` with confirmation guard.
- **Security & Password**: Enterprise password policy enforcement with strength meter and session invalidation on change.

---

## 4. VERIFICATION PROTOCOL FOR ALL FUTURE CHANGES

Before concluding any development task or code change:
1. **Compilation Check**: Run dev server / build to ensure `Application bundle generation complete` with **0 errors**.
2. **Template Hygiene**: Ensure all literal `@` characters inside HTML templates are escaped as `&#64;` to avoid Angular 17 control-flow block conflicts.
3. **No Dead Artifacts**: Confirm no temporary files or orphaned folders remain.
4. **Endpoint Sanity**: Confirm frontend (`http://localhost:4200/`) returns `200 OK` and backend (`http://localhost:8081/`) returns healthy telemetry at `/api/admin/system-health`.
