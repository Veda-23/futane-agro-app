# Product Requirements Document (PRD) — Futane Agro ERP

## 1. Executive Summary
Futane Agro Industries is a leading agricultural packaging and supply chain coordinator. This ERP (Enterprise Resource Planning) platform automates production entry, party billing, inventory dispatch, transaction payments, vendor bookkeeping, and driver transport logs.

---

## 2. Target User Roles & Permissions

| Role | Access Level | Description | Accessible Modules |
| :--- | :--- | :--- | :--- |
| **SUPER_ADMIN** | Full Permissions | Database operations, API configuration, User administration. | All |
| **ADMIN** | Management | Read/write access on features; cannot run DB restores or change system level API URLs. | Core, Manufacturing, Commerce, Supply Chain, Finance, HR |
| **ACCOUNTANT** | Finance | Manage transactions, bank registries, payments, salaries, and invoice generation. | Sales, Payments, Invoices, Salaries, Bank, Expenses, Reports |
| **OPERATOR** | Shift Operations | Daily production input, inventory counts, raw material logging, machine monitoring. | Production, Inventory, Raw Materials, Machines |
| **VIEWER** | Read-Only | Read access to dashboard analytics and reports; cannot write or modify data. | Dashboard, Reports, Analytics |

---

## 3. Core Modules & Technical Specifications

### A. Manufacturing & Shop Floor
- **Daily Production Log**: Track hourly production by crate types (e.g., Apple Crate, Tomato Tray). Validates total production against successful/rejected counts.
- **Machine & Shift Monitoring**: Logs operating hours, maintenance logs, and throughput per shift.

### B. Commerce & Billing
- **Party Registry**: Store customer GSTIN, address, contact, and credit limits.
- **Sales & GST Invoicing**: Create tax invoices with automatic SGST/CGST tax splits.
- **Razorpay Payment Integration**: Process online customer invoice payments with automated webhook status checks.

### C. Supply Chain & Logistics
- **Inventory Control**: Real-time stock counts. Increases stock upon successful production entries; decreases stock upon dispatch logs.
- **Dispatch Tracker**: Tracks orders loaded on transport vehicles, matching license plates and drivers.

### D. HR & Salaries
- **Employee Roster**: Track shift allocations, attendance, and basic salary records.
- **Payroll**: Generate monthly salary slips.

---

## 4. Technology Stack & Infrastructure

- **Backend**: Spring Boot 3, Java 17, Spring Security (JWT filter), Hibernate/JPA.
- **Database**: MySQL 8.
- **Frontend**: Angular 17 (Standalone architecture), RxJS, Chart.js.
- **Reverse Proxy**: Nginx 1.25 (configured for TLS/SSL redirection and gzip compression).
- **Deployment**: Docker Compose.
