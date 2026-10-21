export function generateVolume2() {
  const tables = [
    {
      name: "users",
      domain: "Security & Identity",
      desc: "Master authentication credentials, PBKDF2 hash, salt, multi-factor OTP state, and tenant assignment.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique auto-incrementing user identity"],
        ["username", "VARCHAR(64) UNIQUE NOT NULL", "Unique alphanumeric login username"],
        ["password_hash", "VARCHAR(256) NOT NULL", "PBKDF2 HMAC SHA-256 derived key (10,000 iterations)"],
        ["salt", "VARCHAR(64) NOT NULL", "Cryptographic 128-bit Base64-encoded salt"],
        ["name", "VARCHAR(128) NOT NULL", "Full legal name of the employee or administrator"],
        ["email", "VARCHAR(128) UNIQUE", "Corporate email address for alerts and recovery"],
        ["phone", "VARCHAR(20)", "Mobile telephone number for SMS / WhatsApp dispatch alerts"],
        ["role", "VARCHAR(32) NOT NULL", "System RBAC role: SUPER_ADMIN, ADMIN, MANAGER, ACCOUNTANT, OPERATOR, VIEWER"],
        ["tenant_id", "VARCHAR(64) DEFAULT 'futane_agro'", "Multi-tenant partition identifier for white-labeling"],
        ["active", "BOOLEAN DEFAULT TRUE", "Account active status flag"],
        ["two_factor_secret", "VARCHAR(64)", "Ephemeral seed for OTP challenge generation"],
        ["last_login_at", "TIMESTAMP", "Timestamp of most recent authenticated session"],
        ["created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP", "Record creation timestamp"]
      ],
      ddl: `CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(64) UNIQUE NOT NULL,
  password_hash VARCHAR(256) NOT NULL,
  salt VARCHAR(64) NOT NULL,
  name VARCHAR(128) NOT NULL,
  email VARCHAR(128) UNIQUE,
  phone VARCHAR(20),
  role VARCHAR(32) NOT NULL DEFAULT 'VIEWER',
  tenant_id VARCHAR(64) NOT NULL DEFAULT 'futane_agro',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  two_factor_secret VARCHAR(64),
  last_login_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_tenant_role ON users(tenant_id, role);`
    },
    {
      name: "audit_logs",
      domain: "Governance & Compliance",
      desc: "Immutable append-only security and financial audit trail recording all system state mutations.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique audit log identifier"],
        ["action", "VARCHAR(64) NOT NULL", "Action descriptor (e.g., LOGIN_SUCCESS, INVOICE_CREATED, STOCK_MUTATED)"],
        ["username", "VARCHAR(64) NOT NULL", "Executing user identity"],
        ["ip_address", "VARCHAR(45)", "IPv4 or IPv6 client network origin"],
        ["details", "TEXT", "Detailed context, before/after values, or cryptographic hash"],
        ["tenant_id", "VARCHAR(64)", "Tenant context where the event occurred"],
        ["timestamp", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP", "High-precision immutable log timestamp"]
      ],
      ddl: `CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  action VARCHAR(64) NOT NULL,
  username VARCHAR(64) NOT NULL,
  ip_address VARCHAR(45),
  details TEXT,
  tenant_id VARCHAR(64) DEFAULT 'futane_agro',
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(username, action);`
    },
    {
      name: "party",
      domain: "CRM & Customers",
      desc: "Customer and distributor directory with GSTIN numbers, billing addresses, credit limits, and outstanding ledger balances.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique customer entity identifier"],
        ["name", "VARCHAR(128) NOT NULL", "Registered business name or trade name"],
        ["contact_person", "VARCHAR(128)", "Authorized purchasing or logistics manager"],
        ["phone", "VARCHAR(20) NOT NULL", "Primary commercial contact number"],
        ["email", "VARCHAR(128)", "Billing and e-invoice delivery email"],
        ["gstin", "VARCHAR(15)", "15-digit Goods & Services Tax Identification Number"],
        ["address", "TEXT NOT NULL", "Physical factory or warehouse delivery address"],
        ["city", "VARCHAR(64) NOT NULL", "Commercial municipal district"],
        ["state", "VARCHAR(64) NOT NULL DEFAULT 'Maharashtra'", "State of operation for GST classification"],
        ["pincode", "VARCHAR(10)", "Postal index code"],
        ["credit_limit", "NUMERIC(14,2) DEFAULT 0.00", "Maximum permissible unsecured credit balance (INR)"],
        ["current_balance", "NUMERIC(14,2) DEFAULT 0.00", "Live cumulative outstanding ledger receivable (INR)"],
        ["tenant_id", "VARCHAR(64) DEFAULT 'futane_agro'", "Tenant partition key"],
        ["created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP", "Account onboarding timestamp"]
      ],
      ddl: `CREATE TABLE party (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  contact_person VARCHAR(128),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(128),
  gstin VARCHAR(15),
  address TEXT NOT NULL,
  city VARCHAR(64) NOT NULL,
  state VARCHAR(64) NOT NULL DEFAULT 'Maharashtra',
  pincode VARCHAR(10),
  credit_limit NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  current_balance NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 'futane_agro',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_party_name ON party(name);
CREATE INDEX idx_party_gstin ON party(gstin);`
    },
    {
      name: "sales",
      domain: "Sales & Orders",
      desc: "Commercial sales orders, agreed unit rates, total quantities, freight terms, and delivery schedules.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique sales order identifier"],
        ["order_no", "VARCHAR(64) UNIQUE NOT NULL", "Human-readable order sequence (e.g., SO-2026-0891)"],
        ["party_id", "BIGINT NOT NULL REFERENCES party(id)", "Purchasing customer foreign key reference"],
        ["crate_type", "VARCHAR(64) NOT NULL", "Product variant (500ml Dairy Crate, 1L Agro Crate, 2L Cold Crate)"],
        ["quantity", "INTEGER NOT NULL", "Quantity of finished crates ordered"],
        ["rate", "NUMERIC(10,2) NOT NULL", "Agreed unit selling price per crate excluding GST (INR)"],
        ["subtotal", "NUMERIC(14,2) NOT NULL", "Computed order subtotal before taxes (INR)"],
        ["gst_amount", "NUMERIC(14,2) NOT NULL", "Calculated 18% GST (INR)"],
        ["total_amount", "NUMERIC(14,2) NOT NULL", "Final order commercial value including GST (INR)"],
        ["order_date", "DATE NOT NULL", "Date order was booked"],
        ["status", "VARCHAR(32) DEFAULT 'PENDING'", "Fulfillment status: PENDING, IN_PRODUCTION, READY, DISPATCHED, COMPLETED"],
        ["delivery_due_date", "DATE", "Agreed dispatch cutoff deadline"],
        ["tenant_id", "VARCHAR(64) DEFAULT 'futane_agro'", "Tenant partition key"]
      ],
      ddl: `CREATE TABLE sales (
  id BIGSERIAL PRIMARY KEY,
  order_no VARCHAR(64) UNIQUE NOT NULL,
  party_id BIGINT NOT NULL REFERENCES party(id),
  crate_type VARCHAR(64) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  rate NUMERIC(10,2) NOT NULL CHECK (rate >= 0),
  subtotal NUMERIC(14,2) NOT NULL,
  gst_amount NUMERIC(14,2) NOT NULL,
  total_amount NUMERIC(14,2) NOT NULL,
  order_date DATE NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  delivery_due_date DATE,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 'futane_agro'
);
CREATE INDEX idx_sales_party ON sales(party_id);
CREATE INDEX idx_sales_order_date ON sales(order_date DESC);`
    },
    {
      name: "production_ppd",
      domain: "Plant Operations",
      desc: "Daily Production Per Day (PPD) records tracking machine output, cycle times, operator shifts, and scrap rates.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique daily production record identifier"],
        ["production_date", "DATE NOT NULL", "Operational manufacturing date"],
        ["shift", "VARCHAR(16) NOT NULL", "Shift identifier: SHIFT_1 (Morning), SHIFT_2 (Evening), SHIFT_3 (Night)"],
        ["machine_id", "BIGINT NOT NULL REFERENCES machines(id)", "Injection molding machine asset reference"],
        ["crate_type", "VARCHAR(64) NOT NULL", "Product variant manufactured (500ml, 1L, 2L Crate)"],
        ["raw_material_used_kg", "NUMERIC(10,2) NOT NULL", "Gross PP polymer granules consumed in kilograms"],
        ["target_crates", "INTEGER NOT NULL", "Planned standard shift output target"],
        ["successful_crates", "INTEGER NOT NULL", "Quality approved crates passed to finished goods warehouse"],
        ["rejected_crates", "INTEGER DEFAULT 0", "Defective crates rejected for regrinding/scrap"],
        ["scrap_weight_kg", "NUMERIC(10,2) DEFAULT 0.00", "Total weight of sprues, runners, and rejected flash (kg)"],
        ["efficiency_pct", "NUMERIC(5,2)", "Computed machine efficiency percentage"],
        ["operator_name", "VARCHAR(128)", "Lead molding technician or operator on duty"],
        ["remarks", "TEXT", "Operational shift handover and quality notes"],
        ["tenant_id", "VARCHAR(64) DEFAULT 'futane_agro'", "Tenant partition key"]
      ],
      ddl: `CREATE TABLE production_ppd (
  id BIGSERIAL PRIMARY KEY,
  production_date DATE NOT NULL,
  shift VARCHAR(16) NOT NULL,
  machine_id BIGINT NOT NULL,
  crate_type VARCHAR(64) NOT NULL,
  raw_material_used_kg NUMERIC(10,2) NOT NULL CHECK (raw_material_used_kg >= 0),
  target_crates INTEGER NOT NULL CHECK (target_crates > 0),
  successful_crates INTEGER NOT NULL CHECK (successful_crates >= 0),
  rejected_crates INTEGER NOT NULL DEFAULT 0,
  scrap_weight_kg NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  efficiency_pct NUMERIC(5,2),
  operator_name VARCHAR(128),
  remarks TEXT,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 'futane_agro'
);
CREATE INDEX idx_ppd_date_shift ON production_ppd(production_date, shift);
CREATE INDEX idx_ppd_crate_type ON production_ppd(crate_type);`
    },
    {
      name: "production_ppm",
      domain: "Plant Planning",
      desc: "Monthly Production Target Planning (PPM) establishing executive quotas, capacity utilization, and raw material budgets.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique monthly target record identifier"],
        ["year", "INTEGER NOT NULL", "Calendar year (e.g., 2026)"],
        ["month", "INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12)", "Calendar month index (1 = January, 12 = December)"],
        ["crate_type", "VARCHAR(64) NOT NULL", "Product variant target line"],
        ["monthly_target_crates", "INTEGER NOT NULL", "Executive target volume in crates"],
        ["achieved_crates", "INTEGER DEFAULT 0", "Cumulative crates produced across all daily PPD records"],
        ["allocated_granules_kg", "NUMERIC(12,2) NOT NULL", "Total planned PP polymer allocation in kilograms"],
        ["target_efficiency_pct", "NUMERIC(5,2) DEFAULT 92.50", "Target overall equipment effectiveness (OEE) percentage"],
        ["status", "VARCHAR(32) DEFAULT 'ACTIVE'", "Target status: DRAFT, ACTIVE, ACHIEVED, CLOSED"],
        ["tenant_id", "VARCHAR(64) DEFAULT 'futane_agro'", "Tenant partition key"]
      ],
      ddl: `CREATE TABLE production_ppm (
  id BIGSERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  crate_type VARCHAR(64) NOT NULL,
  monthly_target_crates INTEGER NOT NULL CHECK (monthly_target_crates > 0),
  achieved_crates INTEGER NOT NULL DEFAULT 0,
  allocated_granules_kg NUMERIC(12,2) NOT NULL,
  target_efficiency_pct NUMERIC(5,2) DEFAULT 92.50,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  tenant_id VARCHAR(64) NOT NULL DEFAULT 'futane_agro',
  CONSTRAINT uq_ppm_period_crate UNIQUE (year, month, crate_type, tenant_id)
);
CREATE INDEX idx_ppm_period ON production_ppm(year, month);`
    },
    {
      name: "inventory",
      domain: "Finished Goods Warehouse",
      desc: "Finished goods crate inventory tracking stock counts, pallet bay locations, minimum reorder thresholds, and valuations.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique inventory SKU identifier"],
        ["item_name", "VARCHAR(128) NOT NULL", "Product name (e.g., 500ml Dairy Milk Crate - Royal Blue)"],
        ["crate_type", "VARCHAR(64) NOT NULL", "Core classification variant (500ml, 1L, 2L)"],
        ["color", "VARCHAR(32) DEFAULT 'Blue'", "Color formulation (Blue, Red, Green, Yellow, Orange)"],
        ["current_stock", "INTEGER NOT NULL DEFAULT 0", "Physical inventory count available in factory warehouse"],
        ["minimum_threshold", "INTEGER DEFAULT 100", "Safety buffer threshold triggering automated reorder alerts"],
        ["unit_cost", "NUMERIC(10,2) NOT NULL", "Standard manufacturing cost per unit (INR)"],
        ["warehouse_location", "VARCHAR(64)", "Pallet rack and bay designation (e.g., BAY-A-04)"],
        ["last_stock_take_date", "DATE", "Most recent physical inventory audit verification date"],
        ["tenant_id", "VARCHAR(64) DEFAULT 'futane_agro'", "Tenant partition key"]
      ],
      ddl: `CREATE TABLE inventory (
  id BIGSERIAL PRIMARY KEY,
  item_name VARCHAR(128) NOT NULL,
  crate_type VARCHAR(64) NOT NULL,
  color VARCHAR(32) DEFAULT 'Blue',
  current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  minimum_threshold INTEGER NOT NULL DEFAULT 100,
  unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  warehouse_location VARCHAR(64),
  last_stock_take_date DATE,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 'futane_agro'
);
CREATE INDEX idx_inventory_crate ON inventory(crate_type);`
    },
    {
      name: "raw_materials",
      domain: "Raw Material Warehouse",
      desc: "Granule inventory tracking virgin polypropylene, recycled regrind, masterbatch pigments, supplier lots, and safety stocks.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique raw material batch identifier"],
        ["material_name", "VARCHAR(128) NOT NULL", "Material specification (e.g., Reliance Repol H030SG Polypropylene Granules)"],
        ["material_type", "VARCHAR(32) NOT NULL", "Type: VIRGIN_PP, RECYCLED_PP, MASTERBATCH, ADDITIVE"],
        ["current_stock_kg", "NUMERIC(12,2) NOT NULL DEFAULT 0.00", "Physical warehouse stock balance in kilograms"],
        ["reorder_level_kg", "NUMERIC(12,2) DEFAULT 1000.00", "Threshold triggering purchase requisition (kg)"],
        ["cost_per_kg", "NUMERIC(10,2) NOT NULL", "Current landed purchase price per kilogram (INR)"],
        ["vendor_id", "BIGINT REFERENCES vendors(id)", "Primary supplier foreign key"],
        ["batch_lot_no", "VARCHAR(64)", "Manufacturer refinery batch certificate number"],
        ["tenant_id", "VARCHAR(64) DEFAULT 'futane_agro'", "Tenant partition key"]
      ],
      ddl: `CREATE TABLE raw_materials (
  id BIGSERIAL PRIMARY KEY,
  material_name VARCHAR(128) NOT NULL,
  material_type VARCHAR(32) NOT NULL,
  current_stock_kg NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (current_stock_kg >= 0),
  reorder_level_kg NUMERIC(12,2) NOT NULL DEFAULT 1000.00,
  cost_per_kg NUMERIC(10,2) NOT NULL,
  vendor_id BIGINT,
  batch_lot_no VARCHAR(64),
  tenant_id VARCHAR(64) NOT NULL DEFAULT 'futane_agro'
);
CREATE INDEX idx_raw_materials_type ON raw_materials(material_type);`
    },
    {
      name: "vendors",
      domain: "Procurement & Vendors",
      desc: "Polymer resin and additive manufacturers, GSTIN credentials, payment terms, and vendor payable ledger balances.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique supplier entity identifier"],
        ["vendor_name", "VARCHAR(128) NOT NULL", "Supplier corporate business name (e.g., Reliance Industries, IOCL)"],
        ["contact_person", "VARCHAR(128)", "Key account sales executive"],
        ["phone", "VARCHAR(20) NOT NULL", "Direct commercial telephone line"],
        ["email", "VARCHAR(128)", "Procurement order delivery email"],
        ["gstin", "VARCHAR(15)", "Supplier 15-digit GST identification number"],
        ["city", "VARCHAR(64) NOT NULL", "Supplier headquarters city"],
        ["payment_terms_days", "INTEGER DEFAULT 30", "Agreed trade credit window (days)"],
        ["outstanding_payable", "NUMERIC(14,2) DEFAULT 0.00", "Current accounts payable ledger balance (INR)"],
        ["tenant_id", "VARCHAR(64) DEFAULT 'futane_agro'", "Tenant partition key"]
      ],
      ddl: `CREATE TABLE vendors (
  id BIGSERIAL PRIMARY KEY,
  vendor_name VARCHAR(128) NOT NULL,
  contact_person VARCHAR(128),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(128),
  gstin VARCHAR(15),
  city VARCHAR(64) NOT NULL,
  payment_terms_days INTEGER DEFAULT 30,
  outstanding_payable NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 'futane_agro'
);
CREATE INDEX idx_vendors_name ON vendors(vendor_name);`
    },
    {
      name: "payments",
      domain: "Treasury & Receivables",
      desc: "Customer payment receipt vouchers, bank transaction references, NEFT/RTGS/Cheque reconciliation, and ledger postings.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique receipt voucher identifier"],
        ["receipt_no", "VARCHAR(64) UNIQUE NOT NULL", "Sequential payment receipt voucher (e.g., REC-2026-0412)"],
        ["party_id", "BIGINT NOT NULL REFERENCES party(id)", "Payer customer entity reference"],
        ["payment_date", "DATE NOT NULL", "Transaction date funds were received"],
        ["amount", "NUMERIC(14,2) NOT NULL", "Net received payment value (INR)"],
        ["payment_mode", "VARCHAR(32) NOT NULL", "Payment mechanism: NEFT, RTGS, IMPS, CHEQUE, UPI, CASH"],
        ["reference_no", "VARCHAR(64)", "Bank UTR number, cheque number, or gateway transaction ID"],
        ["bank_account_id", "BIGINT REFERENCES bank_accounts(id)", "Receiving company bank ledger reference"],
        ["notes", "TEXT", "Accounting allocation notes and invoice offset instructions"],
        ["tenant_id", "VARCHAR(64) DEFAULT 'futane_agro'", "Tenant partition key"]
      ],
      ddl: `CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  receipt_no VARCHAR(64) UNIQUE NOT NULL,
  party_id BIGINT NOT NULL REFERENCES party(id),
  payment_date DATE NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  payment_mode VARCHAR(32) NOT NULL,
  reference_no VARCHAR(64),
  bank_account_id BIGINT,
  notes TEXT,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 'futane_agro'
);
CREATE INDEX idx_payments_party ON payments(party_id);
CREATE INDEX idx_payments_date ON payments(payment_date DESC);`
    },
    {
      name: "expenses",
      domain: "Cost Accounting",
      desc: "Factory operational expense vouchers, electricity bills, hydraulic oil, consumables, logistics, and cost center allocations.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique expense voucher identifier"],
        ["voucher_no", "VARCHAR(64) UNIQUE NOT NULL", "Sequential expense voucher (e.g., EXP-2026-1044)"],
        ["category", "VARCHAR(64) NOT NULL", "Cost center: ELECTRICITY, HYDRAULIC_OIL, SPARES, PACKAGING, TRANSPORT, TEA_SNACKS, GENERAL"],
        ["expense_date", "DATE NOT NULL", "Voucher expenditure date"],
        ["amount", "NUMERIC(12,2) NOT NULL", "Total expense amount including taxes (INR)"],
        ["paid_to", "VARCHAR(128) NOT NULL", "Payee vendor, utility provider, or staff employee"],
        ["payment_mode", "VARCHAR(32) NOT NULL", "Payment mechanism: BANK_TRANSFER, CHEQUE, PETTY_CASH, UPI"],
        ["approved_by", "VARCHAR(64) NOT NULL", "Approving managerial or executive authority"],
        ["invoice_ref", "VARCHAR(64)", "Vendor tax invoice or utility bill consumer reference number"],
        ["tenant_id", "VARCHAR(64) DEFAULT 'futane_agro'", "Tenant partition key"]
      ],
      ddl: `CREATE TABLE expenses (
  id BIGSERIAL PRIMARY KEY,
  voucher_no VARCHAR(64) UNIQUE NOT NULL,
  category VARCHAR(64) NOT NULL,
  expense_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  paid_to VARCHAR(128) NOT NULL,
  payment_mode VARCHAR(32) NOT NULL,
  approved_by VARCHAR(64) NOT NULL,
  invoice_ref VARCHAR(64),
  tenant_id VARCHAR(64) NOT NULL DEFAULT 'futane_agro'
);
CREATE INDEX idx_expenses_category_date ON expenses(category, expense_date DESC);`
    },
    {
      name: "bank_accounts",
      domain: "Treasury Management",
      desc: "Company current accounts, cash registers, account numbers, IFSC codes, bank branches, and cleared ledger balances.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique treasury account identifier"],
        ["account_name", "VARCHAR(128) NOT NULL", "Internal ledger name (e.g., HDFC Main Current Account)"],
        ["bank_name", "VARCHAR(128) NOT NULL", "Commercial banking institution (e.g., HDFC Bank Ltd)"],
        ["account_number", "VARCHAR(34) UNIQUE NOT NULL", "Bank account number"],
        ["ifsc_code", "VARCHAR(11) NOT NULL", "Indian Financial System Code"],
        ["branch", "VARCHAR(128) NOT NULL", "Bank branch location"],
        ["current_balance", "NUMERIC(14,2) NOT NULL DEFAULT 0.00", "Current cleared cash balance (INR)"],
        ["account_type", "VARCHAR(32) DEFAULT 'CURRENT'", "Type: CURRENT, CASH_REGISTER, OVERDRAFT"],
        ["tenant_id", "VARCHAR(64) DEFAULT 'futane_agro'", "Tenant partition key"]
      ],
      ddl: `CREATE TABLE bank_accounts (
  id BIGSERIAL PRIMARY KEY,
  account_name VARCHAR(128) NOT NULL,
  bank_name VARCHAR(128) NOT NULL,
  account_number VARCHAR(34) UNIQUE NOT NULL,
  ifsc_code VARCHAR(11) NOT NULL,
  branch VARCHAR(128) NOT NULL,
  current_balance NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  account_type VARCHAR(32) NOT NULL DEFAULT 'CURRENT',
  tenant_id VARCHAR(64) NOT NULL DEFAULT 'futane_agro'
);`
    },
    {
      name: "bank_transactions",
      domain: "Treasury Management",
      desc: "Granular double-entry debits and credits recorded against company bank accounts and cash books.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique bank transaction entry identifier"],
        ["account_id", "BIGINT NOT NULL REFERENCES bank_accounts(id)", "Bank account ledger reference"],
        ["transaction_date", "DATE NOT NULL", "Value clearance date"],
        ["type", "VARCHAR(16) NOT NULL", "DEBIT (Withdrawal/Payment) or CREDIT (Deposit/Receipt)"],
        ["amount", "NUMERIC(14,2) NOT NULL", "Transaction value (INR)"],
        ["running_balance", "NUMERIC(14,2) NOT NULL", "Resulting ledger balance after posting"],
        ["reference_no", "VARCHAR(64)", "Bank UTR, cheque, or electronic settlement reference"],
        ["description", "TEXT NOT NULL", "Accounting narration and contra entity reference"],
        ["tenant_id", "VARCHAR(64) DEFAULT 'futane_agro'", "Tenant partition key"]
      ],
      ddl: `CREATE TABLE bank_transactions (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES bank_accounts(id),
  transaction_date DATE NOT NULL,
  type VARCHAR(16) NOT NULL CHECK (type IN ('DEBIT', 'CREDIT')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  running_balance NUMERIC(14,2) NOT NULL,
  reference_no VARCHAR(64),
  description TEXT NOT NULL,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 'futane_agro'
);
CREATE INDEX idx_bank_tx_account_date ON bank_transactions(account_id, transaction_date DESC);`
    },
    {
      name: "employees",
      domain: "Human Resources",
      desc: "Workforce master records, plant department, designation, biometric ID, daily wage/salary rate, and KYC credentials.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique employee entity identifier"],
        ["employee_code", "VARCHAR(32) UNIQUE NOT NULL", "Personnel ID (e.g., EMP-0104)"],
        ["name", "VARCHAR(128) NOT NULL", "Full legal name"],
        ["department", "VARCHAR(64) NOT NULL", "Department: PRODUCTION, MAINTENANCE, WAREHOUSE, LOGISTICS, ACCOUNTS, SECURITY"],
        ["designation", "VARCHAR(64) NOT NULL", "Role (e.g., Senior Injection Molding Operator)"],
        ["phone", "VARCHAR(20) NOT NULL", "Contact phone number"],
        ["aadhaar_no", "VARCHAR(12)", "12-digit Indian Aadhaar number"],
        ["joining_date", "DATE NOT NULL", "Employment commencement date"],
        ["base_salary", "NUMERIC(10,2) NOT NULL", "Monthly gross base salary or daily rate (INR)"],
        ["salary_type", "VARCHAR(16) DEFAULT 'MONTHLY'", "Wage structure: MONTHLY, DAILY_WAGE"],
        ["bank_account_no", "VARCHAR(34)", "Salary disbursement bank account number"],
        ["active", "BOOLEAN DEFAULT TRUE", "Active employment status flag"],
        ["tenant_id", "VARCHAR(64) DEFAULT 'futane_agro'", "Tenant partition key"]
      ],
      ddl: `CREATE TABLE employees (
  id BIGSERIAL PRIMARY KEY,
  employee_code VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(128) NOT NULL,
  department VARCHAR(64) NOT NULL,
  designation VARCHAR(64) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  aadhaar_no VARCHAR(12),
  joining_date DATE NOT NULL,
  base_salary NUMERIC(10,2) NOT NULL,
  salary_type VARCHAR(16) NOT NULL DEFAULT 'MONTHLY',
  bank_account_no VARCHAR(34),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 'futane_agro'
);
CREATE INDEX idx_employees_dept ON employees(department);`
    },
    {
      name: "salaries",
      domain: "Workforce & Payroll",
      desc: "Monthly payroll disbursement registers, days worked, overtime hours, advance deductions, and net payable calculations.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique payroll record identifier"],
        ["employee_id", "BIGINT NOT NULL REFERENCES employees(id)", "Employee foreign key reference"],
        ["payroll_month", "INTEGER NOT NULL CHECK (payroll_month BETWEEN 1 AND 12)", "Month of disbursement (1-12)"],
        ["payroll_year", "INTEGER NOT NULL", "Calendar year (e.g., 2026)"],
        ["days_worked", "NUMERIC(4,1) NOT NULL", "Total verified days worked in payroll cycle"],
        ["overtime_hours", "NUMERIC(5,1) DEFAULT 0.0", "Approved overtime hours logged"],
        ["gross_salary", "NUMERIC(10,2) NOT NULL", "Calculated gross earnings (INR)"],
        ["advance_deducted", "NUMERIC(10,2) DEFAULT 0.00", "Salary advances recovered (INR)"],
        ["other_deductions", "NUMERIC(10,2) DEFAULT 0.00", "PF/ESI or statutory deductions (INR)"],
        ["net_payable", "NUMERIC(10,2) NOT NULL", "Final net payment disbursed to employee (INR)"],
        ["disbursement_date", "DATE", "Date payment was released"],
        ["payment_status", "VARCHAR(32) DEFAULT 'PENDING'", "Status: PENDING, APPROVED, PAID"],
        ["tenant_id", "VARCHAR(64) DEFAULT 'futane_agro'", "Tenant partition key"]
      ],
      ddl: `CREATE TABLE salaries (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id),
  payroll_month INTEGER NOT NULL CHECK (payroll_month BETWEEN 1 AND 12),
  payroll_year INTEGER NOT NULL,
  days_worked NUMERIC(4,1) NOT NULL,
  overtime_hours NUMERIC(5,1) NOT NULL DEFAULT 0.0,
  gross_salary NUMERIC(10,2) NOT NULL,
  advance_deducted NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  other_deductions NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  net_payable NUMERIC(10,2) NOT NULL,
  disbursement_date DATE,
  payment_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  tenant_id VARCHAR(64) NOT NULL DEFAULT 'futane_agro',
  CONSTRAINT uq_salary_period UNIQUE (employee_id, payroll_month, payroll_year, tenant_id)
);
CREATE INDEX idx_salaries_period ON salaries(payroll_year, payroll_month);`
    },
    {
      name: "machines",
      domain: "Plant Asset Engineering",
      desc: "Injection molding machine registry, clamping tonnage, screw diameter, hydraulic specs, and operational status.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique injection molding machine identifier"],
        ["machine_code", "VARCHAR(32) UNIQUE NOT NULL", "Asset tag (e.g., M-01, M-02, M-03)"],
        ["machine_name", "VARCHAR(128) NOT NULL", "Machine model name (e.g., Windsor Wintech 350-Ton)"],
        ["clamping_force_tons", "INTEGER NOT NULL", "Rated hydraulic clamping tonnage (e.g., 350, 450, 650 Tons)"],
        ["shot_capacity_grams", "NUMERIC(8,2) NOT NULL", "Maximum injection shot volume (grams)"],
        ["manufacturer", "VARCHAR(128) NOT NULL", "Equipment manufacturer (Windsor, L&T, Toshiba, Haitian)"],
        ["installed_date", "DATE NOT NULL", "Factory floor commissioning date"],
        ["status", "VARCHAR(32) DEFAULT 'RUNNING'", "Current status: RUNNING, IDLE, MAINTENANCE, BREAKDOWN"],
        ["last_service_date", "DATE", "Most recent preventative maintenance overhaul date"],
        ["tenant_id", "VARCHAR(64) DEFAULT 'futane_agro'", "Tenant partition key"]
      ],
      ddl: `CREATE TABLE machines (
  id BIGSERIAL PRIMARY KEY,
  machine_code VARCHAR(32) UNIQUE NOT NULL,
  machine_name VARCHAR(128) NOT NULL,
  clamping_force_tons INTEGER NOT NULL,
  shot_capacity_grams NUMERIC(8,2) NOT NULL,
  manufacturer VARCHAR(128) NOT NULL,
  installed_date DATE NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'RUNNING',
  last_service_date DATE,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 'futane_agro'
);
CREATE INDEX idx_machines_status ON machines(status);`
    },
    {
      name: "machine_breakdowns",
      domain: "Plant Asset Engineering",
      desc: "Log of machine breakdowns, downtime duration, hydraulic/electrical root causes, replacement parts, and maintenance costs.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique breakdown event identifier"],
        ["machine_id", "BIGINT NOT NULL REFERENCES machines(id)", "Machine asset foreign key reference"],
        ["breakdown_date", "DATE NOT NULL", "Date downtime commenced"],
        ["breakdown_time", "TIME", "Exact time of stoppage"],
        ["restored_time", "TIME", "Exact time operations resumed"],
        ["downtime_hours", "NUMERIC(5,2) NOT NULL", "Total production hours lost"],
        ["root_cause", "VARCHAR(128) NOT NULL", "Fault classification: HYDRAULIC_LEAK, HEATER_BAND_FAILURE, EJECTOR_PIN_JAM, ELECTRICAL_PLC"],
        ["action_taken", "TEXT NOT NULL", "Engineering rectification procedure performed"],
        ["technician_name", "VARCHAR(128) NOT NULL", "Lead maintenance technician"],
        ["spares_cost", "NUMERIC(10,2) DEFAULT 0.00", "Cost of replaced seals, valves, or components (INR)"],
        ["tenant_id", "VARCHAR(64) DEFAULT 'futane_agro'", "Tenant partition key"]
      ],
      ddl: `CREATE TABLE machine_breakdowns (
  id BIGSERIAL PRIMARY KEY,
  machine_id BIGINT NOT NULL REFERENCES machines(id),
  breakdown_date DATE NOT NULL,
  breakdown_time TIME,
  restored_time TIME,
  downtime_hours NUMERIC(5,2) NOT NULL,
  root_cause VARCHAR(128) NOT NULL,
  action_taken TEXT NOT NULL,
  technician_name VARCHAR(128) NOT NULL,
  spares_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 'futane_agro'
);
CREATE INDEX idx_breakdowns_machine_date ON machine_breakdowns(machine_id, breakdown_date DESC);`
    },
    {
      name: "transports",
      domain: "Supply Chain & Logistics",
      desc: "Commercial transport carrier agencies, freight rates per kilometer/trip, vehicle capacity specs, and carrier GSTINs.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique logistics carrier identifier"],
        ["transport_name", "VARCHAR(128) NOT NULL", "Logistics firm business name (e.g., Mahadev Freight Carriers)"],
        ["contact_person", "VARCHAR(128)", "Fleet dispatch manager"],
        ["phone", "VARCHAR(20) NOT NULL", "Emergency logistics contact telephone"],
        ["gstin", "VARCHAR(15)", "Transporter GSTIN or Transporter ID (TRANSIN) for E-Way Bills"],
        ["address", "TEXT", "Transporter garage or office address"],
        ["tenant_id", "VARCHAR(64) DEFAULT 'futane_agro'", "Tenant partition key"]
      ],
      ddl: `CREATE TABLE transports (
  id BIGSERIAL PRIMARY KEY,
  transport_name VARCHAR(128) NOT NULL,
  contact_person VARCHAR(128),
  phone VARCHAR(20) NOT NULL,
  gstin VARCHAR(15),
  address TEXT,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 'futane_agro'
);`
    },
    {
      name: "drivers",
      domain: "Supply Chain & Logistics",
      desc: "Commercial truck drivers, heavy motor vehicle (HMV) driving license numbers, mobile numbers, and transport firm affiliations.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique driver identity identifier"],
        ["driver_name", "VARCHAR(128) NOT NULL", "Driver legal name"],
        ["license_no", "VARCHAR(32) UNIQUE NOT NULL", "Commercial HMV driving license number"],
        ["phone", "VARCHAR(20) NOT NULL", "Driver active mobile number"],
        ["transport_id", "BIGINT REFERENCES transports(id)", "Associated carrier agency reference"],
        ["vehicle_no", "VARCHAR(20)", "Default assigned truck registration number (e.g., MH-12-AB-1234)"],
        ["tenant_id", "VARCHAR(64) DEFAULT 'futane_agro'", "Tenant partition key"]
      ],
      ddl: `CREATE TABLE drivers (
  id BIGSERIAL PRIMARY KEY,
  driver_name VARCHAR(128) NOT NULL,
  license_no VARCHAR(32) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  transport_id BIGINT REFERENCES transports(id),
  vehicle_no VARCHAR(20),
  tenant_id VARCHAR(64) NOT NULL DEFAULT 'futane_agro'
);
CREATE INDEX idx_drivers_license ON drivers(license_no);`
    },
    {
      name: "dispatches",
      domain: "Logistics & Gate Pass",
      desc: "Factory gate logistics passes, vehicle weighment records, driver sign-offs, sales order references, and crate counts.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique gate pass dispatch identifier"],
        ["dispatch_no", "VARCHAR(64) UNIQUE NOT NULL", "Official gate pass serial (e.g., GP-2026-0811)"],
        ["sales_id", "BIGINT NOT NULL REFERENCES sales(id)", "Originating sales order reference"],
        ["party_id", "BIGINT NOT NULL REFERENCES party(id)", "Consignee customer reference"],
        ["crate_type", "VARCHAR(64) NOT NULL", "Product variant dispatched"],
        ["quantity_dispatched", "INTEGER NOT NULL", "Physical count of crates loaded into vehicle"],
        ["dispatch_date", "DATE NOT NULL", "Factory gate exit date"],
        ["vehicle_no", "VARCHAR(20) NOT NULL", "Commercial truck registration number"],
        ["driver_id", "BIGINT REFERENCES drivers(id)", "Driver identity reference"],
        ["transport_id", "BIGINT REFERENCES transports(id)", "Freight carrier reference"],
        ["gross_weight_kg", "NUMERIC(10,2)", "Weighbridge loaded truck weight (kg)"],
        ["tare_weight_kg", "NUMERIC(10,2)", "Weighbridge empty truck tare weight (kg)"],
        ["net_weight_kg", "NUMERIC(10,2)", "Net cargo weight (kg)"],
        ["status", "VARCHAR(32) DEFAULT 'DISPATCHED'", "Status: LOADED, WEIGHED, DISPATCHED, DELIVERED"],
        ["tenant_id", "VARCHAR(64) DEFAULT 'futane_agro'", "Tenant partition key"]
      ],
      ddl: `CREATE TABLE dispatches (
  id BIGSERIAL PRIMARY KEY,
  dispatch_no VARCHAR(64) UNIQUE NOT NULL,
  sales_id BIGINT NOT NULL REFERENCES sales(id),
  party_id BIGINT NOT NULL REFERENCES party(id),
  crate_type VARCHAR(64) NOT NULL,
  quantity_dispatched INTEGER NOT NULL CHECK (quantity_dispatched > 0),
  dispatch_date DATE NOT NULL,
  vehicle_no VARCHAR(20) NOT NULL,
  driver_id BIGINT REFERENCES drivers(id),
  transport_id BIGINT REFERENCES transports(id),
  gross_weight_kg NUMERIC(10,2),
  tare_weight_kg NUMERIC(10,2),
  net_weight_kg NUMERIC(10,2),
  status VARCHAR(32) NOT NULL DEFAULT 'DISPATCHED',
  tenant_id VARCHAR(64) NOT NULL DEFAULT 'futane_agro'
);
CREATE INDEX idx_dispatches_date ON dispatches(dispatch_date DESC);
CREATE INDEX idx_dispatches_party ON dispatches(party_id);`
    },
    {
      name: "invoices",
      domain: "GST Financial Accounting",
      desc: "Tax invoices under HSN 3923, CGST/SGST/IGST breakdown, IRN cryptographic hash, E-Way Bill numbers, and ledger totals.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique tax invoice identifier"],
        ["invoice_no", "VARCHAR(64) UNIQUE NOT NULL", "Sequential tax invoice serial (e.g., INV-2026-0512)"],
        ["party_id", "BIGINT NOT NULL REFERENCES party(id)", "Billed customer party reference"],
        ["invoice_date", "DATE NOT NULL", "Tax invoice generation date"],
        ["subtotal", "NUMERIC(14,2) NOT NULL", "Total taxable value before GST (INR)"],
        ["cgst_rate", "NUMERIC(5,2) DEFAULT 9.00", "Central GST rate percentage (9.00%)"],
        ["cgst_amount", "NUMERIC(14,2) DEFAULT 0.00", "Central GST monetary value (INR)"],
        ["sgst_rate", "NUMERIC(5,2) DEFAULT 9.00", "State GST rate percentage (9.00%)"],
        ["sgst_amount", "NUMERIC(14,2) DEFAULT 0.00", "State GST monetary value (INR)"],
        ["igst_rate", "NUMERIC(5,2) DEFAULT 0.00", "Integrated GST rate percentage (18.00% if inter-state)"],
        ["igst_amount", "NUMERIC(14,2) DEFAULT 0.00", "Integrated GST monetary value (INR)"],
        ["round_off", "NUMERIC(6,2) DEFAULT 0.00", "Fractional round-off adjustment to nearest integer (INR)"],
        ["grand_total", "NUMERIC(14,2) NOT NULL", "Final invoice value payable (INR)"],
        ["payment_status", "VARCHAR(32) DEFAULT 'UNPAID'", "Status: UNPAID, PARTIAL, PAID"],
        ["irn_hash", "VARCHAR(64)", "64-character GST Invoice Registration Number (IRN) hash"],
        ["e_way_bill_no", "VARCHAR(32)", "12-digit Government E-Way Bill number"],
        ["tenant_id", "VARCHAR(64) DEFAULT 'futane_agro'", "Tenant partition key"]
      ],
      ddl: `CREATE TABLE invoices (
  id BIGSERIAL PRIMARY KEY,
  invoice_no VARCHAR(64) UNIQUE NOT NULL,
  party_id BIGINT NOT NULL REFERENCES party(id),
  invoice_date DATE NOT NULL,
  subtotal NUMERIC(14,2) NOT NULL,
  cgst_rate NUMERIC(5,2) NOT NULL DEFAULT 9.00,
  cgst_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  sgst_rate NUMERIC(5,2) NOT NULL DEFAULT 9.00,
  sgst_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  igst_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  igst_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  round_off NUMERIC(6,2) NOT NULL DEFAULT 0.00,
  grand_total NUMERIC(14,2) NOT NULL,
  payment_status VARCHAR(32) NOT NULL DEFAULT 'UNPAID',
  irn_hash VARCHAR(64),
  e_way_bill_no VARCHAR(32),
  tenant_id VARCHAR(64) NOT NULL DEFAULT 'futane_agro'
);
CREATE INDEX idx_invoices_date ON invoices(invoice_date DESC);
CREATE INDEX idx_invoices_party ON invoices(party_id);`
    },
    {
      name: "invoice_items",
      domain: "GST Financial Accounting",
      desc: "Line items of invoices detailing HSN code, quantity, rate per crate, taxable amount, and GST percentages.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique line item identifier"],
        ["invoice_id", "BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE", "Parent invoice reference"],
        ["description", "VARCHAR(256) NOT NULL", "Item description (e.g., Heavy-Duty 500ml Dairy Milk Crate)"],
        ["hsn_code", "VARCHAR(16) NOT NULL DEFAULT '3923'", "Harmonized System Nomenclature code"],
        ["quantity", "INTEGER NOT NULL", "Crate quantity billed"],
        ["unit_rate", "NUMERIC(10,2) NOT NULL", "Selling price per crate before tax (INR)"],
        ["taxable_amount", "NUMERIC(14,2) NOT NULL", "Line subtotal = quantity * unit_rate (INR)"],
        ["gst_rate", "NUMERIC(5,2) DEFAULT 18.00", "Total GST rate (18.00%)"],
        ["gst_amount", "NUMERIC(14,2) NOT NULL", "Line item tax amount (INR)"],
        ["total_amount", "NUMERIC(14,2) NOT NULL", "Line gross total = taxable_amount + gst_amount"]
      ],
      ddl: `CREATE TABLE invoice_items (
  id BIGSERIAL PRIMARY KEY,
  invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description VARCHAR(256) NOT NULL,
  hsn_code VARCHAR(16) NOT NULL DEFAULT '3923',
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_rate NUMERIC(10,2) NOT NULL CHECK (unit_rate >= 0),
  taxable_amount NUMERIC(14,2) NOT NULL,
  gst_rate NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  gst_amount NUMERIC(14,2) NOT NULL,
  total_amount NUMERIC(14,2) NOT NULL
);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);`
    },
    {
      name: "settings",
      domain: "System Administration",
      desc: "Global system configuration keys, factory metadata, GST credentials, thermal print sizes, and invoice prefixes.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique setting identifier"],
        ["key", "VARCHAR(64) UNIQUE NOT NULL", "Configuration parameter key (e.g., company_name, gstin, default_gst_rate)"],
        ["value", "TEXT NOT NULL", "Serialized string or JSON configuration value"],
        ["category", "VARCHAR(32) DEFAULT 'GENERAL'", "Category: COMPANY, GST, PRINTER, NOTIFICATION, SECURITY"],
        ["tenant_id", "VARCHAR(64) DEFAULT 'futane_agro'", "Tenant partition key"]
      ],
      ddl: `CREATE TABLE settings (
  id BIGSERIAL PRIMARY KEY,
  key VARCHAR(64) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  category VARCHAR(32) NOT NULL DEFAULT 'GENERAL',
  tenant_id VARCHAR(64) NOT NULL DEFAULT 'futane_agro'
);
CREATE INDEX idx_settings_key ON settings(key);`
    },
    {
      name: "tenant_config",
      domain: "Multi-Tenant White-Labeling",
      desc: "Custom tenant branding, company logo base64, custom primary color theme, legal business name, and GSTIN.",
      cols: [
        ["tenant_id", "VARCHAR(64) PRIMARY KEY", "Unique tenant code (e.g., futane_agro, tenant_demo)"],
        ["company_name", "VARCHAR(128) NOT NULL", "White-labeled company display title"],
        ["gstin", "VARCHAR(15) NOT NULL", "Tenant official GST registration number"],
        ["primary_color", "VARCHAR(16) DEFAULT '#2563eb'", "Hex theme accent color"],
        ["logo_url", "TEXT", "Base64 SVG or HTTPS logo resource path"],
        ["state_jurisdiction", "VARCHAR(64) DEFAULT 'Maharashtra'", "State jurisdiction for CGST/SGST tax splitting"],
        ["active", "BOOLEAN DEFAULT TRUE", "Tenant subscription status"]
      ],
      ddl: `CREATE TABLE tenant_config (
  tenant_id VARCHAR(64) PRIMARY KEY,
  company_name VARCHAR(128) NOT NULL,
  gstin VARCHAR(15) NOT NULL,
  primary_color VARCHAR(16) NOT NULL DEFAULT '#2563eb',
  logo_url TEXT,
  state_jurisdiction VARCHAR(64) NOT NULL DEFAULT 'Maharashtra',
  active BOOLEAN NOT NULL DEFAULT TRUE
);`
    },
    {
      name: "erp_web_orders",
      domain: "E-Commerce & Digital Orders",
      desc: "Inbound online distributor crate orders placed via customer mobile portal or EDI webhooks.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique online order identifier"],
        ["order_token", "VARCHAR(64) UNIQUE NOT NULL", "Cryptographic UUID order tracking token"],
        ["customer_name", "VARCHAR(128) NOT NULL", "Ordering customer name"],
        ["phone", "VARCHAR(20) NOT NULL", "Verified phone number"],
        ["crate_type", "VARCHAR(64) NOT NULL", "Crate variant ordered"],
        ["quantity", "INTEGER NOT NULL", "Crate quantity requested"],
        ["status", "VARCHAR(32) DEFAULT 'NEW'", "Status: NEW, CONFIRMED, REJECTED, CONVERTED_TO_SALES"],
        ["payment_gateway_ref", "VARCHAR(64)", "Razorpay / UPI transaction authorization ID"],
        ["created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP", "Order placement timestamp"]
      ],
      ddl: `CREATE TABLE erp_web_orders (
  id BIGSERIAL PRIMARY KEY,
  order_token VARCHAR(64) UNIQUE NOT NULL,
  customer_name VARCHAR(128) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  crate_type VARCHAR(64) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status VARCHAR(32) NOT NULL DEFAULT 'NEW',
  payment_gateway_ref VARCHAR(64),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);`
    },
    {
      name: "e_way_bills",
      domain: "GST Compliance & Logistics",
      desc: "Electronic Way Bills generated for consignments exceeding INR 50,000 threshold under GST Rule 138.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique e-way bill record identifier"],
        ["ewb_no", "VARCHAR(32) UNIQUE NOT NULL", "12-digit government E-Way Bill Number"],
        ["invoice_id", "BIGINT NOT NULL REFERENCES invoices(id)", "Tax invoice cross-reference"],
        ["dispatch_id", "BIGINT REFERENCES dispatches(id)", "Gate pass cross-reference"],
        ["generated_date", "TIMESTAMP NOT NULL", "E-Way bill issuance timestamp"],
        ["valid_until", "TIMESTAMP NOT NULL", "E-Way bill validity expiration based on distance"],
        ["distance_km", "INTEGER NOT NULL", "Calculated road transit distance in kilometers"],
        ["vehicle_no", "VARCHAR(20) NOT NULL", "Commercial truck vehicle registration number"],
        ["status", "VARCHAR(32) DEFAULT 'ACTIVE'", "Status: ACTIVE, EXTENDED, CANCELLED"]
      ],
      ddl: `CREATE TABLE e_way_bills (
  id BIGSERIAL PRIMARY KEY,
  ewb_no VARCHAR(32) UNIQUE NOT NULL,
  invoice_id BIGINT NOT NULL REFERENCES invoices(id),
  dispatch_id BIGINT REFERENCES dispatches(id),
  generated_date TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  distance_km INTEGER NOT NULL CHECK (distance_km > 0),
  vehicle_no VARCHAR(20) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE'
);`
    },
    {
      name: "e_invoices",
      domain: "GST Compliance",
      desc: "Invoice Registration Portal (IRP) electronic invoices, cryptographic digital signatures, and signed QR code strings.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique e-invoice metadata identifier"],
        ["invoice_id", "BIGINT NOT NULL REFERENCES invoices(id)", "Tax invoice reference"],
        ["irn", "VARCHAR(64) UNIQUE NOT NULL", "64-character hash computed via SHA-256 by government IRP"],
        ["signed_qr_code", "TEXT NOT NULL", "Government digitally signed QR code payload for physical invoice print"],
        ["ack_no", "VARCHAR(32) NOT NULL", "IRP acknowledgment number"],
        ["ack_date", "TIMESTAMP NOT NULL", "IRP registration timestamp"]
      ],
      ddl: `CREATE TABLE e_invoices (
  id BIGSERIAL PRIMARY KEY,
  invoice_id BIGINT NOT NULL REFERENCES invoices(id),
  irn VARCHAR(64) UNIQUE NOT NULL,
  signed_qr_code TEXT NOT NULL,
  ack_no VARCHAR(32) NOT NULL,
  ack_date TIMESTAMP NOT NULL
);`
    },
    {
      name: "delivery_challans",
      domain: "Logistics & Job Work",
      desc: "Delivery challans for goods dispatched without immediate sale (sample crates, exhibition molds, job work regrind).",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique delivery challan identifier"],
        ["challan_no", "VARCHAR(64) UNIQUE NOT NULL", "Challan sequence (e.g., DC-2026-0129)"],
        ["party_id", "BIGINT NOT NULL REFERENCES party(id)", "Receiving party entity reference"],
        ["challan_date", "DATE NOT NULL", "Dispatch movement date"],
        ["purpose", "VARCHAR(64) NOT NULL", "Reason: JOB_WORK, TRIAL_SAMPLE, MOLD_MAINTENANCE, EXHIBITION"],
        ["crate_type", "VARCHAR(64) NOT NULL", "Item description"],
        ["quantity", "INTEGER NOT NULL", "Dispatched quantity"],
        ["status", "VARCHAR(32) DEFAULT 'OPEN'", "Status: OPEN, RETURNED, CONVERTED_TO_INVOICE"]
      ],
      ddl: `CREATE TABLE delivery_challans (
  id BIGSERIAL PRIMARY KEY,
  challan_no VARCHAR(64) UNIQUE NOT NULL,
  party_id BIGINT NOT NULL REFERENCES party(id),
  challan_date DATE NOT NULL,
  purpose VARCHAR(64) NOT NULL,
  crate_type VARCHAR(64) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status VARCHAR(32) NOT NULL DEFAULT 'OPEN'
);`
    },
    {
      name: "credit_debit_notes",
      domain: "GST Financial Accounting",
      desc: "Credit notes and debit notes issued under GST Section 34 for sales returns, rate adjustments, or quality rebates.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique note identifier"],
        ["note_no", "VARCHAR(64) UNIQUE NOT NULL", "Note serial (e.g., CN-2026-0044)"],
        ["note_type", "VARCHAR(16) NOT NULL CHECK (note_type IN ('CREDIT', 'DEBIT'))", "Type of adjustment"],
        ["original_invoice_id", "BIGINT NOT NULL REFERENCES invoices(id)", "Original referenced tax invoice"],
        ["party_id", "BIGINT NOT NULL REFERENCES party(id)", "Customer party entity reference"],
        ["taxable_difference", "NUMERIC(14,2) NOT NULL", "Adjusted taxable base amount (INR)"],
        ["gst_adjustment", "NUMERIC(14,2) NOT NULL", "Adjusted 18% GST (INR)"],
        ["total_adjustment", "NUMERIC(14,2) NOT NULL", "Final credit/debit monetary adjustment (INR)"],
        ["reason", "TEXT NOT NULL", "Audited justification (e.g., Crushed crates returned from transit)"],
        ["note_date", "DATE NOT NULL", "Issuance date"]
      ],
      ddl: `CREATE TABLE credit_debit_notes (
  id BIGSERIAL PRIMARY KEY,
  note_no VARCHAR(64) UNIQUE NOT NULL,
  note_type VARCHAR(16) NOT NULL CHECK (note_type IN ('CREDIT', 'DEBIT')),
  original_invoice_id BIGINT NOT NULL REFERENCES invoices(id),
  party_id BIGINT NOT NULL REFERENCES party(id),
  taxable_difference NUMERIC(14,2) NOT NULL,
  gst_adjustment NUMERIC(14,2) NOT NULL,
  total_adjustment NUMERIC(14,2) NOT NULL,
  reason TEXT NOT NULL,
  note_date DATE NOT NULL
);`
    },
    {
      name: "custom_fields",
      domain: "Extensibility & Customization",
      desc: "User-defined custom metadata fields added dynamically to invoices, parties, machines, or employees without schema migration.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique custom field metadata identifier"],
        ["entity_type", "VARCHAR(32) NOT NULL", "Target entity: PARTY, INVOICE, MACHINE, EMPLOYEE, SALES"],
        ["field_key", "VARCHAR(64) NOT NULL", "Internal JSON property key (e.g., driver_aadhaar, pallet_code)"],
        ["field_label", "VARCHAR(128) NOT NULL", "Human-readable UI form label"],
        ["field_type", "VARCHAR(32) NOT NULL", "Data type: STRING, NUMBER, DATE, BOOLEAN, DROPDOWN"],
        ["options_json", "TEXT", "JSON array of selectable options for dropdown types"],
        ["required", "BOOLEAN DEFAULT FALSE", "Form mandatory validation rule"]
      ],
      ddl: `CREATE TABLE custom_fields (
  id BIGSERIAL PRIMARY KEY,
  entity_type VARCHAR(32) NOT NULL,
  field_key VARCHAR(64) NOT NULL,
  field_label VARCHAR(128) NOT NULL,
  field_type VARCHAR(32) NOT NULL,
  options_json TEXT,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT uq_entity_field UNIQUE (entity_type, field_key)
);`
    },
    {
      name: "custom_field_values",
      domain: "Extensibility & Customization",
      desc: "Storage of dynamic custom field values associated with specific entity record IDs.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique custom field value entry identifier"],
        ["field_id", "BIGINT NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE", "Field definition reference"],
        ["record_id", "BIGINT NOT NULL", "Target entity record primary key (e.g., party.id)"],
        ["field_value", "TEXT", "User-entered value string"]
      ],
      ddl: `CREATE TABLE custom_field_values (
  id BIGSERIAL PRIMARY KEY,
  field_id BIGINT NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  record_id BIGINT NOT NULL,
  field_value TEXT,
  CONSTRAINT uq_record_field UNIQUE (field_id, record_id)
);`
    },
    {
      name: "feature_flags",
      domain: "DevOps & Configuration",
      desc: "Dynamic runtime feature toggles controlling visibility and activation of experimental or premium enterprise modules.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique feature flag identifier"],
        ["flag_key", "VARCHAR(64) UNIQUE NOT NULL", "Feature key (e.g., enable_whatsapp_alerts, enable_biometric_sync)"],
        ["enabled", "BOOLEAN NOT NULL DEFAULT FALSE", "Current activation status"],
        ["description", "TEXT", "Technical explanation of the feature scope"]
      ],
      ddl: `CREATE TABLE feature_flags (
  id BIGSERIAL PRIMARY KEY,
  flag_key VARCHAR(64) UNIQUE NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT
);`
    },
    {
      name: "role_permissions",
      domain: "Security & Access Control",
      desc: "Granular CRUD access control rules governing which user roles can view, create, edit, or delete records in each module.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique role permission mapping identifier"],
        ["role", "VARCHAR(32) NOT NULL", "Target role: SUPER_ADMIN, ADMIN, MANAGER, ACCOUNTANT, OPERATOR, VIEWER"],
        ["module_key", "VARCHAR(64) NOT NULL", "UI tab module key (e.g., production, invoices, billinghub)"],
        ["can_view", "BOOLEAN DEFAULT TRUE", "Permission to read records"],
        ["can_create", "BOOLEAN DEFAULT FALSE", "Permission to insert new records"],
        ["can_edit", "BOOLEAN DEFAULT FALSE", "Permission to update existing records"],
        ["can_delete", "BOOLEAN DEFAULT FALSE", "Permission to permanently remove records"]
      ],
      ddl: `CREATE TABLE role_permissions (
  id BIGSERIAL PRIMARY KEY,
  role VARCHAR(32) NOT NULL,
  module_key VARCHAR(64) NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT TRUE,
  can_create BOOLEAN NOT NULL DEFAULT FALSE,
  can_edit BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT uq_role_module UNIQUE (role, module_key)
);`
    },
    {
      name: "db_backups",
      domain: "DevOps & Disaster Recovery",
      desc: "Metadata catalog of automated and manual PostgreSQL database backups, file paths, SHA-256 hashes, and byte sizes.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique backup catalog entry identifier"],
        ["filename", "VARCHAR(128) UNIQUE NOT NULL", "Generated backup archive filename (e.g., backup_20261021.sql.gz)"],
        ["file_size_bytes", "BIGINT NOT NULL", "Exact size of backup archive in bytes"],
        ["sha256_hash", "VARCHAR(64) NOT NULL", "Cryptographic integrity checksum"],
        ["backup_type", "VARCHAR(16) NOT NULL", "FULL, INCREMENTAL, AUTOMATED_DAILY"],
        ["status", "VARCHAR(32) NOT NULL DEFAULT 'COMPLETED'", "COMPLETED, FAILED, VERIFIED"],
        ["created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP", "Timestamp backup was executed"]
      ],
      ddl: `CREATE TABLE db_backups (
  id BIGSERIAL PRIMARY KEY,
  filename VARCHAR(128) UNIQUE NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  sha256_hash VARCHAR(64) NOT NULL,
  backup_type VARCHAR(16) NOT NULL DEFAULT 'FULL',
  status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);`
    },
    {
      name: "system_metrics",
      domain: "Observability & Performance",
      desc: "Periodic system telemetry metrics logging JVM heap consumption, physical RAM usage, CPU load, and active database connections.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique telemetry snapshot identifier"],
        ["recorded_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP", "Metric capture timestamp"],
        ["jvm_heap_used_mb", "INTEGER NOT NULL", "Active JVM heap allocated (MB)"],
        ["system_free_ram_mb", "INTEGER NOT NULL", "Host Windows physical free RAM (MB)"],
        ["active_db_connections", "INTEGER NOT NULL", "Active HikariCP connection count"],
        ["cpu_load_pct", "NUMERIC(5,2)", "Overall system CPU utilization percentage"]
      ],
      ddl: `CREATE TABLE system_metrics (
  id BIGSERIAL PRIMARY KEY,
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  jvm_heap_used_mb INTEGER NOT NULL,
  system_free_ram_mb INTEGER NOT NULL,
  active_db_connections INTEGER NOT NULL,
  cpu_load_pct NUMERIC(5,2)
);
CREATE INDEX idx_metrics_recorded ON system_metrics(recorded_at DESC);`
    },
    {
      name: "password_history",
      domain: "Security & Identity",
      desc: "Cryptographic archive of previous password hashes per user to enforce password non-reuse compliance policies.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique password history identifier"],
        ["user_id", "BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE", "Target user reference"],
        ["password_hash", "VARCHAR(256) NOT NULL", "Previous PBKDF2 HMAC SHA-256 hash"],
        ["salt", "VARCHAR(64) NOT NULL", "Salt used for previous hash"],
        ["created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP", "Date password was retired"]
      ],
      ddl: `CREATE TABLE password_history (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash VARCHAR(256) NOT NULL,
  salt VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);`
    },
    {
      name: "sessions",
      domain: "Security & Identity",
      desc: "Active authenticated session tokens, client IP addresses, user agents, cryptographic nonces, and expiration timestamps.",
      cols: [
        ["id", "BIGSERIAL PRIMARY KEY", "Unique session identifier"],
        ["session_token", "VARCHAR(128) UNIQUE NOT NULL", "High-entropy cryptographic session identifier"],
        ["user_id", "BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE", "Authenticated user reference"],
        ["ip_address", "VARCHAR(45)", "Client network IPv4 / IPv6 address"],
        ["user_agent", "TEXT", "Client web browser user agent"],
        ["expires_at", "TIMESTAMP NOT NULL", "Session expiration deadline"],
        ["created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP", "Session initiation timestamp"]
      ],
      ddl: `CREATE TABLE sessions (
  id BIGSERIAL PRIMARY KEY,
  session_token VARCHAR(128) UNIQUE NOT NULL,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sessions_token ON sessions(session_token);`
    },
    {
      name: "rate_limit_buckets",
      domain: "Security & DDoS Protection",
      desc: "Token bucket counters tracking API request rates per client IP address to prevent brute-force attacks and abuse.",
      cols: [
        ["client_key", "VARCHAR(64) PRIMARY KEY", "Client IP or username identifier"],
        ["tokens_remaining", "INTEGER NOT NULL", "Available request tokens in current window"],
        ["last_refill_at", "BIGINT NOT NULL", "Epoch millisecond timestamp of last token refill"]
      ],
      ddl: `CREATE TABLE rate_limit_buckets (
  client_key VARCHAR(64) PRIMARY KEY,
  tokens_remaining INTEGER NOT NULL,
  last_refill_at BIGINT NOT NULL
);`
    }
  ];

  let html = `
  <div>
    <h2 class="volume-title">Volume II: Complete Relational Database Catalog & DDL Reference</h2>
    
    <h3 class="chapter-title">Chapter 1: PostgreSQL 16 Architecture & Performance Tuning</h3>
    <p>
      Futane Agro ERP is powered by <strong>PostgreSQL 16 Enterprise Edition</strong> running on an isolated local loopback service (<code>localhost:5432</code>). PostgreSQL was selected for its strict ACID compliance, robust write-ahead logging (WAL), deterministic foreign key constraint enforcement, and lightweight RAM footprint.
    </p>

    <h4 class="section-title">1.1 Host Memory Invariants & HikariCP Pool Sizing</h4>
    <p>
      To prevent the database engine from monopolizing system RAM on an 8 GB Windows laptop, PostgreSQL's buffer pool and worker memory are statically tuned:
    </p>
    <table class="spec-table">
      <thead>
        <tr>
          <th>Configuration Parameter</th>
          <th>Tuned Production Value</th>
          <th>Technical Rationale</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>shared_buffers</code></td>
          <td>128 MB</td>
          <td>Capped to avoid memory pressure with Spring Boot and Node.js processes</td>
        </tr>
        <tr>
          <td><code>work_mem</code></td>
          <td>16 MB</td>
          <td>Allows complex sort and hash join operations for reports without disk spilling</td>
        </tr>
        <tr>
          <td><code>maintenance_work_mem</code></td>
          <td>64 MB</td>
          <td>Accelerates vacuuming and B-Tree index creation during maintenance</td>
        </tr>
        <tr>
          <td><code>max_connections</code></td>
          <td>25</td>
          <td>Prevents thread starvation and excessive Windows context switching</td>
        </tr>
        <tr>
          <td><code>effective_cache_size</code></td>
          <td>512 MB</td>
          <td>Planner guideline for OS filesystem page cache availability</td>
        </tr>
        <tr>
          <td><code>HikariCP maximumPoolSize</code></td>
          <td>8</td>
          <td>Matches CPU core availability and prevents database thread thrashing</td>
        </tr>
      </tbody>
    </table>

    <h3 class="chapter-title">Chapter 2: Relational Entity Catalog (All 39 Database Tables)</h3>
    <p>
      The complete database catalog consists of 39 normalized relational tables and 4 analytical views. Each table definition below outlines the functional business purpose, column data dictionary, primary/foreign key relationships, and the complete production DDL script.
    </p>
  `;

  for (let i = 0; i < tables.length; i++) {
    const t = tables[i];
    html += `
    <div class="page-break"></div>
    <div class="avoid-break" style="padding-top: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #1e3a8a; padding-bottom: 4px;">
        <h4 style="font-size: 13pt; font-weight: 800; color: #1e3a8a; margin: 0;">
          Table ${i + 1}: <code>${t.name}</code>
        </h4>
        <span class="badge badge-role">${t.domain}</span>
      </div>
      <p style="font-size: 9pt; color: #475569; margin-top: 6px; margin-bottom: 10px;">
        <strong>Purpose:</strong> ${t.desc}
      </p>

      <table class="spec-table">
        <thead>
          <tr>
            <th style="width: 25%;">Column Name</th>
            <th style="width: 30%;">Data Type & Constraints</th>
            <th style="width: 45%;">Description & Relationship</th>
          </tr>
        </thead>
        <tbody>
          ${t.cols.map(c => `
            <tr>
              <td><code>${c[0]}</code></td>
              <td><code>${c[1]}</code></td>
              <td>${c[2]}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="font-size: 7.5pt; font-weight: 700; color: #64748b; margin-top: 6px; margin-bottom: 2px;">
        PRODUCTION SQL DDL DEFINITION:
      </div>
      <pre class="code-block">${t.ddl}</pre>
    </div>
    `;
  }

  html += `
    <div class="page-break"></div>
    <h3 class="chapter-title">Chapter 3: Analytical Materialized & Relational Database Views</h3>
    <p>
      To maximize query execution velocity on dashboards and analytics without imposing computational overhead on transactional tables, four optimized analytical views are deployed:
    </p>

    <div class="avoid-break">
      <h4 class="section-title">View 1: <code>v_daily_financial_summary</code></h4>
      <p>Aggregates daily sales billed, customer payment receipts collected, factory expenses disbursed, and computed net cash flow.</p>
      <pre class="code-block">
CREATE OR REPLACE VIEW v_daily_financial_summary AS
SELECT 
  d.date_val AS transaction_date,
  COALESCE(SUM(s.total_amount), 0.00) AS total_sales_billed,
  COALESCE(SUM(p.amount), 0.00) AS total_payments_received,
  COALESCE(SUM(e.amount), 0.00) AS total_expenses_paid,
  (COALESCE(SUM(p.amount), 0.00) - COALESCE(SUM(e.amount), 0.00)) AS net_daily_cashflow
FROM (
  SELECT invoice_date AS date_val FROM invoices
  UNION SELECT payment_date FROM payments
  UNION SELECT expense_date FROM expenses
) d
LEFT JOIN invoices s ON s.invoice_date = d.date_val
LEFT JOIN payments p ON p.payment_date = d.date_val
LEFT JOIN expenses e ON e.expense_date = d.date_val
GROUP BY d.date_val
ORDER BY d.date_val DESC;
      </pre>
    </div>

    <div class="avoid-break" style="margin-top: 16px;">
      <h4 class="section-title">View 2: <code>v_inventory_valuation</code></h4>
      <p>Computes live finished goods inventory valuation and identifies stock items falling below safety reorder buffers.</p>
      <pre class="code-block">
CREATE OR REPLACE VIEW v_inventory_valuation AS
SELECT 
  id,
  item_name,
  crate_type,
  current_stock,
  minimum_threshold,
  unit_cost,
  (current_stock * unit_cost) AS total_valuation_inr,
  CASE 
    WHEN current_stock <= minimum_threshold THEN 'CRITICAL_REORDER'
    WHEN current_stock <= (minimum_threshold * 1.5) THEN 'LOW_STOCK'
    ELSE 'HEALTHY'
  END AS inventory_status
FROM inventory;
      </pre>
    </div>

    <div class="avoid-break" style="margin-top: 16px;">
      <h4 class="section-title">View 3: <code>v_machine_oee_metrics</code></h4>
      <p>Tracks Overall Equipment Effectiveness (OEE) metrics, breakdown frequency, and operational scrap ratios per injection molding machine.</p>
      <pre class="code-block">
CREATE OR REPLACE VIEW v_machine_oee_metrics AS
SELECT 
  m.id AS machine_id,
  m.machine_code,
  m.machine_name,
  m.clamping_force_tons,
  m.status,
  COUNT(DISTINCT p.id) AS total_shifts_run,
  COALESCE(SUM(p.successful_crates), 0) AS total_crates_produced,
  COALESCE(SUM(p.rejected_crates), 0) AS total_crates_rejected,
  ROUND(AVG(p.efficiency_pct), 2) AS average_efficiency_pct,
  COALESCE(SUM(b.downtime_hours), 0.00) AS total_downtime_hours
FROM machines m
LEFT JOIN production_ppd p ON p.machine_id = m.id
LEFT JOIN machine_breakdowns b ON b.machine_id = m.id
GROUP BY m.id, m.machine_code, m.machine_name, m.clamping_force_tons, m.status;
      </pre>
    </div>

    <div class="avoid-break" style="margin-top: 16px;">
      <h4 class="section-title">View 4: <code>v_tax_liability_ledger</code></h4>
      <p>Provides a real-time GST tax audit register summarizing monthly CGST, SGST, IGST liabilities and total outward taxable turnover.</p>
      <pre class="code-block">
CREATE OR REPLACE VIEW v_tax_liability_ledger AS
SELECT 
  EXTRACT(YEAR FROM invoice_date) AS tax_year,
  EXTRACT(MONTH FROM invoice_date) AS tax_month,
  COUNT(id) AS total_invoices_issued,
  SUM(subtotal) AS total_taxable_turnover,
  SUM(cgst_amount) AS total_cgst_liability,
  SUM(sgst_amount) AS total_sgst_liability,
  SUM(igst_amount) AS total_igst_liability,
  SUM(cgst_amount + sgst_amount + igst_amount) AS total_gst_payable,
  SUM(grand_total) AS total_gross_billed
FROM invoices
GROUP BY EXTRACT(YEAR FROM invoice_date), EXTRACT(MONTH FROM invoice_date)
ORDER BY tax_year DESC, tax_month DESC;
      </pre>
    </div>
  </div>
  `;

  return html;
}
