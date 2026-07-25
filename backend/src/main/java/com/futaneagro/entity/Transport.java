package com.futaneagro.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import javax.persistence.FetchType;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "t_log_transport")
@Where(clause = "is_active = true")
@SQLDelete(sql = "UPDATE t_log_transport SET is_deleted = true, deleted_date = CURRENT_DATE() WHERE transport_id = ?")
public class Transport extends BaseEntity {
    @Column(name = "transport_id")
    private Integer transportId;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "truck_number", nullable = false, length = 50)
    private String truckNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    @Column(name = "rent", nullable = false)
    private BigDecimal rent;

    @Column(name = "advance", nullable = false)
    private BigDecimal advance = BigDecimal.ZERO;

    @Column(name = "remaining", nullable = false)
    private BigDecimal remaining = BigDecimal.ZERO;

    @Column(name = "truck_photo_path", length = 255)
    private String truckPhotoPath;

    @Column(name = "driver_license_path", length = 255)
    private String driverLicensePath;
    public Transport() {}

    @PrePersist
    @PreUpdate
    public void calculateRemaining() {
        if (rent != null) {
            BigDecimal adv = (advance != null) ? advance : BigDecimal.ZERO;
            this.remaining = rent.subtract(adv);
        } else {
            this.remaining = BigDecimal.ZERO;
        }
    }

    public Integer getTransportId() {
        return transportId;
    }

    public void setTransportId(Integer transportId) {
        this.transportId = transportId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getTruckNumber() {
        return truckNumber;
    }

    public void setTruckNumber(String truckNumber) {
        this.truckNumber = truckNumber;
    }

    public Driver getDriver() {
        return driver;
    }

    public void setDriver(Driver driver) {
        this.driver = driver;
    }

    public BigDecimal getRent() {
        return rent;
    }

    public void setRent(BigDecimal rent) {
        this.rent = rent;
    }

    public BigDecimal getAdvance() {
        return advance;
    }

    public void setAdvance(BigDecimal advance) {
        this.advance = advance;
    }

    public BigDecimal getRemaining() {
        return remaining;
    }

    public void setRemaining(BigDecimal remaining) {
        this.remaining = remaining;
    }

    public String getTruckPhotoPath() {
        return truckPhotoPath;
    }

    public void setTruckPhotoPath(String truckPhotoPath) {
        this.truckPhotoPath = truckPhotoPath;
    }

    public String getDriverLicensePath() {
        return driverLicensePath;
    }

    public void setDriverLicensePath(String driverLicensePath) {
        this.driverLicensePath = driverLicensePath;
    }}
