package com.futaneagro.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import javax.persistence.*;
import javax.persistence.FetchType;
import java.time.LocalDate;

/**
 * <h1>Dispatch Entity (Finished Goods Outward Manifest & Gate Pass)</h1>
 * <p>
 * Maps to table {@code t_log_dispatch}. Records physical gate dispatch events for crates leaving the manufacturing plant.
 * Connects directly to the originating {@link Sales} order, assigning vehicle registration number, driver identity,
 * and dispatch status (e.g. {@code Pending}, {@code In Transit}, {@code Delivered}).
 * </p>
 *
 * <h3>Key Architectural & Performance Invariants:</h3>
 * <ul>
 *   <li><b>Fault-Tolerant Relationship:</b> {@code @ManyToOne} to {@link Sales} utilizes {@code @NotFound(action = NotFoundAction.IGNORE)}
 *       to prevent ORM exceptions if legacy sales records were archived.</li>
 *   <li><b>JSON Serialization Safety:</b> Uses {@code @JsonIgnoreProperties} to prevent circular serialization recursion
 *       between Sales and Dispatch collections.</li>
 *   <li><b>Soft Deletion:</b> Preserves gate pass audit trails with soft deletion.</li>
 * </ul>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Entity
@Table(name = "t_log_dispatch", indexes = {
    @Index(name = "idx_dispatch_date", columnList = "date"),
    @Index(name = "idx_dispatch_sale_id", columnList = "sale_id"),
    @Index(name = "idx_dispatch_vehicle", columnList = "vehicle_number"),
    @Index(name = "idx_dispatch_status", columnList = "status"),
    @Index(name = "idx_dispatch_active_deleted", columnList = "is_active, is_deleted")
})
@Where(clause = "is_active = true AND is_deleted = false")
@SQLDelete(sql = "UPDATE t_log_dispatch SET is_deleted = true, is_active = false, deleted_date = NOW() WHERE id = ?")
@JsonIgnoreProperties(value = {"hibernateLazyInitializer", "handler"}, ignoreUnknown = true)
public class Dispatch extends BaseEntity {
    @Column(name = "dispatch_id")
    private Integer dispatchId;

    @Column(name = "dispatch_number", unique = true, nullable = false, length = 100)
    private String dispatchNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = true)
    @NotFound(action = NotFoundAction.IGNORE)
    @JsonIgnoreProperties(value = {"hibernateLazyInitializer", "handler", "party", "saleItems", "invoices", "dispatches"}, ignoreUnknown = true)
    private Sales sale;

    @Column(name = "vehicle_number", nullable = false, length = 50)
    private String vehicleNumber;

    @Column(name = "driver_name", nullable = false, length = 100)
    private String driverName;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "status", nullable = false, length = 50)
    private String status = "Pending"; // Pending, In Transit, Delivered

    public Dispatch() {}

    public Integer getDispatchId() {
        return dispatchId;
    }

    public void setDispatchId(Integer dispatchId) {
        this.dispatchId = dispatchId;
    }

    public String getDispatchNumber() {
        return dispatchNumber;
    }

    public void setDispatchNumber(String dispatchNumber) {
        this.dispatchNumber = dispatchNumber;
    }

    public Sales getSale() {
        return sale;
    }

    public void setSale(Sales sale) {
        this.sale = sale;
    }

    @JsonProperty("saleId")
    public String getSaleId() {
        try {
            return (sale != null) ? sale.getId() : null;
        } catch (Exception e) {
            return null;
        }
    }

    public String getVehicleNumber() {
        return vehicleNumber;
    }

    public void setVehicleNumber(String vehicleNumber) {
        this.vehicleNumber = vehicleNumber;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
