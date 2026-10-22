package com.futaneagro.entity;

import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * <h1>BankProfile Entity (Statutory Banking Details & UPI Configuration)</h1>
 * <p>
 * Maps to table {@code t_cfg_bank_profiles}. Stores company bank account details, IFSC codes, branch information,
 * and Unified Payments Interface (UPI) VPA identifiers rendered on tax invoices and B2B payment links.
 * </p>
 *
 * <h3>Key Features:</h3>
 * <ul>
 *   <li><b>Primary Account Flag:</b> {@code isPrimary} designates the principal bank account displayed on generated PDF invoices.</li>
 *   <li><b>Dynamic UPI QR Generation:</b> The {@code upiId} is used to generate dynamic BharatQR/UPI QR codes on customer invoices.</li>
 * </ul>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Entity
@Table(name = "t_cfg_bank_profiles")
public class BankProfile {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false, length = 36)
    private String id;

    @Column(length = 36)
    private String companyId;

    @Column(nullable = false, length = 100)
    private String bankName;

    @Column(nullable = false, length = 150)
    private String accountHolderName;

    @Column(nullable = false, length = 50)
    private String accountNumber;

    @Column(nullable = false, length = 20)
    private String ifscCode;

    @Column(length = 100)
    private String branchName;

    @Column(length = 30)
    private String accountType = "CURRENT";

    @Column(length = 100)
    private String upiId;

    @Column(nullable = false)
    private Boolean isPrimary = false;

    @Column(nullable = false)
    private Boolean isActive = true;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public BankProfile() {}

    public BankProfile(String companyId, String bankName, String accountHolderName, String accountNumber, String ifscCode, String branchName, String accountType, String upiId, Boolean isPrimary) {
        this.companyId = companyId;
        this.bankName = bankName;
        this.accountHolderName = accountHolderName;
        this.accountNumber = accountNumber;
        this.ifscCode = ifscCode;
        this.branchName = branchName;
        this.accountType = accountType;
        this.upiId = upiId;
        this.isPrimary = isPrimary;
        this.isActive = true;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCompanyId() { return companyId; }
    public void setCompanyId(String companyId) { this.companyId = companyId; }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public String getAccountHolderName() { return accountHolderName; }
    public void setAccountHolderName(String accountHolderName) { this.accountHolderName = accountHolderName; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }

    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }

    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }

    public String getUpiId() { return upiId; }
    public void setUpiId(String upiId) { this.upiId = upiId; }

    public Boolean getIsPrimary() { return isPrimary; }
    public void setIsPrimary(Boolean isPrimary) { this.isPrimary = isPrimary; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
