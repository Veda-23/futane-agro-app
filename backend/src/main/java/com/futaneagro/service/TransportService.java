package com.futaneagro.service;

import com.futaneagro.entity.Transport;
import com.futaneagro.repository.TransportRepository;
import com.futaneagro.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class TransportService {

    @Autowired
    private TransportRepository transportRepository;

    @Autowired
    private AuditService auditService;

    public List<Transport> getAllTransports() {
        return transportRepository.findAll();
    }

    @Transactional
    public Transport createTransport(Transport transport) {
        Transport saved = transportRepository.save(transport);
        auditService.saveAuditLog("Created transport entry: truck " + saved.getTruckNumber(), "Transport", null, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public Transport updateTransport(Integer id, Transport details) {
        Transport transport = transportRepository.findById(id).orElseThrow(() -> new RuntimeException("Transport not found"));
        String oldState = auditService.toJson(transport);

        transport.setDate(details.getDate());
        transport.setTruckNumber(details.getTruckNumber());
        transport.setDriver(details.getDriver());
        transport.setRent(details.getRent());
        transport.setAdvance(details.getAdvance());
        transport.setTruckPhotoPath(details.getTruckPhotoPath());
        transport.setDriverLicensePath(details.getDriverLicensePath());

        Transport saved = transportRepository.save(transport);
        auditService.saveAuditLog("Updated transport ID: " + id, "Transport", oldState, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public void deleteTransport(Integer id) {
        transportRepository.findById(id).ifPresent(transport -> {
            String oldState = auditService.toJson(transport);
            transport.setIsDeleted(true);
            transport.setDeletedBy(SecurityUtils.getCurrentUser());
            transport.setDeletedDate(LocalDate.now());
            transportRepository.save(transport);
            auditService.saveAuditLog("Soft-deleted transport ID: " + id, "Transport", oldState, null);
        });
    }
}
