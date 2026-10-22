package com.futaneagro.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import javax.persistence.FetchType;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Monthly Factory Payroll Voucher Entity (`t_hr_salary`).
 *
 * Capabilities:
 * - Records monthly salary disbursement vouchers for staff members across billing cycles (Month/Year).
 * - Tracks voucher disbursement state (Paid, Pending, Cancelled) and actual disbursement date (`paidDate`).
 * - Many-to-One relationship to [`Employee`](file:///backend/src/main/java/com/futaneagro/entity/Employee.java).
 */
@Entity
@Table(name = "t_hr_salary", indexes = {
    @Index(name = "idx_salary_emp_id", columnList = "emp_id"),
    @Index(name = "idx_salary_month_year", columnList = "month, year"),
    @Index(name = "idx_salary_status", columnList = "status"),
    @Index(name = "idx_salary_active_deleted", columnList = "is_active, is_deleted")
})
@Where(clause = "is_active = true AND is_deleted = false")
@SQLDelete(sql = "UPDATE t_hr_salary SET is_deleted = true, is_active = false, deleted_date = NOW() WHERE id = ?")
public class EmployeeSalary extends BaseEntity {
    @Column(name = "salary_id")
    private Integer salaryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "emp_id", nullable = false)
    private Employee employee;

    @Column(name = "month", nullable = false, length = 20)
    private String month;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "salary_amount", nullable = false)
    private BigDecimal salaryAmount;

    @Column(name = "paid_date")
    private LocalDate paidDate;

    @Column(name = "status", nullable = false, length = 50)
    private String status; // Paid, Pending
    public EmployeeSalary() {}

    public Integer getSalaryId() {
        return salaryId;
    }

    public void setSalaryId(Integer salaryId) {
        this.salaryId = salaryId;
    }

    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public BigDecimal getSalaryAmount() {
        return salaryAmount;
    }

    public void setSalaryAmount(BigDecimal salaryAmount) {
        this.salaryAmount = salaryAmount;
    }

    public LocalDate getPaidDate() {
        return paidDate;
    }

    public void setPaidDate(LocalDate paidDate) {
        this.paidDate = paidDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }}
