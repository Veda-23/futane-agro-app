-- Drop existing tables to ensure a clean migration (if they exist)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS Settings;
DROP TABLE IF EXISTS Machine_Breakdown;
DROP TABLE IF EXISTS Machine_Master;
DROP TABLE IF EXISTS Dispatch;
DROP TABLE IF EXISTS Expense;
DROP TABLE IF EXISTS Bank_Transaction;
DROP TABLE IF EXISTS Audit_Log;
DROP TABLE IF EXISTS Invoice;
DROP TABLE IF EXISTS Employee_Salary;
DROP TABLE IF EXISTS Transport;
DROP TABLE IF EXISTS Raw_Material;
DROP TABLE IF EXISTS Inventory;
DROP TABLE IF EXISTS Payment_Collection;
DROP TABLE IF EXISTS Sales;
DROP TABLE IF EXISTS PPM;
DROP TABLE IF EXISTS PPD;
DROP TABLE IF EXISTS Employees;
DROP TABLE IF EXISTS Driver;
DROP TABLE IF EXISTS Vendor;
DROP TABLE IF EXISTS Party;
DROP TABLE IF EXISTS Users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users Table (with Brute Force Lockout)
CREATE TABLE Users (
    username VARCHAR(100) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- SUPER_ADMIN, ADMIN, MANAGER, ACCOUNTANT, PRODUCTION_OPERATOR, STORE_MANAGER
    name VARCHAR(100) NOT NULL,
    failed_attempts INT DEFAULT 0,
    account_locked BOOLEAN DEFAULT FALSE,
    lock_time TIMESTAMP NULL
);

-- 2. Party Table (with Document Slips and Soft Delete)
CREATE TABLE Party (
    party_id INT PRIMARY KEY AUTO_INCREMENT,
    party_name VARCHAR(100) NOT NULL,
    party_address VARCHAR(255),
    party_contact VARCHAR(20),
    gst_number VARCHAR(255), -- AES Encrypted
    email VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_date DATE,
    gst_cert_path VARCHAR(255),
    pan_card_path VARCHAR(255),
    agreement_path VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(100),
    deleted_date DATE
);

-- 3. Vendor Table
CREATE TABLE Vendor (
    vendor_id INT PRIMARY KEY AUTO_INCREMENT,
    vendor_name VARCHAR(100) NOT NULL,
    mobile VARCHAR(20),
    address VARCHAR(255),
    gst_number VARCHAR(255), -- AES Encrypted
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(100),
    deleted_date DATE
);

-- 4. Driver Table
CREATE TABLE Driver (
    driver_id INT PRIMARY KEY AUTO_INCREMENT,
    driver_name VARCHAR(100) NOT NULL,
    mobile VARCHAR(20),
    license_number VARCHAR(50),
    address VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(100),
    deleted_date DATE
);

-- 5. Employees Table
CREATE TABLE Employees (
    emp_id INT PRIMARY KEY AUTO_INCREMENT,
    emp_name VARCHAR(100) NOT NULL,
    emp_contact VARCHAR(20),
    salary DECIMAL(10,2) NOT NULL,
    address VARCHAR(255),
    designation VARCHAR(100),
    joining_date DATE,
    aadhaar_no VARCHAR(20),
    bank_account VARCHAR(255), -- AES Encrypted
    photo_path VARCHAR(255),
    aadhaar_card_path VARCHAR(255),
    bank_passbook_path VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(100),
    deleted_date DATE
);

-- 6. PPD (Production Per Day) Table
CREATE TABLE PPD (
    ppd_id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    crate_type VARCHAR(100) NOT NULL,
    total_production INT NOT NULL,
    successful INT NOT NULL,
    rejected INT NOT NULL,
    shift VARCHAR(50) NOT NULL, -- Morning Shift, Afternoon Shift, Night Shift
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(100),
    deleted_date DATE
);

-- 7. PPM (Production Per Month) Table
CREATE TABLE PPM (
    ppm_id INT PRIMARY KEY AUTO_INCREMENT,
    month VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    crates_produced INT NOT NULL,
    electricity_units DECIMAL(10,2) NOT NULL,
    electricity_bill DECIMAL(10,2) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(100),
    deleted_date DATE
);

-- 8. Sales Table (with HSN & GST details)
CREATE TABLE Sales (
    sale_id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    party_id INT NOT NULL,
    crate_type VARCHAR(100) NOT NULL,
    crate_material VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    rate DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    remaining DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    hsn_code VARCHAR(50),
    gst_rate DECIMAL(5,2), -- tax rate percentage (e.g. 18.00)
    cgst DECIMAL(10,2),
    sgst DECIMAL(10,2),
    invoice_copy_path VARCHAR(255),
    delivery_challan_path VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(100),
    deleted_date DATE,
    FOREIGN KEY (party_id) REFERENCES Party(party_id)
);

