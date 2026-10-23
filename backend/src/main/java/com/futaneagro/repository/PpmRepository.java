package com.futaneagro.repository;

import com.futaneagro.entity.Ppm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * <h1>Ppm Repository (Monthly Production Volumes & Utility Power Analysis)</h1>
 * <p>
 * Spring Data JPA repository for the {@link Ppm} entity.
 * Persists monthly aggregate production counts, electricity unit consumption (kWh), and utility power billing.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface PpmRepository extends JpaRepository<Ppm, String> {
}

