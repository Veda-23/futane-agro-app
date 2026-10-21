package com.futaneagro.repository;

import com.futaneagro.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, String> {
    Optional<Inventory> findByCrateTypeAndMaterialType(String crateType, String materialType);

    @Query("SELECT COALESCE(SUM(i.currentStock), 0) FROM Inventory i")
    Integer sumCurrentStock();
}

