package com.futaneagro.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import javax.persistence.FetchType;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "t_inv_raw_material", indexes = {
    @Index(name = "idx_rm_date", columnList = "date"),
    @Index(name = "idx_rm_vendor", columnList = "vendor_id"),
    @Index(name = "idx_rm_material", columnList = "material_name")
})
@Where(clause = "is_active = true AND is_deleted = false")
@SQLDelete(sql = "UPDATE t_inv_raw_material SET is_deleted = true, is_active = false, deleted_date = NOW() WHERE id = ?")
public class RawMaterial extends BaseEntity {
    @Column(name = "raw_material_id")
    private Integer rawMaterialId;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "material_name", nullable = false, length = 100)
    private String materialName;

    @ManyToOne(fetch = FetchType.LAZY)
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
    }}
