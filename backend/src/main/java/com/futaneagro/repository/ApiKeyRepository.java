package com.futaneagro.repository;

import com.futaneagro.entity.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, String> {
    Optional<ApiKey> findByApiKey(String apiKey);
    List<ApiKey> findAllByOrderByCreatedAtDesc();
}
