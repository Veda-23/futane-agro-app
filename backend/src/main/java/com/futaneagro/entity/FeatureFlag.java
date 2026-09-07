package com.futaneagro.entity;

import javax.persistence.*;

@Entity
@Table(name = "t_sys_feature_flags")
public class FeatureFlag extends BaseEntity {

    @Column(name = "module_key", nullable = false, unique = true, length = 50)
    private String moduleKey;

    @Column(name = "module_name", nullable = false, length = 100)
    private String moduleName;

    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled = true;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "icon", length = 50)
    private String icon;

    public FeatureFlag() {}

    public FeatureFlag(String moduleKey, String moduleName, String category, Boolean enabled, String description, String icon) {
        this.moduleKey = moduleKey;
        this.moduleName = moduleName;
        this.category = category;
        this.enabled = enabled;
        this.description = description;
        this.icon = icon;
    }

    public String getModuleKey() {
        return moduleKey;
    }

    public void setModuleKey(String moduleKey) {
        this.moduleKey = moduleKey;
    }

    public String getModuleName() {
        return moduleName;
    }

    public void setModuleName(String moduleName) {
        this.moduleName = moduleName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }
}
