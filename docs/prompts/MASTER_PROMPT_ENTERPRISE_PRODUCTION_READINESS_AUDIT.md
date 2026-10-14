# ==============================================================================
# MASTER DIRECTIVE: ENTERPRISE FULL-STACK PRODUCTION READINESS & PRE-FLIGHT AUDIT
# REPOSITORY: FUTANE AGRO ERP (INDUSTRIAL PLASTICS & PACKAGING MANUFACTURING)
# ==============================================================================

## 1. MISSION SCOPE & OBJECTIVE
Execute an end-to-end, zero-compromise, 360-degree **Production Readiness Audit & Verification** across the ENTIRE codebase of Futane Agro ERP. 

This directive commands an autonomous, deep-dive examination of:
1. **Frontend UI & User Experience**: Angular 17 Standalone, AOT compilation, 506 kB gzipped production bundle, 19 functional modules, all 265+ interactive buttons, table virtualization/pagination, mathematical modal centering ($0.0\text{px}$ asymmetry), responsive breakpoints, and dark/light themes.
2. **Backend API & Business Logic**: Spring Boot 2.7 (Java 17), zero-tolerance financial ledger & GST invariants, stateless JWT with 2FA OTP verification, RBAC permissions matrix, rate limiting, and RxJS subscription hygiene.
3. **Database & Data Integrity**: MySQL 8.0, 11 Liquibase changelog migration scripts, strict `ddl-auto=none` in production, AES-256-GCM authenticated JPA attribute encryption, and HikariCP connection pool bounds.
4. **DevOps, Security & Deployment Infrastructure**: Multi-stage non-root Dockerfiles, `docker-compose.prod.yml`, Nginx reverse proxy gateway, SSL/TLS Let's Encrypt certificates, HSTS 2-year preload, hardened CSP, and zero-secret git hygiene.

---

## 2. HARDWARE CEILINGS & ZERO-TOLERANCE GUARDRAILS

> **HOST HARDWARE CONTRACT (WINDOWS 11 — 8 GB TOTAL WORKSTATION RAM):**
> Unbounded JVM or Node allocations will freeze the host system. Strict adherence to memory invariants is mandatory:

1. **Memory Allocation Ceilings**:
   - **Node.js (Angular Build / CLI)**: Maximum `1536 MB` (`--max-old-space-size=1536`).
   - **Java Spring Boot JVM**: Maximum `512 MB` (`-Xms256m -Xmx512m`).
   - **Maven CLI (`mvn`)**: Maximum `512 MB` (`backend/.mvn/jvm.config`).
   - **HikariCP Database Connections**: Maximum `8` in UAT/dev, tuned to `50` in production container.
2. **Financial & Business Logic Invariants**:
   - **NEVER** modify GST calculation algorithms (CGST, SGST, IGST 18%), HSN code groupings (`3923`), invoice numbering sequences, financial ledger totals, or database relationships.
   - Invoice numbers must follow the audited pattern: `FA-GST-YYYY-XXXX`.
3. **Network & RxJS Hygiene**:
   - `shareReplay` MUST ALWAYS include `{ bufferSize: 1, refCount: true }` to guarantee unsubscription on component unmount.
   - **Never retry** `401 Unauthorized`, `403 Forbidden`, or `404 Not Found` HTTP responses.
   - Background timers and WebSocket listeners must be strictly guarded by `this.isAuthenticated`.

---

## 3. AUDIT PILLAR 1: FRONTEND ARCHITECTURE, UI & RESPONSIVENESS

### 1.1 Production Bundle & Build Integrity
- Execute strict production build:
  ```bash
  node --max-old-space-size=1536 ./node_modules/@angular/cli/bin/ng.js build --configuration=production
  ```
- **Verification Criteria**:
  - Clean exit code `0` with zero compile errors.
  - Initial bundle size $\le 3.0\text{ MB}$ raw / $\le 600\text{ kB}$ gzip transfer size.
  - Strict Ahead-Of-Time (AOT) compilation, tree-shaking, and differential lazy chunk splitting across all routes.
  - Verify `environment.prod.ts` sets `production: true` and relative base URL `apiUrl: '/api'`.

### 1.2 Universal Pop Cards, Modals & Dossiers Centering
- **Mathematical Centering Invariant**:
  $$\text{Left Workspace Gap} = \text{Right Window Gap} \implies |\text{Left} - \text{Right}| \le 2.0\text{px}$$
- **Anti-Right-Edge Collision**:
  $$\text{Right Edge Position} \le \text{Viewport Width} - 16\text{px}$$
