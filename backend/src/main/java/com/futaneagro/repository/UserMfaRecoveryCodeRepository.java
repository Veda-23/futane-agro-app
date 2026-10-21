package com.futaneagro.repository;

import com.futaneagro.entity.UserMfaRecoveryCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserMfaRecoveryCodeRepository extends JpaRepository<UserMfaRecoveryCode, String> {

    List<UserMfaRecoveryCode> findByUserIdAndUsedFalse(String userId);

    long countByUserIdAndUsedFalse(String userId);

    @Modifying
    @Query("DELETE FROM UserMfaRecoveryCode r WHERE r.userId = :userId")
    void deleteByUserId(@Param("userId") String userId);
}
