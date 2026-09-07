package com.futaneagro.entity;

import javax.persistence.*;

@Entity
@Table(name = "t_core_role_permissions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"role", "module_key"})
})
public class RolePermission extends BaseEntity {

    @Column(name = "role", nullable = false, length = 50)
    private String role;

    @Column(name = "module_key", nullable = false, length = 50)
    private String moduleKey;

    @Column(name = "module_name", length = 100)
    private String moduleName;

    @Column(name = "can_view")
    private Boolean canView = true;

    @Column(name = "can_create")
    private Boolean canCreate = false;

    @Column(name = "can_edit")
    private Boolean canEdit = false;

    @Column(name = "can_delete")
    private Boolean canDelete = false;

    @Column(name = "can_export")
    private Boolean canExport = false;

    public RolePermission() {}

    public RolePermission(String role, String moduleKey, String moduleName, Boolean canView, Boolean canCreate, Boolean canEdit, Boolean canDelete, Boolean canExport) {
        this.role = role;
        this.moduleKey = moduleKey;
        this.moduleName = moduleName;
        this.canView = canView;
        this.canCreate = canCreate;
        this.canEdit = canEdit;
        this.canDelete = canDelete;
        this.canExport = canExport;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
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

    public Boolean getCanView() {
        return canView;
    }

    public void setCanView(Boolean canView) {
        this.canView = canView;
    }

    public Boolean getCanCreate() {
        return canCreate;
    }

    public void setCanCreate(Boolean canCreate) {
        this.canCreate = canCreate;
    }

    public Boolean getCanEdit() {
        return canEdit;
    }

    public void setCanEdit(Boolean canEdit) {
        this.canEdit = canEdit;
    }

    public Boolean getCanDelete() {
        return canDelete;
    }

    public void setCanDelete(Boolean canDelete) {
        this.canDelete = canDelete;
    }

    public Boolean getCanExport() {
        return canExport;
    }

    public void setCanExport(Boolean canExport) {
        this.canExport = canExport;
    }
}
