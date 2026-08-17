package com.futaneagro.entity;

import java.time.LocalDateTime;

import com.futaneagro.security.AttributeEncryptor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Min;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "t_hr_employee", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"emp_name"}),
    @UniqueConstraint(columnNames = {"emp_contact"})
})
@Where(clause = "is_active = true AND is_deleted = false")
@SQLDelete(sql = "UPDATE t_hr_employee SET is_deleted = true, is_active = false, deleted_date = NOW() WHERE id = ?")
public class Employee extends BaseEntity {
    @Column(name = "emp_id")
    private Integer empId;

    @NotBlank(message = "Employee Name is required")
    @Column(name = "emp_name", nullable = false, length = 100)
    private String empName;

    @NotBlank(message = "Contact number is required")
    @Pattern(regexp = "^\\d{10}$", message = "Contact must be a 10-digit number")
    @Column(name = "emp_contact", length = 20)
    private String empContact;

    @NotNull(message = "Salary is required")
    @Min(value = 0, message = "Salary cannot be negative")
    @Column(name = "salary", nullable = false)
    private BigDecimal salary;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "designation", length = 100)
    private String designation;

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    @Pattern(regexp = "^$|^[2-9]{1}[0-9]{11}$", message = "Invalid Aadhaar number format")
    @Column(name = "aadhaar_no", length = 20)
    private String aadhaarNo;

    @Column(name = "bank_account")
    @Convert(converter = AttributeEncryptor.class)
    private String bankAccount;

    @Column(name = "photo_path", length = 255)
    private String photoPath;

    @Column(name = "aadhaar_card_path", length = 255)
    private String aadhaarCardPath;

    @Column(name = "bank_passbook_path", length = 255)
    private String bankPassbookPath;

    public Employee() {}

    public Integer getEmpId() {
        return empId;
    }

    public void setEmpId(Integer empId) {
        this.empId = empId;
    }

    public String getEmpName() {
        return empName;
    }

    public void setEmpName(String empName) {
        this.empName = empName;
    }

    public String getEmpContact() {
        return empContact;
    }

    public void setEmpContact(String empContact) {
        this.empContact = empContact;
    }

    public BigDecimal getSalary() {
        return salary;
    }

    public void setSalary(BigDecimal salary) {
        this.salary = salary;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public LocalDate getJoiningDate() {
        return joiningDate;
    }

    public void setJoiningDate(LocalDate joiningDate) {
        this.joiningDate = joiningDate;
    }

    public String getAadhaarNo() {
        return aadhaarNo;
    }

    public void setAadhaarNo(String aadhaarNo) {
        this.aadhaarNo = aadhaarNo;
    }

    public String getBankAccount() {
        return bankAccount;
    }

    public void setBankAccount(String bankAccount) {
        this.bankAccount = bankAccount;
    }

    public String getPhotoPath() {
        return photoPath;
    }

    public void setPhotoPath(String photoPath) {
        this.photoPath = photoPath;
    }

    public String getAadhaarCardPath() {
        return aadhaarCardPath;
    }

    public void setAadhaarCardPath(String aadhaarCardPath) {
        this.aadhaarCardPath = aadhaarCardPath;
    }

    public String getBankPassbookPath() {
        return bankPassbookPath;
    }

    public void setBankPassbookPath(String bankPassbookPath) {
        this.bankPassbookPath = bankPassbookPath;
    }
}