- **Action Button Fold Visibility**:
  - Action buttons (`Save`, `Submit`, `Print`, `Cancel`) MUST remain visible above the viewport fold without scrolling past window bounds.
- **Audit All 24 Modals Across the Application**:
  1. Settings: Company Profile, Bank Account, Department/Teams, Dynamic Schema Field, Notification Template, Invite User, Edit User, RBAC Matrix, Feature Flag Detail, API Key Generator, Webhook Register, DB Restore Confirm, Master Password Confirm.
  2. Operational: Party Client Dossier, Sales Commercial Outward, Invoices Tax Invoice Preview, Salaries Salary Slip, Inventory Stock Adjustment, Vendors Dossier, Production QC Inspection Slip, Dispatch Waybill Manifest, Transports Waybill, Expenses Payment Voucher, Audit Forensic Inspector.

### 1.3 Button Binding & Interactive Event Integrity
- Scan every `<button>` and interactive element across all templates:
  - **Zero Dead Buttons**: Every button must have an active `(click)` binding, `type="submit"`, or `[disabled]` conditional.
  - No unbound sample buttons, empty stubs, or raw unescaped `<` or `>` operators inside inline attributes.
  - Inputs, search queries, and filters must be debounced by 250ms–350ms (`debounceTime(300)`).
  - Every `*ngFor` iterating over entities MUST utilize a `trackBy: trackById` identity function.

### 1.4 Responsive Layout & Theme Harmony
- Test across 4 standard viewports:
  - **Mobile Phone**: $375 \times 667\text{ px}$ (Sidebar auto-collapses to bottom drawer / burger menu).
  - **Tablet**: $768 \times 1024\text{ px}$ (Sidebar mini icon-rail).
  - **Standard Desktop**: $1339 \times 720\text{ px}$ (Standard production workspace).
  - **Full HD**: $1920 \times 1080\text{ px}$ (Maximized enterprise operations console).
- Verify Dark/Light theme switching:
  - Tokenized color variables (`--bg-canvas`, `--bg-card`, `--text-primary`, `--border-color`).
  - No hardcoded contrast clashes or illegible dark text on dark backgrounds.

---

## 4. AUDIT PILLAR 2: BACKEND ARCHITECTURE & BUSINESS LOGIC

### 2.1 Spring Boot Configuration & JVM Tuning
- Validate `application-prod.properties`:
  ```properties
  spring.jpa.hibernate.ddl-auto=none
  spring.liquibase.enabled=false
  spring.jpa.open-in-view=false
  server.compression.enabled=true
  server.compression.min-response-size=1024
  spring.datasource.hikari.maximum-pool-size=50
  spring.datasource.hikari.minimum-idle=10
  ```
- Verify JVM startup parameters:
  `-Xms256m -Xmx512m -Djava.security.egd=file:/dev/./urandom`

### 2.2 Security, Authentication & Session Statelessness
- **Stateless JWT Engine**:
  - `jwt.expiration=900000` (15 minutes).
  - `jwt.refreshExpiration=604800000` (7 days with rotation).
  - Token signing key parameterized via `${JWT_SECRET}` (halt on launch if omitted).
  - 2FA OTP verification required for all administrative roles (`SUPER_ADMIN`, `ADMIN`).
- **Endpoint Authorization (RBAC)**:
  - Verify `SecurityConfig.java`:
    - Public: `/api/users/login`, `/api/users/login/verify`, `/actuator/health`, `/actuator/prometheus`.
    - Protected: Strict role isolation (`SUPER_ADMIN`, `ADMIN`, `ACCOUNTANT`, `OPERATOR`, `VIEWER`).
    - Management: `/actuator/**` restricted to `SUPER_ADMIN`.
    - Shutdown: `/actuator/shutdown` explicitly disabled.

### 2.3 Data Encryption at Rest
- Sensitive entity attributes (GST numbers, bank account numbers, tax PANs) must use authenticated encryption:
  - **Algorithm**: `AES-256-GCM` with 128-bit authentication tags and 12-byte per-record initialization vectors.
  - Automated detection of legacy ciphertext vs GCM format via `AttributeEncryptor.java`.

### 2.4 Performance & Query Optimization
- `@Transactional(readOnly = true)` enforced on all reporting, analytics, and table search endpoints.
- Hibernate JDBC batch writing active: `hibernate.jdbc.batch_size=50`, `order_inserts=true`, `order_updates=true`.
- Caffeine in-memory L2 cache active: 1000 items max size, 600s TTL for reference catalogs.

