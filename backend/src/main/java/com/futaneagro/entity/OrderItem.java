package com.futaneagro.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import java.math.BigDecimal;

/**
 * <h1>OrderItem Entity (B2B Purchase Order Line Item & Customization Spec)</h1>
 * <p>
 * Maps to table {@code t_ord_order_items}. Records individual crate requirements within a {@link CustomerOrder}.
 * Captures product dimensions, plastic resin polymer type, custom dye color (default 'Agro Emerald'),
 * custom hot-foil embossing text, ordered quantity, unit price, and gross extended pricing.
 * </p>
 *
 * <h3>Key Relationships:</h3>
 * <ul>
 *   <li><b>Order Header:</b> {@code @ManyToOne} back-reference to {@link CustomerOrder}.</li>
 *   <li><b>Finished Goods Inventory Link:</b> Optionally maps to an {@code inventoryId} in {@link Inventory} for stock reservation.</li>
 * </ul>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Entity
@Table(name = "t_ord_order_items")
@Where(clause = "is_active = true AND is_deleted = false")
@SQLDelete(sql = "UPDATE t_ord_order_items SET is_deleted = true, is_active = false, deleted_date = NOW() WHERE id = ?")
@JsonIgnoreProperties(value = {"hibernateLazyInitializer", "handler"}, ignoreUnknown = true)
public class OrderItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnoreProperties({"items", "trackingEvents"})
    private CustomerOrder order;

    @Column(name = "crate_type", nullable = false, length = 150)
    private String crateType;

    @Column(name = "material_type", length = 100)
    private String materialType;

    @Column(name = "color", length = 50)
    private String color = "Agro Emerald";

    @Column(name = "embossing_text", length = 100)
    private String embossingText;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;

    @Column(name = "gross_amount", nullable = false)
    private BigDecimal grossAmount;

    @Column(name = "inventory_id", length = 36)
    private String inventoryId;

    public OrderItem() {}

    public CustomerOrder getOrder() { return order; }
    public void setOrder(CustomerOrder order) { this.order = order; }

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

    public BigDecimal getGrossAmount() { return grossAmount; }
    public void setGrossAmount(BigDecimal grossAmount) { this.grossAmount = grossAmount; }

    public String getInventoryId() { return inventoryId; }
    public void setInventoryId(String inventoryId) { this.inventoryId = inventoryId; }
}
