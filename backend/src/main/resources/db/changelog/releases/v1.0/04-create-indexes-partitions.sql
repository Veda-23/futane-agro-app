-- liquibase formatted sql
-- changeset admin:04-create-indexes-partitions

-- Foreign Key Indexes for Performance
CREATE INDEX idx_hr_employee_user ON t_hr_employee(user_id);
CREATE INDEX idx_sal_sales_party ON t_sal_sales(party_id);
CREATE INDEX idx_log_dispatch_sales ON t_log_dispatch(sales_id);
CREATE INDEX idx_log_dispatch_driver ON t_log_dispatch(driver_id);

-- Soft Delete Indexes
CREATE INDEX idx_hr_employee_active ON t_hr_employee(is_active);
CREATE INDEX idx_crm_party_active ON t_crm_party(is_active);
CREATE INDEX idx_sal_sales_active ON t_sal_sales(is_active);
CREATE INDEX idx_log_dispatch_active ON t_log_dispatch(is_active);
CREATE INDEX idx_hr_driver_active ON t_hr_driver(is_active);
CREATE INDEX idx_inv_raw_material_active ON t_inv_raw_material(is_active);
CREATE INDEX idx_prd_machine_master_active ON t_prd_machine_master(is_active);
CREATE INDEX idx_fin_transaction_active ON t_fin_transaction(is_active);

-- Date based Indexes for Reporting / Analytics
CREATE INDEX idx_sal_sales_date ON t_sal_sales(sale_date);
CREATE INDEX idx_fin_transaction_date ON t_fin_transaction(transaction_date);
CREATE INDEX idx_aud_entity_history_date ON t_aud_entity_history(created_at);
