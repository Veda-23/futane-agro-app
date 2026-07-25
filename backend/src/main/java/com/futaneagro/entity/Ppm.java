package com.futaneagro.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "t_prd_ppm")
@Where(clause = "is_active = true")
@SQLDelete(sql = "UPDATE t_prd_ppm SET is_deleted = true, deleted_date = CURRENT_DATE() WHERE ppm_id = ?")
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