-- 9. Payment Collection Table
CREATE TABLE Payment_Collection (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    party_id INT NOT NULL,
    invoice_no VARCHAR(100),
    amount_received DECIMAL(10,2) NOT NULL,
    payment_mode VARCHAR(50) NOT NULL, -- Cash, UPI, Cheque, Bank Transfer
    payment_date DATE NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(100),
    deleted_date DATE,
    FOREIGN KEY (party_id) REFERENCES Party(party_id)
);

-- 10. Inventory Table
CREATE TABLE Inventory (
    inventory_id INT PRIMARY KEY AUTO_INCREMENT,
    crate_type VARCHAR(100) NOT NULL,
    material_type VARCHAR(100) NOT NULL,
    opening_stock INT NOT NULL DEFAULT 0,
    produced_stock INT NOT NULL DEFAULT 0,
    sold_stock INT NOT NULL DEFAULT 0,
    current_stock INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(100),
    deleted_date DATE
);

-- 11. Raw Material Purchase Table
CREATE TABLE Raw_Material (
    raw_material_id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    material_name VARCHAR(100) NOT NULL,
    vendor_id INT NOT NULL,
    weight DECIMAL(10,2) NOT NULL,
    rate DECIMAL(10,2) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    purchase_bill_path VARCHAR(255),
    weight_slip_path VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(100),
    deleted_date DATE,
    FOREIGN KEY (vendor_id) REFERENCES Vendor(vendor_id)
);

-- 12. Transport Management Table
CREATE TABLE Transport (
    transport_id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    truck_number VARCHAR(50) NOT NULL,
    driver_id INT NOT NULL,
    rent DECIMAL(10,2) NOT NULL,
    advance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    remaining DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    truck_photo_path VARCHAR(255),
    driver_license_path VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(100),
    deleted_date DATE,
    FOREIGN KEY (driver_id) REFERENCES Driver(driver_id)
);

-- 13. Employee Salary Table
CREATE TABLE Employee_Salary (
    salary_id INT PRIMARY KEY AUTO_INCREMENT,
    emp_id INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    salary_amount DECIMAL(10,2) NOT NULL,
    paid_date DATE,
    status VARCHAR(50) NOT NULL, -- Paid, Pending
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(100),
    deleted_date DATE,
    FOREIGN KEY (emp_id) REFERENCES Employees(emp_id)
);

-- 14. Invoice Table
CREATE TABLE Invoice (
    invoice_id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_no VARCHAR(100) UNIQUE NOT NULL,
    sale_id INT NOT NULL,
    created_date DATE NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(100),
    deleted_date DATE,
    FOREIGN KEY (sale_id) REFERENCES Sales(sale_id)
);

-- 15. Audit Log Table (Production Schema with Old/New Comparisons)
CREATE TABLE Audit_Log (
    audit_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL,
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Machine Master Table
CREATE TABLE Machine_Master (
    machine_id INT PRIMARY KEY AUTO_INCREMENT,
    machine_name VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(100),
    purchase_date DATE,
    warranty_date DATE,
    status VARCHAR(50) NOT NULL, -- Running, Maintenance, Stopped
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(100),
    deleted_date DATE
);

-- 17. Machine Breakdown Table
CREATE TABLE Machine_Breakdown (
    breakdown_id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    machine_id INT NOT NULL,
    issue VARCHAR(255) NOT NULL,
    resolved_by VARCHAR(100),
    downtime INT, -- minutes
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(100),
    deleted_date DATE,
    FOREIGN KEY (machine_id) REFERENCES Machine_Master(machine_id)
);

-- 18. Dispatch Table
CREATE TABLE Dispatch (
    dispatch_id INT PRIMARY KEY AUTO_INCREMENT,
    dispatch_number VARCHAR(100) UNIQUE NOT NULL,
    sale_id INT NOT NULL,
    vehicle_number VARCHAR(50) NOT NULL,
    driver_name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(50) NOT NULL, -- Pending, In Transit, Delivered
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(100),
    deleted_date DATE,
    FOREIGN KEY (sale_id) REFERENCES Sales(sale_id)
);

-- 19. Expense Table
CREATE TABLE Expense (
    expense_id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    category VARCHAR(100) NOT NULL, -- Diesel, Electricity, Repair, Office Expense, Maintenance
    amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(100),
    deleted_date DATE
);

-- 20. Bank Transaction Table
CREATE TABLE Bank_Transaction (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    mode VARCHAR(50) NOT NULL, -- Cash, Bank, UPI
    amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(255),
    type VARCHAR(50) NOT NULL, -- Debit, Credit
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(100),
    deleted_date DATE
);

-- 21. Settings Table (For Custom Power BI Embedding URL)
CREATE TABLE Settings (
    config_key VARCHAR(100) PRIMARY KEY,
    config_value TEXT
);
