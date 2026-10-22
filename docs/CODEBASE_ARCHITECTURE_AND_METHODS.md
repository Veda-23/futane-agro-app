# Futane Agro ERP — Master Codebase & Method Reference Guide

> **Official Developer Guide for Future Changes & Architecture Understanding**  
> *Target Audience:* Full-Stack Developers, AI Assistants, and System Architects maintaining Futane Agro ERP.  
> *Stack:* Spring Boot 2.7.18 (Java 17), Angular 17+ (TypeScript), PostgreSQL 16 Enterprise, Prometheus, Grafana.

---

## 📑 Table of Contents
1. [System Architectural Invariants](#1-system-architectural-invariants)
2. [Backend Core Services Reference](#2-backend-core-services-reference)
   - [DataImportService](#dataimportservice)
   - [PaymentLinkService & RazorpayService](#paymentlinkservice--razorpayservice)
   - [ProductionForecastService](#productionforecastservice)
   - [AiResearchAgentService](#airesearchagentservice)
   - [StorefrontService](#storefrontservice)
   - [TallyExportService](#tallyexportservice)
   - [AuditService](#auditservice)
3. [Security, Auth & Gateway Reference](#3-security-auth--gateway-reference)
   - [AuthController & MfaAuthController](#authcontroller--mfaauthcontroller)
   - [JwtRequestFilter & JwtTokenUtil](#jwtrequestfilter--jwttokenutil)
   - [RateLimitingService](#ratelimitingservice)
   - [FirebaseMfaService](#firebasemfaservice)
4. [Controller Layer & API Contracts](#4-controller-layer--api-contracts)
5. [Database Entity Architecture (PostgreSQL 16)](#5-database-entity-architecture-postgresql-16)
6. [Frontend Angular Architecture & State Management](#6-frontend-angular-architecture--state-management)
   - [ApiService (`api.service.ts`)](#apiservice-apiservicets)
   - [NotificationService (`notification.service.ts`)](#notificationservice-notificationservicets)
   - [Authentication & Role Guard Flow](#authentication--role-guard-flow)
7. [Developer Rules for Future Modifications](#7-developer-rules-for-future-modifications)

---

## 1. System Architectural Invariants

Before making code changes, always observe these strict project rules:
1. **Financial Ledgers & GST Calculations**: NEVER alter invoice calculations, GST algorithms (CGST, SGST, IGST), or ledger totals. They adhere to Indian tax statutes.
2. **RAM Constraints (8 GB Laptop Target)**:
   - Java Spring Boot Heap: Max `512 MB` (`-Xms256m -Xmx512m`).
   - Node V8 Heap: Max `1536 MB` (`--max-old-space-size=1536`).
   - Database Pool: HikariCP Max Pool Size = `8` connections.
3. **Database Relationships**: Table names follow the enterprise prefix structure (`t_core_*`, `t_cfg_*`, `t_crm_*`, `t_fin_*`, `t_inv_*`, `t_prd_*`, `t_sal_*`, `t_hr_*`). All tables use soft deletes (`is_active = true`, `is_deleted = false`).
4. **RxJS Hygiene**: Subscriptions must be guarded by `takeUntil(this.destroy$)` or destroyed in `ngOnDestroy()`. Shared observables must use `shareReplay({ bufferSize: 1, refCount: true })`.

---

## 2. Backend Core Services Reference

### `DataImportService`
**File:** `backend/src/main/java/com/futaneagro/service/DataImportService.java`  
**Purpose:** Handles bulk spreadsheet imports, data cleansing, security sandboxing, and ACID transactional database upserts.

| Method | Inputs | Returns | What It Does & How It Works |
| :--- | :--- | :--- | :--- |
| `previewImport(MultipartFile file, String module)` | `file` (.csv), `module` (string) | `ImportPreviewDTO` | **Dry-Run Validation:** Validates file magic bytes and size ceiling (10MB). Parses CSV lines. Validates required fields, Indian GSTINs, 10-digit mobile numbers, and 12-digit Aadhaar numbers. Checks database for duplicates. Returns preview counts and row error details **without modifying the database**. |
| `executeImport(ImportConfirmRequestDTO request)` | `request` (module, strategy, rows) | `ImportResultDTO` | **Transactional Execution:** Executes inside `@Transactional(rollbackFor = Exception.class)`. If strategy is `"SKIP"`, duplicate rows are skipped. If `"UPDATE"`, existing rows are mutated in-place; new rows are inserted. Writes audit entry to `audit_log`. Rolls back if any SQL exception occurs. |
| `generateSampleCsvTemplate(String module)` | `module` (string) | `byte[]` | **Template Generation:** Returns a pre-populated, RFC 4180-compliant `.csv` file with standard column headers and realistic sample records ready for browser download. |
| `sanitizeFormulaInjection(String value)` | `value` (string) | `String` | **OWASP CSV Security:** Protects against CSV Injection / Formula Execution (DDE). If cell starts with `=`, `+`, `-`, `@`, `\t`, or `\r` (and is not a valid number), prefixes it with `'` so Excel treats it as literal static text. |
| `checkDuplicate(Map<String, Object> r, String module)` | `rowMap`, `module` | `boolean` | **Natural Business Key Matching:** Checks existing records (Parties/Vendors by GST or Name; Production by Date+Shift+Crate; Inventory by Crate+Material; Employees by Aadhaar or Name). |

---

### `PaymentLinkService` & `RazorpayService`
**Files:** `PaymentLinkService.java`, `RazorpayService.java`, `RazorpayWebhookController.java`  
**Purpose:** Online payment processing via Razorpay Payment Gateway, automated webhook signature verification, and ledger reconciliation.

| Method | Inputs | Returns | What It Does & How It Works |
| :--- | :--- | :--- | :--- |
| `createPaymentLink(PaymentLinkRequestDTO dto)` | `dto` (amount, customer, invoiceId) | `PaymentLink` | Generates a secure Razorpay Payment Link (`rzp_link_*`) with SMS/Email notifications enabled, expires in 48 hours, and records pending status in `t_pay_payment_links`. |
| `handleRazorpayWebhook(String payload, String signature)` | Webhook raw body, `X-Razorpay-Signature` | `ResponseEntity` | **Cryptographic Signature Verification:** Computes HMAC-SHA256 of payload with `razorpay.webhook.secret`. If signature matches, transitions invoice to `PAID`, updates party balance, and logs financial transaction. |

---

### `ProductionForecastService`
**File:** `backend/src/main/java/com/futaneagro/service/ProductionForecastService.java`  
**Purpose:** Predictive analytics for daily manufacturing runs (PPD/PPM), crate defect rate minimization, and raw material requirement planning.

| Method | Inputs | Returns | What It Does & How It Works |
| :--- | :--- | :--- | :--- |
| `forecastNext7Days(String crateType)` | `crateType` | `ProductionForecastDTO` | Analyzes rolling 30-day historical PPD output, machine breakdown frequencies, and seasonal demand factors to project expected yields and scrap allowances. |
| `calculateRawMaterialNeeds(int targetCrates, String crateType)` | `targetCrates`, `crateType` | `Map<String, BigDecimal>` | Calculates exact kilograms of Virgin HDPE, Color Masterbatch, and UV Stabilizer needed based on bill of materials (BOM) formulas. |

---

### `AiResearchAgentService`
**File:** `backend/src/main/java/com/futaneagro/service/AiResearchAgentService.java`  
**Purpose:** Multilingual AI copilot for agricultural research, crop protection, and supply chain insights using Google ADK LLM Agents with offline local fallback.

| Method | Inputs | Returns | What It Does & How It Works |
| :--- | :--- | :--- | :--- |
| `queryAdvisory(String prompt, String lang)` | `prompt`, `lang` (`en`, `hi`, `mr`) | `AiAdvisoryResponse` | Queries `gemini-flash-latest` via Google ADK. If internet or API key is absent, seamlessly redirects query to local cached agronomic knowledge base. |

---

### `StorefrontService`
**File:** `backend/src/main/java/com/futaneagro/service/StorefrontService.java`  
**Purpose:** Customer-facing web order placement, live crate catalog streaming, lifecycle tracking, and ERP sales/invoice conversion.

| Method | Inputs | Returns | What It Does & How It Works |
| :--- | :--- | :--- | :--- |
| `getCatalog()` | None | `List<StorefrontCatalogItemDTO>` | Streams standard crate models with dimensions, tare weights, volume tiers, food-grade HDPE ratings, and product images. |
| `createOrder(StorefrontOrderRequest req)` | `req` (items, customer details, address) | `CustomerOrder` | Validates items, generates tracking code (`FA-ORD-YYYY-XXXXX`), auto-syncs buyer to `t_crm_party`, calculates 18% GST and volume freight, and saves initial `ORDER_PLACED` milestone. |
| `getOrderTracking(String orderNumber)` | `orderNumber` | `Map<String, Object>` | Public order lookup returning order headers, line items, and chronological status history. |
| `getOrdersForErp(String status, Pageable pageable)` | `status`, `pageable` | `Page<CustomerOrder>` | Paginated ERP backoffice order processing queue with status filters. |
| `updateOrderStatus(String orderId, OrderStatusUpdateRequest req)` | `orderId`, `req` | `CustomerOrder` | Updates fulfillment state (`APPROVED`, `IN_PRODUCTION`, `PACKED`, `DISPATCHED`, `DELIVERED`) and logs tracking event. |
| `convertOrderToSaleAndInvoice(String orderId)` | `orderId` | `Map<String, Object>` | Converts approved web order to official `Sales` ledger record and generates GST Tax `Invoice`. |

---

### `NotificationBroadcastService`
**File:** `backend/src/main/java/com/futaneagro/service/NotificationBroadcastService.java`  
**Purpose:** Real-time STOMP/SockJS WebSocket message broker for distributed client notifications across ERP operator stations.

| Method | Inputs | Returns | What It Does & How It Works |
| :--- | :--- | :--- | :--- |
| `broadcast(String module, String action, String description)` | `module`, `action`, `description` | `void` | Constructs a `RealtimeNotification` payload and dispatches it over destination `/topic/updates` to connected Angular browsers. |

---

### `TallyExportService`
**File:** `backend/src/main/java/com/futaneagro/service/TallyExportService.java`  
**Purpose:** Generates official TallyPrime / Tally ERP 9 XML Integration documents for statutory accounting sync.

| Method | Inputs | Returns | What It Does & How It Works |
| :--- | :--- | :--- | :--- |
| `exportSalesToTallyXml(LocalDate startDate, LocalDate endDate)` | `startDate`, `endDate` | `String` | Generates standard `<ENVELOPE>` XML schema with `<VOUCHER VCHTYPE="Sales">`, ledger allocations (Party, Sales, CGST, SGST, IGST), and HSN codes. |

---

### `AuditService`
**File:** `backend/src/main/java/com/futaneagro/service/AuditService.java`  
**Purpose:** Non-blocking administrative and financial audit log recorder.

| Method | Inputs | Returns | What It Does & How It Works |
| :--- | :--- | :--- | :--- |
| `getCurrentUser()` | None | `String` | Extracts authenticated username from `SecurityContextHolder` or returns `"SYSTEM"`. |
| `getClientIp()` | None | `String` | Resolves client network address from `X-Forwarded-For` proxy header or request remote address. |
| `log(String action, String tableName, String oldValue, String newValue)` | Action, table, old & new diff | `void` | Persists an immutable forensic audit trail record in `t_core_audit_log`. |

---

### `WhatsAppCloudApiService` & `SmsService` & `EmailService`
**Files:** `WhatsAppCloudApiService.java`, `SmsService.java`, `EmailService.java`  
**Purpose:** Omnichannel transactional notifications (WhatsApp Cloud API, Twilio SMS, and Spring JavaMailSender).

| Service | Method | Purpose |
| :--- | :--- | :--- |
| `WhatsAppCloudApiService` | `sendInvoiceNotification(...)` | Meta Graph API template dispatch with clean E.164 phone normalization and simulation fallback. |
| `SmsService` | `sendOtpSms(...)` | Twilio SMS 2FA passcode delivery with PII masking and message SID audit trail. |
| `SmsService` | `sendWhatsAppPaymentLink(...)` | Twilio WhatsApp interactive invoice reminder delivery. |
| `EmailService` | `sendOtpEmail(...)` | Asynchronous (`@Async`) HTML-templated MFA verification email with XSS escaping. |
| `EmailService` | `sendUserInvitation(...)` | Welcome email containing temporary credentials and system login URL. |
| `EmailService` | `sendPasswordResetEmail(...)` | Emergency administrative password reset token dispatch. |

---

### `ExcelImporterService`
**File:** `backend/src/main/java/com/futaneagro/service/ExcelImporterService.java`  
**Purpose:** Ingests legacy Microsoft Excel (`.xlsx`/`.xls`) spreadsheets for inventory opening stock and party directories.

| Method | Inputs | Returns | What It Does & How It Works |
| :--- | :--- | :--- | :--- |
| `importInventory(String filePath)` | `filePath` | `void` | Apache POI parsing of `"Inventory"` sheet to load crate opening balances into `t_inv_inventory`. |
| `importParty(String filePath)` | `filePath` | `void` | Parses `"Party"` sheet to upsert customer records and contacts into `t_crm_party`. |

---

### `DataSeederService`
**File:** `backend/src/main/java/com/futaneagro/service/DataSeederService.java`  
**Purpose:** Comprehensive synthetic data bootstrap engine for local demo, staging, and automated integration testing.

| Method | Inputs | Returns | What It Does & How It Works |
| :--- | :--- | :--- | :--- |
| `seedAllComprehensiveData()` | None | `Map<String, Object>` | Populates all 18 database domains (Users, Parties, Vendors, Drivers, Machines, PPD, Inventory, Sales, Invoices, Bank) with idempotent pre-checks. |

---

### `ScheduledBackupService`
**File:** `backend/src/main/java/com/futaneagro/service/ScheduledBackupService.java`  
**Purpose:** Nightly database snapshot scheduler (`@Scheduled(cron = "0 30 23 * * ?")`) exporting timestamped `.sql` backups to disk.

---

## 3. Security, Auth & Gateway Reference

### Authentication Workflow
```
[User Login Form] 
       │
       ▼ (POST /api/auth/login)
[RateLimitingService] (Checks max 5 attempts / IP / 60s)
       │
       ▼
[AuthController] (BCrypt verification against t_core_user)
       │
       ├─► If 2FA Enabled: Generates temporary 6-digit OTP -> Sends SMS/Console -> Returns { tempOtp, mfaRequired: true }
       │
       ▼ If Verified (or after POST /api/auth/mfa/verify-otp):
[JwtTokenUtil] (Signs HS512 JWT with 15-min expiry + 7-day refresh token)
       │
       ▼
[Response Headers / Body] (Stored in browser localStorage under 'token' and 'currentUser')
```

### Key Security & Infrastructure Components

- **`SecurityConfig.java` (`backend/src/main/java/com/futaneagro/config/SecurityConfig.java`)**:
  - Stateless session policy (`SessionCreationPolicy.STATELESS`), disabling CSRF (API tokens used) and configuring comprehensive CORS origins.
  - Enforces HSTS (`max-age=31536000; includeSubDomains`), Content Security Policy (`frame-ancestors 'self'`), `X-Content-Type-Options: nosniff`, and `X-Frame-Options: SAMEORIGIN`.
  - Configures granular RBAC endpoint matchers: public routes (`/api/users/login`, `/api/v1/storefront/**`, `/api/health`, `/actuator/**`), pre-auth MFA routes (`/api/users/mfa/**`), and role-restricted admin routes (`/api/admin/**`).
  - Registers `JwtRequestFilter` before `UsernamePasswordAuthenticationFilter`.

- **`JwtUtils.java` (`backend/src/main/java/com/futaneagro/security/JwtUtils.java`)**:
  - Signs and validates HMAC-SHA256 tokens using a secure 256-bit secret key.
  - Generates standard 15-minute access tokens with subject username, roles claim, and unique UUID `jti` for forensic tracking.
  - Generates scoped 5-minute Pre-Auth MFA tokens (`scope: PRE_MFA`) that block general ERP API access until OTP verification succeeds.
  - Generates cryptographically secure 7-day UUID refresh tokens.

- **`JwtRequestFilter.java` (`backend/src/main/java/com/futaneagro/security/JwtRequestFilter.java`)**:
  - Intercepts every inbound HTTP request to extract `Bearer <token>` from the `Authorization` header.
  - Server-side revocation barrier: Checks `TokenBlacklistService.isTokenBlacklisted(token)` to instantly invalidate logged-out sessions before expiration.
  - MFA Scope Firewall: If the token has `scope: PRE_MFA`, strictly blocks requests unless the path matches `/api/users/mfa/*`.
  - Reconstructs Spring Security `UsernamePasswordAuthenticationToken` with extracted roles and registers it in `SecurityContextHolder`.

- **`FirebaseMfaService.java` (`backend/src/main/java/com/futaneagro/mfa/FirebaseMfaService.java`)**:
  - Validates client-side Firebase Phone Auth SMS ID tokens using the Google Firebase Admin SDK.
  - Anti-Replay Token Barrier: Computes SHA-256 of the token, queries `t_core_mfa_used_token`, rejects previously used tokens, and stores consumed hashes.
  - Phone Matching: Verifies that the phone number attested in the Firebase token matches the user's enrolled phone number.
  - Emergency Recovery Codes: Generates 10 cryptographically random 10-character codes, hashed using BCrypt before persisting into `t_core_mfa_recovery_code`.

- **`PerformanceLoggingAspect.java` (`backend/src/main/java/com/futaneagro/config/PerformanceLoggingAspect.java`)**:
  - AspectJ AOP interceptor around all `@RestController` endpoints.
  - Measures execution latency; if runtime exceeds 200ms, logs a high-visibility `[SLOW API]` alert to pinpoint slow queries and bottlenecks.

- **`WebSocketConfig.java` (`backend/src/main/java/com/futaneagro/config/WebSocketConfig.java`)**:
  - Configures STOMP messaging broker with `/topic` outbound broadcast and `/app` inbound application destinations.
  - Registers `/ws-erp` SockJS fallback endpoint with CORS origins allowed.

- **`AsyncConfig.java` (`backend/src/main/java/com/futaneagro/config/AsyncConfig.java`)**:
  - Configures Spring `@EnableAsync` thread pool: core size 4, max size 16, queue capacity 100, thread prefix `FutaneAsync-`.
  - Provides thread isolation so long-running email, SMS, and backup tasks never block HTTP threads.

- **`AuditorAwareImpl.java` (`backend/src/main/java/com/futaneagro/config/AuditorAwareImpl.java`)**:
  - Supplies the authenticated user principal to Spring Data JPA's `@CreatedBy` and `@LastModifiedBy` audit fields on `BaseEntity`.

- **`RazorpayConfig.java` (`backend/src/main/java/com/futaneagro/config/RazorpayConfig.java`)**:
  - Configures and initializes the singleton `RazorpayClient` bean with configured Key ID and Secret.

- **`RateLimitingService.java` (`backend/src/main/java/com/futaneagro/security/RateLimitingService.java`)**:
  - In-memory token bucket rate limiter. Protects sensitive endpoints (`LOGIN`: 5 req/min, `REGISTER`: 3 req/min, `DATA_IMPORT`: 10 req/min).

---

## 4. Controller Layer & API Contracts

All controllers reside in `com.futaneagro.controller`. Standard HTTP Status Codes returned:
- `200 OK`: Successful query or update.
- `201 CREATED`: Resource inserted.
- `400 BAD REQUEST`: Validation failure (missing required field, bad regex).
- `401 UNAUTHORIZED`: Invalid or expired JWT token.
- `403 FORBIDDEN`: Current role does not have permission (`@PreAuthorize`).
- `409 CONFLICT`: Duplicate entity (e.g. username, email, GST number already taken).
- `429 TOO MANY REQUESTS`: Rate limit triggered by IP.

### `AuthController` (`/api/users`)
| Endpoint | Method | Role | Purpose |
| :--- | :--- | :--- | :--- |
| `/register` | POST | Public | Validates user input, checks uniqueness, hashes password with BCrypt, assigns VIEWER/OPERATOR/ACCOUNTANT role. |
| `/login` | POST | Public | Rate-limited (5/min). Verifies credentials against BCrypt hash, checks 30-min lockout, triggers 2FA or in-memory OTP. |
| `/login/verify` | POST | Public | Verifies 6-digit OTP, deletes OTP from cache, mints 15-minute JWT access token + 7-day UUID refresh token. |
| `/verify-session` | GET | Public | Validates JWT token from cookie or Authorization header and returns current user permissions. |
| `/refresh-token` | POST | Public | Implements single-use token rotation: invalidates old refresh token and issues a fresh JWT and refresh token. |
| `/change-password` | PUT | Authenticated | IDOR-guarded password change with 8-character complexity and full session revocation. |
| `/logout` | POST | Authenticated | Blacklists active JWT in `TokenBlacklistService` with TTL matching token expiry and purges user refresh tokens. |

### `ProductionController` (`/api`)
| Endpoint | Method | Role | Purpose |
| :--- | :--- | :--- | :--- |
| `/ppd` | GET | Authenticated | Read-only query fetching all active daily production run records. |
| `/ppd` | POST | Authenticated | Creates a daily production entry, automatically increments `t_inv_inventory.produced_stock`, and broadcasts WebSocket event. |
| `/ppd/{id}` | PUT | Authenticated | Updates daily run with inventory delta re-calculation and before/after audit tracking. |
| `/ppd/{id}` | DELETE | Authenticated | Soft-deletes daily run (`is_active = false`) and subtracts crates from inventory stock. |
| `/ppm` | GET / POST / PUT | Authenticated | Aggregates monthly production output, kWh electricity consumption, and utility billing. |
| `/forecast/demand/{months}` | GET | Authenticated | 7-day and multi-month predictive demand projection based on historical PPD runs. |
| `/raw-materials` | GET / POST / PUT | Authenticated | Inbound plastic polymer granule deliveries, vendor weighment slips, and billing attachments. |

### `SalesController` (`/api`)
Commercial operations, automated tax invoicing, ledger collection, and Tally Prime XML accounting sync:
| Endpoint | Method | Role | Purpose |
| :--- | :--- | :--- | :--- |
| `/sales` | GET | Authenticated | Read-only fetch of all active sales orders across customers. |
| `/sales` | POST | SUPER_ADMIN, ADMIN, ACCOUNTANT, OPERATOR | Creates a sale, enforces server-side `calculateTotals()`, increments finished inventory `soldStock`, and auto-generates linked `Invoice` (`INV-YYYYMMDD-{id}`). |
| `/sales/{id}` | PUT | SUPER_ADMIN, ADMIN, ACCOUNTANT, OPERATOR | Updates sales order, computes delta differences on finished inventory sold stock, and recalculates financial balances. |
| `/sales/{id}` | DELETE | SUPER_ADMIN, ADMIN | Soft-deletes sales order, reverts sold stock from inventory, and cascades soft-delete to linked tax invoices. |
| `/payments` | GET | Authenticated | Lists all customer payment receipts across bank accounts and invoices. |
| `/payments` | POST | SUPER_ADMIN, ADMIN, ACCOUNTANT | Records payment collection, applies amount against invoice balance, updates `sales.paid` & `sales.remaining`, and prevents overpayment errors. |
| `/payments/{id}` | PUT | SUPER_ADMIN, ADMIN, ACCOUNTANT | Updates payment metadata (mode, date). Prohibits direct amount changes to preserve ledger idempotency. |
| `/payments/{id}` | DELETE | SUPER_ADMIN, ADMIN | Soft-deletes payment receipt and reverses the amount from the invoice's remaining balance. |
| `/invoices` | GET | Authenticated | Read-only registry of all issued GST tax invoices. |
| `/reports/tally-xml` | GET | Authenticated | Generates Z-01 specification Tally Prime XML sales vouchers with CGST/SGST/IGST breakdown for direct statutory accounting ingestion. |

### `AdminControlCenterController` (`/api/admin`)
Enterprise administration, tenant branding, dynamic RBAC, custom fields, and developer hub:
| Endpoint | Method | Role | Purpose |
| :--- | :--- | :--- | :--- |
| `/branding` | GET / POST | SUPER_ADMIN (POST) | Retrieves or updates corporate display name, brand palette, and themes with Caffeine cache invalidation. |
| `/branding/logo-upload` | POST | SUPER_ADMIN | Multi-part corporate logo upload with extension checks, MIME magic byte sniffing, and path traversal protection. |
| `/teams` | GET / POST / PUT | SUPER_ADMIN (Mutations) | Hierarchical department management enriched with live user and employee headcounts. |
| `/teams/{id}/deactivate` | PATCH / DELETE | SUPER_ADMIN | Soft-deactivates an organizational department. |
| `/users` | GET | SUPER_ADMIN, ADMIN | Lists user accounts with account lock flags, failed login attempts, and force-password-reset indicators. |
| `/users/invite` | POST | SUPER_ADMIN | Creates user account, generates 16-char crypto password, hashes with BCrypt, dispatches invite email (zero password leakage in response). |
| `/users/{username}/reset-password` | POST | SUPER_ADMIN | Emergency administrative password reset, unlocking account and emailing temporary credential. |
| `/users/{username}` | PUT | SUPER_ADMIN, ADMIN | Updates profile metadata with strict SUPER_ADMIN checks on role elevation. |
| `/permissions` | GET / POST | SUPER_ADMIN (POST) | Manages granular CRUD permissions per role per module. Guarded against SUPER_ADMIN role tampering. |
| `/features` | GET | Authenticated | Returns operational status of all modular system feature flags. |
| `/features/{moduleKey}/toggle` | POST | SUPER_ADMIN | Dynamic zero-downtime runtime toggle of ERP features (WhatsApp, B2B storefront, GPS). |
| `/custom-fields/{entityName}` | GET / POST | SUPER_ADMIN (POST) | Declares or retrieves dynamic metadata attributes (TEXT, NUMBER, DATE, SELECT) on domain models without DDL changes. |
| `/custom-fields/values/{entity}/{id}` | GET / POST | Authenticated | Reads or saves dynamic custom attribute values for individual business records. |
| `/api-keys` | GET / POST / DELETE | SUPER_ADMIN (POST/DEL) | Generates high-entropy API tokens (`fa_live_...`) with masked prefixes and granular OAuth scopes. |
| `/webhooks` | GET / POST / DELETE | SUPER_ADMIN (POST/DEL) | Configures external HTTP POST event subscribers with shared HMAC-SHA256 secrets. |
| `/cache/stats` & `/cache/flush` | GET / POST | SUPER_ADMIN | Inspects Caffeine hit/miss ratios or purges all in-memory cache regions. |
| `/governance/diagnostics` | GET | SUPER_ADMIN | Live JVM memory telemetry, thread counts, and DB latency measurements. |
| `/governance/backup/export` | GET | SUPER_ADMIN | Downloads comprehensive JSON snapshot of companies, banks, templates, and flags. |
| `/billing/companies` | GET / POST / DELETE | SUPER_ADMIN (Mutations) | Multi-company statutory tax entities; enforces single default billing company invariant. |
| `/billing/banks` | GET / POST / DELETE | SUPER_ADMIN (Mutations) | Settlement bank registry; enforces single primary settlement account invariant. |
| `/billing/invoice-template` | GET / POST | SUPER_ADMIN (POST) | Configures thermal and A4 print layout, column visibility, and legal disclaimers. |
| `/notifications/templates` | GET / POST | SUPER_ADMIN (POST) | Configurable regulatory DLT WhatsApp and SMS notification templates with placeholder interpolation. |
| `/system-health` | GET | SUPER_ADMIN | Probes WebSocket broker, cache manager, PostgreSQL DB, and mail server health. |
| `/sessions/force-logout-all` | POST | SUPER_ADMIN | Emergency cluster-wide session invalidation via broadcasted WebSocket disconnect. |

### `DataImportController` (`/api/data-import`)
| Endpoint | Method | Role | Purpose |
| :--- | :--- | :--- | :--- |
| `/preview` | POST | Admin/Operator | Dry-run CSV validation, regex checks, and duplicate identification without mutating PostgreSQL. |
| `/confirm` | POST | Admin/Operator | ACID transactional batch execution with user-selected duplicate resolution (SKIP or UPDATE). |
| `/template/{module}` | GET | Authenticated | Direct file download of pre-formatted, RFC 4180-compliant `.csv` template with realistic sample data. |

### `PartyController` (`/api`)
| Endpoint | Method | Role | Purpose |
| :--- | :--- | :--- | :--- |
| `/parties` | GET / POST | Authenticated | Customer & dealer directory with stateful pagination, regex search, GSTIN validation, and PAN extraction. |
| `/parties/{id}` | GET / PUT / DELETE | Authenticated | Party profile management, billing address updates, and soft-deletion lifecycle. |
| `/vendors` | GET / POST / PUT / DELETE | Authenticated | Supplier & raw material vendor directory with contact info and payment terms. |
| `/drivers` | GET / POST / PUT / DELETE | Authenticated | Logistics driver registry, license tracking, and dispatch assignment. |

### `InventoryController` (`/api/inventory`)
| Endpoint | Method | Role | Purpose |
| :--- | :--- | :--- | :--- |
| `/inventory` | GET / POST | Authenticated | Finished goods crate inventory registry tracking `currentStock = (opening + produced) - sold`. Broadcasts WebSocket events. |
| `/inventory/{id}` | PUT / DELETE | Authenticated | Inventory adjustments, warehouse stock reconciliation, and soft-delete archival. |

### `DashboardController` (`/api/dashboard`)
| Endpoint | Method | Role | Purpose |
| :--- | :--- | :--- | :--- |
| `/stats` | GET | Authenticated | Executive KPI indicators computed via direct SQL sums (today/monthly production, revenue, stock, expenses, payroll). Cached. |
| `/charts` | GET | Authenticated | Synthesizes production monthly bars, chronological sales growth line chart, and top customers distribution. Cached. |
| `/import` | POST | SUPER_ADMIN, ADMIN | Secure bulk Excel import with 10MB limit, magic-byte checks, and cache eviction. |

### `HRController` (`/api`)
| Endpoint | Method | Role | Purpose |
| :--- | :--- | :--- | :--- |
| `/employees` | GET / POST | Authenticated | Factory staff registry, Aadhaar KYC, bank accounts, and cached employee rosters. |
| `/employees/{id}` | PUT / DELETE | Authenticated | Personnel data updates and soft-deletion offboarding. |
| `/salaries` | GET / POST | Authenticated | Monthly payroll ledger, wage liabilities, and voucher disbursement tracking. |
| `/salaries/{id}` | PUT / DELETE | Authenticated | Salary amount adjustment, payout status clearance, and cancellation. |

### `TransportController` (`/api/transports`)
| Endpoint | Method | Role | Purpose |
| :--- | :--- | :--- | :--- |
| `/transports` | GET / POST | Authenticated | Logistics freight dispatches, truck registration numbers, assigned drivers, hire rent, and cash advances. |
| `/transports/{id}` | PUT / DELETE | Authenticated | Weighbridge freight adjustments, proof-of-delivery attachments, and soft-deletion. |

### `UploadController` (`/api/uploads`)
| Endpoint | Method | Role | Purpose |
| :--- | :--- | :--- | :--- |
| `/upload` | POST | Staff Roles | Secure file upload with magic-byte validation, UUID prefix salting, and anti-path traversal checks. |
| `/{filename}` | GET | Authenticated | Streams confidential documents with `attachment` disposition and `nosniff` headers. |
| `/branding/{filename}` | GET | Public | Serves cached public corporate branding logos with strict `.png/.jpg/.svg` verification. |

### `PaymentLinkController` (`/api/sales`)
| Endpoint | Method | Role | Purpose |
| :--- | :--- | :--- | :--- |
| `/{saleId}/payment-link` | POST | Admin/Accountant | Creates Razorpay hosted payment link for WhatsApp/SMS dispatch. |
| `/{saleId}/checkout/order` | POST | Admin/Accountant | Generates Razorpay Order ID for in-app standard web modal checkout. |
| `/checkout/verify` | POST | Public/Auth | Validates HMAC-SHA256 signature and records automated receipt in sales ledger. |

### `RazorpayWebhookController` (`/api/webhooks`)
| Endpoint | Method | Role | Purpose |
| :--- | :--- | :--- | :--- |
| `/razorpay` | POST | Public (Webhook) | Asynchronous Razorpay webhook ingestion with constant-time HMAC-SHA256, 5-minute anti-replay, and idempotency cache. |

### `MfaAuthController` (`/api/users/mfa`)
| Endpoint | Method | Role | Purpose |
| :--- | :--- | :--- | :--- |
| `/verify-firebase-otp` | POST | Pre-Auth | Validates Firebase SMS OTP token and exchanges for full ERP JWT. |
| `/verify-recovery-code` | POST | Pre-Auth | Emergency fallback using single-use hashed recovery code. |
| `/status` | GET | Authenticated | Returns current user's 2FA enrollment status, factor type, and remaining codes. |
| `/enroll` | POST | Authenticated | Enrolls user into Phone MFA and returns 10 emergency recovery codes. |
| `/disable` | POST | Authenticated | Disables 2FA with mandatory password confirmation. |
| `/regenerate-recovery-codes`| POST | Authenticated | Re-mints 10 emergency recovery codes with password confirmation. |

### `EnterpriseController` (`/api`)
| Endpoint | Method | Role | Purpose |
| :--- | :--- | :--- | :--- |
| `/machines` | GET / POST / PUT / DEL | Authenticated | Plant machinery inventory, capacity per hour, manufacturer, and warranty tracking. |
| `/breakdowns` | GET / POST / PUT / DEL | Authenticated | Mechanical stoppage logs, downtime hours, technician resolution, and root cause notes. |
| `/dispatches` | GET / POST / PUT / DEL | Authenticated | Outbound vehicle dispatches and transit status tracking. |
| `/expenses` | GET / POST / PUT / DEL | Authenticated | Category-based operational expense accounting. |
| `/bank-transactions` | GET / POST / PUT / DEL | Authenticated | Bank account ledger inflows and outflows. |
| `/settings` | GET / POST | SUPER_ADMIN (POST) | System configuration properties (PowerBI URLs, operational flags). |
| `/settings/backup` & `/restore`| POST | SUPER_ADMIN | Physical database SQL dumps and restorations via isolated process executions. |

### `Storefront & B2B Web Orders` (`/api/v1/storefront` & `/api/erp/web-orders`)
| Endpoint | Method | Role | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/v1/storefront/catalog` | GET | Public | Public catalog streaming available crates, materials, and colors. |
| `/api/v1/storefront/orders` | POST | Public | Customer wholesale purchase order placement with tracking generation. |
| `/api/v1/storefront/track/{num}`| GET | Public | Public order fulfillment tracking lookup. |
| `/api/erp/web-orders` | GET | Authenticated | Paginated ERP order processing queue with status filters. |
| `/api/erp/web-orders/{id}/status`| PUT | Authenticated | Updates order fulfillment progress (Approved, In Production, Dispatched). |
| `/api/erp/web-orders/{id}/create-sale`| POST | Authenticated | Converts approved web order directly into official ERP commercial sale and invoice. |

### `AdkCopilotController` (`/api/adk`)
| Endpoint | Method | Role | Purpose |
| :--- | :--- | :--- | :--- |
| `/chat` | POST | Authenticated | Stateful multi-turn conversational AI copilot assistant for natural language ERP queries. |
| `/session/reset` | POST | Authenticated | Resets dialog context and memory for a new session. |
| `/research` | POST | Authenticated | Autonomous intelligence research on polymers, raw materials, and GST advisory. |

### `HealthController` & `AuditLogController`
| Endpoint | Method | Role | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/health` | GET | Public | Minimal liveness probe for load balancers and container monitoring (`{"status": "UP"}`). |
| `/api/admin/env` | GET | SUPER_ADMIN | Diagnostics probe reporting active profile and DataSource connectivity. |
| `/api/audit-logs` | GET / POST | SUPER_ADMIN | Master audit trail log inspector with entity snapshots before and after mutation. |
| `/api/dev/seed-data` | POST | SUPER_ADMIN | Comprehensive mock fixture generator (hard-blocked in production profiles). |

---

## 5. Database Entity & Repository Architecture (PostgreSQL 16)

The application models 42 JPA entities mapping to relational tables in PostgreSQL:

```
                       ┌─────────────────────────┐
                       │       t_core_user       │ (Users, Roles, MFA)
                       └────────────┬────────────┘
                                    │
          ┌─────────────────────────┼────────────────────────┐
          │                         │                        │
          ▼                         ▼                        ▼
  ┌───────────────┐         ┌───────────────┐        ┌───────────────┐
  │  t_crm_party  │         │  t_prd_ppd    │        │t_inv_inventory│
  └───────┬───────┘         └───────┬───────┘        └───────────────┘
          │                         │
          ▼                         ▼
  ┌───────────────┐         ┌───────────────┐
  │ t_fin_invoice │         │t_log_dispatch │
  └───────────────┘         └───────────────┘
```

### Base Architecture Invariants (`BaseEntity.java`)
- **Primary Key:** UUID v4 String (`CHAR(36)`), immutable, auto-generated on creation.
- **Audit Logging:** Handled via Spring Data JPA `@EntityListeners(AuditingEntityListener.class)` tracking `@CreatedBy`, `@CreatedDate`, `@LastModifiedBy`, and `@LastModifiedDate`.
- **Optimistic Locking:** Protected by `@Version private Long version` to prevent concurrent write collisions under multi-user operational loads.
- **Soft Deletion Pattern:** Managed by Hibernate `@SQLDelete` updating `is_deleted = true, is_active = false, deleted_date = NOW()`, with read filtering enforced via `@Where(clause = "is_active = true AND is_deleted = false")`.
- **Sensitive Field Encryption:** Handled via AES-256 `@Convert(converter = AttributeEncryptor.class)` on statutory tax and banking attributes (`Party.gstNumber`, `Vendor.gstNumber`, `Employee.bankAccount`).

---

### Entity Catalog by Functional Domain

#### 1. Core Identity & Governance
| Entity Class | Table Name | Key Attributes & Constraints | Notes & Invariants |
| :--- | :--- | :--- | :--- |
| **`BaseEntity`** | *N/A (Abstract)* | `id`, `created_date`, `created_by`, `last_modified_date`, `last_modified_by`, `version`, `is_active`, `is_deleted` | JPA MappedSuperclass providing UUID PK, auditing, optimistic lock, and soft delete. |
| **`User`** | `t_core_user` | `username` (unique), `password`, `email`, `role`, `mfa_enabled`, `phone_number`, `failed_attempts`, `locked_until` | Password protected via `@JsonProperty(access = WRITE_ONLY)`. Auto-locks after 5 failed login attempts. |
| **`UserMfaRecoveryCode`**| `t_user_mfa_recovery_codes` | `user_id`, `code_hash`, `used`, `used_at`, `created_date` | BCrypt-hashed one-time emergency MFA recovery codes. |
| **`MfaUsedToken`** | `t_mfa_used_tokens` | `token_hash` (unique), `user_id`, `expires_at` | Prevents replay attacks on TOTP and Firebase SMS tokens. |
| **`RolePermission`** | `t_core_role_permissions` | `role`, `module_key` (unique composite), `can_view`, `can_create`, `can_edit`, `can_delete`, `can_export` | Dynamic RBAC entitlement matrix. |
| **`FeatureFlag`** | `t_sys_feature_flags` | `module_key` (unique), `module_name`, `category`, `enabled`, `icon` | Runtime modular toggles without application restart. |
| **`ApiKey`** | `t_core_api_keys` | `api_key` (unique), `key_prefix`, `scopes`, `expires_at`, `last_used_at` | External B2B API integration authentication. |
| **`WebhookConfig`** | `t_core_webhooks` | `name`, `endpoint_url`, `event_type`, `secret_token`, `retry_count`, `last_status_code` | Outbound event dispatches with HMAC SHA-256 signature verification. |
| **`Team`** | `t_core_team` | `name`, `code` (unique), `icon`, `color_tag`, `sidebar_order`, `show_in_sidebar` | Departmental divisions and navigation sequence. |
| **`Branch`** | `t_branches` | `branch_name`, `branch_code` (unique), `location`, `is_main_plant` | Multi-facility plant and regional depot network. |

#### 2. Commercial Sales & CRM
| Entity Class | Table Name | Key Attributes & Constraints | Notes & Invariants |
| :--- | :--- | :--- | :--- |
| **`Party`** | `t_crm_party` | `party_name` (unique), `party_contact` (unique), `party_address`, `gst_number` (encrypted) | Wholesaler/buyer master. GSTIN validated against Indian format regex `\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}`. |
| **`Sales`** | `t_sal_sales` | `party_id`, `rate`, `quantity`, `bill_amount`, `gst_rate`, `cgst`, `sgst`, `total_amount`, `paid_amount`, `remaining` | Core commercial ledger. Enforces `calculateTotals()` in `@PrePersist`/`@PreUpdate` with statutory 50/50 CGST+SGST split. |
| **`Invoice`** | `t_fin_invoice` | `invoice_no` (unique), `sale_id`, `date`, `total_amount`, `paid_amount`, `remaining` | Formal tax invoices. Linked via `@ManyToOne` to `Sales`. |
| **`PaymentCollection`**| `t_fin_payment` | `sale_id`, `party_id`, `date`, `amount`, `payment_mode`, `reference_no` | Customer collection receipts. Reconciles sales balance and payment ledger. |
| **`PaymentLink`** | `t_pay_payment_links` | `sale_id`, `razorpay_payment_link_id` (unique), `short_url`, `amount`, `status` | Razorpay digital invoice collection links with WhatsApp reminders. |

#### 3. Manufacturing & Plant Operations
| Entity Class | Table Name | Key Attributes & Constraints | Notes & Invariants |
| :--- | :--- | :--- | :--- |
| **`MachineMaster`** | `t_prd_machine_master` | `machine_name` (unique), `machine_code`, `capacity_per_hour`, `manufacturer`, `status` | Injection molding machinery assets. Capacity fallback: 600 crates/hour. |
| **`MachineBreakdown`**| `t_prd_breakdown` | `machine_id`, `date`, `issue`, `resolved_by`, `downtime` (minutes) | Unscheduled plant equipment downtime logs. |
| **`Ppd`** | `t_prd_ppd` | `date`, `shift`, `crate_type`, `planned`, `successful`, `damaged`, `efficiency` | Daily production tally per machine shift. Computes efficiency % automatically. |
| **`Ppm`** | `t_prd_ppm` | `year`, `month`, `crate_type`, `total_produced`, `electricity_units`, `power_bill` | Monthly production telemetry and electrical utility power cost analysis. |

#### 4. Inventory, Materials & Procurement
| Entity Class | Table Name | Key Attributes & Constraints | Notes & Invariants |
| :--- | :--- | :--- | :--- |
| **`Inventory`** | `t_inv_inventory` | `crate_type`, `material_type`, `opening_stock`, `produced_stock`, `soldStock`, `current_stock` | Finished crate warehouse stock. Invariant formula: `currentStock = (openingStock + producedStock) - soldStock`. |
| **`RawMaterial`** | `t_inv_raw_material` | `date`, `material_name`, `vendor_id`, `weight`, `rate`, `amount`, `purchase_bill_path` | Polymer granules, masterbatch, and resin inward weighbridge shipments. Formula: `amount = weight * rate`. |
| **`Vendor`** | `t_crm_vendor` | `vendor_name` (unique), `mobile` (unique), `address`, `gst_number` (encrypted) | Petrochemical resin and equipment supplier master. |
| **`StockTransfer`** | `t_stock_transfers` | `transfer_date`, `source_branch_id`, `destination_branch_id`, `crate_type`, `quantity`, `status` | Inter-branch finished crate rebalancing (`IN_TRANSIT`, `RECEIVED`, `CANCELLED`). |

#### 5. Logistics & Fleet Fleet
| Entity Class | Table Name | Key Attributes & Constraints | Notes & Invariants |
| :--- | :--- | :--- | :--- |
| **`Driver`** | `t_hr_driver` | `driver_name`, `mobile`, `license_number`, `address` | Commercial truck drivers directory with RTO driving license records. |
| **`Transport`** | `t_log_transport` | `date`, `truck_number`, `driver_id`, `rent`, `advance`, `remaining` | Freight manifest. Invariant: `remaining = rent - advance` on `@PrePersist`/`@PreUpdate`. |
| **`Dispatch`** | `t_log_dispatch` | `dispatch_number` (unique), `sale_id`, `vehicle_number`, `driver_name`, `date`, `status` | Outward gate pass supervisor for loaded transport vehicles. |

#### 6. Human Resources & Payroll
| Entity Class | Table Name | Key Attributes & Constraints | Notes & Invariants |
| :--- | :--- | :--- | :--- |
| **`Employee`** | `t_hr_employee` | `employee_name`, `mobile`, `aadhaar_number`, `bank_account` (encrypted), `salary` | Staff roster. 12-digit Aadhaar validation regex `^\d{12}$`. |
| **`EmployeeSalary`** | `t_hr_salary` | `employee_id`, `month`, `year`, `salary`, `payment_status`, `payment_date` | Monthly wage disbursements (`Pending`, `Paid`, `Cancelled`). |

#### 7. Treasury & Financial Accounting
| Entity Class | Table Name | Key Attributes & Constraints | Notes & Invariants |
| :--- | :--- | :--- | :--- |
| **`Expense`** | `t_fin_expense` | `date`, `category`, `amount`, `description` | Factory operating overheads. Pattern: `Fuel|Diesel|Electricity|Repair|Office|...`. |
| **`BankTransaction`**| `t_fin_transaction` | `date`, `mode` (`Cash`, `Bank`, `UPI`), `amount`, `type` (`Debit`, `Credit`) | Corporate passbook ledger tracking treasury inflows and outflows. |
| **`BankProfile`** | `t_cfg_bank_profiles` | `bank_name`, `account_holder_name`, `account_number`, `ifsc_code`, `upi_id`, `is_primary` | Bank account profiles and dynamic UPI QR code parameters for invoice printouts. |
| **`CompanyProfile`** | `t_cfg_company_profiles` | `company_name`, `trade_name`, `gstin`, `pan`, `cin`, `state_code` ("27") | Statutory corporate identity and legal jurisdiction configuration. |

#### 8. B2B Customer Storefront
| Entity Class | Table Name | Key Attributes & Constraints | Notes & Invariants |
| :--- | :--- | :--- | :--- |
| **`CustomerOrder`** | `t_ord_customer_orders` | `order_number` (unique), `customer_name`, `customer_mobile`, `grand_total`, `order_status` | B2B web storefront purchase order header. Bridges to ERP sale via `erpSaleId`. |
| **`OrderItem`** | `t_ord_order_items` | `order_id`, `crate_type`, `color`, `embossing_text`, `quantity`, `unit_price`, `gross_amount` | Individual product specification line items with custom branding options. |
| **`OrderTrackingEvent`**| `t_ord_tracking_events`| `order_id`, `step_key`, `title`, `description`, `vehicle_number`, `event_time` | Real-time buyer tracking milestone events. |

#### 9. Dynamic Customization & Auditing
| Entity Class | Table Name | Key Attributes & Constraints | Notes & Invariants |
| :--- | :--- | :--- | :--- |
| **`CustomFieldDefinition`**| `t_sys_custom_field_def` | `entity_name`, `field_key`, `field_label`, `field_type`, `options_json`, `is_required` | Zero-code schema extension metadata for Parties, Vendors, Employees, and Machines. |
| **`CustomFieldValue`** | `t_sys_custom_field_val` | `field_def_id`, `entity_name`, `entity_record_id`, `field_value` | Entity-Attribute-Value (EAV) storage for tenant custom fields. |
| **`NotificationTemplate`**| `t_cfg_notification_templates`| `event_key`, `channel`, `template_name`, `template_text`, `dlt_template_id` | Automated WhatsApp, SMS, and Email alert templates with Indian DLT compliance. |
| **`InvoiceTemplateConfig`**| `t_cfg_invoice_templates`| `template_name`, `invoice_title`, `terms_and_conditions`, `jurisdiction_clause`, `primary_color_hex` | Legal invoice layout configuration and printing terms. |
| **`Settings`** | `t_sys_settings` | `config_key`, `config_value` | Global runtime key-value configuration store. |
| **`AuditLog`** | `audit_log` | `username`, `action`, `table_name`, `old_value`, `new_value`, `ip_address`, `timestamp` | Application-level mutation changelog. |
| **`SecurityAuditLog`** | `security_audit_logs` | `event_type`, `severity`, `username`, `client_ip`, `user_agent`, `details`, `timestamp` | Immutable forensic security event trail for ISO 27001, SOC 2, and DPDP Act 2023. |

---

### Repository Layer Architecture (`backend/src/main/java/com/futaneagro/repository/`)

The repository tier leverages Spring Data JPA with zero-overhead performance patterns:

1. **Eager Fetch Entity Graphs (`@EntityGraph`):**
   - Eliminates the N+1 select problem by fetching associated entities via SQL `LEFT OUTER JOIN` in a single query roundtrip:
     - `SalesRepository`: `@EntityGraph(attributePaths = {"party"})`
     - `InvoiceRepository`: `@EntityGraph(attributePaths = {"sale", "sale.party"})`
     - `RawMaterialRepository`: `@EntityGraph(attributePaths = {"vendor"})`
2. **Coalesced Aggregate Queries:**
   - Enforces `COALESCE(SUM(...), 0)` across financial, inventory, and production metrics (`SalesRepository.sumTotalAmount()`, `InventoryRepository.sumCurrentStock()`, `RawMaterialRepository.sumTotalWeight()`, `PpdRepository.sumSuccessfulByDate()`) to ensure queries return valid zeroes instead of `null` on new installations.
3. **Forensic Threat Aggregation:**
   - `SecurityAuditLogRepository` executes real-time brute-force intrusion detection via `findTopAttackingIps()` grouping failed logins by client IP within sliding time windows.
4. **Case-Insensitive Authentication:**
   - `UserRepository` enforces `findByUsernameIgnoreCase()` and `findByEmailIgnoreCase()` to eliminate case-sensitivity vulnerabilities during credential verification.

---

## 6. Frontend Angular Architecture & State Management

**Framework:** Angular 17+ Standalone Components with signals and RxJS.  
**Styling:** Modern Dark/Light glassmorphism CSS with CSS Custom Properties (`--bg-primary`, `--accent-color`).

### `ApiService` (`frontend/src/app/api.service.ts`)
Centralizes all HTTP calls to the Spring Boot backend (`http://localhost:8081/api`):
- **Stale-While-Revalidate (SWR) In-Memory Cache:** Serves cached data instantly (&lt;1ms) via `getCachedOrFetch()` to eliminate blank loading screens during navigation.
- **Request Deduplication:** Parallel calls to identical endpoints share the same in-flight Observable via `inFlightRequests` and `shareReplay({ bufferSize: 1, refCount: true })`.
- **Transient Retry Resilience:** Retries network drops once with backoff, while rejecting immediate 401, 403, and 404 responses.
- **Targeted Cache Invalidation:** Domain mutations trigger specific cache eviction routines (e.g., `invalidatePartiesCache()`, `invalidateCache('/sales')`).
- **Auth Token Interception:** Automatically attaches `Authorization: Bearer <token>` through `AuthInterceptor`.

### `NotificationService` (`frontend/src/app/services/notification.service.ts`)
Encapsulates SweetAlert2 (Swal) toasts and modals:
- `success(title, text)`: Top-end auto-closing green toast.
- `error(title, text)`: Top-end red alert toast.
- `confirmAction(title, text, confirmBtnText)`: Asynchronous Promise-based confirmation modal.
- `handleApiError(error)`: Status-aware HTTP exception mapper (400, 401, 403, 404, 409, 422, 500).

### `WebSocketService` (`frontend/src/app/services/websocket.service.ts`)
Bidirectional STOMP/SockJS real-time telemetry stream:
- Connects to `/ws-erp` with 20s heartbeats and 10s auto-reconnect.
- Subscribes to `/topic/updates` and emits parsed `RealtimeUpdate` objects over `updates$`.

### `PaymentService` (`frontend/src/app/services/payment.service.ts`)
Unified payment gateway orchestrator:
- Loads Razorpay `checkout.js` on demand, requests order tokens, handles modal dismissal, and verifies signatures.
- Routes across Razorpay, UPI QR, Debit/Credit Card, and offline Cash/Cheque.

### `UniversalExportService` (`frontend/src/app/services/universal-export.service.ts`)
Client-side document generator:
- `exportToCsv()`: Emits UTF-8 BOM (`\uFEFF`) CSVs with OWASP formula injection protection (`'`, `=`, `+`, `-`, `@`).
- `exportToExcelXml()`: Generates styled Excel 2003 XML spreadsheets with formatted headers.
- `exportToJson()`: Emits sanitized JSON archives with password/token fields stripped.

### `MfaService` (`frontend/src/app/services/mfa.service.ts`)
Phone Multi-Factor Authentication manager:
- Lazy-loads Firebase Auth (`firebase/app`, `firebase/auth`).
- Manages invisible Google reCAPTCHA v2/v3 instances to prevent SMS pumping.
- Submits Firebase ID tokens alongside `preAuthToken` to `/api/users/mfa/verify-firebase-otp`.

### `DataFilterService` (`frontend/src/app/services/data-filter.service.ts`)
In-memory dataset querying and aggregation:
- Computes presets: `today`, `yesterday`, `this_week`, `this_month`, `last_month`, and Indian FY (Apr 1 - Mar 31).
- Evaluates multi-criteria dates, party IDs, crate types, shifts, and full-text substrings.
- Computes real-time record count, total monetary turnover, and total quantity aggregations.

### `DataImportService` (`frontend/src/app/services/data-import.service.ts`)
Communicates with backend bulk data onboarding endpoints:
- `previewImport()`: Submits file for dry-run validation, duplicate detection, and error diagnostics.
- `confirmImport()`: Submits confirmed rows with `UPDATE` or `SKIP` conflict resolution.
- `downloadTemplate()`: Fetches RFC-compliant sample `.xlsx` templates.

### `FormValidationService` (`frontend/src/app/services/form-validation.service.ts`)
Submission-time accessibility and validation assistant:
- Recursively traverses `FormGroup` controls to mark them `touched` and `dirty`.
- Automatically scrolls to and keyboard-focuses the first `.ng-invalid` input field.

### `IdleTimerService` (`frontend/src/app/services/idle-timer.service.ts`)
Inactivity watchdog and auto-logout timer:
- Registers passive DOM listeners (`mousemove`, `click`, `keypress`, `scroll`) outside Angular's zone.
- Triggers `idle$` after 10 minutes of inactivity and emits formatted `mm:ss` countdowns via `countdown$`.

### `ModalManagerService` (`frontend/src/app/services/modal-manager.service.ts`)
Universal modal and drawer accessibility supervisor:
- Uses `MutationObserver` outside Angular zone to detect dialog insertions, debounced with `requestAnimationFrame`.
- Locks body scrolling (`.modal-open`) and focuses/selects the first editable form input.
- Listens to global `Escape` keydown to trigger modal closure.

### `TerminologyService` (`frontend/src/app/services/terminology.service.ts`)
Multi-tenant white-label vocabulary engine:
- Morphs UI labels dynamically per industry preset (Agri-Plastics, Textiles, Food Processing, Electronics, Discrete).
- Synchronizes changes across open browser tabs via window `'storage'` events.

### `ThemeService` (`frontend/src/app/services/theme.service.ts`)
Dark and Light visual aesthetics controller:
- Toggles `.dark-theme` on `document.body`.
- Persists isolated preference keys (`erp_dark_mode_prod` vs `erp_dark_mode_uat`).

### `AppNotificationService` (`frontend/src/app/services/app-notification.service.ts`)
Topbar notification drawer and bell badge manager:
- Buffers the 50 most recent notifications with deduplication guards.
- Tracks `unreadCount` badge and supports deep linking via `actionRoute`.

### `TranslateService` & `TranslatePipe` (`frontend/src/app/translate.service.ts`)
Trilingual localization engine:
- Supports English (`'en'`), Marathi (`'mr'`), and Hindi (`'hi'`).
- Pure standalone Angular pipe `{{ key | translate:lang }}` with automatic fallback to English.

### `JwtInterceptor` (`frontend/src/app/jwt.interceptor.ts`)
Security-hardened HTTP interceptor:
- Injects `Authorization: Bearer <token>` strictly to API calls (never third-party domains).
- Enforces `Cache-Control: no-store` on sensitive queries.
- Triggers server-side token blacklisting and complete client state wipe upon 401 Unauthorized responses.

---

### Core Angular Orchestrator & Feature Components

#### `AppComponent` (`frontend/src/app/app.component.ts`)
- **Master Orchestrator**: Manages zero-trust token session verification (`verifySession`), active tab routing, accessible tab permission maps (`accessibleTabs`), and lazy tab rendering (`renderedTabs`, `loadedTabsSet`).
- **Telemetry & Watchdog**: Ingests real-time events via `WebSocketService`, polls `/actuator/health` and Prometheus telemetry every 30 seconds, and executes a 15-minute idle inactivity watchdog and 5-minute background tab auto-logout.
- **Global Keyboard Navigation**: Intercepts `Alt+Key` combinations (Alt+D for Dashboard, Alt+S for Sales, Alt+P for Production, etc.) for high-speed plant floor navigation.
- **Dynamic XLSX Export**: Dynamically imports SheetJS (`xlsx`) on demand inside `exportTableToExcel()`, reducing the initial bundle size by ~1MB.

#### `DashboardComponent` (`frontend/src/app/components/features/dashboard/dashboard.component.ts`)
- **Executive KPIs**: Real-time rollups of revenue, net profit, operating margin %, warehouse utilization, and polymer buffer.
- **Chart.js Visualizations**: Interactive monthly production bar charts, chronological revenue line charts, and customer revenue doughnut charts.
- **Manufacturing Floor Telemetry**: Displays current shift progress, active production lines, and fleet Overall Equipment Effectiveness (OEE).
- **Recent Audit Stream**: Subscribes to `/api/audit-logs` to stream the 8 most recent operator mutation activities.

#### `SalesComponent` (`frontend/src/app/components/features/sales/sales.component.ts`)
- **Commercial Ledger**: Wholesale crate sales orders, outstanding balance tracking, and invoice linkages.
- **Subtab Pipelines**: All Orders, Pending Dues, Fully Paid, Dispatched, Awaiting Outward, High Volume (>500 crates), and B2B Web Orders.
- **Storefront Bridge**: Inspects incoming public B2B web orders and converts them directly into ERP commercial sales ledgers.
- **Performance Invariant**: Enforces `ChangeDetectionStrategy.OnPush` with 300ms debounced searching.

#### `InventoryComponent` (`frontend/src/app/components/features/inventory/inventory.component.ts`)
- **Finished Stock Balance**: Enforces statutory stock calculation: `currentStock = (openingStock + producedStock) - soldStock`.
- **Crate Classifications**: Categorizes inventory across fruit crates, vegetable crates, dairy crates, and storage models.
- **Stock Health & Valuation**: Real-time evaluation of healthy (>50 crates), low stock (1-50 crates), and stockout items, alongside real-time warehouse valuation.

#### `ProductionComponent` (`frontend/src/app/components/features/production/production.component.ts`)
- **Daily Runs (PPD)**: Tracks shift injection moulding outputs, successful crates, rejected crates, and efficiency percentages.
- **Monthly Telemetry (PPM)**: Synthesizes monthly volumes against power metrics: kWh electricity units consumed, utility power bills, electricity units per crate, and power cost per crate.

#### `InvoicesComponent` (`frontend/src/app/components/features/invoices/invoices.component.ts`)
- **GST Invoicing**: Indian GST tax invoicing with intra-state (CGST 9% + SGST 9%) vs inter-state (IGST 18%) tax splits.
- **Dual Format Output**: Standard A4 vector PDF invoices via jsPDF & html2canvas, and 80mm POS thermal print receipts.
- **O(1) Precomputed Cache**: Caches taxable totals, GST totals, and outstanding dues prior to template binding to prevent CPU throttling.

#### `PaymentsComponent` (`frontend/src/app/components/features/payments/payments.component.ts`)
- **Settlement Ledger**: Inbound collections across UPI, NEFT/RTGS, Bank Transfer, Cheque, and Cash.
- **Automated Reconciliation**: Deducts receipts from invoice balances and updates sales dues without allowing overpayments.

#### `PartyComponent` (`frontend/src/app/components/features/party/party.component.ts`)
- **Customer Directory**: Customer registry, Indian GSTIN checksum verification, PAN extraction, and statutory KYC attachments.
- **Subtabs & Dossier**: Wholesalers/Distributors, GST Registered, Maharashtra (State Code 27), and Interstate buyers, with an in-depth read-only Client Dossier inspection modal.

#### `BillingHubComponent` (`frontend/src/app/components/features/billing-hub/billing-hub.component.ts`)
- **Unified Document Designer**: Standardized layout designer supporting 7 statutory document templates: Tax Invoice, Proforma Invoice, Delivery Challan, Payment Receipt, Purchase Invoice, Transport Receipt, and Salary Slip.
- **Dynamic UPI QR Code**: Dynamically encodes merchant VPA, invoice ID, and exact amount for instant mobile UPI settlement.

#### `SettingsComponent` (`frontend/src/app/components/features/settings/settings.component.ts`)
- **Enterprise Control Center**: Corporate branding & theme palettes, 200+ multi-tenant customizations catalog across 10 industry verticals, dynamic RBAC permission matrices, modular feature toggles, custom fields engine, developer API keys, webhooks, and phone MFA management.

#### `RawMaterialsComponent` (`frontend/src/app/components/features/raw-materials/raw-materials.component.ts`)
- **Polymer Inward Consignments**: Tracks bulk shipments of Virgin HDPE, Masterbatch, and UV Stabilizers with weighbridge slip attachments and supplier bills.

#### `VendorsComponent` (`frontend/src/app/components/features/vendors/vendors.component.ts`)
- **Supplier Directory**: Petrochemical suppliers directory with cumulative tonnage delivered (kg), spend summaries, and Indian GSTIN validation.

#### `EmployeesComponent` (`frontend/src/app/components/features/employees/employees.component.ts`)
- **Staff Roster & KYC**: Factory personnel registry, 12-digit Aadhaar number validation, bank account IFSC verification, and monthly base wage liabilities.

#### `SalariesComponent` (`frontend/src/app/components/features/salaries/salaries.component.ts`)
- **Payroll Disbursement**: Monthly wage voucher processing (Pending, Paid, Cancelled), cash/bank disbursement clearance, and individual employee salary slips.

#### `TransportsComponent` (`frontend/src/app/components/features/transports/transports.component.ts`)
- **Logistics Freight Fleet**: Outbound freight trips, truck registration numbers, hire rents, driver cash advances, and signed proof-of-delivery (POD) attachments.

#### `DriversComponent` (`frontend/src/app/components/features/drivers/drivers.component.ts`)
- **Chauffeur Directory**: Driver registry, commercial driving license (CDL) verification, trip counts, and cumulative earnings metrics.

#### `MachinesComponent` (`frontend/src/app/components/features/machines/machines.component.ts`)
- **Injection Moulding Equipment**: Plant equipment capacity (crates/hour), running statuses, and mechanical breakdown downtime tracking.

#### `DispatchComponent` (`frontend/src/app/components/features/dispatch/dispatch.component.ts`)
- **Outward Gate-Pass Supervisor**: Vehicle dispatch manifest with integrated QR camera barcode scanning (`QrScannerModalComponent`) for loading dock clearance.

#### `ExpensesComponent` (`frontend/src/app/components/features/expenses/expenses.component.ts`)
- **Operating Expenses (OPEX)**: Factory operating disbursements across maintenance, utility power, diesel fuel, tooling, and consumables.

#### `BankComponent` (`frontend/src/app/components/features/bank/bank.component.ts`)
- **Corporate Treasury**: Bank account ledger tracking credit inflows and debit outflows with UTR reference numbers and real-time bank balances.

#### `ReportsComponent` (`frontend/src/app/components/features/reports/reports.component.ts`)
- **Analytical Reporting**: Cross-module business analytics (Production, Sales, Payments, OPEX, Payroll, Logistics) with Chart.js visualization and vector PDF export.

#### `AnalyticsComponent` (`frontend/src/app/components/features/analytics/analytics.component.ts`)
- **Executive BI Cockpit**: Executive cockpit indicators with time grain (Month, Today, Quarter, Year) and shift slicers, alongside sanitized Microsoft PowerBI iframe embedding.

#### `GlobalFilterComponent` (`frontend/src/app/components/features/global-filter/global-filter.component.ts`)
- **Universal Query Drawer**: Dynamic contextual query engine with full-text search, date ranges, shift, crate type, and party filters with session persistence.

#### `HeaderComponent` & `SidebarComponent` (`frontend/src/app/components/layout/`)
- **Header**: Live telemetry clock, session duration timer, inactivity auto-logout countdown, unread notification drawer, global search, and dark mode toggle.
- **Sidebar**: Dynamic collapsible icon rail, RBAC permission masking, and multi-tenant dynamic vocabulary mapping.

---

### Directives, Pipes & Shared Components

- **`AutoSelectDirective` (`[appAutoSelect]`)**: Auto-selects input field text upon receiving focus for rapid numeric entry on factory floor terminals.
- **`FormStateDirective` (`[appFormState]`)**: Debounces form inputs (1000ms) and saves drafts to `sessionStorage`, auto-restoring unsaved changes if an operator accidentally navigates away.
- **`ResizableTableDirective` (`[appResizableTable]`)**: Drag-and-drop table column resizing with live pixel HUD, vertical laser guide beam, and `localStorage` column width persistence.
- **`Tilt3dDirective` (`[appTilt3d]`)**: Dynamic 3D gyroscope cursor tracking tilt effect on executive glassmorphic KPI cards.
- **`IndianDatePipe` (`indianDate`)**: Formats dates into Indian `DD/MM/YYYY` format with optional 12-hour AM/PM timestamps.
- **`InrPipe` (`inr`)**: Formats numbers into standardized Indian Rupee notation (e.g. `₹1,25,000.00`).
- **`TermPipe` (`term`)**: Dynamic multi-tenant terminology morphing per tenant industry configuration.
- **`UniversalImporterComponent` (`app-universal-importer`)**: Dry-run bulk CSV validation dialog with duplicate entity conflict resolution (`UPDATE` or `SKIP`).
- **`SearchableSelectComponent` (`app-searchable-select`)**: Accessible typeahead dropdown implementing `ControlValueAccessor` with keyboard arrow navigation.
- **`QrCodeComponent` (`app-qr-code`)**: HTML5 Canvas vector QR code generator for UPI invoice payments and dispatch passes.
- **`QrScannerModalComponent` (`app-qr-scanner-modal`)**: Hardware camera barcode/QR scanner powered by `@zxing/browser`.
- **`PasswordStrengthComponent` (`app-password-strength`)**: Real-time password entropy meter with color-coded feedback.
- **`EmptyStateComponent` (`app-empty-state`)**: Glassmorphic zero-data indicator for empty query results.
- **`FilterBarComponent` (`app-filter-bar`)**: Reusable preset chips (Today, Yesterday, This Week, Month, FY) with debounced search.

---

## 7. Role-Based Access Control (RBAC) & Administrative Isolation Model

Futane Agro ERP implements strict multi-tier zero-trust role isolation to ensure that sensitive system internals, database administration, developer tools, telemetry, and audit logs are visible and accessible exclusively to `SUPER_ADMIN`.

### Role Permissions Hierarchy

| Role | Business Operational Access | Sensitive Admin Access | System Telemetry & DB Tools |
| :--- | :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Full Read/Write across all modules | Full Control (Settings, Custom Fields, Roles, API Keys) | Live Infrastructure Telemetry, DB Studio (5433), Seeders, Audit Trail |
| **`ADMIN`** | Full Read/Write across all business modules | User management, bulk data import | Blocked (403 Forbidden) |
| **`ACCOUNTANT`** | Sales, Invoices, Billing, Payments, OPEX, Bank, Salaries, Reports | Blocked (403 Forbidden) | Blocked (403 Forbidden) |
| **`OPERATOR`** | Production (PPD/PPM), Machines, Inventory, Raw Materials, Dispatch | Blocked (403 Forbidden) | Blocked (403 Forbidden) |
| **`VIEWER`** | Read-Only view of operational logs | Blocked (403 Forbidden) | Blocked (403 Forbidden) |

### Layered Defense Mechanisms

1. **Backend Security Filter Chain (`SecurityConfig.java`)**:
   - `/api/audit-logs/**`: Guarded by `hasRole("SUPER_ADMIN")`.
   - `/api/dev/**`: Guarded by `hasRole("SUPER_ADMIN")` (and blocked in production environments).
   - `/api/admin/**`: High-privilege endpoints strictly restricted to `hasRole("SUPER_ADMIN")`.
   - `/actuator/**`: Strictly restricted to `hasRole("SUPER_ADMIN")` (except `/actuator/health` and `/actuator/prometheus`).

2. **Unified Enterprise Audit Logging (`AuditService.java`)**:
   - Standardized fail-safe logging across `PartyController`, `InventoryController`, `HRController`, `SalesController`, `TransportController`, `ProductionController`, and `EnterpriseController`.
   - Automatically resolves client IP via `X-Forwarded-For` and `HttpServletRequest.getRemoteAddr()`.
   - Executes with non-blocking resilience: database audit write failures are logged without crashing client business operations.

3. **Frontend Visual & Route Hardening**:
   - **Header (`header.component.ts/html`)**: Telemetry popover and Database Studio link are restricted to `*ngIf="isSuperAdmin"`. Global search filters out `settings` and `audit-logs` for operational roles.
   - **Sidebar (`sidebar.component.ts/html`)**: Administration navigation group (audit logs & settings) is strictly hidden unless `isSuperAdmin`.
   - **Dashboard (`dashboard.component.ts/html`)**: Recent activity audit stream is restricted to `*ngIf="isSuperAdmin"`. Quick navigation and action shortcuts are guarded by `canAccess(tab)`.
   - **Settings Hub (`settings.component.ts/html`)**: Entire configuration center is wrapped with `@defer` and `*ngIf="isSuperAdmin"`. Unauthorized access renders a restricted security splash screen.
   - **App Routing (`app.component.ts`)**: `switchTab()` validates user role and prevents tab switching to protected administrative views, popping an error toast on unauthorized navigation attempts.

---

## 8. Developer Rules for Future Modifications

When making any future changes to this codebase:
1. **Never Break Compilation**: Always run `backend/mvnw.cmd test-compile -DskipTests` and `npm run build` in `frontend/` before pushing commits.
2. **Preserve Comments & Annotations**: Keep existing Javadoc, deprecation warnings, and `@Transactional` tags.
3. **Database Migration Safety**: If adding new columns to entities, ensure matching `IF NOT EXISTS` columns are added to PostgreSQL schema scripts.
4. **Git Sync**: Always ensure changes are pushed to both `origin/enterprise-db-redesign` and default branch `origin/main`.
