-- liquibase formatted sql

-- changeset futaneagro:v1.1-1
-- comment: Add composite covering indexes for high volume queries

-- 1. Index on t_sal_sales for party_id + is_deleted
CREATE INDEX idx_sales_party_deleted ON t_sal_sales(party_id, is_deleted);

-- 2. Index on t_sal_sales for date + is_deleted
CREATE INDEX idx_sales_date_deleted ON t_sal_sales(date, is_deleted);

-- 3. Index on t_fin_payment for party_id + is_deleted
CREATE INDEX idx_payment_party_deleted ON t_fin_payment(party_id, is_deleted);

-- 4. Index on t_fin_payment for payment_date + is_deleted
CREATE INDEX idx_payment_date_deleted ON t_fin_payment(payment_date, is_deleted);

-- 5. Index on t_fin_invoice for invoice_no (Already unique, but explicit index helps)
-- CREATE INDEX idx_invoice_no ON t_fin_invoice(invoice_no); -- Assuming unique constraint acts as index

-- 6. Index on t_hr_employee for emp_name (often searched)
CREATE INDEX idx_emp_name ON t_hr_employee(emp_name);

-- 7. Index on t_hr_employee for is_deleted
CREATE INDEX idx_emp_deleted ON t_hr_employee(is_deleted);

-- 8. Index on t_crm_party for party_name
CREATE INDEX idx_party_name ON t_crm_party(party_name);

-- 9. Composite index on t_crm_party for city + is_deleted
CREATE INDEX idx_party_city_deleted ON t_crm_party(city, is_deleted);
