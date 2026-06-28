package com.futaneagro.dto;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Objects;

/**
 * DTO for detailed health check response.
 * <p>
 * This includes system information, version details, and application metrics.
 * </p>
 */
public class DetailedHealthResponse {
    /**
     * Application health status.
     */
    private String status;

    /**
     * Timestamp of the health check.
     */
    private LocalDateTime timestamp;

    /**
     * Application version.
     */
    private String version;

    /**
     * System uptime in milliseconds.
     */
    private long uptime;

    /**
     * JVM memory usage.
     */
    private Map<String, Long> memory;

    /**
     * CPU information.
     */
    private Map<String, Object> cpu;

    /**
     * Response processing time in milliseconds.
     */
    private long responseTime;

    /**
     * Empty constructor for deserialization.
     */
    public DetailedHealthResponse() {
    }

    /**
     * Constructor with parameters.
     */
    public DetailedHealthResponse(String status, LocalDateTime timestamp, String version,
                                  long uptime, Map<String, Long> memory, Map<String, Object> cpu,
                                  long responseTime) {
        this.status = status;
        this.timestamp = timestamp;
        this.version = version;
        this.uptime = uptime;
        this.memory = memory;
        this.cpu = cpu;
        this.responseTime = responseTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public long getUptime() {
        return uptime;
    }

    public void setUptime(long uptime) {
        this.uptime = uptime;
    }

    public Map<String, Long> getMemory() {
        return memory;
    }

    public void setMemory(Map<String, Long> memory) {
        this.memory = memory;
    }

    public Map<String, Object> getCpu() {
        return cpu;
    }

    public void setCpu(Map<String, Object> cpu) {
        this.cpu = cpu;
    }

    public long getResponseTime() {
        return responseTime;
    }

    public void setResponseTime(long responseTime) {
        this.responseTime = responseTime;
    }

    @Override
    public String toString() {
        return "DetailedHealthResponse{" +
                "status='" + status + '\'' +
                ", timestamp=" + timestamp +
                ", version='" + version + '\'' +
                ", uptime=" + uptime +
                ", memory=" + memory +
                ", cpu=" + cpu +
                ", responseTime=" + responseTime +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DetailedHealthResponse that = (DetailedHealthResponse) o;
        return uptime == that.uptime &&
                responseTime == that.responseTime &&
                Objects.equals(status, that.status) &&
                Objects.equals(timestamp, that.timestamp) &&
                Objects.equals(version, that.version) &&
                Objects.equals(memory, that.memory) &&
                Objects.equals(cpu, that.cpu);
    }

    @Override
    public int hashCode() {
        return Objects.hash(status, timestamp, version, uptime, memory, cpu, responseTime);
    }
}