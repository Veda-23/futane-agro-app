package com.futaneagro.service;

import com.futaneagro.entity.Party;
import com.futaneagro.repository.PartyRepository;
import com.futaneagro.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class PartyService {

    @Autowired
    private PartyRepository partyRepository;

    @Autowired
    private AuditService auditService;

    public List<Party> getAllParties() {
        return partyRepository.findAll();
    }

    @Transactional
    public Party createParty(Party party) {
        Party saved = partyRepository.save(party);
        auditService.saveAuditLog("Created party: " + saved.getPartyName(), "Party", null, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public Party updateParty(Integer id, Party details) {
        Party party = partyRepository.findById(id).orElseThrow(() -> new RuntimeException("Party not found"));
        String oldState = auditService.toJson(party);

        party.setPartyName(details.getPartyName());
        party.setPartyAddress(details.getPartyAddress());
        party.setPartyContact(details.getPartyContact());
        party.setGstNumber(details.getGstNumber());
        party.setEmail(details.getEmail());
        party.setCity(details.getCity());
        party.setState(details.getState());
        party.setIsActive(details.getIsActive());
        party.setGstCertPath(details.getGstCertPath());
        party.setPanCardPath(details.getPanCardPath());
        party.setAgreementPath(details.getAgreementPath());

        Party saved = partyRepository.save(party);
        auditService.saveAuditLog("Updated party: " + saved.getPartyName(), "Party", oldState, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public void deleteParty(Integer id) {
        partyRepository.findById(id).ifPresent(party -> {
            String oldState = auditService.toJson(party);
            party.setIsDeleted(true);
            party.setDeletedBy(SecurityUtils.getCurrentUser());
            party.setDeletedDate(LocalDate.now());
            partyRepository.save(party);
            auditService.saveAuditLog("Soft-deleted party ID: " + id, "Party", oldState, null);
        });
    }
}
