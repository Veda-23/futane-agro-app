package com.futaneagro.dto;

import java.math.BigDecimal;
import java.util.List;

public class StorefrontOrderRequest {
    private String customerName;
    private String customerMobile;
    private String customerEmail;
    private String companyName;
    private String gstNumber;
    private String deliveryAddress;
    private String city;
    private String state;
    private String pincode;
    private String paymentMethod;
    private String notes;
    private List<ItemRequest> items;

    public static class ItemRequest {
        private String crateType;
        private String materialType;
        private String color;
        private String embossingText;
        private Integer quantity;
        private BigDecimal unitPrice;
        private String inventoryId;

        public String getCrateType() { return crateType; }
        public void setCrateType(String crateType) { this.crateType = crateType; }

        public String getMaterialType() { return materialType; }
        public void setMaterialType(String materialType) { this.materialType = materialType; }

        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }

        public String getEmbossingText() { return embossingText; }
        public void setEmbossingText(String embossingText) { this.embossingText = embossingText; }

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }

        public BigDecimal getUnitPrice() { return unitPrice; }
        public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

        public String getInventoryId() { return inventoryId; }
        public void setInventoryId(String inventoryId) { this.inventoryId = inventoryId; }
    }

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

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<ItemRequest> getItems() { return items; }
    public void setItems(List<ItemRequest> items) { this.items = items; }
}
