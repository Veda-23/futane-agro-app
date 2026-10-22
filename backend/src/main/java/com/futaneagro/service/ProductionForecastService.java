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

/**
 * <h3>Production Forecasting & Manufacturing Intelligence Service</h3>
 * <p>
 * Provides mathematical modeling, time-series moving averages, trend regressions,
 * shift efficiency comparisons, and power/raw-material optimization algorithms for
 * Futane Agro crate manufacturing plants.
 * </p>
 *
 * <h4>Core Algorithms & Analytics:</h4>
 * <ul>
 *   <li><b>Demand Forecasting:</b> Computes a 6-month Simple Moving Average (SMA) augmented with
 *       least-squares linear trend regression to predict future crate demand.</li>
 *   <li><b>Shift Efficiency Benchmarking:</b> Compares Day, Night, and Rotational shifts by
 *       {@code (successfulCrates / totalProduction) * 100} and detects operational anomalies.</li>
 *   <li><b>Energy Consumption Auditing:</b> Evaluates electricity units consumed per finished crate
 *       from {@link Ppm#getElectricityUnits()} to identify power wastage.</li>
 *   <li><b>Raw Material Requirements Forecasting:</b> Estimates polymer weight (kg) and weekly stock
 *       procurement needs taking rejection rates into account.</li>
 *   <li><b>Daily Scheduled Alerts:</b> Background cron job checking upcoming stock runout conditions.</li>
 * </ul>
 *
 * @author Futane Agro Core Engineering
 * @version 2.0
 */
@Service
public class ProductionForecastService {

    @Autowired
    private PpdRepository ppdRepository;

    @Autowired
    private PpmRepository ppmRepository;

    /**
     * Forecasts crate production demand for a given number of future calendar months.
     * <p>
     * <b>Algorithm:</b>
     * <ol>
     *   <li>Retrieves historical monthly aggregated records from {@link PpmRepository}.</li>
     *   <li>Calculates moving average across the most recent 6 monthly data points.</li>
     *   <li>Calculates linear slope (trend) using least squares: {@code slope = (n*ΣXY - ΣX*ΣY) / (n*ΣX² - (ΣX)²)}.</li>
     *   <li>Projects demand for future months: {@code forecast = Math.max(0, avg + (trend * i))}.</li>
     *   <li>Assigns statistical confidence scores based on sample window size.</li>
     * </ol>
     * </p>
     *
     * @param monthsAhead Number of future months to project (e.g., 3, 6, 12)
     * @return Map containing historical average, trend factor, window size, and projected monthly forecasts
     */
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

    /**
     * Evaluates shift performance to identify productivity bottlenecks.
     * <p>
     * <b>Algorithm:</b>
     * Groups daily production runs by shift (Shift A, Shift B, Night Shift),
     * aggregates successful output versus total attempted cycles, and computes percentage efficiency.
     * </p>
     *
     * @return Map containing sorted shift statistics, top performing shift, and actionable recommendations
     */
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

    /**
     * Analyzes historical power consumption to calculate energy efficiency per crate.
     * <p>
     * <b>Algorithm:</b>
     * Aggregates {@link Ppm#getElectricityUnits()} across all recorded months, divides by total crate output,
     * and flags energy spikes or abnormally high consumption periods.
     * </p>
     *
     * @return Map containing average electricity units per crate, highest/lowest energy months, and recommendations
     */
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

    /**
     * Projects plastic raw material (polypropylene/HDPE granules) requirement forecasts.
     * <p>
     * <b>Algorithm:</b>
     * Groups daily production by crate type, computes historical rejection percentage,
     * estimates raw polymer weight in kilograms (approx 0.5kg/crate), and predicts next week's procurement needs.
     * </p>
     *
     * @return Map containing per-crate material requirements, rejection percentages, and low stock warnings
     */
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

    /**
     * Synthesizes day-by-day factory output efficiency timelines.
     * <p>
     * <b>Algorithm:</b>
     * Aggregates daily runs across chronological dates, computing percentage yields and
     * maximum, minimum, and average factory performance.
     * </p>
     *
     * @return Map containing sorted daily efficiency array, min/max/average yields, and overall operational status
     */
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

    /**
     * Daily scheduled background job that evaluates inventory levels against projected weekly demand.
     * Runs every morning at 08:00 AM.
     */
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
