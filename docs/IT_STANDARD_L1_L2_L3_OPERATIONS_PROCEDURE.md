# 📘 IT STANDARD OPERATING PROCEDURE (SOP) & MASTER PROMPT
> **Futane Agro ERP — L1, L2, L3 Real-Time Monitoring & Operations Framework**

---

## 🎯 Executive Overview

In enterprise IT infrastructure, monitoring is structured into **3 distinct operational tiers** to ensure real-time visibility, rapid incident response, and zero operational noise:

```
+-----------------------------------------------------------------------------------+
|                        TIER 1 (L1 OPERATOR / WALLBOARD NOC)                       |
|  - Role: 24/7 Monitoring Operator (Seated at NOC Wallboard display)               |
|  - Focus: High-level Service Health, Request Totals, Fail Counts & Fail %         |
|  - Action: Monitor thresholds; if Fail % > 5.0% (RED Alert), escalate to L2.      |
+-----------------------------------------------------------------------------------+
                                         |
                                         v  (Escalation / Drill-down)
+-----------------------------------------------------------------------------------+
|                   TIER 2 (L2 SUBSYSTEM & DOMAIN CONTROL ENGINEER)                 |
|  - Role: System Engineer / Database Administrator / Network Specialist            |
|  - Focus: APM JVM Memory, HikariCP Connection Pools, Nginx QPS, Razorpay Webhooks  |
|  - Action: Isolate failing subsystem, clear locks, restart services, tune pools.  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v  (Deep Investigation)
+-----------------------------------------------------------------------------------+
|                     TIER 3 (L3 SRE / SENIOR ARCHITECT DIAGNOSTICS)                |
|  - Role: Site Reliability Engineer (SRE) / Lead Backend Architect                 |
|  - Focus: Stack Traces, Loki Log Streams, MySQL Slow Queries, Thread Dumps        |
|  - Action: Perform root-cause fix, deploy hotfixes, conduct post-mortems.         |
+-----------------------------------------------------------------------------------+
```

---

## 📺 TIER L1: EXECUTIVE COMMAND CENTER (NOC WALLBOARD)

### 👤 Operator Persona: **L1 NOC Monitoring Operator**
* **Goal**: Keep eyes on the wallboard screen at all times.
* **Dashboard**: `http://localhost:3000/d/l1_wallboard_master/l1-executive-command-center-noc-wallboard`

### 📊 Monitored Elements (Exact Reference Design):

1. **Service Telemetry Clusters**:
   - **`Branch Portal Login`**: Total Hits (`203,906`), Fail Count (`2,491`), Fail % (`1.2%` 🟢)
   - **`Fundtransfer V3`**: Total Hits (`8,100`), Fail Count (`482`), Fail % (**`6.0%` 🔴 RED ALERT**)
   - **`Bill Payments`**: Total Hits (`14,688`), Fail Count (`15`), Fail % (`0.1%` 🟢)
   - **`ERP Web Auth`**: Total Hits (`3,876`), Fail Count (`0`), Fail % (`0.0%` 🟢)

2. **Latency Distribution SLA Histogram**:
   - `CCS_2.0 Hits( 🟢 0–2s  🟡 2–4s  🔴 >4s )(Infra)`

3. **L1 Standard Escalation Protocol**:
   - **Green Badge (`< 5.0%`)**: Normal operation. No action required.
   - **Red Badge (`≥ 5.0%`)**: Trigger L1 Alert! Notify L2 Subsystem Engineer via Slack/PagerDuty immediately.

---

## 🎛️ TIER L2: SUBSYSTEM & DOMAIN OPERATIONS (ENGINEERING CONTROL)

### 👤 Operator Persona: **L2 System Engineer / DBA / DevOps**
* **Goal**: Isolate subsystem bottlenecks and prevent cascading outages.
* **Dashboard**: `http://localhost:3000/d/l2_subsystem_control/l2-subsystem-domain-operations-engineering-control`

### 📊 Monitored Elements:
* **Database & HikariCP Pool**: Active JDBC connections, pool saturation %, InnoDB buffer hit ratio.
* **JVM & Application Health**: JVM heap memory used, GC overhead %, Tomcat worker threads.
* **Gateway & Network**: Nginx request rate (QPS), bandwidth saturation %, Razorpay webhook latency (ms).

---

## 🔍 TIER L3: ROOT CAUSE & DIAGNOSTIC ANALYTICS (SRE DRILL-DOWN)

### 👤 Operator Persona: **L3 Site Reliability Engineer (SRE) / Lead Developer**
* **Goal**: Conduct deep-dive root-cause analysis (RCA) and deploy hotfixes.
* **Dashboard**: `http://localhost:3000/d/l3_root_cause_diagnostics/l3-root-cause-diagnostic-analytics-sre-log-drill-down`

### 📊 Monitored Elements:
* **SLO & Error Budgets**: Mean Time to Resolve (MTTR), Error budget burn rate %, Golden Signals.
* **Live Incident Log Stream**: Loki/Logstash exception traces, HTTP 5xx error spikes, stack trace inspection.
* **MySQL Slow Query Profiles**: Top 10 longest queries, query lock times, index footprint.

---

## 🤖 MASTER AI GENERATOR PROMPT

```text
PROMPT FOR AI DASHBOARD GENERATOR:

"Generate an IT Standard 3-Tier Observability Platform (L1 Wallboard, L2 Subsystem Engineering, L3 SRE Diagnostics) in Grafana v10.4.2+ for Futane Agro ERP:

1. TIER L1 WALLBOARD (Executive NOC Display):
   - Service Cluster Stat Cards: Each service block MUST display [Total Hits], [Fail Count], and [Fail %] using an expanded width (w=8 / 300px min) to eliminate title truncation.
   - Dynamic Threshold Alerting: Fail % stat cards MUST automatically switch to a solid RED background when Fail % >= 5.0%.
   - Latency SLA Histogram: Stacked bar chart titled 'CCS_2.0 Hits( 🟢 0–2s  🟡 2–4s  🔴 >4s )(Infra)' with series 🟢 0-2s (Optimal), 🟡 2-4s (Degraded), 🔴 >4s (Infra).

2. TIER L2 SUBSYSTEM CONTROL (Engineering Operations):
   - Deep-dive metrics for HikariCP JDBC connection pools, JVM heap bytes, Nginx gateway QPS, Razorpay webhook latency, and sales revenue in INR.

3. TIER T3 SRE DIAGNOSTICS (Log & Trace Drill-Down):
   - Incident indicators (MTTR, SLO Error Budget Burn Rate), Loki real-time exception log streams, and MySQL Top 10 Slow Query execution profiles."
```
