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
**Purpose:** Customer-facing web order placement, live crate catalogue, order tracking, and invoice dispatch status.

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
- Automatically attaches `Authorization: Bearer <token>` through `AuthInterceptor`.
- Handles unified error parsing and toast notification dispatching.

### `NotificationService` (`frontend/src/app/services/notification.service.ts`)
Encapsulates SweetAlert2 (Swal) toasts and modals:
- `success(title, text)`: Top-end auto-closing green toast.
- `error(title, text)`: Top-end red alert toast.
- `confirmAction(title, text, confirmBtnText)`: Asynchronous Promise-based confirmation modal.

---

## 7. Developer Rules for Future Modifications

When making any future changes to this codebase:
1. **Never Break Compilation**: Always run `backend/mvnw.cmd test-compile -DskipTests` and `npm run build` in `frontend/` before pushing commits.
2. **Preserve Comments & Annotations**: Keep existing Javadoc, deprecation warnings, and `@Transactional` tags.
3. **Database Migration Safety**: If adding new columns to entities, ensure matching `IF NOT EXISTS` columns are added to PostgreSQL schema scripts.
4. **Git Sync**: Always ensure changes are pushed to both `origin/enterprise-db-redesign` and default branch `origin/main`.
