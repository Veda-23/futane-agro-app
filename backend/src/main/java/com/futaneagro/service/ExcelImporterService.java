package com.futaneagro.service;

import com.futaneagro.entity.Inventory;
import com.futaneagro.entity.Party;
import com.futaneagro.repository.InventoryRepository;
import com.futaneagro.repository.PartyRepository;
import org.apache.poi.ss.usermodel.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileInputStream;
import java.time.LocalDate;

/**
 * Apache POI Excel Workbook Bulk Data Importer Service.
 * <p>
 * Provides robust file ingestion capabilities for legacy and external Microsoft Excel (.xlsx / .xls) spreadsheets:
 * <ul>
 *   <li><b>Inventory Opening Stock:</b> Parses the {@code "Inventory"} worksheet to load crate specifications,
 *       polymer material types, and initial warehouse quantities into {@code t_inv_inventory}.</li>
 *   <li><b>Party Directory:</b> Parses the {@code "Party"} worksheet to upsert customer and supplier records
 *       with business names, addresses, and phone contacts into {@code t_crm_party}.</li>
 * </ul>
 * <p>
 * <b>Cell Evaluation Resilience:</b> Safely handles heterogeneous Apache POI cell types
 * (String, Numeric, Boolean, Blank, and calculated Formulas via {@link Cell#getCachedFormulaResultType()}).
 *
 * @author Futane Agro Core Architecture Team
 */
@Service
public class ExcelImporterService {

    @Autowired
    private InventoryRepository inventoryRepo;

    @Autowired
    private PartyRepository partyRepo;

    /**
     * Ingests crate SKU inventory definitions and opening balance counts from an Excel file on disk.
     *
     * @param filePath absolute path to the uploaded workbook file
     * @throws IllegalArgumentException if the {@code "Inventory"} sheet is missing
     * @throws Exception                if POI fails to open or read the stream
     */
    @Transactional
    public void importInventory(String filePath) throws Exception {
        try (FileInputStream fis = new FileInputStream(new File(filePath));
             Workbook workbook = WorkbookFactory.create(fis)) {
            
            Sheet sheet = workbook.getSheet("Inventory");
            if (sheet == null) {
                for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                    if (workbook.getSheetName(i).equalsIgnoreCase("Inventory")) {
                        sheet = workbook.getSheetAt(i);
                        break;
                    }
                }
            }

            if (sheet == null) {
                throw new IllegalArgumentException("Sheet 'Inventory' not found in the Excel file.");
            }

            int rowCount = 0;
            for (Row row : sheet) {
                if (rowCount == 0) {
                    rowCount++;
                    continue; // Skip header row
                }

                if (row == null || row.getCell(0) == null) {
                    continue;
                }

                String crateType = getStringValue(row.getCell(0));
                if (crateType.isEmpty()) continue;

                String materialType = getStringValue(row.getCell(1));
                int openingStock = (int) getNumericValue(row.getCell(2));

                java.util.Optional<Inventory> existingOpt = inventoryRepo.findByCrateTypeAndMaterialType(crateType, materialType);
                Inventory inv;
                if (existingOpt.isPresent()) {
                    inv = existingOpt.get();
                } else {
                    inv = new Inventory();
                    inv.setCrateType(crateType);
                    inv.setMaterialType(materialType);
                    inv.setProducedStock(0);
                    inv.setSoldStock(0);
                }
                inv.setOpeningStock(openingStock);

                inventoryRepo.save(inv);
                rowCount++;
            }
        }
    }

    /**
     * Ingests party / customer entries from the {@code "Party"} sheet of an uploaded Excel workbook.
     * Performs upsert based on the unique integer {@code partyId}.
     *
     * @param filePath absolute path to the uploaded workbook file
     * @throws IllegalArgumentException if the {@code "Party"} sheet is absent
     * @throws Exception                if POI encounters an I/O or XML parsing fault
     */
    @Transactional
    public void importParty(String filePath) throws Exception {
        try (FileInputStream fis = new FileInputStream(new File(filePath));
             Workbook workbook = WorkbookFactory.create(fis)) {
            
            Sheet sheet = workbook.getSheet("Party");
            if (sheet == null) {
                for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                    if (workbook.getSheetName(i).equalsIgnoreCase("Party")) {
                        sheet = workbook.getSheetAt(i);
                        break;
                    }
                }
            }

            if (sheet == null) {
                throw new IllegalArgumentException("Sheet 'Party' not found in the Excel file.");
            }

            int rowCount = 0;
            for (Row row : sheet) {
                if (rowCount == 0) {
                    rowCount++;
                    continue; // Skip header row
                }

                if (row == null || row.getCell(0) == null) {
                    continue;
                }

                int partyId = (int) getNumericValue(row.getCell(0));
                String partyName = getStringValue(row.getCell(1));
                if (partyName.isEmpty()) continue;

                String partyAddress = getStringValue(row.getCell(2));
                String partyContact = getStringValue(row.getCell(3));

                java.util.Optional<Party> existingOpt = partyRepo.findByPartyId(partyId);
                Party party;
                if (existingOpt.isPresent()) {
                    party = existingOpt.get();
                } else {
                    party = new Party();
                    party.setPartyId(partyId);
                    party.setCreatedDate(LocalDate.now());
                }
                party.setPartyName(partyName);
                party.setPartyAddress(partyAddress);
                party.setPartyContact(partyContact);
                party.setIsActive(true);

                partyRepo.save(party);
                rowCount++;
            }
        }
    }

    /**
     * Safely reads cell content as a trimmed string, handling numeric conversion, formulas, and booleans.
     *
     * @param cell the Apache POI cell to inspect
     * @return clean string value or empty string if null or blank
     */
    private String getStringValue(Cell cell) {
        if (cell == null) {
            return "";
        }
        CellType type = cell.getCellType();
        if (type == CellType.FORMULA) {
            type = cell.getCachedFormulaResultType();
        }

        switch (type) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                double val = cell.getNumericCellValue();
                if (val == (long) val) {
                    return String.valueOf((long) val);
                } else {
                    return String.valueOf(val);
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case BLANK:
            default:
                return "";
        }
    }

    /**
     * Safely extracts numeric values from a cell, parsing string digits or formula numbers.
     *
     * @param cell the Apache POI cell to inspect
     * @return double precision numerical value or 0.0 on blank/unparseable values
     */
    private double getNumericValue(Cell cell) {
        if (cell == null) {
            return 0.0;
        }
        CellType type = cell.getCellType();
        if (type == CellType.FORMULA) {
            type = cell.getCachedFormulaResultType();
        }

        switch (type) {
            case NUMERIC:
                return cell.getNumericCellValue();
            case STRING:
                try {
                    return Double.parseDouble(cell.getStringCellValue().trim());
                } catch (NumberFormatException e) {
                    return 0.0;
                }
            case BOOLEAN:
                return cell.getBooleanCellValue() ? 1.0 : 0.0;
            case BLANK:
            default:
                return 0.0;
        }
    }
}

