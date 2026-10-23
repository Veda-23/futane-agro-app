package com.futaneagro.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import java.time.LocalDate;

/**
 * <h1>Driver Entity (Logistics Driver Master)</h1>
 * <p>
 * Maps to table {@code t_hr_driver}. Represents internal plant drivers and third-party commercial vehicle operators.
 * Tracks driver names, contact mobile numbers, Indian Regional Transport Office (RTO) driving license numbers, and residential addresses.
 * </p>
 *
 * <h3>Key Invariants:</h3>
 * <ul>
 *   <li><b>Audit & Soft Deletion:</b> Extends {@link BaseEntity} with UUID identifier and optimistic concurrency.
 *       Soft deleted via {@code @SQLDelete} to preserve foreign key historical references in transport manifests.</li>
 *   <li><b>Logistics Relation:</b> Referenced by {@link Transport} logistics entries.</li>
 * </ul>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Entity
@Table(name = "t_hr_driver")
@Where(clause = "is_active = true AND is_deleted = false")
@SQLDelete(sql = "UPDATE t_hr_driver SET is_deleted = true, is_active = false, deleted_date = NOW() WHERE id = ?")
@com.fasterxml.jackson.annotation.JsonIgnoreProperties(value = {"hibernateLazyInitializer", "handler"}, ignoreUnknown = true)
public class Driver extends BaseEntity {
    @Column(name = "driver_id")
    private Integer driverId;

    @Column(name = "driver_name", nullable = false, length = 100)
    private String driverName;

    @Column(name = "mobile", length = 20)
    private String mobile;

    @Column(name = "license_number", length = 50)
    private String licenseNumber;

    @Column(name = "address", length = 255)
    private String address;
    public Driver() {}

    public Integer getDriverId() {
        return driverId;
    }

    public void setDriverId(Integer driverId) {
        this.driverId = driverId;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public String getLicenseNumber() {
        return licenseNumber;
    }

    public void setLicenseNumber(String licenseNumber) {
        this.licenseNumber = licenseNumber;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }}
