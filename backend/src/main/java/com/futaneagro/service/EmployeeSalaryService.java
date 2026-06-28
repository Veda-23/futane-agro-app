package com.futaneagro.service;

import com.futaneagro.entity.EmployeeSalary;
import com.futaneagro.repository.EmployeeSalaryRepository;
import com.futaneagro.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class EmployeeSalaryService {

    @Autowired
    private EmployeeSalaryRepository employeeSalaryRepository;

    @Autowired
    private AuditService auditService;

    public List<EmployeeSalary> getAllSalaries() {
        return employeeSalaryRepository.findAll();
    }

    @Transactional
    public EmployeeSalary createSalary(EmployeeSalary salary) {
        EmployeeSalary saved = employeeSalaryRepository.save(salary);
        auditService.saveAuditLog("Created salary record for employee ID: " + saved.getEmployee().getEmpId(), "Employee_Salary", null, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public EmployeeSalary updateSalary(Integer id, EmployeeSalary details) {
        EmployeeSalary salary = employeeSalaryRepository.findById(id).orElseThrow(() -> new RuntimeException("Salary record not found"));
        String oldState = auditService.toJson(salary);

        salary.setMonth(details.getMonth());
        salary.setYear(details.getYear());
        salary.setSalaryAmount(details.getSalaryAmount());
        salary.setPaidDate(details.getPaidDate());
        salary.setStatus(details.getStatus());

        EmployeeSalary saved = employeeSalaryRepository.save(salary);
        auditService.saveAuditLog("Updated salary record ID: " + id, "Employee_Salary", oldState, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public void deleteSalary(Integer id) {
        employeeSalaryRepository.findById(id).ifPresent(salary -> {
            String oldState = auditService.toJson(salary);
            salary.setIsDeleted(true);
            salary.setDeletedBy(SecurityUtils.getCurrentUser());
            salary.setDeletedDate(LocalDate.now());
            employeeSalaryRepository.save(salary);
            auditService.saveAuditLog("Soft-deleted salary record ID: " + id, "Employee_Salary", oldState, null);
        });
    }
}
