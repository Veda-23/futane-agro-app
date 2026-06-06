package com.futaneagro.entity;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "Raw_Material")
@SQLDelete(sql = "UPDATE Raw_Material SET is_deleted = true, deleted_date = CURRENT_DATE() WHERE raw_material_id = ?")
@Where(clause = "is_deleted = false")
public class RawMaterial {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "raw_material_id")
    private Integer rawMaterialId;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "material_name", nullable = false, length = 100)
    private String materialName;

    @ManyToOne
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Column(name = "weight", nullable = false)
    private BigDecimal weight;

    @Column(name = "rate", nullable = false)
    private BigDecimal rate;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @Column(name = "purchase_bill_path", length = 255)
    private String purchaseBillPath;

    @Column(name = "weight_slip_path", length = 255)
    private String weightSlipPath;

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Column(name = "deleted_by", length = 100)
    private String deletedBy;

    @Column(name = "deleted_date")
    private LocalDate deletedDate;

    public RawMaterial() {}

    @PrePersist
    @PreUpdate
    public void calculateAmount() {
        if (weight != null && rate != null) {
            this.amount = weight.multiply(rate);
        } else {
            this.amount = BigDecimal.ZERO;
        }
    }

    public Integer getRawMaterialId() {
        return rawMaterialId;
    }

    public void setRawMaterialId(Integer rawMaterialId) {
        this.rawMaterialId = rawMaterialId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getMaterialName() {
        return materialName;
    }

    public void setMaterialName(String materialName) {
        this.materialName = materialName;
    }

    public Vendor getVendor() {
        return vendor;
    }

    public void setVendor(Vendor vendor) {
        this.vendor = vendor;
    }

    public BigDecimal getWeight() {
        return weight;
    }

    public void setWeight(BigDecimal weight) {
        this.weight = weight;
    }

    public BigDecimal getRate() {
        return rate;
    }

    public void setRate(BigDecimal rate) {
        this.rate = rate;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getPurchaseBillPath() {
        return purchaseBillPath;
    }

    public void setPurchaseBillPath(String purchaseBillPath) {
        this.purchaseBillPath = purchaseBillPath;
    }

    public String getWeightSlipPath() {
        return weightSlipPath;
    }

    public void setWeightSlipPath(String weightSlipPath) {
        this.weightSlipPath = weightSlipPath;
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
