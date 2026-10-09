# AGENTS.md — Repository Directives & Performance Contract

> **MANDATORY INSTRUCTIONS FOR ALL AI ASSISTANTS, AGENTS, AND LARGE LANGUAGE MODELS:**
> This repository is **Futane Agro ERP**. The host environment is a **Windows 11 laptop with only 8 GB of total RAM**.
> 
> You MUST strictly follow the Performance Invariants and Coding Standards outlined in:
> - [`.agents/rules/MASTER_PERFORMANCE_RULES.md`](file:///.agents/rules/MASTER_PERFORMANCE_RULES.md)
> - [`PROJECT_RULES.md`](file:///PROJECT_RULES.md)
> - [`MASTER_MULTI_TENANT_CUSTOMIZATION_SPEC.md`](file:///MASTER_MULTI_TENANT_CUSTOMIZATION_SPEC.md)

---

## 1. Zero-Tolerance Guardrails
1. **Business Logic & Finances**: NEVER modify GST calculation algorithms, invoice numbering, financial ledger totals, or database relationships.
2. **RAM Ceilings**:
   - Node V8 Heap: Maximum `1536 MB` (`--max-old-space-size=1536`).
   - Java Spring Boot Heap: Maximum `512 MB` (`-Xms256m -Xmx512m`).
   - Maven Builds: Maximum `512 MB` (`backend/.mvn/jvm.config`).
   - HikariCP Database Connections: Maximum `8` in UAT/dev.
3. **Network & RxJS Hygiene**:
   - `shareReplay` MUST ALWAYS include `{ bufferSize: 1, refCount: true }`.
   - Never retry `401` or `403` HTTP errors.
   - Guard all intervals and polling loops by `this.isAuthenticated`.

---

## 2. Fast Working Under High Data Loads
- In Angular tables with large record sets: ALWAYS enforce pagination, input debouncing (300ms), and `trackBy` identity functions.
- In Spring Boot: Ensure `@Transactional(readOnly = true)` on search/filter queries, keep GZIP compression enabled, and utilize Hibernate batch writing (`batch_size=50`).
- Process Management: Before starting long tasks or if RAM drops below 1 GB, execute `clean-processes.bat` to eliminate orphaned background runners.
