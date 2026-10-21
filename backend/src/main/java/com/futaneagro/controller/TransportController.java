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

@RestController
@RequestMapping("/api")
public class TransportController {

    private static final Logger log = LoggerFactory.getLogger(TransportController.class);

    @Autowired
    private TransportRepository transportRepository;

    @Autowired
    private AuditLogRepository auditRepo;

    @Autowired
    private ObjectMapper objectMapper;

    private String getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return (principal != null) ? principal.toString() : "system";
    }

    private void saveAuditLog(String action, String tableName, String oldValue, String newValue) {
        AuditLog log = new AuditLog();
        log.setUsername(getCurrentUser());
        log.setAction(action);
        log.setTableName(tableName);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        auditRepo.save(log);
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "";
        }
    }

    @GetMapping("/transports")
    @Transactional(readOnly = true)
    public List<Transport> getAllTransports() {
        return transportRepository.findAll();
    }

    @PostMapping("/transports")
    public Transport createTransport(@RequestBody Transport transport) {
        Transport saved = transportRepository.save(transport);
        saveAuditLog("Created transport entry: truck " + saved.getTruckNumber(), "Transport", null, toJson(saved));
        return saved;
    }

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


