# 🛠️ Futane Agro ERP - Master DevOps, Docker & Tools Guide

This document organizes and explains all **Docker stacks**, **GitHub Actions**, **automation scripts**, and **developer tools** in the Futane Agro ERP repository.

---

## 📑 Quick Navigation
- [1. Service & Port Directory](#1-service--port-directory)
- [2. Docker Environment Management](#2-docker-environment-management)
- [3. GitHub & GitHub Actions Automation](#3-github--github-actions-automation)
- [4. Repository & Scripts Organization](#4-repository--scripts-organization)
- [5. Testing & Verification Suite](#5-testing--verification-suite)
- [6. Troubleshooting & FAQs](#6-troubleshooting--faqs)

---

## 1. Service & Port Directory

| Service | Environment | Host URL / Port | Container Port | Purpose & Credentials |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend UI** | **UAT (Docker)** | [http://localhost:8081](http://localhost:8081) | `80/tcp` | Angular Production Build served via Nginx |
| **Backend API** | **UAT (Docker)** | [http://localhost:8082/api](http://localhost:8082/api) | `8081/tcp` | Spring Boot API (`SUPER_ADMIN / superadmin123`) |
| **MySQL Database** | **UAT (Docker)** | `localhost:3307` | `3306/tcp` | Database: `futane_agro_uat` |
| **Frontend UI** | **Local Bare-Metal** | [http://localhost:4201](http://localhost:4201) | `4201` | Angular dev server via `run-local-uat.ps1` |
| **Backend API** | **Local Bare-Metal** | [http://localhost:8081/api](http://localhost:8081/api) | `8081` | Spring Boot JAR via `run-local-uat.ps1` |
| **Prod Stack** | **Production (Docker)**| [http://localhost:80](http://localhost:80) | `80/443` | Full production stack with Nginx SSL reverse proxy |
| **Grafana** | **Monitoring** | [http://localhost:3000](http://localhost:3000) | `3000` | L1-L3 Telemetry Dashboards (`admin / FutaneAgro@Monitor2026!`) |

---

## 2. Docker Environment Management

We have unified all Docker operations into a single helper script: **`run-docker.bat`** (or `run-docker.ps1`).

### Quick Commands

```powershell
# 1. View status of all running Futane Agro containers
.\run-docker.bat status

# 2. Start the UAT container environment
.\run-docker.bat start uat

# 3. Stop the UAT container environment
.\run-docker.bat stop uat

# 4. Start Production container environment
.\run-docker.bat start prod

# 5. Stop all containers across all environments
.\run-docker.bat stop all

# 6. View live logs of UAT stack
.\run-docker.bat logs uat
```

### Docker Compose Files Reference
- [docker-compose.uat.yml](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/docker-compose.uat.yml): UAT container stack (Frontend `8081`, Backend `8082`, MySQL `3307`).
- [docker-compose.prod.yml](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/docker-compose.prod.yml): Production container stack (Nginx, Backend, Frontend, MySQL `3306`).
- [docker-compose.yml](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/docker-compose.yml): Default / development stack.

---

## 3. GitHub & GitHub Actions Automation

### Remote Repository
- **Repository URL**: `https://github.com/Veda-23/futane-agro-app`
- **Active Branches**: `main`, `enterprise-db-redesign`

### Workflows Reference
1. **Local CI & Build Pipeline** ([.github/workflows/deploy.yml](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/.github/workflows/deploy.yml))
   - **Triggers**: On push to `main` and `enterprise-db-redesign`, pull requests, and manual dispatch.
   - **Jobs**:
     - `backend-build`: Java 17 + Maven build and unit test verification.
     - `frontend-build`: Node 18 + Angular CLI compile & test check.
     - `docker-validation`: Dockerfile build & syntax validation.
2. **Local Runner (Self-Hosted)** ([.github/workflows/local-runner.yml](file:///c:/Users/Vedant/.gemini/antigravity-ide/scratch/futane-agro-app/.github/workflows/local-runner.yml))
   - **Triggers**: Manual dispatch via GitHub Actions tab or local runner.

### Running GitHub Actions Locally on Your Machine
You do not need to push to GitHub or use cloud VMs to test workflows. Run them locally via **`act`**:
```powershell
# Run all local action jobs
.\run-local-actions.bat

# Run specific job
.\run-local-actions.bat backend
.\run-local-actions.bat frontend
.\run-local-actions.bat docker
```

---

## 4. Repository & Scripts Organization

All scripts and tooling are neatly categorized under dedicated folders:

```
futane-agro-app/
│
├── .github/
│   ├── workflows/
│   │   ├── deploy.yml            # CI & Build Pipeline
│   │   └── local-runner.yml      # Local self-hosted runner
│   └── README.md                 # CI/CD workflow documentation
│
├── docker-compose.uat.yml        # UAT Docker environment
├── docker-compose.prod.yml       # Production Docker environment
├── docker-compose.yml            # Development Docker environment
├── run-docker.bat / .ps1         # Unified Docker Manager CLI
├── run-local-actions.bat / .ps1  # Unified Local GitHub Actions CLI
├── run-local-uat.ps1             # Local bare-metal UAT launcher
├── run-local-prod.ps1            # Local bare-metal Prod launcher
│
├── scripts/
│   ├── deploy/                   # Environment deployment scripts
│   │   ├── deploy-local.ps1
│   │   ├── deploy-uat.ps1
│   │   └── deploy_prod.ps1
│   │
│   ├── dev/                      # Local database & development utilities
│   │   ├── backup-db.ps1
│   │   └── rebuild-backend.bat
│   │
│   ├── monitoring/               # Grafana & Prometheus telemetry scripts
│   │   ├── import_local_dashboards.ps1
│   │   ├── prometheus_bridge.js
│   │   └── generate_10_enterprise_dashboards.js
│   │
│   └── testing/                  # Quality assurance & integration suites
│       ├── test_phase4.js        # Production-hardening test suite
│       ├── test_phase5.js        # DevOps, WebSocket & backup test suite
│       ├── test_phase6.js        # QR logistics, UPI & WhatsApp test suite
│       ├── run_e2e_test.py       # End-to-end Cypress/Playwright tester
│       └── load-test.js          # Load and stress test script
│
├── docs/
│   ├── reports/                  # Generated audit & visual UI PDF reports
│   ├── data/                     # Spreadsheet master data files
│   └── tasks/ / sop/             # Standard Operating Procedures & prompts
│
└── grafana_dashboards_clean/     # 10 Enterprise Grafana L1-L3 JSON Dashboards
```

---

## 5. Testing & Verification Suite

To run any of the automated test suites:

```powershell
# Phase 4 Production Hardening Test
node scripts/testing/test_phase4.js

# Phase 5 DevOps & Real-time WebSockets Test
node scripts/testing/test_phase5.js

# Phase 6 Enterprise Innovations (QR / WhatsApp / UPI) Test
node scripts/testing/test_phase6.js

# Full Backend System Integration Test
powershell -ExecutionPolicy Bypass -File scripts/testing/full-backend-system-test.ps1
```

---

## 6. Troubleshooting & FAQs

### Q: Why did the GitHub Actions view in VS Code show blank?
**Answer**: Two reasons:
1. **Large file limit rejection**: Git history had three large binary files (`archives/grafana.zip`, `frontend.zip`, `grafana.exe` totaling ~930 MB) which caused GitHub to reject all pushes (`pre-receive hook declined`). We purged these files from git tracking, added them to `.gitignore`, and successfully pushed to `origin/enterprise-db-redesign`.
2. **Extension cache**: VS Code caches workflow data. Clicking the **Refresh button (`⟳`)** in the GitHub Actions tab or running `GitHub Actions: Refresh` from the Command Palette updates the view immediately.

### Q: How do I resolve port conflicts (e.g. port 8081 or 8082 already in use)?
**Answer**:
```powershell
# Stop all Docker containers
.\run-docker.bat stop all

# Check if a Windows process is holding port 8081
Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
```

### Q: How do I back up the local database?
**Answer**:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/dev/backup-db.ps1
```
