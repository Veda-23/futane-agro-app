# MASTER PERFORMANCE RULES & HARDWARE INVARIANTS (8 GB RAM WORKSTATION)

> **CRITICAL DIRECTIVE FOR ALL FUTURE AI AGENTS, PROMPTS, AND DEVELOPERS:**
> This repository runs on an **8 GB Windows 11 workstation**. High RAM usage, background process accumulation, and unbounded JVM/Node allocations will immediately freeze the developer's laptop.
> 
> **ZERO-TOLERANCE RULES**:
> 1. DO NOT change financial calculations, GST rates, business logic, form properties, or database schemas.
> 2. NEVER exceed the memory limits specified below.
> 3. NEVER create unbounded polling, retry storms, or uncleaned RxJS subscriptions.

---

## 1. HARDWARE MEMORY ALLOCATION CEILINGS (MAXIMUM PERMITTED)

| Subsystem | Maximum Permitted RAM | Configuration Enforced In |
| :--- | :--- | :--- |
| **Node.js (Angular CLI / Dev Server)** | **1,536 MB** (`--max-old-space-size=1536`) | `frontend/package.json` |
| **Spring Boot JVM (Java 17)** | **512 MB** (`-Xms256m -Xmx512m`) | `run-local-uat.ps1`, `run-local-prod.ps1` |
| **Maven CLI (`mvn`)** | **512 MB** (`-Xms128m -Xmx512m`) | `backend/.mvn/jvm.config` |
| **HikariCP Connection Pool** | **8 Connections Max** (idle: 2) | `application-uat.properties` |
| **Lightweight Static Mode** | **~30 MB** (Serves pre-compiled build) | `run-lightweight-uat.ps1` |

---

## 2. HIGH DATA LOAD & ULTRA-LIGHTWEIGHT ARCHITECTURE PATTERNS

### A. Frontend (Angular 17 Standalone + RxJS)
1. **DOM Virtualization & Pagination**:
   * NEVER render thousands of table rows at once.
   * Tables with > 50 records MUST use client-side or server-side pagination with default page sizes of 10, 25, or 50.
2. **`trackBy` Functions Mandatory**:
   * Every `*ngFor` iterating over entities (parties, invoices, production runs, raw materials) MUST use a `trackBy` function (e.g. `trackById(index: number, item: any): any { return item.id; }`).
   * This prevents Angular from destroying and recreating hundreds of DOM nodes on list updates.
3. **Search & Filter Input Debouncing**:
   * Text search boxes, autocomplete fields, and real-time filters MUST use RxJS `debounceTime(250)` to `debounceTime(350)` and `distinctUntilChanged()`.
   * Never fire an API request or deep array filter on every single keypress.
4. **RxJS Subscription & Cache Hygiene**:
   * All shared in-memory observables MUST use `shareReplay({ bufferSize: 1, refCount: true })`.
   * `refCount: true` guarantees that when all subscriber components unmount, the source connection is disconnected and memory is freed.
   * On user logout, `apiService.clearAllReferenceCache()` MUST be called.
5. **Strict No-Retry Policy on 401/403/404**:
   * HTTP retry operators (`retry()`) MUST inspect error status and NEVER retry `401 Unauthorized`, `403 Forbidden`, or `404 Not Found`.
   * Unauthenticated loops cause server CPU spikes and browser freezing.
6. **Guarded Polling & Timers**:
   * Background intervals (`interval()`, `setInterval()`) MUST be guarded by `if (!this.isAuthenticated || document.hidden) return;`.
   * Cancel all interval subscriptions in `ngOnDestroy()` or `handleLogout()`.

### B. Backend (Spring Boot + Hibernate + MySQL)
1. **JDBC Batch Writing**:
   * Bulk entity creation (imports, batch order syncs) MUST use Hibernate batching (`spring.jpa.properties.hibernate.jdbc.batch_size=50`).
2. **Read-Only Transactions**:
   * Heavy reporting and dashboard query methods MUST be annotated with `@Transactional(readOnly = true)` to avoid Hibernate dirty-checking overhead.
3. **DTO Projections for High-Volume Queries**:
   * Never load full entity graphs with multiple `@OneToMany` collections for table listings. Use interface or record DTO projections to select only displayed columns.
4. **Response Compression**:
   * Keep GZIP compression enabled (`server.compression.enabled=true`) for all JSON endpoints to reduce payload size over localhost and tunnels.
5. **Caffeine In-Memory Cache with Strict Expiration**:
   * Reference data caches (parties, vendors, machines) MUST have a maximum size (1000 items) and TTL (`expireAfterWrite=600s`).

---

## 3. PROCESS HYGIENE & BACKGROUND CLEANUP

1. **Before Running Tasks**:
   * Run `clean-processes.bat` or `clean-processes.ps1` to terminate any orphaned Node or Java processes holding ports 4200, 4201, 8080, or 8081.
2. **Never Leave Background Test Daemons Running**:
   * Headless browsers, Playwright, Puppeteer, or load-test scripts must ALWAYS close browsers in a `finally` block and terminate immediately upon completion.
3. **Antivirus Scanning Bypass**:
   * The following 3 directories MUST remain excluded in Windows Defender to eliminate disk thrashing:
     - `frontend\node_modules`
     - `frontend\.angular\cache`
     - `backend\target`

---

## 4. EXECUTION MODES CHEATSHEET

* **Mode A: Active Development (Code Editing)**:
  `npm run start:uat` (runs Angular with 1536MB ceiling) + Spring Boot (512MB limit).
* **Mode B: Ultra-Lightweight Testing / Usage / Demos (No Frontend Code Editing)**:
  `run-lightweight-uat.ps1` (runs static server on port 4200 using ~30 MB RAM + Spring Boot with 512 MB RAM). **Saves 600+ MB RAM instantly!**
* **Mode C: RAM Recovery (Laptop Feels Slow)**:
  Double-click `clean-processes.bat`.
