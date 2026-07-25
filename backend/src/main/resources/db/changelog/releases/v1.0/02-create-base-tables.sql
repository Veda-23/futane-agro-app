-- liquibase formatted sql
-- changeset admin:02-create-base-tables

-- Core HR & Auth
CREATE TABLE t_core_user (
    id CHAR(36) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    failed_attempts INT,
    account_locked BOOLEAN DEFAULT FALSE,
    lock_time TIMESTAMP NULL,
    email VARCHAR(255),
    mobile_number VARCHAR(255)
);

CREATE TABLE t_hr_employee (
    id CHAR(36) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    emp_id INT AUTO_INCREMENT UNIQUE,
    emp_name VARCHAR(255) NOT NULL,
    emp_contact VARCHAR(255) NOT NULL,
    salary DECIMAL(15,2) NOT NULL,
    address VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    joining_date DATE NOT NULL,
    aadhaar_no VARCHAR(255) NOT NULL,
    bank_account VARCHAR(255) NOT NULL,
    photo_path VARCHAR(255) NOT NULL,
    aadhaar_card_path VARCHAR(255) NOT NULL,
    bank_passbook_path VARCHAR(255) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_by VARCHAR(255),
    deleted_date TIMESTAMP NULL,
    user_id CHAR(36)
);

-- Business Entities
CREATE TABLE t_crm_party (
    id CHAR(36) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    party_id INT AUTO_INCREMENT UNIQUE,
    party_name VARCHAR(255) NOT NULL,
    party_address VARCHAR(255) NOT NULL,
    party_contact VARCHAR(255) NOT NULL,
    gst_number VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    created_date DATE NOT NULL,
    gst_cert_path VARCHAR(255),
    pan_card_path VARCHAR(255),
    agreement_path VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_by VARCHAR(255),
    deleted_date TIMESTAMP NULL
);

CREATE TABLE t_sal_sales (
    id CHAR(36) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    party_id CHAR(36) NOT NULL,
    sale_id INT AUTO_INCREMENT UNIQUE,
    date DATE NOT NULL,
    crate_type VARCHAR(255) NOT NULL,
    crate_material VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    rate DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    paid DECIMAL(15,2) NOT NULL,
    remaining DECIMAL(15,2) NOT NULL,
    hsn_code VARCHAR(255),
    gst_rate DECIMAL(15,2),
    cgst DECIMAL(15,2),
    sgst DECIMAL(15,2),
    invoice_copy_path VARCHAR(255),
    delivery_challan_path VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(255),
    deleted_date TIMESTAMP NULL
);

CREATE TABLE t_log_dispatch (
    id CHAR(36) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    dispatch_id INT AUTO_INCREMENT UNIQUE,
    dispatch_number VARCHAR(255) NOT NULL,
    sale_id CHAR(36) NOT NULL,
    vehicle_number VARCHAR(255) NOT NULL,
    driver_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(255) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(255),
    deleted_date TIMESTAMP NULL
);

CREATE TABLE t_hr_driver (
    id CHAR(36) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    driver_id INT AUTO_INCREMENT UNIQUE,
    driver_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(255),
    license_number VARCHAR(255),
    address VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(255),
    deleted_date TIMESTAMP NULL
);

-- Inventory & Production
CREATE TABLE t_inv_raw_material (
    id CHAR(36) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    raw_material_id INT AUTO_INCREMENT UNIQUE,
    vendor_id CHAR(36) NOT NULL,
    date DATE NOT NULL,
    material_name VARCHAR(255) NOT NULL,
    weight DECIMAL(15,2) NOT NULL,
    rate DECIMAL(15,2) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    purchase_bill_path VARCHAR(255),
    weight_slip_path VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(255),
    deleted_date TIMESTAMP NULL
);

CREATE TABLE t_prd_machine_master (
    id CHAR(36) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    machine_id INT AUTO_INCREMENT UNIQUE,
    machine_name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(255),
    purchase_date DATE,
    warranty_date DATE,
    status VARCHAR(255) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(255),
    deleted_date TIMESTAMP NULL
);

CREATE TABLE t_fin_transaction (
    id CHAR(36) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    transaction_id INT AUTO_INCREMENT UNIQUE,
    date DATE NOT NULL,
    mode VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description VARCHAR(255),
    type VARCHAR(255) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(255),
    deleted_date TIMESTAMP NULL
);

