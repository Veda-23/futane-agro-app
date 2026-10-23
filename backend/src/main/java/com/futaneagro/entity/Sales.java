package com.futaneagro.entity;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import javax.persistence.FetchType;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

/**
 * Commercial Wholesale Sales Order & Tax Ledger Entity (`t_sal_sales`).
 *
 * Financial & Statutory Tax Invariants:
 * - High-Precision Currency: Employs `BigDecimal` with `ROUND_HALF_UP` rounding to avoid IEEE 754 floating-point errors.
 * - Server-Side Automatic Tax Computation: `@PrePersist` and `@PreUpdate` lifecycle hooks execute `calculateTotals()`:
 *     - Gross Subtotal = `rate * quantity`
 *     - Intra-State Tax (MH): Split equally into CGST (`rate * gstRate / 200`) and SGST (`cgst`).
 *     - Total Invoice Value = `Gross + CGST + SGST`.
 *     - Net Outstanding Due: Strictly computed as `totalAmount - paid`.
 * - Entity Relationships: LAZY-loaded relationship to Party.
 * - Soft-Deletion: Non-destructive archival via `@SQLDelete` and `@Where(clause = "is_active = true AND is_deleted = false")`.
 */
@Entity
@Table(name = "t_sal_sales", indexes = {
    @Index(name = "idx_sales_date", columnList = "date"),
    @Index(name = "idx_sales_party", columnList = "party_id"),
    @Index(name = "idx_sales_active_del", columnList = "is_active, is_deleted")
})
@Where(clause = "is_active = true AND is_deleted = false")
@SQLDelete(sql = "UPDATE t_sal_sales SET is_deleted = true, is_active = false, deleted_date = NOW() WHERE id = ?")
@JsonIgnoreProperties(value = {"hibernateLazyInitializer", "handler"}, ignoreUnknown = true)
public class Sales extends BaseEntity {
    @Column(name = "sale_id")
    private Integer saleId;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "party_id", nullable = false)
    private Party party;

    @Column(name = "crate_type", nullable = false, length = 100)
    private String crateType;

    @Column(name = "crate_material", nullable = false, length = 100)
    private String crateMaterial;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "rate", nullable = false)
    private BigDecimal rate;

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "paid", nullable = false)
    private BigDecimal paid = BigDecimal.ZERO;

    @Column(name = "remaining", nullable = false)
    private BigDecimal remaining = BigDecimal.ZERO;

    @Column(name = "hsn_code", length = 50)
    private String hsnCode;

    @Column(name = "gst_rate")
    private BigDecimal gstRate = BigDecimal.valueOf(18.00); // e.g. 18.00%

    @Column(name = "cgst")
    private BigDecimal cgst = BigDecimal.ZERO;

    @Column(name = "sgst")
    private BigDecimal sgst = BigDecimal.ZERO;

    @Column(name = "invoice_copy_path", length = 255)
    private String invoiceCopyPath;

    @Column(name = "delivery_challan_path", length = 255)
    private String deliveryChallanPath;
    public Sales() {}

    @PrePersist
    @PreUpdate
    public void calculateTotals() {
        if (quantity != null && rate != null) {
            BigDecimal gross = rate.multiply(BigDecimal.valueOf(quantity));
            BigDecimal taxRate = (gstRate != null) ? gstRate : BigDecimal.valueOf(18.00);
            
            // CGST = gross * (gstRate / 2) / 100 = gross * gstRate / 200
            this.cgst = gross.multiply(taxRate).divide(BigDecimal.valueOf(200), 2, RoundingMode.HALF_UP);
            this.sgst = this.cgst; // CGST = SGST
            
            this.totalAmount = gross.add(this.cgst).add(this.sgst);
        } else {
            this.totalAmount = BigDecimal.ZERO;
            this.cgst = BigDecimal.ZERO;
            this.sgst = BigDecimal.ZERO;
        }
        
        if (this.paid == null) {
            this.paid = BigDecimal.ZERO;
        }
        this.remaining = this.totalAmount.subtract(this.paid);
    }

    public Integer getSaleId() {
        return saleId;
    }

    public void setSaleId(Integer saleId) {
        this.saleId = saleId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public Party getParty() {
        return party;
    }

    public void setParty(Party party) {
        this.party = party;
    }

    public String getCrateType() {
        return crateType;
    }

    public void setCrateType(String crateType) {
        this.crateType = crateType;
    }

    public String getCrateMaterial() {
        return crateMaterial;
    }

    public void setCrateMaterial(String crateMaterial) {
        this.crateMaterial = crateMaterial;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getRate() {
        return rate;
    }

    public void setRate(BigDecimal rate) {
        this.rate = rate;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getPaid() {
        return paid;
    }

    public void setPaid(BigDecimal paid) {
        this.paid = paid;
    }

    public BigDecimal getRemaining() {
        return remaining;
    }

    public void setRemaining(BigDecimal remaining) {
        this.remaining = remaining;
    }

    public String getHsnCode() {
        return hsnCode;
    }

    public void setHsnCode(String hsnCode) {
        this.hsnCode = hsnCode;
    }

    public BigDecimal getGstRate() {
        return gstRate;
    }

    public void setGstRate(BigDecimal gstRate) {
        this.gstRate = gstRate;
    }

    public BigDecimal getCgst() {
        return cgst;
    }

    public void setCgst(BigDecimal cgst) {
        this.cgst = cgst;
    }

    public BigDecimal getSgst() {
        return sgst;
    }

    public void setSgst(BigDecimal sgst) {
        this.sgst = sgst;
    }

    public String getInvoiceCopyPath() {
        return invoiceCopyPath;
    }

    public void setInvoiceCopyPath(String invoiceCopyPath) {
        this.invoiceCopyPath = invoiceCopyPath;
    }

    public String getDeliveryChallanPath() {
        return deliveryChallanPath;
    }

    public void setDeliveryChallanPath(String deliveryChallanPath) {
        this.deliveryChallanPath = deliveryChallanPath;
    }}
