-- liquibase formatted sql
-- changeset admin:07-data-migration runOnChange:true splitStatements:true failOnError:false
-- preconditions onFail:MARK_RAN
-- precondition-sql-check expectedResult:1 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'users';

-- ==============================================================================
-- ENTERPRISE DATA MIGRATION STRATEGY (INTEGER -> UUID)
-- ==============================================================================
-- To safely migrate existing data from the old flat tables (with Integer IDs) 
-- to the new normalized, UUID-based tables, we must maintain foreign key relationships.
-- We do this by temporarily adding an 'old_id' column to the new tables to track 
-- the mapping during migration.

-- 1. Add temporary tracking columns to new tables
ALTER TABLE t_core_user ADD COLUMN temp_old_id INT;
ALTER TABLE t_hr_employee ADD COLUMN temp_old_id INT;
ALTER TABLE t_crm_party ADD COLUMN temp_old_id INT;
ALTER TABLE t_sal_sales ADD COLUMN temp_old_id INT;
ALTER TABLE t_log_dispatch ADD COLUMN temp_old_id INT;
ALTER TABLE t_hr_driver ADD COLUMN temp_old_id INT;
ALTER TABLE t_inv_raw_material ADD COLUMN temp_old_id INT;
ALTER TABLE t_prd_machine_master ADD COLUMN temp_old_id INT;

-- 2. Migrate Core Users
INSERT INTO t_core_user (id, username, password, role, temp_old_id)
SELECT UUID(), username, password, role, id FROM users;

-- 3. Migrate Employees (Map user_id foreign key using the new UUID)
INSERT INTO t_hr_employee (id, user_id, emp_name, emp_contact, designation, joining_date, temp_old_id)
SELECT 
    UUID(), 
    (SELECT id FROM t_core_user WHERE temp_old_id = e.user_id), 
    e.emp_name, 
    e.emp_contact, 
    e.designation, 
    e.joining_date, 
    e.emp_id 
FROM employees e;

-- 4. Migrate Parties
INSERT INTO t_crm_party (id, party_name, contact_person, mobile, email, gst_no, address, temp_old_id)
SELECT UUID(), party_name, contact_person, mobile, email, gst_no, address, party_id FROM party;

-- 5. Migrate Sales (Map party_id)
INSERT INTO t_sal_sales (id, party_id, invoice_no, total_amount, sale_date, temp_old_id)
SELECT 
    UUID(), 
    (SELECT id FROM t_crm_party WHERE temp_old_id = s.party_id), 
    s.invoice_no, 
    s.total_amount, 
    s.sale_date, 
    s.sale_id 
FROM sales s;

-- 6. Migrate Drivers
INSERT INTO t_hr_driver (id, driver_name, mobile, license_number, temp_old_id)
SELECT UUID(), driver_name, mobile, license_number, driver_id FROM driver;

-- 7. Migrate Dispatches (Map sales_id and driver_id)
INSERT INTO t_log_dispatch (id, sales_id, dispatch_number, driver_id, vehicle_number, status, temp_old_id)
SELECT 
    UUID(), 
    (SELECT id FROM t_sal_sales WHERE temp_old_id = d.sale_id), 
    d.dispatch_number, 
    (SELECT id FROM t_hr_driver WHERE temp_old_id = d.driver_id), 
    d.vehicle_number, 
    d.status, 
    d.dispatch_id 
FROM dispatch d;

-- 8. Clean up temporary tracking columns once migration is verified
ALTER TABLE t_core_user DROP COLUMN temp_old_id;
ALTER TABLE t_hr_employee DROP COLUMN temp_old_id;
ALTER TABLE t_crm_party DROP COLUMN temp_old_id;
ALTER TABLE t_sal_sales DROP COLUMN temp_old_id;
ALTER TABLE t_log_dispatch DROP COLUMN temp_old_id;
ALTER TABLE t_hr_driver DROP COLUMN temp_old_id;
ALTER TABLE t_inv_raw_material DROP COLUMN temp_old_id;
ALTER TABLE t_prd_machine_master DROP COLUMN temp_old_id;

-- (The same mapping logic applies to the remaining 10 tables)
