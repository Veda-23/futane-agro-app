package com.futaneagro.repository;

import com.futaneagro.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * <h1>RolePermission Repository (Dynamic RBAC Access Control Matrix)</h1>
 * <p>
 * Spring Data JPA repository for the {@link RolePermission} entity.
 * Provides granular permissions lookup by user role (e.g. {@code ADMIN}, {@code MANAGER}, {@code OPERATOR})
 * and module key (e.g. {@code SALES}, {@code PRODUCTION}, {@code FINANCE}) to enforce zero-trust endpoint access.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, String> {
    List<RolePermission> findByRole(String role);
    Optional<RolePermission> findByRoleAndModuleKey(String role, String moduleKey);
}
