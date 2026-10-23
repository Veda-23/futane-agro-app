package com.futaneagro.repository;

import com.futaneagro.entity.BankTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * <h1>BankTransaction Repository (Financial Reconciliation & Cash Flow Ledger)</h1>
 * <p>
 * Spring Data JPA repository for the {@link BankTransaction} entity.
 * Supports treasury reconciliation, automated inward/outward fund matching,
 * and bank statement synchronization for enterprise auditing.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface BankTransactionRepository extends JpaRepository<BankTransaction, String> {
}

