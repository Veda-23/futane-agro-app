package com.futaneagro.repository;

import com.futaneagro.entity.Sales;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SalesRepository extends JpaRepository<Sales, String> {
    Optional<Sales> findBySaleId(Integer saleId);
}
