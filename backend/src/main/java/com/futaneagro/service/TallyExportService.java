package com.futaneagro.service;

import com.futaneagro.entity.Sales;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TallyExportService {

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

    private String escapeXml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&apos;");
    }
}
