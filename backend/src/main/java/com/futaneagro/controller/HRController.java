package com.futaneagro.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.futaneagro.entity.*;
import com.futaneagro.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class HRController {

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
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    @PostMapping("/employees")
    public Employee createEmployee(@Valid @RequestBody Employee employee) {
        Employee saved = employeeRepository.save(employee);
        saveAuditLog("Created employee: " + saved.getEmpName(), "Employees", null, toJson(saved));
        return saved;
    }

    @PutMapping("/employees/{id}")
    public Employee updateEmployee(@PathVariable String id, @Valid @RequestBody Employee details) {
        Employee emp = employeeRepository.findById(id).orElseThrow(() -> new RuntimeException("Employee not found"));
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
        return saved;
    }

    @DeleteMapping("/employees/{id}")
    public void deleteEmployee(@PathVariable String id) {
        employeeRepository.findById(id).ifPresent(emp -> {
            String oldState = toJson(emp);
            emp.setIsActive(false);
            emp.setUpdatedBy(getCurrentUser());
            emp.setUpdatedAt(java.time.LocalDateTime.now());
            employeeRepository.save(emp);
            saveAuditLog("Soft-deleted employee ID: " + id, "Employees", oldState, null);
        });
    }

    // --- Salary Endpoints ---
    @GetMapping("/salaries")
    public List<EmployeeSalary> getAllSalaries() {
        return employeeSalaryRepository.findAll();
    }

    @PostMapping("/salaries")
    public EmployeeSalary createSalary(@RequestBody EmployeeSalary salary) {
        EmployeeSalary saved = employeeSalaryRepository.save(salary);
        saveAuditLog("Created salary record for employee ID: " + saved.getEmployee().getId(), "Employee_Salary", null, toJson(saved));
        return saved;
    }

    @PutMapping("/salaries/{id}")
    public EmployeeSalary updateSalary(@PathVariable String id, @RequestBody EmployeeSalary details) {
        EmployeeSalary salary = employeeSalaryRepository.findById(id).orElseThrow(() -> new RuntimeException("Salary record not found"));
        String oldState = toJson(salary);

        salary.setMonth(details.getMonth());
        salary.setYear(details.getYear());
        salary.setSalaryAmount(details.getSalaryAmount());
        salary.setPaidDate(details.getPaidDate());
        salary.setStatus(details.getStatus());

        EmployeeSalary saved = employeeSalaryRepository.save(salary);
        saveAuditLog("Updated salary record ID: " + id, "Employee_Salary", oldState, toJson(saved));
        return saved;
    }

    @DeleteMapping("/salaries/{id}")
    public void deleteSalary(@PathVariable String id) {
        employeeSalaryRepository.findById(id).ifPresent(salary -> {
            String oldState = toJson(salary);
            salary.setIsActive(false);
            salary.setUpdatedBy(getCurrentUser());
            salary.setUpdatedAt(java.time.LocalDateTime.now());
            employeeSalaryRepository.save(salary);
            saveAuditLog("Soft-deleted salary record ID: " + id, "Employee_Salary", oldState, null);
        });
    }
}



