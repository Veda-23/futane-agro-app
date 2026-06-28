package com.futaneagro.repository;

import com.futaneagro.entity.RawMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.Query;

@Repository
public interface RawMaterialRepository extends JpaRepository<RawMaterial, Integer> {
    @Query("SELECT COALESCE(SUM(r.weight), 0) FROM RawMaterial r WHERE r.isDeleted = false")
    BigDecimal sumTotalWeight();

    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM RawMaterial r WHERE r.isDeleted = false")
    BigDecimal sumTotalAmount();
}
