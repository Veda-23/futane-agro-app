package com.futaneagro.repository;

import com.futaneagro.entity.EmployeeSalary;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

/**
 * <h1>EmployeeSalary Repository (Monthly Payroll Disbursements & Wage Slips)</h1>
 * <p>
 * Spring Data JPA repository for the {@link EmployeeSalary} entity.
 * Uses {@code @EntityGraph(attributePaths = {"employee"})} to eagerly load employee details,
 * and calculates aggregate monthly wage liabilities via {@link #sumTotalSalaryAmount()}.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface EmployeeSalaryRepository extends JpaRepository<EmployeeSalary, String> {
    @EntityGraph(attributePaths = {"employee"})
    List<EmployeeSalary> findAll();

    @Query("SELECT COALESCE(SUM(s.salaryAmount), 0) FROM EmployeeSalary s")
    BigDecimal sumTotalSalaryAmount();
}

