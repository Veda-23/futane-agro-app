package com.futaneagro.entity;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "Bank_Transaction")
@SQLDelete(sql = "UPDATE Bank_Transaction SET is_deleted = true, deleted_date = CURRENT_DATE() WHERE transaction_id = ?")
@Where(clause = "is_deleted = false")
public class BankTransaction extends BaseEntity {
    @Column(name = "transaction_id")
    private Integer transactionId;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "mode", nullable = false, length = 50)
    private String mode; // Cash, Bank, UPI

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "type", nullable = false, length = 50)
    private String type; // Debit, Credit

    @Column(name = "is_deleted")

    @Column(name = "deleted_by", length = 100)

    @Column(name = "deleted_date")

    public BankTransaction() {}

    public Integer getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(Integer transactionId) {
        this.transactionId = transactionId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
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
