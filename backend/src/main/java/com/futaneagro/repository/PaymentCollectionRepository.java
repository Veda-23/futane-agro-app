package com.futaneagro.repository;

import com.futaneagro.entity.PaymentCollection;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentCollectionRepository extends JpaRepository<PaymentCollection, String> {
    @EntityGraph(attributePaths = {"party"})
    List<PaymentCollection> findAll();
}

