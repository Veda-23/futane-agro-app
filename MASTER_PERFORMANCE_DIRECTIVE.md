# MASTER PERFORMANCE DIRECTIVE — FUTANE AGRO ERP

> **8 GB RAM HARDWARE BOUNDARY & HIGH DATA LOAD PERFORMANCE CONTRACT**
> 
> *Copy-paste the prompt block below into ChatGPT, Claude, Gemini, or any future AI chat whenever requesting modifications to this project.*

---

## 📋 MASTER PROMPT FOR ALL FUTURE CHATS (COPY & PASTE READY)

```markdown
Act as a Principal Full-Stack Performance Engineer for Futane Agro ERP.

### CRITICAL HARDWARE & BUSINESS RULES (ZERO TOLERANCE)
1. HOST ENVIRONMENT: Windows 11 workstation with ONLY 8 GB TOTAL RAM.
2. ABSOLUTE BUSINESS LOCK: DO NOT modify financial calculations, GST rates, invoice numbering, database schemas, entity relationships, form properties, or working ERP workflows.
3. STRICT RESOURCE INVARIANTS:
   - Angular CLI / Node: NEVER exceed `--max-old-space-size=1536`.
   - Spring Boot JVM: ALWAYS launch with `-Xms256m -Xmx512m` (preventing default 2GB heap inflation).
   - Maven Builds: Use `-Xms128m -Xmx512m` (via `backend/.mvn/jvm.config`).
   - HikariCP Database Connections: Maximum 8 connections (minimum idle 2) in `application-uat.properties`.
   - RxJS Memory Hygiene: ALWAYS use `shareReplay({ bufferSize: 1, refCount: true })` so unreferenced streams disconnect.
   - Network Hygiene: NEVER retry HTTP requests on 401 Unauthorized, 403 Forbidden, or 404 Not Found.
   - Guarded Polling: NEVER poll endpoints when user is not authenticated (`if (!this.isAuthenticated) return;`).

### HIGH DATA LOAD & FAST PERFORMANCE ARCHITECTURE
1. Tables & Lists:
   - Must use pagination (10/25/50 items) for tables with > 50 records. Never render massive DOM trees.
   - All `*ngFor` loops must use `trackBy` identity functions to avoid recreating entire DOM tables on updates.
   - Search & filter inputs must use RxJS `debounceTime(300)` and `distinctUntilChanged()`.
2. Backend Services:
   - Use `@Transactional(readOnly = true)` on search and reporting queries.
   - Keep GZIP response compression active (`server.compression.enabled=true`).
   - Use Hibernate JDBC batching (`batch_size=50`, `order_inserts=true`) for bulk records.
3. Process & Disk Hygiene:
   - Windows Defender must exclude `frontend/node_modules`, `frontend/.angular/cache`, and `backend/target` only.
   - Run `clean-processes.bat` if orphaned processes hold ports 4200, 4201, 8080, or 8081.
   - For demonstrations or testing without code changes, prefer `run-lightweight-uat.ps1` (uses only ~30 MB RAM for frontend vs 600 MB in dev watcher).

Before proposing or modifying code:
Inspect -> Measure -> Apply smallest safe change -> Verify no memory leaks or lag.
```

---

## 🛠️ ARCHITECTURAL CHEATSHEET & SCRIPTS

### 1. Daily Startup Options

| Scenario | Command to Run | Frontend RAM | Backend RAM | Total App RAM |
| :--- | :--- | :---: | :---: | :---: |
| **Active Frontend Coding** | `npm run start:uat` + Spring Boot | ~600 MB | ~180 MB | ~780 MB |
| **Testing / Data Entry / Demos** | `powershell .\run-lightweight-uat.ps1` | **~30 MB** | ~180 MB | **~210 MB** (Saves 600 MB!) |
| **Production Local Simulation** | `powershell .\run-local-prod.ps1` | ~600 MB | ~200 MB | ~800 MB |

### 2. Immediate RAM Recovery
Whenever your laptop feels sluggish or memory drops below 1 GB:
1. Double-click `clean-processes.bat` in the repository root.
2. It safely terminates any orphaned Node dev servers or Java processes on ports `4200`, `4201`, `8080`, and `8081` without affecting MySQL.

### 3. File Map of Permanent Safeguards
- [`AGENTS.md`](file:///AGENTS.md): Workspace-level contract read by all AI agents.
- [`.agents/rules/MASTER_PERFORMANCE_RULES.md`](file:///.agents/rules/MASTER_PERFORMANCE_RULES.md): Invariant specifications for high-load performance and memory caps.
- [`PROJECT_RULES.md`](file:///PROJECT_RULES.md): Canonical GSD rules including the 8GB Hardware Invariant.
- [`backend/.mvn/jvm.config`](file:///backend/.mvn/jvm.config): Permanent Maven 512 MB ceiling.
- [`backend/src/main/resources/application-uat.properties`](file:///backend/src/main/resources/application-uat.properties): HikariCP pool tuned to 8 connections.
- [`frontend/package.json`](file:///frontend/package.json): Node memory ceiling locked to 1536 MB.
- [`frontend/src/app/api.service.ts`](file:///frontend/src/app/api.service.ts): Safe `retryPolicy` (no 401/403 retry loops) and `refCount: true` on caching.
- [`frontend/src/app/app.component.ts`](file:///frontend/src/app/app.component.ts): Telemetry polling strictly guarded by authentication.
