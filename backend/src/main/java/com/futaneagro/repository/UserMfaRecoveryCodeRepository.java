package com.futaneagro.repository;

import com.futaneagro.entity.UserMfaRecoveryCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * <h1>UserMfaRecoveryCode Repository (Offline Multi-Factor Emergency Codes)</h1>
 * <p>
 * Spring Data JPA repository for the {@link UserMfaRecoveryCode} entity.
 * Provides query methods for counting and retrieving unused cryptographic recovery codes,
 * as well as atomic batch purging during MFA re-enrollment.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface UserMfaRecoveryCodeRepository extends JpaRepository<UserMfaRecoveryCode, String> {

    List<UserMfaRecoveryCode> findByUserIdAndUsedFalse(String userId);

    long countByUserIdAndUsedFalse(String userId);

    @Modifying
    @Query("DELETE FROM UserMfaRecoveryCode r WHERE r.userId = :userId")
    void deleteByUserId(@Param("userId") String userId);
}
