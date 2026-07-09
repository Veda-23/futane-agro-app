-- liquibase formatted sql
-- changeset admin:02-create-base-tables

-- Core HR & Auth
CREATE TABLE t_core_user (
    id CHAR(36) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE t_hr_employee (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36),
    emp_name VARCHAR(150) NOT NULL,
    emp_contact VARCHAR(20),
    designation VARCHAR(100),
    joining_date DATE,
    aadhaar_no_encrypted VARCHAR(255),
    bank_account_encrypted VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Business Entities
CREATE TABLE t_crm_party (
    id CHAR(36) PRIMARY KEY,
    party_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(150),
    mobile VARCHAR(20),
    email VARCHAR(150),
    gst_no VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE t_sal_sales (
    id CHAR(36) PRIMARY KEY,
    party_id CHAR(36) NOT NULL,
    invoice_no VARCHAR(100),
    total_amount DECIMAL(15,2) NOT NULL,
    sale_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE t_log_dispatch (
    id CHAR(36) PRIMARY KEY,
    sales_id CHAR(36) NOT NULL,
    dispatch_number VARCHAR(100) NOT NULL,
    driver_id CHAR(36),
    vehicle_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE t_hr_driver (
    id CHAR(36) PRIMARY KEY,
    driver_name VARCHAR(150) NOT NULL,
    license_number VARCHAR(100),
    mobile VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Inventory & Production
CREATE TABLE t_inv_raw_material (
    id CHAR(36) PRIMARY KEY,
    material_name VARCHAR(100) NOT NULL,
    current_stock DECIMAL(15,3) DEFAULT 0,
    unit VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE t_prd_machine_master (
    id CHAR(36) PRIMARY KEY,
    machine_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE t_fin_transaction (
    id CHAR(36) PRIMARY KEY,
    type VARCHAR(20) NOT NULL, -- CREDIT / DEBIT
    amount DECIMAL(15,2) NOT NULL,
    transaction_date DATE NOT NULL,
    mode VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Missing Tables
CREATE TABLE t_hr_salary (
    id CHAR(36) PRIMARY KEY,
    employee_id CHAR(36) NOT NULL,
    month VARCHAR(20),
    year INT,
    salary_amount DECIMAL(15,2),
    paid_date DATE,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE t_fin_expense (
    id CHAR(36) PRIMARY KEY,
    date DATE,
    category VARCHAR(100),
    amount DECIMAL(15,2),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE t_inv_inventory (
    id CHAR(36) PRIMARY KEY,
    crate_type VARCHAR(100),
    material_type VARCHAR(100),
    opening_stock INT DEFAULT 0,
    produced_stock INT DEFAULT 0,
    sold_stock INT DEFAULT 0,
    current_stock INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE t_fin_invoice (
    id CHAR(36) PRIMARY KEY,
    invoice_no VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE t_prd_breakdown (
    id CHAR(36) PRIMARY KEY,
    machine_id CHAR(36) NOT NULL,
    breakdown_date DATE,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE t_fin_payment (
    id CHAR(36) PRIMARY KEY,
    party_id CHAR(36) NOT NULL,
    amount DECIMAL(15,2),
    payment_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE t_prd_ppd (
    id CHAR(36) PRIMARY KEY,
    production_date DATE,
    quantity INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE t_prd_ppm (
    id CHAR(36) PRIMARY KEY,
    machine_id CHAR(36) NOT NULL,
    maintenance_date DATE,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE t_sys_settings (
    id CHAR(36) PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE t_log_transport (
    id CHAR(36) PRIMARY KEY,
    vehicle_number VARCHAR(50),
    driver_id CHAR(36),
    capacity DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE t_crm_vendor (
    id CHAR(36) PRIMARY KEY,
    vendor_name VARCHAR(150) NOT NULL,
    contact VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Audit Table (L5)
CREATE TABLE t_aud_entity_history (
    id CHAR(36) PRIMARY KEY,
    entity_id CHAR(36) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    changed_by CHAR(36),
    old_payload JSON,
    new_payload JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
