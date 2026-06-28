-- Database Schema Optimization - Indexes & Foreign Keys
-- This script creates performance indexes for commonly queried fields (dates, foreign keys, and soft-delete flags)

-- Sales
CREATE INDEX idx_sales_date_del ON Sales(date, is_deleted);
CREATE INDEX idx_sales_party ON Sales(party_id);

-- Dispatch
CREATE INDEX idx_dispatch_date_del ON Dispatch(date, is_deleted);
CREATE INDEX idx_dispatch_sale ON Dispatch(sale_id);
CREATE INDEX idx_dispatch_status ON Dispatch(status);

-- Payment Collection
CREATE INDEX idx_payment_date_del ON Payment_Collection(payment_date, is_deleted);
CREATE INDEX idx_payment_party ON Payment_Collection(party_id);

-- Raw Material
CREATE INDEX idx_rawmaterial_date_del ON Raw_Material(date, is_deleted);
CREATE INDEX idx_rawmaterial_vendor ON Raw_Material(vendor_id);

-- Employee Salary
CREATE INDEX idx_salary_period ON Employee_Salary(month, year);
CREATE INDEX idx_salary_emp ON Employee_Salary(emp_id);

-- Invoice
CREATE INDEX idx_invoice_created_date ON Invoice(created_date);
CREATE INDEX idx_invoice_sale ON Invoice(sale_id);

-- Production Planning (PPD & PPM)
CREATE INDEX idx_ppd_date_del ON PPD(date, is_deleted);
CREATE INDEX idx_ppm_period_del ON PPM(month, year, is_deleted);

-- Expenses
CREATE INDEX idx_expense_date_del ON Expense(date, is_deleted);

-- Machine Breakdown
CREATE INDEX idx_machine_breakdown_date_del ON Machine_Breakdown(date, is_deleted);
CREATE INDEX idx_machine_breakdown_machine ON Machine_Breakdown(machine_id);
