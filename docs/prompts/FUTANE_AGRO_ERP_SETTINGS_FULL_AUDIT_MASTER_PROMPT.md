# Futane Agro ERP: Comprehensive Settings Sub-Tabs & Button Mutation Master Prompt

> **Version:** 2.5.0  
> **Target Module:** Super Admin Settings Control Center (`/settings`)  
> **Scope:** Full End-to-End Audit across all 11 Sub-Tabs, 10 Modals, Button Actions & State Mutations  
> **Environment:** Production / UAT Enterprise Angular 17 + Spring Boot Runtime  
> **Audience:** Lead Systems Architects, Automated QA Agents, Enterprise Audit Teams  

---

## 🎯 Master Prompt Context & Execution Directive

```markdown
You are the Principal Systems Quality Architect and Enterprise Test Automation Specialist for Futane Agro ERP (Precision Plastic Injection Molding & Agro-Industrial Material Handling Platform).

Your objective is to conduct a exhaustive, empirical validation of the entire Super Admin Settings Control Center (`/settings`). 
You must test EVERY sub-navigation tab, EVERY interactive button, form input, modal dialog, and dropdown selector. Crucially, you must empirically verify whether state mutations actually occur (i.e. does the data persist, does the DOM reactively re-render, do theme tokens update app-wide, and do API/localStorage writes take effect?).

Take high-resolution screenshots before, during, and after mutations. Log exact JSON payloads and error-free telemetry.
```

---

## 📋 Complete 11 Sub-Tab Audit & Mutation Test Matrix

### 1. Subtab 01: 200+ Enterprise Customizations & White-Label Hub (`#subtab-enterprise-customizations`)
- [ ] **Initial Layout & Statistics:**
  - Verify top module banner: Active title, 208 catalog options pill, multi-tenant indicator.
  - Verify 4 KPI cards: Total Customizations (208), Active Template, Filtered Options, Multi-Tenant Status (Isolated).
- [ ] **Interactive Buttons & Selectors:**
  - Category Pills: Test switching across all 8 domains (`Branding & White-Label`, `Multi-Company & Entity`, `Invoicing, Tax & Currency`, `Manufacturing & Shop Floor`, `Inventory & Raw Materials`, `Logistics & Dispatch`, `Workforce & Payroll`, `Security & Governance`, `ALL`).
  - Search Input: Test real-time filtering with search terms (e.g., `scrap`, `gst`, `tax`).
  - Template Cards: Test 1-click industry presets (`agri_plastics`, `plastics_moulding`, `textiles_garments`, `auto_engineering`).
  - Action Buttons: Test `Export JSON`, `Import JSON`, `Reset to Defaults`, `Save Customizations`.
- [ ] **Mutation Verification (Empirical Proof):**
  - Verify that applying `plastics_moulding` changes `selectedIndustryId` and reconfigures units of measure (`Pieces (Nos)`), lot prefixes, and brand titles.
  - Verify that updating individual keys writes directly to tenant configuration and persists via `saveTenantConfig()` in `localStorage`.

---

### 2. Subtab 02: Branding & Visual Themes (`#subtab-branding`)
- [ ] **Visual Identity Controls:**
  - Brand Palette: Test preset color swatches (Royal Blue `#0B47D4`, Emerald `#059669`, Violet `#7c3aed`, Crimson `#dc2626`, Cyan `#0891b2`, Slate `#0f172a`).
  - Density Controls: Test 3 table density modes (`Compact`, `Comfortable`, `Spacious`).
  - Typography: Test font family dropdown (`Inter`, `Plus Jakarta Sans`, `Outfit`, `Roboto`, `JetBrains Mono`).
  - Logo System: Test company logo upload trigger, live preview, and `Reset to Default Logo`.
- [ ] **Buttons & Actions:**
  - Test `Save Configuration`, `Restore Defaults`, `Sync Theme Tokens`.
- [ ] **Mutation Verification (Empirical Proof):**
  - Verify that selecting `#059669` immediately sets CSS custom variables `--brand-primary`, `--primary`, and `--doc-theme` on `:root`.
  - Verify that clicking `Compact` adds class `density-compact` to `document.body` and updates `localStorage.getItem('futane_table_density')`.
  - Verify that editing App Display Name updates `document.title` and `terminologyService.current.appName` in real time.

---

### 3. Subtab 03: Multi-Company ERP, Banking & Invoice Designer (`#subtab-business-rules`)
- [ ] **Company Profiles & Banking Management:**
  - Company Cards: Verify Legal Entity cards with GSTIN, PAN, CIN, and Registered Address.
  - Test `+ Add Legal Company` button -> Opens Company Modal -> Validates 15-character GSTIN regex -> Saves new company profile.
  - Test `+ Add Bank Account` button -> Opens Bank Modal -> Validates IFSC code and UPI ID -> Saves bank account.
  - Test `Set Default Company` and `Set Primary Bank` switches.
