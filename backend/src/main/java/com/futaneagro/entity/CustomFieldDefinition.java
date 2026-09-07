package com.futaneagro.entity;

import javax.persistence.*;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "t_sys_custom_field_def")
@Where(clause = "is_active = true")
public class CustomFieldDefinition extends BaseEntity {

    @Column(name = "entity_name", nullable = false, length = 50)
    private String entityName; // PARTIES, VENDORS, EMPLOYEES, MACHINES

    @Column(name = "field_key", nullable = false, length = 50)
    private String fieldKey;

    @Column(name = "field_label", nullable = false, length = 100)
    private String fieldLabel;

    @Column(name = "field_type", nullable = false, length = 30)
    private String fieldType; // TEXT, NUMBER, DATE, SELECT, CHECKBOX

    @Column(name = "options_json", columnDefinition = "TEXT")
    private String optionsJson; // Comma-separated or JSON list for SELECT type

    @Column(name = "is_required")
    private Boolean isRequired = false;

    @Column(name = "default_value", length = 255)
    private String defaultValue;

    public CustomFieldDefinition() {}

    public CustomFieldDefinition(String entityName, String fieldKey, String fieldLabel, String fieldType, String optionsJson, Boolean isRequired) {
        this.entityName = entityName;
        this.fieldKey = fieldKey;
        this.fieldLabel = fieldLabel;
        this.fieldType = fieldType;
        this.optionsJson = optionsJson;
        this.isRequired = isRequired;
    }

    public String getEntityName() {
        return entityName;
    }

    public void setEntityName(String entityName) {
        this.entityName = entityName;
    }

    public String getFieldKey() {
        return fieldKey;
    }

    public void setFieldKey(String fieldKey) {
        this.fieldKey = fieldKey;
    }

    public String getFieldLabel() {
        return fieldLabel;
    }

    public void setFieldLabel(String fieldLabel) {
        this.fieldLabel = fieldLabel;
    }

    public String getFieldType() {
        return fieldType;
    }

    public void setFieldType(String fieldType) {
        this.fieldType = fieldType;
    }

    public String getOptionsJson() {
        return optionsJson;
    }

    public void setOptionsJson(String optionsJson) {
        this.optionsJson = optionsJson;
    }

    public Boolean getIsRequired() {
        return isRequired;
    }

    public void setIsRequired(Boolean isRequired) {
        this.isRequired = isRequired;
    }

    public String getDefaultValue() {
        return defaultValue;
    }

    public void setDefaultValue(String defaultValue) {
        this.defaultValue = defaultValue;
    }
}
