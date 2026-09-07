package com.futaneagro.dto;

import java.util.List;
import java.util.Map;

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
