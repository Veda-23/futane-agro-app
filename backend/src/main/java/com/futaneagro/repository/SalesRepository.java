package com.futaneagro.repository;

import com.futaneagro.entity.Sales;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.Query;

@Repository
public interface SalesRepository extends JpaRepository<Sales, Integer> {
    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sales s WHERE s.isDeleted = false")
    BigDecimal sumTotalSales();

    @Query("SELECT COALESCE(SUM(s.remaining), 0) FROM Sales s WHERE s.isDeleted = false")
    BigDecimal sumTotalPendingAmount();
}
