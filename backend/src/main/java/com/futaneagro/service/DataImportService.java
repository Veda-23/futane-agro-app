package com.futaneagro.service;

import com.futaneagro.dto.ImportConfirmRequestDTO;
import com.futaneagro.dto.ImportPreviewDTO;
import com.futaneagro.dto.ImportResultDTO;
import com.futaneagro.entity.*;
import com.futaneagro.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class DataImportService {

    private static final Logger log = LoggerFactory.getLogger(DataImportService.class);

    @Autowired private PartyRepository partyRepo;
    @Autowired private PpdRepository ppdRepo;
    @Autowired private InventoryRepository inventoryRepo;
    @Autowired private RawMaterialRepository rawMaterialRepo;
    @Autowired private VendorRepository vendorRepo;
    @Autowired private EmployeeRepository employeeRepo;
    @Autowired private MachineMasterRepository machineRepo;
    @Autowired private EmployeeSalaryRepository salaryRepo;
    @Autowired private ExpenseRepository expenseRepo;
    @Autowired private AuditLogRepository auditRepo;
    @Autowired private com.futaneagro.security.FileSecurityService fileSecurityService;

    private static final Pattern GST_PATTERN = Pattern.compile("^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\d{10}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    private static final Pattern AADHAAR_PATTERN = Pattern.compile("^[2-9]{1}[0-9]{11}$");

    /**
     * Preview & Dry-Run Validation without mutating database
     */
    public ImportPreviewDTO previewImport(MultipartFile file, String module) throws Exception {
        validateFileSecurity(file);

        List<Map<String, Object>> parsedRows = parseSpreadsheet(file);
        if (parsedRows.isEmpty()) {
            throw new IllegalArgumentException("The uploaded file contains no data rows.");
        }

        ImportPreviewDTO preview = new ImportPreviewDTO();
        preview.setModule(module);
        preview.setTotalRows(parsedRows.size());

        List<ImportPreviewDTO.RowErrorDTO> errors = new ArrayList<>();
        List<Map<String, Object>> validRows = new ArrayList<>();
        int dupCount = 0;
        int newCount = 0;

        for (int i = 0; i < parsedRows.size(); i++) {
            int rowNum = i + 2; // Accounting for 1-based index and header row
            Map<String, Object> row = parsedRows.get(i);
            List<ImportPreviewDTO.RowErrorDTO> rowErrors = validateRow(row, module, rowNum);

            if (!rowErrors.isEmpty()) {
                errors.addAll(rowErrors);
            } else {
                boolean isDuplicate = checkDuplicate(row, module);
                row.put("_isDuplicate", isDuplicate);
                if (isDuplicate) {
                    dupCount++;
                } else {
                    newCount++;
                }
                validRows.add(row);
            }
        }

        preview.setValidRows(validRows.size());
        preview.setInvalidRows(errors.size());
        preview.setDuplicateRows(dupCount);
        preview.setNewRows(newCount);
        preview.setPreviewRows(validRows);
        preview.setErrors(errors);

        return preview;
    }

    /**
     * Execute Transactional Import with chosen duplicate resolution strategy
     */
    @Transactional(rollbackFor = Exception.class)
    public ImportResultDTO executeImport(ImportConfirmRequestDTO request) {
        String module = request.getModule();
        String duplicateStrategy = request.getDuplicateStrategy() != null ? request.getDuplicateStrategy() : "UPDATE";
        List<Map<String, Object>> rows = request.getRows();

        ImportResultDTO result = new ImportResultDTO();
        result.setModule(module);
        result.setTotalProcessed(rows.size());

        int inserted = 0;
        int updated = 0;
        int skipped = 0;

        for (Map<String, Object> row : rows) {
            boolean isDuplicate = checkDuplicate(row, module);
            if (isDuplicate && "SKIP".equalsIgnoreCase(duplicateStrategy)) {
                skipped++;
                continue;
            }

            if (isDuplicate) {
                updateEntity(module, row);
                updated++;
            } else {
                insertEntity(module, row);
                inserted++;
            }
        }

        result.setInsertedCount(inserted);
        result.setUpdatedCount(updated);
        result.setSkippedCount(skipped);
        result.setFailedCount(0);
        result.setSuccess(true);
        result.setMessage(String.format("Successfully processed %d records (%d inserted, %d updated, %d skipped).",
                rows.size(), inserted, updated, skipped));

        // Create Security Audit Log
        recordImportAudit(module, inserted, updated, skipped);

        return result;
    }

    /**
     * Generate Sample CSV Template (.csv) for specified module
     */
    public byte[] generateSampleCsvTemplate(String module) throws IOException {
        List<String> headers = getModuleHeaders(module);
        List<String> sampleValues = getModuleSampleRow(module);

        StringBuilder sb = new StringBuilder();
        // Append Header Row
        for (int i = 0; i < headers.size(); i++) {
            sb.append(escapeCsvField(headers.get(i)));
            if (i < headers.size() - 1) sb.append(",");
        }
        sb.append("\r\n");

        // Append Sample Data Row
        for (int i = 0; i < sampleValues.size(); i++) {
            sb.append(escapeCsvField(sampleValues.get(i)));
            if (i < sampleValues.size() - 1) sb.append(",");
        }
        sb.append("\r\n");

        return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    private String escapeCsvField(String field) {
        if (field == null) return "";
        if (field.contains(",") || field.contains("\"") || field.contains("\n") || field.contains("\r")) {
            return "\"" + field.replace("\"", "\"\"") + "\"";
        }
        return field;
    }

    // =========================================================================
    // SECURITY & VALIDATION HELPERS
    // =========================================================================

    private void validateFileSecurity(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No file uploaded or file is empty.");
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("File size exceeds 10MB limit.");
        }

        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (!filename.endsWith(".csv")) {
            throw new IllegalArgumentException("Only CSV (.csv) format is supported. Excel (.xlsx / .xls) and other file formats are not allowed.");
        }

        com.futaneagro.security.FileSecurityService.FileValidationResult validation = fileSecurityService.validate(file);
        if (!validation.valid) {
            throw new IllegalArgumentException("Security check failed: " + validation.error);
        }
    }

    private List<Map<String, Object>> parseSpreadsheet(MultipartFile file) throws Exception {
        List<Map<String, Object>> rows = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), java.nio.charset.StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null) return rows;
            // Handle UTF-8 BOM if present
            if (headerLine.startsWith("\uFEFF")) {
                headerLine = headerLine.substring(1);
            }
            String[] headers = parseCsvLine(headerLine);
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] tokens = parseCsvLine(line);
                Map<String, Object> map = new LinkedHashMap<>();
                for (int i = 0; i < headers.length; i++) {
                    String key = sanitizeKey(headers[i]);
                    String val = i < tokens.length ? tokens[i].trim() : "";
                    map.put(key, sanitizeFormulaInjection(val));
                }
                rows.add(map);
            }
        }
        return rows;
    }

    private String[] parseCsvLine(String line) {
        List<String> list = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        for (char ch : line.toCharArray()) {
            if (ch == '"') {
                inQuotes = !inQuotes;
            } else if (ch == ',' && !inQuotes) {
                list.add(sb.toString().trim());
                sb.setLength(0);
            } else {
                sb.append(ch);
            }
        }
        list.add(sb.toString().trim());
        return list.toArray(new String[0]);
    }

    private String sanitizeKey(String key) {
        if (key == null) return "";
        return key.trim()
                .replace(" ", "")
                .replace("_", "")
                .replace("-", "")
                .toLowerCase();
    }

    private String sanitizeFormulaInjection(String value) {
        if (value == null) return "";
        String trimmed = value.trim();
        if (trimmed.isEmpty()) return "";
        // If it is purely a valid number (e.g. +123, -45.6, 78), do not escape it
        if (trimmed.matches("^[+-]?\\d+(\\.\\d+)?$")) {
            return trimmed;
        }
        // Prevent formula injection in spreadsheet exports (=, +, -, @, \t, \r)
        if (trimmed.startsWith("=") || trimmed.startsWith("+") || trimmed.startsWith("-") || trimmed.startsWith("@") || trimmed.startsWith("\t") || trimmed.startsWith("\r")) {
            return "'" + trimmed;
        }
        return trimmed;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toLocalDate().toString();
                }
                double num = cell.getNumericCellValue();
                if (num == (long) num) return String.valueOf((long) num);
                return String.valueOf(num);
            case BOOLEAN: return String.valueOf(cell.getBooleanCellValue());
            default: return "";
        }
    }

    // =========================================================================
    // MODULE VALIDATION & DUPLICATE DETECTION
    // =========================================================================

    private List<ImportPreviewDTO.RowErrorDTO> validateRow(Map<String, Object> row, String module, int rowNum) {
        List<ImportPreviewDTO.RowErrorDTO> errs = new ArrayList<>();

        switch (module.toLowerCase()) {
            case "parties":
                validateFieldRequired(row, "partyname", "Party Name", rowNum, errs);
                validateFieldRegex(row, "gstnumber", "GST Number", GST_PATTERN, "15-digit alphanumeric format (e.g. 27AAAAA0000A1Z5)", rowNum, errs);
                validateFieldRegex(row, "partycontact", "Contact", PHONE_PATTERN, "10-digit mobile number", rowNum, errs);
                break;
            case "production":
            case "ppd":
                validateFieldRequired(row, "date", "Date", rowNum, errs);
                validateFieldRequired(row, "cratetype", "Crate Type", rowNum, errs);
                validateFieldNumeric(row, "totalproduction", "Total Production", rowNum, errs);
                validateFieldNumeric(row, "successful", "Successful", rowNum, errs);
                validateFieldNumeric(row, "rejected", "Rejected", rowNum, errs);
                break;
            case "inventory":
                validateFieldRequired(row, "cratetype", "Crate Type", rowNum, errs);
                validateFieldNumeric(row, "currentstock", "Current Stock", rowNum, errs);
                break;
            case "raw-materials":
                validateFieldRequired(row, "materialname", "Material Name", rowNum, errs);
                validateFieldRequired(row, "vendorname", "Vendor Name", rowNum, errs);
                validateFieldNumeric(row, "weight", "Weight (kg)", rowNum, errs);
                validateFieldNumeric(row, "rate", "Rate", rowNum, errs);
                break;
            case "vendors":
                validateFieldRequired(row, "vendorname", "Vendor Name", rowNum, errs);
                validateFieldRegex(row, "gstnumber", "GST Number", GST_PATTERN, "15-digit alphanumeric format", rowNum, errs);
                validateFieldRegex(row, "mobile", "Mobile", PHONE_PATTERN, "10-digit phone number", rowNum, errs);
                break;
            case "employees":
                validateFieldRequired(row, "empname", "Employee Name", rowNum, errs);
                validateFieldRegex(row, "empcontact", "Contact", PHONE_PATTERN, "10-digit phone number", rowNum, errs);
                validateFieldRegex(row, "aadhaarno", "Aadhaar", AADHAAR_PATTERN, "12-digit Aadhaar number", rowNum, errs);
                validateFieldNumeric(row, "salary", "Salary", rowNum, errs);
                break;
            case "machines":
                validateFieldRequired(row, "machinename", "Machine Name", rowNum, errs);
                break;
            case "expenses":
                validateFieldRequired(row, "date", "Date", rowNum, errs);
                validateFieldRequired(row, "category", "Category", rowNum, errs);
                validateFieldNumeric(row, "amount", "Amount", rowNum, errs);
                break;
        }
        return errs;
    }

    private void validateFieldRequired(Map<String, Object> r, String key, String label, int rowNum, List<ImportPreviewDTO.RowErrorDTO> errs) {
        Object val = getRowVal(r, key);
        if (val == null || val.toString().trim().isEmpty()) {
            errs.add(new ImportPreviewDTO.RowErrorDTO(rowNum, label, "", label + " is a required field.", "Provide a non-empty " + label));
        }
    }

    private void validateFieldRegex(Map<String, Object> r, String key, String label, Pattern pattern, String expectedFormat, int rowNum, List<ImportPreviewDTO.RowErrorDTO> errs) {
        Object val = getRowVal(r, key);
        if (val != null && !val.toString().trim().isEmpty()) {
            String str = val.toString().trim();
            if (!pattern.matcher(str).matches()) {
                errs.add(new ImportPreviewDTO.RowErrorDTO(rowNum, label, str, "Invalid " + label + " format.", "Expected " + expectedFormat));
            }
        }
    }

    private void validateFieldNumeric(Map<String, Object> r, String key, String label, int rowNum, List<ImportPreviewDTO.RowErrorDTO> errs) {
        Object val = getRowVal(r, key);
        if (val != null && !val.toString().trim().isEmpty()) {
            try {
                Double.parseDouble(val.toString().trim());
            } catch (NumberFormatException ex) {
                errs.add(new ImportPreviewDTO.RowErrorDTO(rowNum, label, val.toString(), label + " must be a numeric value.", "Enter numbers only"));
            }
        }
    }

    private Object getRowVal(Map<String, Object> r, String key) {
        String clean = sanitizeKey(key);
        for (Map.Entry<String, Object> entry : r.entrySet()) {
            if (sanitizeKey(entry.getKey()).equals(clean)) {
                return entry.getValue();
            }
        }
        return null;
    }

    private boolean checkDuplicate(Map<String, Object> r, String module) {
        switch (module.toLowerCase()) {
            case "parties": {
                String gst = (String) getRowVal(r, "gstnumber");
                String name = (String) getRowVal(r, "partyname");
                return partyRepo.findAll().stream().anyMatch(p ->
                        (gst != null && !gst.isEmpty() && gst.equalsIgnoreCase(p.getGstNumber())) ||
                        (name != null && !name.isEmpty() && name.equalsIgnoreCase(p.getPartyName())));
            }
            case "production":
            case "ppd": {
                String date = (String) getRowVal(r, "date");
                String shift = (String) getRowVal(r, "shift");
                String crate = (String) getRowVal(r, "cratetype");
                return ppdRepo.findAll().stream().anyMatch(p ->
                        Objects.equals(p.getDate() != null ? p.getDate().toString() : "", date) &&
                        Objects.equals(p.getShift(), shift) &&
                        Objects.equals(p.getCrateType(), crate));
            }
            case "inventory": {
                String crate = (String) getRowVal(r, "cratetype");
                String mat = (String) getRowVal(r, "materialtype");
                return inventoryRepo.findAll().stream().anyMatch(i ->
                        Objects.equals(i.getCrateType(), crate) &&
                        Objects.equals(i.getMaterialType(), mat));
            }
            case "vendors": {
                String gst = (String) getRowVal(r, "gstnumber");
                String name = (String) getRowVal(r, "vendorname");
                return vendorRepo.findAll().stream().anyMatch(v ->
                        (gst != null && !gst.isEmpty() && gst.equalsIgnoreCase(v.getGstNumber())) ||
                        (name != null && !name.isEmpty() && name.equalsIgnoreCase(v.getVendorName())));
            }
            case "employees": {
                String aadhaar = (String) getRowVal(r, "aadhaarno");
                String name = (String) getRowVal(r, "empname");
                return employeeRepo.findAll().stream().anyMatch(e ->
                        (aadhaar != null && !aadhaar.isEmpty() && aadhaar.equalsIgnoreCase(e.getAadhaarNo())) ||
                        (name != null && !name.isEmpty() && name.equalsIgnoreCase(e.getEmpName())));
            }
            case "machines": {
                String name = (String) getRowVal(r, "machinename");
                return machineRepo.findAll().stream().anyMatch(m ->
                        name != null && !name.isEmpty() && name.equalsIgnoreCase(m.getMachineName()));
            }
        }
        return false;
    }

    // =========================================================================
    // 💾 TRANSACTIONAL UPSERT OPERATIONS
    // =========================================================================

    private void insertEntity(String module, Map<String, Object> r) {
        switch (module.toLowerCase()) {
            case "parties":
                Party p = new Party();
                p.setPartyName((String) getRowVal(r, "partyname"));
                p.setGstNumber((String) getRowVal(r, "gstnumber"));
                p.setEmail((String) getRowVal(r, "email"));
                p.setPartyContact((String) getRowVal(r, "partycontact"));
                p.setPartyAddress((String) getRowVal(r, "address"));
                partyRepo.save(p);
                break;

            case "production":
            case "ppd":
                Ppd ppd = new Ppd();
                ppd.setDate(parseDate((String) getRowVal(r, "date")));
                ppd.setCrateType((String) getRowVal(r, "cratetype"));
                ppd.setShift((String) getRowVal(r, "shift"));
                ppd.setTotalProduction(parseInt(getRowVal(r, "totalproduction"), 0));
                ppd.setSuccessful(parseInt(getRowVal(r, "successful"), 0));
                ppd.setRejected(parseInt(getRowVal(r, "rejected"), 0));
                ppdRepo.save(ppd);
                break;

            case "inventory":
                Inventory inv = new Inventory();
                inv.setCrateType((String) getRowVal(r, "cratetype"));
                inv.setMaterialType((String) getRowVal(r, "materialtype"));
                inv.setOpeningStock(parseInt(getRowVal(r, "openingstock"), 0));
                inv.setProducedStock(parseInt(getRowVal(r, "producedstock"), 0));
                inv.setSoldStock(parseInt(getRowVal(r, "soldstock"), 0));
                inv.setCurrentStock(parseInt(getRowVal(r, "currentstock"), 0));
                inventoryRepo.save(inv);
                break;

            case "raw-materials":
                RawMaterial rm = new RawMaterial();
                rm.setDate(parseDate((String) getRowVal(r, "date")));
                rm.setMaterialName((String) getRowVal(r, "materialname"));
                String vName = (String) getRowVal(r, "vendorname");
                Vendor v = vendorRepo.findAll().stream().filter(vnd -> vnd.getVendorName().equalsIgnoreCase(vName)).findFirst().orElse(null);
                if (v == null) {
                    v = new Vendor();
                    v.setVendorName(vName);
                    vendorRepo.save(v);
                }
                rm.setVendor(v);
                rm.setWeight(parseBigDecimal(getRowVal(r, "weight"), BigDecimal.ZERO));
                rm.setRate(parseBigDecimal(getRowVal(r, "rate"), BigDecimal.ZERO));
                rawMaterialRepo.save(rm);
                break;

            case "vendors":
                Vendor vnd = new Vendor();
                vnd.setVendorName((String) getRowVal(r, "vendorname"));
                vnd.setGstNumber((String) getRowVal(r, "gstnumber"));
                vnd.setMobile((String) getRowVal(r, "mobile"));
                vnd.setAddress((String) getRowVal(r, "address"));
                vendorRepo.save(vnd);
                break;

            case "employees":
                Employee emp = new Employee();
                emp.setEmpName((String) getRowVal(r, "empname"));
                emp.setEmpContact((String) getRowVal(r, "empcontact"));
                emp.setDesignation((String) getRowVal(r, "designation"));
                emp.setAadhaarNo((String) getRowVal(r, "aadhaarno"));
                emp.setBankAccount((String) getRowVal(r, "bankaccount"));
                emp.setSalary(parseBigDecimal(getRowVal(r, "salary"), BigDecimal.ZERO));
                emp.setJoiningDate(parseDate((String) getRowVal(r, "joiningdate")));
                emp.setAddress((String) getRowVal(r, "address"));
                employeeRepo.save(emp);
                break;

            case "machines":
                MachineMaster mm = new MachineMaster();
                mm.setMachineName((String) getRowVal(r, "machinename"));
                mm.setManufacturer((String) getRowVal(r, "manufacturer"));
                mm.setStatus(getRowVal(r, "status") != null ? (String) getRowVal(r, "status") : "Running");
                machineRepo.save(mm);
                break;

            case "expenses":
                Expense exp = new Expense();
                exp.setDate(parseDate((String) getRowVal(r, "date")));
                exp.setCategory((String) getRowVal(r, "category"));
                exp.setAmount(parseBigDecimal(getRowVal(r, "amount"), BigDecimal.ZERO));
                exp.setDescription((String) getRowVal(r, "description"));
                expenseRepo.save(exp);
                break;
        }
    }

    private void updateEntity(String module, Map<String, Object> r) {
        switch (module.toLowerCase()) {
            case "parties": {
                String gst = (String) getRowVal(r, "gstnumber");
                String name = (String) getRowVal(r, "partyname");
                Party p = partyRepo.findAll().stream().filter(pty ->
                        (gst != null && !gst.isEmpty() && gst.equalsIgnoreCase(pty.getGstNumber())) ||
                        (name != null && !name.isEmpty() && name.equalsIgnoreCase(pty.getPartyName()))).findFirst().orElse(null);
                if (p != null) {
                    if (getRowVal(r, "email") != null) p.setEmail((String) getRowVal(r, "email"));
                    if (getRowVal(r, "partycontact") != null) p.setPartyContact((String) getRowVal(r, "partycontact"));
                    if (getRowVal(r, "address") != null) p.setPartyAddress((String) getRowVal(r, "address"));
                    partyRepo.save(p);
                }
                break;
            }
            case "vendors": {
                String name = (String) getRowVal(r, "vendorname");
                Vendor v = vendorRepo.findAll().stream().filter(vnd -> vnd.getVendorName().equalsIgnoreCase(name)).findFirst().orElse(null);
                if (v != null) {
                    if (getRowVal(r, "mobile") != null) v.setMobile((String) getRowVal(r, "mobile"));
                    if (getRowVal(r, "gstnumber") != null) v.setGstNumber((String) getRowVal(r, "gstnumber"));
                    if (getRowVal(r, "address") != null) v.setAddress((String) getRowVal(r, "address"));
                    vendorRepo.save(v);
                }
                break;
            }
            case "employees": {
                String name = (String) getRowVal(r, "empname");
                Employee e = employeeRepo.findAll().stream().filter(emp -> emp.getEmpName().equalsIgnoreCase(name)).findFirst().orElse(null);
                if (e != null) {
                    if (getRowVal(r, "empcontact") != null) e.setEmpContact((String) getRowVal(r, "empcontact"));
                    if (getRowVal(r, "designation") != null) e.setDesignation((String) getRowVal(r, "designation"));
                    if (getRowVal(r, "salary") != null) e.setSalary(parseBigDecimal(getRowVal(r, "salary"), e.getSalary()));
                    if (getRowVal(r, "address") != null) e.setAddress((String) getRowVal(r, "address"));
                    employeeRepo.save(e);
                }
                break;
            }
            case "machines": {
                String name = (String) getRowVal(r, "machinename");
                MachineMaster m = machineRepo.findAll().stream().filter(mach -> mach.getMachineName().equalsIgnoreCase(name)).findFirst().orElse(null);
                if (m != null) {
                    if (getRowVal(r, "manufacturer") != null) m.setManufacturer((String) getRowVal(r, "manufacturer"));
                    if (getRowVal(r, "status") != null) m.setStatus((String) getRowVal(r, "status"));
                    machineRepo.save(m);
                }
                break;
            }
        }
    }

    private void recordImportAudit(String module, int inserted, int updated, int skipped) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth != null ? auth.getName() : "SYSTEM";
            AuditLog logEntry = new AuditLog();
            logEntry.setTableName(module.toUpperCase());
            logEntry.setAction("BULK_EXCEL_IMPORT");
            logEntry.setUsername(username);
            logEntry.setNewValue(String.format("Imported %s: %d inserted, %d updated, %d skipped", module, inserted, updated, skipped));
            auditRepo.save(logEntry);
        } catch (Exception ex) {
            log.warn("Failed to write audit log: {}", ex.getMessage());
        }
    }

    private LocalDate parseDate(String str) {
        if (str == null || str.trim().isEmpty()) return LocalDate.now();
        try {
            return LocalDate.parse(str.trim());
        } catch (Exception e) {
            return LocalDate.now();
        }
    }

    private int parseInt(Object obj, int def) {
        if (obj == null) return def;
        try {
            return (int) Double.parseDouble(obj.toString().trim());
        } catch (Exception e) {
            return def;
        }
    }

    private BigDecimal parseBigDecimal(Object obj, BigDecimal def) {
        if (obj == null) return def;
        try {
            return new BigDecimal(obj.toString().trim());
        } catch (Exception e) {
            return def;
        }
    }

    private List<String> getModuleHeaders(String module) {
        switch (module.toLowerCase()) {
            case "parties":
                return Arrays.asList("Party Name", "GST Number", "Email", "Party Contact", "Address");
            case "production":
            case "ppd":
                return Arrays.asList("Date", "Crate Type", "Shift", "Total Production", "Successful", "Rejected");
            case "inventory":
                return Arrays.asList("Crate Type", "Material Type", "Opening Stock", "Produced Stock", "Sold Stock", "Current Stock");
            case "raw-materials":
                return Arrays.asList("Date", "Material Name", "Vendor Name", "Weight (kg)", "Rate (Rs)");
            case "vendors":
                return Arrays.asList("Vendor Name", "GST Number", "Mobile", "Address");
            case "employees":
                return Arrays.asList("Employee Name", "Contact", "Designation", "Aadhaar No", "Bank Account", "Salary (Rs)", "Joining Date", "Address");
            case "machines":
                return Arrays.asList("Machine Name", "Manufacturer", "Status");
            case "expenses":
                return Arrays.asList("Date", "Category", "Amount", "Description");
            default:
                return Arrays.asList("Code", "Name", "Description", "Value");
        }
    }

    private List<String> getModuleSampleRow(String module) {
        switch (module.toLowerCase()) {
            case "parties":
                return Arrays.asList("Maharashtra Agro Traders", "27AAAAA0000A1Z5", "contact@mahaagro.com", "9822012345", "MIDC Industrial Area, Pune");
            case "production":
            case "ppd":
                return Arrays.asList("2026-08-20", "Apple Crate", "Morning Shift", "1200", "1180", "20");
            case "inventory":
                return Arrays.asList("Apple Crate", "Virgin HDPE", "500", "1200", "800", "900");
            case "raw-materials":
                return Arrays.asList("2026-08-20", "HDPE Granules Grade 50", "Reliance Polymers Ltd", "500.0", "125.50");
            case "vendors":
                return Arrays.asList("Reliance Polymers Ltd", "27BBBBA0000B1Z6", "9890123456", "Turbhe, Navi Mumbai");
            case "employees":
                return Arrays.asList("Ramesh Patil", "9850123456", "Molding Operator", "234567890123", "SBIN0001234 / 30129847120", "22000", "2024-01-15", "Nashik Road, Nashik");
            case "machines":
                return Arrays.asList("Molding Unit Alpha", "Windsor Machines", "Running");
            case "expenses":
                return Arrays.asList("2026-08-20", "Electricity", "45000", "Monthly Factory Power Bill");
            default:
                return Arrays.asList("EX-01", "Sample Record", "Standard Description", "100");
        }
    }
}
