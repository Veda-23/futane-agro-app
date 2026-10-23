package com.futaneagro.repository;

import com.futaneagro.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * <h1>Team Repository (Departmental Groupings & Dynamic Navigation Order)</h1>
 * <p>
 * Spring Data JPA repository for the {@link Team} entity.
 * Provides query methods for department lookups by team code and ordered sidebar navigation menus.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface TeamRepository extends JpaRepository<Team, String> {
    Optional<Team> findByCode(String code);
    List<Team> findAllByOrderBySidebarOrderAsc();
}
