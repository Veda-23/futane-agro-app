package com.futaneagro.repository;

import com.futaneagro.entity.RawMaterial;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RawMaterialRepository extends JpaRepository<RawMaterial, String> {
    @EntityGraph(attributePaths = {"vendor"})
    List<RawMaterial> findAll();
}

