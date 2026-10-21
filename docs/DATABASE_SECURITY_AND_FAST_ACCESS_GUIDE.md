# Futane Agro ERP — Enterprise Database Security & Instant Data Access Guide

This document outlines the **Amazon AWS RDS-grade security hardening**, **instant analytical views**, and **automated backup architecture** implemented on the Futane Agro ERP PostgreSQL database.

---

## 1. Amazon-Grade Zero-Trust Security Hardening

### A. Least-Privilege Role Isolation
The application no longer connects as the root `postgres` superuser. Instead, it adheres to strict enterprise least privilege:
- **`futane_app_user`**:
  - Permissions: Strict `SELECT, INSERT, UPDATE, DELETE` on business tables and sequences.
  - Restrictions: Cannot `DROP` databases, cannot alter PostgreSQL server settings, and has zero superuser rights.
  - Password Encryption: Hardened **SCRAM-SHA-256**.
- **`futane_reader`**:
  - Permissions: Read-only `SELECT` access.
  - Use case: Safe data export, analytical queries, external reporting without any risk of data tampering.
- **`postgres` (Superuser)**:
  - Restricted strictly to localhost administrative schema alterations and backups.

### B. Denial-of-Service & Runaway Query Defense
Configured persistent catalog-level timeouts:
- **`statement_timeout = 30s`**: Any rogue query taking longer than 30 seconds is automatically terminated to protect system memory and table locks.
- **`idle_in_transaction_session_timeout = 60s`**: Automatically frees connection leaks and hanging locks.
- **`log_min_duration_statement = 1000ms`**: Automatically audits and logs any query taking longer than 1 second for proactive performance monitoring.

### C. Network Isolation
PostgreSQL is strictly bound to `127.0.0.1` (localhost loopback). All external incoming network connections are blocked at the socket level.

---

## 2. Ultra-Fast Data Retrieval: Analytical Views ("Get Data Easily")

To retrieve aggregated business intelligence instantly without writing complex multi-table joins, four enterprise views have been created and optimized with B-tree composite indexes:

### 1. Customer Outstanding Balance & Receivables
See who owes what, total sales, collected cash, and last purchase date:
```sql
SELECT party_name, city, total_sales_amount, total_paid_amount, outstanding_balance 
FROM v_customer_outstanding_ledger;
```

### 2. Executive Monthly Sales Summary
One-click monthly cashflow, tax collections, and transaction volume:
```sql
SELECT sales_month, total_transactions, gross_sales_amount, total_collected_cash, pending_receivables 
FROM v_executive_sales_summary;
```

### 3. Real-Time Inventory Valuation & Stock Health
Real-time crate availability, stock levels, and automated reorder alerts:
```sql
SELECT crate_type, material_type, current_stock, stock_health_status 
FROM v_inventory_stock_valuation;
```

### 4. Daily Production KPIs & Yield Percentage
Daily shift output, good crates produced, rejects, and production yield:
```sql
SELECT production_date, shift, crate_type, good_crates_produced, rejected_crates, production_yield_percentage 
FROM v_daily_production_kpis;
```

---

## 3. High-Speed Indexing Architecture

The following high-frequency query paths have been indexed with B-tree composite indexes for sub-millisecond lookups:
- `t_ord_customer_orders(customer_id, created_at DESC)`
- `t_ord_customer_orders(order_status)`
- `t_ord_order_items(order_id)`
- `t_prd_ppm(year, month)`
- `t_prd_breakdown(machine_id, breakdown_date)`
- `t_prd_machine_master(machine_status, is_active)`
- `t_stock_transfers(source_branch_id, destination_branch_id, transfer_date)`
- `t_hr_salary(employee_id, month, year)`
- `t_hr_employee(department, is_active)`
- `t_hr_driver(is_active)`
- `t_fin_transaction(transaction_date, account_type)`

All 39 tables have been analyzed (`ANALYZE VERBOSE`) so the query planner generates optimal execution plans.

---

## 4. Visual Database Studio & ER Explorer

To explore tables, run queries, and inspect relationships visually:
1. Double-click `open-database-ui.bat`.
2. Browse tables, relationships, and the new **`⚡ Analytical Views`** category directly in your browser at `http://localhost:5433`.

---

## 5. Automated Hot Backup Engine (Amazon RDS Style)

To take an instant, compressed, zero-downtime backup with cryptographic integrity protection:
1. Double-click `backup-database-now.bat`.
2. The engine performs:
   - Hot non-blocking compressed dump (`.dump`).
   - Generates a **SHA-256** checksum file (`.dump.sha256`) for tamper detection.
   - Automatically maintains a 7-day rolling retention policy, purging expired backups to save disk space.
