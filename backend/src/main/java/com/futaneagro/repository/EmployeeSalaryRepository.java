package com.futaneagro.repository;

import com.futaneagro.entity.EmployeeSalary;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface EmployeeSalaryRepository extends JpaRepository<EmployeeSalary, String> {
    @EntityGraph(attributePaths = {"employee"})
    List<EmployeeSalary> findAll();

    @Query("SELECT COALESCE(SUM(s.salaryAmount), 0) FROM EmployeeSalary s")
    BigDecimal sumTotalSalaryAmount();
}

