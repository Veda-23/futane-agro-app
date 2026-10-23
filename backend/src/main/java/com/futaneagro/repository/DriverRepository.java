package com.futaneagro.repository;

import com.futaneagro.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * <h1>Driver Repository (Commercial Chauffeur & Vehicle Operator Directory)</h1>
 * <p>
 * Spring Data JPA repository for the {@link Driver} entity.
 * Provides CRUD queries and soft-deletion filtering for company and contract drivers.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface DriverRepository extends JpaRepository<Driver, String> {
}

