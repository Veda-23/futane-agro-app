package com.futaneagro.service;

import com.futaneagro.entity.BankTransaction;
import com.futaneagro.repository.BankTransactionRepository;
import com.futaneagro.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class BankTransactionService {

    @Autowired
    private BankTransactionRepository bankRepo;

    @Autowired
    private AuditService auditService;

    public List<BankTransaction> getAllTransactions() {
        return bankRepo.findAll();
    }

    @Transactional
    public BankTransaction createTransaction(BankTransaction transaction) {
        BankTransaction saved = bankRepo.save(transaction);
        auditService.saveAuditLog("Created bank transaction: " + saved.getMode(), "Bank_Transaction", null, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public void deleteTransaction(Integer id) {
        bankRepo.findById(id).ifPresent(t -> {
            String oldState = auditService.toJson(t);
            t.setIsDeleted(true);
            t.setDeletedBy(SecurityUtils.getCurrentUser());
            t.setDeletedDate(LocalDate.now());
            bankRepo.save(t);
            auditService.saveAuditLog("Soft-deleted bank transaction ID: " + id, "Bank_Transaction", oldState, null);
        });
    }
}
