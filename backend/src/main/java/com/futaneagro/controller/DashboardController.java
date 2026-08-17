package com.futaneagro.controller;

import com.futaneagro.entity.*;
import com.futaneagro.repository.*;
import com.futaneagro.service.ExcelImporterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

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

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();

        // 1. Today's Production
        LocalDate today = LocalDate.now();
        int todayProduction = ppdRepository.findAll().stream()
                .filter(p -> today.equals(p.getDate()))
                .mapToInt(Ppd::getSuccessful)
                .sum();
        stats.put("todayProduction", todayProduction);

        // 2. Monthly Production
        int monthlyProduction = ppdRepository.findAll().stream()
                .filter(p -> p.getDate() != null && p.getDate().getMonth() == today.getMonth() && p.getDate().getYear() == today.getYear())
                .mapToInt(Ppd::getSuccessful)
                .sum();
        stats.put("monthlyProduction", monthlyProduction);

        // 3. Total Sales
        BigDecimal totalSales = salesRepository.findAll().stream()
                .map(Sales::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("totalSales", totalSales);
        stats.put("totalSalesAmount", totalSales); // Match frontend P&L expected key

        // 4. Pending Amount
        BigDecimal pendingAmount = salesRepository.findAll().stream()
                .map(Sales::getRemaining)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("pendingAmount", pendingAmount);

        // 5. Inventory Stock (total current_stock in Inventory)
        int inventoryStock = inventoryRepository.findAll().stream()
                .mapToInt(Inventory::getCurrentStock)
                .sum();
        stats.put("inventoryStock", inventoryStock);

        // 6. Raw Material Stock (total weight purchased)
        BigDecimal rawMaterialStock = rawMaterialRepository.findAll().stream()
                .map(RawMaterial::getWeight)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("rawMaterialStock", rawMaterialStock);

        // 7. Employee Count
        long employeeCount = employeeRepository.count();
        stats.put("employeeCount", employeeCount);

        // 8. Transport Cost
        BigDecimal transportCost = transportRepository.findAll().stream()
                .map(Transport::getRent)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("transportCost", transportCost);
        stats.put("totalTransportCost", transportCost); // Match frontend P&L expected key

        // 9. Total Raw Material Cost
        BigDecimal totalRawMaterialCost = rawMaterialRepository.findAll().stream()
                .map(p -> p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("totalRawMaterialCost", totalRawMaterialCost);

        // 10. Total Salaries
        BigDecimal totalSalaries = employeeSalaryRepository.findAll().stream()
                .map(p -> p.getSalaryAmount() != null ? p.getSalaryAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("totalSalaries", totalSalaries);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/charts")
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
    public ResponseEntity<String> importExcel(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Please upload a file.");
        }
        try {
            // Save to temp file
            File tempFile = File.createTempFile("upload-", file.getOriginalFilename());
            file.transferTo(tempFile);

            // Run imports
            excelImporterService.importParty(tempFile.getAbsolutePath());
            excelImporterService.importInventory(tempFile.getAbsolutePath());

            // Delete temp file
            tempFile.delete();

            return ResponseEntity.ok("Data imported successfully.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error importing file: " + e.getMessage());
        }
    }
}

