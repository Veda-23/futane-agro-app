package com.futaneagro.entity;

import javax.persistence.*;

/**
 * <h1>CustomFieldValue Entity (Dynamic Tenant Custom Attribute Values)</h1>
 * <p>
 * Maps to table {@code t_sys_custom_field_val}. Stores the entity-attribute-value (EAV) mapping
 * linking an entity record (e.g. party UUID) to a {@link CustomFieldDefinition} and its stringified text value.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Entity
@Table(name = "t_sys_custom_field_val", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"field_def_id", "entity_record_id"})
})
public class CustomFieldValue extends BaseEntity {

    @Column(name = "field_def_id", nullable = false, length = 36)
    private String fieldDefId;

    @Column(name = "entity_name", nullable = false, length = 50)
    private String entityName;

    @Column(name = "entity_record_id", nullable = false, length = 100)
    private String entityRecordId;

    @Column(name = "field_value", columnDefinition = "TEXT")
    private String fieldValue;

    public CustomFieldValue() {}

    public CustomFieldValue(String fieldDefId, String entityName, String entityRecordId, String fieldValue) {
        this.fieldDefId = fieldDefId;
        this.entityName = entityName;
        this.entityRecordId = entityRecordId;
        this.fieldValue = fieldValue;
    }

    public String getFieldDefId() {
        return fieldDefId;
    }

    public void setFieldDefId(String fieldDefId) {
        this.fieldDefId = fieldDefId;
    }

    public String getEntityName() {
        return entityName;
    }

    public void setEntityName(String entityName) {
        this.entityName = entityName;
    }

    public String getEntityRecordId() {
        return entityRecordId;
    }

    public void setEntityRecordId(String entityRecordId) {
        this.entityRecordId = entityRecordId;
    }

    public String getFieldValue() {
        return fieldValue;
    }

    public void setFieldValue(String fieldValue) {
        this.fieldValue = fieldValue;
    }
}
