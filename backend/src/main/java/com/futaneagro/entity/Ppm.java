package com.futaneagro.entity;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "PPM")
@SQLDelete(sql = "UPDATE PPM SET is_deleted = true, deleted_date = CURRENT_DATE() WHERE ppm_id = ?")
@Where(clause = "is_deleted = false")
public class Ppm {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
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

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Column(name = "deleted_by", length = 100)
    private String deletedBy;

    @Column(name = "deleted_date")
    private LocalDate deletedDate;

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
