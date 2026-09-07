-- liquibase formatted sql

-- changeset futaneagro:v1.1-2
-- comment: Performance & scalability indexes for 100+ concurrent users

-- 1. Invoice table indexes
CREATE INDEX idx_invoice_sale_id ON t_fin_invoice(sale_id);
CREATE INDEX idx_invoice_created_date ON t_fin_invoice(created_date);

-- 2. Raw material purchase indexes
CREATE INDEX idx_rawmat_vendor_date ON t_sup_raw_material(vendor_id, date);
CREATE INDEX idx_rawmat_material_name ON t_sup_raw_material(material_name);

-- 3. Transport & Driver indexes
CREATE INDEX idx_transport_driver_date ON t_log_transport(driver_id, date);
CREATE INDEX idx_transport_truck ON t_log_transport(truck_number);
CREATE INDEX idx_driver_name ON t_log_driver(driver_name);

-- 4. Employee Salary & HR indexes
CREATE INDEX idx_salary_emp_month_year ON t_hr_salary(emp_id, year, month);
CREATE INDEX idx_salary_status_date ON t_hr_salary(status, paid_date);

-- 5. Machine & Breakdown indexes
CREATE INDEX idx_machine_status ON t_mfg_machine(status);
CREATE INDEX idx_breakdown_machine_date ON t_mfg_breakdown(machine_id, date);

-- 6. Dispatch & Logistics indexes
CREATE INDEX idx_dispatch_sale_id ON t_log_dispatch(sale_id);
CREATE INDEX idx_dispatch_status_date ON t_log_dispatch(status, date);

-- 7. Expense & Bank Transaction indexes
CREATE INDEX idx_expense_date_cat ON t_fin_expense(date, category);
CREATE INDEX idx_bank_date_mode ON t_fin_bank(date, mode);

-- 8. Production PPD / PPM indexes
CREATE INDEX idx_ppd_date_shift ON t_mfg_ppd(date, shift);
CREATE INDEX idx_ppm_year_month ON t_mfg_ppm(year, month);

-- 9. Vendor & Inventory indexes
CREATE INDEX idx_vendor_name ON t_sup_vendor(vendor_name);
CREATE INDEX idx_inventory_crate_mat ON t_inv_inventory(crate_type, material_type);
