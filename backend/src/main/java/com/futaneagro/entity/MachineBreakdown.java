package com.futaneagro.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import javax.persistence.FetchType;
import java.time.LocalDate;

/**
 * <h1>MachineBreakdown Entity (Unscheduled Plant Downtime & Maintenance Log)</h1>
 * <p>
 * Maps to table {@code t_prd_breakdown}. Logs mechanical faults, electrical outages, hydraulic issues,
 * and scheduled tooling changeovers across injection molding lines.
 * </p>
 *
 * <h3>Key Metrics:</h3>
 * <ul>
 *   <li><b>Downtime Duration:</b> Tracks total idle production time in minutes ({@code downtime}).</li>
 *   <li><b>Resolution Accountability:</b> Captures the maintenance engineer or technician identity ({@code resolvedBy}).</li>
 *   <li><b>Machine Master Link:</b> {@code @ManyToOne} association with {@link MachineMaster}.</li>
 * </ul>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Entity
@Table(name = "t_prd_breakdown")
@Where(clause = "is_active = true AND is_deleted = false")
@SQLDelete(sql = "UPDATE t_prd_breakdown SET is_deleted = true, is_active = false, deleted_date = NOW() WHERE id = ?")
public class MachineBreakdown extends BaseEntity {
    @Column(name = "breakdown_id")
    private Integer breakdownId;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "machine_id", nullable = false)
    private MachineMaster machine;

    @Column(name = "issue", nullable = false, length = 255)
    private String issue;

    @Column(name = "resolved_by", length = 100)
    private String resolvedBy;

    @Column(name = "downtime")
    private Integer downtime; // in minutes
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
    }}
