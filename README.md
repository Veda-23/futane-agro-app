# Futane Agro ERP — Enterprise Manufacturing & Distribution Platform

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.15-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-2.7.18-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Angular](https://img.shields.io/badge/Angular-18-DD0031?logo=angular&logoColor=white)](https://angular.io/)
[![Java](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk&logoColor=white)](https://adoptium.net/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#)

> **Futane Agro ERP** is a full-featured, high-performance Enterprise Resource Planning platform designed for industrial plastic crate manufacturing, raw materials inventory control, Indian GST-compliant billing, fleet dispatch logistics, and multi-tenant management.

---

## ⚡ Quick Start: Run on Any Laptop in 60 Seconds

You can run this entire application on any Windows, macOS, or Linux laptop with zero hassle:

### Option 1: 1-Click Launch (Windows)
Double-click:
```bat
quick-start.bat
```
*(Automatically detects Docker or local Java/Node stack, seeds database, and opens the app in your browser)*.

### Option 2: 1-Command Docker Launch (Windows / macOS / Linux)
If you have Docker Desktop installed, run:
```bash
docker compose -f docker-compose.uat.yml up -d
```
Open **[http://localhost:4300](http://localhost:4300)** in your browser.

---

## 🔑 Default Login Credentials

| Role | Username | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **System Super Admin** | `SUPER_ADMIN` | `superadmin123` | Full master control, white-label branding, 23 feature flags, API keys |
| **Operations Admin** | `ADMIN` | `admin123` | Daily operations, GST billing, dispatch approvals, vendor hub |
| **Factory Manager** | `MANAGER` | `manager123` | Daily production batches (PPD/PPM), machines, raw materials |
| **Accountant** | `ACCOUNTANT` | `accountant123` | GST ledgers, payment collections, vouchers, expense tracker |
| **Machine Operator** | `OPERATOR` | `operator123` | Shift production logging, quality rejection records |

> **2FA / OTP Verification:** In development mode, the OTP is printed directly in your terminal console and included in the login response (`tempOtp`). Simply enter the 6-digit code to log in.

---

## 🌐 Master URL & Service Directory

- **ERP Web Application:** [http://localhost:4300](http://localhost:4300)
- **Spring Boot Backend:** `http://localhost:8081/api`
- **Actuator Health Check:** [http://localhost:8081/actuator/health](http://localhost:8081/actuator/health)
- **Visual Database Studio:** [http://localhost:5433](http://localhost:5433) *(Run `open-database-ui.bat`)*
- **PostgreSQL Database:** `127.0.0.1:5432` *(DB: `futane_erp_uat`)*
- **Customer Storefront:** [http://localhost:4300/#/storefront](http://localhost:4300/#/storefront)

---

## 🗄️ Database Security & Accounts

The database is built on **PostgreSQL 16** and fortified with **Amazon AWS RDS-grade least privilege**:
- **Application Role:** `futane_app_user` / `FutaneAgro#Secure2026!App` (DML only, no superuser)
- **Reporting Role:** `futane_reader` / `FutaneAgro#ReadOnly2026!Report` (Read-only `SELECT`)
- **Root Admin:** `postgres` / `Vedant`

### High-Speed Analytical SQL Views:
Query pre-aggregated business metrics instantly:
- `v_customer_outstanding_ledger` — See who owes what and overdue customer balances.
- `v_executive_sales_summary` — Monthly sales volume, collected cash, and GST totals.
- `v_inventory_stock_valuation` — Real-time crate inventory and automated reorder alerts.
- `v_daily_production_kpis` — Daily shift yield percentage, good crates vs. rejects.

---

## 🛠️ Helpful Batch Scripts

| Script | What it does |
| :--- | :--- |
| **`quick-start.bat`** | Master 1-click launcher for the entire ERP system. |
| **`open-database-ui.bat`** | Opens the visual database studio in your browser. |
| **`backup-database-now.bat`** | Takes an instant hot compressed database backup with SHA-256 verification. |
| **`clean-processes.bat`** | Frees memory caches and terminates stray background runners. |
| **`start-ram-watchdog.bat`** | Memory guardian to keep 8GB laptops running smoothly. |

---

## 📖 Complete Documentation & SOP
For the comprehensive module-by-module walkthrough, architecture diagrams, and full Standard Operating Procedure, read:
👉 **[Master Project SOP & User Guide](file:///docs/MASTER_PROJECT_SOP_AND_USER_GUIDE.md)**
