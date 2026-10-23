package com.futaneagro.repository;

import com.futaneagro.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * <h1>Expense Repository (Operational Overhead Cost Ledger)</h1>
 * <p>
 * Spring Data JPA repository for the {@link Expense} entity.
 * Supports factory operational expense tracking, category filtering, and monthly expenditure audits.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface ExpenseRepository extends JpaRepository<Expense, String> {
}

