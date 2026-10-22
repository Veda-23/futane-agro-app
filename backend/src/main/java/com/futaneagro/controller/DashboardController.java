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

/**
 * <h3>Dashboard & Analytics REST Controller</h3>
 * <p>
 * Central analytics engine serving executive KPIs, operational metrics, interactive visual charts,
 * and bulk spreadsheet imports for the Futane Agro ERP system.
 * </p>
 *
 * <h4>Core Responsibilities:</h4>
 * <ul>
 *   <li><b>Ultra-Fast SQL Aggregations:</b> Offloads mathematical aggregations (sums, counts) directly
 *       to PostgreSQL indexed queries rather than loading in-memory JPA collections.</li>
 *   <li><b>Performance Caching:</b> Protects database performance under high user concurrency using
 *       Spring Cache ({@code "dashboard_stats"} and {@code "dashboard_charts"}).</li>
 *   <li><b>Cross-Module Metrics Synthesis:</b> Unifies data from Production (PPD), Commercial Sales,
 *       Finished Inventory, Raw Materials, Logistics (Transport), and HR Payroll.</li>
 *   <li><b>Secure Bulk Excel Import:</b> Validates file signatures, file extensions, size limits (10MB),
 *       and executes OWASP-safe temporary staging for initial data onboarding.</li>
 * </ul>
 *
 * @author Futane Agro Core Engineering
 * @version 2.0
 */
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

    /**
     * <b>GET /api/dashboard/stats</b> - Computes high-level KPI metrics for the executive overview.
     * <p>
     * <b>How it works:</b>
     * <ol>
     *   <li>Retrieves cached result from {@code "dashboard_stats"} cache if available.</li>
     *   <li>Queries {@code ppdRepository.sumSuccessfulByDate(today)} for today's successful crate output.</li>
     *   <li>Queries {@code ppdRepository.sumSuccessfulByYearAndMonth(...)} for cumulative monthly production.</li>
     *   <li>Sums commercial turnover via {@code salesRepository.sumTotalAmount()}.</li>
     *   <li>Sums outstanding customer receivables via {@code salesRepository.sumRemainingAmount()}.</li>
     *   <li>Sums finished crate stocks across all warehouse SKUs via {@code inventoryRepository.sumCurrentStock()}.</li>
     *   <li>Sums raw material weight (kg/tons) via {@code rawMaterialRepository.sumTotalWeight()}.</li>
     *   <li>Retrieves active workforce headcount via {@code employeeRepository.count()}.</li>
     *   <li>Aggregates logistics expenses via {@code transportRepository.sumTotalRent()}.</li>
     *   <li>Aggregates raw material procurement costs via {@code rawMaterialRepository.sumTotalAmount()}.</li>
     *   <li>Aggregates employee payroll disbursements via {@code employeeSalaryRepository.sumTotalSalaryAmount()}.</li>
     * </ol>
     * </p>
     * <p>
     * <b>Used for:</b> The main dashboard metric cards, P&L (Profit and Loss) summary calculation,
     * and high-level health indicators.
     * </p>
     *
     * @return 200 OK with key-value map of system financial, production, and stock indicators
     */
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

    /**
     * <b>GET /api/dashboard/charts</b> - Synthesizes time-series and categorical datasets for dashboard charts.
     * <p>
     * <b>How it works:</b>
     * <ol>
     *   <li>Checks and serves from {@code "dashboard_charts"} cache when available.</li>
     *   <li><b>Production Bar Chart:</b> Groups production runs by calendar month name, retaining current
     *       month and active production periods.</li>
     *   <li><b>Sales Growth Line Chart:</b> Groups sales transactions by ISO date string in a naturally
     *       sorted {@link TreeMap}, computing daily cumulative revenue.</li>
     *   <li><b>Top Customers Pie Chart:</b> Groups sales revenue by party name, identifying highest
     *       volume buyers/dealers.</li>
     * </ol>
     * </p>
     * <p>
     * <b>Used for:</b> Visual rendering in Angular Chart.js / ApexCharts components on the executive dashboard.
     * </p>
     *
     * @return 200 OK with grouped series maps for production, sales growth, and customer distribution
     */
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

    /**
     * <b>POST /api/dashboard/import</b> - Administrative endpoint to import legacy Excel workbook data.
     * <p>
     * <b>Security & Validation Guardrails:</b>
     * <ul>
     *   <li>Requires {@code SUPER_ADMIN} or {@code ADMIN} role authority.</li>
     *   <li>Enforces extension verification (.xlsx / .xls) and 10MB file size ceiling.</li>
     *   <li>Runs deep validation via {@link com.futaneagro.security.FileSecurityService} to detect corrupted
     *       or malicious payloads before parsing.</li>
     *   <li>Generates collision-safe isolated temporary file on disk, avoiding path traversal risks.</li>
     *   <li>Guarantees immediate deletion of temporary file in {@code finally} block.</li>
     *   <li>Evicts {@code "dashboard_stats"} and {@code "dashboard_charts"} caches upon success.</li>
     * </ul>
     * </p>
     * <p>
     * <b>Used for:</b> One-click initial system bootstrapping from historical spreadsheets (Parties and Inventory).
     * </p>
     *
     * @param file Uploaded multipart Excel file
     * @return 200 OK on successful parsing and database ingestion, 400 Bad Request on validation error,
     *         or 500 on internal parsing exception
     */
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


