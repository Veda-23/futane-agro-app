package com.futaneagro.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.futaneagro.entity.*;
import com.futaneagro.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * <h3>Logistics & Transport REST Controller</h3>
 * <p>
 * Manages freight logistics, delivery truck dispatches, hired vehicle rent, driver cash advances,
 * and vehicular compliance documentation for finished goods distribution in the Futane Agro ERP system.
 * </p>
 *
 * <h4>Core Responsibilities:</h4>
 * <ul>
 *   <li><b>Trip Freight Tracking:</b> Records dispatch dates, truck registration numbers, assigned driver,
 *       agreed freight rent amount, and paid driver advance cash via {@link Transport}.</li>
 *   <li><b>Document Compliance:</b> Stores links to digital media uploads (truck photo, driver license).</li>
 *   <li><b>Financial Integration:</b> Aggregates logistics expenditure feeds directly into the executive P&L
 *       via {@link TransportRepository#sumTotalRent()}.</li>
 *   <li><b>Audit Trail:</b> Full before-and-after JSON delta snapshots recorded in {@link AuditLog}.</li>
 * </ul>
 *
 * @author Futane Agro Core Engineering
 * @version 2.0
 */
@RestController
@RequestMapping("/api")
public class TransportController {

    private static final Logger log = LoggerFactory.getLogger(TransportController.class);

    @Autowired
    private TransportRepository transportRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private com.futaneagro.service.AuditService auditService;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Resolves the authenticated username from Spring Security context.
     * Defaults to "system" if no security principal is active.
     *
     * @return Current authenticated username or "system"
     */
    private String getCurrentUser() {
        return auditService.getCurrentUser();
    }

    /**
     * Creates and persists an immutable audit log entry capturing entity delta changes.
     *
     * @param action Description of the business action (e.g., Created, Updated, Deleted)
     * @param tableName Target database table name
     * @param oldValue JSON representation of state prior to modification
     * @param newValue JSON representation of new state after modification
     */
    private void saveAuditLog(String action, String tableName, String oldValue, String newValue) {
        auditService.log(action, tableName, oldValue, newValue);
    }

    /**
     * Serializes an entity or object into a JSON string safely without throwing checked exceptions.
     *
     * @param obj Target object to serialize
     * @return Serialized JSON string, or empty string on serialization error
     */
    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "";
        }
    }

    /**
     * <b>GET /api/transports</b> - Retrieves all logistics transport dispatch trip records.
     * <p>
     * <b>How it works:</b>
     * Performs a read-only query via {@link TransportRepository#findAll()}, returning all trip
     * entries with truck numbers, driver associations, freight costs, and driver advances.
     * </p>
     * <p>
     * <b>Used for:</b> Populating the Transport & Logistics dispatch register, truck trip logs,
     * and monthly vehicle billing reconciliation tables.
     * </p>
     *
     * @return List of {@link Transport} trip records
     */
    @GetMapping("/transports")
    @Transactional(readOnly = true)
    public List<Transport> getAllTransports() {
        return transportRepository.findAll();
    }

    /**
     * <b>POST /api/transports</b> - Records a new truck freight dispatch entry.
     * <p>
     * <b>How it works:</b>
     * Persists the new {@link Transport} trip into the database and generates an audit log entry
     * capturing the truck registration number and payload details in JSON format.
     * </p>
     * <p>
     * <b>Used for:</b> Registering a truck arrival/dispatch for outbound finished goods delivery
     * or inbound raw material transfer, capturing driver advance and agreed hire rent.
     * </p>
     *
     * @param transport The new transport entity to save
     * @return Persisted {@link Transport} entity with generated primary key UUID
     */
    @org.springframework.transaction.annotation.Transactional(rollbackFor = Exception.class)
    @PostMapping("/transports")
    public Transport createTransport(@RequestBody Transport transport) {
        if (transport.getDriver() != null && transport.getDriver().getId() != null) {
            driverRepository.findById(transport.getDriver().getId()).ifPresent(transport::setDriver);
        }
        Transport saved = transportRepository.save(transport);
        saveAuditLog("Created transport entry: truck " + saved.getTruckNumber(), "Transport", null, toJson(saved));
        return saved;
    }

    /**
     * <b>PUT /api/transports/{id}</b> - Updates details of an existing transport trip record.
     * <p>
     * <b>How it works:</b>
     * <ol>
     *   <li>Finds existing transport record by ID, throwing a runtime exception if missing.</li>
     *   <li>Captures pre-update JSON state for audit compliance.</li>
     *   <li>Updates trip date, truck registration number, assigned driver, agreed rent, driver advance,
     *       and photo/license attachment URLs.</li>
     *   <li>Saves updated record and logs audit diff.</li>
     * </ol>
     * </p>
     * <p>
     * <b>Used for:</b> Modifying freight charges after weighbridge confirmation, adjusting driver
     * advance amounts, or attaching proof of delivery and license documents.
     * </p>
     *
     * @param id Transport entity UUID
     * @param details Incoming updated transport fields
     * @return The updated and persisted {@link Transport} entity
     */
    @PutMapping("/transports/{id}")
    public Transport updateTransport(@PathVariable String id, @RequestBody Transport details) {
        Transport transport = transportRepository.findById(id).orElseThrow(() -> new RuntimeException("Transport not found"));
        String oldState = toJson(transport);

        transport.setDate(details.getDate());
        transport.setTruckNumber(details.getTruckNumber());
        transport.setDriver(details.getDriver());
        transport.setRent(details.getRent());
        transport.setAdvance(details.getAdvance());
        transport.setTruckPhotoPath(details.getTruckPhotoPath());
        transport.setDriverLicensePath(details.getDriverLicensePath());

        Transport saved = transportRepository.save(transport);
        saveAuditLog("Updated transport ID: " + id, "Transport", oldState, toJson(saved));
        return saved;
    }

    /**
     * <b>DELETE /api/transports/{id}</b> - Soft-deletes a transport dispatch record.
     * <p>
     * <b>How it works:</b>
     * Sets {@code isActive = false}, tracks modifier username and timestamp, and records
     * a soft-deletion audit log without physically deleting the trip history.
     * </p>
     * <p>
     * <b>Used for:</b> Canceling incorrect or canceled freight dispatches while retaining an immutable audit trail.
     * </p>
     *
     * @param id Transport entity UUID to soft-delete
     */
    @DeleteMapping("/transports/{id}")
    public void deleteTransport(@PathVariable String id) {
        transportRepository.findById(id).ifPresent(transport -> {
            String oldState = toJson(transport);
            transport.setIsActive(false);
            transport.setUpdatedBy(getCurrentUser());
            transport.setUpdatedAt(java.time.LocalDateTime.now());
            transportRepository.save(transport);
            saveAuditLog("Soft-deleted transport ID: " + id, "Transport", oldState, null);
        });
    }
}



