package com.futaneagro.repository;

import com.futaneagro.entity.Sales;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * <h1>Sales Repository</h1>
 * <p>
 * Spring Data JPA repository for the {@link Sales} entity.
 * Provides optimized queries, aggregate totals, and {@code @EntityGraph} fetching to eliminate N+1 query overhead.
 * </p>
 *
 * <h3>Query Strategies:</h3>
 * <ul>
 *   <li><b>N+1 Prevention:</b> {@link #findAll()} and {@link #findBySaleId(Integer)} utilize
 *       {@code @EntityGraph(attributePaths = {"party"})} to fetch customer records in a single SQL join.</li>
 *   <li><b>Aggregate Analytics:</b> Computes total turnover ({@link #sumTotalAmount()}) and outstanding receivables
 *       ({@link #sumRemainingAmount()}) with {@code COALESCE} to protect against NULLs on fresh databases.</li>
 * </ul>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface SalesRepository extends JpaRepository<Sales, String> {
    @EntityGraph(attributePaths = {"party"})
    List<Sales> findAll();

    @EntityGraph(attributePaths = {"party"})
    Optional<Sales> findBySaleId(Integer saleId);

    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sales s")
    BigDecimal sumTotalAmount();

    @Query("SELECT COALESCE(SUM(s.remaining), 0) FROM Sales s")
    BigDecimal sumRemainingAmount();
}
