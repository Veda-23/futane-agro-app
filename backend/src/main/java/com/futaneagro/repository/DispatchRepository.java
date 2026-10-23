package com.futaneagro.repository;

import com.futaneagro.entity.Dispatch;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * <h1>Dispatch Repository (Gate-Pass Outward Clearance & Transit Tracking)</h1>
 * <p>
 * Spring Data JPA repository for the {@link Dispatch} entity.
 * Uses {@code @EntityGraph(attributePaths = {"sale", "sale.party"})} to fetch outward manifests
 * joined with the parent commercial sale and wholesale buyer in a single SQL operation.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface DispatchRepository extends JpaRepository<Dispatch, String> {
    @EntityGraph(attributePaths = {"sale", "sale.party"})
    List<Dispatch> findAll();

    @EntityGraph(attributePaths = {"sale", "sale.party"})
    Optional<Dispatch> findByDispatchNumber(String dispatchNumber);
}

