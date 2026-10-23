package com.futaneagro.entity;

import java.time.LocalDateTime;

import java.time.LocalDateTime;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import java.time.LocalDate;

/**
 * <h1>MachineMaster Entity (Plant Machinery & Injection Molding Asset Catalog)</h1>
 * <p>
 * Maps to table {@code t_prd_machine_master}. Catalogs the injection molding machinery assets at the factory.
 * Tracks machine identification codes, hourly crate output throughput capacity (e.g. 600 crates/hr),
 * manufacturer, commissioning date, warranty lifecycle, and operational status ({@code Running}, {@code Maintenance}, {@code Stopped}).
 * </p>
 *
 * <h3>Key Plant Operations Invariants:</h3>
 * <ul>
 *   <li><b>Unique Identity:</b> Enforces a unique constraint on {@code machine_name}.</li>
 *   <li><b>Throughput Fallback:</b> Default capacity fallback is configured to 600 units/hour.</li>
 *   <li><b>Breakdown Tracking:</b> Referenced by {@link MachineBreakdown} to audit equipment downtime.</li>
 * </ul>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Entity
@Table(name = "t_prd_machine_master", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"machine_name"})
})
@Where(clause = "is_active = true AND is_deleted = false")
@SQLDelete(sql = "UPDATE t_prd_machine_master SET is_deleted = true, is_active = false, deleted_date = NOW() WHERE id = ?")
@com.fasterxml.jackson.annotation.JsonIgnoreProperties(value = {"hibernateLazyInitializer", "handler"}, ignoreUnknown = true)
public class MachineMaster extends BaseEntity {
    @Column(name = "machine_id")
    private Integer machineId;

    @Column(name = "machine_name", nullable = false, length = 100)
    private String machineName;

    @Column(name = "manufacturer", length = 100)
    private String manufacturer;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "warranty_date")
    private LocalDate warrantyDate;

    @Column(name = "machine_code", length = 50)
    private String machineCode;

    @Column(name = "capacity_per_hour")
    private Integer capacityPerHour;

    @Column(name = "installed_date")
    private LocalDate installedDate;

    @Column(name = "status", nullable = false, length = 50)
    private String status = "Running"; // Running, Maintenance, Stopped

    public MachineMaster() {}

    public Integer getMachineId() {
        return machineId;
    }

    public void setMachineId(Integer machineId) {
        this.machineId = machineId;
    }

    public String getMachineCode() {
        return machineCode != null ? machineCode : (machineId != null ? "IMM-" + String.format("%03d", machineId) : (getId() != null ? "IMM-" + getId().substring(0, Math.min(4, getId().length())) : "IMM-001"));
    }

    public void setMachineCode(String machineCode) {
        this.machineCode = machineCode;
    }

    public Integer getCapacityPerHour() {
        return capacityPerHour != null ? capacityPerHour : 600;
    }

    public void setCapacityPerHour(Integer capacityPerHour) {
        this.capacityPerHour = capacityPerHour;
    }

    public LocalDate getInstalledDate() {
        return installedDate != null ? installedDate : purchaseDate;
    }

    public void setInstalledDate(LocalDate installedDate) {
        this.installedDate = installedDate;
        if (this.purchaseDate == null) {
            this.purchaseDate = installedDate;
        }
    }

    public String getMachineName() {
        return machineName;
    }

    public void setMachineName(String machineName) {
        this.machineName = machineName;
    }

    public String getManufacturer() {
        return manufacturer;
    }

    public void setManufacturer(String manufacturer) {
        this.manufacturer = manufacturer;
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(LocalDate purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public LocalDate getWarrantyDate() {
        return warrantyDate;
    }

    public void setWarrantyDate(LocalDate warrantyDate) {
        this.warrantyDate = warrantyDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }}
