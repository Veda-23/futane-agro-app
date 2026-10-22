package com.futaneagro.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import java.time.LocalDate;

/**
 * Daily Manufacturing Production Run (PPD) Entity (`t_prd_ppd`).
 *
 * Operational Metrics:
 * - Records daily injection moulding tallies by machine shift (Morning, Afternoon, Night).
 * - Tracks planned production volume, successful defect-free output, and rejected scrap units.
 * - Indexed on `date`, `crate_type`, and `shift` for high-throughput reporting queries.
 */
@Entity
@Table(name = "t_prd_ppd", indexes = {
    @Index(name = "idx_ppd_date", columnList = "date"),
    @Index(name = "idx_ppd_crate_type", columnList = "crate_type"),
    @Index(name = "idx_ppd_shift", columnList = "shift")
})
@Where(clause = "is_active = true AND is_deleted = false")
@SQLDelete(sql = "UPDATE t_prd_ppd SET is_deleted = true, is_active = false, deleted_date = NOW() WHERE id = ?")
public class Ppd extends BaseEntity {
    @Column(name = "ppd_id")
    private Integer ppdId;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "crate_type", nullable = false, length = 100)
    private String crateType;

    @Column(name = "total_production", nullable = false)
    private Integer totalProduction;

    @Column(name = "successful", nullable = false)
    private Integer successful;

    @Column(name = "rejected", nullable = false)
    private Integer rejected;

    @Column(name = "shift", nullable = false, length = 50)
    private String shift = "Morning Shift"; // Morning Shift, Afternoon Shift, Night Shift

    public Ppd() {}

    public Integer getPpdId() {
        return ppdId;
    }

    public void setPpdId(Integer ppdId) {
        this.ppdId = ppdId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getCrateType() {
        return crateType;
    }

    public void setCrateType(String crateType) {
        this.crateType = crateType;
    }

    public Integer getTotalProduction() {
        return totalProduction;
    }

    public void setTotalProduction(Integer totalProduction) {
        this.totalProduction = totalProduction;
    }

    public Integer getSuccessful() {
        return successful;
    }

    public void setSuccessful(Integer successful) {
        this.successful = successful;
    }

    public Integer getRejected() {
        return rejected;
    }

    public void setRejected(Integer rejected) {
        this.rejected = rejected;
    }

    public String getShift() {
        return shift;
    }

    public void setShift(String shift) {
        this.shift = shift;
    }
}
