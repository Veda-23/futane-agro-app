--liquibase formatted sql
--changeset futaneagro:03-custom-fields-indexes splitStatements:true endDelimiter:;

-- Custom field indexes for high performance querying
CREATE INDEX IF NOT EXISTS idx_custom_field_def_entity ON t_sys_custom_field_def(entity_name, is_active);
CREATE INDEX IF NOT EXISTS idx_custom_field_val_entity_record ON t_sys_custom_field_val(entity_name, entity_record_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_val_field_id ON t_sys_custom_field_val(field_def_id);
