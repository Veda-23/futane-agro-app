package com.futaneagro.repository;

import com.futaneagro.entity.FeatureFlag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * <h1>FeatureFlag Repository (Enterprise Feature Gateways & Capability Toggles)</h1>
 * <p>
 * Spring Data JPA repository for the {@link FeatureFlag} entity.
 * Provides query methods for module key lookups enabling selective activation of enterprise capabilities
 * like multi-branch transfers, thermal printing, and AI copilot insights.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface FeatureFlagRepository extends JpaRepository<FeatureFlag, String> {
    Optional<FeatureFlag> findByModuleKey(String moduleKey);
}
