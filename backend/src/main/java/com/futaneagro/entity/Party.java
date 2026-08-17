package com.futaneagro.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.futaneagro.security.AttributeEncryptor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;
import java.time.LocalDate;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Table(name = "t_crm_party", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"party_name"}),
    @UniqueConstraint(columnNames = {"party_contact"}),
    @UniqueConstraint(columnNames = {"email"})
})
@Where(clause = "is_active = true AND is_deleted = false")
@SQLDelete(sql = "UPDATE t_crm_party SET is_deleted = true, is_active = false, deleted_date = NOW() WHERE id = ?")
public class Party extends BaseEntity {
    @Column(name = "party_id")
    private Integer partyId;

    @NotBlank(message = "Party Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    @Column(name = "party_name", nullable = false, length = 100)
    private String partyName;

    @Column(name = "party_address", length = 255)
    private String partyAddress;

    @NotBlank(message = "Contact number is required")
    @Pattern(regexp = "^\\d{10}$", message = "Contact must be a 10-digit number")
    @Column(name = "party_contact", length = 20)
    private String partyContact;

    @Pattern(regexp = "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$", message = "Invalid GST Number format")
    @Column(name = "gst_number")
    @Convert(converter = AttributeEncryptor.class)
    private String gstNumber;

    @Email(message = "Valid email is required")
    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_date")
    private LocalDate createdDate;

    @Column(name = "gst_cert_path", length = 255)
    private String gstCertPath;

    @Column(name = "pan_card_path", length = 255)
    private String panCardPath;

    @Column(name = "agreement_path", length = 255)
    private String agreementPath;

    public Party() {}

    public Integer getPartyId() {
        return partyId;
    }

    public void setPartyId(Integer partyId) {
        this.partyId = partyId;
    }

    public String getPartyName() {
        return partyName;
    }

    public void setPartyName(String partyName) {
        this.partyName = partyName;
    }

    public String getPartyAddress() {
        return partyAddress;
    }

    public void setPartyAddress(String partyAddress) {
        this.partyAddress = partyAddress;
    }

    public String getPartyContact() {
        return partyContact;
    }

    public void setPartyContact(String partyContact) {
        this.partyContact = partyContact;
    }

    public String getGstNumber() {
        return gstNumber;
    }

    public void setGstNumber(String gstNumber) {
        this.gstNumber = gstNumber;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }

    public LocalDate getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDate createdDate) {
        this.createdDate = createdDate;
    }

    public String getGstCertPath() {
        return gstCertPath;
    }

    public void setGstCertPath(String gstCertPath) {
        this.gstCertPath = gstCertPath;
    }

    public String getPanCardPath() {
        return panCardPath;
    }

    public void setPanCardPath(String panCardPath) {
        this.panCardPath = panCardPath;
    }

    public String getAgreementPath() {
        return agreementPath;
    }

    public void setAgreementPath(String agreementPath) {
        this.agreementPath = agreementPath;
    }
}
