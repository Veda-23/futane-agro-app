package com.futaneagro.repository;

import com.futaneagro.entity.Transport;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

/**
 * <h1>Transport Repository (Freight Movements & Logistics Fleet)</h1>
 * <p>
 * Spring Data JPA repository for the {@link Transport} entity.
 * Uses {@code @EntityGraph(attributePaths = {"driver"})} to eagerly load driver contacts,
 * and provides sum queries for aggregate freight rental liabilities via {@link #sumTotalRent()}.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface TransportRepository extends JpaRepository<Transport, String> {
    @EntityGraph(attributePaths = {"driver"})
    List<Transport> findAll();

    @Query("SELECT COALESCE(SUM(t.rent), 0) FROM Transport t")
    BigDecimal sumTotalRent();
}

