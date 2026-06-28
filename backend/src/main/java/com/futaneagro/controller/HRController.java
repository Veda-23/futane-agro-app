package com.futaneagro.controller;

import com.futaneagro.entity.*;
import com.futaneagro.service.EmployeeService;
import com.futaneagro.service.EmployeeSalaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class HRController {

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private EmployeeSalaryService employeeSalaryService;

    // --- Employee Endpoints ---
    @GetMapping("/employees")
    public List<Employee> getAllEmployees() {
        return employeeService.getAllEmployees();
    }

    @PostMapping("/employees")
    public Employee createEmployee(@Valid @RequestBody Employee employee) {
        return employeeService.createEmployee(employee);
    }

    @PutMapping("/employees/{id}")
    public Employee updateEmployee(@PathVariable Integer id, @Valid @RequestBody Employee details) {
        return employeeService.updateEmployee(id, details);
    }

    @DeleteMapping("/employees/{id}")
    public void deleteEmployee(@PathVariable Integer id) {
        employeeService.deleteEmployee(id);
    }

    // --- Salary Endpoints ---
    @GetMapping("/salaries")
    public List<EmployeeSalary> getAllSalaries() {
        return employeeSalaryService.getAllSalaries();
    }

    @PostMapping("/salaries")
    public EmployeeSalary createSalary(@RequestBody EmployeeSalary salary) {
        return employeeSalaryService.createSalary(salary);
    }

    @PutMapping("/salaries/{id}")
    public EmployeeSalary updateSalary(@PathVariable Integer id, @RequestBody EmployeeSalary details) {
        return employeeSalaryService.updateSalary(id, details);
    }

    @DeleteMapping("/salaries/{id}")
    public void deleteSalary(@PathVariable Integer id) {
        employeeSalaryService.deleteSalary(id);
    }
}
