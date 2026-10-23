package com.futaneagro.repository;

import com.futaneagro.entity.Settings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * <h1>Settings Repository (Key-Value System Configuration & Feature Flags)</h1>
 * <p>
 * Spring Data JPA repository for the {@link Settings} entity.
 * Provides query methods for retrieving dynamic system-wide configuration parameters by unique config key.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface SettingsRepository extends JpaRepository<Settings, String> {
    Optional<Settings> findByConfigKey(String configKey);
}

