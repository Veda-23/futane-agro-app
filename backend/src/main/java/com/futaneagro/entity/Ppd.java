package com.futaneagro.entity;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "PPD")
@SQLDelete(sql = "UPDATE PPD SET is_deleted = true, deleted_date = CURRENT_DATE() WHERE ppd_id = ?")
@Where(clause = "is_deleted = false")
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

    @Column(name = "is_deleted")

    @Column(name = "deleted_by", length = 100)

    @Column(name = "deleted_date")

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