- [ ] **Invoice Print & Layout Designer:**
  - Multi-Document Selector: Switch between `Tax Invoice (GST)`, `Proforma Invoice`, `Delivery Challan`, `Payment Receipt`, `Purchase Invoice`, `Salary Slip`.
  - Designer Switches: Toggle `Show Bank Details`, `Show UPI QR Code`, `Show Company Logo`, `Show HSN Summary Table`.
  - Header & Footer Notes: Edit Terms & Conditions and Legal Jurisdiction clause.
- [ ] **Buttons & Actions:**
  - Test `Save Invoice Template`, `Save Business Rules`, `Preview Printable A4 Invoice`.
- [ ] **Mutation Verification (Empirical Proof):**
  - Verify changes in `invoiceTitle` and `invoice_prefix` reflect in live print preview and persist to `futane_invoice_template_config`.

---

### 4. Subtab 04: Teams Directory & Department Structure (`#subtab-teams`)
- [ ] **Department Structure:**
  - Directory View: Verify 5 base departments (`MFG`, `SCM`, `FIN`, `QA`, `ADM`) with icons and staff count badges.
  - Search & Status Filter: Filter departments by search keywords and status (`ACTIVE`, `INACTIVE`, `ALL`).
- [ ] **Buttons & Actions:**
  - Test `+ Add Department` button -> Opens Department Modal.
  - Modal Form: Input Department Name, Code, Description, Color Tag, Icon, and Sidebar Toggle.
  - Test `Save Department`, `Edit Department`, `Toggle Active Status`, `Delete Department`.
- [ ] **Mutation Verification (Empirical Proof):**
  - Verify adding a department increments `teamsList.length`, renders a new card in the DOM, and assigns staff dynamically.

---

### 5. Subtab 05: Extensible Dynamic Schema Fields (`#subtab-custom-fields`)
- [ ] **Schema Entity Selector:**
  - Switch between target entities: `PARTIES`, `ITEMS`, `INVOICES`, `PRODUCTION_BATCHES`, `MACHINES`, `VENDORS`, `SALES_ORDERS`, `DISPATCH`.
  - Verify existing custom field records and data types (`TEXT`, `NUMBER`, `SELECT_DROPDOWN`, `CHECKBOX`, `DATE`).
- [ ] **Buttons & Actions:**
  - Test `+ Add Custom Field` button -> Opens Schema Modal.
  - Modal Form: Enter Field Label, Field Key, Type, Required checkbox, Default Value, Dropdown Options JSON.
  - Test `Save Field Definition`, `Edit Field`, `Delete Custom Field`.
- [ ] **Mutation Verification (Empirical Proof):**
  - Verify newly created field key is saved to `localStorage.getItem('futane_custom_field_defs')` and dynamically injected into the respective form table.

---

### 6. Subtab 06: WhatsApp & SMS Dispatch Engine (`#subtab-notifications`)
- [ ] **Templates & Channel Dispatch:**
  - Channel Filter: Switch between `ALL`, `WHATSAPP`, `SMS`, `EMAIL`.
  - Status Filter: Filter by `ACTIVE` vs `PAUSED`.
  - Placeholder Token Strip: Verify token pills (`{customer_name}`, `{invoice_no}`, `{amount}`, `{dispatch_vehicle}`, `{tracking_link}`).
- [ ] **Buttons & Actions:**
  - Test `+ New Template` button -> Opens Notification Modal.
  - Test `Toggle Active Switch` on existing template rows.
  - Test `Send Test Notification` -> Triggers simulated gateway dispatch and toast notification.
  - Test WhatsApp Cloud API Credential Inputs and `Save API Config`.
- [ ] **Mutation Verification (Empirical Proof):**
  - Verify toggling `isEnabled` changes the template state and status pill, and test trigger fires notification service successfully.

---

### 7. Subtab 07: User Directory & Granular RBAC Matrix (`#subtab-users`)
- [ ] **User Governance & Access Hierarchy:**
  - User Directory Table: Verify 8 staff accounts with Username, Full Name, Email, Role, Department Code, and Status.
  - Filter Ribbon: Search by keyword, filter by Role (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `ACCOUNTANT`, `OPERATOR`, `VIEWER`), and Team.
- [ ] **Buttons & Actions:**
  - Test `Invite New User` button -> Opens Invite User Modal -> Inputs Name, Email, Role, Team.
  - User Row Actions (Kebab Menu / Buttons):
    * `Edit Profile` -> Opens Edit User Modal.
    * `Change Role` -> Opens Role Assignment Modal.
    * `Granular Permissions` -> Opens RBAC Matrix Modal across 23 ERP modules with Read/Write/Delete/Approve checkboxes.
    * `Lock / Unlock User` -> Toggles security freeze.
    * `Force Password Reset`.
