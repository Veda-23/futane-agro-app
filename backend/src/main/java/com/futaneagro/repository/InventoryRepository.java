package com.futaneagro.repository;

import com.futaneagro.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * <h1>Inventory Repository (Finished Crate Stock Management)</h1>
 * <p>
 * Spring Data JPA repository for the {@link Inventory} entity.
 * Provides exact matching by crate model and plastic material grade,
 * as well as real-time warehouse current stock summation via {@link #sumCurrentStock()}.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface InventoryRepository extends JpaRepository<Inventory, String> {
    Optional<Inventory> findByCrateTypeAndMaterialType(String crateType, String materialType);

    @Query("SELECT COALESCE(SUM(i.currentStock), 0) FROM Inventory i")
    Integer sumCurrentStock();
}

