package com.futaneagro.entity;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;

/**
 * <h1>Branch Entity (Multi-Location Plant & Depot Network)</h1>
 * <p>
 * Maps to table {@code t_branches}. Represents physical manufacturing facilities, satellite distribution depots,
 * and regional sales offices.
 * </p>
 *
 * <h3>Key Features:</h3>
 * <ul>
 *   <li><b>Main Plant Designation:</b> {@code isMainPlant} identifies the primary manufacturing unit hosting production lines.</li>
 *   <li><b>Inventory Inter-Transfer:</b> Serves as source or destination origin in {@link StockTransfer} movements.</li>
 * </ul>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Entity
@Table(name = "t_branches")
@SQLDelete(sql = "UPDATE t_branches SET is_deleted = true, is_active = false, deleted_date = NOW() WHERE id = ?")
@Where(clause = "is_deleted = false")
public class Branch extends BaseEntity {

    @Column(name = "branch_name", nullable = false)
    private String branchName;

    @Column(name = "branch_code", unique = true, nullable = false)
    private String branchCode;

    @Column(name = "location")
    private String location;

    @Column(name = "is_main_plant")
    private Boolean isMainPlant = false;

    // Getters and Setters
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public Boolean getIsMainPlant() { return isMainPlant; }
    public void setIsMainPlant(Boolean isMainPlant) { this.isMainPlant = isMainPlant; }
}
