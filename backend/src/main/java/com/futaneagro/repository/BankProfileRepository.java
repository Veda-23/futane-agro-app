package com.futaneagro.repository;

import com.futaneagro.entity.BankProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BankProfileRepository extends JpaRepository<BankProfile, String> {
    List<BankProfile> findByIsActiveTrueOrderByIsPrimaryDescBankNameAsc();
    List<BankProfile> findByCompanyIdAndIsActiveTrue(String companyId);
    Optional<BankProfile> findByIsPrimaryTrue();
}
