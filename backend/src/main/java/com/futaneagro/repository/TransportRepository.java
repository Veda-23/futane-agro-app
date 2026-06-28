package com.futaneagro.repository;

import com.futaneagro.entity.Transport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import org.springframework.data.jpa.repository.Query;

@Repository
public interface TransportRepository extends JpaRepository<Transport, Integer> {
    @Query("SELECT COALESCE(SUM(t.rent), 0) FROM Transport t WHERE t.isDeleted = false")
    BigDecimal sumTotalRent();
}
