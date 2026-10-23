package com.futaneagro.repository;

import com.futaneagro.entity.MachineBreakdown;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * <h1>MachineBreakdown Repository (Downtime Incidents & Maintenance Records)</h1>
 * <p>
 * Spring Data JPA repository for the {@link MachineBreakdown} entity.
 * Uses {@code @EntityGraph(attributePaths = {"machine"})} to eagerly load machine assets
 * alongside breakdown issue logs in a single query.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface MachineBreakdownRepository extends JpaRepository<MachineBreakdown, String> {
    @EntityGraph(attributePaths = {"machine"})
    List<MachineBreakdown> findAll();
}

