package com.futaneagro.dto;

import java.time.LocalDateTime;
import java.util.Objects;

import javax.validation.constraints.NotBlank;

/**
 * DTO for basic health check response.
 * <p>
 * This represents the minimal health status response.
 * </p>
 */
public class HealthResponse {
    /**
     * Application health status.
     */
    @NotBlank
    private String status;

    /**
     * Timestamp of the health check.
     */
    private LocalDateTime timestamp;

    /**
     * Response processing time in milliseconds.
     */
    private long responseTime;

    /**
     * Empty constructor for deserialization.
     */
    public HealthResponse() {
    }

    /**
     * Constructor with parameters.
     * @param status Application status
     * @param timestamp Timestamp
     * @param responseTime Response processing time
     */
    public HealthResponse(String status, LocalDateTime timestamp, long responseTime) {
        this.status = status;
        this.timestamp = timestamp;
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

    public long getResponseTime() {
        return responseTime;
    }

    public void setResponseTime(long responseTime) {
        this.responseTime = responseTime;
    }

    @Override
    public String toString() {
        return "HealthResponse{status='" + status + '\'' +
                ", timestamp=" + timestamp +
                ", responseTime=" + responseTime + '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        HealthResponse that = (HealthResponse) o;
        return responseTime == that.responseTime &&
                Objects.equals(status, that.status) &&
                Objects.equals(timestamp, that.timestamp);
    }

    @Override
    public int hashCode() {
        return Objects.hash(status, timestamp, responseTime);
    }
}