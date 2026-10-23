package com.futaneagro.repository;

import com.futaneagro.entity.BankProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * <h1>BankProfile Repository (Enterprise Bank Accounts & IFSC Configuration)</h1>
 * <p>
 * Spring Data JPA repository for the {@link BankProfile} entity.
 * Provides query methods for retrieving active company bank accounts, determining primary disbursement
 * accounts for invoice QR generation, and multi-entity account separation.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface BankProfileRepository extends JpaRepository<BankProfile, String> {
    List<BankProfile> findByIsActiveTrueOrderByIsPrimaryDescBankNameAsc();
    List<BankProfile> findByCompanyIdAndIsActiveTrue(String companyId);
    Optional<BankProfile> findByIsPrimaryTrue();
}
