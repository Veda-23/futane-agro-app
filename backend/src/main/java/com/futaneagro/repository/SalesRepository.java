package com.futaneagro.repository;

import com.futaneagro.entity.Sales;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface SalesRepository extends JpaRepository<Sales, String> {
    @EntityGraph(attributePaths = {"party"})
    List<Sales> findAll();

    @EntityGraph(attributePaths = {"party"})
    Optional<Sales> findBySaleId(Integer saleId);

    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sales s")
    BigDecimal sumTotalAmount();

    @Query("SELECT COALESCE(SUM(s.remaining), 0) FROM Sales s")
    BigDecimal sumRemainingAmount();
}
