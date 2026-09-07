# 🚀 FUTANE AGRO ERP — 10-TAB L1, L2, L3 OBSERVABILITY ARCHITECTURE & SOP

---

## 🏛️ Executive Summary

This architecture structures **Futane Agro ERP Real-Time Monitoring** into **3 Tiered Operations Dashboards (L1, L2, L3)**, each featuring **10 Dedicated Collapsable/Expandable Section Tabs** (30 total tabs, 140+ monitored panels) for complete enterprise visibility.

---

## 📺 TIER L1: EXECUTIVE COMMAND CENTER (10 NOC WALLBOARD TABS)
👉 **[View L1 Master Wallboard](http://localhost:3000/d/l1_wallboard_master/l1-executive-command-center-noc-wallboard)**

### 📁 10 Collapsable Section Tabs:
1. **`📺 TAB 1: FUTANE AGRO ERP REAL-TIME SERVICE HEALTH (NOC WALLBOARD)`**
   - Application Service Clusters (`Total` | `Fail` | `Fail %` with RED Alerting when `Fail %` ≥ 5%):
     - `Futane Sales & Billing Portal` (0.1% 🟢)
     - `Razorpay Payment Links & Gateways` (**6.0% 🔴 RED ALERT**)
     - `ERP Web Authentication & Sessions` (0.0% 🟢)
2. **`📊 TAB 2: FUTANE ERP RESPONSE LATENCY SLA HISTOGRAM`**
   - Stacked Bar Histogram: `CCS_2.0 Hits( 🟢 0–2s  🟡 2–4s  🔴 >4s )(Infra)`
3. **`💰 TAB 3: REVENUE, SALES & BUSINESS FINANCIAL LEDGER`**
   - Stat Badges: Total Sales Revenue (`₹`), Pending Balances (`₹`), Paid/Pending Invoices.
4. **`🎛️ TAB 4: INFRASTRUCTURE & JVM CAPACITY GAUGES`**
   - Gauges: HikariCP Pool Saturation, InnoDB Buffer Hit %, System Availability, JVM Heap Used, Free Storage.
5. **`🛡️ TAB 5: SECURITY, SOC & USER COMPLIANCE MONITORING`**
   - Active Sessions, Failed Logins 24h, XSS Threat Filter Hits, MFA Compliance %.
6. **`🌾 TAB 6: FARMER & SUPPLIER SOURCING OPERATIONS`**
   - Farmer Registrations, Procurement Payouts (₹), Raw Material Intake (Tons), Quality Rejection %.
7. **`🏭 TAB 7: MANUFACTURING & PLANT OEE TELEMETRY`**
   - Plant OEE %, Injection Moulding Yield %, Machine Downtime Minutes, Production Velocity.
8. **`🚚 TAB 8: LOGISTICS, DISPATCH & FLEET TRACKING`**
   - Active Fleet Vehicles, On-Time Delivery Rate %, Avg Transport Lead Time, Freight Costs (₹).
9. **`📜 TAB 9: REGULATORY, GST & COMPLIANCE LEDGER`**
   - 18% GST Tax Inflow (₹), E-Way Bills Generated, Audit Trail Velocity, Statutory Compliance Score %.
10. **`🌐 TAB 10: HYBRID CLOUD & MULTI-REGION UAT/PROD HEALTH`**
    - Local Windows UAT Health %, Remote Production Ping Latency (ms), SSL Certificate Expiry Days, Backup Sync Health %.

---

## 🎛️ TIER L2: SUBSYSTEM & DOMAIN OPERATIONS (10 ENGINEERING CONTROL TABS)
👉 **[View L2 Subsystem Control](http://localhost:3000/d/l2_subsystem_control/l2-subsystem-domain-operations-engineering-control)**

### 📁 10 Collapsable Section Tabs:
1. **`🎛️ TAB 1: SUBSYSTEM CORE TELEMETRY & ENGINE BADGES`**
   - Database Active Pool, JVM Heap Used, Nginx Gateway QPS, Razorpay Webhook Latency.
2. **`🎛️ TAB 2: DOMAIN SATURATION & SUBSYSTEM HEALTH GAUGES`**
   - MySQL Pool Utilization %, GC Overhead %, Host CPU Utilization %, Gateway Bandwidth %, Payment Health %.
3. **`📈 TAB 3: SUBSYSTEM PERFORMANCE & CURVE TRENDS`**
   - JVM Heap vs Non-Heap Memory Utilization, MySQL Query Execution Rate vs Slow Queries.
4. **`🛢️ TAB 4: DATABASE JDBC & INNODB ENGINE DEEP-DIVE`**
   - InnoDB Buffer Hit Ratio %, Table Cache Hit %, Query Execution Rate / sec, InnoDB Lock Wait Duration (ms).
5. **`🌐 TAB 5: NETWORK NOC & API GATEWAY DISTRIBUTION`**
   - Nginx Traffic Ingress vs Egress Velocity, TLS Handshake Duration Timeline (ms).
6. **`⚡ TAB 6: SPRING BOOT APM & ACTUATOR METRICS`**
   - Active Spring Beans Count, REST Controller Velocity, HTTP 5xx Error Rate %, GC Pause Duration.
7. **`📦 TAB 7: HIBERNATE ORM & SECOND-LEVEL CACHE ANALYTICS`**
   - Hibernate Cache Hit %, DB Connection Lease Time, Transaction Rollbacks, Entity Persist Rate.
8. **`⚡ TAB 8: ASYNC CRON EXECUTOR & THREAD POOL TELEMETRY`**
   - Executor Queue Saturation %, Active Worker Threads, Email Dispatch Latency, Cron Task Completion Health %.
9. **`🔐 TAB 9: SPRING SECURITY & JWT TOKEN SESSION DRILL-DOWN`**
   - Active JWT Tokens Issued, Token Refresh Rate, Password Reset Volume, RBAC Permission Denied Hits.
10. **`🗄️ TAB 10: FILE SYSTEM, ATTACHMENTS & S3 STORAGE MONITORING`**
    - Invoice PDF Generation Rate, Storage Read/Write IOPS, Backup Sync Velocity, Free Storage Capacity.

---

## 🔍 TIER L3: ROOT CAUSE & DIAGNOSTIC ANALYTICS (10 SRE & LOG DRILL-DOWN TABS)
👉 **[View L3 SRE Diagnostics](http://localhost:3000/d/l3_root_cause_diagnostics/l3-root-cause-diagnostic-analytics-sre-log-drill-down)**

### 📁 10 Collapsable Section Tabs:
1. **`🔍 TAB 1: L3 INCIDENT DIAGNOSTICS & SLO BUDGETS`**
   - MTTR (ms), Error Budget Remaining %, Golden Signal Error Rate %, Active Incident Traces.
2. **`📋 TAB 2: OPERATIONAL LOG STREAMS & SLOW QUERY PROFILES`**
   - Tables: MySQL Top 10 Slowest Query Profiles, System Audit & Security Incident Stream.
3. **`📊 TAB 3: DEEP COMPONENT MEMORY & THREAD DUMPS`**
   - GC Pause Duration & Memory Reclamation Curves, InnoDB Lock Wait & Deadlock Frequency.
4. **`⏱️ TAB 4: FOUR GOLDEN SIGNALS & LATENCY PERCENTILES`**
   - End-to-End API Response Latency Percentiles (p50, p95, p99), Traffic & Saturation Matrix.
5. **`🔮 TAB 5: SRE RELIABILITY FORECAST & COMPONENT AVAILABILITY MATRIX`**
   - Component Availability Matrix Over Time, Continuous Reliability Attainment Forecast.
6. **`🧵 TAB 6: JVM THREAD STATES & DEADLOCK INSPECTION`**
   - Runnable Threads, Timed-Waiting Threads, Thread Contention Index, Deadlocks Detected Alert.
7. **`🛢️ TAB 7: MYSQL INNODB LOCK & TRANSACTION TRACE DRILL-DOWN`**
   - InnoDB Row Lock Waits Timeline, Long-Running Uncommitted Transactions Velocity.
8. **`🪵 TAB 8: LOKI LOG ANALYTICS & EXCEPTION CLUSTERING`**
   - Application Exception Rate by Class (NullPointer, SqlException), Log Volume Velocity.
9. **`🚨 TAB 9: AUTOMATED ALERT EVALUATION & ESCALATION DRILL-DOWN`**
   - Active Firing Alerts, Notification Channel Health %, Alert Eval Duration, PagerDuty Escalations.
10. **`🔄 TAB 10: AUTOMATED RECOVERY, FAILOVER & RESTART TIMELINES`**
    - Spring Boot Auto-Restart Duration (ms), Database Reconnection Time, Circuit Breaker Open Count, Self-Healing System Score %.
