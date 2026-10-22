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

/**
 * <h3>Human Resources & Payroll REST Controller</h3>
 * <p>
 * Manages plant staff personnel records, employee identification documents,
 * and monthly salary wage disbursements within Futane Agro manufacturing operations.
 * </p>
 *
 * <h4>Core Responsibilities:</h4>
 * <ul>
 *   <li><b>Workforce Lifecycle Management:</b> Full CRUD for {@link Employee} records including
 *       Aadhaar identity, bank account details, designation, and stored document paths.</li>
 *   <li><b>Payroll & Salary Disbursals:</b> Tracking monthly wage liabilities, payment statuses
 *       (Paid, Pending), disbursement dates, and amounts via {@link EmployeeSalary}.</li>
 *   <li><b>Performance Caching:</b> Cache management using Spring Cache ({@code "employees"}),
 *       with automatic eviction on employee record mutations.</li>
 *   <li><b>Audit Compliance:</b> Persists before-and-after JSON snapshots in {@link AuditLog}
 *       for every workforce creation, salary adjustment, or deactivation.</li>
 * </ul>
 *
 * @author Futane Agro Core Engineering
 * @version 2.0
 */
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

    /**
     * Resolves the authenticated username from Spring Security context.
     * Defaults to "system" if no security principal is active.
     *
     * @return Current authenticated username or "system"
     */
    private String getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return (principal != null) ? principal.toString() : "system";
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
        AuditLog log = new AuditLog();
        log.setUsername(getCurrentUser());
        log.setAction(action);
        log.setTableName(tableName);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        auditRepo.save(log);
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

    // --- Employee Endpoints ---

    /**
     * <b>GET /api/employees</b> - Retrieves all active and registered employees.
     * <p>
     * <b>How it works:</b>
     * Serves from {@code "employees"} cache when populated; otherwise queries {@link EmployeeRepository#findAll()}
     * under read-only transaction and caches result.
     * </p>
     * <p>
     * <b>Used for:</b> Populating the HR Employee directory, salary assignment dropdowns, and dashboard workforce count.
     * </p>
     *
     * @return List of {@link Employee} entities
     */
    @GetMapping("/employees")
    @Transactional(readOnly = true)
    @Cacheable(value = "employees")
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    /**
     * <b>POST /api/employees</b> - Enrolls a new employee into the factory registry.
     * <p>
     * <b>How it works:</b>
     * Validates input payload with Bean Validation ({@code @Valid}), saves to database,
     * purges the {@code "employees"} cache to maintain consistency, and logs the creation event.
     * </p>
     * <p>
     * <b>Used for:</b> Factory worker onboarding, machine operator registration, and administrative staff intake.
     * </p>
     *
     * @param employee Validated employee payload
     * @return The persisted {@link Employee} entity with generated UUID
     */
    @PostMapping("/employees")
    @Transactional
    @CacheEvict(value = "employees", allEntries = true)
    public Employee createEmployee(@Valid @RequestBody Employee employee) {
        Employee saved = employeeRepository.save(employee);
        saveAuditLog("Created employee: " + saved.getEmpName(), "Employees", null, toJson(saved));
        return saved;
    }

    /**
     * <b>PUT /api/employees/{id}</b> - Updates personnel information, bank details, or KYC document paths.
     * <p>
     * <b>How it works:</b>
     * <ol>
     *   <li>Finds employee by primary ID.</li>
     *   <li>Captures existing JSON snapshot for audit logging.</li>
     *   <li>Updates contact number, designation, base salary, address, joining date, Aadhaar number,
     *       bank account, photo path, Aadhaar card path, and bank passbook path.</li>
     *   <li>Saves updated record, clears employee cache, and logs audit diff.</li>
     * </ol>
     * </p>
     * <p>
     * <b>Used for:</b> Wage increments, role promotions, contact updates, or KYC verification document uploads.
     * </p>
     *
     * @param id Employee UUID
     * @param details Validated updated employee details
     * @return 200 OK with updated employee, or 404 NOT FOUND
     */
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

    /**
     * <b>DELETE /api/employees/{id}</b> - Soft deletes and retires an employee record.
     * <p>
     * <b>How it works:</b>
     * Flags {@code isDeleted=true}, {@code isActive=false}, records deletion audit trail,
     * purges cached records, and removes active association.
     * </p>
     * <p>
     * <b>Used for:</b> Employee offboarding, resignation, or termination.
     * </p>
     *
     * @param id Employee UUID
     * @return 204 NO CONTENT on success, or 404 NOT FOUND
     */
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
            saveAuditLog("DELETED employee: " + emp.getEmpName(), "Employees", oldState, null);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    // --- Salary Endpoints ---

    /**
     * <b>GET /api/salaries</b> - Retrieves all salary disbursement ledger records.
     * <p>
     * <b>How it works:</b>
     * Queries {@link EmployeeSalaryRepository#findAll()} under a read-only transaction.
     * </p>
     * <p>
     * <b>Used for:</b> Monthly payroll register, wage liability tracking, and financial expense reporting.
     * </p>
     *
     * @return List of {@link EmployeeSalary} payout records
     */
    @GetMapping("/salaries")
    @Transactional(readOnly = true)
    public List<EmployeeSalary> getAllSalaries() {
        return employeeSalaryRepository.findAll();
    }

    /**
     * <b>POST /api/salaries</b> - Generates a monthly salary disbursement entry for an employee.
     * <p>
     * <b>How it works:</b>
     * Saves the salary record (month, year, amount, paid date, payment status) and logs an audit entry.
     * </p>
     * <p>
     * <b>Used for:</b> Disbursing monthly wages to factory workers and recording cash/bank payment vouchers.
     * </p>
     *
     * @param salary New salary entity to persist
     * @return The persisted {@link EmployeeSalary} record with generated ID
     */
    @PostMapping("/salaries")
    @Transactional
    public EmployeeSalary createSalary(@RequestBody EmployeeSalary salary) {
        EmployeeSalary saved = employeeSalaryRepository.save(salary);
        String empId = (saved.getEmployee() != null) ? saved.getEmployee().getId() : "N/A";
        saveAuditLog("Created salary record for employee ID: " + empId, "Employee_Salary", null, toJson(saved));
        return saved;
    }

    /**
     * <b>PUT /api/salaries/{id}</b> - Updates an existing salary record.
     * <p>
     * <b>How it works:</b>
     * Modifies month, year, salaryAmount, paidDate, or payment status (e.g. Paid, Pending),
     * saving the changes and recording an audit trail diff.
     * </p>
     * <p>
     * <b>Used for:</b> Adjusting overtime, deductions, bonus increments, or updating payment status upon clearance.
     * </p>
     *
     * @param id Salary record UUID
     * @param details Updated salary details
     * @return 200 OK with updated entity, or 404 NOT FOUND
     */
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

    /**
     * <b>DELETE /api/salaries/{id}</b> - Deletes or cancels a salary disbursement record.
     * <p>
     * <b>How it works:</b>
     * Marks record as deleted, logs cancellation audit entry, and deletes record from repository.
     * </p>
     * <p>
     * <b>Used for:</b> Canceling erroneously generated salary disbursement vouchers.
     * </p>
     *
     * @param id Salary record UUID
     * @return 204 NO CONTENT on success, or 404 NOT FOUND
     */
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
            saveAuditLog("DELETED salary record ID: " + id, "Employee_Salary", oldState, null);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}

