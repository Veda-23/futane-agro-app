export function generateVolume1() {
  return `
  <!-- TITLE PAGE -->
  <div class="avoid-break" style="text-align: center; padding-top: 40px; padding-bottom: 60px;">
    <div style="font-size: 14pt; font-weight: 700; color: #2563eb; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px;">
      Futane Agro Industries Private Limited
    </div>
    <h1 class="book-title" style="font-size: 28pt; margin-bottom: 16px;">
      ENTERPRISE MASTER OPERATING MANUAL<br/>& TECHNICAL SPECIFICATION
    </h1>
    <div style="font-size: 13pt; color: #475569; font-weight: 500; max-width: 650px; margin: 0 auto 30px auto; line-height: 1.4;">
      Standard Operating Procedures, Relational Database DDL Catalog, REST Microservices Architecture, and Visual UI Feature Documentation
    </div>
    
    <div style="display: inline-block; text-align: left; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 18px 24px; margin-top: 20px; font-size: 9pt;">
      <table style="border-collapse: collapse; width: 440px;">
        <tr><td style="padding: 4px 8px; font-weight: 700; color: #0f172a;">Document ID:</td><td style="padding: 4px 8px;">FUTANE-ERP-SOP-2026-V4</td></tr>
        <tr><td style="padding: 4px 8px; font-weight: 700; color: #0f172a;">Release Version:</td><td style="padding: 4px 8px;">2026.4 Enterprise Edition (PostgreSQL 16)</td></tr>
        <tr><td style="padding: 4px 8px; font-weight: 700; color: #0f172a;">Target Environment:</td><td style="padding: 4px 8px;">Windows 11 Laptop (8 GB Physical RAM)</td></tr>
        <tr><td style="padding: 4px 8px; font-weight: 700; color: #0f172a;">Primary Industry:</td><td style="padding: 4px 8px;">Plastic Injection Molding (HSN 3923)</td></tr>
        <tr><td style="padding: 4px 8px; font-weight: 700; color: #0f172a;">Security Standard:</td><td style="padding: 4px 8px;">Zero-Trust Architecture (PBKDF2 SHA-256)</td></tr>
        <tr><td style="padding: 4px 8px; font-weight: 700; color: #0f172a;">Compliance Mandate:</td><td style="padding: 4px 8px;">GST CGST 9% + SGST 9% / IGST 18%</td></tr>
        <tr><td style="padding: 4px 8px; font-weight: 700; color: #0f172a;">Effective Date:</td><td style="padding: 4px 8px;">October 2026</td></tr>
      </table>
    </div>

    <div style="margin-top: 60px; font-size: 8pt; color: #94a3b8;">
      CONFIDENTIAL & PROPRIETARY — FOR AUTHORIZED PERSONNEL ONLY
    </div>
  </div>

  <div class="page-break"></div>

  <!-- TABLE OF CONTENTS -->
  <div>
    <h2 class="volume-title">Master Table of Contents</h2>
    <p style="color: #64748b; font-size: 8.5pt; margin-bottom: 16px;">
      This comprehensive engineering specification and standard operating manual is organized into six formal volumes covering executive governance, relational database architecture, microservice APIs, full visual UI module walkthroughs, departmental standard operating procedures, and laptop operational deployment.
    </p>

    <table class="spec-table" style="font-size: 8.5pt;">
      <thead>
        <tr>
          <th style="width: 15%;">Volume</th>
          <th style="width: 35%;">Volume Title</th>
          <th style="width: 50%;">Core Chapters & Subject Areas</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight: 700; color: #1e3a8a;">Volume I</td>
          <td style="font-weight: 700;">Executive Governance, System Architecture & Zero-Trust Security</td>
          <td>Executive Summary, Plant Manufacturing Profile, Zero-Tolerance Guardrails, Hardware RAM Invariants, Cryptographic Protocol, RBAC Permission Matrix</td>
        </tr>
        <tr>
          <td style="font-weight: 700; color: #1e3a8a;">Volume II</td>
          <td style="font-weight: 700;">Complete Relational Database Catalog & DDL Reference</td>
          <td>PostgreSQL 16 ACID Architecture, Connection Pool Sizing, Relational Entity Graph, 39 Table Schemas, Column Types, Constraints, DDLs, 4 Analytical Views</td>
        </tr>
        <tr>
          <td style="font-weight: 700; color: #1e3a8a;">Volume III</td>
          <td style="font-weight: 700;">Spring Boot REST Microservices & API Encyclopedia</td>
          <td>REST Architectural Invariants, Security Headers, 39 REST Controllers, 150+ Endpoints, Request/Response JSON Schemas, Ledger Algorithms</td>
        </tr>
        <tr>
          <td style="font-weight: 700; color: #1e3a8a;">Volume IV</td>
          <td style="font-weight: 700;">Visual UI Directory & Tab-by-Tab Master Operating Manual</td>
          <td>23 UI Modules + Login Portal, Distinct Screenshots, Field Dictionaries, Step-by-Step SOPs, Mathematical Calculations, Form Validation Rules</td>
        </tr>
        <tr>
          <td style="font-weight: 700; color: #1e3a8a;">Volume V</td>
          <td style="font-weight: 700;">Plant Operations & Departmental Standard Operating Procedures (SOPs)</td>
          <td>SOP-01 to SOP-10: Plant Floor QC, Moisture Testing, Quota Planning, Warehouse Dispatch, Gate Weighment, GST Tax Invoicing, Biometric Payroll</td>
        </tr>
        <tr>
          <td style="font-weight: 700; color: #1e3a8a;">Volume VI</td>
          <td style="font-weight: 700;">DevOps, Disaster Recovery & Friend Laptop Execution Runbook</td>
          <td>Windows 11 8GB RAM Tuning, Automated Database Backups, PITR Recovery, Friend Quickstart Runbook, Troubleshooting Encyclopedia (ERR-001 to ERR-050)</td>
        </tr>
      </tbody>
    </table>

    <div class="callout callout-info" style="margin-top: 14px;">
      <strong>Notice to Auditors and Engineers:</strong> All algorithms, database schemas, and cryptographic workflows defined herein represent the active, audited implementation running in production. No modifications to GST calculation formulas, invoice sequencing, or database constraints may be made without prior formal architectural approval.
    </div>
  </div>

  <div class="page-break"></div>

  <!-- VOLUME I CHAPTERS -->
  <div>
    <h2 class="volume-title">Volume I: Executive Governance, Architecture & Security</h2>
    
    <h3 class="chapter-title">Chapter 1: Executive Summary & Enterprise Background</h3>
    <p>
      Futane Agro Industries Private Limited is a specialized manufacturing enterprise engaged in high-precision plastic injection molding for industrial, agricultural, and commercial supply chain applications. The primary manufactured product line consists of heavy-duty storage and transport crates designed for agricultural produce, dairy logistics, cold storage logistics, and general industrial transport.
    </p>
    <p>
      The factory operates round-the-clock (24x7) utilizing heavy hydraulic and toggle injection molding machines ranging from 250 tons to 650 tons clamping force. The primary raw material consumed is polypropylene (PP) copolymer and high-density polyethylene (HDPE) polymer granules, combined with masterbatch pigments and UV stabilizers. Finished products are classified under Harmonized System of Nomenclature (HSN) Code <strong>3923</strong> ("Articles for the conveyance or packing of goods, of plastics").
    </p>

    <h4 class="section-title">1.1 Core Manufacturing Operations Profile</h4>
    <table class="spec-table">
      <thead>
        <tr>
          <th>Attribute</th>
          <th>Plant Specification</th>
          <th>Operational Invariant</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Core Products</td>
          <td>500ml, 1 Liter, 2 Liter Dairy & Agro Crates</td>
          <td>Standardized mold cycle times (38s to 55s per shot)</td>
        </tr>
        <tr>
          <td>HSN Code</td>
          <td>3923</td>
          <td>Mandatory GST rate of 18% (9% CGST + 9% SGST or 18% IGST)</td>
        </tr>
        <tr>
          <td>Production Shifts</td>
          <td>Shift 1 (08:00 - 16:00), Shift 2 (16:00 - 00:00), Shift 3 (00:00 - 08:00)</td>
          <td>Continuous shift logging with real-time scrap tracking</td>
        </tr>
        <tr>
          <td>Polymer Feedstock</td>
          <td>Virgin PP Granules, Recycled Regrind, Color Masterbatch</td>
          <td>Batch moisture check & scrap recovery recycling loop</td>
        </tr>
        <tr>
          <td>Fleet Logistics</td>
          <td>Multi-axle commercial transport vehicles (14ft, 17ft, 22ft)</td>
          <td>Gate pass weighment, driver KYC verification & E-Way Bill matching</td>
        </tr>
      </tbody>
    </table>

    <h3 class="chapter-title">Chapter 2: Zero-Tolerance Enterprise Guardrails</h3>
    <p>
      The Futane Agro ERP system enforces strict operational invariants known as the <em>Zero-Tolerance Guardrails</em>. These guardrails protect the business from financial discrepancies, tax audit penalties, data corruption, and system performance degradation.
    </p>

    <div class="callout callout-guardrail">
      <strong>MANDATORY GUARDRAIL 1 — GST Calculation & HSN Compliance:</strong>
      All invoices generated under HSN 3923 must calculate Goods and Services Tax strictly at 18.00%. For intra-state transactions within Maharashtra, CGST is exactly 9.00% and SGST is exactly 9.00%. For inter-state transactions, IGST is exactly 18.00%. No rounding or manual tax adjustment is permitted on individual line items; rounding is performed solely on the final invoice grand total to the nearest integer.
    </div>

    <div class="callout callout-guardrail">
      <strong>MANDATORY GUARDRAIL 2 — Financial Ledger Integrity:</strong>
      Invoice numbering sequences must be sequential, continuous, and unalterable. Customer balance ledgers must automatically reflect payments, credit notes, and dispatch billing. Manual manipulation of invoice totals or customer outstanding balances outside audited double-entry journal records is strictly prohibited by database foreign keys and trigger constraints.
    </div>

    <div class="callout callout-guardrail">
      <strong>MANDATORY GUARDRAIL 3 — 8 GB RAM Physical Laptop Ceiling:</strong>
      The host hardware is a standard commercial laptop with 8 GB of total physical RAM running 64-bit Windows 11. To prevent swapping, thrashing, and OS freeze, strict resource limits are enforced:
      <ul style="margin: 4px 0 0 16px; padding: 0;">
        <li>Node.js V8 Heap: Maximum <strong>1536 MB</strong> (<code>--max-old-space-size=1536</code>)</li>
        <li>Java Spring Boot Heap: Initial <strong>256 MB</strong>, Maximum <strong>512 MB</strong> (<code>-Xms256m -Xmx512m</code>)</li>
        <li>PostgreSQL 16 Engine: Shared buffers <strong>128 MB</strong>, Work memory <strong>16 MB</strong>, Max connections <strong>25</strong></li>
        <li>HikariCP Connection Pool: Maximum <strong>8 active connections</strong></li>
      </ul>
    </div>

    <h3 class="chapter-title">Chapter 3: Zero-Trust Cryptographic Security Architecture</h3>
    <p>
      Futane Agro ERP implements a state-of-the-art Zero-Trust security paradigm inspired by defense-in-depth financial systems. The fundamental principle is: <em>"Never Trust, Always Verify."</em> Every API request, user session, and database transaction undergoes rigorous cryptographic validation.
    </p>

    <h4 class="section-title">3.1 Cryptographic Password Hashing & Key Derivation</h4>
    <p>
      User credentials are encrypted using Password-Based Key Derivation Function 2 (PBKDF2) combined with HMAC-SHA-256. Each password hash incorporates a 128-bit cryptographically secure random salt generated via <code>java.security.SecureRandom</code>, iterated across 10,000 computation cycles:
    </p>
    <pre class="code-block">
KeySpec spec = new PBEKeySpec(password.toCharArray(), salt, 10000, 256);
SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
byte[] hash = factory.generateSecret(spec).getEncoded();
String secureRecord = Base64.getEncoder().encodeToString(salt) + ":" + Base64.getEncoder().encodeToString(hash);
    </pre>

    <h4 class="section-title">3.2 Dual-Phase Challenge-Response Multi-Factor Verification</h4>
    <p>
      Authentication proceeds through a two-stage zero-trust challenge:
    </p>
    <ol style="margin-top: 4px; padding-left: 18px;">
      <li><strong>Phase 1: Credential Verification:</strong> The client submits username and password over TLS. The server verifies credentials against PBKDF2 hash. If valid, an ephemeral 6-digit Time-Based One-Time Password (OTP) is generated and associated with a high-entropy session nonce valid for exactly 300 seconds.</li>
      <li><strong>Phase 2: Cryptographic Token Minting:</strong> The user enters the OTP challenge code. Upon verification, the server issues a digitally signed JSON Web Token (JWT) utilizing HMAC-SHA-512 with embedded claims (User ID, Role, Tenant ID, Expiration).</li>
    </ol>

    <h3 class="chapter-title">Chapter 4: Role-Based Access Control (RBAC) Permission Matrix</h3>
    <p>
      The system defines six hierarchical administrative and operational roles with fine-grained granular permissions across all 23 application modules:
    </p>

    <table class="spec-table">
      <thead>
        <tr>
          <th>Module / Function</th>
          <th>SUPER_ADMIN</th>
          <th>ADMIN</th>
          <th>MANAGER</th>
          <th>ACCOUNTANT</th>
          <th>OPERATOR</th>
          <th>VIEWER</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Executive Dashboard</td><td>Full</td><td>Full</td><td>Full</td><td>Full</td><td>View Only</td><td>View Only</td></tr>
        <tr><td>Daily Production (PPD)</td><td>Full</td><td>Full</td><td>Full</td><td>View Only</td><td>Create / Edit</td><td>View Only</td></tr>
        <tr><td>Monthly Production (PPM)</td><td>Full</td><td>Full</td><td>Full</td><td>No Access</td><td>View Only</td><td>View Only</td></tr>
        <tr><td>Finished Inventory</td><td>Full</td><td>Full</td><td>Full</td><td>View Only</td><td>Update Stock</td><td>View Only</td></tr>
        <tr><td>Injection Machines</td><td>Full</td><td>Full</td><td>Full</td><td>No Access</td><td>Log Breakdown</td><td>View Only</td></tr>
        <tr><td>Raw Materials (PP)</td><td>Full</td><td>Full</td><td>Full</td><td>View Only</td><td>Log Usage</td><td>View Only</td></tr>
        <tr><td>Suppliers & Vendors</td><td>Full</td><td>Full</td><td>Full</td><td>View Only</td><td>No Access</td><td>View Only</td></tr>
        <tr><td>Sales Orders</td><td>Full</td><td>Full</td><td>Full</td><td>View Only</td><td>No Access</td><td>View Only</td></tr>
        <tr><td>Dispatch & Gate Pass</td><td>Full</td><td>Full</td><td>Full</td><td>View Only</td><td>Create Pass</td><td>View Only</td></tr>
        <tr><td>Fleet Transports</td><td>Full</td><td>Full</td><td>Full</td><td>No Access</td><td>View Only</td><td>View Only</td></tr>
        <tr><td>Commercial Drivers</td><td>Full</td><td>Full</td><td>Full</td><td>No Access</td><td>View Only</td><td>View Only</td></tr>
        <tr><td>Customer Directory (CRM)</td><td>Full</td><td>Full</td><td>Full</td><td>View Only</td><td>No Access</td><td>View Only</td></tr>
        <tr><td>Customer Payments</td><td>Full</td><td>Full</td><td>View Only</td><td>Full</td><td>No Access</td><td>View Only</td></tr>
        <tr><td>GST Tax Invoices</td><td>Full</td><td>Full</td><td>View Only</td><td>Full</td><td>No Access</td><td>View Only</td></tr>
        <tr><td>Consolidated Billing Hub</td><td>Full</td><td>Full</td><td>View Only</td><td>Full</td><td>No Access</td><td>View Only</td></tr>
        <tr><td>Bank Reconciliation</td><td>Full</td><td>Full</td><td>No Access</td><td>Full</td><td>No Access</td><td>No Access</td></tr>
        <tr><td>Expense Vouchers</td><td>Full</td><td>Full</td><td>View Only</td><td>Full</td><td>No Access</td><td>No Access</td></tr>
        <tr><td>Workforce Salaries</td><td>Full</td><td>Full</td><td>No Access</td><td>Full</td><td>No Access</td><td>No Access</td></tr>
        <tr><td>HR Employee Directory</td><td>Full</td><td>Full</td><td>Full</td><td>View Only</td><td>No Access</td><td>View Only</td></tr>
        <tr><td>Executive Reports</td><td>Full</td><td>Full</td><td>Full</td><td>Full</td><td>No Access</td><td>View Only</td></tr>
        <tr><td>Power BI Analytics</td><td>Full</td><td>Full</td><td>Full</td><td>Full</td><td>No Access</td><td>View Only</td></tr>
        <tr><td>Security Audit Trail</td><td>Full</td><td>View Only</td><td>No Access</td><td>No Access</td><td>No Access</td><td>No Access</td></tr>
        <tr><td>System Settings & RBAC</td><td>Full</td><td>View Only</td><td>No Access</td><td>No Access</td><td>No Access</td><td>No Access</td></tr>
      </tbody>
    </table>

    <div class="page-break"></div>

    <h3 class="chapter-title">Chapter 5: Relational Integrity & Double-Entry Financial Graph</h3>
    <p>
      The core financial and manufacturing ledger of Futane Agro ERP operates under strict mathematical double-entry invariants. Every physical movement of materials or commercial commitment maps deterministically to corresponding ledger postings.
    </p>

    <h4 class="section-title">5.1 Transactional Lifecycle Graph</h4>
    <p>
      The diagram below outlines the sequential state transitions from sales booking to payment clearance:
    </p>

    <table class="spec-table">
      <thead>
        <tr>
          <th>Transaction Stage</th>
          <th>Trigger Event</th>
          <th>Inventory Mutation</th>
          <th>Financial Ledger Posting</th>
          <th>Audit Log Action</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Stage 1: Sales Order</strong></td>
          <td>Customer places order via sales desk or web portal</td>
          <td>Reserved stock allocated; no physical reduction</td>
          <td>Commitment ledger entry (Unbilled Orders)</td>
          <td><code>SALES_ORDER_CREATED</code></td>
        </tr>
        <tr>
          <td><strong>Stage 2: Production Run</strong></td>
          <td>Molding shift logs daily crates produced</td>
          <td>Raw material PP decremented; Finished inventory credited</td>
          <td>Work-in-Progress (WIP) transferred to Finished Goods</td>
          <td><code>PPD_SHIFT_LOGGED</code></td>
        </tr>
        <tr>
          <td><strong>Stage 3: Dispatch & Gate Pass</strong></td>
          <td>Vehicle weighed and loaded with crates</td>
          <td>Finished crate stock physically decremented</td>
          <td>Goods In Transit (GIT) ledger activated</td>
          <td><code>GATE_PASS_ISSUED</code></td>
        </tr>
        <tr>
          <td><strong>Stage 4: Tax Invoice</strong></td>
          <td>Official HSN 3923 tax invoice issued</td>
          <td>None (already decremented at Stage 3)</td>
          <td>Customer Accounts Receivable debited; GST Liability credited</td>
          <td><code>INVOICE_GENERATED</code></td>
        </tr>
        <tr>
          <td><strong>Stage 5: Payment Receipt</strong></td>
          <td>Customer remits funds via RTGS/NEFT/Cheque</td>
          <td>None</td>
          <td>Customer Accounts Receivable credited; Bank Account debited</td>
          <td><code>PAYMENT_COLLECTED</code></td>
        </tr>
      </tbody>
    </table>

    <div class="page-break"></div>

    <h3 class="chapter-title">Chapter 6: Real-Time WebSocket Telemetry & Nonce Protocol</h3>
    <p>
      Plant floor injection molding machine telemetry, sensor feeds, live production counters, and administrative alert notifications are broadcast in real time across the factory local area network using <strong>STOMP over SockJS WebSockets</strong> (endpoint: <code>/ws-erp</code>).
    </p>

    <h4 class="section-title">6.1 WebSocket Channel Architecture</h4>
    <table class="spec-table">
      <thead>
        <tr>
          <th>Topic / Channel</th>
          <th>Publishing Source</th>
          <th>Subscribing Clients</th>
          <th>Payload Invariant</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>/topic/telemetry/machines</code></td>
          <td>Machine PLC gateway & breakdown monitor</td>
          <td>Executive Dashboard, Machine Maintenance</td>
          <td>Clamping force, cycle time, barrel temperature, status</td>
        </tr>
        <tr>
          <td><code>/topic/production/shifts</code></td>
          <td>Plant floor shift logging operator</td>
          <td>Production PPD, PPM Targets, Analytics</td>
          <td>Successful crate counts, scrap kg, efficiency %</td>
        </tr>
        <tr>
          <td><code>/topic/alerts/critical</code></td>
          <td>Zero-Trust Security & Inventory monitors</td>
          <td>All connected Super Admin & Manager sessions</td>
          <td>Low stock warnings, rate limit breaches, OOM risks</td>
        </tr>
      </tbody>
    </table>

    <h4 class="section-title">6.2 Replay Protection via Ephemeral Nonces</h4>
    <p>
      To prevent transaction replay attacks across financial or inventory mutations, every modifying REST request (<code>POST</code>, <code>PUT</code>, <code>DELETE</code>) must present a single-use UUIDv4 nonce in the <code>X-Request-Nonce</code> header. The server records used nonces in an in-memory sliding window cache valid for 300 seconds. If an identical nonce is presented within the window, the request is immediately rejected with HTTP 409 Conflict.
    </p>

    <div class="page-break"></div>

    <h3 class="chapter-title">Chapter 7: Enterprise Multi-Tenant Partitioning & White-Labeling</h3>
    <p>
      Futane Agro ERP incorporates a multi-tenant partitioning architecture allowing a single application instance to serve multiple operational divisions or white-labeled client brands with strict cryptographic and relational data isolation.
    </p>

    <h4 class="section-title">7.1 Hibernate Tenant Discriminator Filter</h4>
    <p>
      Every core business entity table contains a <code>tenant_id</code> column (defaulting to <code>futane_agro</code>). Hibernate dynamic session filters automatically append <code>WHERE tenant_id = :activeTenantId</code> to all generated SQL queries:
    </p>
    <pre class="code-block">
@FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "tenantId", type = String.class))
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class BaseTenantEntity { ... }
    </pre>

    <h4 class="section-title">7.2 Dynamic CSS Variable Theme Injection</h4>
    <p>
      When a user authenticates, the client Angular application fetches the tenant branding configuration from <code>/api/tenant-config/{tenantId}</code> and injects custom CSS variables directly into the document root:
    </p>
    <pre class="code-block">
document.documentElement.style.setProperty('--primary', tenantConfig.primaryColor);
document.documentElement.style.setProperty('--primary-gradient', tenantConfig.gradientCss);
document.title = tenantConfig.companyName + " — Manufacturing ERP";
    </pre>

    <div class="page-break"></div>

    <h3 class="chapter-title">Chapter 8: Enterprise Event Bus & Asynchronous Financial Ledger Schedulers</h3>
    <p>
      To prevent write contention on high-velocity transactional tables (such as machine cycle counters and barcode scan inputs), Futane Agro ERP employs an internal Spring ApplicationEventPublisher bus combined with asynchronous executor workers.
    </p>

    <h4 class="section-title">8.1 Asynchronous Event Lifecycle</h4>
    <table class="spec-table">
      <thead>
        <tr>
          <th>Application Event</th>
          <th>Triggering Action</th>
          <th>Async Listener Handling</th>
          <th>Consistency Guarantees</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>ProductionShiftCompletedEvent</code></td>
          <td>Shift supervisor signs off daily PPD record</td>
          <td>Recalculates finished crate inventory, updates PPM monthly progress bar</td>
          <td>Transaction committed before event firing; idempotency key prevents double counting</td>
        </tr>
        <tr>
          <td><code>InvoiceFinalizedEvent</code></td>
          <td>Accountant issues final GST invoice</td>
          <td>Posts journal entries to general ledger, queues background PDF rendering</td>
          <td>Strict ACID transactional boundary; rollback on ledger balance inequality</td>
        </tr>
        <tr>
          <td><code>PaymentClearedEvent</code></td>
          <td>Cheque / NEFT receipt marked CLEARED</td>
          <td>Updates customer outstanding balance, checks and unlocks credit freeze flags</td>
          <td>Atomic CAS (Compare-And-Swap) ledger balance update with row-level locking</td>
        </tr>
        <tr>
          <td><code>SecurityAlertEvent</code></td>
          <td>Rate limit exceeded, OOM warning, or failed OTP</td>
          <td>Logs entry to immutable <code>audit_logs</code> table, pushes WebSocket alert</td>
          <td>Runs in dedicated <code>REQUIRES_NEW</code> transaction to guarantee write</td>
        </tr>
      </tbody>
    </table>

    <h4 class="section-title">8.2 Background Scheduler Frequency Matrix</h4>
    <table class="spec-table">
      <thead>
        <tr>
          <th>Scheduled Worker</th>
          <th>Cron Expression</th>
          <th>Execution Frequency</th>
          <th>RAM Footprint & GC Policy</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Telemetry Buffer Flush</td>
          <td><code>*/10 * * * * *</code></td>
          <td>Every 10 seconds</td>
          <td>Batches in-memory PLC sensor points; max 50 items per write</td>
        </tr>
        <tr>
          <td>Expired OTP Purge</td>
          <td><code>0 */15 * * * *</code></td>
          <td>Every 15 minutes</td>
          <td>Deletes challenge records older than 300 seconds</td>
        </tr>
        <tr>
          <td>Daily Database Maintenance</td>
          <td><code>0 0 2 * * *</code></td>
          <td>Daily at 02:00 AM</td>
          <td>Runs <code>VACUUM ANALYZE</code> on hot transactional tables</td>
        </tr>
        <tr>
          <td>Automated PITR Backup</td>
          <td><code>0 30 2 * * *</code></td>
          <td>Daily at 02:30 AM</td>
          <td>Executes <code>pg_dump</code> with custom gzip compression</td>
        </tr>
      </tbody>
    </table>

    <div class="page-break"></div>

    <h3 class="chapter-title">Chapter 9: Zero-Trust Cryptographic Token Lifecycle & Ephemeral Nonce Protocols</h3>
    <p>
      Futane Agro ERP enforces a Zero-Trust security paradigm across all architectural boundaries. No user, service, or network interface is implicitly trusted, regardless of whether access originates from within the plant local area network or a remote mobile endpoint.
    </p>

    <h4 class="section-title">9.1 Cryptographic Token Structure & Signing</h4>
    <p>
      Authentication tokens are formatted as standard RFC 7519 JSON Web Tokens (JWT) signed using the <strong>HMAC-SHA-512</strong> cryptographic algorithm with a 512-bit cryptographically secure pseudorandom key (CSPRNG) stored in the environment configuration:
    </p>
    <table class="spec-table">
      <thead>
        <tr>
          <th>Token Attribute</th>
          <th>Internal Specification</th>
          <th>Security Invariant</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Algorithm Header</td>
          <td><code>{"alg": "HS512", "typ": "JWT"}</code></td>
          <td>Rejects <code>none</code> algorithm; enforces explicit HS512 validation</td>
        </tr>
        <tr>
          <td>Payload Claims</td>
          <td><code>sub</code> (Username), <code>role</code> (RBAC Role), <code>tenant_id</code>, <code>exp</code>, <code>iat</code>, <code>jti</code></td>
          <td>Payload is base64url encoded; no plaintext sensitive data stored</td>
        </tr>
        <tr>
          <td>Token Lifespan</td>
          <td>28,800 seconds (8 hours standard shift duration)</td>
          <td>Tokens cannot be refreshed after expiration; re-login required</td>
        </tr>
        <tr>
          <td>Session Invalidation</td>
          <td>Server-side blacklist maintained in Guava cache</td>
          <td>Logout immediately places <code>jti</code> (JWT ID) in blacklist until expiry</td>
        </tr>
      </tbody>
    </table>

    <h4 class="section-title">9.2 Ephemeral Nonce & Anti-Tamper Verification Flow</h4>
    <p>
      Financial mutations and state-changing requests undergo a three-stage anti-tamper verification pipeline prior to controller execution:
    </p>
    <ol style="font-size: 8.5pt; line-height: 1.6; margin-left: 20px;">
      <li><strong>Header Extraction:</strong> The <code>ZeroTrustSecurityFilter</code> extracts <code>X-Request-Nonce</code> and <code>X-Client-Timestamp</code> headers.</li>
      <li><strong>Drift Validation:</strong> The server verifies that <code>|System.currentTimeMillis() - clientTimestamp| &lt; 30,000 ms</code>. Requests outside the 30-second window are rejected with <code>400 Bad Request (Clock Skew)</code>.</li>
      <li><strong>Cache Verification:</strong> The nonce UUID is checked against an atomic concurrent hash map. If present, the request is flagged as a replay attack and rejected with <code>409 Conflict</code>. If unique, the nonce is stored with a 300-second TTL.</li>
      <li><strong>Audit Logging:</strong> The transaction signature is appended to the <code>audit_logs</code> repository, binding the authenticated identity to the mutated state.</li>
    </ol>
  </div>
  `;
}
