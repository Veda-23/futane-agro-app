package com.futaneagro.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * <h1>OrderTrackingEvent Entity (Customer Storefront Order Status Timeline)</h1>
 * <p>
 * Maps to table {@code t_ord_tracking_events}. Stores chronological milestone checkpoints for buyer visibility
 * in the customer portal and live tracking dashboard.
 * </p>
 *
 * <h3>Milestone Stages:</h3>
 * <ul>
 *   <li>{@code ORDER_PLACED} - Order created by client or sales agent.</li>
 *   <li>{@code CONFIRMED} - Credit check verified, order approved by accounts.</li>
 *   <li>{@code IN_PRODUCTION} - Molds mounted on injection molding machine; manufacturing underway.</li>
 *   <li>{@code PACKED_INVOICED} - Crates palletized, tax invoice issued.</li>
 *   <li>{@code DISPATCHED} - Gate pass verified, loaded on freight truck with driver details.</li>
 *   <li>{@code DELIVERED} - Proof of delivery signed by client receiving depot.</li>
 * </ul>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Entity
@Table(name = "t_ord_tracking_events")
@Where(clause = "is_active = true AND is_deleted = false")
@SQLDelete(sql = "UPDATE t_ord_tracking_events SET is_deleted = true, is_active = false, deleted_date = NOW() WHERE id = ?")
@JsonIgnoreProperties(value = {"hibernateLazyInitializer", "handler"}, ignoreUnknown = true)
public class OrderTrackingEvent extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnoreProperties({"items", "trackingEvents"})
    private CustomerOrder order;

    @Column(name = "step_key", nullable = false, length = 50)
    private String stepKey; // ORDER_PLACED, CONFIRMED, IN_PRODUCTION, PACKED_INVOICED, DISPATCHED, DELIVERED

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "vehicle_number", length = 50)
    private String vehicleNumber;

    @Column(name = "driver_name", length = 100)
    private String driverName;

    @Column(name = "driver_mobile", length = 25)
    private String driverMobile;

    @Column(name = "event_time", nullable = false)
    private LocalDateTime eventTime = LocalDateTime.now();

    public OrderTrackingEvent() {}

    public OrderTrackingEvent(CustomerOrder order, String stepKey, String title, String description) {
        this.order = order;
        this.stepKey = stepKey;
        this.title = title;
        this.description = description;
        this.eventTime = LocalDateTime.now();
    }

    public CustomerOrder getOrder() { return order; }
    public void setOrder(CustomerOrder order) { this.order = order; }

    public String getStepKey() { return stepKey; }
    public void setStepKey(String stepKey) { this.stepKey = stepKey; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public String getDriverMobile() { return driverMobile; }
    public void setDriverMobile(String driverMobile) { this.driverMobile = driverMobile; }

    public LocalDateTime getEventTime() { return eventTime; }
    public void setEventTime(LocalDateTime eventTime) { this.eventTime = eventTime; }
}
