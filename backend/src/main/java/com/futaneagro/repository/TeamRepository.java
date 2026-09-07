package com.futaneagro.repository;

import com.futaneagro.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, String> {
    Optional<Team> findByCode(String code);
    List<Team> findAllByOrderBySidebarOrderAsc();
}
