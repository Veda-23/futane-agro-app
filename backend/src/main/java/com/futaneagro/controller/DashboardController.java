package com.futaneagro.controller;

import com.futaneagro.entity.*;
import com.futaneagro.repository.*;
import com.futaneagro.service.ExcelImporterService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;

import java.io.File;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private static final Logger log = LoggerFactory.getLogger(DashboardController.class);

    @Autowired
    private PpdRepository ppdRepository;

    @Autowired
    private SalesRepository salesRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private RawMaterialRepository rawMaterialRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private EmployeeSalaryRepository employeeSalaryRepository;

    @Autowired
    private TransportRepository transportRepository;

    @Autowired
    private ExcelImporterService excelImporterService;

    @Autowired
    private com.futaneagro.security.FileSecurityService fileSecurityService;

    @GetMapping("/stats")
    @Cacheable("dashboard_stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();

        // 1. Today's Production (Ultra-fast direct SQL SUM)
        LocalDate today = LocalDate.now();
        Integer todayProduction = ppdRepository.sumSuccessfulByDate(today);
        stats.put("todayProduction", todayProduction != null ? todayProduction : 0);

        // 2. Monthly Production (Direct SQL SUM by year and month)
        Integer monthlyProduction = ppdRepository.sumSuccessfulByYearAndMonth(today.getYear(), today.getMonthValue());
        stats.put("monthlyProduction", monthlyProduction != null ? monthlyProduction : 0);

        // 3. Total Sales (Direct SQL SUM)
        BigDecimal totalSales = salesRepository.sumTotalAmount();
        stats.put("totalSales", totalSales != null ? totalSales : BigDecimal.ZERO);
        stats.put("totalSalesAmount", totalSales != null ? totalSales : BigDecimal.ZERO); // Match frontend P&L expected key

        // 4. Pending Amount (Direct SQL SUM)
        BigDecimal pendingAmount = salesRepository.sumRemainingAmount();
        stats.put("pendingAmount", pendingAmount != null ? pendingAmount : BigDecimal.ZERO);

        // 5. Inventory Stock (Direct SQL SUM)
        Integer inventoryStock = inventoryRepository.sumCurrentStock();
        stats.put("inventoryStock", inventoryStock != null ? inventoryStock : 0);

        // 6. Raw Material Stock (Direct SQL SUM)
        BigDecimal rawMaterialStock = rawMaterialRepository.sumTotalWeight();
        stats.put("rawMaterialStock", rawMaterialStock != null ? rawMaterialStock : BigDecimal.ZERO);

        // 7. Employee Count (Direct SQL COUNT)
        long employeeCount = employeeRepository.count();
        stats.put("employeeCount", employeeCount);

        // 8. Transport Cost (Direct SQL SUM)
        BigDecimal transportCost = transportRepository.sumTotalRent();
        stats.put("transportCost", transportCost != null ? transportCost : BigDecimal.ZERO);
        stats.put("totalTransportCost", transportCost != null ? transportCost : BigDecimal.ZERO); // Match frontend P&L expected key

        // 9. Total Raw Material Cost (Direct SQL SUM)
        BigDecimal totalRawMaterialCost = rawMaterialRepository.sumTotalAmount();
        stats.put("totalRawMaterialCost", totalRawMaterialCost != null ? totalRawMaterialCost : BigDecimal.ZERO);

        // 10. Total Salaries (Direct SQL SUM)
        BigDecimal totalSalaries = employeeSalaryRepository.sumTotalSalaryAmount();
        stats.put("totalSalaries", totalSalaries != null ? totalSalaries : BigDecimal.ZERO);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/charts")
    @Cacheable("dashboard_charts")
    public ResponseEntity<Map<String, Object>> getCharts() {
        Map<String, Object> charts = new HashMap<>();

        // Production Bar Chart: Group production by month name
        List<Ppd> productions = ppdRepository.findAll();
        Map<String, Integer> prodByMonth = new LinkedHashMap<>();
        // Seed last few months or standard months
        String[] months = {"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"};
        for (String m : months) {
            prodByMonth.put(m, 0);
        }
        for (Ppd p : productions) {
            if (p.getDate() != null) {
                String mName = p.getDate().getMonth().name();
                mName = mName.substring(0, 1) + mName.substring(1).toLowerCase();
                prodByMonth.put(mName, prodByMonth.getOrDefault(mName, 0) + p.getSuccessful());
            }
        }
        // Filter out zero months to make the chart look nice, but keep current month
        prodByMonth.entrySet().removeIf(entry -> entry.getValue() == 0 && !entry.getKey().equalsIgnoreCase(LocalDate.now().getMonth().name()));
        charts.put("productionData", prodByMonth);

        // Sales Growth Line Chart: sales total by date
        List<Sales> sales = salesRepository.findAll();
        Map<String, BigDecimal> salesByDate = sales.stream()
                .collect(Collectors.groupingBy(
                        s -> s.getDate().toString(),
                        TreeMap::new,
                        Collectors.mapping(Sales::getTotalAmount, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                ));
        charts.put("salesGrowthData", salesByDate);

        // Top Customers Pie Chart: sales volume by Party
        Map<String, BigDecimal> salesByParty = sales.stream()
                .collect(Collectors.groupingBy(
                        s -> s.getParty().getPartyName(),
                        Collectors.mapping(Sales::getTotalAmount, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                ));
        charts.put("topCustomersData", salesByParty);

        return ResponseEntity.ok(charts);
    }

    @PostMapping("/import")
    @CacheEvict(value = {"dashboard_stats", "dashboard_charts"}, allEntries = true)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<String> importExcel(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("Please upload a file.");
        }
        String orig = file.getOriginalFilename();
        if (orig == null) {
            return ResponseEntity.badRequest().body("Invalid file name.");
        }
        String origLower = orig.toLowerCase();
        if (!origLower.endsWith(".xlsx") && !origLower.endsWith(".xls")) {
            return ResponseEntity.badRequest().body("Only Excel spreadsheet files (.xlsx, .xls) are allowed.");
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            return ResponseEntity.badRequest().body("File size exceeds 10MB limit.");
        }

        com.futaneagro.security.FileSecurityService.FileValidationResult validation = fileSecurityService.validate(file);
        if (!validation.valid) {
            return ResponseEntity.badRequest().body("File validation failed: " + validation.error);
        }

        File tempFile = null;
        try {
            // Secure temp file creation: do not use unvalidated user input in filename
            String ext = origLower.endsWith(".xlsx") ? ".xlsx" : ".xls";
            tempFile = File.createTempFile("dashboard-upload-", ext);
            file.transferTo(tempFile);

            // Run imports
            excelImporterService.importParty(tempFile.getAbsolutePath());
            excelImporterService.importInventory(tempFile.getAbsolutePath());

            return ResponseEntity.ok("Data imported successfully.");
        } catch (Exception e) {
            log.error("Dashboard file import failed: type={}", e.getClass().getSimpleName(), e);
            return ResponseEntity.status(500).body("Error importing file. Please verify the file format and try again.");
        } finally {
            if (tempFile != null && tempFile.exists()) {
                tempFile.delete();
            }
        }
    }
}

