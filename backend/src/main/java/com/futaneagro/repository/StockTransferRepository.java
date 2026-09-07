package com.futaneagro.repository;

import com.futaneagro.entity.StockTransfer;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockTransferRepository extends JpaRepository<StockTransfer, String> {
    @EntityGraph(attributePaths = {"sourceBranch", "targetBranch"})
    List<StockTransfer> findAll();
}
