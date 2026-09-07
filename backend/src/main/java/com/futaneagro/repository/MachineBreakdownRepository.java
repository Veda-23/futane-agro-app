package com.futaneagro.repository;

import com.futaneagro.entity.MachineBreakdown;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MachineBreakdownRepository extends JpaRepository<MachineBreakdown, String> {
    @EntityGraph(attributePaths = {"machine"})
    List<MachineBreakdown> findAll();
}

