package com.futaneagro.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import javax.persistence.FetchType;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * <h1>RawMaterial Entity (Polymer Granules & Resin Inward Invoicing)</h1>
 * <p>
 * Maps to table {@code t_inv_raw_material}. Records purchases and weighbridge inward arrivals of High-Density
 * Polyethylene (HDPE), Polypropylene (PP), masterbatches, and regrind plastics from suppliers.
 * </p>
 *
 * <h3>Key Calculation & Compliance Invariants:</h3>
 * <ul>
 *   <li><b>Valuation Formula:</b> {@code amount = weight * rate}. Synchronized automatically via
 *       {@link #calculateAmount()} on {@code @PrePersist} and {@code @PreUpdate}.</li>
 *   <li><b>Vendor Ledger:</b> Mandatory {@code @ManyToOne} association with {@link Vendor}.</li>
 *   <li><b>Statutory Documents:</b> Stores storage references to supplier Tax Invoices and weighbridge slips.</li>
 * </ul>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
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

    /**
     * Calculates the raw material purchase total valuation prior to persistence or update.
     * <p>Formula: {@code amount = weight * rate}</p>
     */
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
