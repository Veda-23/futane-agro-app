-- liquibase formatted sql
-- changeset admin:01-init-schemas-users

-- Create isolated schemas (MySQL does not support schemas exactly like Postgres, they are synonymous with databases)
-- We will stick to the default database (futane_agro_prod) but create role-based users

-- Create application user
CREATE USER IF NOT EXISTS 'app_user'@'%' IDENTIFIED BY 'AppStrongPassword123!';
GRANT SELECT, INSERT, UPDATE, DELETE ON futane_agro_prod.* TO 'app_user'@'%';

-- Create reporting user
CREATE USER IF NOT EXISTS 'reporting_user'@'%' IDENTIFIED BY 'ReportUser123!';
GRANT SELECT ON futane_agro_prod.* TO 'reporting_user'@'%';

-- Create monitoring user
CREATE USER IF NOT EXISTS 'monitoring_user'@'%' IDENTIFIED BY 'Monitor123!';
GRANT SELECT ON futane_agro_prod.* TO 'monitoring_user'@'%';
-- Grant SHOW DATABASES/PROCESSLIST for monitoring
GRANT PROCESS, SHOW DATABASES ON *.* TO 'monitoring_user'@'%';

FLUSH PRIVILEGES;