-- Missing Tables
CREATE TABLE t_hr_salary (
    id CHAR(36) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    salary_id INT AUTO_INCREMENT UNIQUE,
    emp_id CHAR(36) NOT NULL,
    month VARCHAR(255) NOT NULL,
    year INT NOT NULL,
    salary_amount DECIMAL(15,2) NOT NULL,
    paid_date DATE,
    status VARCHAR(255) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(255),
    deleted_date TIMESTAMP NULL
);

CREATE TABLE t_fin_expense (
    id CHAR(36) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expense_id INT AUTO_INCREMENT UNIQUE,
    date DATE NOT NULL,
    category VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(255),
    deleted_date TIMESTAMP NULL
);

CREATE TABLE t_inv_inventory (
    id CHAR(36) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    inventory_id INT AUTO_INCREMENT UNIQUE,
    crate_type VARCHAR(255) NOT NULL,
    material_type VARCHAR(255) NOT NULL,
    opening_stock INT NOT NULL,
    produced_stock INT NOT NULL,
    sold_stock INT NOT NULL,
    current_stock INT NOT NULL,
    last_updated TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(255),
    deleted_date TIMESTAMP NULL
);

CREATE TABLE t_fin_invoice (
    id CHAR(36) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    invoice_id INT AUTO_INCREMENT UNIQUE,
    sale_id CHAR(36) NOT NULL,
    invoice_no VARCHAR(255) NOT NULL,
    created_date DATE NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(255),
    deleted_date TIMESTAMP NULL
);

CREATE TABLE t_prd_breakdown (
    id CHAR(36) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    breakdown_id INT AUTO_INCREMENT UNIQUE,
    machine_id CHAR(36) NOT NULL,
    date DATE NOT NULL,
    issue VARCHAR(255) NOT NULL,
    resolved_by VARCHAR(255),
    downtime INT,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(255),
    deleted_date TIMESTAMP NULL
);

CREATE TABLE t_fin_payment (
    id CHAR(36) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    payment_id INT AUTO_INCREMENT UNIQUE,
    party_id CHAR(36) NOT NULL,
    invoice_no VARCHAR(255),
    amount_received DECIMAL(15,2) NOT NULL,
    payment_mode VARCHAR(255) NOT NULL,
    payment_date DATE NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(255),
    deleted_date TIMESTAMP NULL
);

CREATE TABLE t_prd_ppd (
    id CHAR(36) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    ppd_id INT AUTO_INCREMENT UNIQUE,
    date DATE NOT NULL,
    crate_type VARCHAR(255) NOT NULL,
    total_production INT NOT NULL,
    successful INT NOT NULL,
    rejected INT NOT NULL,
    shift VARCHAR(255) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(255),
    deleted_date TIMESTAMP NULL
);

CREATE TABLE t_prd_ppm (
    id CHAR(36) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    ppm_id INT AUTO_INCREMENT UNIQUE,
    month VARCHAR(255) NOT NULL,
    year INT NOT NULL,
    crates_produced INT NOT NULL,
    electricity_units DECIMAL(19,2),
    electricity_bill DECIMAL(19,2),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(255),
    deleted_date TIMESTAMP NULL
);

CREATE TABLE t_sys_settings (
    id CHAR(36) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    config_key VARCHAR(255) NOT NULL UNIQUE,
    config_value TEXT
);

CREATE TABLE t_log_transport (
    id CHAR(36) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    transport_id INT AUTO_INCREMENT UNIQUE,
    driver_id CHAR(36) NOT NULL,
    date DATE NOT NULL,
    truck_number VARCHAR(255) NOT NULL,
    rent DECIMAL(15,2) NOT NULL,
    advance DECIMAL(15,2) NOT NULL,
    remaining DECIMAL(15,2) NOT NULL,
    truck_photo_path VARCHAR(255),
    driver_license_path VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(255),
    deleted_date TIMESTAMP NULL
);

CREATE TABLE t_crm_vendor (
    id CHAR(36) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    vendor_id INT AUTO_INCREMENT UNIQUE,
    vendor_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(255),
    address VARCHAR(255),
    gst_number VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(255),
    deleted_date TIMESTAMP NULL
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

CREATE TABLE audit_log (
    id CHAR(36) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_by CHAR(36),
    version INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    audit_id INT AUTO_INCREMENT UNIQUE,
    username VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(255),
    old_value TEXT,
    new_value TEXT,
    timestamp TIMESTAMP NULL
);
