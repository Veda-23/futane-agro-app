# 🏛️ FUTANE AGRO ERP — SYSTEM ARCHITECTURE & PROJECT ORGANIZATION
## Standardized Directory Hierarchy, Zero-Dead-Code Policy & Maintenance Protocols

---

> ## 🎯 SYSTEM OBJECTIVE & OPERATIONAL DIRECTIVE
>
> Maintain the **Futane Agro ERP** repository in a clean, systematic, enterprise-grade state where:
> 1. **Zero Clutter & Deterministic Locations**: Every file has a designated folder (no loose scripts, temporary archives, or raw image assets in root).
> 2. **Zero-Dead-Code Policy**: Obsolete UI components, orphaned templates, and dead methods are safely eliminated without breaking dependencies, TypeScript types, or JPA relationships.
> 3. **Dual Environment Isolation**: PROD (`:4200` / `:8080` / `futane_erp_prod`) and UAT (`:4201` / `:8081` / `futane_erp_uat`) execute independently with dedicated configuration profiles.
> 4. **100% Empirical Validation**: Every single refactor, button wiring, and schema migration is verified via headless CLI test runners before declaring readiness.

---

## ══════════════════════════════════════════════════
## 📁 STANDARDIZED DIRECTORY HIERARCHY
## ══════════════════════════════════════════════════

```text
futane-agro-app/
├── .agent/ / .agents/          # Antigravity Skills, Workflows & Brain state
├── archives/                   # Historical build archives, deployment packages & zip bundles
├── backend/                    # Spring Boot 2.7+ (Java 17, Maven, JPA, MySQL 8)
│   ├── src/main/java/          # Core Domain Entities, Controllers, Repositories, Security
│   ├── src/main/resources/     # application.properties (uat, prod, dev)
│   └── target/                 # Compiled executable fat JARs
├── backups/                    # Automated MySQL dumps & point-in-time snapshots
├── docs/                       # Architectural specs, API catalogs & SOP guides
│   └── sop/                    # Operational Runbooks, UAT/PROD rollout SOPs
├── frontend/                   # Angular 17+ (TypeScript, Tailwind, Modern Glass UI)
│   ├── src/app/components/     # Feature modules (sales, crm, ppd, dispatch, etc.)
│   │   ├── features/           # Standalone domain-specific feature views
│   │   ├── layout/             # Sidebar, Header, Global Filter, Command Bar
│   │   └── shared/             # DataTableComponent, ResizableTableDirective, Modals
│   ├── src/app/services/       # ApiService, NotificationService, WebSocketService
│   └── src/assets/             # Curated SVG logos, favicons & PWA webmanifest
├── gateway/                    # Nginx reverse proxy configs & SSL cert renewals
├── monitoring/                 # Prometheus exporters, Grafana v10+ dashboards
├── scripts/                    # Categorized automation scripts
│   ├── deploy/                 # Production/UAT deployments, SSL, Docker compose scripts
│   ├── dev/                    # Local server startup, DB reset & schema migration helpers
│   ├── monitoring/             # Grafana dashboard generators & Prometheus pushers
│   └── testing/                # Automated CLI verification harnesses (full-backend-system-test.ps1)
├── run-local-prod.ps1          # Root 1-click launcher for PROD (Port 4200 / 8080)
├── run-local-uat.ps1           # Root 1-click launcher for UAT (Port 4201 / 8081)
└── docker-compose.*.yml        # Multi-container orchestration definitions
```

---

## ══════════════════════════════════════════════════
## 🧹 CODE HYGIENE & SAFE REDUCTION RULES
## ══════════════════════════════════════════════════

### 1. Root Directory Hygiene:
- **No Loose Scripts**: All `.sh`, `.ps1`, `.js`, `.py` helper tools must live inside `scripts/{deploy|dev|monitoring|testing}/`.
- **No Loose Assets**: All image, SVG, and favicon files belong exclusively inside `frontend/src/assets/`.
- **No Temporary Archives**: Move `.tar.gz`, `.zip` bundles into `archives/`.

### 2. Zero Dead Code & Safe Pruning:
- When a UI dock or component is obsoleted (e.g. floating bottom dock replaced by universal table toolbar), remove the unused component folder completely.
- Ensure that removing dead files causes **0 build errors** by executing `ng build`.

### 3. Dual Create / Update Contract Handling:
- Every feature form must store `_editId` or `id` upon clicking `✏️ Edit`.
- When `Save` is pressed:
  - If `_editId` is set ➔ dispatch `PUT /api/{resource}/{id}`.
  - If `_editId` is empty ➔ dispatch `POST /api/{resource}`.

### 4. Mathematical & Business Logic Invariants:
- **Sales & GST Engine**: `gross = quantity × rate`, `cgst = 9%`, `sgst = 9%`, `totalAmount = gross × 1.18`.
- **PPD Production**: `successful + rejected = totalProduction`.
- **Transports Logistics**: `remaining = rent - advance`.
- **Raw Material Purchases**: `amount = weight × rate`.
- **Employee Validation**: Required 10-digit mobile, 12-digit Aadhaar (`^[2-9][0-9]{11}$`), AES encrypted `bankAccount`.

---

## ══════════════════════════════════════════════════
## 🌐 DUAL ENVIRONMENT MATRIX
## ══════════════════════════════════════════════════

| Parameter | Production (PROD) | User Acceptance Testing (UAT) |
|:---|:---|:---|
| **Frontend URL** | `http://localhost:4200` | `http://localhost:4201` |
| **Backend API** | `http://localhost:8080/api` | `http://localhost:8081/api` |
| **Database Schema** | `futane_erp_prod` (MySQL 8) | `futane_erp_uat` (MySQL 8) |
| **Spring Profile** | `prod` (`--spring.profiles.active=prod`) | `uat` (`--spring.profiles.active=uat`) |
| **Frontend Config** | `proxy.prod.json` / `--configuration=production` | `proxy.uat.json` |
| **Default Super Admin** | `SUPER_ADMIN` / `superadmin123` | `admin` / `admin123` |

---

## ══════════════════════════════════════════════════
## ⚡ VERIFICATION RUNNERS & COMMANDS
## ══════════════════════════════════════════════════

### 1. Verify Angular Frontend Compilation (Zero Errors):
```powershell
cd frontend
node node_modules/@angular/cli/bin/ng build
```

### 2. Run Headless Full-Stack Integration Suite (All 18 Modules):
```powershell
# Against UAT (Port 8081)
powershell -ExecutionPolicy Bypass -File scripts\full-backend-system-test.ps1 -BaseUrl "http://localhost:8081"

# Against PROD (Port 8080)
powershell -ExecutionPolicy Bypass -File scripts\full-backend-system-test.ps1 -BaseUrl "http://localhost:8080"
```

### 3. Run Headless Angular Specs (Zero Browser UI):
```powershell
cd frontend
npx ng test --watch=false --browsers=ChromeHeadless
```

### 4. Run Maven JUnit 5 Backend Specs:
```powershell
cd backend
mvn test -Dspring.profiles.active=uat
```
