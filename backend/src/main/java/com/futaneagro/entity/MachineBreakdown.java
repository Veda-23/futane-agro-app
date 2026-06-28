package com.futaneagro.entity;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "Machine_Breakdown", indexes = {
    @Index(name = "idx_machine_breakdown_date_del", columnList = "date, is_deleted"),
    @Index(name = "idx_machine_breakdown_machine", columnList = "machine_id")
})
@SQLDelete(sql = "UPDATE Machine_Breakdown SET is_deleted = true, deleted_date = CURRENT_DATE() WHERE breakdown_id = ?")
@Where(clause = "is_deleted = false")
public class MachineBreakdown {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "breakdown_id")
    private Integer breakdownId;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @ManyToOne
    @JoinColumn(name = "machine_id", nullable = false)
    private MachineMaster machine;

    @Column(name = "issue", nullable = false, length = 255)
    private String issue;

    @Column(name = "resolved_by", length = 100)
    private String resolvedBy;

    @Column(name = "downtime")
    private Integer downtime; // in minutes

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Column(name = "deleted_by", length = 100)
    private String deletedBy;

    @Column(name = "deleted_date")
    private LocalDate deletedDate;

    public MachineBreakdown() {}

    public Integer getBreakdownId() {
        return breakdownId;
    }

    public void setBreakdownId(Integer breakdownId) {
        this.breakdownId = breakdownId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public MachineMaster getMachine() {
        return machine;
    }

    public void setMachine(MachineMaster machine) {
        this.machine = machine;
    }

    public String getIssue() {
        return issue;
    }

    public void setIssue(String issue) {
        this.issue = issue;
    }

    public String getResolvedBy() {
        return resolvedBy;
    }

    public void setResolvedBy(String resolvedBy) {
        this.resolvedBy = resolvedBy;
    }

    public Integer getDowntime() {
        return downtime;
    }

    public void setDowntime(Integer downtime) {
        this.downtime = downtime;
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
