package com.futaneagro.entity;

import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;

@Entity
@Table(name = "t_branches")
@SQLDelete(sql = "UPDATE t_branches SET is_deleted = true, is_active = false, deleted_at = NOW() WHERE id = ?")
@Where(clause = "is_deleted = false")
public class Branch extends BaseEntity {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private String id;

    @Column(name = "branch_name", nullable = false)
    private String branchName;

    @Column(name = "branch_code", unique = true, nullable = false)
    private String branchCode;

    @Column(name = "location")
    private String location;

    @Column(name = "is_main_plant")
    private Boolean isMainPlant = false;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public Boolean getIsMainPlant() { return isMainPlant; }
    public void setIsMainPlant(Boolean isMainPlant) { this.isMainPlant = isMainPlant; }
}
