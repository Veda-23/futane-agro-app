package com.futaneagro.entity;

import java.time.LocalDateTime;

import com.futaneagro.security.AttributeEncryptor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "t_crm_vendor", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"vendor_name"}),
    @UniqueConstraint(columnNames = {"mobile"})
})
@Where(clause = "is_active = true AND is_deleted = false")
@SQLDelete(sql = "UPDATE t_crm_vendor SET is_deleted = true, is_active = false, deleted_date = NOW() WHERE id = ?")
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
