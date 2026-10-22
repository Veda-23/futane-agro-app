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

### Key Security Components

- **`SecurityConfig.java`**: Configures stateless session management (`SessionCreationPolicy.STATELESS`), CORS rules (`localhost:4300`, `localhost:8081`), and endpoints requiring authentication vs public endpoints (`/api/auth/**`, `/actuator/health`).
- **`JwtRequestFilter.java`**: Intercepts every inbound HTTP request. Extracts `Bearer <token>` from the `Authorization` header. Validates cryptographic signature and sets Spring Security `SecurityContextHolder`.
- **`RateLimitingService.java`**: In-memory token bucket rate limiter. Protects sensitive endpoints (`LOGIN`: 5 req/min, `REGISTER`: 3 req/min, `DATA_IMPORT`: 10 req/min).

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

## 5. Database Entity Architecture (PostgreSQL 16)

The application models 41 tables in the `public` schema:
```
                       ┌─────────────────────────┐
                       │       t_core_user       │ (Users, Roles, 2FA)
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

- All entity classes extend `BaseEntity.java` (`id`, `created_at`, `created_by`, `updated_at`, `updated_by`, `version`, `is_active`, `is_deleted`).
- Soft delete pattern: Queries automatically exclude deleted records via Hibernate `@Where(clause = "is_active = true")`.

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

## 7. Developer Rules for Future Modifications

When making any future changes to this codebase:
1. **Never Break Compilation**: Always run `backend/mvnw.cmd test-compile -DskipTests` and `npm run build` in `frontend/` before pushing commits.
2. **Preserve Comments & Annotations**: Keep existing Javadoc, deprecation warnings, and `@Transactional` tags.
3. **Database Migration Safety**: If adding new columns to entities, ensure matching `IF NOT EXISTS` columns are added to PostgreSQL schema scripts.
4. **Git Sync**: Always ensure changes are pushed to both `origin/enterprise-db-redesign` and default branch `origin/main`.