---

## 5. AUDIT PILLAR 3: DATABASE & SCHEMA MIGRATION

### 5.1 Liquibase Master Changelog
- Verify that [backend/src/main/resources/db/changelog/master.xml](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/backend/src/main/resources/db/changelog/master.xml) includes all 11 release migrations:
  1. `01-init-schemas-users.sql`
  2. `02-create-base-tables.sql`
  3. `03-create-foreign-keys.sql`
  4. `04-create-indexes-partitions.sql`
  5. `05-create-audit-triggers.sql`
  6. `06-create-views-procedures.sql`
  7. `07-data-migration.sql`
  8. `08-razorpay-payment-links.sql`
  9. `01-enterprise-indexes.sql`
  10. `02-performance-indexes.sql`
  11. `03-custom-fields-indexes.sql`
- Verify that production database runs with `ddl-auto=none` to preserve historical financial records and audit triggers.

---

## 6. AUDIT PILLAR 4: DEVSECOPS, CONTAINERS & DEPLOYMENT

### 6.1 Docker Container Hardening
- **Backend Dockerfile**:
  - Multi-stage build on `eclipse-temurin:17-jre-alpine`.
  - Non-privileged runtime user: `USER appuser`.
  - No secret keys, credentials, or `.env` files copied into image layers.
- **Frontend Dockerfile**:
  - Multi-stage build copying `/app/dist/frontend/browser` to Nginx Alpine.
- **Docker Compose Production Stack ([docker-compose.prod.yml](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/docker-compose.prod.yml))**:
  - MySQL 8.0 container with persistent data volume `mysql_prod_data`.
  - Backend container with persistent upload storage `backend_prod_uploads`.
  - Frontend container exposed only internally to Nginx reverse proxy.
  - Gateway Nginx container binding ports 80/443 with Let's Encrypt SSL mounts.

### 6.2 HTTP Security Headers & Web Server Hardening
- **HTTP Strict Transport Security (HSTS)**:
  `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- **Content Security Policy (CSP)**:
  `default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com; img-src 'self' data: blob:; connect-src 'self' https://api.razorpay.com ws: wss:; object-src 'none';`
- **Clickjacking Prevention**: `X-Frame-Options: DENY`
- **MIME Sniffing**: `X-Content-Type-Options: nosniff`
- **CORS Whitelist**: Whitelist restricted to production domains (`https://erp.futaneagro.com`, `https://uat.futaneagro.com`).

---

## 7. AUTOMATED AUDIT EXECUTION SUITE

To execute this audit automatically and generate full empirical proof:

```bash
# 1. Run Angular Production Build & Verify Bundle Size
cd frontend
node --max-old-space-size=1536 ./node_modules/@angular/cli/bin/ng.js build --configuration=production

# 2. Run Comprehensive 24 Pop Card Sizing & Centering Audit
node scripts/audit_and_capture_all_popcards.mjs

# 3. Run Full Settings 11 Subtabs & 265 Buttons Interactive Audit
node scripts/test_all_settings_subtabs_deep.mjs
node scripts/scan_settings_buttons.mjs

# 4. DevSecOps Secret & Git Tracking Hygiene Scan
git ls-files "*.key" "*.pem" "*.pfx" "*.jks" "backups/*.sql" ".env"
```

---

## 8. PRODUCTION GO-LIVE GATEWAY (PASS/FAIL CRITERIA)

| Audit Checkpoint | Target Gate | Pass / Fail Metric |
|---|---|---|
| **Frontend Production Build** | Zero Errors, Gzip Size $\le 600\text{ kB}$ | ✅ MUST PASS |
| **Modal Mathematical Centering** | Asymmetry $\le 2.0\text{ px}$ across all 24 modals | ✅ MUST PASS |
| **Interactive Buttons** | 100% of 265 buttons bound to operational handlers | ✅ MUST PASS |
| **Backend Production Profile** | `ddl-auto=none`, JWT rotation, GZIP enabled | ✅ MUST PASS |
| **Database Encryption** | AES-256-GCM authenticated encryption active | ✅ MUST PASS |
| **DevSecOps Secrets Scan** | Zero tracked cleartext secrets in git history | ✅ MUST PASS |
| **Docker Build Integrity** | Multi-stage, non-root `USER appuser` | ✅ MUST PASS |

---
*Authorized by Futane Agro ERP Engineering Architecture Council — Revision 2026.10*
