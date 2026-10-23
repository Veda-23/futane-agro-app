package com.futaneagro.repository;

import com.futaneagro.entity.MachineMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * <h1>MachineMaster Repository (Injection Molding Assets Catalog)</h1>
 * <p>
 * Spring Data JPA repository for the {@link MachineMaster} entity.
 * Provides lookup and lifecycle persistence for plant equipment, capacity calibration, and operational states.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface MachineMasterRepository extends JpaRepository<MachineMaster, String> {
}

