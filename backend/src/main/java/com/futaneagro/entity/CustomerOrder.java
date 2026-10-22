package com.futaneagro.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * <h1>CustomerOrder Entity (B2B E-Commerce & Customer Storefront Order Header)</h1>
 * <p>
 * Maps to table {@code t_ord_customer_orders}. Represents online or storefront purchase orders placed by agricultural clients.
 * Manages the entire lifecycle from placement ({@code NEW_ORDER}) through credit approval ({@code APPROVED}),
 * production scheduling ({@code IN_PRODUCTION}), packing, gate dispatch, and final delivery.
 * </p>
 *
 * <h3>Key Financial & Architectural Invariants:</h3>
 * <ul>
 *   <li><b>Statutory Taxes:</b> Supports CGST and SGST splits based on the statutory GST rate (default 18%).</li>
 *   <li><b>ERP Pipeline Bridge:</b> When approved, links directly to the enterprise billing and fulfillment system
 *       via {@code erpSaleId} and {@code erpDispatchId}.</li>
 *   <li><b>Cascading Composition:</b> Holds cascade-all collections for {@link OrderItem} and {@link OrderTrackingEvent}.</li>
 * </ul>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Entity
@Table(name = "t_ord_customer_orders")
@Where(clause = "is_active = true AND is_deleted = false")
@SQLDelete(sql = "UPDATE t_ord_customer_orders SET is_deleted = true, is_active = false, deleted_date = NOW() WHERE id = ?")
@JsonIgnoreProperties(value = {"hibernateLazyInitializer", "handler"}, ignoreUnknown = true)
public class CustomerOrder extends BaseEntity {

    @Column(name = "order_number", unique = true, nullable = false, length = 60)
    private String orderNumber;

    @Column(name = "customer_name", nullable = false, length = 150)
    private String customerName;

    @Column(name = "customer_mobile", nullable = false, length = 20)
    private String customerMobile;

    @Column(name = "customer_email", length = 150)
    private String customerEmail;

    @Column(name = "company_name", length = 200)
    private String companyName;

    @Column(name = "gst_number", length = 25)
    private String gstNumber;

    @Column(name = "delivery_address", length = 500)
    private String deliveryAddress;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "pincode", length = 15)
    private String pincode;

    @Column(name = "subtotal", nullable = false)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "gst_rate")
    private BigDecimal gstRate = BigDecimal.valueOf(18.00);

    @Column(name = "cgst", nullable = false)
    private BigDecimal cgst = BigDecimal.ZERO;

    @Column(name = "sgst", nullable = false)
    private BigDecimal sgst = BigDecimal.ZERO;

    @Column(name = "freight_charges")
    private BigDecimal freightCharges = BigDecimal.ZERO;

    @Column(name = "grand_total", nullable = false)
    private BigDecimal grandTotal = BigDecimal.ZERO;

    @Column(name = "order_status", nullable = false, length = 50)
    private String orderStatus = "NEW_ORDER"; // NEW_ORDER, APPROVED, IN_PRODUCTION, PACKED, DISPATCHED, DELIVERED, CANCELLED

    @Column(name = "payment_method", length = 50)
    private String paymentMethod = "ONLINE_UPI"; // ONLINE_UPI, ADVANCE_25, CREDIT_ACCOUNT, COD

    @Column(name = "payment_status", length = 50)
    private String paymentStatus = "PENDING"; // PENDING, PAID, PARTIALLY_PAID

    @Column(name = "order_date", nullable = false)
    private LocalDate orderDate = LocalDate.now();

    @Column(name = "party_id", length = 36)
    private String partyId;

    @Column(name = "erp_sale_id", length = 36)
    private String erpSaleId;

    @Column(name = "erp_dispatch_id", length = 36)
    private String erpDispatchId;

    @Column(name = "notes", length = 1000)
    private String notes;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("order")
    private List<OrderItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("order")
    @OrderBy("eventTime ASC")
    private List<OrderTrackingEvent> trackingEvents = new ArrayList<>();

    public CustomerOrder() {}

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerMobile() { return customerMobile; }
    public void setCustomerMobile(String customerMobile) { this.customerMobile = customerMobile; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getGstNumber() { return gstNumber; }
    public void setGstNumber(String gstNumber) { this.gstNumber = gstNumber; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public BigDecimal getGstRate() { return gstRate; }
    public void setGstRate(BigDecimal gstRate) { this.gstRate = gstRate; }

    public BigDecimal getCgst() { return cgst; }
    public void setCgst(BigDecimal cgst) { this.cgst = cgst; }

    public BigDecimal getSgst() { return sgst; }
    public void setSgst(BigDecimal sgst) { this.sgst = sgst; }

    public BigDecimal getFreightCharges() { return freightCharges; }
    public void setFreightCharges(BigDecimal freightCharges) { this.freightCharges = freightCharges; }

    public BigDecimal getGrandTotal() { return grandTotal; }
    public void setGrandTotal(BigDecimal grandTotal) { this.grandTotal = grandTotal; }

    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public LocalDate getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDate orderDate) { this.orderDate = orderDate; }

    public String getPartyId() { return partyId; }
    public void setPartyId(String partyId) { this.partyId = partyId; }

    public String getErpSaleId() { return erpSaleId; }
    public void setErpSaleId(String erpSaleId) { this.erpSaleId = erpSaleId; }

    public String getErpDispatchId() { return erpDispatchId; }
    public void setErpDispatchId(String erpDispatchId) { this.erpDispatchId = erpDispatchId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }

    public List<OrderTrackingEvent> getTrackingEvents() { return trackingEvents; }
    public void setTrackingEvents(List<OrderTrackingEvent> trackingEvents) { this.trackingEvents = trackingEvents; }

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    public void addTrackingEvent(OrderTrackingEvent event) {
        trackingEvents.add(event);
        event.setOrder(this);
    }
}
