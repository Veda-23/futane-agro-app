package com.futaneagro.repository;

import com.futaneagro.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * <h1>Employee Repository (Factory Workforce & Staff Directory)</h1>
 * <p>
 * Spring Data JPA repository for the {@link Employee} entity.
 * Handles employee profiles, 12-digit Indian Aadhaar validations, and encrypted bank account numbers.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface EmployeeRepository extends JpaRepository<Employee, String> {
}

