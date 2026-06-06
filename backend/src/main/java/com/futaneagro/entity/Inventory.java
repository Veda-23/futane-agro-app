package com.futaneagro.entity;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "Inventory")
@SQLDelete(sql = "UPDATE Inventory SET is_deleted = true, deleted_date = CURRENT_DATE() WHERE inventory_id = ?")
@Where(clause = "is_deleted = false")
public class Inventory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inventory_id")
    private Integer inventoryId;

    @Column(name = "crate_type", nullable = false, length = 100)
    private String crateType;

    @Column(name = "material_type", nullable = false, length = 100)
    private String materialType;

    @Column(name = "opening_stock", nullable = false)
    private Integer openingStock = 0;

    @Column(name = "produced_stock", nullable = false)
    private Integer producedStock = 0;

    @Column(name = "sold_stock", nullable = false)
    private Integer soldStock = 0;

    @Column(name = "current_stock", nullable = false)
    private Integer currentStock = 0;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Column(name = "deleted_by", length = 100)
    private String deletedBy;

    @Column(name = "deleted_date")
    private LocalDate deletedDate;

    public Inventory() {}

    @PrePersist
    @PreUpdate
    public void calculateCurrentStock() {
        if (openingStock == null) openingStock = 0;
        if (producedStock == null) producedStock = 0;
        if (soldStock == null) soldStock = 0;
        this.currentStock = openingStock + producedStock - soldStock;
        this.lastUpdated = LocalDateTime.now();
    }

    public Integer getInventoryId() {
        return inventoryId;
    }

    public void setInventoryId(Integer inventoryId) {
        this.inventoryId = inventoryId;
    }

    public String getCrateType() {
        return crateType;
    }

    public void setCrateType(String crateType) {
        this.crateType = crateType;
    }

    public String getMaterialType() {
        return materialType;
    }

    public void setMaterialType(String materialType) {
        this.materialType = materialType;
    }

    public Integer getOpeningStock() {
        return openingStock;
    }

    public void setOpeningStock(Integer openingStock) {
        this.openingStock = openingStock;
    }

    public Integer getProducedStock() {
        return producedStock;
    }

    public void setProducedStock(Integer producedStock) {
        this.producedStock = producedStock;
    }

    public Integer getSoldStock() {
        return soldStock;
    }

    public void setSoldStock(Integer soldStock) {
        this.soldStock = soldStock;
    }

    public Integer getCurrentStock() {
        return currentStock;
    }

    public void setCurrentStock(Integer currentStock) {
        this.currentStock = currentStock;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
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
