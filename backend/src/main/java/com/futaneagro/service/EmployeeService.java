package com.futaneagro.service;

import com.futaneagro.entity.Employee;
import com.futaneagro.repository.EmployeeRepository;
import com.futaneagro.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AuditService auditService;

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    @Transactional
    public Employee createEmployee(Employee employee) {
        Employee saved = employeeRepository.save(employee);
        auditService.saveAuditLog("Created employee: " + saved.getEmpName(), "Employees", null, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public Employee updateEmployee(Integer id, Employee details) {
        Employee emp = employeeRepository.findById(id).orElseThrow(() -> new RuntimeException("Employee not found"));
        String oldState = auditService.toJson(emp);

        emp.setEmpName(details.getEmpName());
        emp.setEmpContact(details.getEmpContact());
        emp.setSalary(details.getSalary());
        emp.setAddress(details.getAddress());
        emp.setDesignation(details.getDesignation());
        emp.setJoiningDate(details.getJoiningDate());
        emp.setAadhaarNo(details.getAadhaarNo());
        emp.setBankAccount(details.getBankAccount());
        emp.setPhotoPath(details.getPhotoPath());
        emp.setAadhaarCardPath(details.getAadhaarCardPath());
        emp.setBankPassbookPath(details.getBankPassbookPath());

        Employee saved = employeeRepository.save(emp);
        auditService.saveAuditLog("Updated employee: " + saved.getEmpName(), "Employees", oldState, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public void deleteEmployee(Integer id) {
        employeeRepository.findById(id).ifPresent(emp -> {
            String oldState = auditService.toJson(emp);
            emp.setIsDeleted(true);
            emp.setDeletedBy(SecurityUtils.getCurrentUser());
            emp.setDeletedDate(LocalDate.now());
            employeeRepository.save(emp);
            auditService.saveAuditLog("Soft-deleted employee ID: " + id, "Employees", oldState, null);
        });
    }
}
