package com.futaneagro.repository;

import com.futaneagro.entity.RawMaterial;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface RawMaterialRepository extends JpaRepository<RawMaterial, String> {
    @EntityGraph(attributePaths = {"vendor"})
    List<RawMaterial> findAll();

    @Query("SELECT COALESCE(SUM(r.weight), 0) FROM RawMaterial r")
    BigDecimal sumTotalWeight();

    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM RawMaterial r")
    BigDecimal sumTotalAmount();
}

