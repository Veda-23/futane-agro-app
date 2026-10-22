package com.futaneagro.entity;

import javax.persistence.*;
import java.time.LocalDate;

/**
 * <h1>StockTransfer Entity (Inter-Branch Inventory Rebalancing)</h1>
 * <p>
 * Maps to table {@code t_stock_transfers}. Tracks transfer of finished crates between company branches
 * (e.g. from Central Factory to Pune Distribution Warehouse).
 * </p>
 *
 * <h3>Transfer States:</h3>
 * <ul>
 *   <li>{@code IN_TRANSIT} - Crates dispatched from source plant, awaiting arrival.</li>
 *   <li>{@code RECEIVED} - Consignment inspected and inwarded at destination plant.</li>
 *   <li>{@code CANCELLED} - Transfer revoked prior to shipment.</li>
 * </ul>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Entity
@Table(name = "t_stock_transfers")
public class StockTransfer extends BaseEntity {

    @Column(name = "transfer_date", nullable = false)
    private LocalDate transferDate;

    @ManyToOne
    @JoinColumn(name = "source_branch_id")
    private Branch sourceBranch;

    @ManyToOne
    @JoinColumn(name = "destination_branch_id")
    private Branch destinationBranch;

    @Column(name = "crate_type", nullable = false)
    private String crateType;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "status")
    private String status = "IN_TRANSIT"; // IN_TRANSIT, RECEIVED, CANCELLED

    // Getters & Setters
    public LocalDate getTransferDate() { return transferDate; }
    public void setTransferDate(LocalDate transferDate) { this.transferDate = transferDate; }
    public Branch getSourceBranch() { return sourceBranch; }
    public void setSourceBranch(Branch sourceBranch) { this.sourceBranch = sourceBranch; }
    public Branch getDestinationBranch() { return destinationBranch; }
    public void setDestinationBranch(Branch destinationBranch) { this.destinationBranch = destinationBranch; }
    public String getCrateType() { return crateType; }
    public void setCrateType(String crateType) { this.crateType = crateType; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
