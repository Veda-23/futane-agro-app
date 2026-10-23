package com.futaneagro.repository;

import com.futaneagro.entity.StockTransfer;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * <h1>StockTransfer Repository (Inter-Branch Inventory Movements)</h1>
 * <p>
 * Spring Data JPA repository for the {@link StockTransfer} entity.
 * Employs {@code @EntityGraph(attributePaths = {"sourceBranch", "destinationBranch"})}
 * to eagerly fetch originating and destination facilities in a single database roundtrip.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface StockTransferRepository extends JpaRepository<StockTransfer, String> {
    @EntityGraph(attributePaths = {"sourceBranch", "destinationBranch"})
    List<StockTransfer> findAll();
}
