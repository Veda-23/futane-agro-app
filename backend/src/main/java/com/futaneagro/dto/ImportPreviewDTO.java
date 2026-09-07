package com.futaneagro.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ImportPreviewDTO {
    private String module;
    private int totalRows;
    private int validRows;
    private int invalidRows;
    private int duplicateRows;
    private int newRows;
    private List<Map<String, Object>> previewRows = new ArrayList<>();
    private List<RowErrorDTO> errors = new ArrayList<>();

    public ImportPreviewDTO() {}

    public String getModule() {
        return module;
    }

    public void setModule(String module) {
        this.module = module;
    }

    public int getTotalRows() {
        return totalRows;
    }

    public void setTotalRows(int totalRows) {
        this.totalRows = totalRows;
    }

    public int getValidRows() {
        return validRows;
    }

    public void setValidRows(int validRows) {
        this.validRows = validRows;
    }

    public int getInvalidRows() {
        return invalidRows;
    }

    public void setInvalidRows(int invalidRows) {
        this.invalidRows = invalidRows;
    }

    public int getDuplicateRows() {
        return duplicateRows;
    }

    public void setDuplicateRows(int duplicateRows) {
        this.duplicateRows = duplicateRows;
    }

    public int getNewRows() {
        return newRows;
    }

    public void setNewRows(int newRows) {
        this.newRows = newRows;
    }

    public List<Map<String, Object>> getPreviewRows() {
        return previewRows;
    }

    public void setPreviewRows(List<Map<String, Object>> previewRows) {
        this.previewRows = previewRows;
    }

    public List<RowErrorDTO> getErrors() {
        return errors;
    }

    public void setErrors(List<RowErrorDTO> errors) {
        this.errors = errors;
    }

    public static class RowErrorDTO {
        private int rowNumber;
        private String column;
        private String rawValue;
        private String errorMessage;
        private String suggestedFix;

        public RowErrorDTO() {}

        public RowErrorDTO(int rowNumber, String column, String rawValue, String errorMessage, String suggestedFix) {
            this.rowNumber = rowNumber;
            this.column = column;
            this.rawValue = rawValue;
            this.errorMessage = errorMessage;
            this.suggestedFix = suggestedFix;
        }

        public int getRowNumber() {
            return rowNumber;
        }

        public void setRowNumber(int rowNumber) {
            this.rowNumber = rowNumber;
        }

        public String getColumn() {
            return column;
        }

        public void setColumn(String column) {
            this.column = column;
        }

        public String getRawValue() {
            return rawValue;
        }

        public void setRawValue(String rawValue) {
            this.rawValue = rawValue;
        }

        public String getErrorMessage() {
            return errorMessage;
        }

        public void setErrorMessage(String errorMessage) {
            this.errorMessage = errorMessage;
        }

        public String getSuggestedFix() {
            return suggestedFix;
        }

        public void setSuggestedFix(String suggestedFix) {
            this.suggestedFix = suggestedFix;
        }
    }
}
