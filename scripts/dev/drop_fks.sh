#!/bin/bash
mysql -uroot -pVedant futane_agro_prod << 'EOF'
-- Drop audit FK constraints that block saves (created_by/updated_by not populated by app)
ALTER TABLE t_crm_party DROP FOREIGN KEY fk_crm_party_created_by;
ALTER TABLE t_crm_party DROP FOREIGN KEY fk_crm_party_updated_by;
ALTER TABLE t_sal_sales DROP FOREIGN KEY fk_sal_sales_created_by;
ALTER TABLE t_sal_sales DROP FOREIGN KEY fk_sal_sales_updated_by;
ALTER TABLE t_hr_employee DROP FOREIGN KEY fk_hr_employee_created_by;
ALTER TABLE t_hr_employee DROP FOREIGN KEY fk_hr_employee_updated_by;
ALTER TABLE t_fin_payment DROP FOREIGN KEY FKjxt3p8h94kg20ffptnmmlbbsk;

-- Also fix remaining nullable fields
ALTER TABLE t_crm_party MODIFY created_date DATE NULL;

-- Check vendor and expense FKs too
SELECT TABLE_NAME,CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA='futane_agro_prod' AND CONSTRAINT_TYPE='FOREIGN KEY';

SELECT 'FK constraints dropped' AS status;
EOF
