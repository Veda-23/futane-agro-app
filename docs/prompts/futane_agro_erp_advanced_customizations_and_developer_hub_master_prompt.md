# Master Prompt #12 — Super Admin Ultimate Customization Suite & Developer Command Center

## Context & Vision
The Futane Agro ERP Super Admin Control Center currently manages core branding, teams, users, feature toggles, and basic custom fields. To transform this into a world-class, extensible enterprise operating system that supports hundreds of dynamic customizations and provides a developer-friendly administration suite, this master prompt reorganizes and expands the settings architecture into **6 cohesive, power-packed domains**.

---

## 🎯 Architecture & Domain Hierarchy

```
⚙️ Super Admin Control Center
├── 🎨 1. Appearance & Visual Engine (Themes, Fonts, Density, Branding & Assets)
├── 🏢 2. ERP Engine & Business Rules (GST, Shifts, Invoices, Safety Stock, Tariffs)
├── 🛡️ 3. Identity, RBAC & Security Hardening (Permissions Matrix, Session Policy, IP Allowlist)
├── 🧩 4. Extensible Schema & Custom Fields (No-Code Entity Fields, Types, Validation Rules)
├── ⚡ 5. Developer Hub & API Gateways (API Keys, Webhooks, Rate Limiting, CORS, WebSocket)
└── 📡 6. System Governance & Diagnostics (Caffeine Cache, Automated DB Backups, Audit Policies)
```

---

## DOMAIN 1: 🎨 Appearance & Visual Engine

### Key Features:
1. **Dynamic Color & Theme Engine**:
   - **Primary Palette**: Amber Gold (`#d97706`), Emerald Green (`#059669`), Royal Blue (`#2563eb`), Indigo Purple (`#7c3aed`), Crimson Red (`#dc2626`), Cyber Slate (`#334155`).
   - **Dark Mode Style**: Choice between *Midnight Slate* (Default dark), *OLED True Black*, and *Cyberpunk Glow*.
   - **Accent Lighting**: Toggle glassmorphism intensity (`Off`, `Subtle 12px blur`, `High 24px blur`).
2. **Typography & Layout**:
   - Font family picker (`Inter`, `Plus Jakarta Sans`, `Outfit`, `JetBrains Mono` for developer tables).
   - Global Table Density default (`Compact`, `Normal`, `Spacious`).
   - Border radius scale (`Sharp 4px`, `Standard 8px`, `Pill 16px`).
3. **Enterprise Asset Library**:
   - Brand logo (Light mode SVG/PNG, Dark mode SVG/PNG).
   - Favicon & App Title + Subtitle.
   - Login background art & Watermark for PDF invoice exports.

---

## DOMAIN 2: 🏢 ERP Engine & Dynamic Business Rules

### Key Features:
1. **GST & Billing Engine**:
   - Financial year format (`FY 2026-27`).
   - Auto invoice numbering pattern (`INV/{YYYY}/{0000}`).
   - Default HSN/SAC code (`3923` for Plastic Crates).
   - Tax rounding logic (`Round to nearest Rupee`, `Two decimal places`).
   - Digital signature & Authorized signatory stamp upload.
2. **Manufacturing & Shift Parameters**:
   - Shift 1 (Morning: `06:00 - 14:00`), Shift 2 (Evening: `14:00 - 22:00`), Shift 3 (Night: `22:00 - 06:00`).
   - Standard cycle time per crate (e.g. `24.5 seconds`).
   - Power tariff cost per kWh (`₹8.50/unit`) for real-time energy costing.
3. **Supply Chain & Inventory Safeguards**:
   - HDPE Granule safety stock threshold (`10,000 kg`).
   - Masterbatch color buffer threshold (`500 kg`).
   - Automatic low-stock alert notifications to Procurement Manager.

---

## DOMAIN 3: 🛡️ Identity, RBAC & Security Hardening

### Key Features:
1. **Granular Role-Based Access Control (RBAC)**:
   - Module-level matrix (`SUPER_ADMIN`, `ADMIN`, `OPERATIONS_LEAD`, `ACCOUNTANT`, `OPERATOR`, `AUDITOR`).
   - Actions per module: `VIEW`, `CREATE`, `EDIT`, `DELETE`, `BULK_EXPORT`, `ADMIN_OVERRIDE`.
