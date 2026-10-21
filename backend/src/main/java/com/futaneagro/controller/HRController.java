package com.futaneagro.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.futaneagro.entity.*;
import com.futaneagro.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api")
public class HRController {

    private static final Logger log = LoggerFactory.getLogger(HRController.class);

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private EmployeeSalaryRepository employeeSalaryRepository;

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

    // --- Employee Endpoints ---
    @GetMapping("/employees")
    @Transactional(readOnly = true)
    @Cacheable(value = "employees")
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    @PostMapping("/employees")
    @Transactional
    @CacheEvict(value = "employees", allEntries = true)
    public Employee createEmployee(@Valid @RequestBody Employee employee) {
        Employee saved = employeeRepository.save(employee);
        saveAuditLog("Created employee: " + saved.getEmpName(), "Employees", null, toJson(saved));
        return saved;
    }

    @PutMapping("/employees/{id}")
    @Transactional
    @CacheEvict(value = "employees", allEntries = true)
    public ResponseEntity<Employee> updateEmployee(@PathVariable String id, @Valid @RequestBody Employee details) {
        return employeeRepository.findById(id).map(emp -> {
            String oldState = toJson(emp);

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
            saveAuditLog("Updated employee: " + saved.getEmpName(), "Employees", oldState, toJson(saved));
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/employees/{id}")
    @Transactional
    @CacheEvict(value = "employees", allEntries = true)
    public ResponseEntity<Void> deleteEmployee(@PathVariable String id) {
        return employeeRepository.findById(id).map(emp -> {
            String oldState = toJson(emp);
            emp.setDeletedBy(getCurrentUser());
            emp.setDeletedDate(java.time.LocalDateTime.now());
            emp.setIsDeleted(true);
            emp.setIsActive(false);
            employeeRepository.save(emp);
            employeeRepository.deleteById(id);
            saveAuditLog("DELETED employee: " + emp.getEmpName(), "Employees", oldState, null);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    // --- Salary Endpoints ---
    @GetMapping("/salaries")
    @Transactional(readOnly = true)
    public List<EmployeeSalary> getAllSalaries() {
        return employeeSalaryRepository.findAll();
    }

    @PostMapping("/salaries")
    @Transactional
    public EmployeeSalary createSalary(@RequestBody EmployeeSalary salary) {
        EmployeeSalary saved = employeeSalaryRepository.save(salary);
        String empId = (saved.getEmployee() != null) ? saved.getEmployee().getId() : "N/A";
        saveAuditLog("Created salary record for employee ID: " + empId, "Employee_Salary", null, toJson(saved));
        return saved;
    }

    @PutMapping("/salaries/{id}")
    @Transactional
    public ResponseEntity<EmployeeSalary> updateSalary(@PathVariable String id, @RequestBody EmployeeSalary details) {
        return employeeSalaryRepository.findById(id).map(salary -> {
            String oldState = toJson(salary);

            salary.setMonth(details.getMonth());
            salary.setYear(details.getYear());
            salary.setSalaryAmount(details.getSalaryAmount());
            salary.setPaidDate(details.getPaidDate());
            salary.setStatus(details.getStatus());

            EmployeeSalary saved = employeeSalaryRepository.save(salary);
            saveAuditLog("Updated salary record ID: " + id, "Employee_Salary", oldState, toJson(saved));
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/salaries/{id}")
    @Transactional
    public ResponseEntity<Void> deleteSalary(@PathVariable String id) {
        return employeeSalaryRepository.findById(id).map(salary -> {
            String oldState = toJson(salary);
            salary.setDeletedBy(getCurrentUser());
            salary.setDeletedDate(java.time.LocalDateTime.now());
            salary.setIsDeleted(true);
            salary.setIsActive(false);
            employeeSalaryRepository.save(salary);
            employeeSalaryRepository.deleteById(id);
            saveAuditLog("DELETED salary record ID: " + id, "Employee_Salary", oldState, null);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
