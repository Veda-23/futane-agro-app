package com.futaneagro.repository;

import com.futaneagro.entity.PaymentCollection;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * <h1>PaymentCollection Repository (Accounts Receivable Settlement Ledger)</h1>
 * <p>
 * Spring Data JPA repository for the {@link PaymentCollection} entity.
 * Uses {@code @EntityGraph(attributePaths = {"party"})} to fetch wholesale client details in a single query,
 * preventing N+1 overhead during receipt generation, reconciliation, and ledger balance adjustments.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface PaymentCollectionRepository extends JpaRepository<PaymentCollection, String> {
    @EntityGraph(attributePaths = {"party"})
    List<PaymentCollection> findAll();
}

