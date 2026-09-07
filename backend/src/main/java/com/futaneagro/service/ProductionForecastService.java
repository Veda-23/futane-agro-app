package com.futaneagro.service;

import com.futaneagro.entity.Ppd;
import com.futaneagro.entity.Ppm;
import com.futaneagro.repository.PpdRepository;
import com.futaneagro.repository.PpmRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProductionForecastService {

    @Autowired
    private PpdRepository ppdRepository;

    @Autowired
    private PpmRepository ppmRepository;

    // --- Simple Moving Average for demand forecasting ---
    public Map<String, Object> forecastDemand(int monthsAhead) {
        List<Ppm> history = ppmRepository.findAll();
        if (history.isEmpty()) {
            return createEmptyForecast();
        }

        List<Integer> sortedYears = history.stream()
            .map(Ppm::getYear)
            .distinct()
            .sorted()
            .collect(Collectors.toList());

        // Group by year-month
        Map<String, Integer> monthlyData = new LinkedHashMap<>();
        for (Ppm p : history) {
            String key = p.getYear() + "-" + p.getMonth();
            monthlyData.put(key, p.getCratesProduced());
        }

        // Calculate moving average (last 6 months or available)
        int windowSize = Math.min(6, monthlyData.size());
        List<Integer> values = new ArrayList<>(monthlyData.values());
        int sum = 0;
        for (int i = values.size() - windowSize; i < values.size(); i++) {
            sum += values.get(i);
        }
        double avg = (double) sum / windowSize;

        // Simple linear trend
        double trend = calculateTrend(values);

        // Generate forecast
        List<Map<String, Object>> forecasts = new ArrayList<>();
        String[] months = {"January","February","March","April","May","June","July","August","September","October","November","December"};
        int currentMonth = LocalDate.now().getMonthValue();
        int currentYear = LocalDate.now().getYear();

        for (int i = 1; i <= monthsAhead; i++) {
            int targetMonth = currentMonth + i;
            int targetYear = currentYear;
            if (targetMonth > 12) {
                targetMonth -= 12;
                targetYear++;
            }
            double forecast = Math.max(0, avg + (trend * i));
            Map<String, Object> fc = new HashMap<>();
            fc.put("month", months[targetMonth - 1]);
            fc.put("year", targetYear);
            fc.put("predictedCrates", Math.round(forecast));
            fc.put("confidence", getConfidence(windowSize));
            forecasts.add(fc);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("historicalAvg", avg);
        result.put("trend", trend);
        result.put("windowSize", windowSize);
        result.put("forecasts", forecasts);
        return result;
    }

    // --- Shift optimization based on historical efficiency ---
    public Map<String, Object> getShiftOptimization() {
        List<Ppd> dailyData = ppdRepository.findAll();
        if (dailyData.isEmpty()) {
            return createEmptyShiftOptimization();
        }

        // Group by shift
        Map<String, List<Ppd>> byShift = dailyData.stream()
            .collect(Collectors.groupingBy(Ppd::getShift));

        List<Map<String, Object>> shiftStats = new ArrayList<>();
        for (Map.Entry<String, List<Ppd>> entry : byShift.entrySet()) {
            List<Ppd> shiftRecords = entry.getValue();
            int totalSuccess = shiftRecords.stream().mapToInt(Ppd::getSuccessful).sum();
            int totalProd = shiftRecords.stream().mapToInt(Ppd::getTotalProduction).sum();
            double efficiency = totalProd > 0 ? (totalProd > 0 ? (double) totalSuccess / totalProd * 100 : 0) : 0;

            Map<String, Object> stats = new HashMap<>();
            stats.put("shift", entry.getKey());
            stats.put("totalRecords", shiftRecords.size());
            stats.put("totalProduction", totalProd);
            stats.put("efficiency", Math.round(efficiency * 100.0) / 100.0);
            stats.put("avgDaily", totalProd / shiftRecords.size());
            shiftStats.add(stats);
        }

        // Sort by efficiency
        shiftStats.sort((a, b) -> Double.compare((Double) b.get("efficiency"), (Double) a.get("efficiency")));

        Map<String, Object> result = new HashMap<>();
        result.put("shifts", shiftStats);
        result.put("bestShift", shiftStats.isEmpty() ? "N/A" : shiftStats.get(0).get("shift"));
        result.put("recommendation", generateShiftRecommendation(shiftStats));
        return result;
    }

    // --- Electricity efficiency analysis ---
    public Map<String, Object> getElectricityAnalysis() {
        List<Ppm> monthlyData = ppmRepository.findAll();
        if (monthlyData.isEmpty()) {
            return createEmptyElectricityAnalysis();
        }

        double totalUnits = 0;
        int totalCrates = 0;
        double maxUnits = 0;
        String maxMonth = "";
        double minUnits = Double.MAX_VALUE;
        String minMonth = "";

        for (Ppm p : monthlyData) {
            double units = p.getElectricityUnits() != null ? p.getElectricityUnits().doubleValue() : 0;
            int crates = p.getCratesProduced();
            totalUnits += units;
            totalCrates += crates;
            if (units > maxUnits) { maxUnits = units; maxMonth = p.getMonth() + "/" + p.getYear(); }
            if (units < minUnits && units > 0) { minUnits = units; minMonth = p.getMonth() + "/" + p.getYear(); }
        }

        double avgUnitsPerCrate = totalCrates > 0 ? totalUnits / totalCrates : 0;

        Map<String, Object> result = new HashMap<>();
        result.put("avgUnitsPerCrate", Math.round(avgUnitsPerCrate * 100.0) / 100.0);
        result.put("totalUnitsAnalyzed", Math.round(totalUnits));
        result.put("monthsAnalyzed", monthlyData.size());
        result.put("worstMonth", maxMonth);
        result.put("worstUnits", Math.round(maxUnits));
        result.put("bestMonth", minMonth);
        result.put("bestUnits", Math.round(minUnits));
        result.put("recommendation", generateElectricityRecommendation(avgUnitsPerCrate));
        return result;
    }

    // --- Material requirement prediction ---
    public Map<String, Object> predictMaterialRequirements() {
        List<Ppd> dailyData = ppdRepository.findAll();
        if (dailyData.isEmpty()) {
            return createEmptyMaterialPrediction();
        }

        // Group by crate type
        Map<String, List<Ppd>> byType = dailyData.stream()
            .collect(Collectors.groupingBy(Ppd::getCrateType));

        List<Map<String, Object>> predictions = new ArrayList<>();
        for (Map.Entry<String, List<Ppd>> entry : byType.entrySet()) {
            List<Ppd> records = entry.getValue();
            int totalProduction = records.stream().mapToInt(Ppd::getTotalProduction).sum();
            int avgDaily = records.size() > 0 ? totalProduction / records.size() : 0;

            // Rejection rate
            int totalSuccess = records.stream().mapToInt(Ppd::getSuccessful).sum();
            double rejectionRate = totalProduction > 0 ? (1 - (double) totalSuccess / totalProduction) * 100 : 0;

            Map<String, Object> pred = new HashMap<>();
            pred.put("crateType", entry.getKey());
            pred.put("totalProduced", totalProduction);
            pred.put("avgDailyProduction", avgDaily);
            pred.put("rejectionRate", Math.round(rejectionRate * 100.0) / 100.0);
            pred.put("materialRequiredKg", avgDaily * 0.5); // Assuming 0.5kg plastic per crate
            pred.put("nextWeekRequirement", avgDaily * 7);
            predictions.add(pred);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("predictions", predictions);
        result.put("lowStockAlert", generateLowStockAlert(predictions));
        return result;
    }

    // --- Efficiency trend analysis ---
    public Map<String, Object> getEfficiencyTrend() {
        List<Ppd> dailyData = ppdRepository.findAll();
        if (dailyData.isEmpty()) {
            return createEmptyEfficiencyTrend();
        }

        // Group by date
        Map<LocalDate, List<Ppd>> byDate = dailyData.stream()
            .filter(p -> p.getDate() != null)
            .collect(Collectors.groupingBy(Ppd::getDate));

        List<Map<String, Object>> trend = new ArrayList<>();
        for (Map.Entry<LocalDate, List<Ppd>> entry : byDate.entrySet()) {
            int totalSuccess = entry.getValue().stream().mapToInt(Ppd::getSuccessful).sum();
            int totalProd = entry.getValue().stream().mapToInt(Ppd::getTotalProduction).sum();
            double efficiency = totalProd > 0 ? (double) totalSuccess / totalProd * 100 : 0;

            Map<String, Object> day = new HashMap<>();
            day.put("date", entry.getKey().toString());
            day.put("efficiency", Math.round(efficiency * 100.0) / 100.0);
            day.put("totalProduction", totalProd);
            trend.add(day);
        }

        // Sort by date
        trend.sort(Comparator.comparing(m -> (String) m.get("date")));

        // Calculate overall stats
        double avgEff = trend.stream().mapToDouble(m -> (Double) m.get("efficiency")).average().orElse(0);
        double maxEff = trend.stream().mapToDouble(m -> (Double) m.get("efficiency")).max().orElse(0);
        double minEff = trend.stream().mapToDouble(m -> (Double) m.get("efficiency")).min().orElse(0);

        Map<String, Object> result = new HashMap<>();
        result.put("dailyTrend", trend);
        result.put("averageEfficiency", Math.round(avgEff * 100.0) / 100.0);
        result.put("maxEfficiency", Math.round(maxEff * 100.0) / 100.0);
        result.put("minEfficiency", Math.round(minEff * 100.0) / 100.0);
        result.put("status", getEfficiencyStatus(avgEff));
        return result;
    }

    // Scheduled job to check for low stock and alert
    @Scheduled(cron = "0 0 8 * * ?") // Run daily at 8 AM
    public void checkMaterialRequirements() {
        Map<String, Object> prediction = predictMaterialRequirements();
        @SuppressWarnings("unchecked")
        List<String> alerts = (List<String>) prediction.get("lowStockAlert");
        if (alerts != null && !alerts.isEmpty()) {
            System.out.println("[ProductionForecast] Material Alerts: " + alerts);
            // TODO: Integrate with NotificationBroadcastService for real alerts
        }
    }

    // Helper methods
    private double calculateTrend(List<Integer> values) {
        if (values.size() < 2) return 0;
        int n = values.size();
        double sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (int i = 0; i < n; i++) {
            sumX += i;
            sumY += values.get(i);
            sumXY += i * values.get(i);
            sumXX += i * i;
        }
        double slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        return Double.isNaN(slope) ? 0 : slope;
    }

    private double getConfidence(int windowSize) {
        if (windowSize >= 12) return 0.9;
        if (windowSize >= 6) return 0.75;
        if (windowSize >= 3) return 0.6;
        return 0.4;
    }

    private String generateShiftRecommendation(List<Map<String, Object>> shiftStats) {
        if (shiftStats.isEmpty()) return "No data available for recommendations.";
        Map<String, Object> best = shiftStats.get(0);
        double bestEff = (Double) best.get("efficiency");
        Map<String, Object> worst = shiftStats.get(shiftStats.size() - 1);
        double worstEff = (Double) worst.get("efficiency");

        if (bestEff - worstEff > 10) {
            return "Consider reviewing the " + worst.get("shift") + " operations. " +
                   "It shows " + Math.round(bestEff - worstEff) + "% lower efficiency than " + best.get("shift") + ".";
        }
        return "All shifts are performing within acceptable range.";
    }

    private String generateElectricityRecommendation(double avgUnitsPerCrate) {
        if (avgUnitsPerCrate > 2.0) {
            return "High energy consumption detected. Consider equipment maintenance or process optimization.";
        }
        if (avgUnitsPerCrate > 1.5) {
            return "Moderate energy usage. Room for improvement through better scheduling.";
        }
        return "Excellent energy efficiency! Keep up the good practices.";
    }

    private List<String> generateLowStockAlert(List<Map<String, Object>> predictions) {
        List<String> alerts = new ArrayList<>();
        for (Map<String, Object> pred : predictions) {
            int nextWeek = (Integer) pred.get("nextWeekRequirement");
            if (nextWeek > 1000) {
                alerts.add("High demand for " + pred.get("crateType") + ": " + nextWeek + " crates expected next week.");
            }
        }
        return alerts;
    }

    private String getEfficiencyStatus(double avg) {
        if (avg >= 90) return "Excellent";
        if (avg >= 80) return "Good";
        if (avg >= 70) return "Average";
        return "Needs Improvement";
    }

    private Map<String, Object> createEmptyForecast() {
        Map<String, Object> result = new HashMap<>();
        result.put("historicalAvg", 0);
        result.put("trend", 0);
        result.put("windowSize", 0);
        result.put("forecasts", Collections.emptyList());
        result.put("message", "Not enough historical data for forecasting.");
        return result;
    }

    private Map<String, Object> createEmptyShiftOptimization() {
        Map<String, Object> result = new HashMap<>();
        result.put("shifts", Collections.emptyList());
        result.put("bestShift", "N/A");
        result.put("recommendation", "No production data available.");
        return result;
    }

    private Map<String, Object> createEmptyElectricityAnalysis() {
        Map<String, Object> result = new HashMap<>();
        result.put("avgUnitsPerCrate", 0);
        result.put("recommendation", "No electricity data available.");
        return result;
    }

    private Map<String, Object> createEmptyMaterialPrediction() {
        Map<String, Object> result = new HashMap<>();
        result.put("predictions", Collections.emptyList());
        result.put("lowStockAlert", Collections.emptyList());
        return result;
    }

    private Map<String, Object> createEmptyEfficiencyTrend() {
        Map<String, Object> result = new HashMap<>();
        result.put("dailyTrend", Collections.emptyList());
        result.put("averageEfficiency", 0);
        result.put("status", "No Data");
        return result;
    }
}
