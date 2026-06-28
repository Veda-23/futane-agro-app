package com.futaneagro.repository;

import com.futaneagro.entity.EmployeeSalary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import org.springframework.data.jpa.repository.Query;

@Repository
public interface EmployeeSalaryRepository extends JpaRepository<EmployeeSalary, Integer> {
    @Query("SELECT COALESCE(SUM(e.salaryAmount), 0) FROM EmployeeSalary e WHERE e.isDeleted = false")
    BigDecimal sumTotalSalaries();
}