- [ ] **Mutation Verification (Empirical Proof):**
  - Verify role modifications update user privilege scopes immediately without requiring server restart.

---

### 8. Subtab 08: Enterprise Feature Flags & AI Subsystems (`#subtab-features`)
- [ ] **Subsystems & Toggle Registry:**
  - Category Filter: Switch between `ALL`, `CORE`, `MANUFACTURING`, `AI & AUTOMATION`, `INTEGRATIONS`.
  - Flag Rows: Verify flags for AI Copilot, E-Way Bill Auto-Sync, Machine IoT Telemetry, WhatsApp Invoicing.
- [ ] **Buttons & Actions:**
  - Test `Toggle Switch` on feature flag cards.
  - Test `View Feature Details` button -> Opens Flag Detail Drawer/Modal with rollout percentage, dependencies, and audit history.
- [ ] **Mutation Verification (Empirical Proof):**
  - Verify toggling flag inverts `enabled` boolean state and updates active count badge in sub-nav pill (`activeFeatureCount/total`).

---

### 9. Subtab 09: Developer Hub, API Keys & Webhooks (`#subtab-developer`)
- [ ] **Developer Gateway Sub-Domains:**
  - Sub-Tabs: Test switching between `API Keys`, `Webhooks`, `API Documentation`, `Observability`.
- [ ] **Buttons & Actions:**
  - API Keys:
    * Test `+ Generate New API Key` -> Opens Modal -> Selects scopes (`read:sales`, `write:production`, etc.) -> Generates and reveals secret key.
    * Test `Revoke Key` button.
  - Webhooks:
    * Test `+ Register Webhook` -> Opens Webhook Modal -> Enters Endpoint URL, Event (`INVOICE_CREATED`, `LOW_STOCK_ALARM`), Secret Token.
    * Test `Ping Test Webhook` -> Executes mock handshake, displays HTTP 200 response and latency.
  - API Documentation:
    * Switch Code Snippet Language between `cURL`, `Node.js`, and `Python`.
- [ ] **Mutation Verification (Empirical Proof):**
  - Verify newly created API keys and Webhook endpoints append to lists with timestamp and active badges.

---

### 10. Subtab 10: JVM Telemetry, Cache & Backups (`#subtab-governance`)
- [ ] **Governance & Telemetry Strip:**
  - Live HUD Strip: Verify WebSocket broker status, Caffeine Cache TTL, Database latency, and Audit Guard.
  - JVM Metrics Panel: Inspect used heap memory (MB), max memory, thread count, and OS metadata.
- [ ] **Buttons & Actions:**
  - Test `Sync Data` (HUD Reload button) -> Refreshes all telemetry metrics.
  - Test `Clear Application Cache` -> Flushes Caffeine in-memory regions (`branding`, `rolePermissions`, `featureFlags`, etc.) -> Resets hit counter.
  - Test `Trigger Database Backup Now` -> Creates timestamped `.sql.gz` snapshot in backup list.
  - Test `Download Backup` and `Restore Backup` confirmation dialogs.
- [ ] **Mutation Verification (Empirical Proof):**
  - Verify cache status changes to `PURGED_AND_ACTIVE` and new snapshot file appears in backups registry.

---

### 11. Subtab 11: Security & Master Password Reset (`#subtab-password`)
- [ ] **Security Policy & Credential Form:**
  - Inputs: Current Password, New Password, Confirm Password, with eye icon visibility toggles.
  - Real-Time Policy Indicator:
    * Minimum 8 characters.
    * At least one letter (a-z, A-Z).
    * At least one digit or special character.
    * New and Confirm passwords match.
  - Password Strength Component: Verify dynamic color bar (Red -> Orange -> Green) based on entropy.
- [ ] **Buttons & Actions:**
  - Test `Update Master Credentials` button -> Opens Master Password Confirmation Modal.
- [ ] **Mutation Verification (Empirical Proof):**
  - Verify that entering valid matching credentials switches `isPasswordPolicyMet` to `true` and lights up all policy pills green.

---

## 📸 Automated Execution Script Reference

To execute this entire audit suite headlessly with automated screenshot capture and mutation validation:

```bash
# From workspace root:
node frontend/scripts/test_all_settings_subtabs_deep.mjs
```

### Artifacts Produced:
- **Screenshots:** `scratch/settings_deep_audit/*.png`
- **JSON Audit Report:** `scratch/settings_deep_audit/settings_audit_report.json`
- **Summary Metrics:** Total Subtabs: 11 | Passed: 11 | Mutations Confirmed: 11
