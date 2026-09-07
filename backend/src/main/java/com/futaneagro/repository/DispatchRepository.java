package com.futaneagro.repository;

import com.futaneagro.entity.Dispatch;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DispatchRepository extends JpaRepository<Dispatch, String> {
    @EntityGraph(attributePaths = {"sale", "sale.party"})
    List<Dispatch> findAll();

    @EntityGraph(attributePaths = {"sale", "sale.party"})
    Optional<Dispatch> findByDispatchNumber(String dispatchNumber);
}

