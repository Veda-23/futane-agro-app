package com.futaneagro.repository;

import com.futaneagro.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.Query;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Integer> {
    Optional<Inventory> findByCrateTypeAndMaterialType(String crateType, String materialType);

    @Query("SELECT COALESCE(SUM(i.currentStock), 0) FROM Inventory i WHERE i.isDeleted = false")
    Integer sumTotalStock();
}
