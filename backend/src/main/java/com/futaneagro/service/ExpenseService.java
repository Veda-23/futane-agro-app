package com.futaneagro.service;

import com.futaneagro.entity.Expense;
import com.futaneagro.repository.ExpenseRepository;
import com.futaneagro.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepo;

    @Autowired
    private AuditService auditService;

    public List<Expense> getAllExpenses() {
        return expenseRepo.findAll();
    }

    @Transactional
    public Expense createExpense(Expense expense) {
        Expense saved = expenseRepo.save(expense);
        auditService.saveAuditLog("Created expense entry: " + saved.getCategory(), "Expense", null, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public void deleteExpense(Integer id) {
        expenseRepo.findById(id).ifPresent(e -> {
            String oldState = auditService.toJson(e);
            e.setIsDeleted(true);
            e.setDeletedBy(SecurityUtils.getCurrentUser());
            e.setDeletedDate(LocalDate.now());
            expenseRepo.save(e);
            auditService.saveAuditLog("Soft-deleted expense ID: " + id, "Expense", oldState, null);
        });
    }
}
