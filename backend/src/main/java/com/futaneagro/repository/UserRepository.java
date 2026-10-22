package com.futaneagro.repository;

import com.futaneagro.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * <h1>User Repository (Core Security & Authentication Queries)</h1>
 * <p>
 * Spring Data JPA repository for the {@link User} entity.
 * Provides case-insensitive lookup methods by username and email to prevent case-sensitive authentication vulnerabilities.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface UserRepository extends JpaRepository<User, String> {
    java.util.Optional<User> findByUsernameIgnoreCase(String username);
    java.util.Optional<User> findByEmailIgnoreCase(String email);
}

