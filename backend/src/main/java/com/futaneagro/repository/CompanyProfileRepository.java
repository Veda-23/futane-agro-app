package com.futaneagro.repository;

import com.futaneagro.entity.CompanyProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * <h1>CompanyProfile Repository (Corporate Entity Master & GSTIN Identification)</h1>
 * <p>
 * Spring Data JPA repository for the {@link CompanyProfile} entity.
 * Provides lookup methods for active registered manufacturing and corporate entities,
 * retrieving the default operating entity for billing headers, letterheads, and tax filings.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface CompanyProfileRepository extends JpaRepository<CompanyProfile, String> {
    List<CompanyProfile> findByIsActiveTrueOrderByIsDefaultDescCompanyNameAsc();
    Optional<CompanyProfile> findByIsDefaultTrue();
}
