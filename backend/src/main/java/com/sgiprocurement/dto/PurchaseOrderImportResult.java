package com.sgiprocurement.dto;

import java.util.ArrayList;
import java.util.List;

public class PurchaseOrderImportResult {
    private int totalRows;
    private int totalOrders;
    private int successCount;
    private int errorCount;
    private List<String> errors = new ArrayList<>();

    public PurchaseOrderImportResult() {}

    public int getTotalRows() { return totalRows; }
    public void setTotalRows(int totalRows) { this.totalRows = totalRows; }

    public int getTotalOrders() { return totalOrders; }
    public void setTotalOrders(int totalOrders) { this.totalOrders = totalOrders; }

    public int getSuccessCount() { return successCount; }
    public void setSuccessCount(int successCount) { this.successCount = successCount; }

    public int getErrorCount() { return errorCount; }
    public void setErrorCount(int errorCount) { this.errorCount = errorCount; }

    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }

    public void addError(String error) { this.errors.add(error); }
}
