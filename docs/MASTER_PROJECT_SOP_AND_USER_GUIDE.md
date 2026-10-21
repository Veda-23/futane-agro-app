# Futane Agro ERP — Master Standard Operating Procedure (SOP) & Complete User Guide

> **Enterprise Production & Distribution Resource Planning Platform**  
> **Version:** 2.4.0 (PostgreSQL 16 High-Performance Release)  
> **Target Audience:** Developers, Technical Evaluators, System Administrators & Team Collaborators

---

## 1. Executive Summary & Architecture Overview

**Futane Agro ERP** is an industrial-grade enterprise ERP system engineered specifically for agricultural manufacturing, plastic crate injection-molding production, automated inventory control, GST-compliant billing, fleet dispatch logistics, and multi-tenant management.

```
                      ┌──────────────────────────────────────────────┐
                      │    ANGULAR 18 ENTERPRISE FRONTEND            │
                      │    Port: 4300  |  Theme: Industrial Luxury   │
                      └──────────────────────┬───────────────────────┘
                                             │ HTTP/REST + WebSocket
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │    NODE.JS REVERSE PROXY & COMPRESSION       │
                      │    Zero-RAM Streaming Gateway                │
                      └──────────────────────┬───────────────────────┘
                                             │ Proxy: /api & /ws-erp
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │    SPRING BOOT 2.7 / JAVA 17 BACKEND         │
                      │    Port: 8081  |  JVM Heap: <= 384 MB        │
                      └──────────────────────┬───────────────────────┘
                                             │ HikariCP Pool (Max: 8)
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │    POSTGRESQL 16 HIGH-SECURITY CLUSTER       │
                      │    Port: 5432  |  SCRAM-SHA-256 Auth         │
                      │    39 Industrial Tables + 4 Instant Views    │
                      └──────────────────────────────────────────────┘
```

---

## 2. Zero-Friction Setup: How Any Friend Can Run This Project

If you cloned this repository from GitHub, you can launch the complete ecosystem on your laptop in **under 60 seconds** using either of the two methods below:

### Option A: 1-Click Launch (Recommended for Windows)

Simply double-click the included automation batch file in the root directory:
```
quick-start.bat
```
- **What it does automatically:**
  1. Detects if **Docker Desktop** is present. If yes, it launches the entire containerized stack without requiring Java, Node, or PostgreSQL installations.
  2. If running natively, it verifies **Java 17+** and **Node.js 18+**, automatically starts the backend and frontend daemons, and launches `http://localhost:4300` in your default browser.

*(For Mac or Linux users, open your terminal and run `./quick-start.sh`)*.

---

### Option B: 1-Command Docker Launch (Any OS: Windows / macOS / Linux)

If you have Docker Desktop installed, run this single command from the project root:
```bash
docker compose -f docker-compose.uat.yml up -d
```
All three micro-services (PostgreSQL 16, Spring Boot Backend, and Angular Frontend) will build, automatically seed all 39 tables with realistic enterprise data, and bind to port `4300`.

---

### Option C: Manual Native Step-by-Step (For Developers)

If you prefer running each service independently in your terminal:

#### 1. Start PostgreSQL 16
Ensure PostgreSQL is running on port `5432` with a database named `futane_erp_uat`.
*(Default user: `postgres` or `futane_app_user`, password: `FutaneAgro#Secure2026!App`)*.

#### 2. Start Spring Boot Backend
Open a terminal in the project directory:
```bash
java -Xms128m -Xmx384m -jar backend/target/futane-agro-app-0.0.1-SNAPSHOT.jar --spring.profiles.active=uat --server.port=8081
```
*(On first boot, `AppStartupRunner` detects the database and seeds all 18 modules automatically)*.

