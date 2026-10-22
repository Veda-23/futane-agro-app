package com.futaneagro.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * <h1>BankTransaction Entity (Banking Passbook & Cash Book Ledger)</h1>
 * <p>
 * Maps to table {@code t_fin_transaction}. Records company bank balance credits and debits across all active accounts.
 * Supports Cash, Bank Transfer (NEFT/RTGS/IMPS), and UPI settlement modes.
 * </p>
 *
 * <h3>Key Financial & Reconciliation Invariants:</h3>
 * <ul>
 *   <li><b>Transaction Types:</b> Strictly classifies cash flow as {@code Credit} (inflows) or {@code Debit} (outflows).</li>
 *   <li><b>Indexing for Fast Ledgers:</b> Indexed by date, type, mode, and soft-delete status for high-speed monthly statement generation.</li>
 *   <li><b>Financial Invariant:</b> Amounts are exact {@link BigDecimal} values; financial records are never hard-deleted.</li>
 * </ul>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
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
