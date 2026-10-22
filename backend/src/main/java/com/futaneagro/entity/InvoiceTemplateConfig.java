package com.futaneagro.entity;

import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * <h1>InvoiceTemplateConfig Entity (Tax Invoice Layout & Legal Print Specification)</h1>
 * <p>
 * Maps to table {@code t_cfg_invoice_templates}. Configures visual styling, terms & conditions,
 * jurisdiction clauses, signatory titles, and layout toggles for PDF Tax Invoice printing.
 * </p>
 *
 * <h3>Compliance Defaults:</h3>
 * <ul>
 *   <li><b>Statutory Sections:</b> Toggles inclusion of Bank Account Details, UPI QR Codes, Company Logo, and HSN/SAC summary breakdowns.</li>
 *   <li><b>Legal Terms:</b> Contains non-negotiable clauses regarding goods return, delayed payment interest (18% p.a.), and Pune jurisdiction.</li>
 * </ul>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Entity
@Table(name = "t_cfg_invoice_templates")
public class InvoiceTemplateConfig {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false, length = 36)
    private String id;

    @Column(nullable = false, length = 100)
    private String templateName = "Standard Tax Invoice";

    @Column(nullable = false, length = 50)
    private String invoiceTitle = "TAX INVOICE";

    @Column(length = 100)
    private String invoiceSubtitle = "Original for Recipient (B2B)";

    @Column(columnDefinition = "TEXT")
    private String termsAndConditions;

    @Column(length = 150)
    private String jurisdictionClause = "Subject to Pune Jurisdiction only";

    @Column(length = 100)
    private String signatoryTitle = "Authorized Signatory";

    @Column(length = 255)
    private String signatureImageUrl;

    @Column(nullable = false)
    private Boolean showBankDetails = true;

    @Column(nullable = false)
    private Boolean showUpiQrCode = true;

    @Column(nullable = false)
    private Boolean showCompanyLogo = true;

    @Column(nullable = false)
    private Boolean showHsnSummary = true;

    @Column(length = 20)
    private String primaryColorHex = "#d97706";

    @Column(columnDefinition = "TEXT")
    private String headerNotes = "Goods supplied for Agricultural & Industrial Material Handling purposes.";

    @Column(columnDefinition = "TEXT")
    private String footerNotes = "Thank you for partnering with Futane Agro. Quality Crates for a Stronger Future.";

    @Column(nullable = false)
    private Boolean isDefault = true;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public InvoiceTemplateConfig() {
        this.termsAndConditions = "1. Goods once sold will not be accepted back or exchanged under any circumstances.\n" +
                "2. Interest @ 18% p.a. will be charged on delayed payments exceeding credit terms.\n" +
                "3. Any discrepancies must be reported in writing within 48 hours of delivery receipt.\n" +
                "4. All disputes are subject to Pune Jurisdiction only.";
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTemplateName() { return templateName; }
    public void setTemplateName(String templateName) { this.templateName = templateName; }

    public String getInvoiceTitle() { return invoiceTitle; }
    public void setInvoiceTitle(String invoiceTitle) { this.invoiceTitle = invoiceTitle; }

    public String getInvoiceSubtitle() { return invoiceSubtitle; }
    public void setInvoiceSubtitle(String invoiceSubtitle) { this.invoiceSubtitle = invoiceSubtitle; }

    public String getTermsAndConditions() { return termsAndConditions; }
    public void setTermsAndConditions(String termsAndConditions) { this.termsAndConditions = termsAndConditions; }

    public String getJurisdictionClause() { return jurisdictionClause; }
    public void setJurisdictionClause(String jurisdictionClause) { this.jurisdictionClause = jurisdictionClause; }

    public String getSignatoryTitle() { return signatoryTitle; }
    public void setSignatoryTitle(String signatoryTitle) { this.signatoryTitle = signatoryTitle; }

    public String getSignatureImageUrl() { return signatureImageUrl; }
    public void setSignatureImageUrl(String signatureImageUrl) { this.signatureImageUrl = signatureImageUrl; }

    public Boolean getShowBankDetails() { return showBankDetails; }
    public void setShowBankDetails(Boolean showBankDetails) { this.showBankDetails = showBankDetails; }

    public Boolean getShowUpiQrCode() { return showUpiQrCode; }
    public void setShowUpiQrCode(Boolean showUpiQrCode) { this.showUpiQrCode = showUpiQrCode; }

    public Boolean getShowCompanyLogo() { return showCompanyLogo; }
    public void setShowCompanyLogo(Boolean showCompanyLogo) { this.showCompanyLogo = showCompanyLogo; }

    public Boolean getShowHsnSummary() { return showHsnSummary; }
    public void setShowHsnSummary(Boolean showHsnSummary) { this.showHsnSummary = showHsnSummary; }

    public String getPrimaryColorHex() { return primaryColorHex; }
    public void setPrimaryColorHex(String primaryColorHex) { this.primaryColorHex = primaryColorHex; }

    public String getHeaderNotes() { return headerNotes; }
    public void setHeaderNotes(String headerNotes) { this.headerNotes = headerNotes; }

    public String getFooterNotes() { return footerNotes; }
    public void setFooterNotes(String footerNotes) { this.footerNotes = footerNotes; }

    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
