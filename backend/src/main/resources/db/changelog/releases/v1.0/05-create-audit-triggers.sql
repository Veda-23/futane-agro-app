-- liquibase formatted sql
-- changeset admin:05-create-audit-triggers runOnChange:true splitStatements:true endDelimiter://

-- Create a procedure to log changes to the audit table (L5)
-- Note: MySQL Triggers don't support dynamic table names easily without a lot of boilerplate,
-- so in a real 10,000 user production system, Debezium (CDC) is often used for L5 audit logs instead of triggers.
-- But for architectural completeness in SQL:

DELIMITER //

CREATE PROCEDURE sp_audit_log(
    IN p_entity_id CHAR(36),
    IN p_entity_name VARCHAR(100),
    IN p_action VARCHAR(20),
    IN p_changed_by CHAR(36),
    IN p_old_payload JSON,
    IN p_new_payload JSON
)
BEGIN
    INSERT INTO t_aud_entity_history (
        id, entity_id, entity_name, action, changed_by, old_payload, new_payload, created_at
    ) VALUES (
        UUID(), p_entity_id, p_entity_name, p_action, p_changed_by, p_old_payload, p_new_payload, NOW()
    );
END//

DELIMITER ;
