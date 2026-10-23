package com.futaneagro.dto;

/**
 * <h1>OrderStatusUpdateRequest (B2B Web Order Fulfillment Transition DTO)</h1>
 * <p>
 * Payload submitted by ERP operations when updating the fulfillment stage of an online customer order
 * (e.g. assigning vehicle details upon dispatch or marking as delivered).
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
public class OrderStatusUpdateRequest {
    private String status;
    private String note;
    private String vehicleNumber;
    private String driverName;
    private String driverMobile;

    public OrderStatusUpdateRequest() {}

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public String getDriverMobile() { return driverMobile; }
    public void setDriverMobile(String driverMobile) { this.driverMobile = driverMobile; }
}
