package com.futaneagro.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import java.time.LocalDate;

/**
 * Monthly Aggregate Production & Utility Power Metric Entity (`t_prd_ppm`).
 *
 * Operational Metrics:
 * - Aggregates monthly finished crate volume (`cratesProduced`) against factory utility consumption.
 * - Tracks total power units consumed (`electricityUnits` in kWh) and electricity utility billing (`electricityBill`).
 * - Used to calculate power efficiency: kWh per crate and energy cost per finished crate.
 */
@Entity
@Table(name = "t_prd_ppm")
@Where(clause = "is_active = true AND is_deleted = false")
@SQLDelete(sql = "UPDATE t_prd_ppm SET is_deleted = true, is_active = false, deleted_date = NOW() WHERE id = ?")
public class Ppm extends BaseEntity {
    @Column(name = "ppm_id")
    private Integer ppmId;

    @Column(name = "month", nullable = false, length = 20)
    private String month;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "crates_produced", nullable = false)
    private Integer cratesProduced;

    @Column(name = "electricity_units", nullable = false)
    private java.math.BigDecimal electricityUnits;

    @Column(name = "electricity_bill", nullable = false)
    private java.math.BigDecimal electricityBill;
    public Ppm() {}

    public Integer getPpmId() {
        return ppmId;
    }

    public void setPpmId(Integer ppmId) {
        this.ppmId = ppmId;
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public Integer getCratesProduced() {
        return cratesProduced;
    }

    public void setCratesProduced(Integer cratesProduced) {
        this.cratesProduced = cratesProduced;
    }

    public java.math.BigDecimal getElectricityUnits() {
        return electricityUnits;
    }

    public void setElectricityUnits(java.math.BigDecimal electricityUnits) {
        this.electricityUnits = electricityUnits;
    }

    public java.math.BigDecimal getElectricityBill() {
        return electricityBill;
    }

    public void setElectricityBill(java.math.BigDecimal electricityBill) {
        this.electricityBill = electricityBill;
    }}
