package com.futaneagro.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import javax.validation.constraints.Pattern;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "t_fin_expense")
@Where(clause = "is_active = true AND is_deleted = false")
@SQLDelete(sql = "UPDATE t_fin_expense SET is_deleted = true, is_active = false, deleted_date = NOW() WHERE id = ?")
public class Expense extends BaseEntity {
    @Column(name = "expense_id")
    private Integer expenseId;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Pattern(regexp = "Fuel|Diesel|Electricity|Repair|Office|Office Expense|Salary|Utilities|Miscellaneous|Transport|Maintenance|Other", message = "Invalid expense category")
    @Column(name = "category", nullable = false, length = 100)
    private String category; // Diesel, Electricity, Repair, Office Expense, Maintenance

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @Column(name = "description", length = 255)
    private String description;

    public Expense() {}

    public Integer getExpenseId() {
        return expenseId;
    }

    public void setExpenseId(Integer expenseId) {
        this.expenseId = expenseId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
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
}
