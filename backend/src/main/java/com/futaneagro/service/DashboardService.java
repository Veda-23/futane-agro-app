package com.futaneagro.service;

import com.futaneagro.entity.Ppd;
import com.futaneagro.entity.Sales;
import com.futaneagro.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class DashboardService {

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

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();

        // 1. Today's Production
        LocalDate today = LocalDate.now();
        Integer todayProduction = ppdRepository.sumSuccessfulByDate(today);
        stats.put("todayProduction", todayProduction);

        // 2. Monthly Production
        Integer monthlyProduction = ppdRepository.sumSuccessfulByMonthAndYear(today.getMonthValue(), today.getYear());
        stats.put("monthlyProduction", monthlyProduction);

        // 3. Total Sales
        BigDecimal totalSales = salesRepository.sumTotalSales();
        stats.put("totalSales", totalSales);
        stats.put("totalSalesAmount", totalSales); // Match frontend P&L expected key

        // 4. Pending Amount
        BigDecimal pendingAmount = salesRepository.sumTotalPendingAmount();
        stats.put("pendingAmount", pendingAmount);

        // 5. Inventory Stock (total current_stock in Inventory)
        Integer inventoryStock = inventoryRepository.sumTotalStock();
        stats.put("inventoryStock", inventoryStock);

        // 6. Raw Material Stock (total weight purchased)
        BigDecimal rawMaterialStock = rawMaterialRepository.sumTotalWeight();
        stats.put("rawMaterialStock", rawMaterialStock);

        // 7. Employee Count
        long employeeCount = employeeRepository.count();
        stats.put("employeeCount", employeeCount);

        // 8. Transport Cost
        BigDecimal transportCost = transportRepository.sumTotalRent();
        stats.put("transportCost", transportCost);
        stats.put("totalTransportCost", transportCost); // Match frontend P&L expected key

        // 9. Total Raw Material Cost
        BigDecimal totalRawMaterialCost = rawMaterialRepository.sumTotalAmount();
        stats.put("totalRawMaterialCost", totalRawMaterialCost);

        // 10. Total Salaries
        BigDecimal totalSalaries = employeeSalaryRepository.sumTotalSalaries();
        stats.put("totalSalaries", totalSalaries);

        return stats;
    }

    public Map<String, Object> getCharts() {
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

        return charts;
    }
}
