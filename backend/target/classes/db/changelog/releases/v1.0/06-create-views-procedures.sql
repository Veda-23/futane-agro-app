-- liquibase formatted sql
-- changeset admin:06-create-views-procedures runOnChange:true failOnError:false

-- L1 Business Views (Filters out soft-deleted records so the backend never sees them)
CREATE OR REPLACE VIEW v_biz_sales AS
SELECT id, party_id, total_amount, date as sale_date, created_at, created_by, updated_at, updated_by, version
FROM t_sal_sales
WHERE is_active = TRUE;

CREATE OR REPLACE VIEW v_biz_employee AS
SELECT id, user_id, emp_name, emp_contact, designation, joining_date, created_at, created_by, updated_at, updated_by, version
FROM t_hr_employee
WHERE is_active = TRUE;

CREATE OR REPLACE VIEW v_biz_party AS
SELECT id, party_name, party_contact as mobile, email, gst_number as gst_no, party_address as address, created_at, created_by, updated_at, updated_by, version
FROM t_crm_party
WHERE is_active = TRUE;

-- L2 Reporting Views (Denormalized read-only for JasperReports / Excel Exports)
CREATE OR REPLACE VIEW v_rpt_daily_sales AS
SELECT 
    s.date as sale_date,
    p.party_name,
    COUNT(s.id) as total_invoices,
    SUM(s.total_amount) as total_revenue
FROM t_sal_sales s
JOIN t_crm_party p ON s.party_id = p.id
WHERE s.is_active = TRUE AND p.is_active = TRUE
GROUP BY s.date, p.party_name;

-- L3 Analytics Views (Heavy aggregations for Dashboards)
CREATE OR REPLACE VIEW v_anl_monthly_revenue AS
SELECT 
    YEAR(date) as sales_year,
    MONTH(date) as sales_month,
    SUM(total_amount) as total_revenue
FROM t_sal_sales
WHERE is_active = TRUE
GROUP BY YEAR(date), MONTH(date);

-- L4 Monitoring Views (For Grafana custom queries)
CREATE OR REPLACE VIEW v_mon_table_sizes AS
SELECT 
    table_name AS `Table`, 
    round(((data_length + index_length) / 1024 / 1024), 2) `Size in MB` 
FROM information_schema.TABLES 
WHERE table_schema = 'futane_agro_prod';
