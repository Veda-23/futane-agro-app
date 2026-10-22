package com.futaneagro.repository;

import com.futaneagro.entity.RawMaterial;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

/**
 * <h1>RawMaterial Repository (Polymer Granules Procurement & Stock Valuation)</h1>
 * <p>
 * Spring Data JPA repository for the {@link RawMaterial} entity.
 * Uses {@code @EntityGraph(attributePaths = {"vendor"})} to prevent N+1 supplier queries,
 * and provides sum queries for aggregate inward weight ({@link #sumTotalWeight()})
 * and procurement expenditure ({@link #sumTotalAmount()}).
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface RawMaterialRepository extends JpaRepository<RawMaterial, String> {
    @EntityGraph(attributePaths = {"vendor"})
    List<RawMaterial> findAll();

    @Query("SELECT COALESCE(SUM(r.weight), 0) FROM RawMaterial r")
    BigDecimal sumTotalWeight();

    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM RawMaterial r")
    BigDecimal sumTotalAmount();
}

