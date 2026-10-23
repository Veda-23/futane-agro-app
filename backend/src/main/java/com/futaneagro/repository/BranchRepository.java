package com.futaneagro.repository;

import com.futaneagro.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * <h1>Branch Repository (Factory Depots & Multi-Branch Nodes)</h1>
 * <p>
 * Spring Data JPA repository for the {@link Branch} entity.
 * Supports multi-location enterprise inventory management, branch-level sales attribution,
 * and stock transfer routing across manufacturing sites.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface BranchRepository extends JpaRepository<Branch, String> {
}
