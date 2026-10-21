package com.futaneagro.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "t_fin_transaction", indexes = {
    @Index(name = "idx_bank_date", columnList = "date"),
    @Index(name = "idx_bank_type", columnList = "type"),
    @Index(name = "idx_bank_mode", columnList = "mode"),
    @Index(name = "idx_bank_active_deleted", columnList = "is_active, is_deleted")
})
@Where(clause = "is_active = true AND is_deleted = false")
@SQLDelete(sql = "UPDATE t_fin_transaction SET is_deleted = true, is_active = false, deleted_date = NOW() WHERE id = ?")
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
    }}
