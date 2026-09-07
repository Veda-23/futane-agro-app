package com.futaneagro.repository;

import com.futaneagro.entity.EmployeeSalary;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeSalaryRepository extends JpaRepository<EmployeeSalary, String> {
    @EntityGraph(attributePaths = {"employee"})
    List<EmployeeSalary> findAll();
}