#### 3. Start Angular Frontend
Open a second terminal:
```bash
node scripts/lightweight-server.js 4300
```
Open [http://localhost:4300](http://localhost:4300) in your web browser.

---

## 3. Master URLs, Ports & Service Directory

| Component | URL / Endpoint | Port | Protocol | Purpose |
| :--- | :--- | :---: | :---: | :--- |
| **Main ERP Web App** | [http://localhost:4300](http://localhost:4300) | `4300` | HTTP | Main Angular Application & Dashboard |
| **Backend REST API** | `http://localhost:8081/api` | `8081` | HTTP | Spring Boot Microservices Core |
| **System Actuator Health** | [http://localhost:8081/actuator/health](http://localhost:8081/actuator/health) | `8081` | HTTP | Live Health Monitoring (`{"status":"UP"}`) |
| **Visual Database Studio** | [http://localhost:5433](http://localhost:5433) | `5433` | HTTP | Built-in ER Explorer (Run `open-database-ui.bat`) |
| **PostgreSQL Database** | `127.0.0.1:5432` | `5432` | TCP | Relational Database Cluster |
| **Customer Storefront** | [http://localhost:4300/#/storefront](http://localhost:4300/#/storefront) | `4300` | HTTP | B2B Customer Self-Service Ordering Portal |

---

## 4. User Accounts, Roles & Login Credentials Matrix

The system comes pre-configured with **Role-Based Access Control (RBAC)** and Two-Factor Authentication (2FA/OTP).

| Username | Password | Role | Access Level & Permissions |
| :--- | :--- | :--- | :--- |
| **`SUPER_ADMIN`** | `superadmin123` | `SUPER_ADMIN` | **Full Master Access**: White-label settings, 23 feature flags, team management, API keys, audit logs, system branding. |
| **`ADMIN`** | `admin123` | `ADMIN` | **Operations Executive**: Daily sales approvals, GST invoice generation, dispatch manifest validation, vendor management. |
| **`MANAGER`** | `manager123` | `MANAGER` | **Factory Supervisor**: Production batch entry (PPD/PPM), shift assignments, inventory reorders, machine maintenance. |
| **`ACCOUNTANT`** | `accountant123` | `ACCOUNTANT` | **Finance Specialist**: Customer payment collection, balance sheets, voucher entry, expense tracking, tax ledgers. |
| **`OPERATOR`** | `operator123` | `OPERATOR` | **Machine Operator**: Real-time production counts, crate quality rejection tracking, shift machine logging. |
| **`VIEWER`** | `viewer123` | `VIEWER` | **Auditor / Read-Only**: View dashboards, generate PDF reports, inspect data without mutation rights. |

> [!TIP]
> **Developer 2FA / OTP Bypass for Easy Testing:**  
> When you log in with any user, the system prompts for a 6-digit OTP code. In UAT/Dev mode, the system prints the OTP directly in the terminal log and includes `"tempOtp":"XXXXXX"` in the login HTTP response. You can type this code immediately to complete login without needing real SMS or email configuration.

---

## 5. Database Connection & Security Matrix

The database is fortified with **Amazon AWS RDS-grade least-privilege security**:

```
Database Type:       PostgreSQL 16
Cluster Host:        127.0.0.1 (Strict localhost loopback)
Default Port:        5432
UAT Database:        futane_erp_uat
Production Database: futane_erp_prod
```

### Available Database Accounts:

| Role | Username | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Hardened Application User** | `futane_app_user` | `FutaneAgro#Secure2026!App` | `SELECT, INSERT, UPDATE, DELETE` on all 39 business tables. Cannot drop database or alter system. |
| **Read-Only Reporting User** | `futane_reader` | `FutaneAgro#ReadOnly2026!Report` | Read-only `SELECT` on all tables & analytical views. Zero risk of data mutation. |
| **Master Administrative Root** | `postgres` | `Vedant` | Full administrative root on database cluster. |

### Instant Analytical SQL Views (High-Speed Reports):
You can query pre-aggregated views directly in `psql` or in the Visual Database Studio:
1. `SELECT * FROM v_customer_outstanding_ledger;` — Outstanding customer balances, payments, and last purchase date.
2. `SELECT * FROM v_executive_sales_summary;` — Monthly sales volume, GST collected, and net receivables.
3. `SELECT * FROM v_inventory_stock_valuation;` — Real-time crate inventory, stock valuation, and reorder alerts.
4. `SELECT * FROM v_daily_production_kpis;` — Shift-by-shift production yield, good crates vs. reject percentages.

---

## 6. Comprehensive Module-by-Module Walkthrough

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                 FUTANE AGRO ERP — NAVIGATION MODULES                   │
  ├──────────────┬──────────────┬──────────────┬──────────────┬────────────┤
  │  Dashboard   │ Billing Hub  │  Inventory   │  Production  │  Logistics │
  ├──────────────┼──────────────┼──────────────┼──────────────┼────────────┤
  │   Dispatch   │  CRM Parties │  HR & Staff  │ Finance/Tax  │  Settings  │
  └──────────────┴──────────────┴──────────────┴──────────────┴────────────┘
```

### 1. Executive Dashboard & Wallboard
- **Purpose**: Real-time command center showing daily crate output, gross billing, active machines, and logistics velocity.
- **Key Metrics**: Daily Production Target vs. Actual, Gross Revenue, Low Stock Alerts, and Machine OEE (Overall Equipment Effectiveness).
- **Interactive Visuals**: Glassmorphic KPI cards with dynamic micro-animations and status pills.

### 2. Billing & GST Invoices Hub
- **Purpose**: Indian GST-compliant invoice generation (B2B Tax Invoices, Delivery Challans, and Bills of Supply).
- **Features**:
  - Auto-calculates **HSN 3923** (Plastic articles for packaging of goods) with 18% GST (9% CGST + 9% SGST).
  - Built-in PDF generation and printable invoices with QR code verification.
  - Multi-status workflow: `PENDING` &rarr; `GENERATED` &rarr; `DISPATCHED` &rarr; `PAID`.

### 3. Inventory & Raw Materials
- **Purpose**: Real-time crate stock tracking across all product variations.
- **Product Catalog**:
  - Export Grade A Grape Crates (Ventilated HDPE)
  - Pomegranate Super-Red Crates (5kg)
  - Kesar Mango Export Boxes (10kg Heavy Duty)
  - Commercial Tomato Trays
  - Citrus Storage & Capsicum Boxes
- **Raw Materials**: Tracks polymer granules (HDPE, Polypropylene PP) and color masterbatches by metric ton with automated reorder warnings.

### 4. Production & Machine Center
- **Purpose**: Daily Production (PPD) and Monthly Production (PPM) logging.
- **Features**:
  - Shift-by-shift logging (Day, Evening, Night).
  - Rejection categorization (short molding, flashing, color variation).
  - Machine breakdown management with downtime tickets and technician logs.

### 5. Fleet Logistics & Dispatch
- **Purpose**: End-to-end transport assignment and gate-pass control.
- **Features**:
  - Driver licensing verification, vehicle registration number, and tare/gross weight recording.
  - Linked directly to sales invoices to prevent unauthorized warehouse exit.

### 6. CRM & Customer Ledger
- **Purpose**: Manage agricultural cooperatives, wholesale distributors, and retail exporters.
- **Features**:
  - Verified GSTIN tracking, PAN card numbers, and credit limit management.
  - Real-time balance calculations showing total billed, paid, and outstanding amounts.

### 7. HR & Staff Management
- **Purpose**: Factory staff, operators, and driver registry.
- **Features**: Department assignments, salary slip generation, shift timings, and emergency contacts.

### 8. Enterprise Settings & White-Label Control Center
- **Purpose**: Multi-tenant rebranding and platform governance.
- **Features**:
  - Change company branding, upload custom logos, set brand colors.
  - Toggle **23 dynamic feature flags** (e.g., Enable SMS alerts, Razorpay payment gateway, dark mode).
  - Manage API keys, incoming webhooks, and team roles.

### 9. Visual Database Studio & ER Explorer
- **How to Open**: Run `open-database-ui.bat`.
- **Features**:
  - Interactive table explorer for all 39 tables.
  - Entity-Relationship (ER) dependency map.
  - Safe Mode (Read-Only) switch with PIN protection.
  - 1-click database snapshot exporter.

---

## 7. Useful 1-Click Maintenance Scripts

| Batch File | Purpose |
| :--- | :--- |
| **`quick-start.bat`** | **Master Launch Script**: Detects Docker or local stack and opens the application in 1 click. |
| **`open-database-ui.bat`** | Launches the browser-based PostgreSQL Developer Studio at `http://localhost:5433`. |
| **`backup-database-now.bat`** | Takes an instant hot compressed database snapshot with **SHA-256** checksum verification. |
| **`clean-processes.bat`** | Flushes memory caches and terminates stray or orphaned runners on low-RAM laptops. |
| **`start-ram-watchdog.bat`** | Background memory guardian that keeps 8GB laptops lag-free during intense development. |
| **`uninstall-all-unused-databases.bat`** | Completely purges legacy MySQL and Oracle services from the host machine with Windows Admin approval. |

---

## 8. Troubleshooting & FAQ

### Q1: The browser says `Connection Refused` on port 4300.
- **Fix**: Run `quick-start.bat` or execute `node scripts/lightweight-server.js 4300` in your terminal to ensure the server is listening.

### Q2: Port 8081 or 4300 is already in use by another application.
- **Fix**: Double-click `clean-processes.bat`. It will safely release the occupied ports and free standby RAM.

### Q3: My laptop only has 8 GB of RAM and feels slow.
- **Fix**: Futane Agro ERP was custom-engineered specifically for 8GB laptops. The Spring Boot backend runs capped at `-Xmx384m` and PostgreSQL uses minimal connection pooling. Run `start-ram-watchdog.bat` to maintain smooth performance.

### Q4: How do I change the database password or host?
- **Fix**: Edit `backend/src/main/resources/application-uat.properties` or provide environment variables (`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`).
