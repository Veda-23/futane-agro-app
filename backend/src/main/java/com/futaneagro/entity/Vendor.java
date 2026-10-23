package com.futaneagro.entity;

import java.time.LocalDateTime;

import com.futaneagro.security.AttributeEncryptor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import java.time.LocalDate;

/**
 * <h1>Vendor Entity (Supplier Directory & Procurement Master)</h1>
 * <p>
 * Maps to table {@code t_crm_vendor}. Catalogs suppliers providing polymer granules, masterbatches,
 * packaging material, machinery spares, and industrial maintenance services.
 * </p>
 *
 * <h3>Key Security & Business Invariants:</h3>
 * <ul>
 *   <li><b>Data Encryption:</b> The supplier's GSTIN ({@code gstNumber}) is encrypted at rest using AES-256 via
 *       {@link com.futaneagro.security.AttributeEncryptor}.</li>
 *   <li><b>Unique Identity:</b> Enforces unique constraints on supplier name ({@code vendor_name}) and mobile number ({@code mobile}).</li>
 *   <li><b>Procurement Relation:</b> Linked to inward raw material records in {@link RawMaterial}.</li>
 * </ul>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Entity
@Table(name = "t_crm_vendor", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"vendor_name"}),
    @UniqueConstraint(columnNames = {"mobile"})
}, indexes = {
    @Index(name = "idx_vendor_name", columnList = "vendor_name"),
    @Index(name = "idx_vendor_mobile", columnList = "mobile"),
    @Index(name = "idx_vendor_active_deleted", columnList = "is_active, is_deleted")
})
@Where(clause = "is_active = true AND is_deleted = false")
@SQLDelete(sql = "UPDATE t_crm_vendor SET is_deleted = true, is_active = false, deleted_date = NOW() WHERE id = ?")
@com.fasterxml.jackson.annotation.JsonIgnoreProperties(value = {"hibernateLazyInitializer", "handler"}, ignoreUnknown = true)
public class Vendor extends BaseEntity {
    @Column(name = "vendor_id")
    private Integer vendorId;

    @Column(name = "vendor_name", nullable = false, length = 100)
    private String vendorName;

    @Column(name = "mobile", length = 20)
    private String mobile;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "gst_number")
    @Convert(converter = AttributeEncryptor.class)
    private String gstNumber;
    public Vendor() {}

    public Integer getVendorId() {
        return vendorId;
    }

    public void setVendorId(Integer vendorId) {
        this.vendorId = vendorId;
    }

    public String getVendorName() {
        return vendorName;
    }

    public void setVendorName(String vendorName) {
        this.vendorName = vendorName;
    }

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getGstNumber() {
        return gstNumber;
    }

    public void setGstNumber(String gstNumber) {
        this.gstNumber = gstNumber;
    }}