2. **Session Security & Authentication**:
   - Inactivity auto-logout (`15 mins`, `30 mins`, `60 mins`, `Never`).
   - Concurrent login restriction (`1 active session per user` vs `Multiple allowed`).
   - Password strength enforcement (`Min 8 chars, 1 uppercase, 1 digit, 1 symbol`).
   - Password expiration policy (`Every 90 days` / `Never`).
3. **Network & IP Security**:
   - CIDR / IP Whitelist for Super Admin login (`127.0.0.1`, `192.168.1.0/24`).
   - Failed login attempt threshold before temporary account lock (`5 attempts / 15 min lock`).

---

## DOMAIN 4: 🧩 Extensible Schema & No-Code Custom Fields

### Key Features:
1. **Entity Coverage**:
   - Attach dynamic fields to: `Parties`, `Vendors`, `Products`, `Machines`, `Employees`, `Invoices`, `Transports`.
2. **Field Types Supported**:
   - `TEXT` (Single line), `TEXTAREA` (Multi line), `NUMBER` (Integer/Decimal).
   - `SELECT` (Single choice dropdown), `MULTISELECT` (Checkboxes).
   - `DATE` (Datepicker), `BOOLEAN` (Toggle switch).
   - `CURRENCY` (Formatted with ₹ symbol), `JSON` (Key-Value map).
3. **Validation & Indexing**:
   - `Required` toggle, `Unique constraint` toggle.
   - `Show in Search Table` toggle.
   - Database indexing for rapid filtering without performance penalties.

---

## DOMAIN 5: ⚡ Developer Hub & API Gateways

### Key Features:
1. **API Keys & Scopes**:
   - Generate secure API Bearer tokens with specific permission scopes (`read:sales`, `write:production`, `read:inventory`, `admin:*`).
   - Set token expiration (`30 days`, `90 days`, `1 year`, `Never`) & instant revocation.
2. **Webhook Dispatcher**:
   - Register HTTP webhook URLs for live business triggers:
     - `INVOICE_CREATED`
     - `PAYMENT_COLLECTED`
     - `PRODUCTION_TARGET_MISSED`
     - `SYSTEM_ALERT_CRITICAL`
   - HMAC SHA-256 signature verification & automated retry backoff (3 attempts).
3. **CORS & Rate Limiting**:
   - Allowed CORS origins (`http://localhost:4200`, `https://erp.futaneagro.com`).
   - Rate limit bucket (`100 req/min per IP`).
   - Live WebSocket event broadcast toggle.

---

## DOMAIN 6: 📡 System Governance & Diagnostics

### Key Features:
1. **In-Memory Cache Control (Caffeine)**:
   - Live cache statistics (Hit count, Miss count, Size).
   - `Flush Cache` button for instant cache invalidation across `featureFlags`, `branding`, and `rolePermissions`.
2. **Automated Database Backups**:
   - Backup trigger (`Create Instant Snapshot`).
   - Automated Cron schedule (`Daily at 02:00 AM`, `Weekly`, `Monthly`).
   - Download `.sql` dump file with single click.
3. **Audit Log Retention Policy**:
   - Log retention window (`30 days`, `90 days`, `365 days`, `Keep Forever`).
   - Auto-purge job scheduler.
4. **Live System Diagnostics**:
   - Database ping latency (`< 2ms`).
   - JVM Heap memory telemetry gauge.
   - WebSocket connection status check.

---

## 🛠️ Step-by-Step Implementation Roadmap

1. **Phase 1: Backend Architecture & Schema Migration**
   - Create Liquibase migration `db.changelog-v12-customizations.xml` for `t_core_system_config`, `t_core_api_keys`, and `t_core_webhooks`.
   - Implement `SystemConfigService.java` with Caffeine cache layer.
2. **Phase 2: Developer Hub API & Webhook Service**
   - Implement `ApiKeyController.java` and `WebhookDispatcherService.java`.
   - Add HMAC signature verification in outbound HTTP calls.
3. **Phase 3: Frontend Control Center Reorganization**
   - Refactor `settings.component.html` and `settings.component.ts` into 6 modular sub-views:
     - `[tab === 'appearance']`
     - `[tab === 'business-rules']`
     - `[tab === 'rbac-security']`
     - `[tab === 'custom-fields']`
     - `[tab === 'developer-api']`
     - `[tab === 'governance-diagnostics']`
4. **Phase 4: Real-Time Sync & Visual Polish**
   - Bind CSS variables dynamically to the DOM when theme changes.
   - Add tooltips, copy-to-clipboard for API keys, and payload test buttons for webhooks.
