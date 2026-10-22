package com.futaneagro.service;

import com.futaneagro.entity.Sales;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * <h3>Tally Prime XML Accounting Integration Service</h3>
 * <p>
 * Generates official Tally XML Import envelopes conforming to Tally Prime / Tally.ERP 9
 * schema specification for automated financial voucher ingestion.
 * </p>
 *
 * <h4>Core Responsibilities:</h4>
 * <ul>
 *   <li><b>Voucher Generation:</b> Serializes commercial {@link Sales} records into standard
 *       Double-Entry Bookkeeping Sales Vouchers (Debiting Party Ledger, Crediting Sales Account).</li>
 *   <li><b>XML Security & Escaping:</b> Sanitizes special XML characters ({@code &, <, >, ", '})
 *       to prevent parsing failures in Tally's XML engine.</li>
 *   <li><b>Statutory Date & Amount Formatting:</b> Formats transaction dates as {@code YYYYMMDD}
 *       and values with strict 2-decimal precision.</li>
 * </ul>
 *
 * @author Futane Agro Core Engineering
 * @version 2.0
 */
@Service
public class TallyExportService {

    /**
     * Transforms a collection of sales invoice transactions into an official Tally Prime XML import envelope.
     * <p>
     * <b>How it works:</b>
     * <ol>
     *   <li>Constructs standard Tally {@code <ENVELOPE>} header requesting {@code Vouchers} import.</li>
     *   <li>Iterates across each {@link Sales} entity, formatting invoice dates to {@code YYYYMMDD}.</li>
     *   <li>Creates two balanced ledger entries:
     *     <ul>
     *       <li>Party Ledger entry marked {@code <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>} (Debit).</li>
     *       <li>Sales Account entry marked {@code <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>} (Credit).</li>
     *     </ul>
     *   </li>
     *   <li>Returns complete UTF-8 XML payload ready for transmission or manual import.</li>
     * </ol>
     * </p>
     * <p>
     * <b>Used by:</b> {@link com.futaneagro.controller.SalesController#exportToTally(String, String)}
     * when accounting staff download monthly or quarterly sales vouchers for Tally reconciliation.
     * </p>
     *
     * @param sales List of commercial sales entities to convert
     * @return Formatted Tally Prime XML envelope string
     */
    public String generateTallySalesXml(List<Sales> sales) {
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<ENVELOPE>\n");
        xml.append("  <HEADER>\n");
        xml.append("    <TALLYREQUEST>Import Data</TALLYREQUEST>\n");
        xml.append("  </HEADER>\n");
        xml.append("  <BODY>\n");
        xml.append("    <IMPORTDATA>\n");
        xml.append("      <REQUESTDESC>\n");
        xml.append("        <REPORTNAME>Vouchers</REPORTNAME>\n");
        xml.append("      </REQUESTDESC>\n");
        xml.append("      <REQUESTDATA>\n");

        if (sales != null) {
            for (Sales s : sales) {
                String dateFormatted = s.getDate() != null ? s.getDate().toString().replace("-", "") : "20260101";
                String partyName = (s.getParty() != null && s.getParty().getPartyName() != null) ? escapeXml(s.getParty().getPartyName()) : "Cash";
                double total = s.getTotalAmount() != null ? s.getTotalAmount().doubleValue() : (s.getQuantity() != null && s.getRate() != null ? s.getRate().doubleValue() * s.getQuantity() : 0.0);

                xml.append("        <TALLYMESSAGE xmlns:UDF=\"TallyUDF\">\n");
                xml.append("          <VOUCHER VCHTYPE=\"Sales\" ACTION=\"Create\">\n");
                xml.append("            <DATE>").append(dateFormatted).append("</DATE>\n");
                xml.append("            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>\n");
                xml.append("            <PARTYLEDGERNAME>").append(partyName).append("</PARTYLEDGERNAME>\n");
                xml.append("            <ALLLEDGERENTRIES.LIST>\n");
                xml.append("              <LEDGERNAME>").append(partyName).append("</LEDGERNAME>\n");
                xml.append("              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>\n");
                xml.append("              <AMOUNT>-").append(String.format("%.2f", total)).append("</AMOUNT>\n");
                xml.append("            </ALLLEDGERENTRIES.LIST>\n");
                xml.append("            <ALLLEDGERENTRIES.LIST>\n");
                xml.append("              <LEDGERNAME>Sales Account</LEDGERNAME>\n");
                xml.append("              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\n");
                xml.append("              <AMOUNT>").append(String.format("%.2f", total)).append("</AMOUNT>\n");
                xml.append("            </ALLLEDGERENTRIES.LIST>\n");
                xml.append("          </VOUCHER>\n");
                xml.append("        </TALLYMESSAGE>\n");
            }
        }

        xml.append("      </REQUESTDATA>\n");
        xml.append("    </IMPORTDATA>\n");
        xml.append("  </BODY>\n");
        xml.append("</ENVELOPE>");

        return xml.toString();
    }

    /**
     * Escapes XML predefined entity characters to avoid XML injection or syntax corruption.
     *
     * @param text Raw party or ledger name
     * @return Sanitized XML-safe text
     */
    private String escapeXml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&apos;");
    }
}

