package com.futaneagro.repository;

import com.futaneagro.entity.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * <h1>ApiKey Repository (B2B Public & Machine-to-Machine Integration Keys)</h1>
 * <p>
 * Spring Data JPA repository for the {@link ApiKey} entity.
 * Provides lookups by cryptographic API key hash for third-party B2B storefront integration,
 * webhook authentication, and developer programmatic access.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, String> {
    Optional<ApiKey> findByApiKey(String apiKey);
    List<ApiKey> findAllByOrderByCreatedAtDesc();
}
