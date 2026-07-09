package com.futaneagro.entity;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "Machine_Master", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"machine_name"})
})
@SQLDelete(sql = "UPDATE Machine_Master SET is_deleted = true, deleted_date = CURRENT_DATE() WHERE machine_id = ?")
@Where(clause = "is_deleted = false")
public class MachineMaster extends BaseEntity {
    @Column(name = "machine_id")
    private Integer machineId;

    @Column(name = "machine_name", nullable = false, length = 100)
    private String machineName;

    @Column(name = "manufacturer", length = 100)
    private String manufacturer;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "warranty_date")
    private LocalDate warrantyDate;

    @Column(name = "status", nullable = false, length = 50)
    private String status = "Running"; // Running, Maintenance, Stopped

    @Column(name = "is_deleted")

    @Column(name = "deleted_by", length = 100)

    @Column(name = "deleted_date")

    public MachineMaster() {}

    public Integer getMachineId() {
        return machineId;
    }

    public void setMachineId(Integer machineId) {
        this.machineId = machineId;
    }

    public String getMachineName() {
        return machineName;
    }

    public void setMachineName(String machineName) {
        this.machineName = machineName;
    }

    public String getManufacturer() {
        return manufacturer;
    }

    public void setManufacturer(String manufacturer) {
        this.manufacturer = manufacturer;
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(LocalDate purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public LocalDate getWarrantyDate() {
        return warrantyDate;
    }

    public void setWarrantyDate(LocalDate warrantyDate) {
        this.warrantyDate = warrantyDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(Boolean deleted) {
        isDeleted = deleted;
    }

    public String getDeletedBy() {
        return deletedBy;
    }

    public void setDeletedBy(String deletedBy) {
        this.deletedBy = deletedBy;
    }

    public LocalDate getDeletedDate() {
        return deletedDate;
    }

    public void setDeletedDate(LocalDate deletedDate) {
        this.deletedDate = deletedDate;
    }
}
