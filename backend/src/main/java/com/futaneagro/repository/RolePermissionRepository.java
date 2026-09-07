package com.futaneagro.repository;

import com.futaneagro.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, String> {
    List<RolePermission> findByRole(String role);
    Optional<RolePermission> findByRoleAndModuleKey(String role, String moduleKey);
}
