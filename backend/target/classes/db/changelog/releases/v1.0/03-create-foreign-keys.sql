-- liquibase formatted sql
-- changeset admin:03-create-foreign-keys

-- HR & Auth
ALTER TABLE t_hr_employee
    ADD CONSTRAINT fk_hr_employee_user
    FOREIGN KEY (user_id) REFERENCES t_core_user(id) ON DELETE SET NULL;

-- Sales & CRM
ALTER TABLE t_sal_sales
    ADD CONSTRAINT fk_sal_sales_party
    FOREIGN KEY (party_id) REFERENCES t_crm_party(id) ON DELETE RESTRICT;

-- Logistics
ALTER TABLE t_log_dispatch
    ADD CONSTRAINT fk_log_dispatch_sales
    FOREIGN KEY (sale_id) REFERENCES t_sal_sales(id) ON DELETE RESTRICT;

-- Audit Tracking (Applies to all tables)
ALTER TABLE t_hr_employee ADD CONSTRAINT fk_hr_employee_created_by FOREIGN KEY (created_by) REFERENCES t_core_user(id) ON DELETE SET NULL;
ALTER TABLE t_hr_employee ADD CONSTRAINT fk_hr_employee_updated_by FOREIGN KEY (updated_by) REFERENCES t_core_user(id) ON DELETE SET NULL;

ALTER TABLE t_crm_party ADD CONSTRAINT fk_crm_party_created_by FOREIGN KEY (created_by) REFERENCES t_core_user(id) ON DELETE SET NULL;
ALTER TABLE t_crm_party ADD CONSTRAINT fk_crm_party_updated_by FOREIGN KEY (updated_by) REFERENCES t_core_user(id) ON DELETE SET NULL;

ALTER TABLE t_sal_sales ADD CONSTRAINT fk_sal_sales_created_by FOREIGN KEY (created_by) REFERENCES t_core_user(id) ON DELETE SET NULL;
ALTER TABLE t_sal_sales ADD CONSTRAINT fk_sal_sales_updated_by FOREIGN KEY (updated_by) REFERENCES t_core_user(id) ON DELETE SET NULL;

ALTER TABLE t_log_dispatch ADD CONSTRAINT fk_log_dispatch_created_by FOREIGN KEY (created_by) REFERENCES t_core_user(id) ON DELETE SET NULL;
ALTER TABLE t_log_dispatch ADD CONSTRAINT fk_log_dispatch_updated_by FOREIGN KEY (updated_by) REFERENCES t_core_user(id) ON DELETE SET NULL;

ALTER TABLE t_hr_driver ADD CONSTRAINT fk_hr_driver_created_by FOREIGN KEY (created_by) REFERENCES t_core_user(id) ON DELETE SET NULL;
ALTER TABLE t_hr_driver ADD CONSTRAINT fk_hr_driver_updated_by FOREIGN KEY (updated_by) REFERENCES t_core_user(id) ON DELETE SET NULL;

ALTER TABLE t_inv_raw_material ADD CONSTRAINT fk_inv_raw_material_created_by FOREIGN KEY (created_by) REFERENCES t_core_user(id) ON DELETE SET NULL;
ALTER TABLE t_inv_raw_material ADD CONSTRAINT fk_inv_raw_material_updated_by FOREIGN KEY (updated_by) REFERENCES t_core_user(id) ON DELETE SET NULL;

ALTER TABLE t_prd_machine_master ADD CONSTRAINT fk_prd_machine_master_created_by FOREIGN KEY (created_by) REFERENCES t_core_user(id) ON DELETE SET NULL;
ALTER TABLE t_prd_machine_master ADD CONSTRAINT fk_prd_machine_master_updated_by FOREIGN KEY (updated_by) REFERENCES t_core_user(id) ON DELETE SET NULL;

ALTER TABLE t_fin_transaction ADD CONSTRAINT fk_fin_transaction_created_by FOREIGN KEY (created_by) REFERENCES t_core_user(id) ON DELETE SET NULL;
ALTER TABLE t_fin_transaction ADD CONSTRAINT fk_fin_transaction_updated_by FOREIGN KEY (updated_by) REFERENCES t_core_user(id) ON DELETE SET NULL;
