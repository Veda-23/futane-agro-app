package com.futaneagro.repository;

import com.futaneagro.entity.MfaUsedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * <h1>MfaUsedToken Repository (Replay Attack Prevention & Token Invalidation)</h1>
 * <p>
 * Spring Data JPA repository for the {@link MfaUsedToken} entity.
 * Provides lookups and existence verification by cryptographic token hash to prevent replay attacks,
 * alongside TTL-based batch cleanup via {@link #deleteExpiredTokens(LocalDateTime)}.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface MfaUsedTokenRepository extends JpaRepository<MfaUsedToken, String> {

    Optional<MfaUsedToken> findByTokenHash(String tokenHash);

    boolean existsByTokenHash(String tokenHash);

    @Modifying
    @Query("DELETE FROM MfaUsedToken t WHERE t.expiresAt < :now")
    int deleteExpiredTokens(@Param("now") LocalDateTime now);
}
