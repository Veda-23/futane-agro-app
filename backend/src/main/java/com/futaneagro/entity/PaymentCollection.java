package com.futaneagro.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import javax.persistence.FetchType;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "t_fin_payment", indexes = {
    @Index(name = "idx_pay_party", columnList = "party_id"),
    @Index(name = "idx_pay_date", columnList = "payment_date"),
    @Index(name = "idx_pay_mode", columnList = "payment_mode")
})
@Where(clause = "is_active = true AND is_deleted = false")
@SQLDelete(sql = "UPDATE t_fin_payment SET is_deleted = true, is_active = false, deleted_date = NOW() WHERE id = ?")
public class PaymentCollection extends BaseEntity {
    @Column(name = "payment_id")
    private Integer paymentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "party_id", nullable = false)
    private Party party;

    @Column(name = "invoice_no", length = 100)
    private String invoiceNo;

    @Column(name = "amount_received", nullable = false)
    private BigDecimal amountReceived;

    @Column(name = "payment_mode", nullable = false, length = 50)
    private String paymentMode; // Cash, UPI, Cheque, Bank Transfer

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;
    public PaymentCollection() {}

    public Integer getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Integer paymentId) {
        this.paymentId = paymentId;
    }

    public Party getParty() {
        return party;
    }

    public void setParty(Party party) {
        this.party = party;
    }

    public String getInvoiceNo() {
        return invoiceNo;
    }

    public void setInvoiceNo(String invoiceNo) {
        this.invoiceNo = invoiceNo;
    }

    public BigDecimal getAmountReceived() {
        return amountReceived;
    }

    public void setAmountReceived(BigDecimal amountReceived) {
        this.amountReceived = amountReceived;
    }

    public String getPaymentMode() {
        return paymentMode;
    }

    public void setPaymentMode(String paymentMode) {
        this.paymentMode = paymentMode;
    }

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDate paymentDate) {
        this.paymentDate = paymentDate;
    }}
