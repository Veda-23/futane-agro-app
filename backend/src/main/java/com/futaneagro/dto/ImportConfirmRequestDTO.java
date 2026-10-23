package com.futaneagro.dto;

import java.util.List;
import java.util.Map;

/**
 * <h1>ImportConfirmRequestDTO (Universal Data Importer Stage-2 Execution Request DTO)</h1>
 * <p>
 * Carries confirmed data rows along with conflict resolution strategy ({@code "UPDATE"} or {@code "SKIP"})
 * to execute bulk inserts and updates within transactional batch boundaries.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
public class ImportConfirmRequestDTO {
    private String module;
    private String duplicateStrategy = "UPDATE"; // "UPDATE" or "SKIP"
    private List<Map<String, Object>> rows;

    public ImportConfirmRequestDTO() {}

    public String getModule() {
        return module;
    }

    public void setModule(String module) {
        this.module = module;
    }

    public String getDuplicateStrategy() {
        return duplicateStrategy;
    }

    public void setDuplicateStrategy(String duplicateStrategy) {
        this.duplicateStrategy = duplicateStrategy;
    }

    public List<Map<String, Object>> getRows() {
        return rows;
    }

    public void setRows(List<Map<String, Object>> rows) {
        this.rows = rows;
    }
}
