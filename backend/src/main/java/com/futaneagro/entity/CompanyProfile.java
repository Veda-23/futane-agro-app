package com.futaneagro.entity;

import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "t_cfg_company_profiles")
public class CompanyProfile {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false, length = 36)
    private String id;

    @Column(nullable = false, length = 150)
    private String companyName;

    @Column(length = 150)
    private String tradeName;

    @Column(nullable = false, length = 20)
    private String gstin;

    @Column(length = 15)
    private String pan;

    @Column(length = 30)
    private String cin;

    @Column(columnDefinition = "TEXT")
    private String registeredAddress;

    @Column(columnDefinition = "TEXT")
    private String factoryAddress;

    @Column(length = 30)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(length = 100)
    private String website;

    @Column(length = 10)
    private String stateCode = "27"; // Maharashtra

    @Column(length = 50)
    private String lutNumber;

    @Column(length = 255)
    private String logoUrl;

    @Column(nullable = false)
    private Boolean isDefault = false;

    @Column(nullable = false)
    private Boolean isActive = true;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    private String createdBy = "SUPER_ADMIN";

    public CompanyProfile() {}

    public CompanyProfile(String companyName, String tradeName, String gstin, String pan, String registeredAddress, String factoryAddress, String phone, String email, Boolean isDefault) {
        this.companyName = companyName;
        this.tradeName = tradeName;
        this.gstin = gstin;
        this.pan = pan;
        this.registeredAddress = registeredAddress;
        this.factoryAddress = factoryAddress;
        this.phone = phone;
        this.email = email;
        this.isDefault = isDefault;
        this.isActive = true;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getTradeName() { return tradeName; }
    public void setTradeName(String tradeName) { this.tradeName = tradeName; }

    public String getGstin() { return gstin; }
    public void setGstin(String gstin) { this.gstin = gstin; }

    public String getPan() { return pan; }
    public void setPan(String pan) { this.pan = pan; }

    public String getCin() { return cin; }
    public void setCin(String cin) { this.cin = cin; }

    public String getRegisteredAddress() { return registeredAddress; }
    public void setRegisteredAddress(String registeredAddress) { this.registeredAddress = registeredAddress; }

    public String getFactoryAddress() { return factoryAddress; }
    public void setFactoryAddress(String factoryAddress) { this.factoryAddress = factoryAddress; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }

    public String getStateCode() { return stateCode; }
    public void setStateCode(String stateCode) { this.stateCode = stateCode; }

    public String getLutNumber() { return lutNumber; }
    public void setLutNumber(String lutNumber) { this.lutNumber = lutNumber; }

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
